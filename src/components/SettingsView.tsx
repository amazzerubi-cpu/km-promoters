import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  MessageSquare,
  FileSpreadsheet,
  Download,
  Trash2,
  RefreshCw,
  Plus,
  Save,
  Check,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { WhatsAppTemplate, User } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';
import { downloadLeadImportTemplate } from '../utils/importer';

interface SettingsViewProps {
  currentUser: User;
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onRefreshAll,
}) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(
    CRMStorageService.getWhatsAppTemplates()
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdateTemplate = (id: string, text: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, template: text } : t))
    );
  };

  const handleSaveTemplates = () => {
    CRMStorageService.saveWhatsAppTemplates(templates);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetToEmpty = () => {
    if (
      window.confirm(
        'WARNING: This will remove all leads, projects, site visits, call logs and won deals. The CRM will start fresh with zero data. Are you sure?'
      )
    ) {
      CRMStorageService.resetToEmptyCRM();
      onRefreshAll();
      alert('CRM has been reset to an empty state with zero records.');
    }
  };

  const handleSeedCleanSample = () => {
    if (
      window.confirm(
        'Load clean sample projects into the workspace? This helps demonstrate inventory tracking.'
      )
    ) {
      CRMStorageService.seedSampleWorkspace();
      onRefreshAll();
      alert('Clean real estate properties have been loaded into Projects Inventory.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">CRM Configuration & Settings</h2>
          <p className="text-xs text-slate-500">
            Agency communication templates, lead import specifications, and database utilities
          </p>
        </div>
      </div>

      {/* WhatsApp Message Templates */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              WhatsApp Message Automation Templates
            </h3>
            <p className="text-xs text-slate-500">
              Customize dynamic client notification templates. Variables supported:{' '}
              <code className="text-emerald-700 font-mono text-[11px]">
                {`{{LeadName}}, {{ProjectName}}, {{SiteVisitDate}}, {{SiteVisitTime}}, {{EmployeeName}}, {{Location}}`}
              </code>
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveTemplates}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedSuccess ? 'Saved!' : 'Save Templates'}
          </button>
        </div>

        <div className="space-y-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-xs text-slate-800">{tpl.title}</span>
              <textarea
                rows={3}
                value={tpl.template}
                onChange={(e) => handleUpdateTemplate(tpl.id, e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Import & Export Templates */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Lead Spreadsheet Import Templates
          </h3>
          <p className="text-xs text-slate-500">
            Download our standard formatted spreadsheet template with all verified CRM columns
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadLeadImportTemplate('xlsx')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            Download Excel (.XLSX) Template
          </button>

          <button
            type="button"
            onClick={() => downloadLeadImportTemplate('csv')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            Download CSV (.CSV) Template
          </button>
        </div>
      </div>

      {/* Database Management & Testing Utilities */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Database & Data Operations
          </h3>
          <p className="text-xs text-slate-500">
            Control persistent local storage and reset to empty state whenever required
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetToEmpty}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            Reset to Empty CRM (Zero Records)
          </button>

          <button
            type="button"
            onClick={handleSeedCleanSample}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Load Sample Real Estate Projects (Optional Preview)
          </button>
        </div>
      </div>
    </div>
  );
};
