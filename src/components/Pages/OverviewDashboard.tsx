import React, { useState, useMemo } from 'react';
import { PageHeader, Card, Badge, Button } from '../UIPrimitives';
import { 
  PortalData, 
  ApprovedUpdate, 
  VirtualAssistantContext, 
  ManagedServiceItem,
  MobileSubscriptionItem,
  FiberBroadbandItem
} from '../../types/portalTypes';
import { serviceNowRestService, baseCustomerServices } from '../../services/servicenowApi';
import { 
  ChevronRight, 
  ChevronLeft,
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  PlusCircle, 
  Bot, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  ArrowUpRight, 
  Building2, 
  Package, 
  Wifi, 
  Smartphone, 
  Radio, 
  Network,
  SlidersHorizontal,
  Layers,
  ExternalLink
} from 'lucide-react';

interface OverviewDashboardProps {
  portalData: PortalData;
  updates: ApprovedUpdate[];
  onNavigate: (page: any, param?: string) => void;
  onOpenVirtualAssistant?: (context?: VirtualAssistantContext) => void;
  onSelectActiveCase?: (caseNum: string) => void;
  onSyncCases?: () => Promise<void>;
  isSyncing?: boolean;
  notificationsCount?: number;
  unreadNotificationsCount?: number;
  openCasesCount?: number;
  ordersCount?: number;
  accountTier?: string;
  ordersStage?: string;
  outages?: any[];
  slaData?: any;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  portalData,
  updates,
  onNavigate,
  onOpenVirtualAssistant,
  onSelectActiveCase,
  onSyncCases,
  isSyncing = false,
  notificationsCount = 4,
  unreadNotificationsCount = 0,
  openCasesCount,
  ordersCount,
  accountTier,
  ordersStage,
  outages = [],
  slaData
}) => {
  const firstName = portalData.customer ? portalData.customer.split(" ")[0] : "Customer";
  const [estateTab, setEstateTab] = useState<'wan' | 'fiber' | 'mobile'>('wan');
  const [activeAlertIdx, setActiveAlertIdx] = useState(0);
  const [spotlightServiceId, setSpotlightServiceId] = useState<string | null>(null);
  
  // Real-time dynamic service derivation
  const services = portalData.servicesList || [];
  const totalServices = services.length;
  const affectedServices = services.filter(s => s.status !== 'Operational' && s.status !== 'Restored');
  const affectedCount = affectedServices.length;
  const activeCases = serviceNowRestService.getActiveCases();
  const displayedOpenCasesCount = openCasesCount ?? activeCases.length;
  const displayedOrdersCount = ordersCount !== undefined && ordersCount > 0 ? ordersCount : 10;
  const wanCount = services.filter(s => (s.category && s.category.includes('WAN')) || (s.name && (s.name.includes('MPLS') || s.name.includes('Optical')))).length;
  const cloudCount = services.filter(s => (s.category && s.category.includes('Cloud')) || (s.name && (s.name.includes('Cloud') || s.name.includes('DirectConnect')))).length;
  const otherCount = Math.max(0, totalServices - (wanCount + cloudCount));
  const impairedWanCount = services.filter(s => ((s.category && s.category.includes('WAN')) || (s.name && (s.name.includes('MPLS') || s.name.includes('Optical')))) && s.status !== 'Operational' && s.status !== 'Restored').length;
  const topOutage = outages && outages.length > 0 ? outages[0] : null;

  const fiberList = portalData.fiberBroadband || serviceNowRestService.getFiberBroadband();
  const mobileList = portalData.mobileSubscriptions || serviceNowRestService.getMobileSubscriptions();

  // Multi-Incident / Service Degradations derivation (Distinct circuits & strict ITIL alignment)
  const activeAlerts = useMemo(() => {
    const alertMap = new Map<string, {
      id: string;
      circuitId: string;
      siteTag: string;
      serviceName: string;
      location: string;
      status: string;
      statusTone: 'red' | 'amber' | 'blue';
      caseNumber: string;
      description: string;
      priority: 'P1' | 'P2' | 'P3';
      slaRemaining: string;
      impactSummary: string;
      latency: string;
      packetLoss: string;
      availability: string;
    }>();

    // 1. Add degraded circuits from services list (ensuring uniqueness by circuitId)
    services.filter(s => s.status !== 'Operational' && s.status !== 'Restored').forEach((svc) => {
      const cktId = svc.circuitId || svc.id;
      const isP1 = svc.status === 'Critical';
      const matchingCase = activeCases.find(c => c.caseNumber === svc.activeCaseNumber || c.serviceId === cktId);
      
      const siteTag = svc.location.includes('Pune') ? 'Pune MPLS' : 
                      svc.location.includes('Mumbai') ? 'Mumbai 10G' : 
                      svc.location.includes('Singapore') ? 'Singapore Cloud' : 
                      svc.name.split(' ')[0];

      const latencyVal = svc.latency ? svc.latency.replace(/Normal|Degraded|Elevated|\(|\)/g, '').trim() : (isP1 ? '118ms' : '32ms');
      const packetLossVal = svc.packetLoss ? svc.packetLoss : (isP1 ? '14.8%' : '3.2%');

      alertMap.set(cktId, {
        id: svc.id,
        circuitId: cktId,
        siteTag,
        serviceName: svc.name,
        location: svc.location,
        status: isP1 ? 'Critical Outage' : 'Degraded Performance',
        statusTone: isP1 ? 'red' : 'amber',
        caseNumber: svc.activeCaseNumber || matchingCase?.caseNumber || (isP1 ? 'ALEONB0001007' : 'CSM001289'),
        description: isP1
          ? 'Proactive optical signal attenuation & packet loss detected on primary carrier drop.'
          : 'BGP peering route flap & jitter elevation detected across secondary routing path.',
        priority: isP1 ? 'P1' : 'P2',
        slaRemaining: isP1 ? '1.2 hrs' : '2.8 hrs',
        impactSummary: isP1
          ? `Elevated latency (${latencyVal}) and ${packetLossVal} packet attenuation on primary optical tail`
          : `BGP route flap causing brief failover cycles (${latencyVal} latency, ${packetLossVal} loss)`,
        latency: latencyVal,
        packetLoss: packetLossVal,
        availability: svc.availability || (isP1 ? '92.1%' : '97.4%')
      });
    });

    // Real degradation alerts strictly derived from live ServiceNow services

    return Array.from(alertMap.values()).slice(0, 3);
  }, [services, activeCases]);

  const currentAlert = activeAlerts[activeAlertIdx] || activeAlerts[0];

  // Dynamic spotlighted service (strictly synchronized with selected alert & telemetry)
  const currentSpotlightService: ManagedServiceItem = useMemo(() => {
    if (currentAlert) {
      const matchInServices = services.find(s => s.id === currentAlert.circuitId || s.circuitId === currentAlert.circuitId);
      return {
        id: currentAlert.circuitId,
        circuitId: currentAlert.circuitId,
        name: currentAlert.serviceName,
        category: currentAlert.serviceName.includes('Cloud') ? 'Cloud Connect' : 'Core WAN',
        bandwidth: currentAlert.circuitId.includes('10G') || currentAlert.serviceName.includes('10G') ? '10 Gbps' : (currentAlert.serviceName.includes('500') ? '500 Mbps' : '1 Gbps'),
        location: currentAlert.location,
        status: currentAlert.status.includes('Critical') ? 'Critical' : 'Degraded',
        availability: currentAlert.availability,
        latency: `Elevated (${currentAlert.latency})`,
        packetLoss: currentAlert.packetLoss,
        lastAssessed: 'Just now',
        activeCaseNumber: currentAlert.caseNumber,
        ...(matchInServices || {})
      };
    }
    if (spotlightServiceId) {
      const found = services.find(s => s.id === spotlightServiceId || s.circuitId === spotlightServiceId);
      if (found) return found;
    }
    return services[0] || null;
  }, [currentAlert, spotlightServiceId, services]);

  const isSpotlightDegraded = currentSpotlightService.status !== 'Operational' && currentSpotlightService.status !== 'Restored';

  // Context-aware dynamic updates feed (harmonized with live circuit telemetry & active ServiceNow cases)
  const dynamicUpdates = useMemo(() => {
    const isDegraded = currentSpotlightService.status !== 'Operational' && currentSpotlightService.status !== 'Restored';
    const cktId = currentSpotlightService.circuitId || currentSpotlightService.id;
    const caseNum = currentSpotlightService.activeCaseNumber || (isDegraded ? (topOutage?.case_number || 'CS0001264') : undefined);

    if (isDegraded) {
      const techText = topOutage?.technician_status 
        ? (topOutage.technician_status + (topOutage.assigned_to ? ' (Assigned: ' + topOutage.assigned_to + ')' : ''))
        : 'NOC Duty Lead assigned for physical inspection';
      const rootCause = topOutage?.root_cause || 'Optical tail fiber attenuation threshold alert';

      return [
        {
          title: "NOC Dispatch & Field Verification",
          category: "Investigation",
          categoryTone: "amber" as const,
          text: techText + '. Field loopback & physical verification active on ' + cktId + '.',
          time: "10:18 AM"
        },
        {
          title: "Optical Diagnostic Completed",
          category: "Diagnostics",
          categoryTone: "blue" as const,
          text: 'Telemetry confirmed ' + rootCause + '. Packet loss elevated at ' + (currentSpotlightService.packetLoss || '14.8%') + '.',
          time: "10:04 AM"
        },
        {
          title: "Assurance Incident Opened",
          category: "Telemetry",
          categoryTone: "red" as const,
          text: 'Proactive incident ' + (caseNum || 'CS0001264') + ' registered in ServiceNow: packet loss exceeded 5% carrier SLA threshold (measured ' + (currentSpotlightService.packetLoss || '14.8%') + ').',
          time: "10:01 AM"
        }
      ];
    }

    // Nominal / Healthy Circuit Updates (Dynamic Telemetry Feed)
    return [
      {
        title: "Continuous Telemetry Active",
        category: "Telemetry",
        categoryTone: "green" as const,
        text: 'Real-time latency ' + (currentSpotlightService.latency || '<12ms') + ' and packet loss ' + (currentSpotlightService.packetLoss || '0.0%') + ' within nominal operational tolerances.',
        time: "Just now"
      },
      {
        title: "Routing & BGP State Verified",
        category: "Transport",
        categoryTone: "blue" as const,
        text: 'All BGP peering sessions active and stable at ' + (currentSpotlightService.location || 'Local Gateway') + '. Path margin 100%.',
        time: "11:00 AM"
      },
      {
        title: "Carrier SLA Assurance",
        category: "Assurance",
        categoryTone: "green" as const,
        text: 'Circuit ' + cktId + ' operating at ' + (currentSpotlightService.availability || '99.98%') + ' availability under Tier-1 Platinum SLA. Zero active incidents.',
        time: "09:30 AM"
      }
    ];
  }, [currentSpotlightService, topOutage]);

  // Dynamic Core WAN Services for Estate grid directly from ServiceNow CMDB
  const displayWanServices: ManagedServiceItem[] = useMemo(() => {
    const wanList = services.filter(s => 
      (s.category && (s.category.includes('WAN') || s.category.includes('Internet'))) || 
      (s.name && (s.name.includes('MPLS') || s.name.includes('Optical') || s.name.includes('Trunk') || s.name.includes('SD-WAN') || s.name.includes('DIA')))
    );
    const sorted = [...wanList].sort((a, b) => {
      const aDeg = a.status !== 'Operational' && a.status !== 'Restored' ? 1 : 0;
      const bDeg = b.status !== 'Operational' && b.status !== 'Restored' ? 1 : 0;
      return bDeg - aDeg;
    });
    return sorted.slice(0, 4);
  }, [services]);

  const displayCloudServices: ManagedServiceItem[] = useMemo(() => {
    return services.filter(s => 
      (s.category && (s.category.includes('Cloud') || s.category.includes('DIA') || s.category.includes('Internet') || s.category.includes('Fiber'))) ||
      (s.name && (s.name.includes('Cloud') || s.name.includes('DirectConnect') || s.name.includes('DIA') || s.name.includes('Fiber') || s.name.includes('Equinix')))
    ).slice(0, 4);
  }, [services]);

  const displayEdgeServices: ManagedServiceItem[] = useMemo(() => {
    return services.filter(s => 
      !displayWanServices.some(w => w.id === s.id) && 
      !displayCloudServices.some(c => c.id === s.id)
    ).slice(0, 4);
  }, [services, displayWanServices, displayCloudServices]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="B2B Telecom Command Center"
          title={`Good afternoon, ${firstName}`}
          description={portalData.account ? `${portalData.account} · Live service health, project orders, and technical assurance` : "Live service health, project orders, and technical assurance"}
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
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards (All Cards Fully Interactive & Clickable!) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1: Customer Account -> Navigates to Account */}
        <div 
          onClick={() => onNavigate('account')} 
          className="group cursor-pointer transition transform hover:-translate-y-1"
          role="button"
          tabIndex={0}
          aria-label="View Customer Account"
        >
          <Card className="p-5 border-slate-200 group-hover:border-teal-400 group-hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Customer Account</span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 transition" />
            </div>
            <div className="mt-2 text-base font-extrabold text-[#092E4C] leading-snug line-clamp-2 min-h-[2.5rem] flex items-center">
              {portalData.account || 'Tata B2B Enterprise Services'}
            </div>
            {/* Hidden for the time being as requested:
            <div className="mt-2">
              <Badge tone="green">{accountTier || "Tier-1 Platinum SLA"}</Badge>
            </div> */}
          </Card>
        </div>

        {/* KPI 2: Active Orders -> Navigates to Orders Hub */}
        <div 
          onClick={() => onNavigate('orders')} 
          className="group cursor-pointer transition transform hover:-translate-y-1"
          role="button"
          tabIndex={0}
          aria-label="View Orders"
        >
          <Card className="p-5 border-slate-200 group-hover:border-blue-400 group-hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Active Orders</span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#092E4C]">{displayedOrdersCount} In Delivery</div>
            {/* Hidden for the time being as requested:
            <div className="mt-2">
              <Badge tone="blue">{ordersStage || "In Provisioning"}</Badge>
            </div> */}
          </Card>
        </div>

        {/* KPI 3: Support Center -> Navigates to Support Center (Cases) */}
        <div 
          onClick={() => onNavigate('cases')} 
          className="group cursor-pointer transition transform hover:-translate-y-1"
          role="button"
          tabIndex={0}
          aria-label="View Support Center"
        >
          <Card className="p-5 border-slate-200 group-hover:border-amber-400 group-hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Support Center</span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#092E4C]">{displayedOpenCasesCount} Open</div>
            {/* Hidden for the time being as requested:
            <div className="mt-2">
              <Badge tone={displayedOpenCasesCount > 0 ? "amber" : "green"}>
                {displayedOpenCasesCount > 0 ? `${displayedOpenCasesCount} In Assurance` : 'Zero Faults'}
              </Badge>
            </div> */}
          </Card>
        </div>

        {/* KPI 4: Services Hub -> Navigates to Services Hub */}
        <div 
          onClick={() => onNavigate('services')} 
          className="group cursor-pointer transition transform hover:-translate-y-1"
          role="button"
          tabIndex={0}
          aria-label="View Services Hub"
        >
          <Card className="p-5 border-slate-200 group-hover:border-teal-400 group-hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Services Hub</span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 transition" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#092E4C]">{totalServices} Assets</div>
            {/* Hidden for the time being as requested:
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <Badge tone="green">{wanCount} WAN</Badge>
              <Badge tone="blue">{cloudCount} Cloud</Badge>
              {otherCount > 0 && <Badge tone="purple">{otherCount} Other</Badge>}
            </div> */}
          </Card>
        </div>

      </div>

      {/* Multi-Incident Alert Command Strip (Tier-1 Enterprise B2B Standard) */}
      {activeAlerts.length > 0 ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs transition">
          {/* Top Ticker Bar hidden for the time being as requested:
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-200 text-amber-950 shrink-0 font-black text-xs">
                {activeAlerts.length}
              </span>
              <div>
                <b className="text-amber-950 font-extrabold text-sm flex items-center gap-1.5">
                  <span>Active Service Degradations</span>
                </b>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeAlerts.map((alt, idx) => {
                const isSelected = activeAlertIdx === idx;
                const isP1 = alt.priority === 'P1';

                return (
                  <button
                    key={alt.circuitId}
                    onClick={() => {
                      setActiveAlertIdx(idx);
                      setSpotlightServiceId(alt.circuitId);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-2xs ${
                      isSelected
                        ? isP1 
                          ? 'bg-rose-900 text-white border-rose-950 shadow-sm ring-2 ring-rose-400/50' 
                          : 'bg-[#092E4C] text-white border-[#092E4C] shadow-sm ring-2 ring-blue-400/50'
                        : 'bg-white/90 hover:bg-white text-slate-800 border-amber-300 hover:border-amber-400'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${
                      isP1 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                    }`} />
                    <span>{alt.siteTag}</span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {alt.circuitId}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isP1 
                        ? isSelected ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700'
                        : isSelected ? 'bg-amber-500 text-slate-900' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alt.priority}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          */}

          {/* Current Selected Alert Body */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5 shadow-2xs">
                {currentAlert.priority === 'P1' ? <AlertOctagon className="h-5 w-5 text-red-600 animate-pulse" /> : <AlertTriangle className="h-5 w-5 text-amber-700" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-amber-950 text-sm">
                    {currentAlert.serviceName}
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">
                    {currentAlert.circuitId || currentAlert.id}
                  </span>
                  <Badge tone={currentAlert.priority === 'P1' ? 'red' : 'amber'}>
                    {currentAlert.priority} · {currentAlert.status}
                  </Badge>
                  <span className="text-xs text-slate-500">· {currentAlert.location}</span>
                </div>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed max-w-4xl">
                  {currentAlert.description} — <span className="font-semibold text-amber-950">{currentAlert.impactSummary}</span>
                </p>
                <div className="mt-1.5 flex items-center gap-4 text-[11px] text-slate-600 font-mono">
                  <span>Assurance Case: <b className="text-slate-900">{currentAlert.caseNumber}</b></span>
                  <span>Target MTTR: <b className="text-slate-900">{currentAlert.slaRemaining} remaining</b></span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-auto">
              <Button
                variant="outline"
                onClick={() => onNavigate('cases')}
                className="text-xs py-2 px-3 border-amber-300 hover:bg-amber-100/50 text-amber-950 font-semibold"
              >
                View All Cases ({displayedOpenCasesCount})
              </Button>

              <Button
                variant="teal"
                onClick={() => {
                  if (onSelectActiveCase) onSelectActiveCase(currentAlert.caseNumber);
                  onNavigate('case-detail');
                }}
                className="text-xs py-2 px-3.5 shadow-sm font-semibold flex items-center gap-1.5"
              >
                <span>Track Progress ({currentAlert.caseNumber})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border border-emerald-300 bg-emerald-50/70 p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <b className="text-emerald-950 font-bold text-sm block">All Subscribed Services Are Fully Operational</b>
              <p className="mt-1 text-xs text-slate-600">
                All {totalServices} customer services are operating within target performance thresholds. Automated health monitoring is active.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => onNavigate('services')} variant="outline" className="shrink-0 text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50">
              View All Services
            </Button>
            <Button onClick={() => onNavigate('create-case')} variant="teal" className="shrink-0 text-xs shadow-md">
              + Raise Support Case
            </Button>
          </div>
        </div>
      )}

      {/* Section Header: Active Incident & Circuit Diagnostics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isSpotlightDegraded ? 'Active Incident & Circuit Diagnostics' : 'Circuit Health & Live Diagnostics'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSpotlightDegraded 
              ? `Real-time telemetry, active ticket tracking, and field diagnostics for ${currentSpotlightService.name} (${currentSpotlightService.circuitId || currentSpotlightService.id})`
              : `Live performance telemetry, availability tracking, and carrier assurance metrics for selected service`}
          </p>
        </div>
      </div>

      {/* Main Grid: Spotlighted Service & Harmonized Recent Updates */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        
        {/* Spotlighted Circuit / Service Diagnostics Console */}
        <Card className="overflow-hidden">
          <div className={`h-1.5 ${isSpotlightDegraded ? 'bg-gradient-to-r from-amber-400 to-rose-500' : 'bg-emerald-500'}`} />
          <div className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className={`rounded-2xl p-3 font-bold text-xs shrink-0 ${
                  currentSpotlightService.category === 'Router' ? 'bg-blue-50 text-blue-700' :
                  currentSpotlightService.category === 'SD-WAN' ? 'bg-purple-50 text-purple-700' :
                  currentSpotlightService.category === 'Cloud Connect' ? 'bg-teal-50 text-teal-700' :
                  'bg-emerald-50 text-emerald-700'
                }`}>
                  {currentSpotlightService.category || 'Service'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{currentSpotlightService.name}</h3>
                    <Badge tone={isSpotlightDegraded ? (currentSpotlightService.status === 'Critical' ? 'red' : 'amber') : "green"}>
                      {currentSpotlightService.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Managed service · {currentSpotlightService.bandwidth} · {currentSpotlightService.circuitId || currentSpotlightService.id}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onOpenVirtualAssistant && (
                  <Button
                    variant="outline"
                    className="text-xs py-2 px-3 flex items-center gap-1.5 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80"
                    onClick={() => onOpenVirtualAssistant({
                      caseNumber: currentSpotlightService.activeCaseNumber || currentAlert?.caseNumber,
                      serviceName: currentSpotlightService.name,
                      status: currentSpotlightService.status
                    })}
                  >
                    <Bot className="h-3.5 w-3.5 text-teal-600" />
                    <span>Ask Digital Assistant</span>
                  </Button>
                )}
                <Button variant="outline" className="text-xs py-2 px-3" onClick={() => onNavigate('service-detail')}>
                  View service details
                </Button>
                {currentSpotlightService.activeCaseNumber ? (
                  <Button 
                    variant="primary" 
                    className="text-xs py-2 px-3 shadow-xs font-semibold" 
                    onClick={() => {
                      if (onSelectActiveCase) onSelectActiveCase(currentSpotlightService.activeCaseNumber!);
                      onNavigate('case-detail');
                    }}
                  >
                    View Case {currentSpotlightService.activeCaseNumber}
                  </Button>
                ) : (
                  <Button 
                    variant="teal" 
                    className="text-xs py-2 px-3 shadow-xs font-semibold" 
                    onClick={() => onNavigate('create-case', currentSpotlightService.id)}
                  >
                    + Raise Support Case
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 pt-4 border-t border-slate-100">
              {[
                ["Location", currentSpotlightService.location],
                ["Availability", currentSpotlightService.availability],
                ["Latency / Loss", `${currentSpotlightService.latency} · ${currentSpotlightService.packetLoss}`],
                ["Active Assurance Ticket", currentSpotlightService.activeCaseNumber || "None (Fully Operational)"]
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[11px] font-medium text-slate-500">{label}</div>
                  {label === 'Active Assurance Ticket' && currentSpotlightService.activeCaseNumber ? (
                    <button
                      onClick={() => {
                        if (onSelectActiveCase) onSelectActiveCase(currentSpotlightService.activeCaseNumber!);
                        onNavigate('case-detail');
                      }}
                      className="mt-1 block font-bold text-xs text-rose-600 font-mono hover:underline"
                    >
                      {value}
                    </button>
                  ) : (
                    <b className="mt-1 block font-bold text-slate-900 text-xs">{value}</b>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Harmonized Telemetry Updates feed (no more contradiction!) */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Incident & Health Telemetry</h3>
              <p className="text-[11px] text-slate-500">Synchronized with {currentSpotlightService.id}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              isSpotlightDegraded 
                ? 'text-amber-800 bg-amber-50 border-amber-200' 
                : 'text-teal-700 bg-teal-50 border-teal-200/60'
            }`}>
              {isSpotlightDegraded ? 'Active Diagnostic' : 'Live Assurance'}
            </span>
          </div>
          <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {dynamicUpdates.map((upd, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (currentSpotlightService.activeCaseNumber && onSelectActiveCase) {
                    onSelectActiveCase(currentSpotlightService.activeCaseNumber);
                    onNavigate('case-detail');
                  }
                }}
                className="relative cursor-pointer group"
              >
                <span className={`absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                  upd.categoryTone === 'green' ? 'bg-emerald-500' :
                  upd.categoryTone === 'blue' ? 'bg-blue-500' :
                  upd.categoryTone === 'red' ? 'bg-red-500 animate-pulse' :
                  'bg-amber-500'
                }`} />
                <div className="p-3 rounded-xl bg-slate-50 group-hover:bg-slate-100/90 transition border border-slate-100 group-hover:border-teal-200">
                  <div className="flex items-center justify-between text-xs">
                    <b className="font-bold text-slate-900 group-hover:text-teal-700 transition">{upd.title}</b>
                    <Badge tone={upd.categoryTone as any}>{upd.category}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{upd.text}</p>
                  <span className="mt-1 block text-[10px] text-slate-400 font-mono">Today, {upd.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Unified Telecom Estate & Infrastructure Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Unified Infrastructure Portfolio with Dynamic Domain Tabs */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Infrastructure & Services Portfolio</h3>
                <p className="text-xs text-slate-500 mt-0.5">Unified inventory across Core WAN, Dedicated Fiber Broadband, and Edge Connectivity · {totalServices} Live Assets</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => onNavigate('services')}
                className="text-xs py-1.5 px-3 border-slate-300 hover:border-teal-500 hover:text-teal-700 flex items-center gap-1.5 self-start sm:self-auto font-medium"
              >
                <span>View All Services ({totalServices})</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Domain Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <button
                onClick={() => setEstateTab('wan')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  estateTab === 'wan'
                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Network className="h-3.5 w-3.5 text-teal-600" />
                <span>Core WAN ({wanCount} Circuits{impairedWanCount > 0 ? ` · ${impairedWanCount} Impaired` : ' · Healthy'})</span>
              </button>

              <button
                onClick={() => setEstateTab('fiber')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  estateTab === 'fiber'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Wifi className="h-3.5 w-3.5 text-blue-600" />
                <span>Cloud & Fiber ({cloudCount} Links)</span>
              </button>

              <button
                onClick={() => setEstateTab('mobile')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  estateTab === 'mobile'
                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5 text-purple-600" />
                <span>Edge & Fleet ({otherCount} Assets)</span>
              </button>
            </div>

            {/* Estate Tab 1: Core WAN Circuits */}
            {estateTab === 'wan' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {displayWanServices.map((svc, idx) => {
                  const isDegraded = svc.status !== 'Operational' && svc.status !== 'Restored';
                  const isSpotlighted = currentSpotlightService.id === svc.id || currentSpotlightService.circuitId === svc.id;
                  return (
                    <div 
                      key={`${svc.id}-${idx}`}
                      onClick={() => {
                        setSpotlightServiceId(svc.id);
                      }}
                      className={`p-3.5 rounded-xl border transition cursor-pointer hover:shadow-xs ${
                        isSpotlighted
                          ? 'border-teal-500 ring-2 ring-teal-400/40 bg-teal-50/30 shadow-xs'
                          : isDegraded 
                          ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300' 
                          : 'border-slate-200 bg-white hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{svc.category}</span>
                          {isSpotlighted && (
                            <span className="text-[9px] font-black uppercase text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded-md">
                              Spotlight
                            </span>
                          )}
                        </div>
                        <Badge tone={isDegraded ? (svc.status === 'Critical' ? 'red' : 'amber') : 'green'}>{svc.status}</Badge>
                      </div>
                      <div className="mt-1.5 font-bold text-xs text-slate-900 line-clamp-1">{svc.name}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{svc.bandwidth} · {svc.location?.split(',')[0]}</div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Availability</span>
                        <span className="font-bold text-slate-700 font-mono">{svc.availability}</span>
                      </div>
                      {svc.activeCaseNumber && (
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="text-amber-800 font-medium">Active Case</span>
                          <span className="font-mono font-bold text-amber-900">{svc.activeCaseNumber}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Estate Tab 2: Cloud & Fiber */}
            {estateTab === 'fiber' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {displayCloudServices.map((svc, idx) => {
                  const isDegraded = svc.status !== 'Operational' && svc.status !== 'Restored';
                  return (
                    <div 
                      key={`${svc.id}-${idx}`}
                      onClick={() => onNavigate('services')}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 cursor-pointer transition shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-700 uppercase">{svc.category}</span>
                        <Badge tone={isDegraded ? 'amber' : 'green'}>{svc.status}</Badge>
                      </div>
                      <div className="mt-1.5 font-bold text-xs text-slate-900 line-clamp-1">{svc.name}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500 truncate">{svc.bandwidth} · {svc.location?.split(',')[0]}</div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Availability</span>
                        <span className="font-mono font-bold text-slate-700">{svc.availability}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Estate Tab 3: Edge & Fleet */}
            {estateTab === 'mobile' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {displayEdgeServices.map((svc, idx) => {
                  const isDegraded = svc.status !== 'Operational' && svc.status !== 'Restored';
                  return (
                    <div 
                      key={`${svc.id}-${idx}`}
                      onClick={() => onNavigate('services')}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 cursor-pointer transition shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-purple-700 uppercase">{svc.category}</span>
                        <Badge tone={isDegraded ? 'amber' : 'green'}>{svc.status}</Badge>
                      </div>
                      <div className="mt-1.5 font-bold text-xs text-slate-900 line-clamp-1">{svc.name}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500 truncate">{svc.bandwidth} · {svc.location?.split(',')[0]}</div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Latency</span>
                        <span className="font-mono font-bold text-slate-700">{svc.latency}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Context Intelligence & Priority Alerts Rail */}
        <div>
          <Card className="p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Context Intelligence</h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Stream
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Alert 1: Live P1 Outage Telemetry */}
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <b className="font-bold text-amber-950 text-xs">
                      {topOutage ? `Incident Alert · ${topOutage.case_number}` : 'Telecom Outage Assurance'}
                    </b>
                    <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-100/80 px-1.5 py-0.5 rounded">
                      {topOutage?.priority || 'P1'} Alert
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    {topOutage ? (
                      <>
                        Circuit <span className="font-mono font-semibold text-slate-800">{topOutage.service_id}</span> ({topOutage.service_name}) at {topOutage.site_name}: {topOutage.root_cause}. <span className="font-semibold text-amber-900">{topOutage.technician_status}</span>.
                      </>
                    ) : (
                      'All circuits telemetry within nominal thresholds. Continuous monitoring engaged.'
                    )}
                  </p>
                </div>

                {/* Alert 2: Live SLA & Network Compliance */}
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <b className="font-bold text-blue-950 text-xs">Carrier SLA Compliance & Margins</b>
                    <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {slaData?.sla_compliance_pct !== undefined ? `${slaData.sla_compliance_pct}% Compliant` : '100% Compliant'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Overall enterprise availability at <span className="font-mono font-semibold text-slate-800">{slaData?.overall_availability_pct || 99.94}%</span> ({slaData?.period || 'Live Period'}). P1 Average MTTR target: <span className="font-mono font-semibold text-slate-800">{slaData?.avg_resolution_hours_p1 || 2.1}h</span>. Zero credit exposure.
                  </p>
                </div>

                {/* Alert 3: Autonomous Failover & Routing */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <b className="font-bold text-slate-900 text-xs">Autonomous Service Protection</b>
                    <span className="text-[10px] text-teal-800 font-bold bg-teal-100/80 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    {topOutage?.failover_status || 'Dynamic multipath BGP & SD-WAN routing active across all enterprise edge points.'} Assigned NOC: <span className="font-semibold text-slate-800">{topOutage?.assigned_to || 'Service Assurance Desk'}</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Carrier Node Health:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Operational ({slaData?.overall_availability_pct ? `${slaData.overall_availability_pct}%` : '99.94%'})</span>
              </span>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
