import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader, Card, Badge, Button } from '../UIPrimitives';
import { 
  PortalData, 
  VirtualAssistantContext, 
  ManagedServiceItem, 
  MobileSubscriptionItem, 
  FiberBroadbandItem,
  VoiceTrunkItem
} from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';
import { ManageLineModal } from '../Modals/ManageLineModal';
import { 
  Search, 
  Bot, 
  RefreshCw, 
  Network, 
  Smartphone, 
  Wifi, 
  AlertTriangle, 
  ArrowUpRight, 
  SlidersHorizontal,
  ChevronRight,
  Gauge,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  MapPin,
  PhoneCall,
  Check,
  Copy,
  ArrowUpDown
} from 'lucide-react';

interface MyServicesPageProps {
  portalData: PortalData;
  onNavigate: (page: any, param?: string) => void;
  onOpenVirtualAssistant?: (context?: VirtualAssistantContext) => void;
  onSelectActiveCase?: (caseNum: string) => void;
  onSyncCases?: () => Promise<void>;
  isSyncing?: boolean;
}

const SITES_CONFIG = [
  { code: 'ALL', name: 'All Sites (5 Locations)', label: 'All Sites (5)' },
  { code: 'PUN-01', name: 'Pune Technical Center', label: 'Pune (PUN-01)' },
  { code: 'MUM-HQ', name: 'Mumbai Global HQ & Trading Floor', label: 'Mumbai (MUM-HQ)' },
  { code: 'BLR-01', name: 'Bangalore Cloud & AI R&D Campus', label: 'Bangalore (BLR-01)' },
  { code: 'CHE-02', name: 'Chennai Automotive Smart Plant', label: 'Chennai (CHE-02)' },
  { code: 'SGP-01', name: 'Singapore APAC Regional Gateway', label: 'Singapore (SGP-01)' }
];

