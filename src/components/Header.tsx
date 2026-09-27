import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Upload,
  Building,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Clock,
  AlertTriangle,
  Menu,
  X,
  Phone,
} from 'lucide-react';
import { User, Lead, Project } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';
import { KMLogo } from './KMLogo';

interface HeaderProps {
  currentUser: User;
  onOpenNewLead: () => void;
  onOpenImport: () => void;
  onOpenNewProject: () => void;
  onNavigateToFollowUps: () => void;
  onSelectLead?: (lead: Lead) => void;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenNewLead,
  onOpenImport,
  onOpenNewProject,
  onNavigateToFollowUps,
  onSelectLead,
  onLogout,
  onSwitchUser,
  allUsers,
  onToggleMobileMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const followUps = CRMStorageService.getPendingFollowUps(currentUser);
  const totalReminders = followUps.overdue.length + followUps.today.length;

  const leads = CRMStorageService.getVisibleLeads(currentUser);
  const projects = CRMStorageService.getActiveProjects();

  const matchingLeads = searchQuery.trim()
    ? leads.filter(
        (l) =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.phone.includes(searchQuery) ||
          (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const matchingProjects = searchQuery.trim()
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-3 shadow-xs">
      {/* Left: Mobile hamburger & Logo & Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand mark for mobile */}
        <div className="md:hidden flex items-center gap-2 shrink-0 mr-1">
          <KMLogo size={32} />
          <span className="font-extrabold text-xs tracking-tight text-slate-900 hidden xs:inline">
            KM CRM
          </span>
        </div>

        {/* Search Bar (responsive for desktop & expandable for mobile) */}
        <div className={`relative w-full ${isMobileSearchOpen ? 'flex' : 'hidden md:flex'}`}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Search leads by name, phone, or projects..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown */}
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-40 max-h-80 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>Search Results</span>
                <button
                  type="button"
                  onClick={() => setShowSearchResults(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  Close
                </button>
              </div>

              {matchingLeads.length === 0 && matchingProjects.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching leads or projects found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {matchingLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        if (onSelectLead) onSelectLead(lead);
                        setShowSearchResults(false);
                      }}
                      className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{lead.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {lead.phone} • {lead.propertyType || 'General'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {lead.status}
                      </span>
                    </div>
                  ))}

                  {matchingProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs bg-slate-50/50"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="text-[11px] text-slate-500">{p.location}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                        Project
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Follow-ups Alert, and Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          aria-label="Toggle search"
        >
          {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>

        {/* Quick action buttons */}
        <button
          type="button"
          onClick={onOpenNewLead}
          className="px-2.5 sm:px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition flex items-center gap-1.5"
          title="Add New Lead"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Lead</span>
        </button>

        <button
          type="button"
          onClick={onOpenImport}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          title="Import leads from Excel/CSV"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden md:inline">Import Leads</span>
        </button>

        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={onOpenNewProject}
            className="hidden lg:flex px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold items-center gap-1.5 transition"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        )}

        {/* Follow-up Reminders Alert Icon */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition"
            title="Follow-up reminders"
          >
            <Bell className="w-4 h-4" />
            {totalReminders > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {totalReminders}
              </span>
            )}
          </button>

          {/* Reminders dropdown */}
          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Pending Follow-Ups ({totalReminders})
                </span>
                <button
                  type="button"
                  onClick={() => setShowNotificationMenu(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {totalReminders === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No pending follow-ups for today. Great job!
                  </p>
                ) : (
                  <>
                    {followUps.overdue.map((l) => (
                      <div
                        key={l.id}
                        className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-900">{l.name}</span>
                          <span className="text-[10px] text-rose-700 font-semibold">OVERDUE</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Due: {l.nextFollowUpDate} • {l.phone}
                        </p>
                      </div>
                    ))}
                    {followUps.today.map((l) => (
                      <div
                        key={l.id}
                        className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-950">{l.name}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold">TODAY</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Time: {l.nextFollowUpTime || 'Morning'} • {l.phone}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationMenu(false);
                    onNavigateToFollowUps();
                  }}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  View All Follow-Up Reminders →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User profile & Role switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-800 to-teal-700 text-white font-bold text-xs flex items-center justify-center">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                {currentUser.role}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50">
              <div className="p-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  Role: {currentUser.role}
                </span>
              </div>

              {/* Quick switch between staff users for testing RBAC */}
              <div className="p-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Switch Active User (RBAC Test)
                </p>
                <div className="space-y-1">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onSwitchUser(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full p-1.5 text-left rounded-lg text-xs flex items-center justify-between transition ${
                        u.id === currentUser.id
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{u.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-700 uppercase">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full p-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
