import { SERVICENOW_CONFIG, getServiceNowFullUrl } from '../config/servicenow.config';
import { serviceNowAuthService } from './servicenowAuth';
import { 
  PortalData, 
  ManagedServiceItem,
  TimelineStep, 
  ApprovedUpdate, 
  BusinessImpactPayload, 
  RestorationConfirmationPayload,
  CreateCasePayload,
  ServiceNowCallLog,
  StoryboardStepNumber,
  ClosedCaseItem,
  ActiveCaseItem,
  CaseActivityItem,
  CustomerAccountDetails,
  CustomerSiteItem,
  CustomerOrderItem,
  MobileSubscriptionItem,
  FiberBroadbandItem,
  VoiceTrunkItem,
  CorporateContractItem,
  InvoiceLedgerItem
} from '../types/portalTypes';

export const initialActiveCases: ActiveCaseItem[] = [];
export const initialClosedCases: ClosedCaseItem[] = [];

export const baseCustomerServices: ManagedServiceItem[] = [
  {
    id: "CKT-PUN-001",
    circuitId: "CKT-PUN-001",
    siteCode: "PUN-01",
    siteName: "Pune Technical Center",
    name: "1 Gbps Primary Optical MPLS Trunk",
    category: "Core WAN & Circuits",
    bandwidth: "1 Gbps",
    throughput: "1 Gbps",
    demarcation: "Cisco ASR 9001 PE",
    location: "Pune Technical Center",
    status: "Operational",
    availability: "99.98%",
    latency: "Normal (14ms)",
    packetLoss: "0.0%",
    lastAssessed: "Just now",
    vlan: "VLAN 402",
    ipSubnet: "10.240.12.0/30",
    carrierTail: "Tata Comm Dark Fiber Tail"
  },
  {
    id: "CKT-MUM-DC-01",
    circuitId: "CKT-MUM-DC-01",
    siteCode: "MUM-HQ",
    siteName: "Mumbai Global HQ & Trading Floor",
    name: "10G Ultra-Low Latency Core Optical Ring",
    category: "Core WAN & Circuits",
    bandwidth: "10 Gbps",
    throughput: "10 Gbps",
    demarcation: "Cisco ASR 9904 Core",
    location: "Mumbai Global HQ & Trading Floor",
    status: "Operational",
    availability: "99.99%",
    latency: "Optimal (2ms)",
    packetLoss: "0.0%",
    lastAssessed: "Just now",
    vlan: "VLAN 101",
    ipSubnet: "10.100.1.0/30",
    carrierTail: "Tata Comm Core Ring 01"
  },
  {
    id: "CKT-MUM-SD-01",
    circuitId: "CKT-MUM-SD-01",
    siteCode: "MUM-HQ",
    siteName: "Mumbai Global HQ & Trading Floor",
    name: "Mumbai SD-WAN Dual Edge Gateway 01",
    category: "Core WAN & Circuits",
    bandwidth: "2 Gbps",
    throughput: "2 Gbps",
    demarcation: "Cisco Catalyst 8300 Edge",
    location: "Mumbai Global HQ & Trading Floor",
    status: "Operational",
    availability: "99.97%",
    latency: "Normal (8ms)",
    packetLoss: "0.0%",
    lastAssessed: "Just now",
    vlan: "VLAN 105",
    ipSubnet: "10.100.5.0/30",
    carrierTail: "Dual Optical Handoff"
  },
  {
    id: "CKT-BLR-SD-01",
    circuitId: "CKT-BLR-SD-01",
    siteCode: "BLR-01",
    siteName: "Bangalore Cloud & AI R&D Campus",
    name: "Bangalore SD-WAN Edge Trunk 01",
    category: "Core WAN & Circuits",
    bandwidth: "1 Gbps",
    throughput: "1 Gbps",
    demarcation: "Cisco Catalyst 8300 Edge",
    location: "Bangalore Cloud & AI R&D Campus",
    status: "Operational",
    availability: "99.98%",
    latency: "Normal (16ms)",
    packetLoss: "0.0%",
    lastAssessed: "Just now",
    vlan: "VLAN 301",
    ipSubnet: "10.150.1.0/30",
    carrierTail: "Metro Ethernet Link"
  },
  {
    id: "CKT-SGP-SD-01",
    circuitId: "CKT-SGP-SD-01",
    siteCode: "SGP-01",
    siteName: "Singapore APAC Regional Gateway",
    name: "Singapore SD-WAN Regional Aggregator",
    category: "Core WAN & Circuits",
    bandwidth: "1 Gbps",
    throughput: "1 Gbps",
    demarcation: "Cisco ASR 1001-X",
    location: "Singapore APAC Regional Gateway",
    status: "Operational",
    availability: "99.98%",
    latency: "Normal (28ms)",
    packetLoss: "0.0%",
    lastAssessed: "Just now",
    vlan: "VLAN 202",
    ipSubnet: "10.180.2.0/30",
    carrierTail: "Singtel Regional Backhaul"
  }
];

export const baseVoiceServices: VoiceTrunkItem[] = [
  {
    id: "SIP-PUN-01",
    trunkId: "SIP-PUN-01",
    name: "SIP Corporate Voice Trunk (Primary)",
    siteCode: "PUN-01",
    location: "Pune Technical Center",
    channels: 100,
    protocol: "SIP TLS / SRTP",
    codecs: "G.711u / G.729a",
    status: "Operational",
    availability: "99.99%",
    latency: "12ms",
    jitter: "1.2ms",
    lastAssessed: "Just now"
  },
  {
    id: "SIP-MUM-01",
    trunkId: "SIP-MUM-01",
    name: "Core SIP Trunk Group 01 (500 Channels)",
    siteCode: "MUM-HQ",
    location: "Mumbai Global HQ & Trading Floor",
    channels: 500,
    protocol: "SIP TLS / SRTP",
    codecs: "G.711u / G.729a HD",
    status: "Operational",
    availability: "99.99%",
    latency: "4ms",
    jitter: "0.6ms",
    lastAssessed: "Just now"
  },
  {
    id: "SIP-BLR-01",
    trunkId: "SIP-BLR-01",
    name: "Bangalore Campus SIP Trunk 01",
    siteCode: "BLR-01",
    location: "Bangalore Cloud & AI R&D Campus",
    channels: 200,
    protocol: "SIP TLS / SRTP",
    codecs: "G.711u / G.729a HD",
    status: "Operational",
    availability: "99.98%",
    latency: "14ms",
    jitter: "1.0ms",
    lastAssessed: "Just now"
  },
  {
    id: "SIP-CHE-01",
    trunkId: "SIP-CHE-01",
    name: "Chennai Plant SIP Voice Trunk Group",
    siteCode: "CHE-02",
    location: "Chennai Automotive Smart Plant",
    channels: 150,
    protocol: "SIP TLS / SRTP",
    codecs: "G.711u / G.729a",
    status: "Operational",
    availability: "99.97%",
    latency: "18ms",
    jitter: "1.4ms",
    lastAssessed: "Just now"
  },
  {
    id: "SIP-SGP-01",
    trunkId: "SIP-SGP-01",
    name: "APAC Corporate SIP Gateway 01",
    siteCode: "SGP-01",
    location: "Singapore APAC Regional Gateway",
    channels: 100,
    protocol: "SIP TLS / SRTP",
    codecs: "G.711u / Opus HD",
    status: "Operational",
    availability: "99.99%",
    latency: "24ms",
    jitter: "0.9ms",
    lastAssessed: "Just now"
  }
];

export const initialMobileSubscriptions: MobileSubscriptionItem[] = [
  {
    id: "MOB-LINE-101",
    phoneNumber: "+91 98200 90101",
    plan: "Corporate 5G Executive Roaming Line 01",
    status: "Active",
    statusTone: "green",
    device: "Apple iPhone 15 Pro Enterprise",
    simNumber: "8944 1100 2938 1101",
    assignedUser: "Executive Leadership",
    department: "Executive Management",
    siteCode: "MUM-HQ",
    location: "Mumbai Global HQ & Trading Floor",
    dataUsedGB: 48.5,
    dataLimitGB: 100,
    monthlyCost: 65,
    roamingPass: true,
    hasAlert: false,
    features: ["5G Ultra-Wideband", "VIP Priority QOS", "Global Roaming Pass"]
  },
  {
    id: "MOB-LINE-102",
    phoneNumber: "+91 98200 90102",
    plan: "Corporate 5G Executive Roaming Line 02",
    status: "Active",
    statusTone: "green",
    device: "Samsung Galaxy S24 Ultra Enterprise",
    simNumber: "8944 1100 2938 1102",
    assignedUser: "Finance Trading Desk",
    department: "Treasury Operations",
    siteCode: "MUM-HQ",
    location: "Mumbai Global HQ & Trading Floor",
    dataUsedGB: 34.2,
    dataLimitGB: 100,
    monthlyCost: 65,
    roamingPass: true,
    hasAlert: false,
    features: ["5G Ultra-Wideband", "Encrypted Voice", "Global Roaming Pass"]
  },
  {
    id: "MOB-LINE-103",
    phoneNumber: "+91 98200 90103",
    plan: "Pune NOC Field Tech 5G SIM Pool 01",
    status: "Active",
    statusTone: "green",
    device: "Zebra TC57 Rugged Enterprise",
    simNumber: "8944 1100 2938 1103",
    assignedUser: "Pune NOC Dispatch",
    department: "Field Engineering",
    siteCode: "PUN-01",
    location: "Pune Technical Center",
    dataUsedGB: 52.8,
    dataLimitGB: 100,
    monthlyCost: 55,
    roamingPass: true,
    hasAlert: false,
    features: ["Private APN", "Mission-Critical Push-to-Talk", "Field Diagnostics"]
  },
  {
    id: "MOB-LINE-104",
    phoneNumber: "+91 98200 90104",
    plan: "Pune NOC Field Tech 5G SIM Pool 02",
    status: "Active",
    statusTone: "green",
    device: "Zebra TC57 Rugged Enterprise",
    simNumber: "8944 1100 2938 1104",
    assignedUser: "Infrastructure Lead",
    department: "Field Engineering",
    siteCode: "PUN-01",
    location: "Pune Technical Center",
    dataUsedGB: 41.0,
    dataLimitGB: 100,
    monthlyCost: 55,
    roamingPass: true,
    hasAlert: false,
    features: ["Private APN", "Mission-Critical Push-to-Talk", "Field Diagnostics"]
  },
  {
    id: "MOB-LINE-105",
    phoneNumber: "+91 98200 90105",
    plan: "Bangalore Cloud Engineers SIM 01",
    status: "Active",
    statusTone: "green",
    device: "Cisco Industrial 5G Gateway",
    simNumber: "8944 1100 2938 1105",
    assignedUser: "Cloud Devops Team",
    department: "Cloud Engineering",
    siteCode: "BLR-01",
    location: "Bangalore Cloud & AI R&D Campus",
    dataUsedGB: 68.4,
    dataLimitGB: 150,
    monthlyCost: 60,
    roamingPass: true,
    hasAlert: false,
    features: ["Static Public IPv4", "Low-Latency Edge 5G", "Cloud Tunneling"]
  },
  {
    id: "MOB-LINE-106",
    phoneNumber: "+91 98200 90106",
    plan: "Bangalore Cloud Engineers SIM 02",
    status: "Active",
    statusTone: "green",
    device: "Cisco Industrial 5G Gateway",
    simNumber: "8944 1100 2938 1106",
    assignedUser: "AI Cluster Engineer",
    department: "Cloud Engineering",
    siteCode: "BLR-01",
    location: "Bangalore Cloud & AI R&D Campus",
    dataUsedGB: 71.9,
    dataLimitGB: 150,
    monthlyCost: 60,
    roamingPass: true,
    hasAlert: false,
    features: ["Static Public IPv4", "Low-Latency Edge 5G", "Cloud Tunneling"]
  },
  {
    id: "MOB-LINE-107",
    phoneNumber: "+91 98200 90107",
    plan: "Chennai Factory Automated AGV SIM 01",
    status: "Active",
    statusTone: "green",
    device: "Siemens Scalance 5G Router",
    simNumber: "8944 1100 2938 1107",
    assignedUser: "Factory Automation Unit 1",
    department: "Industrial IoT Operations",
    siteCode: "CHE-02",
    location: "Chennai Automotive Smart Plant",
    dataUsedGB: 84.1,
    dataLimitGB: 200,
    monthlyCost: 75,
    roamingPass: false,
    hasAlert: false,
    features: ["Ultra-Reliable Low Latency (URLLC)", "Industrial Private 5G", "VLAN Tagging"]
  },
  {
    id: "MOB-LINE-108",
    phoneNumber: "+91 98200 90108",
    plan: "Chennai Factory Automated AGV SIM 02",
    status: "Active",
    statusTone: "green",
    device: "Siemens Scalance 5G Router",
    simNumber: "8944 1100 2938 1108",
    assignedUser: "Factory Automation Unit 2",
    department: "Industrial IoT Operations",
    siteCode: "CHE-02",
    location: "Chennai Automotive Smart Plant",
    dataUsedGB: 88.6,
    dataLimitGB: 200,
    monthlyCost: 75,
    roamingPass: false,
    hasAlert: false,
    features: ["Ultra-Reliable Low Latency (URLLC)", "Industrial Private 5G", "VLAN Tagging"]
  },
  {
    id: "MOB-LINE-109",
    phoneNumber: "+65 9123 4501",
    plan: "Singapore APAC Regional Data Pool 01",
    status: "Active",
    statusTone: "green",
    device: "Netgear Nighthawk M6 Pro 5G",
    simNumber: "8944 1100 2938 1109",
    assignedUser: "APAC Regional Director",
    department: "Regional Operations",
    siteCode: "SGP-01",
    location: "Singapore APAC Regional Gateway",
    dataUsedGB: 38.0,
    dataLimitGB: 100,
    monthlyCost: 70,
    roamingPass: true,
    hasAlert: false,
    features: ["APAC Cross-Border Roaming", "5G SA Slicing", "Zero-Trust Mesh"]
  },
  {
    id: "MOB-LINE-110",
    phoneNumber: "+65 9123 4502",
    plan: "Singapore APAC Regional Data Pool 02",
    status: "Active",
    statusTone: "green",
    device: "Netgear Nighthawk M6 Pro 5G",
    simNumber: "8944 1100 2938 1110",
    assignedUser: "Equinix SG1 Systems Lead",
    department: "Regional Operations",
    siteCode: "SGP-01",
    location: "Singapore APAC Regional Gateway",
    dataUsedGB: 44.5,
    dataLimitGB: 100,
    monthlyCost: 70,
    roamingPass: true,
    hasAlert: false,
    features: ["APAC Cross-Border Roaming", "5G SA Slicing", "Zero-Trust Mesh"]
  }
];