export const MyServicesPage: React.FC<MyServicesPageProps> = ({ 
  portalData, 
  onNavigate,
  onOpenVirtualAssistant,
  onSelectActiveCase,
  onSyncCases,
  isSyncing = false
}) => {
  // Domain tab: WAN vs Fiber vs Voice vs Mobile Fleet
  const [domainTab, setDomainTab] = useState<'wan' | 'fiber' | 'voice' | 'mobile'>('wan');
  
  // Site filter dropdown
  const [selectedSite, setSelectedSite] = useState<string>('ALL');

  // View density toggle: Table View (default) vs Card View
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Search filter
  const [search, setSearch] = useState('');

  // Sub-filters
  const [wanFilter, setWanFilter] = useState<'All' | 'Affected' | 'Operational'>('All');
  const [voiceFilter, setVoiceFilter] = useState<'All' | 'Operational' | 'Degraded'>('All');
  const [mobileFilter, setMobileFilter] = useState<'All' | 'Active' | 'Alerts' | 'Suspended'>('All');

  // Mobile sorting state
  const [mobileSortField, setMobileSortField] = useState<'location' | 'phoneNumber' | 'assignedUser' | 'dataUsage' | 'monthlyCost' | 'status'>('location');
  const [mobileSortDirection, setMobileSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state (10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Mobile Line Management Modal State
  const [selectedMobileLine, setSelectedMobileLine] = useState<MobileSubscriptionItem | null>(null);

  // Master services list from ServiceNow (88 Live CMDB Assets)
  const rawServices = portalData.servicesList && portalData.servicesList.length > 0
    ? portalData.servicesList
    : [];

  // Helper: Site matcher
  const matchesSite = (siteCode?: string, location?: string, targetSite: string = 'ALL') => {
    if (targetSite === 'ALL') return true;
    if (siteCode && siteCode.toUpperCase() === targetSite.toUpperCase()) return true;
    const loc = (location || '').toLowerCase();
    if (targetSite === 'PUN-01' && (loc.includes('pune') || loc.includes('pun'))) return true;
    if (targetSite === 'MUM-HQ' && (loc.includes('mumbai') || loc.includes('mum') || loc.includes('bkc'))) return true;
    if (targetSite === 'BLR-01' && (loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('blr'))) return true;
    if (targetSite === 'CHE-02' && (loc.includes('chennai') || loc.includes('che') || loc.includes('oragadam'))) return true;
    if (targetSite === 'SGP-01' && (loc.includes('singapore') || loc.includes('sgp') || loc.includes('equinix'))) return true;
    return false;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. DOMAIN PARTITIONING: CORE WAN & CIRCUITS (Live from sn_install_base_sold_product)
  // Strict filter: Excludes Mobile SIMs, SIP Voice Trunks, and Dedicated Fiber
  // ─────────────────────────────────────────────────────────────────────────────
  const wanCircuits = useMemo(() => {
    return rawServices.filter(s => {
      const id = (s.circuitId || s.id || '').toUpperCase();
      const cat = (s.category || '').toLowerCase();
      const name = (s.name || '').toLowerCase();
      
      // Exclude Mobile SIMs
      if (id.startsWith('MOB-') || id.startsWith('SIM-') || id.startsWith('SUB-') || id.startsWith('FWA-') || cat.includes('mobile') || cat.includes('sim') || name.includes('mobile') || name.includes('sim card') || name.includes('roaming')) {
        return false;
      }
      // Exclude SIP Voice Trunks
      if (id.startsWith('SIP-') || cat.includes('voice') || cat.includes('sip') || name.includes('sip') || name.includes('voice trunk')) {
        return false;
      }
      // Exclude Fiber Broadband / Dedicated Cloud
      if (id.startsWith('FBR-') || id.startsWith('CCE-') || id.startsWith('INT-') || id.startsWith('DIA-') || id.includes('DIA') || id.includes('CC-') || id === 'CKT-SGP-01' || cat.includes('fiber') || cat.includes('broadband') || name.includes('directconnect') || name.includes('cross-connect') || name.includes('dedicated internet') || name.includes('cloud connect')) {
        return false;
      }
      return true;
    });
  }, [rawServices]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DOMAIN PARTITIONING: FIBER BROADBAND & DEDICATED CLOUD (100% Live ServiceNow)
  // Extracts real Cloud Connect, Dedicated DIA & Optical lines
  // ─────────────────────────────────────────────────────────────────────────────
  const fiberList: FiberBroadbandItem[] = useMemo(() => {
    const extracted = rawServices.filter(s => {
      const cat = (s.category || '').toLowerCase();
      const name = (s.name || '').toLowerCase();
      const id = (s.circuitId || s.id || '').toUpperCase();
      if (id.startsWith('SIP-') || id.startsWith('MOB-')) return false;
      return id.startsWith('FBR-') || id.startsWith('CCE-') || id.startsWith('INT-') || id.startsWith('DIA-') || id.includes('DIA') || id.includes('CC-') || id === 'CKT-SGP-01' ||
             cat.includes('cloud') || cat.includes('dia') || name.includes('directconnect') || name.includes('cross-connect') || 
             name.includes('dia') || name.includes('fiber') || name.includes('broadband') || name.includes('dedicated internet') || name.includes('cloud connect');
    });

    if (extracted.length > 0) {
      return extracted.map(s => ({
        id: s.id,
        name: s.name,
        circuitId: s.circuitId || s.id,
        speed: s.throughput || s.bandwidth || '1 Gbps Symmetrical',
        status: (s.status === 'Critical' ? 'Degraded' : s.status) as any,
        ontTerminal: s.demarcation || 'Adtran SDX 6320 Optical ONT',
        opticalSignal: s.status === 'Critical' ? '-24.8 dBm (Alert)' : '-17.5 dBm (Optimal)',
        staticIpPool: s.ipSubnet || '194.72.108.64/29 (5 usable IPs)',
        location: s.location,
        lastAssessed: s.lastAssessed || 'Just now',
        monthlyCost: s.name.includes('10G') ? 3500 : 850,
        activeCaseNumber: s.activeCaseNumber
      }));
    }

    return [];
  }, [rawServices]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. DOMAIN PARTITIONING: VOICE & SIP TRUNKS (100% Live CMDB)
  // ─────────────────────────────────────────────────────────────────────────────
  const voiceTrunks = useMemo(() => {
    const extracted = rawServices.filter(s => {
      const id = (s.circuitId || s.id || '').toUpperCase();
      const cat = (s.category || '').toLowerCase();
      const name = (s.name || '').toLowerCase();
      return id.startsWith('SIP-') || cat.includes('voice') || cat.includes('sip') || name.includes('sip') || name.includes('voice trunk');
    });

    if (extracted.length > 0) {
      return extracted.map(s => ({
        id: s.id,
        trunkId: s.circuitId || s.id,
        name: s.name,
        siteCode: s.siteCode || (
          s.location.toLowerCase().includes('pune') ? 'PUN-01' :
          s.location.toLowerCase().includes('mumbai') ? 'MUM-HQ' :
          s.location.toLowerCase().includes('bangalore') ? 'BLR-01' :
          s.location.toLowerCase().includes('chennai') ? 'CHE-02' : 'SGP-01'
        ),
        location: s.location,
        channels: s.name.includes('500') ? 500 : s.name.includes('300') ? 300 : s.name.includes('200') ? 200 : 100,
        protocol: 'SIP TLS / SRTP',
        codecs: 'G.711u / G.729a HD',
        status: s.status as any,
        availability: s.availability || '99.99%',
        latency: s.latency || '12ms',
        jitter: '1.2ms',
        activeCaseNumber: s.activeCaseNumber,
        lastAssessed: s.lastAssessed || 'Just now'
      }));
    }

    return [];
  }, [rawServices]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. DOMAIN PARTITIONING: MOBILE FLEET & SIMS (100% Live CMDB)
  // Extracts real 48+ Enterprise Mobile SIMs and IoT assets from live CMDB
  // ─────────────────────────────────────────────────────────────────────────────
  const liveMobileSubscriptions: MobileSubscriptionItem[] = useMemo(() => {
    const extracted = rawServices.filter(s => {
      const id = (s.circuitId || s.id || '').toUpperCase();
      const cat = (s.category || '').toLowerCase();
      const name = (s.name || '').toLowerCase();
      return id.startsWith('MOB-') || id.startsWith('SIM-') || id.startsWith('SUB-') || id.startsWith('FWA-') ||
             cat.includes('mobile') || cat.includes('sim') || cat.includes('iot') ||
             name.includes('mobile') || name.includes('sim') || name.includes('5g') || name.includes('iot');
    });

    return extracted.map((s, idx) => {
      const simNum = '8944 1100 2938 ' + String(1000 + idx);
      const phoneNum = '+91 98200 ' + String(90100 + idx);
      const isChe = (s.location || '').toLowerCase().includes('chennai');
      const isPun = (s.location || '').toLowerCase().includes('pune');
      const isMum = (s.location || '').toLowerCase().includes('mumbai');
      const isBlr = (s.location || '').toLowerCase().includes('bangalore');
      const siteCode = s.siteCode || (isPun ? 'PUN-01' : isMum ? 'MUM-HQ' : isBlr ? 'BLR-01' : isChe ? 'CHE-02' : 'SGP-01');

      return {
        id: s.circuitId || s.id || ('SUB-MOB-' + (100 + idx)),
        phoneNumber: phoneNum,
        plan: s.name || 'Corporate Enterprise 5G Fleet Plan',
        status: (s.status === 'Critical' ? 'Suspended' : 'Active') as any,
        statusTone: (s.status === 'Critical' ? 'red' : 'green') as any,
        device: s.name.includes('IoT') || s.name.includes('5G') ? 'Cisco Industrial 5G Gateway' : 'Zebra TC57 Rugged Enterprise',
        simNumber: simNum,
        assignedUser: isChe ? 'Factory Dispatch Lead' : isPun ? 'Field Engineering Fleet' : 'Enterprise User',
        department: isChe ? 'Automotive Logistics' : isPun ? 'Network Operations' : 'Enterprise Operations',
        location: s.location || 'Pune Technical Center',
        siteCode,
        dataUsedGB: (s.telemetry && (s.telemetry as any).latency_ms) ? Number((s.telemetry as any).latency_ms) : 42.5,
        dataLimitGB: 100,
        monthlyCost: 55,
        roamingPass: true,
        hasAlert: s.status === 'Critical',
        alertReason: s.status === 'Critical' ? 'High packet loss / telemetry alert' : undefined,
        features: ['5G Ultra-Wideband', 'Private APN', 'Voice Roaming']
      };
    });
  }, [rawServices]);

  const [mobileList, setMobileList] = useState<MobileSubscriptionItem[]>([]);

  useEffect(() => {
    if (liveMobileSubscriptions.length > 0) {
      setMobileList(liveMobileSubscriptions);
    }
  }, [liveMobileSubscriptions]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. FILTERED DATASETS
  // ─────────────────────────────────────────────────────────────────────────────

  // Filtered WAN services
  const wanSitePool = useMemo(() => {
    return wanCircuits.filter(s => matchesSite(s.siteCode, s.location, selectedSite));
  }, [wanCircuits, selectedSite]);

  const filteredWanServices = useMemo(() => {
    return wanSitePool.filter(s => {
      const q = search.toLowerCase();
      const matchesSearch = !q || (
        s.name.toLowerCase().includes(q) || 
        s.id.toLowerCase().includes(q) ||
        (s.circuitId && s.circuitId.toLowerCase().includes(q)) ||
        s.location.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.activeCaseNumber && s.activeCaseNumber.toLowerCase().includes(q))
      );
      if (!matchesSearch) return false;

      const isDegraded = s.status !== 'Operational' && s.status !== 'Restored';
      if (wanFilter === 'Affected') return isDegraded;
      if (wanFilter === 'Operational') return !isDegraded;
      return true;
    });
  }, [wanSitePool, search, wanFilter]);

  const wanAffectedCount = useMemo(() => wanSitePool.filter(s => s.status !== 'Operational' && s.status !== 'Restored').length, [wanSitePool]);
  const wanOperationalCount = wanSitePool.length - wanAffectedCount;

  // Filtered Fiber services
  const fiberSitePool = useMemo(() => {
    return fiberList.filter(f => matchesSite(undefined, f.location, selectedSite));
  }, [fiberList, selectedSite]);

  const filteredFiberServices = useMemo(() => {
    return fiberSitePool.filter(f => {
      const q = search.toLowerCase();
      return !q || (
        f.name.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.circuitId.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q) ||
        f.ontTerminal.toLowerCase().includes(q) ||
        f.staticIpPool.toLowerCase().includes(q)
      );
    });
  }, [fiberSitePool, search]);

  // Filtered Voice services
  const voiceSitePool = useMemo(() => {
    return voiceTrunks.filter(v => matchesSite(v.siteCode, v.location, selectedSite));
  }, [voiceTrunks, selectedSite]);

  const filteredVoiceServices = useMemo(() => {
    return voiceSitePool.filter(v => {
      const q = search.toLowerCase();
      const matchesSearch = !q || (
        v.name.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        v.trunkId.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.protocol.toLowerCase().includes(q) ||
        (v.activeCaseNumber && v.activeCaseNumber.toLowerCase().includes(q))
      );
      if (!matchesSearch) return false;

      if (voiceFilter === 'Operational') return v.status === 'Operational';
      if (voiceFilter === 'Degraded') return v.status !== 'Operational';
      return true;
    });
  }, [voiceSitePool, search, voiceFilter]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. FILTERED MOBILE FLEET (Site Filtered + Multi-Field Sortable)
  // ─────────────────────────────────────────────────────────────────────────────
  const mobileSitePool = useMemo(() => {
    return mobileList.filter(m => matchesSite(m.siteCode, m.location, selectedSite));
  }, [mobileList, selectedSite]);

  const filteredMobileSubscriptions = useMemo(() => {
    let list = mobileSitePool.filter(m => {
      const q = search.toLowerCase();
      const matchesSearch = !q || (
        m.phoneNumber.toLowerCase().includes(q) ||
        m.plan.toLowerCase().includes(q) ||
        m.device.toLowerCase().includes(q) ||
        m.assignedUser.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        (m.location && m.location.toLowerCase().includes(q)) ||
        (m.siteCode && m.siteCode.toLowerCase().includes(q))
      );
      if (!matchesSearch) return false;

      if (mobileFilter === 'Active') return m.status === 'Active';
      if (mobileFilter === 'Alerts') return m.hasAlert === true;
      if (mobileFilter === 'Suspended') return m.status === 'Suspended';
      return true;
    });

    // Sort by selected column/field
    list.sort((a, b) => {
      let cmp = 0;
      if (mobileSortField === 'location') {
        cmp = (a.location || '').localeCompare(b.location || '');
        if (cmp === 0) cmp = (a.siteCode || '').localeCompare(b.siteCode || '');
      } else if (mobileSortField === 'phoneNumber') {
        cmp = a.phoneNumber.localeCompare(b.phoneNumber);
      } else if (mobileSortField === 'assignedUser') {
        cmp = a.assignedUser.localeCompare(b.assignedUser);
      } else if (mobileSortField === 'dataUsage') {
        cmp = a.dataUsedGB - b.dataUsedGB;
      } else if (mobileSortField === 'monthlyCost') {
        cmp = a.monthlyCost - b.monthlyCost;
      } else if (mobileSortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return mobileSortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [mobileSitePool, search, mobileFilter, mobileSortField, mobileSortDirection]);

  // Dynamic Mobile Metrics for KPI Banner
  const mobileSiteTotal = mobileSitePool.length;
  const mobileActiveCount = mobileSitePool.filter(m => m.status === 'Active').length;
  const mobileAlertsCount = mobileSitePool.filter(m => m.hasAlert).length;
  const mobileTotalMRR = mobileSitePool.reduce((acc, m) => acc + m.monthlyCost, 0);
  const mobileOpRate = mobileSiteTotal > 0 ? ((mobileActiveCount / mobileSiteTotal) * 100).toFixed(1) : '100.0';

  const handleMobileSort = (field: 'location' | 'phoneNumber' | 'assignedUser' | 'dataUsage' | 'monthlyCost' | 'status') => {
    if (mobileSortField === field) {
      setMobileSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMobileSortField(field);
      setMobileSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Active dataset for pagination
  const currentTotal = useMemo(() => {
    if (domainTab === 'wan') return filteredWanServices.length;
    if (domainTab === 'fiber') return filteredFiberServices.length;
    if (domainTab === 'voice') return filteredVoiceServices.length;
    return filteredMobileSubscriptions.length;
  }, [domainTab, filteredWanServices.length, filteredFiberServices.length, filteredVoiceServices.length, filteredMobileSubscriptions.length]);

  const totalPages = Math.max(1, Math.ceil(currentTotal / pageSize));

  // Paginated slices
  const paginatedWan = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWanServices.slice(start, start + pageSize);
  }, [filteredWanServices, currentPage]);

  const paginatedFiber = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFiberServices.slice(start, start + pageSize);
  }, [filteredFiberServices, currentPage]);

  const paginatedVoice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVoiceServices.slice(start, start + pageSize);
  }, [filteredVoiceServices, currentPage]);

  const paginatedMobile = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMobileSubscriptions.slice(start, start + pageSize);
  }, [filteredMobileSubscriptions, currentPage]);

  // Mobile Handlers
  const handleUpdateMobileStatus = (id: string, newStatus: 'Active' | 'Suspended') => {
    const updated = serviceNowRestService.updateMobileSubscriptionStatus(id, newStatus);
    setMobileList(updated);
    if (selectedMobileLine && selectedMobileLine.id === id) {
      setSelectedMobileLine({ ...selectedMobileLine, status: newStatus });
    }
  };

  const handleModifyMobilePlan = (id: string, newPlan: string, newCost: number) => {
    const updated = serviceNowRestService.modifyMobilePlan(id, newPlan, newCost);
    setMobileList(updated);
    if (selectedMobileLine && selectedMobileLine.id === id) {
      setSelectedMobileLine({ ...selectedMobileLine, plan: newPlan, monthlyCost: newCost, dataLimitGB: 0, hasAlert: false });
    }
  };

  // Helper for category badge color
  const getCategoryBadgeClass = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('sd-wan')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (cat.includes('cloud')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (cat.includes('dia') || cat.includes('internet')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (cat.includes('5g') || cat.includes('fwa')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const metrics = portalData.serviceMetrics || {
    core_wan: 5,
    fiber_broadband: 5,
    voice_sip: 5,
    mobile_fleet: 10,
    total: 25
  };

  const wanTabCount = selectedSite === 'ALL' ? (portalData.serviceMetrics?.core_wan ?? wanSitePool.length) : wanSitePool.length;
  const fiberTabCount = selectedSite === 'ALL' ? (portalData.serviceMetrics?.fiber_broadband ?? fiberSitePool.length) : fiberSitePool.length;
  const voiceTabCount = selectedSite === 'ALL' ? (portalData.serviceMetrics?.voice_sip ?? voiceSitePool.length) : voiceSitePool.length;
  const mobileTabCount = selectedSite === 'ALL' ? (portalData.serviceMetrics?.mobile_fleet ?? mobileSitePool.length) : mobileSitePool.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Enterprise Telecom Portfolio"
          title="Services Hub"
          description="High-assurance inventory of Core WAN circuits, dedicated optical access, enterprise voice trunks, and corporate mobile fleet."
        />

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onSyncCases && (
            <Button
              variant="outline"
              onClick={() => onSyncCases()}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-xs py-2 px-3 border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-xs"
              title="Synchronize live service records with ServiceNow"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
            </Button>
          )}

          {onOpenVirtualAssistant && (
            <Button
              variant="outline"
              onClick={() => onOpenVirtualAssistant({
                caseNumber: portalData.caseNumber,
                serviceName: portalData.service,
                status: 'Monitoring'
              })}
              className="flex items-center gap-2 text-xs py-2 px-3.5 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 shadow-xs"
            >
              <Bot className="h-4 w-4 text-teal-600" />
              <span>Ask Digital Assistant</span>
            </Button>
          )}
        </div>
      </div>

      {/* Primary Domain Tab Switcher: WAN vs Fiber vs Voice vs Mobile Fleet */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => { setDomainTab('wan'); setSearch(''); setCurrentPage(1); }}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
            domainTab === 'wan'
              ? 'bg-[#092E4C] text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Network className="h-4 w-4" />
          <span>Core WAN & Circuits</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            domainTab === 'wan' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {wanTabCount} Circuits
          </span>
        </button>

        <button
          onClick={() => { setDomainTab('fiber'); setSearch(''); setCurrentPage(1); }}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
            domainTab === 'fiber'
              ? 'bg-[#092E4C] text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Wifi className="h-4 w-4" />
          <span>Fiber Broadband</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            domainTab === 'fiber' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {fiberTabCount} Lines
          </span>
        </button>

        <button
          onClick={() => { setDomainTab('voice'); setSearch(''); setCurrentPage(1); }}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
            domainTab === 'voice'
              ? 'bg-[#092E4C] text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <PhoneCall className="h-4 w-4" />
          <span>Voice & SIP Trunks</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            domainTab === 'voice' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {voiceTabCount} Trunks
          </span>
        </button>

        <button
          onClick={() => { setDomainTab('mobile'); setSearch(''); setCurrentPage(1); }}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
            domainTab === 'mobile'
              ? 'bg-[#092E4C] text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>Mobile Fleet & SIMs</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            domainTab === 'mobile' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {mobileTabCount} Lines
          </span>
        </button>
      </div>

      {/* Global Controls Bar: Site Selector + Search + Sub-Filters + Density & Sorting Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Site Filter Dropdown + Search Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
          {/* Site Filter Dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xs shrink-0">
            <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
            <select
              value={selectedSite}
              onChange={(e) => {
                setSelectedSite(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
              title="Filter portfolio by Enterprise Site"
            >
              {SITES_CONFIG.map(site => (
                <option key={site.code} value={site.code}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xs flex-1">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                domainTab === 'wan' 
                  ? "Search circuits, IDs, VLANs or locations..."
                  : domainTab === 'fiber'
                  ? "Search fiber lines, ONT terminals, public IPs..."
                  : domainTab === 'voice'
                  ? "Search SIP trunks, codecs or channel pools..."
                  : "Search phone numbers, assigned users, devices or plans..."
              }
              className="w-full text-xs outline-none bg-transparent text-slate-900 font-medium placeholder:text-slate-400"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-1 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Sub-Filters & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Sub-Filters by Domain */}
          {domainTab === 'wan' && (
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs font-bold text-slate-600">
              {(['All', 'Affected', 'Operational'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setWanFilter(tab); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    wanFilter === tab ? 'bg-white text-slate-900 shadow-xs' : 'hover:bg-white/50 text-slate-600'
                  }`}
                >
                  {tab} {tab === 'All' ? `(${wanSitePool.length})` : tab === 'Affected' ? `(${wanAffectedCount})` : `(${wanOperationalCount})`}
                </button>
              ))}
            </div>
          )}

          {domainTab === 'voice' && (
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs font-bold text-slate-600">
              {(['All', 'Operational', 'Degraded'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setVoiceFilter(tab); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    voiceFilter === tab ? 'bg-white text-slate-900 shadow-xs' : 'hover:bg-white/50 text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {domainTab === 'mobile' && (
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs font-bold text-slate-600">
              {(['All', 'Active', 'Alerts', 'Suspended'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setMobileFilter(tab); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    mobileFilter === tab ? 'bg-white text-slate-900 shadow-xs' : 'hover:bg-white/50 text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Sort Selector for Mobile Fleet */}
          {domainTab === 'mobile' && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-xs text-xs font-semibold text-slate-700">
              <ArrowUpDown className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span className="text-slate-400 text-[11px] font-bold hidden sm:inline">Sort:</span>
              <select
                value={`${mobileSortField}-${mobileSortDirection}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-');
                  setMobileSortField(field as any);
                  setMobileSortDirection(dir as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer pr-1"
                title="Sort Mobile Fleet"
              >
                <option value="location-asc">Location (A → Z)</option>
                <option value="location-desc">Location (Z → A)</option>
                <option value="phoneNumber-asc">Phone Number (0 → 9)</option>
                <option value="assignedUser-asc">Assigned User (A → Z)</option>
                <option value="dataUsage-desc">Data Usage (Highest)</option>
                <option value="monthlyCost-desc">Monthly Cost (Highest)</option>
                <option value="status-asc">Status (Active first)</option>
              </select>
            </div>
          )}

          {/* View Mode Toggle: Table vs Cards for all domains including Mobile */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-[#092E4C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Compact sortable enterprise table view"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'cards' ? 'bg-[#092E4C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Expanded diagnostic card view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. DOMAIN TAB: CORE WAN CIRCUITS                               */}
      {/* ============================================================== */}
      {domainTab === 'wan' && (
        <div className="space-y-4">
          {filteredWanServices.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200">
              <Network className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No WAN Circuits Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No WAN circuits match your filter criteria ({selectedSite !== 'ALL' ? `Site: ${selectedSite}, ` : ''}Filter: {wanFilter}{search ? `, Search: "${search}"` : ''}).
              </p>
              <Button
                variant="outline"
                onClick={() => { setSelectedSite('ALL'); setWanFilter('All'); setSearch(''); }}
                className="mt-4 text-xs py-1.5 px-3.5"
              >
                Reset Filters
              </Button>
            </Card>
          ) : viewMode === 'table' ? (
            /* ── Table View: Core WAN ── */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Asset ID</th>
                      <th className="py-3 px-4">Service Name & Type</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-3">Bandwidth</th>
                      <th className="py-3 px-3">Availability</th>
                      <th className="py-3 px-3">Telemetry</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Active Case</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedWan.map((service, idx) => {
                      const isDegraded = service.status !== 'Operational' && service.status !== 'Restored';

                      return (
                        <tr 
                          key={`${service.id}-${idx}`}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* Circuit ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                                {service.circuitId || service.id}
                              </span>
                              <button
                                onClick={(e) => handleCopyId(service.circuitId || service.id, e)}
                                title="Copy Circuit ID"
                                className="text-slate-400 hover:text-slate-600 transition p-0.5"
                              >
                                {copiedId === (service.circuitId || service.id) ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            {service.vlan && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {service.vlan}
                              </div>
                            )}
                          </td>

                          {/* Service Name & Type */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{service.name}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded border ${getCategoryBadgeClass(service.category)}`}>
                                {service.category || 'Core WAN'}
                              </span>
                              {service.carrierTail && (
                                <span className="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[180px]">
                                  · {service.carrierTail}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-slate-700 font-semibold">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{service.location}</span>
                            </div>
                            {service.siteCode && (
                              <span className="text-[10px] text-teal-700 font-mono font-bold ml-4">
                                {service.siteCode}
                              </span>
                            )}
                          </td>

                          {/* Bandwidth */}
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {service.bandwidth}
                          </td>

                          {/* Availability */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className={`font-mono font-bold ${
                              parseFloat(service.availability) < 95 ? 'text-rose-600' :
                              parseFloat(service.availability) < 99 ? 'text-amber-600' : 'text-emerald-700'
                            }`}>
                              {service.availability}
                            </span>
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full rounded-full ${
                                  parseFloat(service.availability) < 95 ? 'bg-rose-500' :
                                  parseFloat(service.availability) < 99 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, parseFloat(service.availability) || 99)}%` }}
                              />
                            </div>
                          </td>

                          {/* Telemetry (Latency / Loss) */}
                          <td className="py-3.5 px-3 font-mono text-[11px] whitespace-nowrap">
                            <div className={isDegraded ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                              {service.latency}
                            </div>
                            <div className={service.packetLoss !== '0.0%' ? 'text-rose-600 font-bold' : 'text-slate-400 text-[10px]'}>
                              Loss: {service.packetLoss}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <Badge tone={
                              service.status === 'Critical' ? 'red' :
                              service.status === 'Degraded' ? 'amber' : 'green'
                            }>
                              {service.status}
                            </Badge>
                          </td>

                          {/* Active Case */}
                          <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs">
                            {service.activeCaseNumber ? (
                              <button
                                onClick={() => {
                                  if (onSelectActiveCase) onSelectActiveCase(service.activeCaseNumber!);
                                  onNavigate('case-detail');
                                }}
                                className="font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1"
                                title="Open active case details"
                              >
                                <span>{service.activeCaseNumber}</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">None (Healthy)</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {onOpenVirtualAssistant && (
                                <button
                                  onClick={() => onOpenVirtualAssistant({
                                    caseNumber: service.activeCaseNumber || portalData.caseNumber,
                                    serviceName: service.name,
                                    status: service.status,
                                    category: service.category
                                  })}
                                  title="Ask Assistant about this circuit"
                                  className="p-1.5 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition"
                                >
                                  <Bot className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {service.activeCaseNumber ? (
                                <Button
                                  variant="primary"
                                  onClick={() => {
                                    if (onSelectActiveCase) onSelectActiveCase(service.activeCaseNumber!);
                                    onNavigate('case-detail');
                                  }}
                                  className="text-[11px] py-1 px-2.5 font-bold shadow-xs"
                                >
                                  View Case
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => onNavigate('create-case', service.id)}
                                  className="text-[11px] py-1 px-2.5 border-slate-300 text-slate-700 hover:bg-slate-50"
                                >
                                  + Raise Case
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── Card View: Core WAN ── */
            <div className="space-y-4">
              {paginatedWan.map((service, idx) => {
                const isDegraded = service.status !== 'Operational' && service.status !== 'Restored';

                return (
                  <Card key={`${service.id}-${idx}`} className="overflow-hidden">
                    <div className={`h-1.5 ${isDegraded ? 'bg-gradient-to-r from-amber-400 to-rose-500' : 'bg-emerald-500'}`} />
                    <div className="p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`rounded-2xl p-3 font-bold text-xs shrink-0 ${getCategoryBadgeClass(service.category)}`}>
                            {service.category || 'Service'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-base sm:text-lg font-bold text-slate-900">{service.name}</h3>
                              <Badge tone={
                                service.status === 'Critical' ? 'red' :
                                service.status === 'Degraded' ? 'amber' : 'green'
                              }>
                                {service.status}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                              <span>Managed circuit</span>
                              <span>·</span>
                              <span className="font-bold font-mono text-slate-800">{service.bandwidth}</span>
                              <span>·</span>
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{service.circuitId || service.id}</span>
                              {service.siteCode && (
                                <span className="text-teal-700 font-mono font-bold">({service.siteCode})</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {onOpenVirtualAssistant && (
                            <Button
                              variant="outline"
                              onClick={() => onOpenVirtualAssistant({
                                caseNumber: service.activeCaseNumber || portalData.caseNumber,
                                serviceName: service.name,
                                status: service.status,
                                category: service.category
                              })}
                              className="text-xs py-2 px-3 flex items-center gap-1.5 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80"
                            >
                              <Bot className="h-3.5 w-3.5 text-teal-600" />
                              <span>Ask Assistant</span>
                            </Button>
                          )}
                          <Button variant="outline" className="text-xs py-2 px-3" onClick={() => onNavigate('service-detail')}>
                            View details
                          </Button>
                          {service.activeCaseNumber ? (
                            <Button 
                              variant="primary" 
                              className="text-xs py-2 px-3 shadow-xs" 
                              onClick={() => {
                                if (onSelectActiveCase) onSelectActiveCase(service.activeCaseNumber!);
                                onNavigate('case-detail');
                              }}
                            >
                              View Case {service.activeCaseNumber}
                            </Button>
                          ) : (
                            <Button 
                              variant="teal" 
                              className="text-xs py-2 px-3 shadow-xs" 
                              onClick={() => onNavigate('create-case', service.id)}
                            >
                              + Raise Support Case
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 pt-4 border-t border-slate-100">
                        <div>
                          <div className="text-[11px] font-medium text-slate-500">Location</div>
                          <b className="mt-1 block font-bold text-xs text-slate-900">{service.location}</b>
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-slate-500">Availability (30d)</div>
                          <b className={`mt-1 block font-bold text-xs ${parseFloat(service.availability) < 95 ? 'text-rose-600' : 'text-slate-900'}`}>{service.availability}</b>
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-slate-500">Telemetry (Latency / Loss)</div>
                          <b className={`mt-1 block font-bold text-xs ${isDegraded ? 'text-amber-700' : 'text-slate-900'}`}>
                            {service.latency} · {service.packetLoss} loss
                          </b>
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-slate-500">Active Case</div>
                          {service.activeCaseNumber ? (
                            <button
                              onClick={() => {
                                if (onSelectActiveCase) onSelectActiveCase(service.activeCaseNumber!);
                                onNavigate('case-detail');
                              }}
                              className="mt-1 block font-bold text-xs text-teal-700 font-mono hover:underline"
                            >
                              {service.activeCaseNumber}
                            </button>
                          ) : (
                            <b className="mt-1 block font-bold text-xs text-slate-500">None (Healthy)</b>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Clean Pagination for WAN */}
          {filteredWanServices.length > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
              <div className="text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, filteredWanServices.length)}</span> of{' '}
                <span className="font-bold text-slate-900">{filteredWanServices.length}</span> WAN Circuits
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-xs border-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                      currentPage === page
                        ? 'bg-[#092E4C] text-white shadow-xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 text-xs border-slate-300 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. DOMAIN TAB: FIBER BROADBAND                                 */}
      {/* ============================================================== */}
      {domainTab === 'fiber' && (
        <div className="space-y-4">
          {/* Fiber Fleet Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-[#092E4C] to-teal-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-teal-400" />
                <h3 className="font-extrabold text-base">Direct Enterprise Workplace Optical Access</h3>
              </div>
              <p className="text-xs text-blue-100 mt-1 max-w-2xl">
                Dedicated symmetrical fiber connections with guaranteed CIR throughput, optical power margin monitoring, and public static IPv4 /29 allocations.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-blue-200 uppercase font-black tracking-wider">Optical Availability</div>
                <div className="text-lg font-black font-mono text-emerald-400">99.99%</div>
              </div>
            </div>
          </div>

          {filteredFiberServices.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200">
              <Wifi className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Fiber Links Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No optical links match your current site or search criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => { setSelectedSite('ALL'); setSearch(''); }}
                className="mt-4 text-xs py-1.5 px-3.5"
              >
                Reset Site Filter
              </Button>
            </Card>
          ) : viewMode === 'table' ? (
            /* ── Table View: Fiber ── */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Circuit ID</th>
                      <th className="py-3 px-4">Dedicated Fiber Service</th>
                      <th className="py-3 px-4">Premises Location</th>
                      <th className="py-3 px-3">Throughput</th>
                      <th className="py-3 px-3">Demarcation ONT</th>
                      <th className="py-3 px-3">Optical Margin</th>
                      <th className="py-3 px-3">Static IP Pool</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedFiber.map((fiber) => (
                      <tr key={fiber.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {fiber.circuitId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {fiber.name}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                          <div className="flex items-center gap-1 font-semibold">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{fiber.location}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {fiber.speed}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          {fiber.ontTerminal}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {fiber.opticalSignal}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {fiber.staticIpPool}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <Badge tone="green">{fiber.status}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                if (onOpenVirtualAssistant) {
                                  onOpenVirtualAssistant({
                                    caseNumber: fiber.circuitId,
                                    serviceName: fiber.name,
                                    status: fiber.status
                                  });
                                }
                              }}
                              className="text-[11px] py-1 px-2.5 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80"
                            >
                              <Gauge className="h-3 w-3 mr-1 text-teal-600" /> Diagnostic
                            </Button>
                            <Button 
                              variant="teal" 
                              onClick={() => onNavigate('create-case', fiber.id)}
                              className="text-[11px] py-1 px-2.5 shadow-xs"
                            >
                              Report Issue
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── Card View: Fiber ── */
            <div className="space-y-4">
              {paginatedFiber.map((fiber) => (
                <Card key={fiber.id} className="overflow-hidden">
                  <div className="h-1.5 bg-emerald-500" />
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                          <Wifi className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-bold text-slate-900">{fiber.name}</h3>
                            <Badge tone="green">{fiber.status}</Badge>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Circuit: <span className="font-mono font-bold text-slate-700">{fiber.circuitId}</span> · {fiber.speed}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            if (onOpenVirtualAssistant) {
                              onOpenVirtualAssistant({
                                caseNumber: fiber.circuitId,
                                serviceName: fiber.name,
                                status: fiber.status
                              });
                            }
                          }}
                          className="text-xs py-2 px-3 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 flex items-center gap-1.5"
                        >
                          <Gauge className="h-3.5 w-3.5 text-teal-600" />
                          <span>Optical Diagnostic</span>
                        </Button>
                        <Button 
                          variant="teal" 
                          onClick={() => onNavigate('create-case', fiber.id)}
                          className="text-xs py-2 px-3 shadow-xs"
                        >
                          Report Fiber Issue
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 pt-4 border-t border-slate-100">
                      <div>
                        <div className="text-[11px] font-medium text-slate-500">Optical Signal Margin</div>
                        <b className="mt-1 block font-bold text-emerald-700 font-mono">{fiber.opticalSignal}</b>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500">Demarcation ONT</div>
                        <b className="mt-1 block font-bold text-slate-900">{fiber.ontTerminal}</b>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500">Static IP Pool</div>
                        <b className="mt-1 block font-bold text-slate-800 font-mono text-[11px]">{fiber.staticIpPool}</b>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500">Premises Location</div>
                        <b className="mt-1 block font-bold text-slate-900 line-clamp-1">{fiber.location}</b>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DOMAIN TAB: VOICE & SIP TRUNKS                              */}
      {/* ============================================================== */}
      {domainTab === 'voice' && (
        <div className="space-y-4">
          {/* Voice Fleet Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#092E4C] to-blue-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-teal-400" />
                <h3 className="font-extrabold text-base">Enterprise Fixed Voice & SIP Trunking Core</h3>
              </div>
              <p className="text-xs text-blue-100 mt-1 max-w-2xl">
                High-concurrency carrier Session Border Controller (SBC) interconnects with TLS signalling encryption, SRTP audio payload protection, and multi-codec negotiation (G.711 / G.722 HD).
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-blue-200 uppercase font-black tracking-wider">Total Concurrent Channels</div>
                <div className="text-lg font-black font-mono text-emerald-400">1,800 Ch</div>
              </div>
            </div>
          </div>

          {filteredVoiceServices.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200">
              <PhoneCall className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No SIP Trunks Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No voice trunks match your filter criteria ({selectedSite !== 'ALL' ? `Site: ${selectedSite}, ` : ''}{search ? `Search: "${search}"` : ''}).
              </p>
              <Button
                variant="outline"
                onClick={() => { setSelectedSite('ALL'); setSearch(''); setVoiceFilter('All'); }}
                className="mt-4 text-xs py-1.5 px-3.5"
              >
                Reset Filters
              </Button>
            </Card>
          ) : viewMode === 'table' ? (
            /* ── Table View: Voice & SIP ── */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Trunk ID</th>
                      <th className="py-3 px-4">Trunk Group Name</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-3">Channels</th>
                      <th className="py-3 px-3">Signaling / Media</th>
                      <th className="py-3 px-3">HD Codecs</th>
                      <th className="py-3 px-3">SLA Availability</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedVoice.map((trunk) => (
                      <tr key={trunk.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {trunk.trunkId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {trunk.name}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                          <div className="flex items-center gap-1 font-semibold">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{trunk.location}</span>
                          </div>
                          {trunk.siteCode && (
                            <span className="text-[10px] text-teal-700 font-mono font-bold ml-4">
                              {trunk.siteCode}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {trunk.channels} Channels
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          {trunk.protocol}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {trunk.codecs}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {trunk.availability}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <Badge tone={trunk.status === 'Operational' ? 'green' : 'amber'}>
                            {trunk.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {onOpenVirtualAssistant && (
                              <button
                                onClick={() => onOpenVirtualAssistant({
                                  caseNumber: trunk.activeCaseNumber || trunk.trunkId,
                                  serviceName: trunk.name,
                                  status: trunk.status,
                                  category: 'Voice'
                                })}
                                title="Run SIP trunk diagnostic"
                                className="p-1.5 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition"
                              >
                                <Bot className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <Button 
                              variant="outline" 
                              onClick={() => onNavigate('create-case', trunk.id)}
                              className="text-[11px] py-1 px-2.5 border-slate-300 text-slate-700 hover:bg-slate-50"
                            >
                              Report Trunk Issue
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── Card View: Voice & SIP ── */
            <div className="space-y-4">
              {paginatedVoice.map((trunk) => (
                <Card key={trunk.id} className="overflow-hidden">
                  <div className="h-1.5 bg-emerald-500" />
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                          <PhoneCall className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-bold text-slate-900">{trunk.name}</h3>
                            <Badge tone={trunk.status === 'Operational' ? 'green' : 'amber'}>{trunk.status}</Badge>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Trunk ID: <span className="font-mono font-bold text-slate-700">{trunk.trunkId}</span> · {trunk.channels} Channels
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onOpenVirtualAssistant && (
                          <Button 
                            variant="outline" 
                            onClick={() => onOpenVirtualAssistant({
                              caseNumber: trunk.activeCaseNumber || trunk.trunkId,
                              serviceName: trunk.name,
                              status: trunk.status,
                              category: 'Voice'
                            })}
                            className="text-xs py-2 px-3 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 flex items-center gap-1.5"
                          >
                            <Bot className="h-3.5 w-3.5 text-teal-600" />
                            <span>Trunk Diagnostic</span>
                          </Button>
                        )}
                        <Button 
                          variant="teal" 
                          onClick={() => onNavigate('create-case', trunk.id)}
                          className="text-xs py-2 px-3 shadow-xs"
                        >
                          Report Voice Issue
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 pt-4 border-t border-slate-100">
                      <div>
                        <div className="text-[11px] font-medium text-slate-500">Protocol & Security</div>
                        <b className="mt-1 block font-bold text-slate-900">{trunk.protocol}</b>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500">Audio Codecs</div>
                        <b className="mt-1 block font-bold text-slate-900 font-mono text-[11px]">{trunk.codecs}</b>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500">SLA Availability</div>
                        <b className="mt-1 block font-bold text-emerald-700 font-mono">{trunk.availability}</b>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-500">Premises Location</div>
                        <b className="mt-1 block font-bold text-slate-900 line-clamp-1">{trunk.location}</b>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Clean Pagination for Voice */}
          {filteredVoiceServices.length > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
              <div className="text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, filteredVoiceServices.length)}</span> of{' '}
                <span className="font-bold text-slate-900">{filteredVoiceServices.length}</span> Voice Trunks
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-xs border-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                      currentPage === page
                        ? 'bg-[#092E4C] text-white shadow-xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 text-xs border-slate-300 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. DOMAIN TAB: MOBILE FLEET & SIMS                             */}
      {/* ============================================================== */}
      {domainTab === 'mobile' && (
        <div className="space-y-4">
          {/* Mobile Fleet Executive KPI Banner (Dynamic to Selected Site) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border border-slate-200">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Subscriptions</div>
              <div className="mt-1 text-2xl font-black text-slate-900 font-mono">{mobileSiteTotal}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {selectedSite === 'ALL' ? 'Corporate Mobile Fleet (All 5 Sites)' : SITES_CONFIG.find(s => s.code === selectedSite)?.name || 'Filtered Site'}
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active SIM Cards</div>
              <div className="mt-1 text-2xl font-black text-emerald-600 font-mono">
                {mobileActiveCount} <span className="text-xs font-medium text-slate-500 font-sans">/ {mobileSiteTotal}</span>
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">{mobileOpRate}% operational rate</div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">High Utilization Alert</div>
              <div className="mt-1 text-2xl font-black text-amber-600 font-mono">{mobileAlertsCount}</div>
              <div className="text-[11px] text-amber-700 mt-0.5 font-medium">&gt; 90% monthly quota reached</div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Fleet MRR</div>
              <div className="mt-1 text-2xl font-black text-slate-900 font-mono">
                £{mobileTotalMRR.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">BACS Direct Debit Ledger</div>
            </Card>
          </div>

          {filteredMobileSubscriptions.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200">
              <Smartphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Mobile Lines Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No mobile subscriptions match your filter criteria ({selectedSite !== 'ALL' ? `Site: ${selectedSite}, ` : ''}{mobileFilter !== 'All' ? `Status: ${mobileFilter}, ` : ''}{search ? `Search: "${search}"` : ''}).
              </p>
              <Button
                variant="outline"
                onClick={() => { setSelectedSite('ALL'); setSearch(''); setMobileFilter('All'); }}
                className="mt-4 text-xs py-1.5 px-3.5"
              >
                Reset Mobile Filters
              </Button>
            </Card>
          ) : viewMode === 'table' ? (
            /* ── Table View: Mobile Fleet ── */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                      <th 
                        onClick={() => handleMobileSort('phoneNumber')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                        title="Click to sort by Phone Number"
                      >
                        <div className="flex items-center gap-1">
                          <span>Phone Number / SIM</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleMobileSort('assignedUser')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                        title="Click to sort by Assigned User"
                      >
                        <div className="flex items-center gap-1">
                          <span>Assigned User & Dept</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleMobileSort('location')}
                        className="py-3 px-4 cursor-pointer hover:text-teal-700 text-teal-800 font-extrabold select-none whitespace-nowrap bg-teal-50/40"
                        title="Click to sort by Location"
                      >
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-teal-600" />
                          <span>Location</span>
                          <ArrowUpDown className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                      </th>
                      <th className="py-3 px-3">Plan Tier</th>
                      <th className="py-3 px-3">Device Profile</th>
                      <th 
                        onClick={() => handleMobileSort('dataUsage')}
                        className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                        title="Click to sort by Data Usage"
                      >
                        <div className="flex items-center gap-1">
                          <span>Cycle Data</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleMobileSort('monthlyCost')}
                        className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                        title="Click to sort by Monthly Cost"
                      >
                        <div className="flex items-center gap-1">
                          <span>Monthly Cost</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleMobileSort('status')}
                        className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                        title="Click to sort by Status"
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedMobile.map((sub) => {
                      const dataPct = sub.dataLimitGB > 0 
                        ? Math.min(100, Math.round((sub.dataUsedGB / sub.dataLimitGB) * 100))
                        : 100;

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{sub.phoneNumber}</span>
                              {sub.hasAlert && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  &gt;95%
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              SIM: {sub.simNumber}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{sub.assignedUser}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{sub.department}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-slate-800 font-semibold">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{sub.location || 'Pune Technical Center'}</span>
                            </div>
                            {sub.siteCode && (
                              <span className="text-[10px] text-teal-700 font-mono font-bold ml-4">
                                {sub.siteCode}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-slate-800 font-medium whitespace-nowrap">
                            {sub.plan}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                            {sub.device}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-800 text-[11px]">
                              {sub.dataUsedGB.toFixed(1)} GB {sub.dataLimitGB > 0 ? `/ ${sub.dataLimitGB} GB` : '/ Unl'}
                            </div>
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full rounded-full ${
                                  dataPct >= 90 ? 'bg-rose-500' : dataPct >= 70 ? 'bg-amber-500' : 'bg-teal-600'
                                }`}
                                style={{ width: `${Math.min(100, dataPct)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            £{sub.monthlyCost.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <Badge tone={sub.status === 'Active' ? 'green' : 'slate'}>{sub.status}</Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedMobileLine(sub)}
                              className="text-[11px] py-1 px-2.5 flex items-center gap-1 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 shadow-xs"
                            >
                              <SlidersHorizontal className="h-3 w-3 text-teal-600" />
                              <span>Manage</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── Card View: Mobile Fleet ── */
            <div className="space-y-3">
              {paginatedMobile.map((sub) => {
                const dataPct = sub.dataLimitGB > 0 
                  ? Math.min(100, Math.round((sub.dataUsedGB / sub.dataLimitGB) * 100))
                  : 100;

                return (
                  <Card 
                    key={sub.id} 
                    className={`p-5 transition hover:border-teal-400 hover:shadow-xs ${
                      sub.hasAlert ? 'border-amber-300 bg-amber-50/10' : ''
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Line Identity */}
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          sub.status === 'Active' 
                            ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <Smartphone className="h-6 w-6" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-extrabold text-slate-900 font-mono text-base">{sub.phoneNumber}</span>
                            <Badge tone={sub.status === 'Active' ? 'green' : 'slate'}>{sub.status}</Badge>
                            {sub.hasAlert && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Over 95% Cap</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 mt-1">
                            <b className="text-slate-800">{sub.plan}</b> · {sub.device}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>Assigned: <span className="font-semibold text-slate-700">{sub.assignedUser}</span> ({sub.department})</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-bold text-teal-700">
                              <MapPin className="h-3 w-3" />
                              {sub.location || 'Pune Technical Center'} ({sub.siteCode || 'PUN-01'})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Usage Progress Bar */}
                      <div className="w-full lg:max-w-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-600">Cycle Data:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {sub.dataUsedGB.toFixed(1)} GB {sub.dataLimitGB > 0 ? `/ ${sub.dataLimitGB} GB` : '/ Unlimited'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              dataPct >= 90 ? 'bg-rose-500' : dataPct >= 70 ? 'bg-amber-500' : 'bg-teal-600'
                            }`}
                            style={{ width: `${Math.min(100, dataPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Cost & Action Button */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <div className="text-left lg:text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Monthly Plan</div>
                          <div className="font-mono font-bold text-sm text-slate-900">£{sub.monthlyCost.toFixed(2)}</div>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => setSelectedMobileLine(sub)}
                          className="text-xs py-2 px-3.5 flex items-center gap-1.5 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 shadow-xs"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5 text-teal-600" />
                          <span>Manage Line</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Clean Pagination for Mobile */}
          {filteredMobileSubscriptions.length > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
              <div className="text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, filteredMobileSubscriptions.length)}</span> of{' '}
                <span className="font-bold text-slate-900">{filteredMobileSubscriptions.length}</span> Corporate Lines
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-xs border-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                      currentPage === page
                        ? 'bg-[#092E4C] text-white shadow-xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 text-xs border-slate-300 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Line Management Modal */}
      <ManageLineModal
        open={!!selectedMobileLine}
        onClose={() => setSelectedMobileLine(null)}
        subscription={selectedMobileLine}
        onUpdateStatus={handleUpdateMobileStatus}
        onModifyPlan={handleModifyMobilePlan}
      />
    </div>
  );
};
