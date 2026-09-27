import React, { useState } from 'react';
import {
  PhoneCall,
  Clock,
  User,
  MessageSquare,
  Search,
  Plus,
  Building2,
  Calendar,
} from 'lucide-react';
import { CallLog, User as UserType } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';

interface CommunicationViewProps {
  currentUser: UserType;
  onOpenNewLead: () => void;
}

export const CommunicationView: React.FC<CommunicationViewProps> = ({
  currentUser,
  onOpenNewLead,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const callLogs = CRMStorageService.getVisibleCallLogs(currentUser);

  const filteredLogs = callLogs.filter((log) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLead = log.leadName.toLowerCase().includes(q) || log.leadPhone.includes(q);
      const matchStaff = log.userName.toLowerCase().includes(q);
      const matchOutcome = log.outcome.toLowerCase().includes(q);
      if (!matchLead && !matchStaff && !matchOutcome) return false;
    }
    return true;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Communication & Call Logs</h2>
          <p className="text-xs text-slate-500">
            Real customer interaction registry with staff caller identity, outcomes, and automated follow-up callbacks
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          Total Calls Logged: {callLogs.length}
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
            placeholder="Search by client name, staff caller, or call outcome..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto shadow-xs my-8">
          <PhoneCall className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Call Logs Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            When your sales executives call clients from the Pipeline or Follow-Up views, real call notes and outcomes will be archived here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Client Lead</th>
                  <th className="p-3.5">Staff Caller</th>
                  <th className="p-3.5">Discussed Project</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Outcome</th>
                  <th className="p-3.5">Next Callback</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{log.leadName}</p>
                      <p className="text-[11px] font-mono text-slate-500">{log.leadPhone}</p>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{log.userName}</td>
                    <td className="p-3.5 text-slate-600">
                      {log.projectName ? (
                        <span className="font-semibold text-emerald-800">
                          {log.projectName}
                        </span>
                      ) : (
                        'General'
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {formatDuration(log.durationSeconds)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          log.outcome.includes('Scheduled') || log.outcome.includes('Interested')
                            ? 'bg-emerald-100 text-emerald-900'
                            : log.outcome.includes('Follow-up')
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-mono">
                      {log.nextFollowUpDate ? (
                        <span className="text-amber-800 font-semibold">
                          {log.nextFollowUpDate} {log.nextFollowUpTime || ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate" title={log.notes}>
                      {log.notes || '—'}
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
