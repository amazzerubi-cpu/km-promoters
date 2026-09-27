import React, { useState } from 'react';
import { X, PhoneCall, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Lead, CallOutcome, User } from '../../types/crm';
import { CRMStorageService } from '../../services/crmStorage';

interface LogCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onCallLogged: () => void;
  currentUser: User;
}

const OUTCOMES: CallOutcome[] = [
  'Connected - Interested',
  'Connected - Scheduled Site Visit',
  'Connected - Follow-up Requested',
  'Connected - Not Interested',
  'No Answer / Busy',
  'Switched Off',
  'Wrong Number',
];

export const LogCallModal: React.FC<LogCallModalProps> = ({
  isOpen,
  onClose,
  lead,
  onCallLogged,
  currentUser,
}) => {
  const [outcome, setOutcome] = useState<CallOutcome>('Connected - Interested');
  const [durationMinutes, setDurationMinutes] = useState('3');
  const [notes, setNotes] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    lead.allocations[0]?.projectId || ''
  );
  const [nextFollowUpDate, setNextFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [nextFollowUpTime, setNextFollowUpTime] = useState('11:00');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedAllocation = lead.allocations.find((a) => a.projectId === selectedProjectId);
    const duration = parseInt(durationMinutes, 10) * 60 || 180;

    CRMStorageService.saveCallLog({
      id: `call-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      projectId: selectedProjectId || undefined,
      projectName: selectedAllocation?.projectName,
      userId: currentUser.id,
      userName: currentUser.name,
      durationSeconds: duration,
      outcome,
      notes: notes.trim(),
      nextFollowUpDate: nextFollowUpDate || undefined,
      nextFollowUpTime: nextFollowUpDate ? nextFollowUpTime : undefined,
      timestamp: new Date().toISOString(),
    });

    onCallLogged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <PhoneCall className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">Log Client Interaction / Call</h2>
              <p className="text-xs text-slate-300">
                {lead.name} • <span className="font-mono text-emerald-400">{lead.phone}</span>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Outcome */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Call Outcome <span className="text-rose-500">*</span>
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as CallOutcome)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
            >
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Project Reference (from lead's actual allocations if any) */}
          {lead.allocations.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Discussed Project Allocation
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">General Discussion (No specific allocation)</option>
                {lead.allocations.map((a) => (
                  <option key={a.id} value={a.projectId}>
                    {a.projectName} {a.unitPlotNumber ? `(Unit ${a.unitPlotNumber})` : ''} - {a.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Approximate Duration (Minutes)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Next Follow Up */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Preferred Time
              </label>
              <input
                type="time"
                value={nextFollowUpTime}
                onChange={(e) => setNextFollowUpTime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Call Notes & Client Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Discussed budget constraints. Client interested in site visit on Saturday."
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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
            >
              Save Call Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
