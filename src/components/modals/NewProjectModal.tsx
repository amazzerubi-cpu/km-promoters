import React, { useState } from 'react';
import { X, Building2, Plus, Image as ImageIcon } from 'lucide-react';
import { Project, PropertyCategory, FarmLandSubtype, ProjectStatus } from '../../types/crm';
import { CRMStorageService } from '../../services/crmStorage';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
  onSaved: () => void;
}

const PRESET_IMAGES = [
  {
    label: 'Modern High-Rise Apartment',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Luxury Gated Villa',
    url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Farm Land & Orchard',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Residential Plotted Development',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Boutique Independent House',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
  },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  projectToEdit,
  onSaved,
}) => {
  const [name, setName] = useState(projectToEdit?.name || '');
  const [category, setCategory] = useState<PropertyCategory>(
    projectToEdit?.category || 'Apartments'
  );
  const [subtype, setSubtype] = useState(projectToEdit?.subtype || 'Luxury High-Rise');
  const [location, setLocation] = useState(projectToEdit?.location || '');
  const [minPrice, setMinPrice] = useState(projectToEdit?.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(projectToEdit?.maxPrice?.toString() || '');
  const [priceDisplay, setPriceDisplay] = useState(projectToEdit?.priceDisplay || '');
  const [totalUnits, setTotalUnits] = useState(projectToEdit?.totalUnits?.toString() || '50');
  const [availableUnits, setAvailableUnits] = useState(
    projectToEdit?.availableUnits?.toString() || '40'
  );
  const [soldUnits, setSoldUnits] = useState(projectToEdit?.soldUnits?.toString() || '10');
  const [description, setDescription] = useState(projectToEdit?.description || '');
  const [imageUrl, setImageUrl] = useState(
    projectToEdit?.imageUrl || PRESET_IMAGES[0].url
  );
  const [amenitiesStr, setAmenitiesStr] = useState(
    projectToEdit?.amenities?.join(', ') || 'Clubhouse, 24/7 Security, Power Backup, Garden'
  );
  const [contactPerson, setContactPerson] = useState(projectToEdit?.contactPerson || '');
  const [contactPhone, setContactPhone] = useState(projectToEdit?.contactPhone || '');
  const [status, setStatus] = useState<ProjectStatus>(projectToEdit?.status || 'Active');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !location.trim()) {
      setErrorMsg('Project Name and Location are required.');
      return;
    }

    const tUnits = parseInt(totalUnits, 10) || 1;
    const aUnits = parseInt(availableUnits, 10) || 0;
    const sUnits = parseInt(soldUnits, 10) || 0;

    const mnP = parseInt(minPrice.replace(/[^0-9]/g, ''), 10) || 0;
    const mxP = parseInt(maxPrice.replace(/[^0-9]/g, ''), 10) || 0;

    const amenitiesList = amenitiesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const project: Project = {
      id: projectToEdit ? projectToEdit.id : `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      category,
      subtype: subtype.trim() || undefined,
      location: location.trim(),
      minPrice: mnP,
      maxPrice: mxP,
      priceDisplay: priceDisplay.trim() || undefined,
      totalUnits: tUnits,
      availableUnits: aUnits,
      soldUnits: sUnits,
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      amenities: amenitiesList,
      contactPerson: contactPerson.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      status,
      active: status !== 'Archived',
      createdAt: projectToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    CRMStorageService.saveProject(project);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                {projectToEdit ? 'Edit Real Estate Project' : 'Add New Real Estate Project'}
              </h2>
              <p className="text-xs text-slate-300">
                Configure project specifications, units inventory, pricing & site amenities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Project Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Skyline Heights Residency"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Property Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Plots">Plots</option>
                <option value="Apartments">Apartments</option>
                <option value="Villas">Villas</option>
                <option value="Farm Land">Farm Land</option>
                <option value="Resale Property">Resale Property</option>
                <option value="Individual House">Individual House</option>
              </select>
            </div>
          </div>

          {/* Subtype & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Property Subtype
              </label>
              {category === 'Farm Land' ? (
                <select
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Agricultural Land">Agricultural Land</option>
                  <option value="Farm Plot">Farm Plot</option>
                  <option value="Farm House Land">Farm House Land</option>
                  <option value="Orchard Land">Orchard Land</option>
                  <option value="Investment Farm Land">Investment Farm Land</option>
                  <option value="Weekend Farm Land">Weekend Farm Land</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value)}
                  placeholder="e.g. 3 & 4 BHK Luxury Floors / Gated Layout"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sector 54, Golf Course Road"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Min Price (INR)
              </label>
              <input
                type="text"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="e.g. 6500000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Price (INR)
              </label>
              <input
                type="text"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 18000000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Display Text
              </label>
              <input
                type="text"
                value={priceDisplay}
                onChange={(e) => setPriceDisplay(e.target.value)}
                placeholder="e.g. ₹65 L - ₹1.8 Cr"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Inventory Counts */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Units</label>
              <input
                type="number"
                min="1"
                value={totalUnits}
                onChange={(e) => setTotalUnits(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Available Units
              </label>
              <input
                type="number"
                min="0"
                value={availableUnits}
                onChange={(e) => setAvailableUnits(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Sold Units</label>
              <input
                type="number"
                min="0"
                value={soldUnits}
                onChange={(e) => setSoldUnits(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Image Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Project Banner Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
            />
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500 shrink-0">Presets:</span>
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`px-2 py-1 rounded-md border shrink-0 transition ${
                    imageUrl === preset.url
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Amenities */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Project Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Luxurious living community with modern architectural elegance."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Amenities (comma separated)
            </label>
            <input
              type="text"
              value={amenitiesStr}
              onChange={(e) => setAmenitiesStr(e.target.value)}
              placeholder="Swimming Pool, Clubhouse, CCTV, EV Charging, Garden"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Status & Site Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Site Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Site Manager"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Site Contact Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Site mobile number"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
            >
              {projectToEdit ? 'Save Project Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
