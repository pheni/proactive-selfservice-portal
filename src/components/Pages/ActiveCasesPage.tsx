import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge, Button } from '../UIPrimitives';
import { PortalData, VirtualAssistantContext, ActiveCaseItem, ClosedCaseItem } from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';
import { 
  Search, 
  PlusCircle, 
  Bot, 
  ArrowUpRight, 
  CheckCircle2, 
  RefreshCw, 
  PhoneCall, 
  Clock, 
  ShieldCheck, 
  Zap, 
  PhoneForwarded 
} from 'lucide-react';

interface ActiveCasesPageProps {
  portalData: PortalData;
  onNavigate: (page: any, caseNum?: string) => void;
  onOpenVirtualAssistant: (context?: VirtualAssistantContext) => void;
  onSelectActiveCase?: (caseNum: string) => void;
  onSelectClosedCase?: (caseNum: string) => void;
  initialTab?: 'active' | 'closed' | 'escalation';
  onCasesUpdated?: (activeCount: number, closedCount: number) => void;
  onOpenCall?: () => void;
}

export const ActiveCasesPage: React.FC<ActiveCasesPageProps> = ({
  portalData,
  onNavigate,
  onOpenVirtualAssistant,
  onSelectActiveCase,
  onSelectClosedCase,
  initialTab = 'active',
  onCasesUpdated,
  onOpenCall
}) => {
  const [tab, setTab] = useState<'active' | 'closed' | 'escalation'>(initialTab);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Investigating' | 'Recovery' | 'Monitoring' | 'Action Required'>('All');

  const [activeCases, setActiveCases] = useState<ActiveCaseItem[]>(() => serviceNowRestService.getActiveCases());
  const [closedCases, setClosedCases] = useState<ClosedCaseItem[]>(() => serviceNowRestService.getClosedCases());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const syncCases = async (showLoading = true, force = false) => {
    if (showLoading) setIsSyncing(true);
    try {
      const [freshActive, freshClosed] = await Promise.all([
        serviceNowRestService.fetchActiveCases(10, force),
        serviceNowRestService.fetchClosedCases(10, force)
      ]);
      setActiveCases(freshActive);
      setClosedCases(freshClosed);
      if (onCasesUpdated) {
        onCasesUpdated(freshActive.length, freshClosed.length);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn("Case sync fallback active:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncCases(false, false);
  }, []);

  const filteredActiveCases = activeCases.filter(ac => {
    const matchesSearch = ac.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
                          ac.service.toLowerCase().includes(search.toLowerCase()) ||
                          ac.description.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === 'Investigating') return matchesSearch && ac.status === 'Investigating';
    if (activeFilter === 'Recovery') return matchesSearch && ac.status === 'Recovery';
    if (activeFilter === 'Monitoring') return matchesSearch && ac.status === 'Monitoring';
    if (activeFilter === 'Action Required') return matchesSearch && ac.status === 'Customer Input Required';
    return matchesSearch;
  });

  const filteredClosedCases = closedCases.filter(cc => {
    return cc.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
           cc.service.toLowerCase().includes(search.toLowerCase()) ||
           cc.summary.toLowerCase().includes(search.toLowerCase());
  });

  const getPriorityBadge = (priority?: string) => {
    if (priority === 'P1') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">P1 · Critical</span>;
    }
    if (priority === 'P2') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">P2 · High</span>;
    }
    if (priority === 'P4') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">P4 · Minor</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">P3 · Moderate</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Assurance & Incident Management"
          title="Support Center"
          description="Track active service assurance tickets, report incidents, and inspect historical resolution records."
        />

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => syncCases(true, true)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs py-2 px-3 border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            title="Synchronize case records with live assurance system"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onOpenVirtualAssistant({
              caseNumber: activeCases[0]?.caseNumber || portalData.caseNumber,
              serviceName: activeCases[0]?.service || portalData.service,
              status: activeCases[0]?.status || 'Monitoring'
            })}
            className="flex items-center gap-2 text-xs py-2 px-3 border-teal-500/30 text-teal-800 bg-teal-50/50 hover:bg-teal-100/70"
          >
            <Bot className="h-4 w-4 text-teal-600" />
            <span>Ask Digital Assistant</span>
          </Button>
        </div>
      </div>

      {/* Main Segmented Control: Active Cases vs Closed Cases vs NOC Escalation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => { setTab('active'); setSearch(''); }}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                tab === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <span>Active Cases</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                tab === 'active' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {activeCases.length}
              </span>
            </button>

            <button
              onClick={() => { setTab('closed'); setSearch(''); }}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                tab === 'closed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <span>Closed Cases</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                tab === 'closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {closedCases.length}
              </span>
            </button>

            <button
              onClick={() => { setTab('escalation'); setSearch(''); }}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                tab === 'escalation'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${tab === 'escalation' ? 'text-amber-500 fill-amber-500' : 'text-slate-500'}`} />
              <span>NOC & Escalation</span>
            </button>
          </div>
          {lastSyncTime && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>Synced {lastSyncTime}</span>
            </span>
          )}
        </div>

        {/* Search Bar - Active/Closed Cases Only */}
        {tab !== 'escalation' && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-xs max-w-sm w-full">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'active' ? "Search active cases, services, issues..." : "Search closed cases or resolutions..."}
              className="w-full text-xs outline-none bg-transparent text-slate-900 font-medium"
            />
          </div>
        )}
      </div>

      {/* Sub-Filters for Active Cases */}
      {tab === 'active' && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Stage:</span>
          {(['All', 'Investigating', 'Recovery', 'Monitoring', 'Action Required'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                activeFilter === f
                  ? 'bg-[#092E4C] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {tab === 'escalation' ? (
        <div className="space-y-6">
          {/* 4 Support Channels */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Ask Digital Assistant */}
            <Card className="p-6 border-2 border-teal-500/40 bg-teal-50/30 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-2 right-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                  Instant AI
                </span>
              </div>
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-extrabold text-slate-900 text-base">Ask Digital Assistant</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Instant AI line diagnostics, circuit telemetry analysis, and automated priority routing without hold times.
                </p>
              </div>
              <Button 
                variant="teal" 
                className="mt-5 w-full text-xs shadow-xs flex items-center justify-center gap-1.5" 
                onClick={() => {
                  onOpenVirtualAssistant({
                    caseNumber: activeCases[0]?.caseNumber || portalData.caseNumber,
                    serviceName: activeCases[0]?.service || portalData.service,
                    status: 'Monitoring'
                  });
                }}
              >
                <Bot className="h-4 w-4" />
                <span>Launch Assistant</span>
              </Button>
            </Card>

            {/* Card 2: Create Support Case */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <PlusCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900 text-base">Create Support Case</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Submit a formal incident ticket or MACD service request directly to the carrier assurance team.
                </p>
              </div>
              <Button variant="outline" className="mt-5 w-full text-xs hover:border-slate-300" onClick={() => onNavigate('create-case')}>
                Create Support Case
              </Button>
            </Card>

            {/* Card 3: Instant Voice Call */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <PhoneCall className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900 text-base">Instant Voice Bridge</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Connect immediately with a senior Tier-2/Tier-3 duty engineer right from your browser.
                </p>
              </div>
              <Button variant="outline" className="mt-5 w-full text-xs hover:border-slate-300" onClick={onOpenCall}>
                Start Voice Call
              </Button>
            </Card>

            {/* Card 4: Request a callback */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Clock className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900 text-base">Request a Callback</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Schedule a 30-minute dedicated review window and a designated engineer will call your direct line.
                </p>
              </div>
              <Button variant="outline" className="mt-5 w-full text-xs hover:border-slate-300" onClick={onOpenCall}>
                Schedule Callback
              </Button>
            </Card>
          </div>

          {/* 24/7 Priority Emergency Hotline Card & Enterprise Response SLAs */}
          <Card className="p-6 border border-slate-200 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">24/7 Priority Emergency Hotline</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For catastrophic service outages affecting core site traffic, bypass queues via the direct carrier bridge.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Direct NOC Hotline</div>
                  <div className="text-lg font-black text-slate-900 font-mono">+44 (0) 800 496 0123</div>
                </div>
                <Button variant="teal" onClick={onOpenCall} className="text-xs py-2 px-3 flex items-center gap-1.5">
                  <PhoneForwarded className="h-3.5 w-3.5" />
                  <span>Call Now</span>
                </Button>
              </div>
            </div>

            {/* Enterprise Response SLA Matrix */}
            <div className="pt-6">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>Guaranteed Service Assurance SLAs</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                  <div className="flex items-center justify-between">
                    <b className="font-extrabold text-rose-800">P1 · Critical Outage</b>
                    <span className="font-mono font-bold text-rose-700 text-[11px]">&lt; 15 mins</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">Complete site down or link loss. Dedicated crisis lead assigned.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <b className="font-extrabold text-amber-800">P2 · High Degradation</b>
                    <span className="font-mono font-bold text-amber-700 text-[11px]">&lt; 1 hour</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">Elevated latency or jitter. Automated diagnostics & telemetry review.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <b className="font-extrabold text-blue-800">P3 · Moderate Impact</b>
                    <span className="font-mono font-bold text-blue-700 text-[11px]">&lt; 4 hours</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">Redundancy failure without customer service interruption.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <b className="font-bold text-slate-800">P4 · Minor Request</b>
                    <span className="font-mono font-bold text-slate-600 text-[11px]">&lt; 8 hours</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Service inquiries, configuration questions, or routine reporting.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="p-6">
          {tab === 'active' ? (
            /* ACTIVE CASES TABLE */
            <div className="grid w-full gap-3 text-left border-collapse">
              <div className="grid grid-cols-1 sm:grid-cols-12 p-3 font-bold text-xs uppercase tracking-wider text-white bg-[#092E4C] rounded-xl hidden sm:grid mb-1">
                <div className="col-span-2">Case</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-4">Service & Issue</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {filteredActiveCases.map((ac) => (
                <div
                  key={ac.caseNumber}
                  onClick={() => {
                    if (onSelectActiveCase) onSelectActiveCase(ac.caseNumber);
                    onNavigate('case-detail');
                  }}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-3 text-xs text-slate-700 font-medium hover:border-teal-400 hover:bg-white hover:shadow-xs transition cursor-pointer group"
                >
                  {/* Case Number */}
                  <div className="col-span-2 font-bold text-teal-700 font-mono flex items-center gap-1.5 group-hover:text-teal-800">
                    <span>{ac.caseNumber}</span>
                  </div>

                  {/* Priority */}
                  <div className="col-span-2">
                    {getPriorityBadge(ac.priority)}
                  </div>

                  {/* Service & Issue */}
                  <div className="col-span-4">
                    <b className="text-slate-900 block font-bold group-hover:text-teal-900 transition">{ac.service}</b>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{ac.description}</span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <Badge tone={ac.statusTone}>{ac.status}</Badge>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      onClick={() => onOpenVirtualAssistant({
                        caseNumber: ac.caseNumber,
                        serviceName: ac.service,
                        status: ac.status,
                        category: ac.category
                      })}
                      className="flex items-center gap-1.5 text-[11px] py-1 px-2.5 bg-white border-teal-500/40 text-teal-700 hover:bg-teal-50 shrink-0"
                    >
                      <Bot className="h-3.5 w-3.5 text-teal-600" />
                      <span>Ask Assistant</span>
                    </Button>

                    <button
                      onClick={() => {
                        if (onSelectActiveCase) onSelectActiveCase(ac.caseNumber);
                        onNavigate('case-detail');
                      }}
                      className="p-1 text-slate-400 hover:text-teal-700 transition"
                      title="View Details"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredActiveCases.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No active cases matching your filter.
                </div>
              )}
            </div>
          ) : (
            /* CLOSED CASES TABLE (Clean Enterprise Historical Records) */
            <div className="grid w-full gap-3 text-left border-collapse">
              <div className="grid grid-cols-1 sm:grid-cols-12 p-3 font-bold text-xs uppercase tracking-wider text-white bg-[#092E4C] rounded-xl hidden sm:grid mb-1">
                <div className="col-span-2">Case</div>
                <div className="col-span-2">Closed Date</div>
                <div className="col-span-5">Service & Resolution Summary</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {filteredClosedCases.map((cItem) => (
                <div
                  key={cItem.caseNumber}
                  onClick={() => {
                    if (onSelectClosedCase) onSelectClosedCase(cItem.caseNumber);
                    onNavigate('closed-case');
                  }}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-3 text-xs text-slate-700 font-medium hover:border-teal-400 hover:bg-white hover:shadow-xs transition cursor-pointer group"
                >
                  {/* Case Number */}
                  <div className="col-span-2 font-bold text-teal-700 font-mono flex items-center gap-1.5 group-hover:text-teal-800">
                    <span>{cItem.caseNumber}</span>
                  </div>

                  {/* Closed Date */}
                  <div className="col-span-2 text-slate-500 font-mono text-[11px]">
                    {cItem.closedDate}
                  </div>

                  {/* Service & Resolution Summary */}
                  <div className="col-span-5">
                    <b className="text-slate-900 block font-bold group-hover:text-teal-900 transition">{cItem.service}</b>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{cItem.summary}</span>
                  </div>

                  {/* Status: Clean Checkmark without redundant badge text */}
                  <div className="col-span-1 flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Closed</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      onClick={() => onOpenVirtualAssistant({
                        caseNumber: cItem.caseNumber,
                        serviceName: cItem.service,
                        status: 'Closed',
                        category: cItem.category
                      })}
                      className="flex items-center gap-1.5 text-[11px] py-1 px-2.5 bg-white border-teal-500/40 text-teal-700 hover:bg-teal-50 shrink-0"
                    >
                      <Bot className="h-3.5 w-3.5 text-teal-600" />
                      <span>Audit</span>
                    </Button>

                    <button
                      onClick={() => {
                        if (onSelectClosedCase) onSelectClosedCase(cItem.caseNumber);
                        onNavigate('closed-case');
                      }}
                      className="p-1 text-slate-400 hover:text-teal-700 transition"
                      title="View Resolution Record"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredClosedCases.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No closed records matching your query.
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      )}
    </div>
  );
};
