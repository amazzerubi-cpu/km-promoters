import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Archive,
  Trash2,
  MapPin,
  CheckCircle,
  AlertCircle,
  Phone,
  Tag,
} from 'lucide-react';
import { Project, User } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';

interface ProjectsManagementViewProps {
  currentUser: User;
  onOpenNewProject: () => void;
  onEditProject: (project: Project) => void;
}

export const ProjectsManagementView: React.FC<ProjectsManagementViewProps> = ({
  currentUser,
  onOpenNewProject,
  onEditProject,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const projects = CRMStorageService.getProjects();

  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  const filteredProjects = projects.filter((p) => {
    if (filterCategory !== 'All' && p.category !== filterCategory) return false;
    return true;
  });

  const handleArchive = (id: string) => {
    if (window.confirm('Archive this project? Historical lead records will be safely preserved.')) {
      CRMStorageService.archiveProject(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete project? If leads are allocated, it will be safely archived instead.')) {
      CRMStorageService.deleteProject(id);
    }
  };

  const formatPrice = (p: Project) => {
    if (p.priceDisplay) return p.priceDisplay;
    const formatINR = (val: number) => {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
      return `₹${val.toLocaleString('en-IN')}`;
    };
    if (p.minPrice && p.maxPrice) {
      return `${formatINR(p.minPrice)} - ${formatINR(p.maxPrice)}`;
    }
    return 'Price on request';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Real Estate Projects Directory</h2>
          <p className="text-xs text-slate-500">
            Manage your developments, plots, apartments, villas, farm lands, and unit inventory
          </p>
        </div>

        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={onOpenNewProject}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Add New Project
          </button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          'All',
          'Plots',
          'Apartments',
          'Villas',
          'Farm Land',
          'Resale Property',
          'Individual House',
        ].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold border transition ${
              filterCategory === cat
                ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto shadow-xs my-8">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Projects Configured Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
            All demo projects (Greenfield Orchid, etc.) have been removed. Add your genuine property developments to begin tracking inventory and quoting leads.
          </p>
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={onOpenNewProject}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-800"
            >
              + Add First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const percentSold =
              project.totalUnits > 0
                ? Math.min(100, Math.round(((project.soldUnits || 0) / project.totalUnits) * 100))
                : 0;

            return (
              <div
                key={project.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
              >
                {/* Image Banner */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <img
                    src={
                      project.imageUrl ||
                      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80'
                    }
                    alt={project.name}
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                      {project.category}
                    </span>
                    {project.subtype && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-xs text-emerald-200 text-[10px] font-semibold">
                        {project.subtype}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        project.status === 'Active'
                          ? 'bg-emerald-500 text-white'
                          : project.status === 'Upcoming'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-500 text-white'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base font-black truncate drop-shadow-md">{project.name}</h3>
                    <p className="text-xs text-white/90 flex items-center gap-1 drop-shadow-xs truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {project.location}
                    </p>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Price Range */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Price Range</p>
                        <p className="text-sm font-black text-slate-900">{formatPrice(project)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Available</p>
                        <p className="text-sm font-bold text-emerald-700">
                          {project.availableUnits} / {project.totalUnits} Units
                        </p>
                      </div>
                    </div>

                    {/* Inventory Progress */}
                    <div className="py-3">
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Inventory Sold</span>
                        <span className="font-bold text-slate-700">
                          {project.soldUnits} sold ({percentSold}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>

                    {/* Amenities chips */}
                    {project.amenities && project.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {project.amenities.slice(0, 4).map((a) => (
                          <span
                            key={a}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                          >
                            {a}
                          </span>
                        ))}
                        {project.amenities.length > 4 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{project.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isOwnerOrAdmin && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onEditProject(project)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(project.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600 flex items-center gap-1"
                        >
                          <Archive className="w-3 h-3" /> Archive
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(project.id)}
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
