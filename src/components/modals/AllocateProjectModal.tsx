import React, { useState } from 'react';
import { X, Building2, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Lead, Project, PropertyCategory, User } from '../../types/crm';
import { CRMStorageService } from '../../services/crmStorage';

interface AllocateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onAllocated: () => void;
  activeProjects: Project[];
  setters: User[];
  closers: User[];
  currentUser: User;
}

export const AllocateProjectModal: React.FC<AllocateProjectModalProps> = ({
  isOpen,
  onClose,
  lead,
  onAllocated,
  activeProjects,
  setters,
  closers,
  currentUser,
}) => {
  const [projectId, setProjectId] = useState<string>(activeProjects[0]?.id || '');
  const [propertyCategory, setPropertyCategory] = useState<PropertyCategory>('Apartments');
  const [unitPlotNumber, setUnitPlotNumber] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [expectedClosingValue, setExpectedClosingValue] = useState('');
  const [status, setStatus] = useState<
    'Draft' | 'Site Visit Done' | 'Negotiation' | 'Token Paid' | 'Booked' | 'Won' | 'Lost' | 'Cancelled'
  >('Draft');
  const [assignedCloserId, setAssignedCloserId] = useState<string>(closers[0]?.id || '');
  const [assignedSetterId, setAssignedSetterId] = useState<string>(lead?.assignedSetterId || setters[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !lead) return null;

  const selectedProject = activeProjects.find((p) => p.id === projectId);

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    const proj = activeProjects.find((p) => p.id === id);
    if (proj) {
      setPropertyCategory(proj.category);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!projectId) {
      setErrorMsg('Please select a project to allocate.');
      return;
    }

    const cleanQuoted = quotedPrice.replace(/[^0-9]/g, '');
    const cleanExpected = expectedClosingValue.replace(/[^0-9]/g, '');

    const result = CRMStorageService.addLeadAllocation(
      lead.id,
      {
        projectId,
        propertyCategory,
        unitPlotNumber: unitPlotNumber.trim() || undefined,
        quotedPrice: cleanQuoted ? parseInt(cleanQuoted, 10) : undefined,
        expectedClosingValue: cleanExpected ? parseInt(cleanExpected, 10) : undefined,
        status,
        notes: notes.trim() || undefined,
        assignedCloserId: assignedCloserId || undefined,
        assignedSetterId: assignedSetterId || undefined,
      },
      currentUser
    );

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to allocate project.');
      return;
    }

    onAllocated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Allocate Project to Lead</h2>
              <p className="text-xs text-slate-300">
                Lead: <span className="text-emerald-400 font-semibold">{lead.name}</span> ({lead.phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Project Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Active Project <span className="text-rose-500">*</span>
            </label>
            {activeProjects.length === 0 ? (
              <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">
                No active projects found. Please add a project in Projects Inventory first.
              </p>
            ) : (
              <select
                required
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category}) — {p.availableUnits} units available
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Unit / Plot Number & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Unit / Plot / Villa #
              </label>
              <input
                type="text"
                value={unitPlotNumber}
                onChange={(e) => setUnitPlotNumber(e.target.value)}
                placeholder="e.g. Tower B - 1204 / Plot #42"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Property Category
              </label>
              <select
                value={propertyCategory}
                onChange={(e) => setPropertyCategory(e.target.value as PropertyCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Plots">Plots</option>
                <option value="Apartments">Apartments</option>
                <option value="Villas">Villas</option>
                <option value="Farm Land">Farm Land</option>
                <option value="Resale Property">Resale Property</option>
                <option value="Individual House">Individual House</option>
              </select>
            </div>
          </div>

          {/* Quoted Price & Expected Closing Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quoted Price (INR)
              </label>
              <input
                type="text"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder="e.g. 7500000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Expected Closing Value (INR)
              </label>
              <input
                type="text"
                value={expectedClosingValue}
                onChange={(e) => setExpectedClosingValue(e.target.value)}
                placeholder="e.g. 7200000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Allocation Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Allocation Deal Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Draft">Draft (Interested)</option>
                <option value="Site Visit Done">Site Visit Done</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Token Paid">Token Paid</option>
                <option value="Booked">Booked</option>
                <option value="Won">Won (Closed Deal)</option>
                <option value="Lost">Lost</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Closer
              </label>
              <select
                value={assignedCloserId}
                onChange={(e) => setAssignedCloserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">-- Select Closer --</option>
                {closers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Project Specific Requirements / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Client requested corner plot with 40ft road facing."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={activeProjects.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm"
            >
              Allocate Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