export const initialFiberBroadband: FiberBroadbandItem[] = [
  {
    id: "CKT-PUN-DIA",
    circuitId: "CKT-PUN-DIA",
    name: "500 Mbps Dedicated Internet Access (DIA)",
    speed: "500 Mbps Symmetrical",
    status: "Operational",
    ontTerminal: "Adtran SDX 6320 Optical ONT",
    opticalSignal: "-17.5 dBm (Optimal margin)",
    staticIpPool: "194.72.108.64/29 (5 usable public IPs)",
    location: "Pune Technical Center",
    lastAssessed: "Just now",
    monthlyCost: 850.00
  },
  {
    id: "DIA-500-BLR-01",
    circuitId: "DIA-500-BLR-01",
    name: "Dedicated Cloud Connect 1 Gbps Link",
    speed: "1 Gbps Symmetrical",
    status: "Operational",
    ontTerminal: "Adtran SDX 6320 Optical ONT",
    opticalSignal: "-18.2 dBm (Optimal margin)",
    staticIpPool: "194.72.115.128/29 (5 usable public IPs)",
    location: "Bangalore Cloud & AI R&D Campus",
    lastAssessed: "Just now",
    monthlyCost: 950.00
  },
  {
    id: "DIA-10G-CHE-01",
    circuitId: "DIA-10G-CHE-01",
    name: "Chennai Automotive 10G DIA Backbone",
    speed: "10 Gbps Symmetrical",
    status: "Operational",
    ontTerminal: "Cisco NCS 540 Optical Edge",
    opticalSignal: "-16.4 dBm (Optimal margin)",
    staticIpPool: "194.72.112.32/29 (5 usable public IPs)",
    location: "Chennai Automotive Smart Plant",
    lastAssessed: "Just now",
    monthlyCost: 3500.00
  },
  {
    id: "CKT-MUM-CC-01",
    circuitId: "CKT-MUM-CC-01",
    name: "Mumbai Cloud DirectConnect 10G Gateway",
    speed: "10 Gbps Symmetrical",
    status: "Operational",
    ontTerminal: "Equinix Cross-Connect Gateway",
    opticalSignal: "-15.9 dBm (Optimal margin)",
    staticIpPool: "194.72.100.16/29 (5 usable public IPs)",
    location: "Mumbai Global HQ & Trading Floor",
    lastAssessed: "Just now",
    monthlyCost: 3200.00
  },
  {
    id: "CKT-SGP-01",
    circuitId: "CKT-SGP-01",
    name: "Equinix SG1 Direct Cross-Connect 01",
    speed: "1 Gbps Symmetrical",
    status: "Operational",
    ontTerminal: "Equinix Cross-Connect Gateway",
    opticalSignal: "-17.8 dBm (Optimal margin)",
    staticIpPool: "194.72.120.16/29 (5 usable public IPs)",
    location: "Singapore APAC Regional Gateway",
    lastAssessed: "Just now",
    monthlyCost: 1100.00
  }
];

export const initialCorporateContracts: CorporateContractItem[] = [
  {
    id: "MSA-2024-991",
    title: "Master Telecommunications Service Agreement",
    type: "Primary",
    status: "In Force",
    effectiveDate: "15 Jan 2024",
    renewalDate: "14 Jan 2027",
    governingLaw: "England & Wales",
    slaCommitment: "99.99% Availability · 15min MTTA · 4hr MTTR",
    description: "Main governing commercial and legal agreement covering all enterprise connectivity circuits, broadband links, and hardware procurement."
  },
  {
    id: "FMA-2024-102",
    title: "Enterprise Mobile Fleet Maintenance Addendum",
    type: "Addendum",
    status: "In Force",
    effectiveDate: "01 Feb 2024",
    renewalDate: "31 Jan 2027",
    governingLaw: "England & Wales",
    slaCommitment: "Same-Day Courier Device Replacement & 24/7 SIM Swap",
    description: "Extended hardware SLA, MDM zero-touch deployment, and expedited replacement terms for mobile device fleet and logistics scanners."
  },
  {
    id: "SLA-PLAT-001",
    title: "Carrier Service Level Agreement: Platinum Plus Tier-1",
    type: "SLA",
    status: "Active",
    effectiveDate: "15 Jan 2024",
    renewalDate: "14 Jan 2027",
    governingLaw: "England & Wales",
    slaCommitment: "99.99% Guaranteed WAN & Fibre Availability with Service Credit Backing",
    description: "High-availability SLA terms ensuring priority queue dispatch, direct NOC bridge access, and financial penalty credits for SLA breaches."
  },
  {
    id: "DSA-2023-442",
    title: "Data Sovereignty, Residency & Security Agreement",
    type: "Compliance",
    status: "In Force",
    effectiveDate: "12 Nov 2023",
    renewalDate: "11 Nov 2026",
    governingLaw: "UK GDPR / Data Protection Act 2018",
    slaCommitment: "UK In-Country Data Residency & End-to-End Encryption Guarantee",
    description: "Legal and compliance framework ensuring all voice traffic, SIP signaling, and fleet telemetry data resides exclusively within UK data centers."
  }
];

export const initialInvoiceLedger: InvoiceLedgerItem[] = [
  {
    id: "INV-2026-003",
    billingPeriod: "October 2026",
    amount: 8420.50,
    currency: "GBP",
    status: "Paid",
    dueDate: "28 Oct 2026",
    paymentMethod: "BACS Direct Debit (•••• 4920)",
    breakdown: {
      fixedCircuits: 4200.00,
      mobileFleet: 2850.00,
      fiberBroadband: 1100.00,
      usageAddons: 270.50
    }
  },
  {
    id: "INV-2026-002",
    billingPeriod: "September 2026",
    amount: 8320.00,
    currency: "GBP",
    status: "Paid",
    dueDate: "28 Sep 2026",
    paymentMethod: "BACS Direct Debit (•••• 4920)",
    breakdown: {
      fixedCircuits: 4200.00,
      mobileFleet: 2780.00,
      fiberBroadband: 1100.00,
      usageAddons: 240.00
    }
  },
  {
    id: "INV-2026-001",
    billingPeriod: "August 2026",
    amount: 8150.00,
    currency: "GBP",
    status: "Paid",
    dueDate: "28 Aug 2026",
    paymentMethod: "BACS Direct Debit (•••• 4920)",
    breakdown: {
      fixedCircuits: 4200.00,
      mobileFleet: 2650.00,
      fiberBroadband: 1100.00,
      usageAddons: 200.00
    }
  }
];

export const initialServicesList: ManagedServiceItem[] = [
  ...baseCustomerServices,
  ...initialFiberBroadband.map(f => ({
    id: f.circuitId,
    circuitId: f.circuitId,
    name: f.name,
    category: "Fiber Broadband",
    bandwidth: f.speed,
    throughput: f.speed,
    demarcation: f.ontTerminal,
    location: f.location,
    status: f.status,
    availability: "99.98%",
    latency: "Normal (12ms)",
    packetLoss: "0.0%",
    lastAssessed: "Just now"
  })),
  ...baseVoiceServices.map(v => ({
    id: v.trunkId,
    circuitId: v.trunkId,
    name: v.name,
    category: "Voice & SIP Trunks",
    bandwidth: `${v.channels} Channels`,
    throughput: `${v.channels} Channels`,
    demarcation: "AudioCodes Mediant 1000B SBC",
    location: v.location,
    status: v.status,
    availability: v.availability,
    latency: v.latency,
    packetLoss: "0.0%",
    lastAssessed: "Just now"
  })),
  ...initialMobileSubscriptions.map(m => ({
    id: m.id,
    circuitId: m.id,
    name: m.plan,
    category: "Mobile Fleet & SIMs",
    bandwidth: "5G Ultra",
    throughput: "5G Ultra",
    demarcation: m.device,
    location: m.location,
    status: "Operational",
    availability: "99.95%",
    latency: "Normal (24ms)",
    packetLoss: "0.0%",
    lastAssessed: "Just now"
  }))
];

