import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Car,
  MapPin,
  CheckCircle,
  Plus,
  Phone,
  UserCheck,
  Building2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { SiteVisit, User, SiteVisitStatus } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';

interface CalendarViewProps {
  currentUser: User;
  onOpenScheduleModal: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentUser,
  onOpenScheduleModal,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const visits = CRMStorageService.getVisibleSiteVisits(currentUser);

  const filteredVisits = visits.filter((v) => {
    if (filterStatus !== 'All' && v.status !== filterStatus) return false;
    return true;
  });

  // Sort visits chronologically
  const sortedVisits = [...filteredVisits].sort((a, b) => {
    const dtA = `${a.date}T${a.time}`;
    const dtB = `${b.date}T${b.time}`;
    return dtA.localeCompare(dtB);
  });

  const handleUpdateStatus = (visit: SiteVisit, newStatus: SiteVisitStatus) => {
    CRMStorageService.saveSiteVisit({ ...visit, status: newStatus }, currentUser);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this site visit appointment?')) {
      CRMStorageService.deleteSiteVisit(id);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Site Visits & Appointments Calendar</h2>
          <p className="text-xs text-slate-500">
            Real physical inspections scheduled with clients, drivers, and assigned closing executives
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenScheduleModal}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Schedule Site Visit
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {['All', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
                filterStatus === st
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="text-xs font-semibold text-slate-600">
          Showing {sortedVisits.length} appointments
        </div>
      </div>

      {/* Visits List */}
      {sortedVisits.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto shadow-xs my-8">
          <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Site Visits Scheduled</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Real client inspection appointments will appear here with pickup logistics, dates, and assigned staff.
          </p>
          <button
            type="button"
            onClick={onOpenScheduleModal}
            className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-800"
          >
            + Schedule New Site Visit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedVisits.map((visit) => {
            const isToday = visit.date === todayStr;
            const isPast = visit.date < todayStr;

            return (
              <div
                key={visit.id}
                className={`p-5 rounded-3xl border transition shadow-xs flex flex-col justify-between ${
                  isToday
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top: Date, Time & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                        {visit.date}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {visit.time}
                      </span>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase">
                          Today
                        </span>
                      )}
                    </div>

                    <select
                      value={visit.status}
                      onChange={(e) =>
                        handleUpdateStatus(visit, e.target.value as SiteVisitStatus)
                      }
                      className="text-xs font-bold rounded-lg px-2.5 py-1 border border-slate-300 bg-white text-slate-800"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Client & Project Info */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{visit.leadName}</h3>
                    <p className="text-xs font-mono text-slate-600 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {visit.leadPhone}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                      {visit.projectName}
                    </div>
                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Staff Escort: {visit.assignedEmployeeName}</span>
                      {visit.assignedCloserName && (
                        <span>Closer: {visit.assignedCloserName}</span>
                      )}
                    </div>
                  </div>

                  {/* Pickup Logistics */}
                  {visit.pickupRequired && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-950">
                      <p className="font-bold flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-blue-700" />
                        Vehicle Pickup Assistance Requested
                      </p>
                      {visit.pickupLocation && (
                        <p className="text-[11px] text-blue-900">
                          Pickup Location: {visit.pickupLocation}
                        </p>
                      )}
                      {(visit.driverName || visit.driverPhone) && (
                        <p className="text-[11px] text-blue-800">
                          Driver: {visit.driverName || 'Designated Driver'}{' '}
                          {visit.driverPhone ? `(${visit.driverPhone})` : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {visit.notes && (
                    <p className="text-xs text-slate-500 italic">Notes: {visit.notes}</p>
                  )}
                </div>

                {/* Footer Delete */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Logged: {new Date(visit.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(visit.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Visit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
