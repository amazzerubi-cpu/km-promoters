import React, { useState } from 'react';
import {
  Plus,
  Zap,
  Phone,
  MessageSquare,
  Calendar,
  Building2,
  Upload,
  X,
  Search,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { User, Lead } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';

interface QuickActionsSpeedDialProps {
  currentUser: User;
  onOpenNewLead: () => void;
  onOpenImport: () => void;
  onOpenNewProject?: () => void;
  onScheduleVisit: (lead?: Lead) => void;
  onLogCall: (lead: Lead) => void;
  onWhatsApp: (lead: Lead) => void;
}

export const QuickActionsSpeedDial: React.FC<QuickActionsSpeedDialProps> = ({
  currentUser,
  onOpenNewLead,
  onOpenImport,
  onOpenNewProject,
  onScheduleVisit,
  onLogCall,
  onWhatsApp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [leadPickerAction, setLeadPickerAction] = useState<'call' | 'whatsapp' | 'visit' | null>(null);
  const [searchLeadQuery, setSearchLeadQuery] = useState('');

  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';
  const visibleLeads = CRMStorageService.getVisibleLeads(currentUser);

  const filteredPickerLeads = searchLeadQuery.trim()
    ? visibleLeads.filter(
        (l) =>
          l.name.toLowerCase().includes(searchLeadQuery.toLowerCase()) ||
          l.phone.includes(searchLeadQuery) ||
          (l.email && l.email.toLowerCase().includes(searchLeadQuery.toLowerCase()))
      )
    : visibleLeads.slice(0, 15);

  const handleSelectLeadForAction = (lead: Lead) => {
    if (leadPickerAction === 'call') {
      onLogCall(lead);
    } else if (leadPickerAction === 'whatsapp') {
      onWhatsApp(lead);
    } else if (leadPickerAction === 'visit') {
      onScheduleVisit(lead);
    }
    setLeadPickerAction(null);
    setSearchLeadQuery('');
  };

  return (
    <>
      {/* Background Dimmer when open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Speed Dial Container */}
      <div className="fixed right-4 sm:right-6 bottom-20 md:bottom-6 z-40 flex flex-col items-end gap-2.5 select-none">
        {/* Speed Dial Menu Items */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-in slide-in-from-bottom-5 duration-200">
            {/* 1. Add New Lead */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenNewLead();
              }}
              className="flex items-center gap-3 bg-white text-slate-800 hover:bg-emerald-50 px-3.5 py-2.5 rounded-full shadow-lg border border-slate-200 hover:border-emerald-500 transition group"
            >
              <span className="text-xs font-bold group-hover:text-emerald-700">
                + New Client Lead
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <Plus className="w-4 h-4" />
              </div>
            </button>

            {/* 2. Quick Log Call */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setLeadPickerAction('call');
              }}
              className="flex items-center gap-3 bg-white text-slate-800 hover:bg-emerald-50 px-3.5 py-2.5 rounded-full shadow-lg border border-slate-200 hover:border-emerald-500 transition group"
            >
              <span className="text-xs font-bold group-hover:text-emerald-700">
                Quick Log Call
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Phone className="w-4 h-4" />
              </div>
            </button>

            {/* 3. Quick WhatsApp */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setLeadPickerAction('whatsapp');
              }}
              className="flex items-center gap-3 bg-white text-slate-800 hover:bg-emerald-50 px-3.5 py-2.5 rounded-full shadow-lg border border-slate-200 hover:border-emerald-500 transition group"
            >
              <span className="text-xs font-bold group-hover:text-emerald-700">
                Quick WhatsApp
              </span>
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
            </button>

            {/* 4. Schedule Site Visit */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onScheduleVisit();
              }}
              className="flex items-center gap-3 bg-white text-slate-800 hover:bg-blue-50 px-3.5 py-2.5 rounded-full shadow-lg border border-slate-200 hover:border-blue-500 transition group"
            >
              <span className="text-xs font-bold group-hover:text-blue-700">
                Schedule Site Visit
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
            </button>

            {/* 5. Import Leads Spreadsheet */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenImport();
              }}
              className="flex items-center gap-3 bg-white text-slate-800 hover:bg-purple-50 px-3.5 py-2.5 rounded-full shadow-lg border border-slate-200 hover:border-purple-500 transition group"
            >
              <span className="text-xs font-bold group-hover:text-purple-700">
                Import Excel / CSV
              </span>
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Upload className="w-4 h-4" />
              </div>
            </button>

            {/* 6. New Project (Admin / Owner only) */}
            {isOwnerOrAdmin && onOpenNewProject && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenNewProject();
                }}
                className="flex items-center gap-3 bg-white text-slate-800 hover:bg-amber-50 px-3.5 py-2.5 rounded-full shadow-lg border border-slate-200 hover:border-amber-500 transition group"
              >
                <span className="text-xs font-bold group-hover:text-amber-700">
                  + Add Project Inventory
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
              </button>
            )}
          </div>
        )}

        {/* Primary FAB Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Quick Actions Menu"
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform active:scale-95 ${
            isOpen
              ? 'bg-slate-900 rotate-90 ring-4 ring-slate-800/30'
              : 'bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 hover:scale-105 ring-4 ring-emerald-500/20'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform" />
          ) : (
            <div className="flex items-center justify-center relative">
              <Zap className="w-6 h-6 fill-white text-white drop-shadow-xs" />
            </div>
          )}
        </button>
      </div>

      {/* QUICK LEAD PICKER MODAL */}
      {leadPickerAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Quick Action Assistant
                </span>
                <h3 className="text-base font-black flex items-center gap-2">
                  {leadPickerAction === 'call' && <Phone className="w-4 h-4 text-emerald-400" />}
                  {leadPickerAction === 'whatsapp' && <MessageSquare className="w-4 h-4 text-emerald-400" />}
                  {leadPickerAction === 'visit' && <Calendar className="w-4 h-4 text-emerald-400" />}
                  Select Client for {leadPickerAction === 'call' ? 'Call Logging' : leadPickerAction === 'whatsapp' ? 'WhatsApp' : 'Site Visit'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLeadPickerAction(null);
                  setSearchLeadQuery('');
                }}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchLeadQuery}
                  onChange={(e) => setSearchLeadQuery(e.target.value)}
                  placeholder="Search client by name or phone..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
              {filteredPickerLeads.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  {visibleLeads.length === 0 ? (
                    <div>
                      <p className="font-semibold text-slate-700">No leads available in CRM yet.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setLeadPickerAction(null);
                          onOpenNewLead();
                        }}
                        className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        + Create A Lead First
                      </button>
                    </div>
                  ) : (
                    'No client leads matching your query.'
                  )}
                </div>
              ) : (
                filteredPickerLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLeadForAction(lead)}
                    className="p-3 hover:bg-emerald-50 rounded-xl cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                        {lead.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {lead.phone} • {lead.propertyType || 'General'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                        {lead.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => {
                  setLeadPickerAction(null);
                  setSearchLeadQuery('');
                }}
                className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
