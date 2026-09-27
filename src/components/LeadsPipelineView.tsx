import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Columns,
  List,
  Phone,
  MessageSquare,
  Calendar,
  Layers,
  Plus,
  ArrowRight,
  Flame,
  CheckCircle,
  Clock,
  MoreVertical,
  X,
  Trash2,
  Building2,
  UserCheck,
  Compass,
  Zap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Facebook,
  Instagram,
  RefreshCw,
} from 'lucide-react';
import {
  Lead,
  LeadStatus,
  Project,
  User,
  LeadPriority,
  InterestLevel,
  LeadAllocation,
} from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';
import { LeadTrackerModal } from './modals/LeadTrackerModal';
import { MetaIntegrationModal } from './modals/MetaIntegrationModal';

interface LeadsPipelineViewProps {
  currentUser: User;
  onOpenNewLead: () => void;
  onOpenImport: () => void;
  onScheduleVisit: (lead: Lead) => void;
  onLogCall: (lead: Lead) => void;
  onWhatsApp: (lead: Lead) => void;
  onAllocateProject: (lead: Lead) => void;
  activeProjects: Project[];
  activeUsers: User[];
  onOpenMetaModal?: () => void;
}

const PIPELINE_COLUMNS: LeadStatus[] = [
  'New',
  'Contacted',
  'Interested',
  'Details Requested',
  'Site Visit Scheduled',
  'Site Visit Completed',
  'Negotiation',
  'Token Pending',
  'Booked',
  'Won',
  'Lost',
];

