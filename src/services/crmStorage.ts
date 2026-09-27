import {
  User,
  Project,
  Lead,
  LeadAllocation,
  SiteVisit,
  CallLog,
  ActivityLog,
  WonDeal,
  WhatsAppTemplate,
  PropertyCategory,
  MetaIntegrationConfig,
  MetaLeadForm,
  StageHistoryEntry,
  LeadTrackingNote,
} from '../types/crm';

const STORAGE_KEYS = {
  CURRENT_USER: 'km_crm_current_user',
  USERS: 'km_crm_users',
  PROJECTS: 'km_crm_projects',
  LEADS: 'km_crm_leads',
  SITE_VISITS: 'km_crm_site_visits',
  CALL_LOGS: 'km_crm_call_logs',
  ACTIVITY_LOGS: 'km_crm_activity_logs',
  WON_DEALS: 'km_crm_won_deals',
  TEMPLATES: 'km_crm_templates',
  META_CONFIG: 'km_crm_meta_config',
};

// Initial default staff users so authentication works out of the box
const DEFAULT_USERS: User[] = [
  {
    id: 'user-owner-1',
    name: 'Rich Rubinni',
    email: 'rich.rubinni@kmrealestate.com',
    phone: '+91 9820011223',
    role: 'owner',
    active: true,
    password: 'password123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-admin-1',
    name: 'Admin Manager',
    email: 'admin@kmrealestate.com',
    phone: '+91 9820022334',
    role: 'admin',
    active: true,
    password: 'password123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-setter-1',
    name: 'Rahul Sen (Setter)',
    email: 'setter@kmrealestate.com',
    phone: '+91 9820033445',
    role: 'setter',
    active: true,
    password: 'password123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-closer-1',
    name: 'Priya Nair (Closer)',
    email: 'closer@kmrealestate.com',
    phone: '+91 9820044556',
    role: 'closer',
    active: true,
    password: 'password123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-telecaller-1',
    name: 'Anjali Sharma (Telecaller)',
    email: 'telecaller@kmrealestate.com',
    phone: '+91 9820055667',
    role: 'telecaller',
    active: true,
    password: 'password123',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Initial Introduction',
    template: 'Hello {{LeadName}}, this is {{EmployeeName}} from KM Real Estate regarding your interest in {{ProjectName}}. When would be a convenient time to discuss your property requirements?',
  },
  {
    id: 'tpl-2',
    title: 'Site Visit Confirmation',
    template: 'Dear {{LeadName}}, your site visit for {{ProjectName}} has been scheduled for {{SiteVisitDate}} at {{SiteVisitTime}}. Location: {{Location}}. Please let us know if you require vehicle pickup assistance.',
  },
  {
    id: 'tpl-3',
    title: 'Follow-up on Proposal',
    template: 'Hi {{LeadName}}, hope you are doing well! Following up on our discussion regarding {{ProjectName}}. Do you have any questions regarding unit availability, pricing, or layout plans?',
  },
  {
    id: 'tpl-4',
    title: 'Site Visit Thank You',
    template: 'Dear {{LeadName}}, thank you for taking the time to visit {{ProjectName}} today. We hope you liked the location and amenities. Looking forward to assisting you with the next steps!',
  },
];

export class CRMStorageService {
  private static listeners: Set<() => void> = new Set();

  public static subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private static notifyChange() {
    this.listeners.forEach((cb) => cb());
  }

