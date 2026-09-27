import React, { useState } from 'react';
import {
  X,
  Compass,
  ArrowRight,
  Clock,
  User,
  Phone,
  MessageSquare,
  Calendar,
  Layers,
  Flame,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Send,
  Zap,
  Tag,
  Shield,
  Facebook,
  Instagram,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Lead, LeadStatus, User as UserModel, Project, LeadTrackingNote } from '../../types/crm';
import { CRMStorageService } from '../../services/crmStorage';

interface LeadTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  currentUser: UserModel;
  onLogCall: (lead: Lead) => void;
  onWhatsApp: (lead: Lead) => void;
  onScheduleVisit: (lead: Lead) => void;
  onAllocateProject: (lead: Lead) => void;
  onLeadUpdated: () => void;
}

const LIFECYCLE_STEPS: LeadStatus[] = [
  'New',
  'Contacted',
  'Interested',
  'Site Visit Scheduled',
  'Site Visit Completed',
  'Negotiation',
  'Token Pending',
  'Booked',
  'Won',
];

export const LeadTrackerModal: React.FC<LeadTrackerModalProps> = ({
  isOpen,
  onClose,
  lead,
  currentUser,
  onLogCall,
  onWhatsApp,
  onScheduleVisit,
  onAllocateProject,
  onLeadUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'activities' | 'allocations'>('timeline');
  const [noteType, setNoteType] = useState<LeadTrackingNote['noteType']>('Update');
  const [noteText, setNoteText] = useState('');
  const [targetStage, setTargetStage] = useState<LeadStatus | ''>('');
  const [stageNote, setStageNote] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  if (!isOpen || !lead) return null;

  // Retrieve complete tracking data
  const trackingData = CRMStorageService.getLeadTrackingSummary(lead.id);
  const currentLead = CRMStorageService.getLeadById(lead.id) || lead;

  const currentStepIndex = LIFECYCLE_STEPS.indexOf(currentLead.status);

  const handleAdvanceStage = (nextStatus: LeadStatus) => {
    currentLead.status = nextStatus;
    CRMStorageService.saveLead(currentLead, currentUser);
    setIsUpdatingStage(false);
    setTargetStage('');
    setStageNote('');
    onLeadUpdated();
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    CRMStorageService.addLeadTrackingNote(
      currentLead.id,
      {
        userId: currentUser.id,
        userName: currentUser.name,
        noteType,
        content: noteText.trim(),
      },
      currentUser
    );

    setNoteText('');
    onLeadUpdated();
  };

  const isMetaLead = currentLead.source.toLowerCase().includes('meta') ||
    currentLead.source.toLowerCase().includes('facebook') ||
    currentLead.source.toLowerCase().includes('instagram') ||
    Boolean(currentLead.metaCampaignName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-slate-200 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Live Lead Journey Tracker
                </span>
                {isMetaLead && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-600/40 text-blue-200 border border-blue-400/30 flex items-center gap-1">
                    {currentLead.metaPlatform === 'instagram' ? (
                      <Instagram className="w-2.5 h-2.5" />
                    ) : (
                      <Facebook className="w-2.5 h-2.5" />
                    )}
                    Meta Lead Ad
                  </span>
                )}
                {currentLead.interestLevel === 'Hot' && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5" /> HOT
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white">{currentLead.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {currentLead.phone} {currentLead.email ? `• ${currentLead.email}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* Quick Action Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => onLogCall(currentLead)}
              className="p-2.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-2xl text-slate-800 font-bold flex items-center justify-center gap-2 transition shadow-xs group"
            >
              <Phone className="w-4 h-4 text-emerald-600 group-hover:text-white" />
              <span>Log Phone Call</span>
            </button>
            <button
              type="button"
              onClick={() => onWhatsApp(currentLead)}
              className="p-2.5 bg-teal-50 hover:bg-teal-600 hover:text-white rounded-2xl text-teal-900 font-bold flex items-center justify-center gap-2 transition shadow-xs group"
            >
              <MessageSquare className="w-4 h-4 text-teal-600 group-hover:text-white" />
              <span>Send WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => onScheduleVisit(currentLead)}
              className="p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-2xl text-blue-900 font-bold flex items-center justify-center gap-2 transition shadow-xs group"
            >
              <Calendar className="w-4 h-4 text-blue-600 group-hover:text-white" />
              <span>Schedule Site Visit</span>
            </button>
            <button
              type="button"
              onClick={() => onAllocateProject(currentLead)}
              className="p-2.5 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-2xl text-purple-900 font-bold flex items-center justify-center gap-2 transition shadow-xs group"
            >
              <Layers className="w-4 h-4 text-purple-600 group-hover:text-white" />
              <span>Allocate Project</span>
            </button>
          </div>

          {/* Visual Milestone Stepper */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-3xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-700" />
                Sales Pipeline Progress: <span className="text-emerald-700 font-extrabold">{currentLead.status}</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {currentStepIndex >= 0 ? `${currentStepIndex + 1} of ${LIFECYCLE_STEPS.length} Stages` : currentLead.status}
              </span>
            </div>

            {/* Stepper bar */}
            <div className="flex items-center overflow-x-auto pb-2 pt-1 gap-1">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step} className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAdvanceStage(step)}
                      title={`Jump to stage: ${step}`}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-xs scale-105'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 text-[9px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                      )}
                      <span>{step}</span>
                    </button>
                    {idx < LIFECYCLE_STEPS.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Next Stage Advance Button */}
            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Quick Transition:</span>
                {currentStepIndex >= 0 && currentStepIndex < LIFECYCLE_STEPS.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleAdvanceStage(LIFECYCLE_STEPS[currentStepIndex + 1])}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition"
                  >
                    <span>Advance to "{LIFECYCLE_STEPS[currentStepIndex + 1]}"</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {currentLead.status !== 'Won' && (
                  <button
                    type="button"
                    onClick={() => handleAdvanceStage('Won')}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px] transition"
                  >
                    Mark as Won
                  </button>
                )}
                {currentLead.status !== 'Lost' && (
                  <button
                    type="button"
                    onClick={() => handleAdvanceStage('Lost')}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] transition"
                  >
                    Mark as Lost
                  </button>
                )}
              </div>

              <div className="text-[11px] text-slate-500">
                Total Touchpoints: <span className="font-bold text-slate-800">{trackingData.totalTouchpoints}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`pb-2.5 px-4 font-bold transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Stage Progression Timeline</span>
              {currentLead.stageHistory && (
                <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px]">
                  {currentLead.stageHistory.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`pb-2.5 px-4 font-bold transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tracking Notes & Checkpoints</span>
              {currentLead.trackingNotes && (
                <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px]">
                  {currentLead.trackingNotes.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className={`pb-2.5 px-4 font-bold transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'activities'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Calls & Site Visits ({trackingData.callLogs.length + trackingData.siteVisits.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('allocations')}
              className={`pb-2.5 px-4 font-bold transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'allocations'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Project Allocations ({currentLead.allocations.length})</span>
            </button>
          </div>

          {/* TAB 1: STAGE PROGRESSION TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900">Lead Stage Transitions Audit Trail</h4>
                <span className="text-[11px] text-slate-500">
                  Recorded in real-time with verified user attribution
                </span>
              </div>

              {!currentLead.stageHistory || currentLead.stageHistory.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                  No historical stage transitions recorded yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {currentLead.stageHistory.map((sh, idx) => (
                    <div key={sh.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                      <div className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {sh.fromStage} → {sh.toStage}
                            </span>
                            <span className="font-semibold text-slate-700">
                              by {sh.changedByUserName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(sh.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {sh.note && (
                          <p className="text-[11px] text-slate-600 mt-1 italic">{sh.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TRACKING NOTES & CHECKPOINTS */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* New Note Form */}
              <form onSubmit={handleAddNote} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Add Tracking Note / Status Update</span>
                  <div className="flex items-center gap-1.5">
                    {(['Update', 'Client Feedback', 'Inspection', 'Negotiation', 'Loan Status'] as const).map(
                      (type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNoteType(type)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                            noteType === type
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {type}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={`Write ${noteType.toLowerCase()} notes, client sentiment, price counter-offer, or verification updates...`}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-600"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Tracking Note</span>
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-2.5">
                {!currentLead.trackingNotes || currentLead.trackingNotes.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                    No tracking notes added yet. Use the form above to record meeting observations or customer feedback.
                  </div>
                ) : (
                  currentLead.trackingNotes.map((tn) => (
                    <div
                      key={tn.id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200 text-[10px]">
                            {tn.noteType}
                          </span>
                          <span className="font-bold text-slate-800">{tn.userName}</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(tn.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{tn.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CALLS & SITE VISITS AUDIT */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              {/* Call Logs */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-700" />
                  Logged Phone Conversations ({trackingData.callLogs.length})
                </h4>
                {trackingData.callLogs.length === 0 ? (
                  <p className="p-4 bg-slate-50 rounded-xl text-slate-400 italic">No calls logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {trackingData.callLogs.map((c) => (
                      <div key={c.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{c.outcome}</span>
                          <span className="text-[10px] text-slate-400">{new Date(c.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600">{c.notes || 'No call notes entered.'}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Logged by: {c.userName} ({c.durationSeconds}s duration)</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Site Visits */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-700" />
                  Site Visits Record ({trackingData.siteVisits.length})
                </h4>
                {trackingData.siteVisits.length === 0 ? (
                  <p className="p-4 bg-slate-50 rounded-xl text-slate-400 italic">No site visits scheduled or conducted.</p>
                ) : (
                  <div className="space-y-2">
                    {trackingData.siteVisits.map((v) => (
                      <div key={v.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{v.projectName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {v.status}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          Date: <span className="font-semibold text-slate-800">{v.date}</span> at {v.time} • Assigned to: {v.assignedEmployeeName}
                        </p>
                        {v.pickupRequired && (
                          <p className="text-[10px] text-emerald-700 mt-0.5">
                            🚗 Vehicle Pickup requested at: {v.pickupLocation || 'Client Residence'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROJECT ALLOCATIONS */}
          {activeTab === 'allocations' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900">Linked Real Estate Projects</h4>
                <button
                  type="button"
                  onClick={() => onAllocateProject(currentLead)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>+ Allocate Another Property</span>
                </button>
              </div>

              {currentLead.allocations.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                  No property allocated to this lead yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentLead.allocations.map((alloc) => (
                    <div
                      key={alloc.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">{alloc.projectName}</span>
                          <span className="text-[11px] text-slate-500">
                            Category: {alloc.propertyCategory} {alloc.unitPlotNumber ? `• Unit/Plot #${alloc.unitPlotNumber}` : ''}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {alloc.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500">
                          Closer: <span className="font-semibold text-slate-700">{alloc.assignedCloserName || 'Unassigned'}</span>
                        </span>
                        <span className="font-black text-emerald-800 text-xs">
                          {alloc.expectedClosingValue
                            ? `₹${alloc.expectedClosingValue.toLocaleString('en-IN')}`
                            : 'Price not fixed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lead Profile Metadata Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Lead Origin & Attribution</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Lead Source</span>
                <span className="font-bold text-slate-800">{currentLead.source}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Telecaller</span>
                <span className="font-bold text-slate-800">{currentLead.assignedTelecallerName || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Setter</span>
                <span className="font-bold text-slate-800">{currentLead.assignedSetterName || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Closer</span>
                <span className="font-bold text-slate-800">{currentLead.assignedCloserName || 'None'}</span>
              </div>
            </div>

            {currentLead.metaCampaignName && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-blue-800 font-semibold flex items-center gap-1">
                  <Facebook className="w-3.5 h-3.5 text-blue-600" />
                  Campaign: {currentLead.metaCampaignName}
                </span>
                <span className="text-slate-500 font-mono text-[10px]">
                  ID: {currentLead.metaLeadId || 'leadgen_auto'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            KM Real Estate CRM Lead Tracker • Audit verified
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
