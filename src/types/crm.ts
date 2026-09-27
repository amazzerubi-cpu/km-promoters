export type UserRole = 'owner' | 'admin' | 'setter' | 'closer' | 'telecaller';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  avatar?: string;
  password?: string;
  createdAt: string;
}

export type PropertyCategory = 
  | 'Plots'
  | 'Apartments'
  | 'Villas'
  | 'Farm Land'
  | 'Resale Property'
  | 'Individual House';

export type FarmLandSubtype =
  | 'Agricultural Land'
  | 'Farm Plot'
  | 'Farm House Land'
  | 'Orchard Land'
  | 'Investment Farm Land'
  | 'Weekend Farm Land';

export type ProjectStatus = 'Active' | 'Upcoming' | 'Completed' | 'Archived';

export interface Project {
  id: string;
  name: string;
  category: PropertyCategory;
  subtype?: string;
  location: string;
  minPrice: number;
  maxPrice: number;
  priceDisplay?: string;
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
  description: string;
  imageUrl?: string;
  amenities: string[];
  contactPerson?: string;
  contactPhone?: string;
  status: ProjectStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Details Requested'
  | 'Location Requested'
  | 'Site Visit Requested'
  | 'Site Visit Scheduled'
  | 'Site Visit Completed'
  | 'Negotiation'
  | 'Token Pending'
  | 'Booked'
  | 'Won'
  | 'Lost'
  | 'Not Interested'
  | 'Follow-up'
  | 'Archived';

export type LeadPriority = 'High' | 'Medium' | 'Low';
export type InterestLevel = 'Hot' | 'Warm' | 'Cold';

export interface LeadAllocation {
  id: string;
  leadId: string;
  projectId: string;
  projectName?: string;
  propertyCategory: PropertyCategory;
  unitPlotNumber?: string;
  quotedPrice?: number;
  expectedClosingValue?: number;
  status: 'Draft' | 'Site Visit Done' | 'Negotiation' | 'Token Paid' | 'Booked' | 'Won' | 'Lost' | 'Cancelled';
  notes?: string;
  assignedCloserId?: string;
  assignedCloserName?: string;
  assignedSetterId?: string;
  assignedSetterName?: string;
  assignedTelecallerId?: string;
  assignedTelecallerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  location?: string;
  budget?: string;
  budgetNum?: number;
  source: string;
  propertyType?: PropertyCategory;
  interestLevel: InterestLevel;
  priority: LeadPriority;
  status: LeadStatus;
  assignedSetterId?: string;
  assignedSetterName?: string;
  assignedCloserId?: string;
  assignedCloserName?: string;
  assignedTelecallerId?: string;
  assignedTelecallerName?: string;
  notes?: string;
  nextFollowUpDate?: string; // YYYY-MM-DD
  nextFollowUpTime?: string; // HH:mm
  siteVisitDate?: string;
  siteVisitTime?: string;
  allocations: LeadAllocation[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  // Meta Lead Ads Attribution
  metaCampaignName?: string;
  metaAdSetName?: string;
  metaFormId?: string;
  metaLeadId?: string;
  metaPlatform?: 'facebook' | 'instagram';
  // Stage and Activity Tracking
  stageHistory?: StageHistoryEntry[];
  trackingNotes?: LeadTrackingNote[];
}

export interface StageHistoryEntry {
  id: string;
  fromStage: LeadStatus;
  toStage: LeadStatus;
  changedByUserId: string;
  changedByUserName: string;
  timestamp: string;
  note?: string;
}

export interface LeadTrackingNote {
  id: string;
  userId: string;
  userName: string;
  noteType: 'Update' | 'Client Feedback' | 'Inspection' | 'Negotiation' | 'Loan Status';
  content: string;
  timestamp: string;
}

// Meta Integration Types
export interface MetaLeadForm {
  id: string;
  name: string;
  leadsCount: number;
  projectMappingId?: string;
  active: boolean;
}

export interface MetaIntegrationConfig {
  isConnected: boolean;
  pageId: string;
  pageName: string;
  adAccountId: string;
  instagramAccount?: string;
  accessToken?: string;
  webhookVerifyToken: string;
  webhookUrl: string;
  autoSync: boolean;
  syncIntervalMinutes: number;
  lastSyncTime?: string;
  totalLeadsSynced: number;
  defaultAssignedRole: 'telecaller' | 'setter';
  defaultUserId?: string;
  defaultProjectId?: string;
  forms: MetaLeadForm[];
}

export type SiteVisitStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled';

export interface SiteVisit {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  projectId: string;
  projectName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  assignedCloserId?: string;
  assignedCloserName?: string;
  pickupRequired: boolean;
  pickupLocation?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
  status: SiteVisitStatus;
  feedback?: string;
  createdAt: string;
}

export type CallOutcome =
  | 'Connected - Interested'
  | 'Connected - Scheduled Site Visit'
  | 'Connected - Follow-up Requested'
  | 'Connected - Not Interested'
  | 'No Answer / Busy'
  | 'Switched Off'
  | 'Wrong Number';

export interface CallLog {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  projectId?: string;
  projectName?: string;
  userId: string;
  userName: string;
  durationSeconds: number;
  outcome: CallOutcome;
  notes: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  leadId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface WonDeal {
  id: string;
  allocationId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  projectId: string;
  projectName: string;
  category: PropertyCategory;
  unitPlotNumber: string;
  dealValue: number;
  closedDate: string;
  closerId: string;
  closerName: string;
  setterId?: string;
  setterName?: string;
  bookingRefId?: string;
  isVerified: boolean;
  registrationNotes?: string;
  createdAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  template: string;
}