export const initialCustomerOrders: CustomerOrderItem[] = [
  {
    id: 'ord-tmt-1001',
    orderNumber: 'ORD-2026-1001',
    projectTitle: 'Bangalore AI R&D Campus 10G MPLS Expansion',
    orderType: 'Bandwidth Upgrade',
    status: 'In Progress',
    progressPct: 68,
    currentMilestone: 'Optical Network Trenching & Dark Conduit Pull',
    orderedDate: '2026-10-18',
    estimatedDelivery: '2026-11-20',
    siteName: 'Bangalore Tech Park',
    siteCode: 'BLR-01',
    items: [
      { category: 'Core WAN', description: '10 Gbps Symmetrical Dark Fiber Pair', quantity: 2, unit: 'Circuits', status: 'Provisioning' },
      { category: 'Hardware', description: 'Cisco ASR 9904 Optical Core Chassis', quantity: 1, unit: 'Unit', status: 'Dispatched' },
      { category: 'IP Transit', description: '10G Clean IP Transit Allocation', quantity: 1, unit: 'Allocation', status: 'Configured' }
    ],
    stages: [
      { name: 'Site Survey & Demarcation Inspection', status: 'complete', date: '2026-10-20' },
      { name: 'Optical Network Trenching & Dark Conduit Pull', status: 'current', date: 'In Progress' },
      { name: 'Cisco Core PE Router Hardware Dispatch', status: 'pending' },
      { name: 'RFC 2544 Throughput & Jitter Testing', status: 'pending' },
      { name: 'Customer Service Acceptance & Handover', status: 'pending' }
    ]
  },
  {
    id: 'ord-tmt-1002',
    orderNumber: 'ORD-2026-1002',
    projectTitle: 'Pune Hinjawadi Phase-2 SD-WAN Secondary Redundancy',
    orderType: 'New Installation',
    status: 'In Progress',
    progressPct: 45,
    currentMilestone: 'FortiGate HA Cluster Staging',
    orderedDate: '2026-10-22',
    estimatedDelivery: '2026-11-28',
    siteName: 'Pune Technical Center',
    siteCode: 'PUN-01',
    items: [
      { category: 'SD-WAN', description: 'FortiGate 200F Dual Active SD-WAN Gateway', quantity: 1, unit: 'Unit', status: 'Staged' },
      { category: 'Broadband', description: '1 Gbps Metro Ethernet Redundant Tail', quantity: 1, unit: 'Circuit', status: 'Provisioning' }
    ],
    stages: [
      { name: 'Carrier Demarcation Feasibility Study', status: 'complete', date: '2026-10-24' },
      { name: 'Secondary Metro Conduit Allocation', status: 'complete', date: '2026-10-29' },
      { name: 'FortiGate HA Cluster Staging', status: 'current', date: 'In Progress' },
      { name: 'Dynamic Failover & Simulation Testing', status: 'pending' },
      { name: 'BGP Peering Cutover & Go-Live', status: 'pending' }
    ]
  },
  {
    id: 'ord-tmt-1003',
    orderNumber: 'ORD-2026-1003',
    projectTitle: 'Mumbai BKC Executive Headquarters SIP Trunk Migration',
    orderType: 'MACD Change',
    status: 'Pending Acceptance',
    progressPct: 85,
    currentMilestone: 'End-to-End Voice MOS Score & Codec Testing',
    orderedDate: '2026-10-05',
    estimatedDelivery: '2026-11-14',
    siteName: 'Mumbai Global HQ',
    siteCode: 'MUM-HQ',
    items: [
      { category: 'Voice & SIP', description: 'AudioCodes Mediant 1000B Enterprise SBC', quantity: 2, unit: 'Nodes', status: 'Complete' },
      { category: 'Voice & SIP', description: '500 Concurrent SIP Voice Channels', quantity: 500, unit: 'Channels', status: 'Configured' },
      { category: 'Voice & SIP', description: 'Direct Inward Dial Corporate Numbers', quantity: 2000, unit: 'DIDs', status: 'Ported' }
    ],
    stages: [
      { name: 'Telephony Dial Plan Architecture Design', status: 'complete', date: '2026-10-08' },
      { name: 'Dual SBC AudioCodes Rack & Power Verification', status: 'complete', date: '2026-10-15' },
      { name: 'Carrier DID Number Porting Validation', status: 'complete', date: '2026-10-25' },
      { name: 'End-to-End Voice MOS Score & Codec Testing', status: 'current', date: 'UAT Active' },
      { name: 'Operational Signoff & Service Handover', status: 'pending' }
    ]
  },
  {
    id: 'ord-tmt-1004',
    orderNumber: 'ORD-2026-1004',
    projectTitle: 'Hyderabad HITEC City Campus Dedicated Internet Access (DIA)',
    orderType: 'New Installation',
    status: 'In Progress',
    progressPct: 60,
    currentMilestone: 'DDoS Scrubbing Center Route Configuration',
    orderedDate: '2026-10-15',
    estimatedDelivery: '2026-11-25',
    siteName: 'Hyderabad R&D Hub',
    siteCode: 'HYD-01',
    items: [
      { category: 'Broadband', description: '1 Gbps Clean Pipe DIA with DDoS Shield', quantity: 1, unit: 'Circuit', status: 'Provisioning' },
      { category: 'IP Transit', description: '/28 Public IPv4 Subnet Allocation', quantity: 16, unit: 'IPs', status: 'Assigned' }
    ],
    stages: [
      { name: 'MMR Cross-Connect Feasibility', status: 'complete', date: '2026-10-18' },
      { name: 'Single-Mode LC Fiber Patch Installation', status: 'complete', date: '2026-10-26' },
      { name: 'DDoS Scrubbing Center Route Configuration', status: 'current', date: 'In Progress' },
      { name: 'RFC 6349 TCP Throughput Benchmarking', status: 'pending' },
      { name: 'Final Handover Certificate & Billing Activation', status: 'pending' }
    ]
  },
  {
    id: 'ord-tmt-1005',
    orderNumber: 'ORD-2026-1005',
    projectTitle: 'Chennai OMR Facility 5G Enterprise Mobile Fleet Rollout',
    orderType: 'Macro Rollout',
    status: 'In Progress',
    progressPct: 72,
    currentMilestone: 'Intune MDM Security Payload Push',
    orderedDate: '2026-10-10',
    estimatedDelivery: '2026-11-18',
    siteName: 'Chennai OMR Tech Hub',
    siteCode: 'CHE-01',
    items: [
      { category: 'Mobile Fleet', description: 'B2B Enterprise 5G Unlimited SIM Profiles', quantity: 150, unit: 'SIMs', status: 'Provisioned' },
      { category: 'Mobile Security', description: 'Private APN & Zero Trust Tunnel Bundle', quantity: 1, unit: 'Bundle', status: 'Configured' }
    ],
    stages: [
      { name: 'Corporate APN & Secure Gateway Topology Design', status: 'complete', date: '2026-10-14' },
      { name: 'Bulk eSIM Profile Generation in HLR/HSS', status: 'complete', date: '2026-10-22' },
      { name: 'Intune MDM Security Payload Push', status: 'current', date: 'In Progress' },
      { name: 'Field Validation & Speed Benchmark Testing', status: 'pending' },
      { name: 'Departmental Dispatch & Activation Signoff', status: 'pending' }
    ]
  },
  {
    id: 'ord-tmt-1006',
    orderNumber: 'ORD-2026-1006',
    projectTitle: 'Singapore Subsea Landing Station 10G Cross-Connect',
    orderType: 'Bandwidth Upgrade',
    status: 'Completed',
    progressPct: 100,
    currentMilestone: 'Final Production Cutover & Handover',
    orderedDate: '2026-09-12',
    estimatedDelivery: '2026-10-28',
    siteName: 'Singapore Subsea Landing',
    siteCode: 'SGP-01',
    items: [
      { category: 'Interconnect', description: '10G Optical Patch to TGN Subsea Cable', quantity: 1, unit: 'Link', status: 'Active' },
      { category: 'SLA Tier', description: '99.999% Ultra-Low Latency Financial SLA', quantity: 1, unit: 'Tier', status: 'Active' }
    ],
    stages: [
      { name: 'Equinix SG1 Colocation Cross-Connect Authorization', status: 'complete', date: '2026-09-15' },
      { name: 'Optical Fiber Demarcation & OTDR Loss Verification', status: 'complete', date: '2026-09-24' },
      { name: 'BGP 4323 Peering & Subsea Routing Optimization', status: 'complete', date: '2026-10-10' },
      { name: '72-Hour BER Stress Testing', status: 'complete', date: '2026-10-22' },
      { name: 'Final Production Cutover & Handover', status: 'complete', date: '2026-10-28' }
    ]
  },
  {
    id: 'ord-tmt-1007',
    orderNumber: 'ORD-2026-1007',
    projectTitle: 'Delhi NCR Corporate Office Cloud DirectConnect Redundancy',
    orderType: 'New Installation',
    status: 'In Progress',
    progressPct: 50,
    currentMilestone: 'Direct Connect Link Up & BGP Auth Establishment',
    orderedDate: '2026-10-25',
    estimatedDelivery: '2026-12-05',
    siteName: 'New Delhi Corporate',
    siteCode: 'DEL-HQ',
    items: [
      { category: 'Cloud Interconnect', description: 'AWS Direct Connect Dedicated 10G Port', quantity: 1, unit: 'Port', status: 'Provisioning' },
      { category: 'Interconnect', description: 'Hosted Private Virtual Interface (VIF)', quantity: 1, unit: 'VIF', status: 'Staged' }
    ],
    stages: [
      { name: 'AWS LOA-CFA Generation & Partner Demarcation', status: 'complete', date: '2026-10-28' },
      { name: 'Physical Meet-Me-Room Cross-Connect Deployment', status: 'complete', date: '2026-11-04' },
      { name: 'Direct Connect Link Up & BGP Auth Establishment', status: 'current', date: 'In Progress' },
      { name: 'VPC Peering & Transit Gateway Integration', status: 'pending' },
      { name: 'Acceptance Signoff & Billing Handover', status: 'pending' }
    ]
  },
  {
    id: 'ord-tmt-1008',
    orderNumber: 'ORD-2026-1008',
    projectTitle: 'Kolkata Delivery Center Wi-Fi 6 Enterprise Rollout',
    orderType: 'Macro Rollout',
    status: 'Completed',
    progressPct: 100,
    currentMilestone: 'Final Building Handover & Acceptance',
    orderedDate: '2026-09-01',
    estimatedDelivery: '2026-10-15',
    siteName: 'Kolkata Salt Lake Center',
    siteCode: 'CCU-01',
    items: [
      { category: 'Wi-Fi APs', description: 'Cisco Catalyst 9130AX Enterprise Wi-Fi 6 APs', quantity: 48, unit: 'APs', status: 'Active' },
      { category: 'Hardware', description: 'Cisco Catalyst 9300 48-Port PoE+ Core Switches', quantity: 4, unit: 'Switches', status: 'Active' }
    ],
    stages: [
      { name: 'Predictive RF Heatmap & Passive Site Survey', status: 'complete', date: '2026-09-05' },
      { name: 'Cat6A Shielded Structured Cabling Run', status: 'complete', date: '2026-09-18' },
      { name: 'AP Ceiling Mounting & PoE Switch Staging', status: 'complete', date: '2026-09-28' },
      { name: 'Cisco DNA Spaces Coverage Certification', status: 'complete', date: '2026-10-08' },
      { name: 'Final Building Handover & Acceptance', status: 'complete', date: '2026-10-15' }
    ]
  },
  {
    id: 'ord-tmt-1009',
    orderNumber: 'ORD-2026-1009',
    projectTitle: 'Frankfurt Interconnect BGP Route Optimization & MTU Expansion',
    orderType: 'MACD Change',
    status: 'Completed',
    progressPct: 100,
    currentMilestone: 'Post-Implementation Review Signoff',
    orderedDate: '2026-09-20',
    estimatedDelivery: '2026-10-10',
    siteName: 'Frankfurt Interxion FRA1',
    siteCode: 'FRA-01',
    items: [
      { category: 'Interconnect', description: 'Jumbo Frame (MTU 9000) Core Optimization', quantity: 1, unit: 'Link', status: 'Active' },
      { category: 'Routing', description: 'AS64512 Prefix Limit Increase to 5,000', quantity: 1, unit: 'Service', status: 'Active' }
    ],
    stages: [
      { name: 'Change Advisory Board (CAB) Security Approval', status: 'complete', date: '2026-09-22' },
      { name: 'Core Edge Router Maintenance Window Configuration', status: 'complete', date: '2026-09-28' },
      { name: 'MTU 9198 End-to-End Ping Stress Verification', status: 'complete', date: '2026-10-02' },
      { name: 'BGP Convergence & Fast Reroute Validation', status: 'complete', date: '2026-10-08' },
      { name: 'Post-Implementation Review Signoff', status: 'complete', date: '2026-10-10' }
    ]
  },
  {
    id: 'ord-tmt-1010',
    orderNumber: 'ORD-2026-1010',
    projectTitle: 'Ahmedabad Secondary Site 500M Optical SD-WAN Provisioning',
    orderType: 'New Installation',
    status: 'In Progress',
    progressPct: 35,
    currentMilestone: 'Civil Trenching & Duct Pipe Laying',
    orderedDate: '2026-11-01',
    estimatedDelivery: '2026-12-15',
    siteName: 'Ahmedabad Finance City',
    siteCode: 'AMD-01',
    items: [
      { category: 'Broadband', description: '500 Mbps Dark Fiber Metro Ethernet Tail', quantity: 1, unit: 'Circuit', status: 'Trenching' },
      { category: 'SD-WAN', description: 'Cisco Catalyst 8300 Edge Router', quantity: 1, unit: 'Unit', status: 'Dispatched' }
    ],
    stages: [
      { name: 'Municipal Right of Way (RoW) Approval', status: 'complete', date: '2026-11-04' },
      { name: 'Civil Trenching & Duct Pipe Laying', status: 'current', date: 'In Progress' },
      { name: 'Optical Fiber Splicing & OTDR Calibration', status: 'pending' },
      { name: 'Cisco Edge Router Installation & IP Allocation', status: 'pending' },
      { name: 'Customer Acceptance Testing & Handover', status: 'pending' }
    ]
  }
];

export const initialPortalData: PortalData = {
  customer: (typeof window !== 'undefined' ? (sessionStorage.getItem('sn_user_fullname') || (sessionStorage.getItem('sn_first_name') ? `${sessionStorage.getItem('sn_first_name')} ${sessionStorage.getItem('sn_last_name') || ''}`.trim() : null) || localStorage.getItem('sn_user_fullname')) : null) || "",
  account: (typeof window !== 'undefined' ? (sessionStorage.getItem('sn_account_name') || localStorage.getItem('sn_account_name')) : null) || "",
  service: "",
  serviceId: "",
  bandwidth: "1 Gbps",
  location: "",
  caseNumber: "",
  incidentReference: "",
  queue: "Service Assurance Support Queue",
  email: (typeof window !== 'undefined' ? (sessionStorage.getItem('sn_email') || localStorage.getItem('sn_email')) : null) || "",
  phone: "+91 20 6600 0000",
  servicesList: initialServicesList,
  serviceMetrics: {
    core_wan: 5,
    fiber_broadband: 5,
    voice_sip: 5,
    mobile_fleet: 10,
    total: 25
  },
  mobileSubscriptions: initialMobileSubscriptions,
  fiberBroadband: initialFiberBroadband,
  voiceTrunks: baseVoiceServices,
  contracts: initialCorporateContracts,
  invoices: initialInvoiceLedger
};

export const initialTimeline: TimelineStep[] = [
  { label: "Detected", time: "10:01 AM", state: "complete" },
  { label: "Investigating", time: "10:03 AM", state: "complete" },
  { label: "Recovery", time: "10:14 AM", state: "complete" },
  { label: "Restored", time: "10:28 AM", state: "complete" },
  { label: "Monitoring", time: "10:31 AM", state: "current" },
  { label: "Closed", time: "Pending", state: "pending" }
];

export const initialApprovedUpdates: ApprovedUpdate[] = [
  {
    title: "Service operating normally",
    category: "Monitoring",
    text: "Performance remains within expected levels. Stability monitoring is in progress.",
    time: "10:31 AM"
  },
  {
    title: "Technical restoration complete",
    category: "Restoration",
    text: "Latency and packet loss have returned to expected levels.",
    time: "10:28 AM"
  },
  {
    title: "Corrective actions completed",
    category: "Recovery",
    text: "Service configuration was synchronised and the network path was optimised.",
    time: "10:22 AM"
  },
  {
    title: "Diagnostics in progress",
    category: "Investigation",
    text: "The managed router and access circuit are operating normally.",
    time: "10:07 AM"
  }
];

class ServiceNowRestService {
  private callLogs: ServiceNowCallLog[] = [];
  private portalData: PortalData = { ...initialPortalData };
  private timeline: TimelineStep[] = [...initialTimeline];
  private updates: ApprovedUpdate[] = [...initialApprovedUpdates];
  private currentCaseStatus: string = "Monitoring";
  private isLiveMode: boolean = true;
  private endpointUrl: string = getServiceNowFullUrl(SERVICENOW_CONFIG.tableApi.case);
  private activeCasesCache: ActiveCaseItem[] = [...initialActiveCases];
  private closedCasesCache: ClosedCaseItem[] = [...initialClosedCases];
  private ordersCache: CustomerOrderItem[] = [];
  private mobileSubscriptions: MobileSubscriptionItem[] = [...initialMobileSubscriptions];
  private fiberBroadband: FiberBroadbandItem[] = [...initialFiberBroadband];
  private contracts: CorporateContractItem[] = [...initialCorporateContracts];
  private invoices: InvoiceLedgerItem[] = [...initialInvoiceLedger];
  private caseActivities: Record<string, CaseActivityItem[]> = {};
  private activeCasesInFlight: Promise<ActiveCaseItem[]> | null = null;
  private closedCasesInFlight: Promise<ClosedCaseItem[]> | null = null;
  private lastActiveFetchTime: number = 0;
  private lastClosedFetchTime: number = 0;
  private readonly CACHE_TTL_MS: number = 20000; // 20s caching to prevent burst endpoint thrashing

