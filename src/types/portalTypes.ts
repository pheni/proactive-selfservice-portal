export type PageType = 
  | 'dashboard' 
  | 'services' 
  | 'orders'
  | 'cases' 
  | 'billing'
  | 'account'
  | 'service-detail' 
  | 'case-detail' 
  | 'create-case'
  | 'notifications' 
  | 'support' 
  | 'history' 
  | 'closed-case' 
  | 'profile' 
  | 'security';

export interface CreateCasePayload {
  serviceId: string;
  serviceName: string;
  category: string;
  priority: 'P1 - Critical' | 'P2 - High' | 'P3 - Moderate' | 'P4 - Minor';
  subject: string;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export interface ManagedServiceItem {
  id: string; // e.g. "DIA-100-LON"
  name: string; // "Dedicated Internet Access"
  category: "Router" | "SD-WAN" | "Cloud Connect" | "Voice" | string;
  bandwidth: string; // "100 Mbps"
  throughput?: string;
  demarcation?: string;
  location: string; // "Head Office, London"
  status: 'Operational' | 'Degraded' | 'Healing' | 'Restored' | string;
  availability: string; // "99.97%"
  latency: string; // "Normal" or "Elevated"
  packetLoss: string; // "Within target" or "18.5%"
  lastAssessed: string; // "2 min ago"
  activeCaseNumber?: string; // e.g. "CSM001245"
  circuitId?: string;
  siteCode?: string;
  siteName?: string;
  vlan?: string;
  ipSubnet?: string;
  carrierTail?: string;
  activeCaseDetails?: {
    caseNumber: string;
    priority: string;
    status: string;
    description: string;
  };
}

export interface CaseActivityItem {
  id: string;
  author: string;
  role: 'Customer' | 'ServiceNow Specialist' | 'System Automation';
  text: string;
  timestamp: string;
  isUrgent?: boolean;
}

export interface ActiveCaseItem {
  caseNumber: string;
  service: string;
  serviceId: string;
  category: string;
  description: string;
  status: 'Monitoring' | 'Investigating' | 'Recovery' | 'Customer Input Required' | 'Closed' | string;
  statusTone: 'amber' | 'blue' | 'purple' | 'green' | string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  priorityTone?: 'red' | 'amber' | 'blue' | 'slate' | 'green' | string;
  openedTime: string;
  incidentRef: string;
  queue: string;
  assignedTo?: string;
  contact?: string;
}

export interface ClosedCaseItem {
  caseNumber: string;
  service: string;
  serviceId: string;
  category: string;
  summary: string;
  status: 'Closed' | 'Resolved';
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  closedDate: string;
  resolutionSummary: string;
  closureMilestones: Array<{ label: string; time: string }>;
}

export interface VirtualAssistantContext {
  caseNumber: string;
  serviceName: string;
  serviceId?: string;
  status?: string;
  category?: string;
}

export interface OttoContext extends VirtualAssistantContext {
  telemetryMetrics?: {
    latency?: string;
    packetLoss?: string;
    availability?: string;
    bgpStatus?: string;
  };
}

export interface OttoChatMessage {
  id: string;
  sender: 'otto' | 'user';
  text: string;
  timestamp: string;
  isGenAi?: boolean;
  actionPills?: Array<{ label: string; actionKey: string }>;
  telemetryReport?: {
    latency: string;
    packetLoss: string;
    bgpState: string;
    healthScore: string;
  };
}

export interface NotificationItem {
  id: string;
  type: 'incident' | 'maintenance' | 'resolution' | 'telemetry';
  title: string;
  summary: string;
  timestamp: string;
  service: string;
  caseNumber?: string;
  severity: 'P1' | 'P2' | 'P3' | 'Info';
  isRead: boolean;
}

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'incident',
    title: 'Service degradation detected on primary router',
    summary: 'Proactive latency alert detected on DIA-100-THW. Automated recovery initiated. Stability monitoring active.',
    timestamp: 'Today, 10:05 AM',
    service: 'Dedicated Internet Access',
    caseNumber: 'CSM001245',
    severity: 'P2',
    isRead: false
  },
  {
    id: 'notif-2',
    type: 'incident',
    title: 'Redundant path jitter elevation alert',
    summary: 'Secondary WAN-2 tunnel on SDW-1000-THW experienced brief jitter drift. Primary throughput unaffected.',
    timestamp: 'Today, 11:42 AM',
    service: 'Enterprise SD-WAN Gateway',
    caseNumber: 'CSM001289',
    severity: 'P2',
    isRead: false
  },
  {
    id: 'notif-3',
    type: 'maintenance',
    title: 'Scheduled AWS DirectConnect firmware upgrade',
    summary: 'Regional carrier will perform non-disruptive border gateway route maintenance on cross-connect VLAN 402 tonight.',
    timestamp: 'Yesterday, 04:30 PM',
    service: 'Cloud Connect Express',
    severity: 'Info',
    isRead: true
  },
  {
    id: 'notif-4',
    type: 'resolution',
    title: 'SIP Trunk registration keepalive restored',
    summary: 'Session Border Controller firmware timer renewal completed. Codec latency stabilized across all channels.',
    timestamp: 'Yesterday, 02:15 PM',
    service: 'Managed SIP Voice Trunking',
    caseNumber: 'CSM001312',
    severity: 'Info',
    isRead: true
  }
];

