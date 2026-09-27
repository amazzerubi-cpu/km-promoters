import React, { useState } from 'react';
import { X, MessageSquare, Send, Check } from 'lucide-react';
import { Lead, Project, User, WhatsAppTemplate } from '../../types/crm';
import { CRMStorageService } from '../../services/crmStorage';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  activeProjects: Project[];
  currentUser: User;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  lead,
  activeProjects,
  currentUser,
}) => {
  const templates = CRMStorageService.getWhatsAppTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    lead.allocations[0]?.projectId || activeProjects[0]?.id || ''
  );

  const selectedProj = activeProjects.find((p) => p.id === selectedProjectId);

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const generateMessage = () => {
    if (!currentTemplate) return '';
    return currentTemplate.template
      .replace(/{{LeadName}}/g, lead.name)
      .replace(/{{ProjectName}}/g, selectedProj?.name || 'our property project')
      .replace(/{{EmployeeName}}/g, currentUser.name)
      .replace(/{{SiteVisitDate}}/g, lead.siteVisitDate || 'upcoming Saturday')
      .replace(/{{SiteVisitTime}}/g, lead.siteVisitTime || '11:00 AM')
      .replace(/{{Location}}/g, selectedProj?.location || 'our site sales office');
  };

  const [customText, setCustomText] = useState(generateMessage());

  // Update text when template or project changes
  const handleTemplateSelect = (tId: string) => {
    setSelectedTemplateId(tId);
    const t = templates.find((x) => x.id === tId);
    if (t) {
      setCustomText(
        t.template
          .replace(/{{LeadName}}/g, lead.name)
          .replace(/{{ProjectName}}/g, selectedProj?.name || 'our property project')
          .replace(/{{EmployeeName}}/g, currentUser.name)
          .replace(/{{SiteVisitDate}}/g, lead.siteVisitDate || 'upcoming Saturday')
          .replace(/{{SiteVisitTime}}/g, lead.siteVisitTime || '11:00 AM')
          .replace(/{{Location}}/g, selectedProj?.location || 'our site sales office')
      );
    }
  };

  const handleProjectSelect = (pId: string) => {
    setSelectedProjectId(pId);
    const p = activeProjects.find((x) => x.id === pId);
    if (currentTemplate) {
      setCustomText(
        currentTemplate.template
          .replace(/{{LeadName}}/g, lead.name)
          .replace(/{{ProjectName}}/g, p?.name || 'our property project')
          .replace(/{{EmployeeName}}/g, currentUser.name)
          .replace(/{{SiteVisitDate}}/g, lead.siteVisitDate || 'upcoming Saturday')
          .replace(/{{SiteVisitTime}}/g, lead.siteVisitTime || '11:00 AM')
          .replace(/{{Location}}/g, p?.location || 'our site sales office')
      );
    }
  };

  if (!isOpen) return null;

  const handleSend = () => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    CRMStorageService.logActivity({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      leadId: lead.id,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'WhatsApp Initiated',
      details: `Sent message template "${currentTemplate?.title || 'Custom'}" to ${lead.phone}`,
      timestamp: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-base font-bold">Send WhatsApp Message</h2>
              <p className="text-xs text-emerald-200">
                To: <span className="font-semibold text-white">{lead.name}</span> ({lead.phone})
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

        <div className="p-6 space-y-4">
          {/* Template Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Message Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleTemplateSelect(tpl.id)}
                  className={`p-2.5 text-left rounded-xl border text-xs transition ${
                    selectedTemplateId === tpl.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                  }`}
                >
                  <p className="truncate">{tpl.title}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Project Variable Association */}
          {activeProjects.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project Context (for {'{{ProjectName}}'} tag)
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.location})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message Preview & Editor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Message Content (Editable)
            </label>
            <textarea
              rows={5}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Opens WhatsApp Web or App directly for {lead.phone}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Launch WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