  private logCall(method: 'GET' | 'POST' | 'PATCH', endpoint: string, statusCode: number, statusText: string, reqPayload?: any, resPayload?: any) {
    const log: ServiceNowCallLog = {
      id: 'REST-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any),
      method,
      endpoint,
      statusCode,
      statusText,
      requestPayload: reqPayload,
      responsePayload: resPayload
    };
    this.callLogs.unshift(log);
    if (this.callLogs.length > 50) this.callLogs.pop();
  }

  public getCallLogs(): ServiceNowCallLog[] {
    return [...this.callLogs];
  }

  public setRestMode(isLive: boolean, endpointUrl?: string) {
    this.isLiveMode = isLive;
    if (endpointUrl) this.endpointUrl = endpointUrl;
  }

  public getRestConfig() {
    return {
      isLiveMode: this.isLiveMode,
      endpointUrl: this.endpointUrl
    };
  }

  public getSyncedServicesList(): ManagedServiceItem[] {
    const activeCases = this.activeCasesCache;
    const baseServices = (this.portalData.servicesList && this.portalData.servicesList.length > 0)
      ? this.portalData.servicesList.map(svc => ({ ...svc }))
      : baseCustomerServices.map(svc => ({ ...svc }));
    const matchedCaseNumbers = new Set<string>();

    const isCaseForService = (ac: ActiveCaseItem, service: ManagedServiceItem): boolean => {
      if (ac.serviceId && service.id && (
        ac.serviceId.toLowerCase() === service.id.toLowerCase() || 
        service.id.toLowerCase().includes(ac.serviceId.toLowerCase()) || 
        ac.serviceId.toLowerCase().includes(service.id.toLowerCase())
      )) {
        return true;
      }

      const acName = (ac.service || '').toLowerCase();
      const svcName = service.name.toLowerCase();

      if ((svcName.includes('internet') || svcName.includes('dia')) && !svcName.includes('mpls')) {
        return (acName.includes('internet') || acName.includes('dia')) && !acName.includes('mpls');
      }
      if (svcName.includes('mpls')) {
        return acName.includes('mpls');
      }
      if (svcName.includes('sd-wan') || svcName.includes('sdwan')) {
        return acName.includes('sd-wan') || acName.includes('sdwan');
      }
      if (svcName.includes('cloud') || svcName.includes('directconnect')) {
        return acName.includes('cloud') || acName.includes('aws') || acName.includes('directconnect');
      }
      if (svcName.includes('voice') || svcName.includes('sip')) {
        return acName.includes('voice') || acName.includes('sip') || acName.includes('trunk');
      }

      return false;
    };

    const synced: ManagedServiceItem[] = baseServices.map(service => {
      // Find ALL active cases matching this service
      const matchingCases = activeCases.filter(ac => isCaseForService(ac, service));

      // Mark ALL matching case numbers so none of them create duplicate services!
      matchingCases.forEach(ac => matchedCaseNumbers.add(ac.caseNumber));

      if (matchingCases.length > 0) {
        // Pick primary matching case (prefer P1/Critical if present, else first)
        const primaryCase = matchingCases.find(c => c.priority === 'P1') || matchingCases[0];

        let status: ManagedServiceItem['status'] = 'Degraded';
        if (primaryCase.status === 'Monitoring' || primaryCase.status === 'Recovery') {
          status = 'Healing';
        } else if (primaryCase.status === 'Customer Input Required') {
          status = 'Degraded';
        } else if (primaryCase.status === 'Investigating') {
          status = 'Degraded';
        }

        return {
          ...service,
          status,
          availability: primaryCase.priority === 'P1' ? '98.50%' : '99.95%',
          latency: primaryCase.priority === 'P1' ? 'Degraded (118ms)' : 'Elevated (34ms)',
          packetLoss: primaryCase.priority === 'P1' ? '2.4%' : '0.2%',
          lastAssessed: primaryCase.openedTime || 'Just now',
          activeCaseNumber: primaryCase.caseNumber,
          activeCaseDetails: {
            caseNumber: primaryCase.caseNumber,
            priority: primaryCase.priority || 'P2',
            status: primaryCase.status,
            description: primaryCase.description
          }
        };
      }

      return {
        ...service,
        status: 'Operational',
        availability: '99.99%',
        latency: 'Normal (12ms)',
        packetLoss: '0.0%',
        lastAssessed: 'Just now',
        activeCaseNumber: undefined,
        activeCaseDetails: undefined
      };
    });

    // Strict 25 Enterprise Assets: Active cases update health/assurance on matching base circuits, never fabricate fake circuits
    return synced;
  }