export interface ServiceMetrics {
  core_wan: number;
  fiber_broadband: number;
  voice_sip: number;
  mobile_fleet: number;
  total: number;
}

export interface PortalData {
  customer: string; // "Goutam Hazra"
  account: string; // "Consumer Account"
  service: string; // "Dedicated Internet Access"
  serviceId: string; // "DIA-100-THW"
  bandwidth: string; // "100 Mbps"
  location: string; // "London, UK"
  caseNumber: string; // "CSM001245"
  incidentReference: string; // "INC-498221" (Internal hidden operational ref)
  queue: string; // "Service Assurance Support Queue"
  email: string; // "goutam.hazra@gmail.com"
  phone: string; // "+61 4 0000 0000"
  servicesList: ManagedServiceItem[];
  serviceMetrics?: ServiceMetrics;
  mobileSubscriptions?: MobileSubscriptionItem[];
  fiberBroadband?: FiberBroadbandItem[];
  voiceTrunks?: VoiceTrunkItem[];
  contracts?: CorporateContractItem[];
  invoices?: InvoiceLedgerItem[];
}

export type TimelineState = 'complete' | 'current' | 'pending';

export interface TimelineStep {
  label: 'Detected' | 'Investigating' | 'Recovery' | 'Restored' | 'Monitoring' | 'Closed';
  time: string;
  state: TimelineState;
}

export interface ApprovedUpdate {
  title: string;
  category: 'Monitoring' | 'Restoration' | 'Recovery' | 'Investigation';
  text: string;
  time: string;
}

export interface BusinessImpactPayload {
  affectedApplication: string;
  location: string;
  usersAffected: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  comments: string;
  submittedAt?: string;
}

export interface RestorationConfirmationPayload {
  result: 'yes' | 'no';
  comments: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface CallSessionState {
  state: 'ready' | 'connected' | 'complete' | 'failed';
  durationSeconds: number;
  startTime?: string;
  endTime?: string;
  outcome?: string;
  interactionRef?: string;
}

export interface ServiceNowCallLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PATCH';
  endpoint: string;
  statusCode: number;
  statusText: string;
  requestPayload?: any;
  responsePayload?: any;
}

export type StoryboardStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface CustomerAccountDetails {
  accountId: string;
  accountName: string;
  contractNumber: string;
  contractTier: string;
  uptimeSla: string;
  healthScore: number;
  billingCurrency: string;
  industry?: string;
  sitesCount: number;
  activeOrdersCount: number;
  openTicketsCount: number;
  activeServicesCount: number;
  accountTeam: {
    accountDirector: { name: string; email: string; phone: string };
    technicalAccountManager: { name: string; email: string; phone: string };
    escalationNocLead: { name: string; hotline: string };
  };
}

export interface CustomerSiteItem {
  id: string;
  siteCode: string;
  name: string;
  city: string;
  country: string;
  address: string;
  tier: string;
  slaCompliance: string;
  assetCount: number;
  status: 'Operational' | 'Degraded' | 'Maintenance';
  activeTicketsCount: number;
}

