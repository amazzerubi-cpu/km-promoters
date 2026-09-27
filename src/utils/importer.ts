import * as XLSX from 'xlsx';
import { Lead, LeadAllocation, InterestLevel, LeadPriority, PropertyCategory } from '../types/crm';
import { CRMStorageService } from '../services/crmStorage';

export interface ColumnMapping {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  location?: string;
  budget?: string;
  source?: string;
  propertyType?: string;
  project?: string;
  interestLevel?: string;
  priority?: string;
  setter?: string;
  closer?: string;
  notes?: string;
  nextFollowUp?: string;
  siteVisitDate?: string;
  siteVisitTime?: string;
}

export interface ValidatedRow {
  rowNumber: number;
  originalData: Record<string, any>;
  leadData?: Partial<Lead>;
  allocatedProjectName?: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
  duplicateReason?: string;
}

export interface ImportSummary {
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
  imported: number;
}

export const TEMPLATE_COLUMNS = [
  'Lead Name',
  'Phone',
  'Alternate Phone',
  'Email',
  'Location',
  'Budget',
  'Source',
  'Property Type',
  'Project',
  'Interest Level',
  'Priority',
  'Setter',
  'Closer',
  'Notes',
  'Next Follow Up',
  'Site Visit Date',
  'Site Visit Time',
];

