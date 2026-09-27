import React, { useState } from 'react';
import {
  Award,
  Search,
  Building2,
  CheckCircle,
  FileCheck,
  Calendar,
  Phone,
  UserCheck,
} from 'lucide-react';
import { WonDeal, User } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';

interface WonLedgerViewProps {
  currentUser: User;
}

export const WonLedgerView: React.FC<WonLedgerViewProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const wonDeals = CRMStorageService.getVisibleWonDeals(currentUser);

  const totalWonRevenue = wonDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0);

  const filteredDeals = wonDeals.filter((deal) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLead = deal.leadName.toLowerCase().includes(q) || deal.leadPhone.includes(q);
      const matchProj = deal.projectName.toLowerCase().includes(q);
      const matchCloser = deal.closerName.toLowerCase().includes(q);
      if (!matchLead && !matchProj && !matchCloser) return false;
    }
    return true;
  });

  const formatCurrency = (val: number) => {
    if (!val || val === 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 p-6 rounded-3xl text-white shadow-lg">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
            Official Closed Deals Registry
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Won Deals Ledger</h2>
          <p className="text-xs text-emerald-200 mt-1">
            Verified closed transactions, allocated units, and attributed sales executives
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-2xl text-right">
          <p className="text-[10px] font-bold text-emerald-300 uppercase">Total Won Revenue</p>
          <p className="text-2xl font-black text-white">{formatCurrency(totalWonRevenue)}</p>
          <p className="text-[11px] text-emerald-200 mt-0.5">{wonDeals.length} Verified Deals</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search won deals by client, project or closer..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Deals List */}
      {filteredDeals.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto shadow-xs my-8">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Closed Deals Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-2">
            When you transition a project allocation stage or lead status to "Won", the deal automatically enters this official ledger and decrements project inventory.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Closed Date</th>
                  <th className="p-3.5">Client Lead</th>
                  <th className="p-3.5">Project</th>
                  <th className="p-3.5">Unit / Plot #</th>
                  <th className="p-3.5">Property Type</th>
                  <th className="p-3.5">Deal Value</th>
                  <th className="p-3.5">Closing Executive</th>
                  <th className="p-3.5">Setter Escort</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono text-slate-500 font-medium">
                      {deal.closedDate}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{deal.leadName}</p>
                      <p className="text-[11px] font-mono text-slate-500">{deal.leadPhone}</p>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-900">{deal.projectName}</td>
                    <td className="p-3.5 font-mono font-semibold text-slate-800">
                      {deal.unitPlotNumber}
                    </td>
                    <td className="p-3.5 text-slate-600">{deal.category}</td>
                    <td className="p-3.5 font-black text-slate-900 text-sm">
                      {formatCurrency(deal.dealValue)}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{deal.closerName}</td>
                    <td className="p-3.5 text-slate-600">{deal.setterName || '—'}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        VERIFIED WON
                      </span>
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