export interface CustomerOrderItem {
  id: string;
  orderNumber: string;
  projectTitle: string;
  orderType: 'New Installation' | 'Bandwidth Upgrade' | 'Macro Rollout' | 'MACD Change';
  status: 'In Progress' | 'Site Access Required' | 'Provisioning' | 'Completed' | 'Pending Acceptance';
  progressPct: number;
  currentMilestone: string;
  orderedDate: string;
  estimatedDelivery: string;
  siteName: string;
  siteCode: string;
  items: Array<{
    category: string;
    description: string;
    quantity: number;
    unit: string;
    status: string;
  }>;
  stages: Array<{
    name: string;
    status: 'complete' | 'current' | 'pending';
    date?: string;
  }>;
}

// B2B Mobile Fleet & SIM Subscription
export interface MobileSubscriptionItem {
  id: string; // e.g. "SUB-MOB-201"
  phoneNumber: string; // e.g. "+44 7700 900222"
  plan: string; // e.g. "Logistics Fleet Pro 5G Unlimited"
  status: 'Active' | 'Suspended' | 'Pending Activation';
  statusTone: 'green' | 'amber' | 'red' | 'slate';
  device: string; // e.g. "Zebra TC57 Rugged Enterprise"
  simNumber: string; // e.g. "8944 1100 2938 8124"
  assignedUser: string; // e.g. "Marcus Chen"
  department: string; // e.g. "Supply Chain Operations"
  location?: string; // e.g. "Bangalore Cloud & AI R&D Campus"
  siteCode?: string; // e.g. "BLR-01"
  dataUsedGB: number; // e.g. 120.5
  dataLimitGB: number; // 0 = Unlimited
  monthlyCost: number; // e.g. 55.00
  roamingPass: boolean;
  hasAlert?: boolean;
  alertReason?: string;
  features: string[];
}

// Dedicated Enterprise Fiber Broadband Line
export interface FiberBroadbandItem {
  id: string; // e.g. "FIB-HQ-LON-01"
  name: string; // "Multi-Gig Workplace Dedicated Fibre"
  circuitId: string; // "LON-CW-FIB-9002"
  speed: string; // "1 Gbps / 1 Gbps Symmetrical"
  status: 'Operational' | 'Degraded' | 'Scheduled Maintenance';
  ontTerminal: string; // "Adtran SDX 6320 Optical ONT"
  opticalSignal: string; // "-18.2 dBm (Optimal)"
  staticIpPool: string; // "194.72.108.64/29 (5 usable IPs)"
  location: string; // "London Canary Wharf HQ"
  lastAssessed: string;
  monthlyCost: number;
  activeCaseNumber?: string;
}

export interface VoiceTrunkItem {
  id: string; // e.g. "SIP-PUN-01"
  trunkId: string;
  name: string;
  siteCode: string;
  location: string;
  channels: number;
  protocol: string;
  codecs: string;
  status: 'Operational' | 'Degraded' | 'Critical' | string;
  availability: string;
  latency: string;
  jitter: string;
  activeCaseNumber?: string;
  lastAssessed: string;
}

// Corporate Legal & Master Services Agreement (MSA)
export interface CorporateContractItem {
  id: string; // "MSA-2024-991"
  title: string; // "Master Telecommunications Service Agreement"
  type: 'Primary' | 'Addendum' | 'SLA' | 'Compliance';
  status: 'In Force' | 'Active' | 'Pending Renewal';
  effectiveDate: string; // "15 Jan 2024"
  renewalDate: string; // "14 Jan 2027"
  governingLaw: string; // "England & Wales"
  slaCommitment: string; // "99.99% Availability · 15min MTTA · 4hr MTTR"
  description: string;
}

// Financial Invoice & Billing Ledger
export interface InvoiceLedgerItem {
  id: string; // "INV-2026-003"
  billingPeriod: string; // "October 2026"
  amount: number; // 8420.50
  currency: string; // "GBP"
  status: 'Paid' | 'Processing' | 'Due';
  dueDate: string; // "28 Oct 2026"
  paymentMethod: string; // "BACS Direct Debit (•••• 4920)"
  breakdown: {
    fixedCircuits: number;
    mobileFleet: number;
    fiberBroadband: number;
    usageAddons: number;
  };
}