export function downloadLeadImportTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const exampleRow = {
    'Lead Name': 'John Doe [EXAMPLE — DELETE BEFORE IMPORT]',
    'Phone': '9876543210',
    'Alternate Phone': '9876500000',
    'Email': 'johndoe.sample@example.com',
    'Location': 'Downtown Avenue',
    'Budget': '₹75 Lakh',
    'Source': 'Website Inquiry',
    'Property Type': 'Apartments',
    'Project': 'Skyline Residency',
    'Interest Level': 'Hot',
    'Priority': 'High',
    'Setter': 'Rahul Sen',
    'Closer': 'Priya Nair',
    'Notes': 'Looking for 3 BHK high floor facing park.',
    'Next Follow Up': '2026-10-05',
    'Site Visit Date': '2026-10-08',
    'Site Visit Time': '14:30',
  };

  const ws = XLSX.utils.json_to_sheet([exampleRow], { header: TEMPLATE_COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lead Import Template');

  if (format === 'csv') {
    XLSX.writeFile(wb, 'KM_Real_Estate_Leads_Template.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, 'KM_Real_Estate_Leads_Template.xlsx', { bookType: 'xlsx' });
  }
}

export function parseSpreadsheet(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const headers = Object.keys(rawJson[0]);
        resolve({ headers, rows: rawJson });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function guessColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    name: '',
    phone: '',
  };

  const findMatch = (patterns: string[]) => {
    return headers.find((h) => patterns.some((p) => h.toLowerCase().replace(/[^a-z0-9]/g, '').includes(p.toLowerCase()))) || '';
  };

  mapping.name = findMatch(['leadname', 'clientname', 'fullname', 'customername', 'name', 'client']);
  mapping.phone = findMatch(['mobile', 'phonenumber', 'phone', 'contactnumber', 'contact', 'cell', 'tel']);
  mapping.alternatePhone = findMatch(['alternatephone', 'altphone', 'secondaryphone', 'altmobile', 'otherphone']);
  mapping.email = findMatch(['email', 'mail', 'emailaddress']);
  mapping.location = findMatch(['location', 'city', 'address', 'area', 'locality']);
  mapping.budget = findMatch(['budget', 'pricerange', 'investment', 'value']);
  mapping.source = findMatch(['source', 'leadsource', 'channel', 'campaign', 'origin']);
  mapping.propertyType = findMatch(['propertytype', 'category', 'type', 'requirement']);
  mapping.project = findMatch(['project', 'projectname', 'property', 'site']);
  mapping.interestLevel = findMatch(['interestlevel', 'interest', 'intent']);
  mapping.priority = findMatch(['priority', 'urgency']);
  mapping.setter = findMatch(['setter', 'caller', 'agent', 'telecaller']);
  mapping.closer = findMatch(['closer', 'manager', 'executive', 'salesperson']);
  mapping.notes = findMatch(['notes', 'remark', 'comments', 'details', 'description']);
  mapping.nextFollowUp = findMatch(['nextfollowup', 'followupdate', 'followup', 'callback']);
  mapping.siteVisitDate = findMatch(['sitevisitdate', 'visitdate', 'visit']);
  mapping.siteVisitTime = findMatch(['sitevisittime', 'visittime', 'time']);

  return mapping;
}

export function validateRows(rows: Record<string, any>[], mapping: ColumnMapping): ValidatedRow[] {
  const existingLeads = CRMStorageService.getLeads();
  const existingPhones = new Set<string>();
  const existingEmails = new Set<string>();

  existingLeads.forEach((l) => {
    const p = l.phone.replace(/[^0-9]/g, '').slice(-10);
    if (p) existingPhones.add(p);
    if (l.email) existingEmails.add(l.email.trim().toLowerCase());
  });

  const batchPhones = new Set<string>();

  return rows.map((row, index) => {
    const errors: string[] = [];
    let isDuplicate = false;
    let duplicateReason = '';

    const name = String(row[mapping.name] || '').trim();
    const rawPhone = String(row[mapping.phone] || '').trim();
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const phone10 = cleanPhone.slice(-10);
    const email = mapping.email ? String(row[mapping.email] || '').trim() : '';

    // Check if it's the template example row
    if (name.includes('DELETE BEFORE IMPORT') || name.includes('[EXAMPLE')) {
      return {
        rowNumber: index + 2,
        originalData: row,
        isValid: false,
        isDuplicate: false,
        errors: ['Template placeholder example row - skipped.'],
      };
    }

    if (!name) {
      errors.push('Lead Name is required');
    }

    if (!phone10 || phone10.length < 10) {
      errors.push('Invalid phone number (must be at least 10 digits)');
    }

    // Check duplicate
    if (phone10 && existingPhones.has(phone10)) {
      isDuplicate = true;
      duplicateReason = `Phone number (${phone10}) already exists in CRM`;
    } else if (email && existingEmails.has(email.toLowerCase())) {
      isDuplicate = true;
      duplicateReason = `Email (${email}) already exists in CRM`;
    } else if (phone10 && batchPhones.has(phone10)) {
      isDuplicate = true;
      duplicateReason = `Duplicate phone number (${phone10}) repeated within this upload file`;
    }

    if (phone10) {
      batchPhones.add(phone10);
    }

    let interest: InterestLevel = 'Warm';
    const rawInterest = mapping.interestLevel ? String(row[mapping.interestLevel] || '').toLowerCase() : '';
    if (rawInterest.includes('hot')) interest = 'Hot';
    if (rawInterest.includes('cold')) interest = 'Cold';

    let priority: LeadPriority = 'Medium';
    const rawPriority = mapping.priority ? String(row[mapping.priority] || '').toLowerCase() : '';
    if (rawPriority.includes('high')) priority = 'High';
    if (rawPriority.includes('low')) priority = 'Low';

    const rawBudget = mapping.budget ? String(row[mapping.budget] || '').trim() : '';
    const budgetDigits = rawBudget.replace(/[^0-9]/g, '');
    const budgetNum = budgetDigits ? parseInt(budgetDigits, 10) : undefined;

    const leadData: Partial<Lead> = {
      name,
      phone: rawPhone || cleanPhone,
      alternatePhone: mapping.alternatePhone ? String(row[mapping.alternatePhone] || '').trim() : undefined,
      email: email || undefined,
      location: mapping.location ? String(row[mapping.location] || '').trim() : undefined,
      budget: rawBudget || undefined,
      budgetNum,
      source: mapping.source ? String(row[mapping.source] || '').trim() || 'Excel Import' : 'Excel Import',
      propertyType: mapping.propertyType ? (String(row[mapping.propertyType] || '').trim() as PropertyCategory) : undefined,
      interestLevel: interest,
      priority: priority,
      notes: mapping.notes ? String(row[mapping.notes] || '').trim() : undefined,
      nextFollowUpDate: mapping.nextFollowUp ? String(row[mapping.nextFollowUp] || '').trim() : undefined,
      siteVisitDate: mapping.siteVisitDate ? String(row[mapping.siteVisitDate] || '').trim() : undefined,
      siteVisitTime: mapping.siteVisitTime ? String(row[mapping.siteVisitTime] || '').trim() : undefined,
    };

    const projectName = mapping.project ? String(row[mapping.project] || '').trim() : undefined;

    return {
      rowNumber: index + 2,
      originalData: row,
      leadData,
      allocatedProjectName: projectName,
      isValid: errors.length === 0,
      isDuplicate,
      errors,
      duplicateReason,
    };
  });
}

export function downloadErrorReport(invalidRows: ValidatedRow[]) {
  const exportData = invalidRows.map((r) => ({
    'Row Number': r.rowNumber,
    'Client Name': r.originalData[Object.keys(r.originalData)[0]] || '',
    'Phone': r.originalData[Object.keys(r.originalData)[1]] || '',
    'Error Details': r.errors.join('; ') || r.duplicateReason || 'Validation issue',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import Errors');
  XLSX.writeFile(wb, 'KM_Real_Estate_Import_Errors.csv', { bookType: 'csv' });
}
