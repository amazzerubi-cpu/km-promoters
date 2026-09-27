import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Phone,
  MessageSquare,
  Calendar,
  Flame,
  UserCheck,
} from 'lucide-react';
import { Lead, User } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';

interface FollowUpRemindersViewProps {
  currentUser: User;
  onLogCall: (lead: Lead) => void;
  onWhatsApp: (lead: Lead) => void;
  onScheduleVisit: (lead: Lead) => void;
}

export const FollowUpRemindersView: React.FC<FollowUpRemindersViewProps> = ({
  currentUser,
  onLogCall,
  onWhatsApp,
  onScheduleVisit,
}) => {
  const followUps = CRMStorageService.getPendingFollowUps(currentUser);
  const [activeQueue, setActiveQueue] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');

  const handleMarkFollowUpDone = (lead: Lead) => {
    // Clear follow up or prompt new
    const updated: Lead = {
      ...lead,
      nextFollowUpDate: undefined,
      nextFollowUpTime: undefined,
    };
    CRMStorageService.saveLead(updated, currentUser);
  };

  const handleReschedule = (lead: Lead, daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const newDate = d.toISOString().split('T')[0];
    const updated: Lead = {
      ...lead,
      nextFollowUpDate: newDate,
      nextFollowUpTime: lead.nextFollowUpTime || '11:00',
    };
    CRMStorageService.saveLead(updated, currentUser);
  };

  const getFilteredLeads = () => {
    if (activeQueue === 'overdue') return followUps.overdue;
    if (activeQueue === 'today') return followUps.today;
    if (activeQueue === 'upcoming') return followUps.upcoming;
    return [...followUps.overdue, ...followUps.today, ...followUps.upcoming];
  };

  const displayLeads = getFilteredLeads();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Follow-Up Reminders Automation</h2>
          <p className="text-xs text-slate-500">
            Never miss pending deals or client callbacks. Role-filtered to your assigned accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            Total Pending: {followUps.overdue.length + followUps.today.length + followUps.upcoming.length}
          </span>
        </div>
      </div>

      {/* Queue Filter Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveQueue('all')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeQueue === 'all'
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <p className="text-xs font-medium">All Follow-Ups</p>
          <p className="text-xl font-black mt-1">
            {followUps.overdue.length + followUps.today.length + followUps.upcoming.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveQueue('overdue')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeQueue === 'overdue'
              ? 'bg-rose-600 border-rose-600 text-white'
              : 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
          }`}
        >
          <p className="text-xs font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Overdue Queue
          </p>
          <p className="text-xl font-black mt-1">{followUps.overdue.length}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveQueue('today')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeQueue === 'today'
              ? 'bg-emerald-700 border-emerald-700 text-white'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
          }`}
        >
          <p className="text-xs font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Due Today
          </p>
          <p className="text-xl font-black mt-1">{followUps.today.length}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveQueue('upcoming')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeQueue === 'upcoming'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'
          }`}
        >
          <p className="text-xs font-medium">Upcoming (Next 7 Days)</p>
          <p className="text-xl font-black mt-1">{followUps.upcoming.length}</p>
        </button>
      </div>

      {/* Follow-up list */}
      {displayLeads.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto shadow-xs my-8">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">All Follow-Ups Cleared!</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are no pending follow-up reminders in this queue right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayLeads.map((lead) => {
            const isOverdue = followUps.overdue.some((x) => x.id === lead.id);
            const isToday = followUps.today.some((x) => x.id === lead.id);

            return (
              <div
                key={lead.id}
                className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  isOverdue
                    ? 'bg-rose-50/50 border-rose-200'
                    : isToday
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Lead Summary */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{lead.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {lead.status}
                    </span>
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold">
                        OVERDUE
                      </span>
                    )}
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                        TODAY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-mono">
                    Phone: {lead.phone} • Budget: {lead.budget || '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Scheduled for: <span className="font-bold text-slate-800">{lead.nextFollowUpDate}</span> at{' '}
                    <span className="font-bold text-slate-800">{lead.nextFollowUpTime || '11:00'}</span>
                    {lead.allocations.length > 0 && (
                      <span className="ml-2 font-semibold text-emerald-800">
                        • Projects: {lead.allocations.map((a) => a.projectName).join(', ')}
                      </span>
                    )}
                  </p>
                  {lead.notes && (
                    <p className="text-[11px] text-slate-500 italic max-w-xl">
                      Last notes: {lead.notes}
                    </p>
                  )}
                </div>

                {/* Quick Action Ribbon */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLogCall(lead)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call & Log
                  </button>

                  <button
                    type="button"
                    onClick={() => onWhatsApp(lead)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => onScheduleVisit(lead)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Site Visit
                  </button>

                  {/* Reschedule Shortcuts */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleReschedule(lead, 1)}
                      className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold"
                    >
                      +1 Day
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReschedule(lead, 3)}
                      className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkFollowUpDone(lead)}
                      className="px-2 py-1 bg-white border border-slate-300 hover:bg-emerald-50 text-emerald-800 rounded-lg font-semibold"
                      title="Mark follow-up done"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
