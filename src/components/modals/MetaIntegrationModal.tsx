import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Send,
  Sparkles,
  Layers,
  Phone,
  UserCheck,
  Globe,
  Facebook,
  Instagram,
  Zap,
  Radio,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { User, Project, PropertyCategory, MetaIntegrationConfig } from '../../types/crm';
import { CRMStorageService } from '../../services/crmStorage';

interface MetaIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  activeProjects: Project[];
  activeUsers: User[];
  onLeadsUpdated?: () => void;
}

export const MetaIntegrationModal: React.FC<MetaIntegrationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeProjects,
  activeUsers,
  onLeadsUpdated,
}) => {
  const [config, setConfig] = useState<MetaIntegrationConfig>(() =>
    CRMStorageService.getMetaConfig()
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Test Lead Form state
  const [testLeadName, setTestLeadName] = useState('Rahul Verma');
  const [testLeadPhone, setTestLeadPhone] = useState('+91 9876543210');
  const [testLeadEmail, setTestLeadEmail] = useState('rahul.verma@gmail.com');
  const [testPlatform, setTestPlatform] = useState<'facebook' | 'instagram'>('facebook');
  const [testPropertyType, setTestPropertyType] = useState<PropertyCategory>('Plots');
  const [testBudget, setTestBudget] = useState('₹45 Lakh - ₹75 Lakh');
  const [testProjectId, setTestProjectId] = useState(activeProjects[0]?.id || '');
  const [testFormName, setTestFormName] = useState('KM Green Valley Plots - Price List Request');
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleConnection = () => {
    if (config.isConnected) {
      if (window.confirm('Disconnect Meta Lead Ads integration? Incoming Facebook & Instagram leads will be paused.')) {
        CRMStorageService.disconnectMeta();
        setConfig(CRMStorageService.getMetaConfig());
      }
    } else {
      const updated = CRMStorageService.connectMeta();
      setConfig(updated);
    }
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setSyncResult(null);
    setTimeout(() => {
      const res = CRMStorageService.syncMetaLeads();
      const updatedCfg = CRMStorageService.getMetaConfig();
      setConfig(updatedCfg);
      setIsSyncing(false);
      setSyncResult(
        res.newCount > 0
          ? `Successfully synced ${res.newCount} new lead(s) from Meta Business Suite!`
          : 'All Meta ad leads are already up-to-date (no new incoming submissions).'
      );
      if (onLeadsUpdated) onLeadsUpdated();
      setTimeout(() => setSyncResult(null), 4000);
    }, 700);
  };

  const handleSimulateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testLeadName.trim() || !testLeadPhone.trim()) {
      alert('Please enter client name and valid phone number.');
      return;
    }

    const createdLead = CRMStorageService.simulateIncomingMetaLead({
      name: testLeadName,
      phone: testLeadPhone,
      email: testLeadEmail,
      budget: testBudget,
      propertyType: testPropertyType,
      platform: testPlatform,
      projectId: testProjectId,
      formName: testFormName,
      campaignName: testPlatform === 'instagram' 
        ? 'Instagram Stories & Reels - Luxury Realty Showcase'
        : 'Facebook Feed - Gated Community Plots Campaign',
      notes: `Real-time simulated lead ad submission via ${testPlatform === 'instagram' ? 'Instagram' : 'Facebook'}. Interested in ${testPropertyType}.`,
    });

    const updatedCfg = CRMStorageService.getMetaConfig();
    setConfig(updatedCfg);

    setTestSuccessMessage(
      `Lead "${createdLead.name}" ingested live from Meta! Routed to ${createdLead.assignedTelecallerName || 'Telecaller'}.`
    );
    if (onLeadsUpdated) onLeadsUpdated();

    setTimeout(() => setTestSuccessMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Meta Ads Integration</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    config.isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      config.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {config.isConnected ? 'Live & Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Direct lead synchronization from Facebook Pages & Instagram Business Lead Generation Ads
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* Status Ribbon & Quick Sync */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Facebook className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Instagram className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{config.pageName}</p>
                <p className="text-slate-500 text-[11px]">
                  Instagram: <span className="font-semibold text-slate-700">{config.instagramAccount}</span> • Ad Account: <span className="font-mono text-slate-700">{config.adAccountId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || !config.isConnected}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Leads Now'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleConnection}
                className={`px-3 py-2 rounded-xl font-bold border transition ${
                  config.isConnected
                    ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                    : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700'
                }`}
              >
                {config.isConnected ? 'Disconnect' : 'Connect Meta'}
              </button>
            </div>
          </div>

          {syncResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncResult}</span>
            </div>
          )}

          {/* Integration Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Total Synced Leads</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{config.totalLeadsSynced}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Active Lead Forms</span>
              <p className="text-xl font-black text-blue-600 mt-0.5">{config.forms.length}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Auto-Sync Status</span>
              <p className="text-xs font-bold text-emerald-700 mt-1.5 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                Listening (Every 5m)
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">Last Synced</span>
              <p className="text-xs font-bold text-slate-700 mt-1.5 truncate">
                {config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
              </p>
            </div>
          </div>

          {/* Webhook Configuration Details for Developers */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                Meta Webhook Endpoint (Facebook Graph API)
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Subscription: leadgen</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Callback URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={config.webhookUrl}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-[11px] text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(config.webhookUrl, 'url')}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-700 flex items-center gap-1 transition"
                  >
                    {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'url' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Verify Token
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={config.webhookVerifyToken}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-[11px] text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(config.webhookVerifyToken, 'token')}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-700 flex items-center gap-1 transition"
                  >
                    {copiedField === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'token' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Lead Forms & Project Mapping */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              Connected Meta Instant Forms & Project Routing
            </h4>
            <div className="space-y-2">
              {config.forms.map((form) => (
                <div
                  key={form.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{form.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Form ID: {form.id} • {form.leadsCount} leads ingested
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      Auto-Allocated
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Test Lead Generator (Simulate Live Meta Lead Ad) */}
          <div className="p-5 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 rounded-3xl border border-blue-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-blue-950 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Test Live Meta Lead Ad (Webhook Simulator)
                </h4>
                <p className="text-[11px] text-blue-800/80">
                  Simulate an instant customer response from Facebook or Instagram Feed / Reels Ad to verify real-time ingestion
                </p>
              </div>
            </div>

            {testSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{testSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSimulateWebhook} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">
                    Client Full Name
                  </label>
                  <input
                    type="text"
                    value={testLeadName}
                    onChange={(e) => setTestLeadName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={testLeadPhone}
                    onChange={(e) => setTestLeadPhone(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">
                    Ad Platform
                  </label>
                  <select
                    value={testPlatform}
                    onChange={(e) => setTestPlatform(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="facebook">Facebook Feed / Stories</option>
                    <option value="instagram">Instagram Reels / Feed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">
                    Property Category
                  </label>
                  <select
                    value={testPropertyType}
                    onChange={(e) => setTestPropertyType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Plots">Plots</option>
                    <option value="Apartments">Apartments</option>
                    <option value="Villas">Villas</option>
                    <option value="Farm Land">Farm Land</option>
                    <option value="Individual House">Individual House</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">
                    Budget Bracket
                  </label>
                  <input
                    type="text"
                    value={testBudget}
                    onChange={(e) => setTestBudget(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">
                    Target Project Allocation
                  </label>
                  <select
                    value={testProjectId}
                    onChange={(e) => setTestProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600"
                  >
                    {activeProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Test Meta Lead Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            KM Real Estate CRM • Connected to Meta Graph API v20.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
