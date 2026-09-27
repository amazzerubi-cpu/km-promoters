import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  parseSpreadsheet,
  guessColumnMapping,
  validateRows,
  downloadLeadImportTemplate,
  downloadErrorReport,
  ColumnMapping,
  ValidatedRow,
  TEMPLATE_COLUMNS,
} from '../../utils/importer';
import { CRMStorageService } from '../../services/crmStorage';
import { Lead, User } from '../../types/crm';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  currentUser: User;
}

type Step = 'upload' | 'mapping' | 'validate' | 'summary';

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  currentUser,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ name: '', phone: '' });
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    duplicates: number;
    invalid: number;
  }>({ total: 0, imported: 0, duplicates: 0, invalid: 0 });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetAll = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setRawRows([]);
    setValidatedRows([]);
    setErrorMsg('');
  };

  const handleFileUpload = async (uploadedFile: File) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const { headers: detectedHeaders, rows } = await parseSpreadsheet(uploadedFile);
      if (!detectedHeaders || detectedHeaders.length === 0 || rows.length === 0) {
        setErrorMsg('The selected spreadsheet appears to be empty or has no readable headers.');
        setLoading(false);
        return;
      }
      setFile(uploadedFile);
      setHeaders(detectedHeaders);
      setRawRows(rows);

      // Pre-guess best matching columns
      const autoMap = guessColumnMapping(detectedHeaders);
      setMapping(autoMap);
      setStep('mapping');
    } catch (err: any) {
      setErrorMsg(`Failed to parse file: ${err?.message || 'Unsupported format'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessMapping = () => {
    if (!mapping.name || !mapping.phone) {
      setErrorMsg('Please map at least "Lead Name" and "Phone" columns to proceed.');
      return;
    }
    setErrorMsg('');
    const validated = validateRows(rawRows, mapping);
    setValidatedRows(validated);
    setStep('validate');
  };

  const handleConfirmImport = (skipDuplicates = true) => {
    const activeProjects = CRMStorageService.getActiveProjects();
    const rowsToImport = validatedRows.filter((r) => {
      if (!r.isValid) return false;
      if (skipDuplicates && r.isDuplicate) return false;
      return true;
    });

    let successCount = 0;
    const now = new Date().toISOString();

    rowsToImport.forEach((r) => {
      if (!r.leadData || !r.leadData.name || !r.leadData.phone) return;

      const leadId = `lead-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      // If project was specified in Excel, link allocation
      const allocations = [];
      if (r.allocatedProjectName) {
        const matchingProject = activeProjects.find((p) =>
          p.name.toLowerCase().includes(r.allocatedProjectName!.toLowerCase())
        );
        if (matchingProject) {
          allocations.push({
            id: `alloc-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            leadId,
            projectId: matchingProject.id,
            projectName: matchingProject.name,
            propertyCategory: matchingProject.category,
            status: 'Draft' as const,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      const lead: Lead = {
        id: leadId,
        name: r.leadData.name,
        phone: r.leadData.phone,
        alternatePhone: r.leadData.alternatePhone,
        email: r.leadData.email,
        location: r.leadData.location,
        budget: r.leadData.budget,
        budgetNum: r.leadData.budgetNum,
        source: r.leadData.source || 'Excel Import',
        propertyType: r.leadData.propertyType,
        interestLevel: r.leadData.interestLevel || 'Warm',
        priority: r.leadData.priority || 'Medium',
        status: 'New',
        notes: r.leadData.notes,
        nextFollowUpDate: r.leadData.nextFollowUpDate,
        nextFollowUpTime: r.leadData.nextFollowUpTime,
        siteVisitDate: r.leadData.siteVisitDate,
        siteVisitTime: r.leadData.siteVisitTime,
        allocations,
        createdAt: now,
        updatedAt: now,
      };

      CRMStorageService.saveLead(lead, currentUser);
      successCount++;
    });

    const duplicatesCount = validatedRows.filter((r) => r.isDuplicate).length;
    const invalidCount = validatedRows.filter((r) => !r.isValid).length;

    setImportSummary({
      total: validatedRows.length,
      imported: successCount,
      duplicates: duplicatesCount,
      invalid: invalidCount,
    });

    setStep('summary');
    onImportComplete();
  };

  const invalidRowsList = validatedRows.filter((r) => !r.isValid || r.isDuplicate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Import Leads from Excel / CSV</h2>
              <p className="text-xs text-emerald-200">
                Bulk upload client lists with auto-mapping, duplicate detection & error reporting
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetAll();
              onClose();
            }}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                step === 'upload' ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 inline-flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              Upload File
            </span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                step === 'mapping' ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 inline-flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              Map Columns
            </span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                step === 'validate' ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 inline-flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              Validate & Preview
            </span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                step === 'summary' ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 inline-flex items-center justify-center text-[11px] font-bold">
                4
              </span>
              Import Report
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadLeadImportTemplate('xlsx')}
              className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1 hover:underline text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel Template
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Content based on step */}
        <div className="p-6">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 text-emerald-700">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Click or drag and drop your Excel or CSV file
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Accepts .xlsx, .xls, and .csv formats. Duplicate phone numbers will be automatically flagged.
                </p>
                <span className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm">
                  Browse Files
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Standard Template Headers Supported:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_COLUMNS.map((col) => (
                    <span
                      key={col}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-[11px]"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Map Spreadsheet Columns to CRM Lead Fields
                  </h3>
                  <p className="text-xs text-slate-500">
                    File: <span className="font-semibold text-slate-700">{file?.name}</span> ({rawRows.length} rows found)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Upload
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {/* Name */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Lead Name <span className="text-rose-500">* (Required)</span>
                  </label>
                  <select
                    value={mapping.name}
                    onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Choose Column --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Phone / Mobile <span className="text-rose-500">* (Required)</span>
                  </label>
                  <select
                    value={mapping.phone}
                    onChange={(e) => setMapping({ ...mapping, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Choose Column --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alternate Phone */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alternate Phone
                  </label>
                  <select
                    value={mapping.alternatePhone || ''}
                    onChange={(e) => setMapping({ ...mapping, alternatePhone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Unmapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <select
                    value={mapping.email || ''}
                    onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Unmapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                  <select
                    value={mapping.location || ''}
                    onChange={(e) => setMapping({ ...mapping, location: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Unmapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Budget</label>
                  <select
                    value={mapping.budget || ''}
                    onChange={(e) => setMapping({ ...mapping, budget: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Unmapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Interested Project
                  </label>
                  <select
                    value={mapping.project || ''}
                    onChange={(e) => setMapping({ ...mapping, project: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Unmapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={mapping.source || ''}
                    onChange={(e) => setMapping({ ...mapping, source: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Unmapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Remarks</label>
                  <select
                    value={mapping.notes || ''}
                    onChange={(e) => setMapping({ ...mapping, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Unmapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Next Follow Up */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Next Follow-Up</label>
                  <select
                    value={mapping.nextFollowUp || ''}
                    onChange={(e) => setMapping({ ...mapping, nextFollowUp: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- Unmapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleProcessMapping}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  Validate Rows & Preview
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDATE & PREVIEW */}
          {step === 'validate' && (
            <div className="space-y-4">
              {/* Validation Summary Cards */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <p className="text-xl font-bold text-slate-800">{validatedRows.length}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Total Rows</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xl font-bold text-emerald-700">
                    {validatedRows.filter((r) => r.isValid && !r.isDuplicate).length}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-medium">Valid & Ready</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xl font-bold text-amber-700">
                    {validatedRows.filter((r) => r.isDuplicate).length}
                  </p>
                  <p className="text-[11px] text-amber-800 font-medium">Duplicates Flagged</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-xl font-bold text-rose-700">
                    {validatedRows.filter((r) => !r.isValid).length}
                  </p>
                  <p className="text-[11px] text-rose-800 font-medium">Invalid Rows</p>
                </div>
              </div>

              {invalidRowsList.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {invalidRowsList.length} row(s) have errors or duplicate contacts and can be skipped or exported.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadErrorReport(invalidRowsList)}
                    className="px-3 py-1 bg-white border border-amber-400 hover:bg-amber-100 rounded-lg text-amber-900 font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Error Report
                  </button>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[42vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-bold">Row #</th>
                      <th className="p-2.5 font-bold">Lead Name</th>
                      <th className="p-2.5 font-bold">Phone</th>
                      <th className="p-2.5 font-bold">Project</th>
                      <th className="p-2.5 font-bold">Budget</th>
                      <th className="p-2.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validatedRows.slice(0, 30).map((r) => (
                      <tr
                        key={r.rowNumber}
                        className={
                          !r.isValid
                            ? 'bg-rose-50/50'
                            : r.isDuplicate
                            ? 'bg-amber-50/50'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="p-2.5 font-mono text-slate-400">{r.rowNumber}</td>
                        <td className="p-2.5 font-semibold text-slate-800">
                          {r.leadData?.name || '—'}
                        </td>
                        <td className="p-2.5 text-slate-600">{r.leadData?.phone || '—'}</td>
                        <td className="p-2.5 text-slate-600">{r.allocatedProjectName || 'None'}</td>
                        <td className="p-2.5 text-slate-600">{r.leadData?.budget || '—'}</td>
                        <td className="p-2.5">
                          {!r.isValid ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-semibold text-[10px]">
                              Invalid: {r.errors.join(', ')}
                            </span>
                          ) : r.isDuplicate ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[10px]">
                              Duplicate: {r.duplicateReason}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                              Ready to Import
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {validatedRows.length > 30 && (
                <p className="text-[11px] text-slate-500 text-center">
                  Showing first 30 of {validatedRows.length} rows
                </p>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Mapping
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmImport(true)}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm & Import Valid Leads (Skip Duplicates)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY REPORT */}
          {step === 'summary' && (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Lead Import Successful!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your CRM records have been updated with the imported leads.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto text-center">
                <div className="p-3 bg-slate-100 rounded-xl">
                  <p className="text-xl font-bold text-slate-800">{importSummary.total}</p>
                  <p className="text-[10px] text-slate-500">Processed</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xl font-bold text-emerald-700">{importSummary.imported}</p>
                  <p className="text-[10px] text-emerald-800 font-semibold">Imported</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xl font-bold text-amber-700">{importSummary.duplicates}</p>
                  <p className="text-[10px] text-amber-800 font-semibold">Duplicates Skipped</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-xl font-bold text-rose-700">{importSummary.invalid}</p>
                  <p className="text-[10px] text-rose-800 font-semibold">Invalid Skipped</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetAll();
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Close & View Pipeline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
