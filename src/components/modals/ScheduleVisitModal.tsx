import React, { useState } from 'react';
import { X, Calendar, Car, Clock, UserCheck } from 'lucide-react';
import { Lead, Project, User, SiteVisit, SiteVisitStatus } from '../../types/crm';
import { CRMStorageService } from '../../services/crmStorage';

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onVisitScheduled: () => void;
  activeProjects: Project[];
  activeUsers: User[];
  currentUser: User;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  isOpen,
  onClose,
  lead: propLead,
  onVisitScheduled,
  activeProjects,
  activeUsers,
  currentUser,
}) => {
  const allLeads = CRMStorageService.getVisibleLeads(currentUser);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(propLead?.id || allLeads[0]?.id || '');
  const [projectId, setProjectId] = useState<string>(activeProjects[0]?.id || '');
  const [date, setDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [time, setTime] = useState<string>('11:00');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>(
    currentUser.id || activeUsers[0]?.id || ''
  );
  const [assignedCloserId, setAssignedCloserId] = useState<string>('');
  const [pickupRequired, setPickupRequired] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [status, setStatus] = useState<SiteVisitStatus>('Scheduled');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentLead = propLead || allLeads.find((l) => l.id === selectedLeadId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentLead) {
      setErrorMsg('Please select or specify a valid client lead.');
      return;
    }

    if (!projectId) {
      setErrorMsg('Please select an active project for the site visit.');
      return;
    }

    const proj = activeProjects.find((p) => p.id === projectId);
    const emp = activeUsers.find((u) => u.id === assignedEmployeeId);
    const closer = activeUsers.find((u) => u.id === assignedCloserId);

    const visit: SiteVisit = {
      id: `visit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      leadId: currentLead.id,
      leadName: currentLead.name,
      leadPhone: currentLead.phone,
      projectId,
      projectName: proj?.name || 'Site Property',
      date,
      time,
      assignedEmployeeId: assignedEmployeeId || currentUser.id,
      assignedEmployeeName: emp?.name || currentUser.name,
      assignedCloserId: assignedCloserId || undefined,
      assignedCloserName: closer?.name,
      pickupRequired,
      pickupLocation: pickupRequired ? pickupLocation.trim() || undefined : undefined,
      driverName: pickupRequired ? driverName.trim() || undefined : undefined,
      driverPhone: pickupRequired ? driverPhone.trim() || undefined : undefined,
      notes: notes.trim() || undefined,
      status,
      createdAt: new Date().toISOString(),
    };

    CRMStorageService.saveSiteVisit(visit, currentUser);
    onVisitScheduled();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">Schedule Property Site Visit</h2>
              <p className="text-xs text-emerald-200">
                Book client physical inspection with logistics & staff assignment
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
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Lead Selection */}
          {!propLead && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Client / Lead <span className="text-rose-500">*</span>
              </label>
              {allLeads.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  No leads exist yet. Please create a lead first before scheduling a site visit.
                </p>
              ) : (
                <select
                  required
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
                >
                  {allLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.phone}) - {l.status}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {propLead && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-500">Client</p>
                <p className="font-bold text-slate-800 text-sm">{propLead.name}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Contact</p>
                <p className="font-mono text-slate-700">{propLead.phone}</p>
              </div>
            </div>
          )}

          {/* Project Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Site / Project <span className="text-rose-500">*</span>
            </label>
            {activeProjects.length === 0 ? (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                No active projects found. Please add a project first.
              </p>
            ) : (
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.location})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Visit Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Visit Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Personnel Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Staff Escort / Setter
              </label>
              <select
                value={assignedEmployeeId}
                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Site Closing Executive
              </label>
              <select
                value={assignedCloserId}
                onChange={(e) => setAssignedCloserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">-- Optional Closer --</option>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pickup Requirement Toggle */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={pickupRequired}
                onChange={(e) => setPickupRequired(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
              />
              <span className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-600" />
                Provide Vehicle Pickup Assistance for Client
              </span>
            </label>

            {pickupRequired && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Client Pickup Address / Landmark
                  </label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g. Metro Station Gate 2 or Client Residence"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Assigned Driver
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Ramesh"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Driver Contact
                    </label>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="Driver phone number"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Visit Instructions / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring brochure for Phase 2; client is accompanied by family."
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
              Confirm Site Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
