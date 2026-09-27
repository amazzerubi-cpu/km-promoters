import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Building2,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Lead, Project, User, LeadAllocation } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';

interface ProjectAllocationViewProps {
  currentUser: User;
  onAllocateNew: (lead: Lead) => void;
  onOpenNewLead: () => void;
  activeProjects: Project[];
  activeUsers: User[];
}

export const ProjectAllocationView: React.FC<ProjectAllocationViewProps> = ({
  currentUser,
  onAllocateNew,
  onOpenNewLead,
  activeProjects,
  activeUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  const leads = CRMStorageService.getVisibleLeads(currentUser);

  // Flatten allocations with lead info
  interface AllocationRow {
    allocation: LeadAllocation;
    lead: Lead;
  }

  const allAllocationRows: AllocationRow[] = [];
  leads.forEach((lead) => {
    lead.allocations.forEach((alloc) => {
      allAllocationRows.push({
        allocation: alloc,
        lead,
      });
    });
  });

  const filteredRows = allAllocationRows.filter(({ allocation, lead }) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLead = lead.name.toLowerCase().includes(q) || lead.phone.includes(q);
      const matchProj = allocation.projectName?.toLowerCase().includes(q);
      const matchUnit = allocation.unitPlotNumber?.toLowerCase().includes(q);
      if (!matchLead && !matchProj && !matchUnit) return false;
    }

    if (selectedProjectFilter && allocation.projectId !== selectedProjectFilter) {
      return false;
    }

    if (selectedStatusFilter && allocation.status !== selectedStatusFilter) {
      return false;
    }

    return true;
  });

  const handleUpdateStatus = (
    leadId: string,
    allocationId: string,
    newStatus: LeadAllocation['status']
  ) => {
    CRMStorageService.updateLeadAllocation(leadId, allocationId, { status: newStatus }, currentUser);
  };

  const handleRemoveAllocation = (leadId: string, allocationId: string) => {
    if (window.confirm('Remove this project allocation from the lead?')) {
      CRMStorageService.removeLeadAllocation(leadId, allocationId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Multi-Project Lead Allocations</h2>
          <p className="text-xs text-slate-500">
            A single lead can be interested in multiple projects without creating duplicate lead master records
          </p>
        </div>

        <div className="flex items-center gap-2">
          {leads.length > 0 && (
            <button
              type="button"
              onClick={() => onAllocateNew(leads[0])}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              Allocate Project to Lead
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, project name or unit #..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden"
          />
        </div>

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

        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="">All Allocation Stages</option>
          <option value="Draft">Draft</option>
          <option value="Site Visit Done">Site Visit Done</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Token Paid">Token Paid</option>
          <option value="Booked">Booked</option>
          <option value="Won">Won</option>
          <option value="Lost">Lost</option>
        </select>
      </div>

      {/* Table of Allocations */}
      {filteredRows.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto shadow-xs my-8">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Project Allocations Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Allocations connect real leads to specific properties and units with deal values and stages.
          </p>
          {leads.length === 0 ? (
            <button
              type="button"
              onClick={onOpenNewLead}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              + Create Lead First
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAllocateNew(leads[0])}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              + Allocate Project
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Client Lead</th>
                  <th className="p-3.5">Allocated Project</th>
                  <th className="p-3.5">Unit / Plot #</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Expected Value</th>
                  <th className="p-3.5">Deal Stage</th>
                  <th className="p-3.5">Closer Assigned</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map(({ allocation, lead }) => (
                  <tr key={allocation.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{lead.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{lead.phone}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {allocation.projectName}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 font-semibold">
                      {allocation.unitPlotNumber || 'General'}
                    </td>
                    <td className="p-3.5 text-slate-600">{allocation.propertyCategory}</td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {allocation.expectedClosingValue
                        ? `₹${allocation.expectedClosingValue.toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={allocation.status}
                        onChange={(e) =>
                          handleUpdateStatus(lead.id, allocation.id, e.target.value as any)
                        }
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border ${
                          allocation.status === 'Won'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : allocation.status === 'Booked'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
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
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {allocation.assignedCloserName || 'Unassigned'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveAllocation(lead.id, allocation.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
