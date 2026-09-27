import React, { useState } from 'react';
import { X, AlertTriangle, UserCheck, Plus, Check } from 'lucide-react';
import { Lead, PropertyCategory, InterestLevel, LeadPriority, Project, User } from '../../types/crm';
import { CRMStorageService } from '../../services/crmStorage';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (lead: Lead) => void;
  activeProjects: Project[];
  setters: User[];
  closers: User[];
  currentUser: User;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
  activeProjects,
  setters,
  closers,
  currentUser,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [source, setSource] = useState('Direct Walk-in');
  const [propertyType, setPropertyType] = useState<PropertyCategory>('Apartments');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [interestLevel, setInterestLevel] = useState<InterestLevel>('Warm');
  const [priority, setPriority] = useState<LeadPriority>('Medium');
  const [assignedSetterId, setAssignedSetterId] = useState<string>(
    currentUser.role === 'setter' || currentUser.role === 'telecaller'
      ? currentUser.id
      : setters[0]?.id || ''
  );
  const [assignedCloserId, setAssignedCloserId] = useState<string>(
    currentUser.role === 'closer' ? currentUser.id : closers[0]?.id || ''
  );
  const [notes, setNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState('11:00');

  // Duplicate warning states
  const [duplicateWarning, setDuplicateWarning] = useState<Lead | null>(null);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handlePhoneBlur = () => {
    if (phone.trim().length >= 10) {
      const duplicates = CRMStorageService.findDuplicateLeads(phone, email, name);
      if (duplicates.length > 0) {
        setDuplicateWarning(duplicates[0]);
      } else {
        setDuplicateWarning(null);
      }
    }
  };

  const toggleProjectSelection = (projId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  const handleSubmit = (forceCreate = false) => {
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Lead name is required.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Check duplicate if not forced
    if (!forceCreate) {
      const duplicates = CRMStorageService.findDuplicateLeads(phone, email, name);
      if (duplicates.length > 0) {
        setDuplicateWarning(duplicates[0]);
        return;
      }
    }

    const budgetDigits = budget.replace(/[^0-9]/g, '');
    const budgetNum = budgetDigits ? parseInt(budgetDigits, 10) : undefined;

    const leadId = `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Build project allocations if user selected projects
    const allocations = selectedProjectIds.map((pId) => {
      const proj = activeProjects.find((p) => p.id === pId);
      return {
        id: `alloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        leadId,
        projectId: pId,
        projectName: proj?.name || 'Assigned Project',
        propertyCategory: proj?.category || propertyType,
        status: 'Draft' as const,
        assignedSetterId,
        assignedCloserId,
        quotedPrice: budgetNum,
        expectedClosingValue: budgetNum,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const newLead: Lead = {
      id: leadId,
      name: name.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      email: email.trim() || undefined,
      location: location.trim() || undefined,
      budget: budget.trim() || undefined,
      budgetNum,
      source: source || 'Direct Walk-in',
      propertyType,
      interestLevel,
      priority,
      status: 'New',
      assignedSetterId: assignedSetterId || undefined,
      assignedCloserId: assignedCloserId || undefined,
      assignedTelecallerId:
        currentUser.role === 'telecaller'
          ? currentUser.id
          : setters.find((s) => s.id === assignedSetterId && s.role === 'telecaller')?.id,
      notes: notes.trim() || undefined,
      nextFollowUpDate: nextFollowUpDate || undefined,
      nextFollowUpTime: nextFollowUpDate ? nextFollowUpTime : undefined,
      allocations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    CRMStorageService.saveLead(newLead, currentUser);
    onLeadCreated(newLead);
    onClose();
  };

  const handleUpdateExisting = () => {
    if (!duplicateWarning) return;
    const updated = { ...duplicateWarning };
    if (notes.trim()) {
      updated.notes = (updated.notes ? updated.notes + '\n\n' : '') + `[Update]: ${notes.trim()}`;
    }
    if (nextFollowUpDate) {
      updated.nextFollowUpDate = nextFollowUpDate;
      updated.nextFollowUpTime = nextFollowUpTime;
    }
    // Append any newly selected projects
    selectedProjectIds.forEach((pId) => {
      if (!updated.allocations.some((a) => a.projectId === pId)) {
        const proj = activeProjects.find((p) => p.id === pId);
        updated.allocations.push({
          id: `alloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          leadId: updated.id,
          projectId: pId,
          projectName: proj?.name || 'Assigned Project',
          propertyCategory: proj?.category || propertyType,
          status: 'Draft',
          assignedSetterId,
          assignedCloserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    CRMStorageService.saveLead(updated, currentUser);
    onLeadCreated(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Create New Lead</h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              Enter verified client details. No fake default projects assigned.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Lead Detection Alert */}
        {duplicateWarning && (
          <div className="p-4 mx-6 mt-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-amber-800">Existing Lead Detected!</p>
                <p className="mt-0.5">
                  A lead matching this phone/email already exists:{' '}
                  <span className="font-bold underline">{duplicateWarning.name}</span> (Phone:{' '}
                  {duplicateWarning.phone}, Status: {duplicateWarning.status}).
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleUpdateExisting}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Update Existing Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    className="px-3 py-1.5 bg-white border border-amber-400 hover:bg-amber-100 text-amber-900 text-xs font-medium rounded-lg"
                  >
                    Create Duplicate Anyway
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(null)}
                    className="px-3 py-1.5 text-xs text-amber-700 hover:underline"
                  >
                    Review Fields
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-700 text-xs font-medium">
            {validationError}
          </div>
        )}

        {/* Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-slate-700"
        >
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aditi Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Primary Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={handlePhoneBlur}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 2: Alternate Phone & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Alternate Phone
              </label>
              <input
                type="tel"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                placeholder="Optional secondary phone"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 3: Location & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Location / City
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. South Extension / West City"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Budget (INR)
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. ₹95 Lakh or 1.2 Cr"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 4: Lead Source & Property Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                <option value="Direct Walk-in">Direct Walk-in</option>
                <option value="Website Inquiry">Website Inquiry</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Facebook / Instagram">Facebook / Instagram</option>
                <option value="Channel Partner">Channel Partner</option>
                <option value="Referral">Client Referral</option>
                <option value="Billboard / Hoarding">Billboard / Hoarding</option>
                <option value="Cold Call / Database">Cold Call / Database</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Property Category
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
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

          {/* Dynamic Project Selection (Multi-select or None) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Allocate Interested Projects (Optional)
              </label>
              <span className="text-[11px] text-slate-500">
                {selectedProjectIds.length} project(s) chosen
              </span>
            </div>
            {activeProjects.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                No active projects in the database yet. You can create the lead without a project allocation and allocate projects later.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {activeProjects.map((p) => {
                  const isChecked = selectedProjectIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProjectSelection(p.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-normal">
                          {p.category} • {p.availableUnits} units avail.
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 5: Interest Level & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Interest Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Hot', 'Warm', 'Cold'] as InterestLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setInterestLevel(level)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      interestLevel === level
                        ? level === 'Hot'
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : level === 'Warm'
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-slate-500 border-slate-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['High', 'Medium', 'Low'] as LeadPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      priority === p
                        ? p === 'High'
                          ? 'bg-rose-600 border-rose-600 text-white'
                          : p === 'Medium'
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-slate-600 border-slate-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 6: Staff Assignment (Dynamic Dropdowns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Setter / Telecaller
              </label>
              <select
                value={assignedSetterId}
                onChange={(e) => setAssignedSetterId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                <option value="">-- Select Active Setter --</option>
                {setters.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Closer / Sales Exec
              </label>
              <select
                value={assignedCloserId}
                onChange={(e) => setAssignedCloserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                <option value="">-- Select Active Closer --</option>
                {closers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 7: Follow-up Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Follow-Up Time
              </label>
              <input
                type="time"
                value={nextFollowUpTime}
                onChange={(e) => setNextFollowUpTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 8: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Client Requirements & Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefers east-facing unit, looking to close within 3 weeks, requested weekend site visit."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Save Lead Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