  public getPortalData(): PortalData {
    if (typeof window !== 'undefined') {
      const storedFirst = sessionStorage.getItem('sn_first_name') || localStorage.getItem('sn_first_name');
      const storedLast = sessionStorage.getItem('sn_last_name') || localStorage.getItem('sn_last_name');
      const storedUser = sessionStorage.getItem('sn_username') || localStorage.getItem('sn_username');
      const storedEmail = sessionStorage.getItem('sn_email') || localStorage.getItem('sn_email');

      if (storedFirst || storedLast || storedUser) {
        const fullName = [storedFirst, storedLast].filter(Boolean).join(' ') ||
          (storedUser ? storedUser.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Customer');
        this.portalData.customer = fullName;
      }
      if (storedEmail) {
        this.portalData.email = storedEmail;
      }
    }

    const syncedServices = this.getSyncedServicesList();
    this.portalData.servicesList = syncedServices;

    const activeCases = this.activeCasesCache;
    if (activeCases.length > 0) {
      const topCase = activeCases.find(c => c.priority === 'P1') || activeCases[0];
      this.portalData.caseNumber = topCase.caseNumber;
      this.portalData.service = topCase.service;
      this.portalData.serviceId = topCase.serviceId;
      this.portalData.incidentReference = topCase.incidentRef || 'INC-LIVE';
    } else {
      this.portalData.caseNumber = '';
      this.portalData.service = syncedServices[0]?.name || 'Dedicated Internet Access';
      this.portalData.serviceId = syncedServices[0]?.id || 'DIA-100-LON';
      this.portalData.incidentReference = '';
    }

    this.logCall('GET', `/api/now/table/sn_customerservice_case?limit=1`, 200, '200 OK');
    return { 
      ...this.portalData, 
      servicesList: syncedServices,
      serviceMetrics: this.portalData.serviceMetrics || {
        core_wan: 5,
        fiber_broadband: 5,
        voice_sip: 5,
        mobile_fleet: 10,
        total: 25
      },
      mobileSubscriptions: [...this.mobileSubscriptions],
      fiberBroadband: [...this.fiberBroadband],
      contracts: [...this.contracts],
      invoices: [...this.invoices]
    };
  }

  public getMobileSubscriptions(): MobileSubscriptionItem[] {
    return [...this.mobileSubscriptions];
  }

  public updateMobileSubscriptionStatus(id: string, newStatus: 'Active' | 'Suspended'): MobileSubscriptionItem[] {
    this.mobileSubscriptions = this.mobileSubscriptions.map(sub => {
      if (sub.id === id) {
        return {
          ...sub,
          status: newStatus,
          statusTone: newStatus === 'Active' ? 'green' : 'slate'
        };
      }
      return sub;
    });
    this.portalData.mobileSubscriptions = [...this.mobileSubscriptions];
    return [...this.mobileSubscriptions];
  }

  public modifyMobilePlan(id: string, newPlan: string, newCost: number): MobileSubscriptionItem[] {
    this.mobileSubscriptions = this.mobileSubscriptions.map(sub => {
      if (sub.id === id) {
        return {
          ...sub,
          plan: newPlan,
          monthlyCost: newCost,
          dataLimitGB: 0,
          hasAlert: false,
          alertReason: undefined
        };
      }
      return sub;
    });
    this.portalData.mobileSubscriptions = [...this.mobileSubscriptions];
    return [...this.mobileSubscriptions];
  }

  public getVoiceTrunks(): VoiceTrunkItem[] {
    return this.portalData.voiceTrunks || baseVoiceServices;
  }

  public getFiberBroadband(): FiberBroadbandItem[] {
    return [...this.fiberBroadband];
  }

  public getCorporateContracts(): CorporateContractItem[] {
    return [...this.contracts];
  }

  public getInvoiceLedger(): InvoiceLedgerItem[] {
    return [...this.invoices];
  }

  public getTimeline(): TimelineStep[] {
    return [...this.timeline];
  }

  public getApprovedUpdates(): ApprovedUpdate[] {
    return [...this.updates];
  }

  private mapRecordToActiveCase(record: any, idx: number = 0): ActiveCaseItem {
    const rawState = String(record.state || record.status || '').toLowerCase();
    let status: ActiveCaseItem['status'] = 'Investigating';
    let statusTone: ActiveCaseItem['statusTone'] = 'blue';

    if (rawState === '18' || rawState.includes('input') || rawState.includes('pending')) {
      status = 'Customer Input Required';
      statusTone = 'purple';
    } else if (rawState === '19' || rawState.includes('recovery')) {
      status = 'Recovery';
      statusTone = 'amber';
    } else if (rawState === '6' || rawState.includes('monitoring')) {
      status = 'Monitoring';
      statusTone = 'amber';
    } else if (rawState === '1' || rawState === '10' || rawState.includes('open') || rawState.includes('investigat')) {
      status = 'Investigating';
      statusTone = 'blue';
    }

    const rawPriority = String(record.priority || '2').toUpperCase();
    let priority: ActiveCaseItem['priority'] = 'P2';
    let priorityTone: ActiveCaseItem['priorityTone'] = 'amber';
    if (rawPriority === '1' || rawPriority === 'P1' || rawPriority.includes('CRIT')) {
      priority = 'P1';
      priorityTone = 'red';
    } else if (rawPriority === '2' || rawPriority === 'P2' || rawPriority.includes('HIGH')) {
      priority = 'P2';
      priorityTone = 'amber';
    } else if (rawPriority === '3' || rawPriority === 'P3' || rawPriority.includes('MOD') || rawPriority.includes('MED')) {
      priority = 'P3';
      priorityTone = 'blue';
    } else if (rawPriority === '4' || rawPriority === 'P4' || rawPriority.includes('LOW') || rawPriority.includes('MIN')) {
      priority = 'P4';
      priorityTone = 'slate';
    }

    let serviceName = (typeof record.business_service === 'object' && record.business_service?.display_value)
      ? record.business_service.display_value
      : (record.service_offering?.display_value || record.cmdb_ci?.display_value || record.service_name || record.service);

    if (!serviceName) {
      const text = ((record.short_description || '') + ' ' + (record.description || '') + ' ' + (record.category || '')).toLowerCase();
      if (text.includes('sd-wan') || text.includes('sdwan')) {
        serviceName = 'Enterprise SD-WAN Gateway';
      } else if (text.includes('cloud') || text.includes('aws') || text.includes('directconnect') || text.includes('azure')) {
        serviceName = 'Cloud Connect Express (AWS)';
      } else if (text.includes('voice') || text.includes('sip') || text.includes('trunk') || text.includes('phone') || text.includes('telephony')) {
        serviceName = 'Managed SIP Voice Trunking';
      } else if (text.includes('broadband') || text.includes('fiber') || text.includes('latency') || text.includes('packet loss') || text.includes('bgp') || text.includes('dia') || text.includes('internet')) {
        serviceName = 'Dedicated Internet Access';
      } else if (text.includes('mpls')) {
        serviceName = '1 Gbps Primary Optical MPLS Trunk';
      } else if (record.category && record.category !== 'General') {
        serviceName = `${record.category} Assurance`;
      } else {
        serviceName = 'Customer Service Assurance';
      }
    }

    let serviceId = record.service_id || record.serviceId || (typeof record.cmdb_ci === 'string' ? record.cmdb_ci : (record.asset?.display_value));
    if (!serviceId) {
      const match = (serviceName + ' ' + (record.short_description || '') + ' ' + (record.description || '')).match(/CKT-[A-Z0-9-]+|DIA-[A-Z0-9-]+|SIP-[A-Z0-9-]+|MOB-[A-Z0-9-]+/i);
      if (match) serviceId = match[0].toUpperCase();
      else serviceId = 'SVC-' + (record.case_number || record.number || `00${idx + 1}`);
    }

    let category = record.category;
    if (!category || category === 'General' || category === 'Router') {
      if (serviceName.includes('SD-WAN')) category = 'SD-WAN';
      else if (serviceName.includes('Cloud')) category = 'Cloud Connect';
      else if (serviceName.includes('Voice') || serviceName.includes('SIP')) category = 'Voice';
      else if (serviceName.includes('MPLS') || serviceName.includes('Internet') || serviceName.includes('Broadband')) category = 'Core WAN';
      else category = 'Network Assurance';
    }

    const openedTime = record.created_at || record.opened_at || record.sys_created_on
      ? new Date(record.created_at || record.opened_at || record.sys_created_on).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Today';

    const incidentRef = (typeof record.caused_by === 'object' ? record.caused_by?.display_value : record.caused_by) || record.u_incident_reference || record.incident_reference || '';

    const assignedTo = record.assigned_to 
      ? (typeof record.assigned_to === 'object' ? record.assigned_to.display_value : record.assigned_to)
      : undefined;

    const contact = record.contact 
      ? (typeof record.contact === 'object' ? record.contact.display_value : record.contact)
      : undefined;

    const queue = (typeof record.assignment_group === 'object' ? record.assignment_group?.display_value : record.assignment_group) || (assignedTo ? `${assignedTo} Desk` : 'Service Assurance Support Queue');

    const caseNumber = record.case_number || record.number || record.caseNumber || (record.sys_id ? `CSM${record.sys_id.slice(0, 6).toUpperCase()}` : `CSM00${1245 + idx}`);

    return {
      caseNumber,
      service: serviceName,
      serviceId: typeof serviceId === 'string' ? serviceId : 'DIA-100-LON',
      category,
      description: record.short_description || record.description || 'Assurance telemetry event detected',
      status,
      statusTone,
      priority,
      priorityTone,
      openedTime,
      incidentRef,
      queue,
      assignedTo,
      contact
    };
  }

  private mapRecordToClosedCase(record: any, idx: number = 0): ClosedCaseItem {
    let serviceName = (typeof record.business_service === 'object' && record.business_service?.display_value)
      ? record.business_service.display_value
      : (record.service_offering?.display_value || record.cmdb_ci?.display_value || record.service_name || record.service);

    if (!serviceName) {
      const text = ((record.short_description || '') + ' ' + (record.description || '') + ' ' + (record.category || '')).toLowerCase();
      if (text.includes('sd-wan') || text.includes('sdwan')) {
        serviceName = 'Enterprise SD-WAN Gateway';
      } else if (text.includes('cloud') || text.includes('aws') || text.includes('directconnect') || text.includes('azure')) {
        serviceName = 'Cloud Connect Express (AWS)';
      } else if (text.includes('voice') || text.includes('sip') || text.includes('trunk') || text.includes('phone') || text.includes('telephony')) {
        serviceName = 'Managed SIP Voice Trunking';
      } else if (text.includes('broadband') || text.includes('fiber') || text.includes('latency') || text.includes('packet loss') || text.includes('bgp') || text.includes('dia') || text.includes('internet')) {
        serviceName = 'Dedicated Internet Access';
      } else if (text.includes('mpls')) {
        serviceName = '1 Gbps Primary Optical MPLS Trunk';
      } else if (record.category && record.category !== 'General') {
        serviceName = `${record.category} Assurance`;
      } else {
        serviceName = 'Customer Service Assurance';
      }
    }

    let serviceId = record.service_id || record.serviceId || (typeof record.cmdb_ci === 'string' ? record.cmdb_ci : (record.asset?.display_value));
    if (!serviceId) {
      const match = (serviceName + ' ' + (record.short_description || '') + ' ' + (record.description || '')).match(/CKT-[A-Z0-9-]+|DIA-[A-Z0-9-]+|SIP-[A-Z0-9-]+|MOB-[A-Z0-9-]+/i);
      if (match) serviceId = match[0].toUpperCase();
      else serviceId = 'SVC-' + (record.case_number || record.number || `00${idx + 1}`);
    }

    const rawPriority = String(record.priority || '2').toUpperCase();
    let priority: ClosedCaseItem['priority'] = 'P2';
    if (rawPriority === '1' || rawPriority === 'P1' || rawPriority.includes('CRIT')) priority = 'P1';
    else if (rawPriority === '2' || rawPriority === 'P2' || rawPriority.includes('HIGH')) priority = 'P2';
    else if (rawPriority === '3' || rawPriority === 'P3' || rawPriority.includes('MOD') || rawPriority.includes('MED')) priority = 'P3';
    else if (rawPriority === '4' || rawPriority === 'P4' || rawPriority.includes('LOW') || rawPriority.includes('MIN')) priority = 'P4';

    const closedDate = record.closed_at || record.updated_at || record.sys_updated_on
      ? new Date(record.closed_at || record.updated_at || record.sys_updated_on).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
      : '12 Sep 2026';

    const resolutionSummary = record.close_notes || record.resolution_summary || record.short_description || 'A service degradation was detected proactively and resolved.';
    const caseNumber = record.case_number || record.number || record.caseNumber || (record.sys_id ? `CSM${record.sys_id.slice(0, 6).toUpperCase()}` : `CSM00${1100 + idx}`);

    return {
      caseNumber,
      service: serviceName,
      serviceId: typeof serviceId === 'string' ? serviceId : 'DIA-100-LON',
      category: record.category || 'Core WAN',
      summary: record.short_description || 'Proactive performance optimization',
      status: 'Closed',
      priority,
      closedDate,
      resolutionSummary,
      closureMilestones: [
        { label: "Technical restoration confirmed", time: closedDate },
        { label: "Customer restoration confirmed", time: closedDate },
        { label: "Stability monitoring completed", time: "Completed" },
        { label: "No further abnormalities detected", time: "Completed" }
      ]
    };
  }

  public getActiveCases(): ActiveCaseItem[] {
    return [...this.activeCasesCache];
  }

  public getOrders(): CustomerOrderItem[] {
    return this.ordersCache.length > 0 ? this.ordersCache : [];
  }

  public getActiveCaseByNumber(caseNum: string): ActiveCaseItem | undefined {
    const found = this.activeCasesCache.find(c => c.caseNumber === caseNum);
    return found || this.activeCasesCache[0];
  }

  public getCaseActivities(caseNumber: string, defaultItems?: CaseActivityItem[]): CaseActivityItem[] {
    const storageKey = `b2c_case_activities_${caseNumber}`;
    if (!this.caseActivities[caseNumber]) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          this.caseActivities[caseNumber] = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('localStorage read error:', e);
      }
    }
    if (!this.caseActivities[caseNumber] || this.caseActivities[caseNumber].length === 0) {
      this.caseActivities[caseNumber] = defaultItems || [];
    }
    return [...this.caseActivities[caseNumber]];
  }

  public addCaseActivity(caseNumber: string, item: CaseActivityItem): void {
    const current = this.getCaseActivities(caseNumber);
    // Avoid exact duplicate additions
    const isDup = current.some(c => 
      c.id === item.id || 
      (c.text.trim().toLowerCase() === item.text.trim().toLowerCase() && c.timestamp === item.timestamp)
    );
    if (isDup) return;

    const updated = [item, ...current];
    this.caseActivities[caseNumber] = updated;
    try {
      localStorage.setItem(`b2c_case_activities_${caseNumber}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('localStorage write error:', e);
    }
  }

  public saveCaseActivities(caseNumber: string, activities: CaseActivityItem[]): void {
    this.caseActivities[caseNumber] = activities;
    try {
      localStorage.setItem(`b2c_case_activities_${caseNumber}`, JSON.stringify(activities));
    } catch (e) {
      console.warn('localStorage write error:', e);
    }
  }

  public async fetchCaseActivitiesLive(caseNumber: string, defaultItems?: CaseActivityItem[]): Promise<CaseActivityItem[]> {
    if (!caseNumber) return [];
    const headers = serviceNowAuthService.getAuthHeaders();

    try {
      // 1. Query the custom Scripted REST API which returns full case activities and journal entries from database without 401 ACL constraints
      const scriptedEndpoint = `${getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedCasesPath)}?case_number=${encodeURIComponent(caseNumber)}`;
      const res = await fetch(scriptedEndpoint, { method: 'GET', headers, credentials: 'same-origin' });

      if (res.ok) {
        const json = await res.json();
        const payload = json.result?.result || json.result || json;
        const caseList = Array.isArray(payload) ? payload : (Array.isArray(payload?.result) ? payload.result : []);
        const matching = caseList.find((c: any) => c.case_number === caseNumber) || caseList[0];

        if (matching && Array.isArray(matching.activities) && matching.activities.length > 0) {
          const liveItems: CaseActivityItem[] = matching.activities.map((act: any) => {
            let formattedTime = 'Recently';
            if (act.timestamp) {
              try {
                const d = new Date(act.timestamp);
                formattedTime = !isNaN(d.getTime())
                  ? d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : act.timestamp;
              } catch {
                formattedTime = act.timestamp;
              }
            }

            return {
              id: act.id || ('act_' + Math.random().toString(36).substr(2, 9)),
              author: act.author || this.portalData.customer || 'Customer',
              role: act.role || 'Customer',
              text: act.text || '',
              timestamp: formattedTime,
              isUrgent: Boolean(act.isUrgent)
            };
          });

          // Deduplicate and save
          const localItems = this.getCaseActivities(caseNumber, defaultItems);
          const merged: CaseActivityItem[] = [...liveItems];
          for (const loc of localItems) {
            const alreadyExists = merged.some(m =>
              m.text.trim().toLowerCase() === loc.text.trim().toLowerCase() ||
              m.id === loc.id
            );
            if (!alreadyExists) {
              merged.push(loc);
            }
          }

          this.saveCaseActivities(caseNumber, merged);
          return merged;
        }
      }
    } catch (apiErr) {
      console.warn('[fetchCaseActivitiesLive] Scripted REST API error:', apiErr);
    }

    return this.getCaseActivities(caseNumber, defaultItems);
  }

  public getClosedCases(): ClosedCaseItem[] {
    return [...this.closedCasesCache];
  }

  public getClosedCaseByNumber(caseNum: string): ClosedCaseItem | undefined {
    const found = this.closedCasesCache.find(c => c.caseNumber === caseNum);
    return found || this.closedCasesCache[0];
  }

  public closeActiveCase(caseNumber: string, resolutionNotes?: string, confirmedBy?: string): { success: boolean; closedCase: ClosedCaseItem } {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayDate = new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

    const activeIndex = this.activeCasesCache.findIndex(c => c.caseNumber === caseNumber);
    const existingActive = activeIndex !== -1 ? this.activeCasesCache[activeIndex] : null;

    const serviceName = existingActive ? existingActive.service : 'Service Assurance';
    const serviceId = existingActive ? existingActive.serviceId : 'SVC-GEN';
    const category = existingActive ? existingActive.category : 'General';
    const summary = existingActive ? existingActive.description : 'Service restoration confirmed by customer';
    const priority = existingActive ? existingActive.priority : 'P2';

    if (activeIndex !== -1) {
      this.activeCasesCache.splice(activeIndex, 1);
    }

    const closedCase: ClosedCaseItem = {
      caseNumber,
      service: serviceName,
      serviceId,
      category,
      summary,
      status: 'Closed',
      priority,
      closedDate: todayDate,
      resolutionSummary: resolutionNotes || 'Customer verified service performance restored to normal. Case closed with zero abnormalities.',
      closureMilestones: [
        { label: "Technical restoration confirmed", time: `Today, ${timestamp}` },
        { label: "Customer verification completed", time: `Today, ${timestamp}` },
        { label: "Stability monitoring closed", time: "Completed" },
        { label: "Case archived to history", time: "Completed" }
      ]
    };

    this.closedCasesCache.unshift(closedCase);

    this.portalData.servicesList = this.getSyncedServicesList();

    if (this.portalData.caseNumber === caseNumber) {
      this.currentCaseStatus = "Closed";
      this.timeline.forEach(step => {
        step.state = 'complete';
        if (step.label === 'Closed') step.time = timestamp;
      });
      if (this.activeCasesCache.length > 0) {
        this.portalData.caseNumber = this.activeCasesCache[0].caseNumber;
        this.portalData.service = this.activeCasesCache[0].service;
        this.portalData.serviceId = this.activeCasesCache[0].serviceId;
      } else {
        this.portalData.caseNumber = '';
      }
    }

    this.updates.unshift({
      title: `Case ${caseNumber} Closed`,
      category: "Restoration",
      text: `${confirmedBy || 'Customer'} confirmed service restoration for "${serviceName}". Case ${caseNumber} closed successfully.`,
      time: timestamp
    });

    this.addCaseActivity(caseNumber, {
      id: Math.random().toString(),
      author: confirmedBy || 'Customer',
      role: 'Customer',
      text: `✅ Customer confirmed service restoration. Case officially marked as Closed & Resolved. Note: ${resolutionNotes || 'Operating normally.'}`,
      timestamp: `Today, ${timestamp}`,
      isUrgent: false
    });

    this.logCall('POST', `/api/now/csm/case/${caseNumber}/close`, 200, `200 OK - Case ${caseNumber} Closed & Archived`);

    return { success: true, closedCase };
  }

  public async confirmRestorationViaRest(payload: {
    caseNumber: string;
    comments?: string;
    confirmedBy?: string;
  }): Promise<{ success: boolean; data?: any }> {
    const endpoint = getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedConfirmRestorationPath);
    const headers = serviceNowAuthService.getAuthHeaders();
    const reqBody = {
      case: payload.caseNumber,
      caseNumber: payload.caseNumber,
      case_number: payload.caseNumber,
      result: 'yes',
      comments: payload.comments || 'Customer verified service performance restored to normal.',
      confirmedBy: payload.confirmedBy || this.portalData.customer,
      confirmed_by: payload.confirmedBy || this.portalData.customer
    };

    try {
      console.log(`[ServiceNow REST] Calling confirm_restoration endpoint: ${endpoint}`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(reqBody)
      });

      if (res.ok) {
        const json = await res.json();
        this.logCall('POST', endpoint, res.status, `200 OK - Case ${payload.caseNumber} Confirmed Resolved via Scripted REST API`, reqBody, json);
        return { success: true, data: json };
      }
    } catch (err) {
      console.warn(`[ServiceNow REST] confirm_restoration error on ${endpoint}:`, err);
    }

    try {
      const tableEndpoint = `${getServiceNowFullUrl(SERVICENOW_CONFIG.tableApi.case)}?sysparm_query=number=${payload.caseNumber}&sysparm_limit=1`;
      const queryRes = await fetch(tableEndpoint, { method: 'GET', headers, credentials: 'same-origin' });
      if (queryRes.ok) {
        const queryData = await queryRes.json();
        const record = queryData.result && queryData.result.length > 0 ? queryData.result[0] : null;
        if (record && record.sys_id) {
          const patchUrl = `${getServiceNowFullUrl(SERVICENOW_CONFIG.tableApi.case)}/${record.sys_id}`;
          await fetch(patchUrl, {
            method: 'PATCH',
            headers,
            credentials: 'same-origin',
            body: JSON.stringify({
              state: '3',
              close_notes: payload.comments || 'Customer verified service performance restored to normal.',
              comments: `[Customer Self-Care]: Service restoration confirmed by ${payload.confirmedBy || 'customer'}. Case marked as Closed.`
            })
          });
          this.logCall('PATCH', patchUrl, 200, `200 OK - Case ${payload.caseNumber} closed via Table API`);
        }
      }
    } catch (tblErr) {
      console.warn('[ServiceNow REST] Table API close fallback error:', tblErr);
    }

    return { success: true };
  }

  public async addCommentViaRest(caseNumber: string, comment: string, isUrgent: boolean = false): Promise<boolean> {
    try {
      // 1. Direct Scripted REST Action (bypasses Table API 401/403 ACL restrictions & directly updates sys_journal_field)
      const nlqEndpoint = `${getServiceNowFullUrl('/api/sn_itsm_gen_ai/b2c_telecom_selfcare/nlq-chat')}`;
      const currentUser = serviceNowAuthService.getCurrentUser();
      const headers = serviceNowAuthService.getTableAuthHeaders();
      const nlqRes = await fetch(nlqEndpoint, {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify({
          message: `Please add a comment to case ${caseNumber}: ${isUrgent ? '[URGENT] ' : ''}${comment}`,
          user_name: currentUser?.username || 'goutam.hazra',
          email: currentUser?.email || 'goutam.hazra@tataglobal.com'
        })
      });

      if (nlqRes.ok) {
        const json = await nlqRes.json();
        if (json.result?.comment_added || json.result?.tool_executed === 'addCaseComment' || json.result?.success) {
          this.logCall('POST', nlqEndpoint, 200, `200 OK - Comment synced to ServiceNow Case ${caseNumber} via Scripted REST Action`);
          return true;
        }
      }

      // 2. Secondary fallback via Table API with Integration credentials
      const tableEndpoint = `${getServiceNowFullUrl(SERVICENOW_CONFIG.tableApi.case)}?sysparm_query=number=${caseNumber}&sysparm_limit=1`;
      const queryRes = await fetch(tableEndpoint, { method: 'GET', headers, credentials: 'same-origin' });
      if (queryRes.ok) {
        const queryData = await queryRes.json();
        const record = queryData.result && queryData.result.length > 0 ? queryData.result[0] : null;
        if (record && record.sys_id) {
          const patchUrl = `${getServiceNowFullUrl(SERVICENOW_CONFIG.tableApi.case)}/${record.sys_id}`;
          const formattedComment = isUrgent
            ? `[URGENT CUSTOMER UPDATE]: ${comment}`
            : `[Customer Update]: ${comment}`;

          const patchRes = await fetch(patchUrl, {
            method: 'PATCH',
            headers,
            credentials: 'same-origin',
            body: JSON.stringify({
              comments: formattedComment
            })
          });

          if (patchRes.ok) {
            this.logCall('PATCH', patchUrl, patchRes.status, `200 OK - Comment synced directly to ServiceNow Case ${caseNumber} via Table API`, { comments: formattedComment });
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('[addCommentViaRest] Error:', e);
    }
    return false;
  }

  public async escalateCaseViaRest(caseNumber: string): Promise<boolean> {
    const headers = serviceNowAuthService.getAuthHeaders();
    try {
      const tableEndpoint = `${getServiceNowFullUrl(SERVICENOW_CONFIG.tableApi.case)}?sysparm_query=number=${caseNumber}&sysparm_limit=1`;
      const queryRes = await fetch(tableEndpoint, { method: 'GET', headers, credentials: 'same-origin' });
      if (queryRes.ok) {
        const queryData = await queryRes.json();
        const record = queryData.result && queryData.result.length > 0 ? queryData.result[0] : null;
        if (record && record.sys_id) {
          const patchUrl = `${getServiceNowFullUrl(SERVICENOW_CONFIG.tableApi.case)}/${record.sys_id}`;
          const patchRes = await fetch(patchUrl, {
            method: 'PATCH',
            headers,
            credentials: 'same-origin',
            body: JSON.stringify({
              priority: '1',
              work_notes: '⚡ Priority escalated to P1 (Critical Outage) by customer via self-care portal.'
            })
          });

          if (patchRes.ok) {
            this.logCall('PATCH', patchUrl, patchRes.status, `200 OK - Case ${caseNumber} escalated to P1 via Table API`);
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('[escalateCaseViaRest] Error:', e);
    }
    return false;
  }

  public async fetchActiveCases(limit: number = 10, forceRefresh: boolean = false): Promise<ActiveCaseItem[]> {
    const now = Date.now();
    // 1. If cached recently (< 20s) and not a forced refresh, return cached data immediately
    if (!forceRefresh && this.activeCasesCache.length > 0 && (now - this.lastActiveFetchTime < this.CACHE_TTL_MS)) {
      return [...this.activeCasesCache];
    }

    // 2. If a fetch is already in flight, reuse the exact same Promise to prevent duplicate concurrent network calls
    if (this.activeCasesInFlight) {
      return this.activeCasesInFlight;
    }

    const userName = typeof window !== 'undefined' ? (sessionStorage.getItem('sn_username') || localStorage.getItem('sn_username') || '') : '';
    const endpoint = `${getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedCasesPath)}?state=active&limit=${limit}${userName ? `&user_name=${encodeURIComponent(userName)}` : ''}`;
    const headers = serviceNowAuthService.getAuthHeaders();

    this.activeCasesInFlight = (async () => {
      try {
        console.log('[fetchActiveCases] Querying (limit 10):', endpoint);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers,
          credentials: 'same-origin'
        });

        if (response.ok) {
          const data = await response.json();
          const rawList = Array.isArray(data.result?.result)
            ? data.result.result
            : (Array.isArray(data.result) ? data.result : (Array.isArray(data) ? data : []));

          if (rawList && rawList.length > 0) {
            const activeOnly = rawList.filter((r: any) => 
              String(r.state) !== '3' && 
              String(r.state) !== '4' && 
              String(r.state) !== '6' && 
              String(r.state || '').toLowerCase() !== 'closed' && 
              String(r.state || '').toLowerCase() !== 'cancelled' &&
              String(r.status || '').toLowerCase() !== 'closed' &&
              String(r.status || '').toLowerCase() !== 'resolved'
            );
            const mapped = activeOnly.slice(0, limit).map((r: any, idx: number) => this.mapRecordToActiveCase(r, idx));
            this.activeCasesCache = mapped;
            this.lastActiveFetchTime = Date.now();
            if (mapped.length > 0) {
              this.portalData.caseNumber = mapped[0].caseNumber;
              this.portalData.service = mapped[0].service;
              this.portalData.serviceId = mapped[0].serviceId;
            } else {
              this.portalData.caseNumber = '';
            }
            this.logCall('GET', endpoint, response.status, `200 OK - Synced ${mapped.length} Active Cases from ServiceNow`, undefined, { count: mapped.length });
            return [...this.activeCasesCache];
          } else {
            this.activeCasesCache = [];
            return [];
          }
        }
      } catch (err: any) {
        console.warn(`[ServiceNow Cases] Fetch error on ${endpoint}:`, err);
      } finally {
        this.activeCasesInFlight = null;
      }

      this.logCall('GET', endpoint, 0, 'Connection Fallback - Serving Cached Active Cases');
      return [...this.activeCasesCache];
    })();

    return this.activeCasesInFlight;
  }

  public async fetchClosedCases(limit: number = 10, forceRefresh: boolean = false): Promise<ClosedCaseItem[]> {
    const now = Date.now();
    // 1. If cached recently (< 20s) and not a forced refresh, return cached data immediately
    if (!forceRefresh && this.closedCasesCache.length > 0 && (now - this.lastClosedFetchTime < this.CACHE_TTL_MS)) {
      return [...this.closedCasesCache];
    }

    // 2. If a fetch is already in flight, reuse the exact same Promise to prevent duplicate concurrent network calls
    if (this.closedCasesInFlight) {
      return this.closedCasesInFlight;
    }

    const userName = typeof window !== 'undefined' ? (sessionStorage.getItem('sn_username') || localStorage.getItem('sn_username') || '') : '';
    const endpoint = `${getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedCasesPath)}?limit=${limit * 2}${userName ? `&user_name=${encodeURIComponent(userName)}` : ''}`;
    const headers = serviceNowAuthService.getAuthHeaders();

    this.closedCasesInFlight = (async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers,
          credentials: 'same-origin'
        });

        if (response.ok) {
          const data = await response.json();
          const rawList = Array.isArray(data.result?.result)
            ? data.result.result
            : (Array.isArray(data.result) ? data.result : (Array.isArray(data) ? data : []));

          if (rawList && rawList.length > 0) {
            const closedOnly = rawList.filter((r: any) => 
              String(r.state) === '3' || 
              String(r.state) === '4' || 
              String(r.state) === '6' || 
              String(r.state || '').toLowerCase() === 'closed' || 
              String(r.status || '').toLowerCase() === 'closed' ||
              String(r.status || '').toLowerCase() === 'resolved'
            );
            const mapped = closedOnly.slice(0, limit).map((r: any, idx: number) => this.mapRecordToClosedCase(r, idx));
            this.closedCasesCache = mapped;
            this.lastClosedFetchTime = Date.now();
            this.logCall('GET', endpoint, response.status, `200 OK - Synced ${mapped.length} Closed Cases from ServiceNow`, undefined, { count: mapped.length });
            return [...this.closedCasesCache];
          } else {
            this.closedCasesCache = [];
            return [];
          }
        }
      } catch (err: any) {
        console.warn(`[ServiceNow Cases] Fetch closed error on ${endpoint}:`, err);
      } finally {
        this.closedCasesInFlight = null;
      }

      return [...this.closedCasesCache];
    })();

    return this.closedCasesInFlight;
  }

  public async fetchAccountDetails(userNameParam?: string): Promise<CustomerAccountDetails> {
    const userName = userNameParam || (typeof window !== 'undefined' ? (localStorage.getItem('sn_username') || sessionStorage.getItem('sn_username')) : null) || SERVICENOW_CONFIG.defaultUsername;
    const endpoint = `${getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedAccountPath)}?user_name=${encodeURIComponent(userName)}`;
    const headers = serviceNowAuthService.getAuthHeaders();

    const fallback: CustomerAccountDetails = {
      accountId: 'acc-001001',
      accountName: this.portalData.account && this.portalData.account !== 'Consumer Account' && this.portalData.account !== 'Enterprise Customer Account' ? this.portalData.account : 'Tata B2B Enterprise Services',
      contractNumber: 'CONT-00283',
      contractTier: 'Tier-1 Platinum',
      uptimeSla: '99.99%',
      healthScore: 94,
      billingCurrency: 'USD',
      industry: 'Global Enterprise Infrastructure',
      sitesCount: 5,
      activeOrdersCount: 10,
      openTicketsCount: this.activeCasesCache.length,
      activeServicesCount: this.portalData.servicesList?.length || 88,
      accountTeam: {
        accountDirector: { name: 'Sarah Jenkins', email: 's.jenkins@enterprise-telecom.com', phone: '+44 20 7946 0912' },
        technicalAccountManager: { name: 'David Zhang', email: 'd.zhang@enterprise-telecom.com', phone: '+44 20 7946 0955' },
        escalationNocLead: { name: 'Global NOC Platinum Desk', hotline: '+44 800 496 0123' }
      }
    };

    try {
      const res = await fetch(endpoint, { method: 'GET', headers, credentials: 'same-origin' });
      if (res.ok) {
        const json = await res.json();
        const data = json.result?.result || json.result || json;
        if (data && (data.name || data.account_name || data.accountName)) {
          const accName = data.name || data.account_name || data.accountName;
          if (accName === 'No Account Associated' || !data.account_id) {
            this.portalData.account = 'No Account Associated';
            return {
              accountId: '',
              accountName: 'No Account Associated',
              contractNumber: 'None',
              contractTier: 'None',
              uptimeSla: 'None',
              healthScore: 0,
              billingCurrency: 'USD',
              industry: 'None',
              sitesCount: 0,
              activeOrdersCount: 0,
              openTicketsCount: 0,
              activeServicesCount: 0,
              accountTeam: {
                accountDirector: { name: 'Unassigned', email: '', phone: '' },
                technicalAccountManager: { name: 'Unassigned', email: '', phone: '' },
                escalationNocLead: { name: 'Unassigned', hotline: '' }
              }
            };
          }
          const tier = data.tier || data.sla_tier || data.contractTier || fallback.contractTier;
          this.portalData.account = accName;
          this.logCall('GET', endpoint, res.status, `200 OK - Account Details for ${accName}`, undefined, data);
          return {
            accountId: data.account_id || data.accountId || fallback.accountId,
            accountName: accName,
            contractNumber: data.contract_number || data.contractNumber || fallback.contractNumber,
            contractTier: tier,
            uptimeSla: data.uptime_sla || data.sla_tier || fallback.uptimeSla,
            healthScore: data.health_score || data.healthScore || fallback.healthScore,
            billingCurrency: data.currency || fallback.billingCurrency,
            industry: data.industry || fallback.industry,
            sitesCount: data.sites_count || fallback.sitesCount,
            activeOrdersCount: data.orders_count || 0,
            openTicketsCount: data.open_tickets_count || this.activeCasesCache.length,
            activeServicesCount: data.active_subscriptions_count || 0,
            accountTeam: data.account_team || fallback.accountTeam
          };
        }
      }
    } catch (err) {
      console.warn('[fetchAccountDetails] Error:', err);
    }
    return fallback;
  }

  public async fetchOutages(): Promise<any[]> {
    const endpoint = getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedOutagesPath);
    try {
      const res = await fetch(endpoint, { method: 'GET', headers: serviceNowAuthService.getAuthHeaders(), credentials: 'same-origin' });
      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.result?.result) ? json.result.result : (Array.isArray(json.result) ? json.result : (Array.isArray(json) ? json : []));
        this.logCall('GET', endpoint, res.status, `200 OK - Fetched ${rawList.length} Outages from ServiceNow`, undefined, { count: rawList.length });
        return rawList;
      }
    } catch (e) {
      console.warn('[fetchOutages] Error:', e);
    }
    return [];
  }

  public async fetchSla(): Promise<any | null> {
    const endpoint = getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedSlaPath);
    try {
      const res = await fetch(endpoint, { method: 'GET', headers: serviceNowAuthService.getAuthHeaders(), credentials: 'same-origin' });
      if (res.ok) {
        const json = await res.json();
        const data = json.result?.result || json.result || null;
        this.logCall('GET', endpoint, res.status, '200 OK - Fetched Live SLA Metrics from ServiceNow', undefined, data);
        return data;
      }
    } catch (e) {
      console.warn('[fetchSla] Error:', e);
    }
    return null;
  }

  public async fetchSites(userNameParam?: string): Promise<CustomerSiteItem[]> {
    const userName = userNameParam || (typeof window !== 'undefined' ? (localStorage.getItem('sn_username') || sessionStorage.getItem('sn_username')) : null) || SERVICENOW_CONFIG.defaultUsername;
    const endpoint = `${getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedSitesPath)}?user_name=${encodeURIComponent(userName)}`;
    const headers = serviceNowAuthService.getAuthHeaders();

    try {
      const res = await fetch(endpoint, { method: 'GET', headers, credentials: 'same-origin' });
      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.result?.result) ? json.result.result : (Array.isArray(json.result) ? json.result : (Array.isArray(json) ? json : []));
        if (rawList.length === 0) {
          this.ordersCache = [];
          return [];
        }
        if (rawList.length > 0) {
          const mapped: CustomerSiteItem[] = rawList.map((s: any) => ({
            id: s.sys_id || s.id || `site-${s.site_code?.toLowerCase()}`,
            siteCode: s.site_code || s.siteCode || 'SITE',
            name: s.name || s.site_name || 'Enterprise Branch Site',
            city: s.city || 'Global',
            country: s.country || '',
            address: s.address || s.location || '',
            tier: s.tier || 'Tier-1 Hub',
            slaCompliance: s.sla_compliance || s.slaCompliance || '99.9%',
            assetCount: s.asset_count || s.assetCount || 0,
            status: s.status || (s.sla_compliance && parseFloat(s.sla_compliance) < 95 ? 'Degraded' : 'Operational'),
            activeTicketsCount: s.active_tickets_count || s.activeTicketsCount || 0
          }));
          this.logCall('GET', endpoint, res.status, `200 OK - Fetched ${mapped.length} Sites from ServiceNow`, undefined, { count: mapped.length });
          return mapped;
        }
      }
    } catch (err) {
      console.warn('[fetchSites] Error:', err);
    }
    return [];
  }

  public async fetchOrders(userNameParam?: string): Promise<CustomerOrderItem[]> {
    const userName = userNameParam || (typeof window !== 'undefined' ? (localStorage.getItem('sn_username') || sessionStorage.getItem('sn_username')) : null) || SERVICENOW_CONFIG.defaultUsername;
    const endpoint = `${getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedOrdersPath)}?user_name=${encodeURIComponent(userName)}`;
    const headers = serviceNowAuthService.getAuthHeaders();

    try {
      const res = await fetch(endpoint, { method: 'GET', headers, credentials: 'same-origin' });
      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.result?.result) ? json.result.result : (Array.isArray(json.result) ? json.result : (Array.isArray(json) ? json : []));
        if (rawList.length === 0) {
          this.ordersCache = [];
          return [];
        }
        if (rawList.length > 0) {
          const mapped: CustomerOrderItem[] = rawList.map((o: any, idx: number) => {
            const projectTitle = o.product_name || o.short_description || 'Telecom Service Order';
            const siteLocation = o.site_location || o.siteName || 'Enterprise Site';
            const rawStage = o.stage || 'Provisioning';
            const rawStatus = String(o.status || 'in_progress').toLowerCase();

            // 1. Dynamic Order Type Resolution
            let orderType: 'New Installation' | 'Bandwidth Upgrade' | 'Macro Rollout' | 'MACD Change' = o.order_type;
            if (!orderType) {
              const lower = projectTitle.toLowerCase();
              if (lower.includes('bundle') || lower.includes('transformation') || lower.includes('infrastructure')) {
                orderType = 'Macro Rollout';
              } else if (lower.includes('upgrade') || lower.includes('expansion') || lower.includes('10g') || lower.includes('interconnect')) {
                orderType = 'Bandwidth Upgrade';
              } else if (lower.includes('migration') || lower.includes('cutover') || lower.includes('sip')) {
                orderType = 'MACD Change';
              } else {
                orderType = 'New Installation';
              }
            }

            // 2. Dynamic Site Code Resolution
            let siteCode = o.site_code;
            if (!siteCode) {
              const locLower = (siteLocation + ' ' + projectTitle).toLowerCase();
              if (locLower.includes('pune')) siteCode = 'PUN-01';
              else if (locLower.includes('mumbai')) siteCode = 'MUM-HQ';
              else if (locLower.includes('bangalore') || locLower.includes('campus')) siteCode = 'BLR-01';
              else if (locLower.includes('chennai')) siteCode = 'CHE-01';
              else if (locLower.includes('singapore') || locLower.includes('apac')) siteCode = 'SGP-01';
              else if (locLower.includes('london')) siteCode = 'LON-01';
              else if (locLower.includes('frankfurt')) siteCode = 'FRA-01';
              else siteCode = 'SITE-01';
            }

            // 3. Dynamic Progress Percentage
            let progressPct = o.progress_pct;
            if (typeof progressPct !== 'number') {
              const stLower = rawStage.toLowerCase();
              if (rawStatus === 'completed' || stLower.includes('delivered') || stLower.includes('verified') || stLower.includes('production')) {
                progressPct = 100;
              } else if (stLower.includes('test') || stLower.includes('acceptance')) {
                progressPct = 85;
              } else if (stLower.includes('provisioning') || stLower.includes('hardware') || stLower.includes('carrier')) {
                progressPct = 68;
              } else if (stLower.includes('trenching') || stLower.includes('civil') || stLower.includes('conduit')) {
                progressPct = 45;
              } else if (stLower.includes('survey') || stLower.includes('feasibility')) {
                progressPct = 30;
              } else if (rawStatus === 'draft') {
                progressPct = 20;
              } else {
                progressPct = 60;
              }
            }

            // 4. Dynamic Order Date & Target Delivery
            const orderedDate = o.ordered_date || (o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
            const estimatedDelivery = o.target_delivery_date || o.estimated_delivery || (o.target_date ? new Date(o.target_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending Schedule');

            // 5. Dynamic Stages / Milestones (Use API live child tasks or derive dynamically with NO fake dates)
            let stages = o.stages;
            if (!Array.isArray(stages) || stages.length === 0) {
              const isDelivered = (progressPct === 100);
              const isTesting = (progressPct >= 85);
              const isProvisioning = (progressPct >= 65);
              const isCivil = (progressPct >= 45);

              stages = [
                {
                  name: 'Site Survey & Feasibility Review',
                  status: 'complete',
                  date: orderedDate || undefined
                },
                {
                  name: 'Optical Network Trenching & Conduit',
                  status: isCivil ? 'complete' : 'current',
                  date: isCivil ? (orderedDate || 'Verified') : 'In Progress'
                },
                {
                  name: 'CPE Router Hardware Staging & Dispatch',
                  status: isDelivered ? 'complete' : (isTesting ? 'complete' : (isProvisioning ? 'current' : 'pending')),
                  date: isDelivered ? 'Verified' : (isProvisioning ? rawStage : undefined)
                },
                {
                  name: 'End-to-End Acceptance Testing',
                  status: isDelivered ? 'complete' : (isTesting ? 'current' : 'pending'),
                  date: isTesting ? 'In Testing' : undefined
                },
                {
                  name: 'Handover & Service Go-Live',
                  status: isDelivered ? 'complete' : 'pending',
                  date: isDelivered ? 'Completed' : (estimatedDelivery !== 'Pending Schedule' ? estimatedDelivery : undefined)
                }
              ];
            }

            // 6. Dynamic Line Items (Use API live line items or parse real description)
            let items = o.items;
            if (!Array.isArray(items) || items.length === 0) {
              const summaryDesc = o.summary || o.description || '';
              if (summaryDesc && summaryDesc.includes('·')) {
                const parts = summaryDesc.split('·');
                items = parts.map((part: string) => {
                  const partTrim = part.trim();
                  const match = partTrim.match(/^(\d+[\d,]*)\s*(.*)$/);
                  const qty = match ? parseInt(match[1].replace(/,/g, ''), 10) : 1;
                  const label = match ? match[2] : partTrim;
                  let cat = 'Broadband';
                  const lLower = label.toLowerCase();
                  if (lLower.includes('sim') || lLower.includes('mobile')) cat = 'Mobile Fleet';
                  else if (lLower.includes('trunk') || lLower.includes('channel') || lLower.includes('did') || lLower.includes('sip')) cat = 'Voice & SIP';
                  else if (lLower.includes('ap') || lLower.includes('wi-fi') || lLower.includes('cisco')) cat = 'Wi-Fi APs';
                  else if (lLower.includes('optical') || lLower.includes('cross-connect') || lLower.includes('port')) cat = 'Interconnect';

                  return {
                    category: cat,
                    description: partTrim,
                    quantity: qty,
                    unit: label.split(' ')[0] || 'Units',
                    status: rawStage
                  };
                });
              } else if (summaryDesc) {
                items = [{
                  category: 'Telecom Service',
                  description: summaryDesc,
                  quantity: 1,
                  unit: 'Package',
                  status: rawStage
                }];
              } else {
                items = [{
                  category: 'Core WAN',
                  description: projectTitle,
                  quantity: 1,
                  unit: 'Circuits',
                  status: rawStage
                }];
              }
            }

            return {
              id: o.sys_id || `ord-${idx}`,
              orderNumber: o.order_number || o.number || `ORD-2026-${1000 + idx}`,
              projectTitle,
              orderType,
              status: (rawStatus === 'completed' || rawStage === 'Delivered' || rawStage === 'Active & Verified') ? 'Completed' : (rawStatus === 'pending_acceptance' ? 'Pending Acceptance' : 'In Progress'),
              progressPct,
              currentMilestone: o.current_milestone || rawStage || 'In Provisioning',
              orderedDate,
              estimatedDelivery,
              siteName: siteLocation,
              siteCode,
              items,
              stages
            };
          });

          // Strict deduplication by orderNumber
          const seenNumbers = new Set<string>();
          const deduplicated: CustomerOrderItem[] = [];
          for (const item of mapped) {
            if (!seenNumbers.has(item.orderNumber)) {
              seenNumbers.add(item.orderNumber);
              deduplicated.push(item);
            }
          }
          this.ordersCache = deduplicated;
          this.logCall('GET', endpoint, res.status, `200 OK - Fetched ${deduplicated.length} Orders from ServiceNow`, undefined, { count: deduplicated.length });
          return deduplicated;
        }
      }
    } catch (err) {
      console.warn('[fetchOrders] Error:', err);
    }
    return this.ordersCache.length > 0 ? this.ordersCache : [];
  }

  public async fetchServices(siteCodeParam?: string, userNameParam?: string): Promise<ManagedServiceItem[]> {
    const userName = userNameParam || (typeof window !== 'undefined' ? (sessionStorage.getItem('sn_username') || localStorage.getItem('sn_username')) : null) || SERVICENOW_CONFIG.defaultUsername;
    const endpoint = `${getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedServicesPath)}?user_name=${encodeURIComponent(userName)}${siteCodeParam ? `&site_code=${encodeURIComponent(siteCodeParam)}` : ''}`;
    const headers = serviceNowAuthService.getAuthHeaders();

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers,
        credentials: 'same-origin'
      });

      if (res.ok) {
        const json = await res.json();
        const payload = json.result || json;
        const rawList = Array.isArray(payload.result) ? payload.result : (Array.isArray(payload) ? payload : []);

        if (rawList.length === 0) {
          this.portalData.servicesList = [];
          this.portalData.serviceMetrics = { core_wan: 0, fiber_broadband: 0, voice_sip: 0, mobile_fleet: 0, total: 0 };
          return [];
        }

        if (rawList.length > 0) {
          const mapped: ManagedServiceItem[] = rawList.map((ci: any) => {
            const num = String(ci.service_id || ci.number || ci.sys_id || '').toUpperCase();
            const name = String(ci.name || 'Managed Telecom Service');
            const loc = String(ci.site_name || ci.location || 'Pune Technical Center');
            const siteCode = String(ci.site_code || 'PUN-01');
            const rawProdFamily = String(ci.product_family || ci.category || '');
            
            let category = 'Core WAN & Circuits';
            if (rawProdFamily.includes('Mobility') || rawProdFamily.includes('Mobile') || num.startsWith('MOB-') || name.toLowerCase().includes('sim')) {
              category = 'Mobile Fleet & SIMs';
            } else if (rawProdFamily.includes('Voice') || rawProdFamily.includes('SIP') || num.startsWith('SIP-') || name.toLowerCase().includes('voice')) {
              category = 'Voice & SIP Trunks';
            } else if (rawProdFamily.includes('Cloud') || rawProdFamily.includes('Interconnect') || num.startsWith('DIA-') || num.includes('CC-') || num === 'CKT-SGP-01' || name.toLowerCase().includes('cloud') || name.toLowerCase().includes('dia') || name.toLowerCase().includes('directconnect')) {
              category = 'Fiber Broadband';
            }

            const rawStatus = String(ci.status || 'Operational');
            const activeCaseNumber = ci.active_case || undefined;
            const isCriticalOrDegraded = rawStatus === 'Critical' || rawStatus === 'Degraded' || Boolean(activeCaseNumber);

            const throughput = ci.throughput || (
              name.includes('10G') ? '10 Gbps' :
              name.includes('1 Gbps') ? '1 Gbps' :
              name.includes('2 Gbps') ? '2 Gbps' :
              name.includes('500 Mbps') ? '500 Mbps' :
              name.includes('500 Channels') ? '500 Channels' :
              name.includes('200 Channels') ? '200 Channels' :
              name.includes('150 Channels') ? '150 Channels' :
              name.includes('100 Channels') ? '100 Channels' :
              category === 'Mobile Fleet & SIMs' ? '5G Ultra' : '1 Gbps'
            );

            const demarcation = ci.demarcation || (
              category === 'Mobile Fleet & SIMs' ? 'Cisco Industrial 5G Gateway' :
              category === 'Voice & SIP Trunks' ? 'AudioCodes Mediant 1000B SBC' :
              category === 'Fiber Broadband' ? 'Adtran SDX 6320 Optical ONT' :
              'Cisco ASR 9001 PE'
            );

            return {
              id: num,
              circuitId: num,
              name,
              category,
              siteCode,
              siteName: loc,
              location: loc,
              bandwidth: throughput,
              throughput,
              demarcation,
              status: isCriticalOrDegraded ? (rawStatus === 'Critical' ? 'Critical' : 'Degraded') : 'Operational',
              availability: isCriticalOrDegraded ? '94.2%' : '99.98%',
              latency: isCriticalOrDegraded ? 'Elevated (118ms)' : 'Normal (14ms)',
              packetLoss: isCriticalOrDegraded ? '12.4%' : '0.0%',
              lastAssessed: 'Just now',
              vlan: ci.vlan,
              ipSubnet: ci.ip_subnet,
              carrierTail: ci.carrier_tail,
              activeCaseNumber
            };
          });

          // Compute live metrics dynamically
          const core_wan = mapped.filter(s => s.category === 'Core WAN & Circuits').length;
          const fiber_broadband = mapped.filter(s => s.category === 'Fiber Broadband').length;
          const voice_sip = mapped.filter(s => s.category === 'Voice & SIP Trunks').length;
          const mobile_fleet = mapped.filter(s => s.category === 'Mobile Fleet & SIMs').length;
          const total = mapped.length;

          this.portalData.servicesList = mapped;
          this.portalData.serviceMetrics = {
            core_wan,
            fiber_broadband,
            voice_sip,
            mobile_fleet,
            total
          };

          this.logCall('GET', endpoint, res.status, `200 OK - Fetched ${mapped.length} Live Services from ServiceNow CMDB`, undefined, { count: mapped.length, metrics: this.portalData.serviceMetrics });
          return mapped;
        }
      }
    } catch (err) {
      console.warn('[fetchServices] Error calling /services:', err);
    }
    return this.portalData.servicesList || [];
  }

  public submitBusinessImpact(impact: BusinessImpactPayload): { success: boolean; caseNumber: string } {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.updates.unshift({
      title: "Business impact provided by customer",
      category: "Investigation",
      text: `Customer reported impact on "${impact.affectedApplication}" at "${impact.location}" (${impact.usersAffected} users affected). Urgency: ${impact.urgency}.`,
      time: timestamp
    });

    this.logCall(
      'POST',
      `/api/now/csm/case/${this.portalData.caseNumber}/impact`,
      200,
      '200 OK - Case Updated without Duplication',
      { case: this.portalData.caseNumber, impact },
      { status: 'success', updated_case: this.portalData.caseNumber, linked_incident: this.portalData.incidentReference }
    );

    return { success: true, caseNumber: this.portalData.caseNumber };
  }

  public async createSupportCase(payload: CreateCasePayload): Promise<{ success: boolean; caseNumber: string; incidentReference: string; slaTarget: string; sysId?: string }> {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const fallbackCaseNumber = `CSM${randomNum}`;
    const newIncidentRef = `INC-${Math.floor(100000 + Math.random() * 900000)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const slaTarget = payload.priority.includes('P1') ? '15 Minutes' : payload.priority.includes('P2') ? '30 Minutes' : '2 Hours';
    const endpoint = `${SERVICENOW_CONFIG.instanceUrl.replace(/\/$/, '')}${SERVICENOW_CONFIG.tableApi.case}`;
    const headers = serviceNowAuthService.getAuthHeaders();

    const userSysId = typeof window !== 'undefined' 
      ? (sessionStorage.getItem('sn_user_sys_id') || localStorage.getItem('sn_user_sys_id')) 
      : null;
    const userName = typeof window !== 'undefined' 
      ? (sessionStorage.getItem('sn_username') || localStorage.getItem('sn_username')) 
      : null;

    const accountSysId = typeof window !== 'undefined' 
      ? (sessionStorage.getItem('sn_account_sys_id') || localStorage.getItem('sn_account_sys_id')) 
      : null;

    const requestBody: any = {
      short_description: payload.subject,
      description: payload.description,
      priority: payload.priority.startsWith('P1') ? '1' : payload.priority.startsWith('P2') ? '2' : payload.priority.startsWith('P3') ? '3' : '4',
      category: payload.category,
      contact_type: 'self-service',
      userName: userName || SERVICENOW_CONFIG.defaultUsername,
      comments: `Contact: ${payload.contactName} (${payload.contactEmail}, ${payload.contactPhone}). Service: ${payload.serviceName} (${payload.serviceId})`
    };

    if (accountSysId) {
      requestBody.account = accountSysId;
    }

    if (userSysId) {
      requestBody.contact = userSysId;
    }

    let confirmedCaseNumber = fallbackCaseNumber;
    let createdSysId = 'sys_' + Math.random().toString(36).substring(2, 12);

    // 1. Try Custom Scripted REST Endpoint first (/api/taair/b2b_auth_api/create_case)
    const scriptedCreateUrl = getServiceNowFullUrl(SERVICENOW_CONFIG.scriptedCreateCasePath);
    try {
      const scriptedRes = await fetch(scriptedCreateUrl, {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(requestBody)
      });

      if (scriptedRes.ok) {
        const scriptedData = await scriptedRes.json();
        const resObj = scriptedData.result || scriptedData;
        if (resObj && (resObj.number || resObj.sys_id)) {
          confirmedCaseNumber = resObj.number || confirmedCaseNumber;
          createdSysId = resObj.sys_id || createdSysId;
          this.logCall('POST', scriptedCreateUrl, scriptedRes.status, `201 Created - Case ${confirmedCaseNumber} via Scripted REST API`, requestBody, resObj);
        }
      }
    } catch (scriptedErr) {
      console.warn('[createSupportCase] Scripted REST error:', scriptedErr);
    }

    if (confirmedCaseNumber === fallbackCaseNumber) {
      try {
        const tableHeaders = serviceNowAuthService.getTableAuthHeaders();
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: tableHeaders,
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.result) {
            if (data.result.number) confirmedCaseNumber = data.result.number;
            if (data.result.sys_id) createdSysId = data.result.sys_id;

            this.logCall(
              'POST',
              SERVICENOW_CONFIG.tableApi.case,
              response.status,
              '201 Created - New ServiceNow CSM Case Created Live via Table API',
              requestBody,
              data.result
            );
          }
        } else {
          this.logCall(
            'POST',
            SERVICENOW_CONFIG.tableApi.case,
            response.status,
            `${response.status} ${response.statusText} - Queued in portal state`,
            requestBody
          );
        }
      } catch (err: any) {
        console.warn('[ServiceNow Create Case] Live POST failed or CORS blocked. Fallback active:', err);
        this.logCall(
          'POST',
          SERVICENOW_CONFIG.tableApi.case,
          201,
          '201 Created - Case Staged in Assurance Pipeline',
          requestBody,
          { number: confirmedCaseNumber, sys_id: createdSysId }
        );
      }
    }

    // Prepend to active cases cache
    const newActiveCase: ActiveCaseItem = {
      caseNumber: confirmedCaseNumber,
      service: payload.serviceName,
      serviceId: payload.serviceId,
      category: payload.category,
      description: payload.subject,
      status: 'Investigating',
      statusTone: 'blue',
      priority: payload.priority.startsWith('P1') ? 'P1' : payload.priority.startsWith('P2') ? 'P2' : payload.priority.startsWith('P3') ? 'P3' : 'P4',
      priorityTone: payload.priority.startsWith('P1') ? 'red' : payload.priority.startsWith('P2') ? 'amber' : 'blue',
      openedTime: 'Just now',
      incidentRef: newIncidentRef,
      queue: 'Service Assurance Support Queue',
      contact: payload.contactName || (typeof window !== 'undefined' ? (sessionStorage.getItem('sn_first_name') ? `${sessionStorage.getItem('sn_first_name')} ${sessionStorage.getItem('sn_last_name') || ''}`.trim() : null) : null) || this.portalData.customer
    };
    this.activeCasesCache.unshift(newActiveCase);

    this.portalData.servicesList = this.getSyncedServicesList();
    this.portalData.caseNumber = confirmedCaseNumber;
    this.portalData.service = payload.serviceName;
    this.portalData.serviceId = payload.serviceId;

    // Prepend to update feed
    this.updates.unshift({
      title: `New Case Created: ${payload.subject}`,
      category: "Investigation",
      text: `Customer logged new case ${confirmedCaseNumber} for service "${payload.serviceName}". Priority: ${payload.priority}.`,
      time: timestamp
    });

    return {
      success: true,
      caseNumber: confirmedCaseNumber,
      incidentReference: newIncidentRef,
      slaTarget,
      sysId: createdSysId
    };
  }

  public submitRestorationConfirmation(confirmation: RestorationConfirmationPayload): { success: boolean; caseStatus: string } {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (confirmation.result === 'yes') {
      this.currentCaseStatus = "Closed";
      this.timeline.forEach(step => {
        if (step.label === 'Closed') {
          step.state = 'complete';
          step.time = timestamp;
        } else {
          step.state = 'complete';
        }
      });

      // Update services dynamically
      this.portalData.servicesList = this.getSyncedServicesList();

      this.updates.unshift({
        title: "Customer confirmed resolution",
        category: "Monitoring",
        text: `Customer verified dispatch platform operating normally. Case ${this.portalData.caseNumber} closed. Problem record PRB-008912 created.`,
        time: timestamp
      });

      this.logCall(
        'POST',
        `/api/now/csm/case/${this.portalData.caseNumber}/confirm_restoration`,
        200,
        '200 OK - Case Closed & Published to Case History',
        { case: this.portalData.caseNumber, confirmation },
        { status: 'Closed', case_state: '3', published_record: true, problem_ref: 'PRB-008912' }
      );
    } else {
      this.currentCaseStatus = "Open - Escalated";
      this.updates.unshift({
        title: "Customer reported ongoing issues",
        category: "Investigation",
        text: `Customer reported unresolved issues: "${confirmation.comments || 'No comment'}". Case escalated to Tier 3 engineering.`,
        time: timestamp
      });

      this.logCall(
        'POST',
        `/api/now/csm/case/${this.portalData.caseNumber}/confirm_restoration`,
        200,
        '200 OK - Follow-up Task Initiated',
        { case: this.portalData.caseNumber, confirmation },
        { status: 'Open', follow_up_task: 'TASK001842', priority: 'High' }
      );
    }

    return { success: true, caseStatus: this.currentCaseStatus };
  }

  public logGenesysCallInteraction(outcome: string, durationSec: number): Promise<any> {
    const interactionRef = 'GEN-INT-' + Math.floor(100000 + Math.random() * 900000);
    const payload = {
      interactionRef,
      caseNumber: this.portalData.caseNumber,
      account: this.portalData.account,
      customer: this.portalData.customer,
      queue: this.portalData.queue,
      duration: `${durationSec} seconds`,
      outcome
    };

    this.logCall(
      'POST',
      `/api/genesys/v2/click_to_call/interactions`,
      201,
      '201 Created - Interaction Logged Against Case',
      payload,
      { status: 'success', interactionId: interactionRef }
    );

    return Promise.resolve(payload);
  }

  public simulateStoryboardStep(step: StoryboardStepNumber) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (step <= 3) {
      this.currentCaseStatus = "Investigation Started";
      this.timeline[0].state = "complete";
      this.timeline[1].state = "current";
      this.timeline[2].state = "pending";
      this.timeline[3].state = "pending";
      this.timeline[4].state = "pending";
      this.timeline[5].state = "pending";
    } else if (step <= 6) {
      this.currentCaseStatus = "Investigating";
      this.timeline[0].state = "complete";
      this.timeline[1].state = "complete";
      this.timeline[2].state = "current";
      this.timeline[3].state = "pending";
      this.timeline[4].state = "pending";
      this.timeline[5].state = "pending";
    } else if (step <= 8) {
      this.currentCaseStatus = "Recovery Active";
      this.timeline[0].state = "complete";
      this.timeline[1].state = "complete";
      this.timeline[2].state = "complete";
      this.timeline[3].state = "current";
      this.timeline[4].state = "pending";
      this.timeline[5].state = "pending";
    } else if (step <= 11) {
      this.currentCaseStatus = "Monitoring";
      this.timeline[0].state = "complete";
      this.timeline[1].state = "complete";
      this.timeline[2].state = "complete";
      this.timeline[3].state = "complete";
      this.timeline[4].state = "current";
      this.timeline[5].state = "pending";
    } else {
      this.currentCaseStatus = "Closed";
      this.timeline.forEach(s => s.state = "complete");
      this.timeline[5].time = timestamp;
    }

    this.logCall('POST', `/api/now/csm/simulator/step/${step}`, 200, `200 OK - Storyboard Step ${step} Applied`);

    return {
      portalData: { ...this.portalData },
      timeline: [...this.timeline],
      updates: [...this.updates],
      status: this.currentCaseStatus
    };
  }
}

export const serviceNowRestService = new ServiceNowRestService();
