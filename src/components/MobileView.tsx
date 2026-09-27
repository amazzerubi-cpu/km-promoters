import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  PhoneCall,
  Zap,
  Plus,
  MessageSquare,
  Upload,
  X,
  Building2,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { User, Lead } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';
import { KMLogo } from './KMLogo';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User;
  onOpenNewLead?: () => void;
  onOpenQuickCall?: () => void;
  onOpenWhatsApp?: () => void;
  onScheduleVisit?: () => void;
  onOpenImport?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenNewLead,
  onOpenQuickCall,
  onOpenWhatsApp,
  onScheduleVisit,
  onOpenImport,
}) => {
  const [isQuickSheetOpen, setIsQuickSheetOpen] = useState(false);
  const followUps = CRMStorageService.getPendingFollowUps(currentUser);
  const totalFollowUps = followUps.overdue.length + followUps.today.length;
  const hasOverdue = followUps.overdue.length > 0;

  return (
    <>
      {/* Mobile Quick Action Bottom Sheet */}
      {isQuickSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="flex-1"
            onClick={() => setIsQuickSheetOpen(false)}
          />
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            {/* Sheet Handle & Header */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <KMLogo size={32} />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    Quick Actions Center
                  </h3>
                  <p className="text-[11px] text-slate-500">1-Tap Real Estate Shortcuts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickSheetOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setIsQuickSheetOpen(false);
                  if (onOpenNewLead) onOpenNewLead();
                }}
                className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex items-center gap-3 text-left hover:border-emerald-500 transition active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">+ New Lead</p>
                  <p className="text-[10px] text-emerald-800">Add client entry</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickSheetOpen(false);
                  if (onOpenQuickCall) onOpenQuickCall();
                }}
                className="p-3.5 bg-gradient-to-br from-slate-50 to-emerald-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-left hover:border-emerald-500 transition active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Log Call</p>
                  <p className="text-[10px] text-slate-500">Record outcome</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickSheetOpen(false);
                  if (onOpenWhatsApp) onOpenWhatsApp();
                }}
                className="p-3.5 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl flex items-center gap-3 text-left hover:border-teal-500 transition active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">WhatsApp</p>
                  <p className="text-[10px] text-teal-800">Send template</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickSheetOpen(false);
                  if (onScheduleVisit) onScheduleVisit();
                }}
                className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-center gap-3 text-left hover:border-blue-500 transition active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Site Visit</p>
                  <p className="text-[10px] text-blue-800">Book inspection</p>
                </div>
              </button>
            </div>

            {/* Bottom Row Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsQuickSheetOpen(false);
                  onSelectTab('followups');
                }}
                className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Reminders ({totalFollowUps})
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickSheetOpen(false);
                  if (onOpenImport) onOpenImport();
                }}
                className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5 text-purple-700" />
                Import Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-xl pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl relative transition active:scale-95 ${
            currentTab === 'dashboard' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
          {currentTab === 'dashboard' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
          )}
        </button>

        {/* 2. Pipeline */}
        <button
          type="button"
          onClick={() => onSelectTab('pipeline')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl relative transition active:scale-95 ${
            currentTab === 'pipeline' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Pipeline</span>
          {currentTab === 'pipeline' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
          )}
        </button>

        {/* 3. CENTER RAISED QUICK ACTION BUTTON */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setIsQuickSheetOpen(!isQuickSheetOpen)}
            aria-label="Open Quick Actions"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-500/30 transition transform active:scale-90 ring-4 ring-white"
          >
            <Zap className="w-5 h-5 fill-white text-white drop-shadow-xs" />
          </button>
          <span className="text-[9px] font-bold text-emerald-800 -mt-0.5">Quick</span>
        </div>

        {/* 4. Follow-up Reminders */}
        <button
          type="button"
          onClick={() => onSelectTab('followups')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl relative transition active:scale-95 ${
            currentTab === 'followups' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Clock className="w-5 h-5" />
            {totalFollowUps > 0 && (
              <span
                className={`absolute -top-1 -right-2 px-1 min-w-[15px] h-[15px] rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-xs ${
                  hasOverdue ? 'bg-rose-600 animate-pulse' : 'bg-amber-600'
                }`}
              >
                {totalFollowUps}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Reminders</span>
          {currentTab === 'followups' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
          )}
        </button>

        {/* 5. Calendar / Visits */}
        <button
          type="button"
          onClick={() => onSelectTab('calendar')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl relative transition active:scale-95 ${
            currentTab === 'calendar' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Visits</span>
          {currentTab === 'calendar' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
          )}
        </button>
      </div>
    </>
  );
};
