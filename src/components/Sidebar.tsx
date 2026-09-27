import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Clock,
  PhoneCall,
  Award,
  Layers,
  ShieldCheck,
  BarChart3,
  Settings,
  Building,
  X,
} from 'lucide-react';
import { User } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';
import { KMLogo } from './KMLogo';

export type NavTab =
  | 'dashboard'
  | 'pipeline'
  | 'allocations'
  | 'calendar'
  | 'followups'
  | 'communication'
  | 'won-ledger'
  | 'projects'
  | 'team'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const followUps = CRMStorageService.getPendingFollowUps(currentUser);
  const totalReminders = followUps.overdue.length + followUps.today.length;

  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline' as NavTab, label: 'Leads Pipeline', icon: Users },
    { id: 'allocations' as NavTab, label: 'Project Allocations', icon: Layers },
    { id: 'calendar' as NavTab, label: 'Site Visits & Calendar', icon: Calendar },
    {
      id: 'followups' as NavTab,
      label: 'Follow-Up Reminders',
      icon: Clock,
      badge: totalReminders > 0 ? totalReminders : undefined,
      badgeColor: followUps.overdue.length > 0 ? 'bg-rose-600' : 'bg-amber-600',
    },
    { id: 'communication' as NavTab, label: 'Calls & WhatsApp', icon: PhoneCall },
    { id: 'won-ledger' as NavTab, label: 'Won Ledger', icon: Award },
    { id: 'projects' as NavTab, label: 'Projects Inventory', icon: Building2 },
    {
      id: 'team' as NavTab,
      label: 'Team & Roles',
      icon: ShieldCheck,
      adminOnly: true,
    },
    { id: 'reports' as NavTab, label: 'Reports & Analytics', icon: BarChart3 },
    {
      id: 'settings' as NavTab,
      label: 'CRM Settings',
      icon: Settings,
      adminOnly: true,
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-950 text-slate-300 flex flex-col z-50 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <KMLogo size={42} showText={true} />
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current User Role Pill */}
        <div className="px-5 py-3 border-b border-slate-900 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Logged in as:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                currentUser.role === 'owner'
                  ? 'bg-purple-900/80 text-purple-200 border border-purple-700'
                  : currentUser.role === 'admin'
                  ? 'bg-blue-900/80 text-blue-200 border border-blue-700'
                  : currentUser.role === 'closer'
                  ? 'bg-amber-900/80 text-amber-200 border border-amber-700'
                  : currentUser.role === 'telecaller'
                  ? 'bg-teal-900/80 text-teal-200 border border-teal-700'
                  : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs font-semibold text-white truncate mt-1">{currentUser.name}</p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && !isOwnerOrAdmin) return null;
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-900 text-[11px] text-slate-500 text-center">
          <p className="font-medium text-slate-400">KM Real Estate CRM v2.4</p>
          <p className="text-[10px]">Real Data • Zero Mock Dependencies</p>
        </div>
      </aside>
    </>
  );
};
