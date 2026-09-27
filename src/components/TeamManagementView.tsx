import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  KeyRound,
} from 'lucide-react';
import { User, UserRole } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';

interface TeamManagementViewProps {
  currentUser: User;
  onOpenNewUser: () => void;
  onEditUser: (user: User) => void;
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  currentUser,
  onOpenNewUser,
  onEditUser,
}) => {
  const users = CRMStorageService.getUsers();
  const leads = CRMStorageService.getLeads();
  const wonDeals = CRMStorageService.getWonDeals();

  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  const handleDelete = (id: string) => {
    if (id === currentUser.id) {
      alert('You cannot delete your own logged-in account.');
      return;
    }
    if (window.confirm('Delete this team member account?')) {
      CRMStorageService.deleteUser(id);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'closer':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'telecaller':
        return 'bg-teal-100 text-teal-900 border-teal-200';
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Team & Role-Based Access Control (RBAC)</h2>
          <p className="text-xs text-slate-500">
            Add, edit, or remove Setters, Closers, and Telecallers. Staff accounts are isolated so users only see their own assigned data.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={onOpenNewUser}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Add Team Member
          </button>
        )}
      </div>

      {/* Permissions Matrix Overview */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Active RBAC Data Privacy & Security Matrix
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-purple-300 uppercase tracking-wider text-[11px]">
              1. Owner
            </span>
            <p className="text-slate-300 text-[11px] mt-1">
              Rich Rubinni. Full master access to all company data, financials, won ledger, and team credentials.
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-blue-300 uppercase tracking-wider text-[11px]">
              2. Admin
            </span>
            <p className="text-slate-300 text-[11px] mt-1">
              Full company visibility. Can add, edit, and remove team members, manage inventory, and supervise pipelines.
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">
              3. Setter
            </span>
            <p className="text-slate-300 text-[11px] mt-1">
              Restricted to assigned leads only. Cannot see leads, follow-ups, or calls of other team members.
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              4. Closer
            </span>
            <p className="text-slate-300 text-[11px] mt-1">
              Restricted to assigned deals only. Manages negotiations, tokens, and won deals without seeing others' records.
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-teal-300 uppercase tracking-wider text-[11px]">
              5. Telecaller
            </span>
            <p className="text-slate-300 text-[11px] mt-1">
              Dedicated cold calling & inquiry queue. Strictly isolated to assigned calls and callbacks.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Staff Name</th>
                <th className="p-3.5">Email / Login</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">CRM Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Active Leads</th>
                <th className="p-3.5">Deals Closed</th>
                {isOwnerOrAdmin && <th className="p-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const assignedCount = leads.filter(
                  (l) => l.assignedSetterId === u.id || l.assignedCloserId === u.id
                ).length;
                const wonCount = wonDeals.filter(
                  (w) => w.closerId === u.id || w.setterId === u.id
                ).length;

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3.5 text-slate-600 font-mono">{u.email}</td>
                    <td className="p-3.5 text-slate-600 font-mono">{u.phone || '—'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {u.active ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">{assignedCount}</td>
                    <td className="p-3.5 font-bold text-emerald-800">{wonCount}</td>
                    {isOwnerOrAdmin && (
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEditUser(u)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleDelete(u.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
