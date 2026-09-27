import React, { useState } from 'react';
import {
  BarChart3,
  Filter,
  TrendingUp,
  Download,
  Users,
  Award,
  Layers,
  Calendar,
  Clock,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Facebook,
  PhoneCall,
  Car,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, Project, PropertyCategory, Lead, WonDeal, SiteVisit, CallLog } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';
import { KMLogo } from './KMLogo';

interface ReportsViewProps {
  currentUser: User;
  activeProjects: Project[];
  activeUsers: User[];
}

export type ReportPeriodMode = 'weekly' | 'monthly' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUser,
  activeProjects,
  activeUsers,
}) => {
  const [periodMode, setPeriodMode] = useState<ReportPeriodMode>('weekly');
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0); // 0 = this week, 1 = last week, etc.
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0); // 0 = this month, 1 = last month, etc.
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Secondary filters
  const [projectFilter, setProjectFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [setterFilter, setSetterFilter] = useState('');
  const [closerFilter, setCloserFilter] = useState('');

  const leads = CRMStorageService.getVisibleLeads(currentUser);
  const wonDeals = CRMStorageService.getVisibleWonDeals(currentUser);
  const siteVisits = CRMStorageService.getVisibleSiteVisits(currentUser);
  const callLogs = CRMStorageService.getVisibleCallLogs(currentUser);

  // Compute date ranges based on period mode
  const now = new Date();

  // Helper to format Date to YYYY-MM-DD
  const toYMD = (d: Date) => d.toISOString().split('T')[0];

  let rangeStartDate = '';
  let rangeEndDate = '';
  let rangeTitle = '';

  if (periodMode === 'weekly') {
    // Current week: Monday to Sunday
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday - selectedWeekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    rangeStartDate = toYMD(monday);
    rangeEndDate = toYMD(sunday);

    if (selectedWeekOffset === 0) {
      rangeTitle = `Current Week (${monday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })})`;
    } else if (selectedWeekOffset === 1) {
      rangeTitle = `Last Week (${monday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })})`;
    } else {
      rangeTitle = `Week of ${monday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  } else if (periodMode === 'monthly') {
    const targetMonthDate = new Date(now.getFullYear(), now.getMonth() - selectedMonthOffset, 1);
    const firstDay = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 1);
    const lastDay = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0);

    rangeStartDate = toYMD(firstDay);
    rangeEndDate = toYMD(lastDay);

    rangeTitle = `${firstDay.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} (Monthly Audit)`;
  } else {
    rangeStartDate = customStartDate || '2026-01-01';
    rangeEndDate = customEndDate || toYMD(now);
    rangeTitle = `Custom Date Range (${rangeStartDate} to ${rangeEndDate})`;
  }

  // Filter leads within date range & criteria
  const periodLeads = leads.filter((lead) => {
    const createdDate = lead.createdAt ? lead.createdAt.split('T')[0] : '';
    if (createdDate && (createdDate < rangeStartDate || createdDate > rangeEndDate)) {
      return false;
    }

    if (projectFilter && !lead.allocations.some((a) => a.projectId === projectFilter)) {
      return false;
    }
    if (categoryFilter && lead.propertyType !== categoryFilter) {
      return false;
    }
    if (sourceFilter && lead.source !== sourceFilter) {
      return false;
    }
    if (setterFilter && lead.assignedSetterId !== setterFilter) {
      return false;
    }
    if (closerFilter && lead.assignedCloserId !== closerFilter) {
      return false;
    }

    return true;
  });

  // Filter site visits in period
  const periodVisits = siteVisits.filter((v) => {
    const vDate = v.date;
    return vDate >= rangeStartDate && vDate <= rangeEndDate;
  });

  // Filter won deals in period
  const periodWonDeals = wonDeals.filter((d) => {
    const cDate = d.closedDate;
    return cDate >= rangeStartDate && cDate <= rangeEndDate;
  });

  // Filter calls in period
  const periodCalls = callLogs.filter((c) => {
    const cDate = c.timestamp ? c.timestamp.split('T')[0] : '';
    return cDate >= rangeStartDate && cDate <= rangeEndDate;
  });

  // KPI Calculations
  const totalLeadsCount = periodLeads.length;
  const metaLeadsCount = periodLeads.filter(
    (l) =>
      l.source.toLowerCase().includes('meta') ||
      l.source.toLowerCase().includes('facebook') ||
      l.source.toLowerCase().includes('instagram') ||
      Boolean(l.metaCampaignName)
  ).length;

  const wonCount = periodLeads.filter((l) => l.status === 'Won').length;
  const bookedCount = periodLeads.filter((l) => l.status === 'Booked' || l.status === 'Token Pending').length;
  const visitsCompletedCount = periodVisits.filter((v) => v.status === 'Completed').length;
  const visitsScheduledCount = periodVisits.length;

  const totalPeriodRevenue = periodWonDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0);

  const conversionRate = totalLeadsCount > 0 ? ((wonCount / totalLeadsCount) * 100).toFixed(1) : '0';

  // Group by Source
  const sourceBreakdown: Record<string, { total: number; won: number }> = {};
  periodLeads.forEach((l) => {
    const src = l.source || 'Direct Inquiry';
    if (!sourceBreakdown[src]) sourceBreakdown[src] = { total: 0, won: 0 };
    sourceBreakdown[src].total += 1;
    if (l.status === 'Won') sourceBreakdown[src].won += 1;
  });

  // Group by Project
  const projectBreakdown: Record<string, { total: number; won: number; value: number }> = {};
  periodLeads.forEach((l) => {
    l.allocations.forEach((a) => {
      const pName = a.projectName || 'Unassigned';
      if (!projectBreakdown[pName]) projectBreakdown[pName] = { total: 0, won: 0, value: 0 };
      projectBreakdown[pName].total += 1;
      if (a.status === 'Won') {
        projectBreakdown[pName].won += 1;
        projectBreakdown[pName].value += a.expectedClosingValue || 0;
      }
    });
  });

  const formatCurrency = (val: number) => {
    if (!val || val === 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // EXPORT WEEKLY REPORT (EXCEL)
  const handleExportWeeklyReport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Weekly Executive Summary
    const summaryData = [
      { Metric: 'Report Name', Value: 'KM Real Estate Weekly Sales Performance Report' },
      { Metric: 'Audit Period', Value: rangeTitle },
      { Metric: 'Date Range', Value: `${rangeStartDate} to ${rangeEndDate}` },
      { Metric: 'Total Leads Generated', Value: totalLeadsCount },
      { Metric: 'Meta Ads (Facebook/Instagram) Inquiries', Value: metaLeadsCount },
      { Metric: 'Phone Calls Logged', Value: periodCalls.length },
      { Metric: 'Site Visits Scheduled', Value: visitsScheduledCount },
      { Metric: 'Site Visits Completed', Value: visitsCompletedCount },
      { Metric: 'Bookings & Tokens Pending', Value: bookedCount },
      { Metric: 'Deals Won (Closed Sales)', Value: wonCount },
      { Metric: 'Total Period Sales Value', Value: formatCurrency(totalPeriodRevenue) },
      { Metric: 'Lead-to-Won Conversion Rate', Value: `${conversionRate}%` },
      { Metric: 'Report Generated At', Value: new Date().toLocaleString() },
      { Metric: 'Generated By', Value: `${currentUser.name} (${currentUser.role})` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Weekly Summary');

    // Sheet 2: Weekly Leads Detailed Roster
    const leadsData = periodLeads.map((l) => ({
      'Lead ID': l.id,
      'Client Name': l.name,
      'Phone Number': l.phone,
      'Email Address': l.email || '',
      'Lead Source': l.source,
      'Meta Campaign': l.metaCampaignName || 'N/A',
      'Meta Form ID': l.metaFormId || 'N/A',
      'Property Type': l.propertyType || '',
      'Budget': l.budget || '',
      'Priority': l.priority,
      'Interest Level': l.interestLevel,
      'Current Stage': l.status,
      'Assigned Telecaller': l.assignedTelecallerName || 'None',
      'Assigned Setter': l.assignedSetterName || 'None',
      'Assigned Closer': l.assignedCloserName || 'None',
      'Allocated Properties': l.allocations.map((a) => `${a.projectName} (${a.status})`).join('; '),
      'Created Date': l.createdAt ? l.createdAt.split('T')[0] : '',
      'Next Follow-Up': l.nextFollowUpDate || 'None',
    }));
    const wsLeads = XLSX.utils.json_to_sheet(leadsData);
    XLSX.utils.book_append_sheet(wb, wsLeads, 'Weekly Leads Roster');

    // Sheet 3: Weekly Site Visits
    const visitsData = periodVisits.map((v) => ({
      'Lead Name': v.leadName,
      'Phone': v.leadPhone,
      'Project': v.projectName,
      'Date': v.date,
      'Time': v.time,
      'Assigned Staff': v.assignedEmployeeName,
      'Visit Status': v.status,
      'Vehicle Pickup': v.pickupRequired ? `Yes (${v.pickupLocation || ''})` : 'No',
    }));
    const wsVisits = XLSX.utils.json_to_sheet(visitsData);
    XLSX.utils.book_append_sheet(wb, wsVisits, 'Site Visits');

    // Sheet 4: Weekly Deals Won
    const wonData = periodWonDeals.map((w) => ({
      'Lead Name': w.leadName,
      'Phone': w.leadPhone,
      'Project': w.projectName,
      'Property Category': w.category,
      'Unit/Plot #': w.unitPlotNumber,
      'Deal Value (₹)': w.dealValue,
      'Closed Date': w.closedDate,
      'Closer': w.closerName,
      'Setter': w.setterName || '',
    }));
    const wsWon = XLSX.utils.json_to_sheet(wonData);
    XLSX.utils.book_append_sheet(wb, wsWon, 'Won Deals Ledger');

    const cleanFilename = `KM_Weekly_Report_${rangeStartDate}_to_${rangeEndDate}.xlsx`;
    XLSX.writeFile(wb, cleanFilename);
  };

  // EXPORT MONTHLY REPORT (EXCEL)
  const handleExportMonthlyReport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Monthly Executive Summary
    const summaryData = [
      { Metric: 'Report Name', Value: 'KM Real Estate Monthly Comprehensive Audit' },
      { Metric: 'Audit Month', Value: rangeTitle },
      { Metric: 'Date Range', Value: `${rangeStartDate} to ${rangeEndDate}` },
      { Metric: 'Total Inquiries Ingested', Value: totalLeadsCount },
      { Metric: 'Meta Ads (Facebook/Instagram) Leads', Value: metaLeadsCount },
      { Metric: 'Meta Lead Share (%)', Value: totalLeadsCount > 0 ? `${((metaLeadsCount / totalLeadsCount) * 100).toFixed(1)}%` : '0%' },
      { Metric: 'Calls Logged', Value: periodCalls.length },
      { Metric: 'Site Visits Conducted', Value: visitsCompletedCount },
      { Metric: 'Closed Won Deals', Value: wonCount },
      { Metric: 'Total Monthly Sales Volume', Value: formatCurrency(totalPeriodRevenue) },
      { Metric: 'Pipeline Conversion Rate', Value: `${conversionRate}%` },
      { Metric: 'Generated By', Value: `${currentUser.name} (${currentUser.role})` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');

    // Sheet 2: Leads Detailed Roster
    const leadsData = periodLeads.map((l) => ({
      'Lead ID': l.id,
      'Client Name': l.name,
      'Phone Number': l.phone,
      'Email': l.email || '',
      'Source': l.source,
      'Meta Campaign': l.metaCampaignName || '',
      'Property Category': l.propertyType || '',
      'Budget': l.budget || '',
      'Status': l.status,
      'Assigned Staff': l.assignedCloserName || l.assignedSetterName || l.assignedTelecallerName || 'Unassigned',
      'Created Date': l.createdAt ? l.createdAt.split('T')[0] : '',
      'Next Follow-Up': l.nextFollowUpDate || '',
    }));
    const wsLeads = XLSX.utils.json_to_sheet(leadsData);
    XLSX.utils.book_append_sheet(wb, wsLeads, 'Monthly Inquiries');

    // Sheet 3: Meta Ads Attribution
    const metaLeads = periodLeads.filter(
      (l) =>
        l.source.toLowerCase().includes('meta') ||
        l.source.toLowerCase().includes('facebook') ||
        l.source.toLowerCase().includes('instagram') ||
        Boolean(l.metaCampaignName)
    );
    const metaData = metaLeads.map((m) => ({
      'Client Name': m.name,
      'Phone': m.phone,
      'Email': m.email || '',
      'Platform': m.metaPlatform || 'facebook',
      'Campaign': m.metaCampaignName || 'Meta Conversion Ads',
      'Property Category': m.propertyType || '',
      'Budget': m.budget || '',
      'Current Stage': m.status,
      'Assigned Telecaller': m.assignedTelecallerName || 'None',
      'Created Date': m.createdAt ? m.createdAt.split('T')[0] : '',
    }));
    const wsMeta = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Meta Ads Attribution');

    // Sheet 4: Project Performance
    const projData = Object.entries(projectBreakdown).map(([pName, stats]) => ({
      'Project Name': pName,
      'Allocations Count': stats.total,
      'Closed Deals Won': stats.won,
      'Total Closed Revenue': stats.value,
      'Formatted Revenue': formatCurrency(stats.value),
    }));
    const wsProj = XLSX.utils.json_to_sheet(projData);
    XLSX.utils.book_append_sheet(wb, wsProj, 'Project Performance');

    const cleanFilename = `KM_Monthly_Report_${rangeStartDate}_to_${rangeEndDate}.xlsx`;
    XLSX.writeFile(wb, cleanFilename);
  };

  // EXPORT CSV
  const handleExportCSV = () => {
    const leadsData = periodLeads.map((l) => ({
      Name: l.name,
      Phone: l.phone,
      Email: l.email || '',
      Source: l.source,
      Stage: l.status,
      Budget: l.budget || '',
      PropertyType: l.propertyType || '',
      Allocations: l.allocations.map((a) => a.projectName).join('; '),
      AssignedStaff: l.assignedCloserName || l.assignedSetterName || l.assignedTelecallerName || '',
      CreatedDate: l.createdAt ? l.createdAt.split('T')[0] : '',
    }));

    const ws = XLSX.utils.json_to_sheet(leadsData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KM_CRM_Export_${periodMode}_${rangeStartDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">CRM Sales Analytics & Reports</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Verified Real-Time Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Export structured weekly and monthly sales audits, Meta ad conversions, and team performance
          </p>
        </div>

        {/* 1-Click Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Weekly Report */}
          <button
            type="button"
            onClick={handleExportWeeklyReport}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
            title="Download formatted multi-tab Weekly Report Excel"
          >
            <Download className="w-4 h-4" />
            <span>Export Weekly Report</span>
          </button>

          {/* Export Monthly Report */}
          <button
            type="button"
            onClick={handleExportMonthlyReport}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
            title="Download comprehensive Monthly Performance Excel"
          >
            <Download className="w-4 h-4" />
            <span>Export Monthly Report</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition flex items-center gap-1"
            title="Export filtered records as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>

          {/* Print / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Brand Header (visible on paper / print only) */}
      <div className="hidden print:flex items-center justify-between pb-4 border-b border-slate-300 mb-6">
        <KMLogo size={48} showText={true} />
        <div className="text-right text-xs">
          <p className="font-bold text-slate-900">Executive Sales & Pipeline Audit Report</p>
          <p className="text-slate-500 font-mono text-[10px]">{rangeTitle}</p>
          <p className="text-slate-400 text-[9px]">Generated on: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Timeframe Scope Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Period Switcher (Weekly vs Monthly vs Custom) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setPeriodMode('weekly');
                setSelectedWeekOffset(0);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodMode === 'weekly'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Report
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodMode('monthly');
                setSelectedMonthOffset(0);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodMode === 'monthly'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Report
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('custom')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodMode === 'custom'
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Sub-selector for Weekly */}
          {periodMode === 'weekly' && (
            <select
              value={selectedWeekOffset}
              onChange={(e) => setSelectedWeekOffset(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value={0}>This Week (Current)</option>
              <option value={1}>Last Week</option>
              <option value={2}>2 Weeks Ago</option>
              <option value={3}>3 Weeks Ago</option>
            </select>
          )}

          {/* Sub-selector for Monthly */}
          {periodMode === 'monthly' && (
            <select
              value={selectedMonthOffset}
              onChange={(e) => setSelectedMonthOffset(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value={0}>This Month (Current)</option>
              <option value={1}>Last Month</option>
              <option value={2}>2 Months Ago</option>
              <option value={3}>3 Months Ago</option>
            </select>
          )}

          {/* Custom Date Inputs */}
          {periodMode === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Selected Period Display Badge */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-black text-slate-800">{rangeTitle}</span>
        </div>
      </div>

      {/* Secondary Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs print:hidden">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
        >
          <option value="">All Projects</option>
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
        >
          <option value="">All Categories</option>
          <option value="Plots">Plots</option>
          <option value="Apartments">Apartments</option>
          <option value="Villas">Villas</option>
          <option value="Farm Land">Farm Land</option>
          <option value="Resale Property">Resale Property</option>
          <option value="Individual House">Individual House</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
        >
          <option value="">All Sources</option>
          <option value="Meta Ads (Facebook)">Meta Ads (Facebook)</option>
          <option value="Meta Ads (Instagram)">Meta Ads (Instagram)</option>
          <option value="Website Direct">Website Direct</option>
          <option value="Referral">Referral</option>
          <option value="Walk-in Client">Walk-in Client</option>
        </select>

        <select
          value={setterFilter}
          onChange={(e) => setSetterFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
        >
          <option value="">All Setters / Telecallers</option>
          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>

        <select
          value={closerFilter}
          onChange={(e) => setCloserFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
        >
          <option value="">All Closers</option>
          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {(projectFilter || categoryFilter || sourceFilter || setterFilter || closerFilter) && (
          <button
            type="button"
            onClick={() => {
              setProjectFilter('');
              setCategoryFilter('');
              setSourceFilter('');
              setSetterFilter('');
              setCloserFilter('');
            }}
            className="text-xs text-rose-600 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Inquiries */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Total Inquiries</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalLeadsCount}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{periodMode} audit</span>
        </div>

        {/* Meta Ads Inquiries */}
        <div className="p-4 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-2xl border border-blue-200 shadow-xs">
          <span className="text-[11px] text-blue-900 font-semibold flex items-center gap-1">
            <Facebook className="w-3 h-3 text-blue-600" />
            Meta Ads
          </span>
          <p className="text-2xl font-black text-blue-700 mt-1">{metaLeadsCount}</p>
          <span className="text-[10px] text-blue-600 mt-0.5 block">
            {totalLeadsCount > 0 ? `${((metaLeadsCount / totalLeadsCount) * 100).toFixed(0)}% of total` : '0%'}
          </span>
        </div>

        {/* Calls Logged */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Calls Logged</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{periodCalls.length}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">By staff</span>
        </div>

        {/* Site Visits Done */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Site Visits</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{visitsCompletedCount}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{visitsScheduledCount} scheduled</span>
        </div>

        {/* Deals Won */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Deals Won</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{wonCount}</p>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">{conversionRate}% conv. rate</span>
        </div>

        {/* Period Revenue */}
        <div className="p-4 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] text-emerald-900 font-semibold block">Closed Sales Value</span>
          <p className="text-xl font-black text-emerald-800 mt-1">{formatCurrency(totalPeriodRevenue)}</p>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">{periodWonDeals.length} deals closed</span>
        </div>
      </div>

      {/* Two Column Performance Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source & Meta Ads Attribution */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Facebook className="w-4 h-4 text-blue-600" />
              Lead Generation Sources ({rangeTitle})
            </h3>
            <span className="text-[11px] text-slate-500">{Object.keys(sourceBreakdown).length} Sources</span>
          </div>

          {Object.keys(sourceBreakdown).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              No inquiries recorded in this {periodMode} period.
            </p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(sourceBreakdown).map(([source, stats]) => {
                const conv = stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0;
                const pct = totalLeadsCount > 0 ? Math.round((stats.total / totalLeadsCount) * 100) : 0;
                const isMeta = source.toLowerCase().includes('meta') || source.toLowerCase().includes('facebook') || source.toLowerCase().includes('instagram');

                return (
                  <div
                    key={source}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                      isMeta ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{source}</span>
                        {isMeta && (
                          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-md font-bold text-[9px]">
                            Meta Ads
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {stats.total} leads ({pct}% share) • {stats.won} won
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-emerald-800 text-xs">{conv}% Conv</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Project Sales Performance in Period */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              Project Allocations & Closed Sales
            </h3>
            <span className="text-[11px] text-slate-500">{Object.keys(projectBreakdown).length} Projects</span>
          </div>

          {Object.keys(projectBreakdown).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              No project allocations recorded for this {periodMode} period.
            </p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(projectBreakdown).map(([proj, stats]) => (
                <div
                  key={proj}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{proj}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {stats.total} allocations • {stats.won} deals closed won
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-800">{formatCurrency(stats.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leads Detailed Audit Table in Period */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Detailed Inquiries Roster ({rangeTitle})
            </h3>
            <p className="text-xs text-slate-500">
              Complete customer log for the selected {periodMode} range with source and staff attribution
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={periodMode === 'weekly' ? handleExportWeeklyReport : handleExportMonthlyReport}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {periodMode === 'weekly' ? 'Weekly' : 'Monthly'} Excel</span>
            </button>
          </div>
        </div>

        {periodLeads.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No leads found matching the selected timeframe and filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Client</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Budget</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Assigned Staff</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodLeads.slice(0, 50).map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{l.name}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{l.phone}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[10px]">
                        {l.source}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{l.propertyType || '—'}</td>
                    <td className="p-3 text-slate-700 font-semibold">{l.budget || '—'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {l.assignedCloserName || l.assignedSetterName || l.assignedTelecallerName || 'Unassigned'}
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {l.createdAt ? l.createdAt.split('T')[0] : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
