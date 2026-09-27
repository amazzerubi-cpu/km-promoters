import React from 'react';
import {
  Users,
  Flame,
  Calendar,
  Clock,
  Briefcase,
  Award,
  Layers,
  TrendingUp,
  Building2,
  Plus,
  Upload,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  PhoneCall,
  MessageSquare,
} from 'lucide-react';
import { User, Lead, Project, WonDeal } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';
import { KMLogo } from './KMLogo';

interface DashboardViewProps {
  currentUser: User;
  onOpenNewLead: () => void;
  onOpenImport: () => void;
  onOpenNewProject: () => void;
  onNavigateTab: (tab: any) => void;
  onScheduleVisit?: (lead?: Lead) => void;
  onLogCall?: (lead: Lead) => void;
  onWhatsApp?: (lead: Lead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onOpenNewLead,
  onOpenImport,
  onOpenNewProject,
  onNavigateTab,
  onScheduleVisit,
  onLogCall,
  onWhatsApp,
}) => {
  const metrics = CRMStorageService.getDashboardMetrics(currentUser);
  const leads = CRMStorageService.getVisibleLeads(currentUser);
  const projects = CRMStorageService.getActiveProjects();
  const wonDeals = CRMStorageService.getWonDeals();
  const followUps = CRMStorageService.getPendingFollowUps(currentUser);
  const activityLogs = CRMStorageService.getActivityLogs();

  const formatCurrency = (val: number) => {
    if (!val || val === 0) return '₹0';
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Compute Project-wise leads distribution
  const projectDistribution: { name: string; count: number; category: string }[] = [];
  projects.forEach((p) => {
    const count = leads.filter((l) =>
      l.allocations.some((a) => a.projectId === p.id)
    ).length;
    projectDistribution.push({ name: p.name, count, category: p.category });
  });

  // Compute Setter/Closer won deals performance
  const staffPerformance = CRMStorageService.getActiveUsers().map((staff) => {
    const dealsClosed = wonDeals.filter(
      (w) => w.closerId === staff.id || w.setterId === staff.id
    ).length;
    const valueClosed = wonDeals
      .filter((w) => w.closerId === staff.id)
      .reduce((sum, w) => sum + w.dealValue, 0);
    const assignedLeadsCount = leads.filter(
      (l) => l.assignedSetterId === staff.id || l.assignedCloserId === staff.id
    ).length;
    return {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      dealsClosed,
      valueClosed,
      assignedLeadsCount,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Logo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5 sm:p-7 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-800/80">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 shrink-0 shadow-md">
            <KMLogo size={52} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                Real Estate Command Center
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">
                • {currentUser.role.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Welcome back, {currentUser.name}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              Live pipeline metrics, multiple property allocations, and automated follow-ups.
              {currentUser.role !== 'owner' && currentUser.role !== 'admin' && (
                <span className="text-emerald-300 ml-1 font-semibold">
                  (Filtered to your assigned leads)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
          <button
            type="button"
            onClick={onOpenNewLead}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add New Lead
          </button>
          <button
            type="button"
            onClick={onOpenImport}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            Import Leads
          </button>
        </div>
      </div>

      {/* QUICK ACTION SHORTCUTS BAR (Touch-friendly & Desktop) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Quick Actions
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            1-Click sales operations & client touchpoints
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5">
          {/* 1. Add Lead */}
          <button
            type="button"
            onClick={onOpenNewLead}
            className="p-2.5 sm:p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-left transition flex items-center gap-2.5 group active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 truncate">
                + New Lead
              </p>
              <p className="text-[10px] text-slate-400 truncate">Create client</p>
            </div>
          </button>

          {/* 2. Pipeline view */}
          <button
            type="button"
            onClick={() => onNavigateTab('pipeline')}
            className="p-2.5 sm:p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-left transition flex items-center gap-2.5 group active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 group-hover:text-blue-800 truncate">
                Sales Pipeline
              </p>
              <p className="text-[10px] text-slate-400 truncate">{leads.length} active leads</p>
            </div>
          </button>

          {/* 3. Schedule Visit */}
          <button
            type="button"
            onClick={() => {
              if (onScheduleVisit) onScheduleVisit();
              else onNavigateTab('calendar');
            }}
            className="p-2.5 sm:p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-left transition flex items-center gap-2.5 group active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 group-hover:text-teal-800 truncate">
                Site Visit
              </p>
              <p className="text-[10px] text-slate-400 truncate">Book inspection</p>
            </div>
          </button>

          {/* 4. Follow-up Reminders */}
          <button
            type="button"
            onClick={() => onNavigateTab('followups')}
            className="p-2.5 sm:p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/60 text-left transition flex items-center gap-2.5 group active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 group-hover:text-amber-800 truncate">
                Reminders
              </p>
              <p className="text-[10px] text-amber-700 font-semibold truncate">
                {followUps.overdue.length > 0
                  ? `${followUps.overdue.length} overdue!`
                  : `${followUps.today.length} due today`}
              </p>
            </div>
          </button>

          {/* 5. Calls & WhatsApp */}
          <button
            type="button"
            onClick={() => onNavigateTab('communication')}
            className="p-2.5 sm:p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-left transition flex items-center gap-2.5 group active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-800 truncate">
                Calls Log
              </p>
              <p className="text-[10px] text-slate-400 truncate">Client history</p>
            </div>
          </button>

          {/* 6. Import Data */}
          <button
            type="button"
            onClick={onOpenImport}
            className="p-2.5 sm:p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/60 text-left transition flex items-center gap-2.5 group active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 group-hover:text-purple-800 truncate">
                Import Excel
              </p>
              <p className="text-[10px] text-slate-400 truncate">Bulk upload</p>
            </div>
          </button>
        </div>
      </div>

      {/* Follow-up Pending Reminder Alert Banner */}
      {(followUps.overdue.length > 0 || followUps.today.length > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                Follow-Up Action Required:{' '}
                {followUps.overdue.length > 0 && (
                  <span className="text-rose-700 underline mr-2">
                    {followUps.overdue.length} Overdue
                  </span>
                )}
                {followUps.today.length > 0 && (
                  <span className="text-emerald-800">
                    {followUps.today.length} Due Today
                  </span>
                )}
              </p>
              <p className="text-xs text-amber-800">
                Pending client follow-up calls or site visits are awaiting action to prevent deal drop-offs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('followups')}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shrink-0"
          >
            View Reminders Queue →
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Leads */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Leads</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-slate-800">
            {metrics.totalLeads > 0 ? metrics.totalLeads : <span className="text-slate-400 text-lg">0</span>}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.newLeads} new inquiries
          </p>
        </div>

        {/* Hot Leads */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Hot Leads</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600">
            {metrics.hotLeads > 0 ? metrics.hotLeads : <span className="text-slate-400 text-lg">0</span>}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.warmLeads} warm prospects
          </p>
        </div>

        {/* Site Visits */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Site Visits</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">
            {metrics.visitsScheduled > 0 ? metrics.visitsScheduled : <span className="text-slate-400 text-lg">0</span>}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.visitsCompleted} completed
          </p>
        </div>

        {/* Active Deals */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Deals</span>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700">
            {metrics.activeDeals > 0 ? metrics.activeDeals : <span className="text-slate-400 text-lg">0</span>}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.bookings} booked/token
          </p>
        </div>

        {/* Pipeline Value */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pipeline Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-800 truncate">
            {metrics.pipelineValue > 0 ? formatCurrency(metrics.pipelineValue) : '₹0'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Estimated closing</p>
        </div>

        {/* Won Revenue */}
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-900 mb-2">
            <span className="text-xs font-bold">Won Revenue</span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-950 truncate">
            {metrics.wonValue > 0 ? formatCurrency(metrics.wonValue) : '₹0'}
          </p>
          <p className="text-[11px] text-emerald-800 font-semibold mt-1">
            {metrics.wonDealsCount} verified deals
          </p>
        </div>
      </div>

      {/* Main Dashboard Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Project Inventory & Pipeline Funnel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Projects & Inventory Health */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Projects & Real-Time Unit Inventory
                </h3>
                <p className="text-xs text-slate-500">
                  Available units update dynamically as deals are won or reserved
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('projects')}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                Manage Projects →
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No Projects Added Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Add your real estate projects (plots, apartments, villas, farm land) to track inventory and allocate deals.
                </p>
                <button
                  type="button"
                  onClick={onOpenNewProject}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-800"
                >
                  + Add First Project
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((proj) => {
                  const percentSold =
                    proj.totalUnits > 0
                      ? Math.min(100, Math.round(((proj.soldUnits || 0) / proj.totalUnits) * 100))
                      : 0;

                  return (
                    <div
                      key={proj.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">{proj.name}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                              {proj.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{proj.location}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-bold text-slate-800">
                            {proj.priceDisplay ||
                              `${formatCurrency(proj.minPrice)} - ${formatCurrency(proj.maxPrice)}`}
                          </p>
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            {proj.availableUnits} units available / {proj.totalUnits} total
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>Sold: {proj.soldUnits} units ({percentSold}%)</span>
                        <span>Available: {proj.availableUnits} units</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real Leads Pipeline Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Lead Pipeline Breakdown</h3>
                <p className="text-xs text-slate-500">Live lead distribution across sales stages</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('pipeline')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Open Full Pipeline →
              </button>
            </div>

            {leads.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No Leads in the Pipeline Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Start by adding client inquiries or upload your existing customer list from an Excel sheet.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenNewLead}
                    className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    + Create Lead
                  </button>
                  <button
                    type="button"
                    onClick={onOpenImport}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Import Excel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'New', count: leads.filter((l) => l.status === 'New').length, color: 'bg-blue-50 text-blue-800 border-blue-200' },
                  { label: 'Contacted', count: leads.filter((l) => l.status === 'Contacted').length, color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
                  { label: 'Site Visits', count: leads.filter((l) => l.status.includes('Site Visit')).length, color: 'bg-amber-50 text-amber-800 border-amber-200' },
                  { label: 'Negotiation', count: leads.filter((l) => l.status === 'Negotiation').length, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                  { label: 'Booked / Token', count: leads.filter((l) => l.status === 'Booked' || l.status === 'Token Pending').length, color: 'bg-teal-50 text-teal-800 border-teal-200' },
                  { label: 'Won (Closed)', count: leads.filter((l) => l.status === 'Won').length, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                  { label: 'Lost', count: leads.filter((l) => l.status === 'Lost' || l.status === 'Not Interested').length, color: 'bg-rose-50 text-rose-800 border-rose-200' },
                  { label: 'Follow-Up', count: leads.filter((l) => l.status === 'Follow-up').length, color: 'bg-slate-100 text-slate-800 border-slate-200' },
                ].map((item) => (
                  <div key={item.label} className={`p-3 rounded-2xl border ${item.color}`}>
                    <p className="text-lg font-black">{item.count}</p>
                    <p className="text-[11px] font-semibold">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Team Performance Leaderboard & Activity Feed */}
        <div className="space-y-6">
          {/* Team Performance Leaderboard */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Team Sales Performance</h3>
            <p className="text-xs text-slate-500 mb-4">Calculated from verified closed deals</p>

            <div className="space-y-3">
              {staffPerformance.map((staff) => (
                <div
                  key={staff.id}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{staff.name}</p>
                    <p className="text-[11px] text-slate-500 capitalize">
                      {staff.role} • {staff.assignedLeadsCount} active leads
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-700">
                      {staff.dealsClosed > 0 ? formatCurrency(staff.valueClosed) : '₹0'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {staff.dealsClosed} deal(s) won
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Recent Activity History</h3>
            <p className="text-xs text-slate-500 mb-4">Real CRM operations audit trail</p>

            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No CRM activity logged yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {activityLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="text-xs pb-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">By {log.userName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