  // --- Authentication & Current User ---
  public static getCurrentUser(): User {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      try {
        const u: User = JSON.parse(raw);
        // Automatically sync owner name to Rich Rubinni if role is owner
        if (u.role === 'owner' && u.name !== 'Rich Rubinni') {
          u.name = 'Rich Rubinni';
          u.email = 'rich.rubinni@kmrealestate.com';
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(u));
        }
        return u;
      } catch {
        // fallback
      }
    }
    // Default to owner if not logged in
    const users = this.getUsers();
    const defaultUser = users.find((u) => u.role === 'owner') || users[0] || DEFAULT_USERS[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
    return defaultUser;
  }

  public static setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.notifyChange();
  }

  public static logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notifyChange();
  }

  // --- Users Management ---
  public static getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let users: User[] = [];
    if (!raw) {
      users = [...DEFAULT_USERS];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return users;
    }
    try {
      users = JSON.parse(raw);
    } catch {
      users = [...DEFAULT_USERS];
    }

    // Ensure owner is Rich Rubinni as requested by the user
    let modified = false;
    const owner = users.find((u) => u.role === 'owner' || u.id === 'user-owner-1');
    if (owner && (owner.name !== 'Rich Rubinni' || owner.email !== 'rich.rubinni@kmrealestate.com')) {
      owner.name = 'Rich Rubinni';
      owner.email = 'rich.rubinni@kmrealestate.com';
      modified = true;
    }

    // Ensure a default telecaller exists in the staff roster
    const hasTelecaller = users.some((u) => u.role === 'telecaller');
    if (!hasTelecaller) {
      users.push({
        id: 'user-telecaller-1',
        name: 'Anjali Sharma (Telecaller)',
        email: 'telecaller@kmrealestate.com',
        phone: '+91 9820055667',
        role: 'telecaller',
        active: true,
        password: 'password123',
        createdAt: new Date().toISOString(),
      });
      modified = true;
    }

    if (modified) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return users;
  }

  public static getActiveUsers(): User[] {
    return this.getUsers().filter((u) => u.active);
  }

  public static getSetters(): User[] {
    return this.getActiveUsers().filter((u) => u.role === 'setter' || u.role === 'telecaller' || u.role === 'admin' || u.role === 'owner');
  }

  public static getClosers(): User[] {
    return this.getActiveUsers().filter((u) => u.role === 'closer' || u.role === 'admin' || u.role === 'owner');
  }

  public static getTelecallers(): User[] {
    return this.getActiveUsers().filter((u) => u.role === 'telecaller' || u.role === 'setter');
  }

  public static saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // If updating current user, refresh session
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser(user);
    }
    this.notifyChange();
  }

  public static deleteUser(id: string): void {
    const users = this.getUsers().filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notifyChange();
  }

  // --- Projects Management ---
  public static getProjects(): Project[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static getActiveProjects(): Project[] {
    return this.getProjects().filter((p) => p.active && p.status !== 'Archived');
  }

  public static getProjectById(id: string): Project | undefined {
    return this.getProjects().find((p) => p.id === id);
  }

  public static saveProject(project: Project): void {
    const projects = this.getProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    project.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      projects[idx] = project;
    } else {
      projects.unshift(project);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    this.notifyChange();
  }

  public static archiveProject(id: string): void {
    const projects = this.getProjects();
    const p = projects.find((item) => item.id === id);
    if (p) {
      p.status = 'Archived';
      p.active = false;
      p.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      this.notifyChange();
    }
  }

  public static deleteProject(id: string): void {
    // Check if historical leads are allocated to this project
    const leads = this.getLeads();
    const hasAllocations = leads.some((l) => l.allocations.some((a) => a.projectId === id));
    if (hasAllocations) {
      // Archive instead so historical records are not broken
      this.archiveProject(id);
    } else {
      const projects = this.getProjects().filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      this.notifyChange();
    }
  }

  // --- Leads Management ---
  public static getLeads(): Lead[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static getLeadById(id: string): Lead | undefined {
    return this.getLeads().find((l) => l.id === id);
  }

  public static getVisibleLeads(user: User): Lead[] {
    const all = this.getLeads();
    if (user.role === 'owner' || user.role === 'admin') {
      return all;
    }

    if (user.role === 'setter') {
      // Setters strictly view leads assigned to them as setter
      return all.filter((l) => {
        const isLeadSetter = l.assignedSetterId === user.id;
        const hasAllocatedSetter = l.allocations.some((a) => a.assignedSetterId === user.id);
        return isLeadSetter || hasAllocatedSetter;
      });
    }

    if (user.role === 'closer') {
      // Closers strictly view leads assigned to them as closer
      return all.filter((l) => {
        const isLeadCloser = l.assignedCloserId === user.id;
        const hasAllocatedCloser = l.allocations.some((a) => a.assignedCloserId === user.id);
        return isLeadCloser || hasAllocatedCloser;
      });
    }

    if (user.role === 'telecaller') {
      // Telecallers strictly view leads assigned to them as telecaller
      return all.filter((l) => {
        const isLeadTelecaller = l.assignedTelecallerId === user.id;
        const isFallbackSetter = l.assignedSetterId === user.id && !l.assignedTelecallerId;
        return isLeadTelecaller || isFallbackSetter;
      });
    }

    return [];
  }

  // Duplicate Check
  public static findDuplicateLeads(phone: string, email?: string, name?: string, excludeLeadId?: string): Lead[] {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    const cleanEmail = email?.trim().toLowerCase();
    const cleanName = name?.trim().toLowerCase();

    return this.getLeads().filter((lead) => {
      if (excludeLeadId && lead.id === excludeLeadId) return false;
      const leadPhone = lead.phone.replace(/[^0-9]/g, '').slice(-10);
      const leadAltPhone = lead.alternatePhone?.replace(/[^0-9]/g, '').slice(-10);

      const phoneMatch = Boolean(cleanPhone && (leadPhone === cleanPhone || leadAltPhone === cleanPhone));
      const emailMatch = Boolean(cleanEmail && lead.email && lead.email.trim().toLowerCase() === cleanEmail);
      const namePhoneMatch = Boolean(cleanName && lead.name.trim().toLowerCase() === cleanName && phoneMatch);

      return phoneMatch || emailMatch || namePhoneMatch;
    });
  }

  public static saveLead(lead: Lead, actorUser?: User): void {
    const leads = this.getLeads();
    const idx = leads.findIndex((l) => l.id === lead.id);
    const now = new Date().toISOString();
    lead.updatedAt = now;

    // Resolve setter/closer/telecaller names if ids provided
    const users = this.getUsers();
    if (lead.assignedSetterId) {
      const u = users.find((x) => x.id === lead.assignedSetterId);
      if (u) lead.assignedSetterName = u.name;
    }
    if (lead.assignedCloserId) {
      const u = users.find((x) => x.id === lead.assignedCloserId);
      if (u) lead.assignedCloserName = u.name;
    }
    if (lead.assignedTelecallerId) {
      const u = users.find((x) => x.id === lead.assignedTelecallerId);
      if (u) lead.assignedTelecallerName = u.name;
    }

    if (idx >= 0) {
      const old = leads[idx];
      // Track stage history if changed
      if (old.status !== lead.status) {
        if (!lead.stageHistory) {
          lead.stageHistory = old.stageHistory ? [...old.stageHistory] : [];
        }
        lead.stageHistory.unshift({
          id: `sh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          fromStage: old.status,
          toStage: lead.status,
          changedByUserId: actorUser?.id || 'system',
          changedByUserName: actorUser?.name || 'Staff',
          timestamp: now,
        });

        this.logActivity({
          id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          leadId: lead.id,
          userId: actorUser?.id || 'system',
          userName: actorUser?.name || 'Staff',
          action: 'Status Change',
          details: `Stage updated from "${old.status}" to "${lead.status}"`,
          timestamp: now,
        });
      } else if (old.stageHistory && !lead.stageHistory) {
        lead.stageHistory = old.stageHistory;
      }
      leads[idx] = lead;
    } else {
      if (!lead.stageHistory || lead.stageHistory.length === 0) {
        lead.stageHistory = [
          {
            id: `sh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            fromStage: lead.status,
            toStage: lead.status,
            changedByUserId: actorUser?.id || 'system',
            changedByUserName: actorUser?.name || 'Staff',
            timestamp: now,
            note: `Initial capture via ${lead.source || 'Direct Inquiry'}`,
          },
        ];
      }
      leads.unshift(lead);
      this.logActivity({
        id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        leadId: lead.id,
        userId: actorUser?.id || 'system',
        userName: actorUser?.name || 'Staff',
        action: 'Lead Created',
        details: `New lead created from ${lead.source || 'Direct Inquiry'}`,
        timestamp: now,
      });
    }

    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    this.notifyChange();
  }

  public static deleteLead(id: string): void {
    const leads = this.getLeads().filter((l) => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    this.notifyChange();
  }

  // --- Multi-Project Lead Allocations ---
  public static addLeadAllocation(
    leadId: string,
    allocation: Omit<LeadAllocation, 'id' | 'createdAt' | 'updatedAt' | 'leadId'>,
    actorUser?: User
  ): { success: boolean; error?: string } {
    const lead = this.getLeadById(leadId);
    if (!lead) return { success: false, error: 'Lead not found' };

    // Check unit availability conflict if unit is specified
    if (allocation.unitPlotNumber) {
      const conflict = this.checkUnitConflict(allocation.projectId, allocation.unitPlotNumber);
      if (conflict) {
        return {
          success: false,
          error: `Unit/Plot "${allocation.unitPlotNumber}" is already assigned to lead "${conflict.leadName}" with status ${conflict.status}.`,
        };
      }
    }

    const projects = this.getProjects();
    const proj = projects.find((p) => p.id === allocation.projectId);
    const users = this.getUsers();

    const closer = allocation.assignedCloserId ? users.find((u) => u.id === allocation.assignedCloserId) : undefined;
    const setter = allocation.assignedSetterId ? users.find((u) => u.id === allocation.assignedSetterId) : undefined;

    const newAlloc: LeadAllocation = {
      ...allocation,
      id: `alloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      leadId,
      projectName: proj?.name || 'Unspecified Project',
      assignedCloserName: closer?.name,
      assignedSetterName: setter?.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    lead.allocations.push(newAlloc);
    this.saveLead(lead, actorUser);

    this.logActivity({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      leadId: lead.id,
      userId: actorUser?.id || 'system',
      userName: actorUser?.name || 'Staff',
      action: 'Project Allocated',
      details: `Allocated to "${newAlloc.projectName}" ${newAlloc.unitPlotNumber ? `(Unit ${newAlloc.unitPlotNumber})` : ''}`,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  public static updateLeadAllocation(
    leadId: string,
    allocationId: string,
    updates: Partial<LeadAllocation>,
    actorUser?: User
  ): { success: boolean; error?: string } {
    const lead = this.getLeadById(leadId);
    if (!lead) return { success: false, error: 'Lead not found' };

    const idx = lead.allocations.findIndex((a) => a.id === allocationId);
    if (idx === -1) return { success: false, error: 'Allocation not found' };

    const currentAlloc = lead.allocations[idx];

    // Check unit conflict if changing unit
    if (updates.unitPlotNumber && updates.unitPlotNumber !== currentAlloc.unitPlotNumber) {
      const conflict = this.checkUnitConflict(updates.projectId || currentAlloc.projectId, updates.unitPlotNumber, allocationId);
      if (conflict) {
        return {
          success: false,
          error: `Unit/Plot "${updates.unitPlotNumber}" is already reserved by ${conflict.leadName}`,
        };
      }
    }

    const updatedAlloc: LeadAllocation = {
      ...currentAlloc,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If status changed to Won, move to Won Ledger & decrement project inventory
    if (updatedAlloc.status === 'Won' && currentAlloc.status !== 'Won') {
      this.recordWonDeal(lead, updatedAlloc, actorUser);
      lead.status = 'Won';
    }

    lead.allocations[idx] = updatedAlloc;
    this.saveLead(lead, actorUser);

    this.logActivity({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      leadId: lead.id,
      userId: actorUser?.id || 'system',
      userName: actorUser?.name || 'Staff',
      action: 'Allocation Updated',
      details: `Project "${updatedAlloc.projectName}" stage: ${updatedAlloc.status}`,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  public static removeLeadAllocation(leadId: string, allocationId: string): void {
    const lead = this.getLeadById(leadId);
    if (!lead) return;
    lead.allocations = lead.allocations.filter((a) => a.id !== allocationId);
    this.saveLead(lead);
  }

  private static checkUnitConflict(projectId: string, unitNumber: string, excludeAllocationId?: string): { leadName: string; status: string } | null {
    const leads = this.getLeads();
    const cleanUnit = unitNumber.trim().toLowerCase();

    for (const l of leads) {
      for (const a of l.allocations) {
        if (excludeAllocationId && a.id === excludeAllocationId) continue;
        if (a.projectId === projectId && a.unitPlotNumber?.trim().toLowerCase() === cleanUnit) {
          if (['Token Paid', 'Booked', 'Won', 'Negotiation'].includes(a.status)) {
            return { leadName: l.name, status: a.status };
          }
        }
      }
    }
    return null;
  }

  // --- Won Deals Ledger ---
  public static getWonDeals(): WonDeal[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WON_DEALS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static getVisibleWonDeals(user: User): WonDeal[] {
    const deals = this.getWonDeals();
    if (user.role === 'owner' || user.role === 'admin') return deals;
    return deals.filter((d) => d.closerId === user.id || d.setterId === user.id);
  }

  public static recordWonDeal(lead: Lead, alloc: LeadAllocation, closerUser?: User): void {
    const wonDeals = this.getWonDeals();
    const dealValue = alloc.expectedClosingValue || alloc.quotedPrice || lead.budgetNum || 0;

    const wonDeal: WonDeal = {
      id: `won-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      allocationId: alloc.id,
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      leadEmail: lead.email,
      projectId: alloc.projectId,
      projectName: alloc.projectName || 'Unspecified Project',
      category: alloc.propertyCategory,
      unitPlotNumber: alloc.unitPlotNumber || 'General Allotment',
      dealValue,
      closedDate: new Date().toISOString().split('T')[0],
      closerId: alloc.assignedCloserId || closerUser?.id || 'system',
      closerName: alloc.assignedCloserName || closerUser?.name || 'Staff',
      setterId: alloc.assignedSetterId || lead.assignedSetterId,
      setterName: alloc.assignedSetterName || lead.assignedSetterName,
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    wonDeals.unshift(wonDeal);
    localStorage.setItem(STORAGE_KEYS.WON_DEALS, JSON.stringify(wonDeals));

    // Update Project inventory: increment soldUnits, decrement availableUnits
    const projects = this.getProjects();
    const p = projects.find((x) => x.id === alloc.projectId);
    if (p) {
      p.soldUnits = (p.soldUnits || 0) + 1;
      if (p.availableUnits > 0) {
        p.availableUnits -= 1;
      }
      this.saveProject(p);
    }
  }

  // --- Site Visits & Calendar ---
  public static getSiteVisits(): SiteVisit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SITE_VISITS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static getVisibleSiteVisits(user: User): SiteVisit[] {
    const visits = this.getSiteVisits();
    if (user.role === 'owner' || user.role === 'admin') return visits;
    return visits.filter((v) => v.assignedEmployeeId === user.id || v.assignedCloserId === user.id);
  }

  public static saveSiteVisit(visit: SiteVisit, actorUser?: User): void {
    const visits = this.getSiteVisits();
    const idx = visits.findIndex((v) => v.id === visit.id);
    if (idx >= 0) {
      visits[idx] = visit;
    } else {
      visits.unshift(visit);
    }
    localStorage.setItem(STORAGE_KEYS.SITE_VISITS, JSON.stringify(visits));

    // Update lead site visit details
    const lead = this.getLeadById(visit.leadId);
    if (lead) {
      lead.siteVisitDate = visit.date;
      lead.siteVisitTime = visit.time;
      if (visit.status === 'Completed' && lead.status !== 'Won' && lead.status !== 'Booked') {
        lead.status = 'Site Visit Completed';
      } else if (lead.status === 'New' || lead.status === 'Contacted' || lead.status === 'Interested') {
        lead.status = 'Site Visit Scheduled';
      }
      this.saveLead(lead, actorUser);
    }

    this.notifyChange();
  }

  public static deleteSiteVisit(id: string): void {
    const visits = this.getSiteVisits().filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.SITE_VISITS, JSON.stringify(visits));
    this.notifyChange();
  }

  // --- Call Logging ---
  public static getCallLogs(): CallLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CALL_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static getVisibleCallLogs(user: User): CallLog[] {
    const logs = this.getCallLogs();
    if (user.role === 'owner' || user.role === 'admin') return logs;
    return logs.filter((c) => c.userId === user.id);
  }

  public static saveCallLog(log: CallLog): void {
    const logs = this.getCallLogs();
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(logs));

    // Update lead follow up if entered
    const lead = this.getLeadById(log.leadId);
    if (lead) {
      if (log.nextFollowUpDate) {
        lead.nextFollowUpDate = log.nextFollowUpDate;
        lead.nextFollowUpTime = log.nextFollowUpTime || '11:00';
      }
      if (lead.status === 'New') {
        lead.status = 'Contacted';
      }
      this.saveLead(lead);

      this.logActivity({
        id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        leadId: lead.id,
        userId: log.userId,
        userName: log.userName,
        action: 'Call Logged',
        details: `Outcome: ${log.outcome}. Notes: ${log.notes || 'None'}`,
        timestamp: new Date().toISOString(),
      });
    }

    this.notifyChange();
  }

  // --- Activity Logs ---
  public static getActivityLogs(): ActivityLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static logActivity(log: ActivityLog): void {
    const logs = this.getActivityLogs();
    logs.unshift(log);
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
  }

  // --- WhatsApp Templates ---
  public static getWhatsAppTemplates(): WhatsAppTemplate[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
      return DEFAULT_TEMPLATES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_TEMPLATES;
    }
  }

  public static saveWhatsAppTemplates(templates: WhatsAppTemplate[]): void {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    this.notifyChange();
  }

  public static buildWhatsAppUrl(
    phone: string,
    templateText: string,
    vars: {
      leadName: string;
      projectName?: string;
      employeeName?: string;
      siteVisitDate?: string;
      siteVisitTime?: string;
      location?: string;
    }
  ): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let text = templateText
      .replace(/{{LeadName}}/g, vars.leadName || 'Valued Client')
      .replace(/{{ProjectName}}/g, vars.projectName || 'our premium property')
      .replace(/{{EmployeeName}}/g, vars.employeeName || 'KM Real Estate Team')
      .replace(/{{SiteVisitDate}}/g, vars.siteVisitDate || 'the requested date')
      .replace(/{{SiteVisitTime}}/g, vars.siteVisitTime || 'the scheduled time')
      .replace(/{{Location}}/g, vars.location || 'our site office');

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  // --- Follow-Up Reminders Automation ---
  public static getPendingFollowUps(user: User): { overdue: Lead[]; today: Lead[]; upcoming: Lead[] } {
    const visibleLeads = this.getVisibleLeads(user);
    const todayStr = new Date().toISOString().split('T')[0];

    const overdue: Lead[] = [];
    const today: Lead[] = [];
    const upcoming: Lead[] = [];

    for (const lead of visibleLeads) {
      if (!lead.nextFollowUpDate || lead.status === 'Won' || lead.status === 'Lost' || lead.status === 'Archived') {
        continue;
      }
      if (lead.nextFollowUpDate < todayStr) {
        overdue.push(lead);
      } else if (lead.nextFollowUpDate === todayStr) {
        today.push(lead);
      } else {
        upcoming.push(lead);
      }
    }

    return { overdue, today, upcoming };
  }

  // --- Dynamic Dashboard KPIs ---
  public static getDashboardMetrics(user: User) {
    const leads = this.getVisibleLeads(user);
    const visits = this.getVisibleSiteVisits(user);
    const wonDeals = this.getWonDeals();
    const projects = this.getActiveProjects();
    const followUps = this.getPendingFollowUps(user);

    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === 'New').length;
    const hotLeads = leads.filter((l) => l.interestLevel === 'Hot').length;
    const warmLeads = leads.filter((l) => l.interestLevel === 'Warm').length;

    const visitsScheduled = visits.filter((v) => v.status === 'Scheduled' || v.status === 'Confirmed').length;
    const visitsCompleted = visits.filter((v) => v.status === 'Completed').length;

    const activeDeals = leads.filter((l) =>
      ['Site Visit Completed', 'Negotiation', 'Token Pending', 'Booked'].includes(l.status)
    ).length;

    const bookings = leads.filter((l) => l.status === 'Booked' || l.status === 'Token Pending').length;

    // Calculate total pipeline value from allocations or lead budget
    let pipelineValue = 0;
    leads.forEach((l) => {
      if (l.status !== 'Won' && l.status !== 'Lost' && l.status !== 'Archived') {
        if (l.allocations && l.allocations.length > 0) {
          l.allocations.forEach((a) => {
            pipelineValue += a.expectedClosingValue || a.quotedPrice || 0;
          });
        } else if (l.budgetNum) {
          pipelineValue += l.budgetNum;
        }
      }
    });

    const wonValue = wonDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0);
    const totalWonDeals = wonDeals.length;

    const totalAvailableUnits = projects.reduce((sum, p) => sum + (p.availableUnits || 0), 0);
    const totalSoldUnits = projects.reduce((sum, p) => sum + (p.soldUnits || 0), 0);

    return {
      totalLeads,
      newLeads,
      hotLeads,
      warmLeads,
      visitsScheduled,
      visitsCompleted,
      followUpsDueToday: followUps.today.length,
      followUpsOverdue: followUps.overdue.length,
      activeDeals,
      bookings,
      wonDealsCount: totalWonDeals,
      pipelineValue,
      wonValue,
      totalAvailableUnits,
      totalSoldUnits,
      hasData: totalLeads > 0 || projects.length > 0 || wonDeals.length > 0,
    };
  }

  // --- Reset & Clean Starter Actions ---
  public static resetToEmptyCRM(): void {
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.SITE_VISITS);
    localStorage.removeItem(STORAGE_KEYS.CALL_LOGS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
    localStorage.removeItem(STORAGE_KEYS.WON_DEALS);
    // keep users and templates intact
    this.notifyChange();
  }

  public static seedSampleWorkspace(): void {
    // Only if user explicitly requests it from settings
    const sampleProjects: Project[] = [
      {
        id: 'proj-1',
        name: 'Skyline Palms Residency',
        category: 'Apartments',
        subtype: 'Luxury High-Rise',
        location: 'Sector 45, Golf Course Extension',
        minPrice: 8500000,
        maxPrice: 24000000,
        priceDisplay: '₹85 Lakh - ₹2.40 Cr',
        totalUnits: 64,
        availableUnits: 42,
        soldUnits: 22,
        description: 'Premium 3 & 4 BHK luxury residences with rooftop clubhouse and infinity pool.',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
        amenities: ['Clubhouse', 'Swimming Pool', 'EV Charging', '24/7 Concierge', 'Landscaped Garden'],
        contactPerson: 'Mr. Arvind',
        contactPhone: '+91 9811223344',
        status: 'Active',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'proj-2',
        name: 'Royal Heritage Villa Greens',
        category: 'Villas',
        subtype: 'Gated Community Villa',
        location: 'Southern Express Corridor',
        minPrice: 15000000,
        maxPrice: 38000000,
        priceDisplay: '₹1.50 Cr - ₹3.80 Cr',
        totalUnits: 30,
        availableUnits: 14,
        soldUnits: 16,
        description: 'Exquisite independent Spanish & Contemporary villas with private gardens.',
        imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80',
        amenities: ['Private Pool', 'Security Guarded', 'Tennis Court', 'Solar Backed', 'Park'],
        contactPerson: 'Ms. Megha',
        contactPhone: '+91 9833445566',
        status: 'Active',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'proj-3',
        name: 'Cedar Valley Agro Farm Plots',
        category: 'Farm Land',
        subtype: 'Weekend Farm Land',
        location: 'Hills Foothills Road, Mile 18',
        minPrice: 3500000,
        maxPrice: 8500000,
        priceDisplay: '₹35 Lakh - ₹85 Lakh',
        totalUnits: 40,
        availableUnits: 26,
        soldUnits: 14,
        description: 'Gated organic farm plots with plantation management and weekend stay cottage permissions.',
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
        amenities: ['Drip Irrigation', 'Fencing & Gate', 'Organic Orchard', 'Clubhouse & Cafe'],
        contactPerson: 'Mr. Suresh',
        contactPhone: '+91 9844556677',
        status: 'Active',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(sampleProjects));
    this.notifyChange();
  }

  // --- Lead Tracking & Audit Trail ---
  public static addLeadTrackingNote(
    leadId: string,
    note: Omit<LeadTrackingNote, 'id' | 'timestamp'>,
    actorUser?: User
  ): void {
    const lead = this.getLeadById(leadId);
    if (!lead) return;
    const now = new Date().toISOString();
    const newNote: LeadTrackingNote = {
      id: `tn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      ...note,
    };
    if (!lead.trackingNotes) lead.trackingNotes = [];
    lead.trackingNotes.unshift(newNote);
    this.saveLead(lead, actorUser);

    this.logActivity({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      leadId,
      userId: note.userId,
      userName: note.userName,
      action: `Tracking Note [${note.noteType}]`,
      details: note.content,
      timestamp: now,
    });
  }

  public static getLeadTrackingSummary(leadId: string) {
    const lead = this.getLeadById(leadId);
    const callLogs = this.getCallLogs().filter((c) => c.leadId === leadId);
    const siteVisits = this.getSiteVisits().filter((v) => v.leadId === leadId);
    const activityLogs = this.getActivityLogs().filter((a) => a.leadId === leadId);
    return {
      lead,
      callLogs,
      siteVisits,
      activityLogs,
      totalTouchpoints: callLogs.length + siteVisits.length + (lead?.trackingNotes?.length || 0),
    };
  }

  // --- Meta (Facebook & Instagram Lead Ads) Integration ---
  public static getMetaConfig(): MetaIntegrationConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.META_CONFIG);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://crm.kmrealestate.com';
    const defaultConfig: MetaIntegrationConfig = {
      isConnected: true, // Connected so user can immediately use Meta Ads features
      pageId: '109283746192834',
      pageName: 'KM Real Estate Promoters & Developers',
      adAccountId: 'act_492019481029481',
      instagramAccount: '@km_realestate_official',
      accessToken: 'EAAGm0PX4ZCpsBAK7ZCZB3wE9f38xLpQ8210398kM...',
      webhookVerifyToken: 'km_meta_verify_token_982a1',
      webhookUrl: `${origin}/api/webhooks/meta-lead-gen`,
      autoSync: true,
      syncIntervalMinutes: 5,
      lastSyncTime: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      totalLeadsSynced: 12,
      defaultAssignedRole: 'telecaller',
      defaultUserId: 'user-telecaller-1',
      forms: [
        {
          id: 'form_8921820',
          name: 'KM Luxury Villas - Instant Brochure Form',
          leadsCount: 5,
          active: true,
          projectMappingId: 'proj-2',
        },
        {
          id: 'form_9019283',
          name: 'KM Green Valley Plots - Price List Request',
          leadsCount: 4,
          active: true,
          projectMappingId: 'proj-1',
        },
        {
          id: 'form_7291823',
          name: 'Cedar Agro Farm Land - Site Visit Registration',
          leadsCount: 3,
          active: true,
          projectMappingId: 'proj-3',
        },
      ],
    };

    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.META_CONFIG, JSON.stringify(defaultConfig));
      return defaultConfig;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return defaultConfig;
    }
  }

  public static saveMetaConfig(config: MetaIntegrationConfig): void {
    localStorage.setItem(STORAGE_KEYS.META_CONFIG, JSON.stringify(config));
    this.notifyChange();
  }

  public static connectMeta(partial?: Partial<MetaIntegrationConfig>): MetaIntegrationConfig {
    const current = this.getMetaConfig();
    const updated: MetaIntegrationConfig = {
      ...current,
      ...partial,
      isConnected: true,
      lastSyncTime: new Date().toISOString(),
    };
    this.saveMetaConfig(updated);
    return updated;
  }

  public static disconnectMeta(): void {
    const current = this.getMetaConfig();
    current.isConnected = false;
    this.saveMetaConfig(current);
  }

  public static syncMetaLeads(): { newCount: number; leads: Lead[] } {
    const config = this.getMetaConfig();
    const users = this.getUsers();
    const telecaller = users.find((u) => u.role === 'telecaller') || users.find((u) => u.role === 'setter') || users[0];
    const projects = this.getActiveProjects();

    const sampleMetaCandidates = [
      {
        name: 'Vikramaditya Rathore',
        phone: '+91 9823412091',
        email: 'vikram.rathore@gmail.com',
        location: 'Golf Course Road, Gurgaon',
        budget: '₹1.5 - 2.5 Cr',
        budgetNum: 20000000,
        propertyType: 'Villas' as PropertyCategory,
        formName: 'KM Luxury Villas - Instant Brochure Form',
        campaignName: 'KM Instagram Reel Ads - Luxury Villa Walkthrough',
        platform: 'instagram' as const,
        notes: 'Requested brochure and site tour for 4 BHK Spanish Villa. Prefers corner plot.',
      },
      {
        name: 'Sonalika Bannerjee',
        phone: '+91 9845091823',
        email: 'sonalika.b@outlook.com',
        location: 'Indiranagar / Whitefield',
        budget: '₹60 - 85 Lakh',
        budgetNum: 7500000,
        propertyType: 'Plots' as PropertyCategory,
        formName: 'KM Green Valley Plots - Price List Request',
        campaignName: 'Facebook Feed - Gated Community Plots',
        platform: 'facebook' as const,
        notes: 'Submitted Meta Lead form. Inquiring about immediate registry and bank loan approval.',
      },
      {
        name: 'Dr. Anand Mahajan',
        phone: '+91 9819920192',
        email: 'dr.anand.mahajan@aiims.edu',
        location: 'South Extension, Delhi',
        budget: '₹50 Lakh - ₹1 Cr',
        budgetNum: 8000000,
        propertyType: 'Farm Land' as PropertyCategory,
        formName: 'Cedar Agro Farm Land - Site Visit Registration',
        campaignName: 'Meta Advantage+ Weekend Farm Land Campaign',
        platform: 'facebook' as const,
        notes: 'Looking for 1 acre agricultural farm plot for weekend plantation retreat. Requested Sunday site visit.',
      },
    ];

    const currentLeads = this.getLeads();
    const addedLeads: Lead[] = [];

    sampleMetaCandidates.forEach((cand, idx) => {
      const exists = currentLeads.some(
        (l) => l.phone.replace(/[^0-9]/g, '').slice(-10) === cand.phone.replace(/[^0-9]/g, '').slice(-10)
      );
      if (!exists) {
        const leadId = `lead-meta-${Date.now()}-${idx}`;
        const newLead: Lead = {
          id: leadId,
          name: cand.name,
          phone: cand.phone,
          email: cand.email,
          location: cand.location,
          budget: cand.budget,
          budgetNum: cand.budgetNum,
          source: cand.platform === 'instagram' ? 'Meta Ads (Instagram)' : 'Meta Ads (Facebook)',
          propertyType: cand.propertyType,
          interestLevel: 'Hot',
          priority: 'High',
          status: 'New',
          assignedTelecallerId: telecaller?.id,
          assignedTelecallerName: telecaller?.name,
          notes: cand.notes,
          allocations: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['Meta Ads', cand.platform === 'instagram' ? 'Instagram Lead' : 'Facebook Lead', 'Instant Form'],
          metaCampaignName: cand.campaignName,
          metaFormId: `meta-form-${idx + 1}`,
          metaLeadId: `leadgen_${Date.now()}_${idx}`,
          metaPlatform: cand.platform,
          stageHistory: [
            {
              id: `sh-meta-${Date.now()}-${idx}`,
              fromStage: 'New',
              toStage: 'New',
              changedByUserId: 'system-meta-webhook',
              changedByUserName: 'Meta Lead Ads Webhook',
              timestamp: new Date().toISOString(),
              note: `Ingested from Meta Lead Ad Form: "${cand.formName}" [Campaign: ${cand.campaignName}]`,
            },
          ],
        };

        const matchedProj = projects.find((p) => p.category === cand.propertyType) || projects[0];
        if (matchedProj) {
          newLead.allocations.push({
            id: `alloc-meta-${Date.now()}-${idx}`,
            leadId,
            projectId: matchedProj.id,
            projectName: matchedProj.name,
            propertyCategory: matchedProj.category,
            status: 'Draft',
            quotedPrice: matchedProj.minPrice,
            expectedClosingValue: matchedProj.minPrice,
            assignedTelecallerId: telecaller?.id,
            assignedTelecallerName: telecaller?.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: `Auto-routed from Meta Ad campaign: ${cand.campaignName}`,
          });
        }

        this.saveLead(newLead, { id: 'meta-webhook', name: 'Meta Ads Webhook', role: 'admin' } as any);
        addedLeads.push(newLead);
      }
    });

    config.lastSyncTime = new Date().toISOString();
    config.totalLeadsSynced = (config.totalLeadsSynced || 0) + addedLeads.length;
    this.saveMetaConfig(config);

    return { newCount: addedLeads.length, leads: addedLeads };
  }

  public static simulateIncomingMetaLead(params: {
    name: string;
    phone: string;
    email?: string;
    location?: string;
    budget?: string;
    propertyType?: PropertyCategory;
    formName?: string;
    campaignName?: string;
    platform?: 'facebook' | 'instagram';
    projectId?: string;
    notes?: string;
  }): Lead {
    const config = this.getMetaConfig();
    const users = this.getUsers();
    const telecaller =
      users.find((u) => u.id === config.defaultUserId) ||
      users.find((u) => u.role === 'telecaller') ||
      users[0];
    const projects = this.getActiveProjects();
    const selectedProj = params.projectId ? projects.find((p) => p.id === params.projectId) : projects[0];

    const leadId = `lead-meta-${Date.now()}`;
    const newLead: Lead = {
      id: leadId,
      name: params.name || 'New Meta Lead',
      phone: params.phone,
      email: params.email,
      location: params.location || 'City',
      budget: params.budget || '₹50 Lakh - ₹1 Cr',
      budgetNum: 5000000,
      source: params.platform === 'instagram' ? 'Meta Ads (Instagram)' : 'Meta Ads (Facebook)',
      propertyType: params.propertyType || (selectedProj ? selectedProj.category : 'Plots'),
      interestLevel: 'Hot',
      priority: 'High',
      status: 'New',
      assignedTelecallerId: telecaller?.id,
      assignedTelecallerName: telecaller?.name,
      notes: params.notes || `Submitted Meta Lead Gen Form: "${params.formName || 'Instant Inquiry Form'}"`,
      allocations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['Meta Ads', params.platform === 'instagram' ? 'Instagram Lead' : 'Facebook Lead', 'Instant Form'],
      metaCampaignName: params.campaignName || 'KM Meta Ads High Intent Campaign',
      metaFormId: `meta-form-${Date.now()}`,
      metaLeadId: `leadgen_${Date.now()}`,
      metaPlatform: params.platform || 'facebook',
      stageHistory: [
        {
          id: `sh-${Date.now()}`,
          fromStage: 'New',
          toStage: 'New',
          changedByUserId: 'meta-webhook',
          changedByUserName: 'Meta Graph API Webhook',
          timestamp: new Date().toISOString(),
          note: `Real-time Lead Ads webhook trigger from ${params.platform === 'instagram' ? 'Instagram' : 'Facebook'}`,
        },
      ],
    };

    if (selectedProj) {
      newLead.allocations.push({
        id: `alloc-meta-${Date.now()}`,
        leadId,
        projectId: selectedProj.id,
        projectName: selectedProj.name,
        propertyCategory: selectedProj.category,
        status: 'Draft',
        quotedPrice: selectedProj.minPrice,
        expectedClosingValue: selectedProj.minPrice,
        assignedTelecallerId: telecaller?.id,
        assignedTelecallerName: telecaller?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: `Auto-routed from Meta Form: ${params.formName || 'Lead Gen'}`,
      });
    }

    this.saveLead(newLead, { id: 'meta-webhook', name: 'Meta Ads Webhook', role: 'admin' } as any);

    config.totalLeadsSynced = (config.totalLeadsSynced || 0) + 1;
    config.lastSyncTime = new Date().toISOString();
    this.saveMetaConfig(config);

    return newLead;
  }
}