export const LeadsPipelineView: React.FC<LeadsPipelineViewProps> = ({
  currentUser,
  onOpenNewLead,
  onOpenImport,
  onScheduleVisit,
  onLogCall,
  onWhatsApp,
  onAllocateProject,
  activeProjects,
  activeUsers,
  onOpenMetaModal,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');
  const [quickFilter, setQuickFilter] = useState<'all' | 'meta' | 'hot' | 'today' | 'visits'>('all');

  // Lead detail drawer vs Tracker modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToTrack, setLeadToTrack] = useState<Lead | null>(null);
  const [isInternalMetaOpen, setIsInternalMetaOpen] = useState(false);

  // Drag and drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  const leads = CRMStorageService.getVisibleLeads(currentUser);
  const metaConfig = CRMStorageService.getMetaConfig();
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    if (selectedStageFilter !== 'All' && lead.status !== selectedStageFilter) {
      return false;
    }

    // Quick filter presets
    if (quickFilter === 'meta') {
      const isMeta =
        lead.source.toLowerCase().includes('meta') ||
        lead.source.toLowerCase().includes('facebook') ||
        lead.source.toLowerCase().includes('instagram') ||
        Boolean(lead.metaCampaignName);
      if (!isMeta) return false;
    } else if (quickFilter === 'hot') {
      if (lead.interestLevel !== 'Hot') return false;
    } else if (quickFilter === 'today') {
      if (lead.nextFollowUpDate !== todayStr) return false;
    } else if (quickFilter === 'visits') {
      if (lead.status !== 'Site Visit Scheduled' && lead.status !== 'Site Visit Completed') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchPhone = lead.phone.includes(q);
      const matchEmail = lead.email?.toLowerCase().includes(q);
      const matchSource = lead.source.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchSource) return false;
    }

    if (selectedProjectFilter) {
      const hasProj = lead.allocations.some((a) => a.projectId === selectedProjectFilter);
      if (!hasProj) return false;
    }

    if (selectedPriorityFilter && lead.priority !== selectedPriorityFilter) {
      return false;
    }

    if (selectedStaffFilter) {
      const matchSetter = lead.assignedSetterId === selectedStaffFilter;
      const matchCloser = lead.assignedCloserId === selectedStaffFilter;
      const matchTelecaller = lead.assignedTelecallerId === selectedStaffFilter;
      if (!matchSetter && !matchCloser && !matchTelecaller) return false;
    }

    return true;
  });

  const handleStatusChange = (lead: Lead, newStatus: LeadStatus) => {
    const updated = { ...lead, status: newStatus };
    CRMStorageService.saveLead(updated, currentUser);
    if (selectedLead?.id === lead.id) {
      setSelectedLead(updated);
    }
    if (leadToTrack?.id === lead.id) {
      setLeadToTrack(updated);
    }
  };

  const handleMoveStage = (lead: Lead, direction: 'prev' | 'next') => {
    const currentIndex = PIPELINE_COLUMNS.indexOf(lead.status);
    if (currentIndex === -1) return;

    if (direction === 'prev' && currentIndex > 0) {
      handleStatusChange(lead, PIPELINE_COLUMNS[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < PIPELINE_COLUMNS.length - 1) {
      handleStatusChange(lead, PIPELINE_COLUMNS[currentIndex + 1]);
    }
  };

  const handleDeleteLead = (leadId: string) => {
    if (window.confirm('Are you sure you want to delete this lead? This cannot be undone.')) {
      CRMStorageService.deleteLead(leadId);
      if (selectedLead?.id === leadId) setSelectedLead(null);
      if (leadToTrack?.id === leadId) setLeadToTrack(null);
    }
  };

  const handleUpdateAllocationStatus = (
    lead: Lead,
    allocationId: string,
    newStatus: LeadAllocation['status']
  ) => {
    CRMStorageService.updateLeadAllocation(lead.id, allocationId, { status: newStatus }, currentUser);
    const refreshed = CRMStorageService.getLeadById(lead.id);
    if (refreshed) {
      setSelectedLead(refreshed);
      if (leadToTrack?.id === lead.id) setLeadToTrack(refreshed);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    if (dragOverStage !== stage) setDragOverStage(stage);
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    const lead = CRMStorageService.getLeadById(leadId);
    if (lead && lead.status !== targetStage) {
      handleStatusChange(lead, targetStage);
    }
    setDraggedLeadId(null);
  };

  const calculateStageValue = (stageLeads: Lead[]) => {
    return stageLeads.reduce((sum, l) => {
      if (l.allocations && l.allocations.length > 0) {
        return sum + l.allocations.reduce((acc, a) => acc + (a.expectedClosingValue || a.quotedPrice || 0), 0);
      }
      return sum + (l.budgetNum || 0);
    }, 0);
  };

  const formatShortValue = (val: number) => {
    if (!val || val === 0) return '';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getTimeInStage = (lead: Lead) => {
    if (lead.stageHistory && lead.stageHistory.length > 0) {
      const last = lead.stageHistory[0];
      const diffMs = Date.now() - new Date(last.timestamp).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1d ago';
      return `${diffDays}d in stage`;
    }
    return 'Active';
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Leads & Sales Kanban Pipeline</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {filteredLeads.length} Leads
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Interactive drag & drop Kanban board with full lifecycle lead tracking and Meta ad attribution
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-emerald-800' : 'text-slate-600'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'table' ? 'bg-white shadow-xs text-emerald-800' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
          </div>

          {/* Connect to Meta button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenMetaModal) {
                onOpenMetaModal();
              } else {
                setIsInternalMetaOpen(true);
              }
            }}
            className="px-3 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
            title="Connect Facebook & Instagram Lead Ads"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Facebook className="w-3.5 h-3.5 text-blue-300" />
            <span>Connect to Meta</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewLead}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            Import CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, mobile or email..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Quick Filter Segmented Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setQuickFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              quickFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('meta')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              quickFilter === 'meta'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-800 hover:bg-blue-50'
            }`}
          >
            <Facebook className="w-3 h-3" />
            Meta Ads
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('hot')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              quickFilter === 'hot'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <Flame className="w-3 h-3" />
            Hot Leads
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('today')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              quickFilter === 'today'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-3 h-3" />
            Due Today
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('visits')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              quickFilter === 'visits'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Visits
          </button>
        </div>

        {/* Project Filter */}
        <select
          value={selectedProjectFilter}
          onChange={(e) => setSelectedProjectFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="">All Projects</option>
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={selectedPriorityFilter}
          onChange={(e) => setSelectedPriorityFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        {/* Staff Filter */}
        <select
          value={selectedStaffFilter}
          onChange={(e) => setSelectedStaffFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="">All Team Members</option>
          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>

        {(searchQuery || selectedProjectFilter || selectedPriorityFilter || selectedStaffFilter || quickFilter !== 'all' || selectedStageFilter !== 'All') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedProjectFilter('');
              setSelectedPriorityFilter('');
              setSelectedStaffFilter('');
              setQuickFilter('all');
              setSelectedStageFilter('All');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Mobile Stage Selector Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 -mx-1 px-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedStageFilter('All')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 active:scale-95 ${
            selectedStageFilter === 'All'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Stages ({leads.length})
        </button>
        {PIPELINE_COLUMNS.map((stage) => {
          const count = leads.filter((l) => l.status === stage).length;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setSelectedStageFilter(stage)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 active:scale-95 ${
                selectedStageFilter === stage
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{stage}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedStageFilter === stage
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {leads.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto shadow-xs my-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">CRM Pipeline is Currently Empty</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
            Create your first real client lead manually, sync directly from your Meta Lead Ads campaign, or import existing customer records.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={onOpenNewLead}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              + Create First Lead
            </button>
            <button
              type="button"
              onClick={() => setIsInternalMetaOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Facebook className="w-4 h-4" />
              <span>Connect Meta Ads</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KANBAN VIEW WITH DRAG & DROP AND LEAD TRACKING */}
          {viewMode === 'kanban' && (
            <div className="flex gap-3 overflow-x-auto pb-6 pt-1 items-start min-h-[620px]">
              {PIPELINE_COLUMNS.map((stage) => {
                const columnLeads = filteredLeads.filter((l) => l.status === stage);
                const stageTotalVal = calculateStageValue(columnLeads);
                const isOver = dragOverStage === stage;

                return (
                  <div
                    key={stage}
                    onDragOver={(e) => handleDragOver(e, stage)}
                    onDrop={(e) => handleDrop(e, stage)}
                    className={`w-76 shrink-0 rounded-2xl border flex flex-col max-h-[80vh] transition-colors duration-200 ${
                      isOver
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400'
                        : 'bg-slate-100/80 border-slate-200/90'
                    }`}
                  >
                    {/* Stage Header */}
                    <div className="p-3 border-b border-slate-200/60 flex items-center justify-between bg-white/70 rounded-t-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{stage}</span>
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                          {columnLeads.length}
                        </span>
                      </div>
                      {stageTotalVal > 0 && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          {formatShortValue(stageTotalVal)}
                        </span>
                      )}
                    </div>

                    {/* Cards Container */}
                    <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                      {columnLeads.length === 0 ? (
                        <div className="p-6 text-center text-[11px] text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl">
                          Drop leads here
                        </div>
                      ) : (
                        columnLeads.map((lead) => {
                          const isMeta =
                            lead.source.toLowerCase().includes('meta') ||
                            lead.source.toLowerCase().includes('facebook') ||
                            lead.source.toLowerCase().includes('instagram') ||
                            Boolean(lead.metaCampaignName);

                          return (
                            <div
                              key={lead.id}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, lead.id)}
                              onClick={() => setSelectedLead(lead)}
                              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-600 shadow-xs hover:shadow-md transition cursor-pointer group relative"
                            >
                              {/* Top row: Name & Badges */}
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                                  {lead.name}
                                </h4>

                                <div className="flex items-center gap-1 shrink-0">
                                  {isMeta && (
                                    <span
                                      className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[9px] font-bold flex items-center gap-0.5 border border-blue-200"
                                      title={`Source: ${lead.source}`}
                                    >
                                      {lead.metaPlatform === 'instagram' ? (
                                        <Instagram className="w-2.5 h-2.5" />
                                      ) : (
                                        <Facebook className="w-2.5 h-2.5" />
                                      )}
                                      Meta
                                    </span>
                                  )}

                                  {lead.interestLevel === 'Hot' ? (
                                    <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[9px] font-extrabold flex items-center gap-0.5">
                                      <Flame className="w-2.5 h-2.5" /> HOT
                                    </span>
                                  ) : lead.interestLevel === 'Warm' ? (
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold">
                                      WARM
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              {/* Phone & In-Stage Age */}
                              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 mb-1.5">
                                <span>{lead.phone}</span>
                                <span className="text-[10px] font-sans text-slate-400 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 text-slate-400" />
                                  {getTimeInStage(lead)}
                                </span>
                              </div>

                              {/* Project allocations preview */}
                              <div className="mb-2">
                                {lead.allocations.length === 0 ? (
                                  <span className="text-[10px] text-slate-400 italic">
                                    No property allocated
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {lead.allocations.map((alloc) => (
                                      <span
                                        key={alloc.id}
                                        className="px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-semibold truncate max-w-[200px]"
                                      >
                                        {alloc.projectName} {alloc.unitPlotNumber ? `(#${alloc.unitPlotNumber})` : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Stage Mover Ribbon & Track Lead button */}
                              <div
                                className="flex items-center justify-between pt-1.5 pb-1 border-t border-slate-100 text-[10px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Quick 1-click stage transition controls */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveStage(lead, 'prev')}
                                    title="Move to previous stage"
                                    className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveStage(lead, 'next')}
                                    title="Advance to next stage"
                                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Track Lead Action Trigger */}
                                <button
                                  type="button"
                                  onClick={() => setLeadToTrack(lead)}
                                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-md text-emerald-800 font-bold transition flex items-center gap-1 text-[10px] border border-emerald-200"
                                  title="Open Live Lead Journey Tracker"
                                >
                                  <Compass className="w-3 h-3" />
                                  <span>Track Lead</span>
                                </button>
                              </div>

                              {/* Bottom row: Budget & Quick action buttons */}
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
                                <span className="font-semibold text-slate-700 truncate max-w-[80px]">
                                  {lead.budget || lead.propertyType || 'General'}
                                </span>

                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => onLogCall(lead)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg text-slate-700 transition"
                                    title="Log Call"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onWhatsApp(lead)}
                                    className="p-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white rounded-lg text-teal-700 transition"
                                    title="WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onScheduleVisit(lead)}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg text-blue-700 transition"
                                    title="Schedule Site Visit"
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onAllocateProject(lead)}
                                    className="p-1.5 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-lg text-purple-700 transition"
                                    title="Allocate Project"
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Client Name</th>
                      <th className="p-3.5">Phone / Contact</th>
                      <th className="p-3.5">Lead Source</th>
                      <th className="p-3.5">Interested Projects</th>
                      <th className="p-3.5">Stage</th>
                      <th className="p-3.5">Assigned Staff</th>
                      <th className="p-3.5">Track Lead</th>
                      <th className="p-3.5 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => {
                      const isMeta =
                        lead.source.toLowerCase().includes('meta') ||
                        lead.source.toLowerCase().includes('facebook') ||
                        lead.source.toLowerCase().includes('instagram') ||
                        Boolean(lead.metaCampaignName);

                      return (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="hover:bg-slate-50 cursor-pointer transition"
                        >
                          <td className="p-3.5 font-bold text-slate-900">
                            {lead.name}
                            {lead.interestLevel === 'Hot' && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[9px] font-bold">
                                HOT
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-600 font-mono">{lead.phone}</td>
                          <td className="p-3.5">
                            {isMeta ? (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center gap-1 border border-blue-200 w-fit">
                                {lead.metaPlatform === 'instagram' ? (
                                  <Instagram className="w-3 h-3" />
                                ) : (
                                  <Facebook className="w-3 h-3" />
                                )}
                                {lead.source}
                              </span>
                            ) : (
                              <span className="text-slate-600">{lead.source}</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {lead.allocations.length === 0 ? (
                              <span className="text-slate-400 italic">None</span>
                            ) : (
                              <span className="font-semibold text-emerald-800">
                                {lead.allocations.map((a) => a.projectName).join(', ')}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[10px]">
                              {lead.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {lead.assignedCloserName || lead.assignedSetterName || lead.assignedTelecallerName || 'Unassigned'}
                          </td>
                          <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setLeadToTrack(lead)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-emerald-200"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>Track</span>
                            </button>
                          </td>
                          <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onLogCall(lead)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700"
                                title="Call"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onWhatsApp(lead)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onScheduleVisit(lead)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700"
                                title="Site Visit"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* LEAD DETAIL DRAWER MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Lead Master Record
                </span>
                <h3 className="text-lg font-black">{selectedLead.name}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{selectedLead.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLeadToTrack(selectedLead);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Open Full Tracker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto text-xs">
              {/* Quick Action Ribbon */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => onLogCall(selectedLead)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 font-bold flex flex-col items-center gap-1 text-center"
                >
                  <Phone className="w-4 h-4 text-emerald-700" />
                  <span>Call</span>
                </button>
                <button
                  type="button"
                  onClick={() => onWhatsApp(selectedLead)}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-900 font-bold flex flex-col items-center gap-1 text-center"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => onScheduleVisit(selectedLead)}
                  className="p-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-900 font-bold flex flex-col items-center gap-1 text-center"
                >
                  <Calendar className="w-4 h-4 text-blue-700" />
                  <span>Site Visit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAllocateProject(selectedLead)}
                  className="p-2.5 bg-purple-50 hover:bg-purple-100 rounded-xl text-purple-900 font-bold flex flex-col items-center gap-1 text-center"
                >
                  <Building2 className="w-4 h-4 text-purple-700" />
                  <span>+ Allocate</span>
                </button>
              </div>

              {/* Status Selector */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Update Lead Sales Stage
                </label>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleStatusChange(selectedLead, e.target.value as LeadStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600"
                >
                  {PIPELINE_COLUMNS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                  <option value="Not Interested">Not Interested</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Multiple Project Allocations Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    Multiple Project Allocations ({selectedLead.allocations.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => onAllocateProject(selectedLead)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    + Allocate Project
                  </button>
                </div>

                {selectedLead.allocations.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2">
                    No projects allocated to this lead yet. Click "+ Allocate Project" to link properties.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedLead.allocations.map((alloc) => (
                      <div
                        key={alloc.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{alloc.projectName}</span>
                          <select
                            value={alloc.status}
                            onChange={(e) =>
                              handleUpdateAllocationStatus(
                                selectedLead,
                                alloc.id,
                                e.target.value as any
                              )
                            }
                            className="text-[10px] px-2 py-0.5 font-bold rounded-md border border-slate-200 bg-slate-50 text-slate-700"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Site Visit Done">Site Visit Done</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Token Paid">Token Paid</option>
                            <option value="Booked">Booked</option>
                            <option value="Won">Won (Closed Deal)</option>
                            <option value="Lost">Lost</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>
                            Unit: {alloc.unitPlotNumber || 'Not specified'} • {alloc.propertyCategory}
                          </span>
                          <span className="font-semibold text-emerald-800">
                            {alloc.expectedClosingValue
                              ? `₹${alloc.expectedClosingValue.toLocaleString('en-IN')}`
                              : 'Price open'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Client Profile Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">Client Details</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">Email:</span> {selectedLead.email || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Alt Phone:</span> {selectedLead.alternatePhone || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Location:</span> {selectedLead.location || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Source:</span> {selectedLead.source}
                  </div>
                  <div>
                    <span className="text-slate-400">Budget:</span> {selectedLead.budget || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Property Type:</span>{' '}
                    {selectedLead.propertyType || '—'}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1">Notes & Inquiries</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedLead.notes}</p>
                </div>
              )}

              {/* Delete button (Owner/Admin only) */}
              {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Lead
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEAD TRACKER MODAL */}
      <LeadTrackerModal
        isOpen={Boolean(leadToTrack)}
        onClose={() => setLeadToTrack(null)}
        lead={leadToTrack}
        currentUser={currentUser}
        onLogCall={(l) => {
          setLeadToTrack(null);
          onLogCall(l);
        }}
        onWhatsApp={(l) => {
          setLeadToTrack(null);
          onWhatsApp(l);
        }}
        onScheduleVisit={(l) => {
          setLeadToTrack(null);
          onScheduleVisit(l);
        }}
        onAllocateProject={(l) => {
          setLeadToTrack(null);
          onAllocateProject(l);
        }}
        onLeadUpdated={() => {
          if (leadToTrack) {
            const updated = CRMStorageService.getLeadById(leadToTrack.id);
            if (updated) setLeadToTrack(updated);
          }
        }}
      />

      {/* META INTEGRATION MODAL */}
      <MetaIntegrationModal
        isOpen={isInternalMetaOpen}
        onClose={() => setIsInternalMetaOpen(false)}
        currentUser={currentUser}
        activeProjects={activeProjects}
        activeUsers={activeUsers}
        onLeadsUpdated={() => {
          // Trigger re-render
        }}
      />
    </div>
  );
};
