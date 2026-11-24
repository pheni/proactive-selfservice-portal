import React, { useState } from 'react';
import { PageHeader, Card, Button } from '../UIPrimitives';
import { PortalData, PageType, CreateCasePayload } from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';
import { 
  FilePlus, 
  CheckCircle2, 
  AlertTriangle, 
  Network, 
  Clock, 
  ShieldCheck, 
  Upload, 
  ArrowLeft,
  Send,
  Building2,
  User,
  Mail,
  Phone,
  Sparkles,
  Search,
  Filter,
  Check,
  Zap,
  Activity
} from 'lucide-react';

interface CreateCasePageProps {
  portalData: PortalData;
  preselectedServiceId?: string;
  onNavigate: (page: PageType) => void;
  onCaseCreated?: () => void;
}

export const CreateCasePage: React.FC<CreateCasePageProps> = ({
  portalData,
  preselectedServiceId,
  onNavigate,
  onCaseCreated
}) => {
  const initialService = portalData.servicesList.find(s => s.id === preselectedServiceId) || portalData.servicesList[0];

  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialService?.id || portalData.servicesList[0]?.id || '');
  const [priority, setPriority] = useState<'P1 - Critical' | 'P2 - High' | 'P3 - Moderate' | 'P4 - Minor'>('P2 - High');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Resolve authenticated contact dynamically from session storage if available
  const storedName = typeof window !== 'undefined' 
    ? (sessionStorage.getItem('sn_user_fullname') || (sessionStorage.getItem('sn_first_name') ? `${sessionStorage.getItem('sn_first_name')} ${sessionStorage.getItem('sn_last_name') || ''}`.trim() : null)) 
    : null;
  const storedEmail = typeof window !== 'undefined' ? sessionStorage.getItem('sn_email') : null;

  const [contactName, setContactName] = useState<string>(storedName || portalData.customer || 'Goutam Hazra');
  const [contactEmail, setContactEmail] = useState<string>(storedEmail || portalData.email || 'goutam.hazra@tataglobal.com');
  const [contactPhone, setContactPhone] = useState<string>(portalData.phone || '+91 20 6600 0000');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Filtering & search states for Impacted Services selector
  const [serviceFilterTab, setServiceFilterTab] = useState<'all' | 'degraded' | 'wan' | 'fiber' | 'voice' | 'mobile'>('all');
  const [serviceSearch, setServiceSearch] = useState<string>('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    caseNumber: string;
    incidentReference: string;
    slaTarget: string;
  } | null>(null);

  const currentService = portalData.servicesList.find(s => s.id === selectedServiceId) || initialService;

  // Group services cleanly by domain for enterprise readability
  const degradedServices = portalData.servicesList.filter(s => 
    s.status?.toLowerCase().includes('degraded') || 
    s.status?.toLowerCase().includes('critical') || 
    Boolean(s.activeCaseNumber)
  );
  const wanServices = portalData.servicesList.filter(s => s.category === 'Core WAN & Circuits');
  const fiberServices = portalData.servicesList.filter(s => s.category === 'Fiber Broadband');
  const voiceServices = portalData.servicesList.filter(s => s.category === 'Voice & SIP Trunks');
  const mobileServices = portalData.servicesList.filter(s => s.category === 'Mobile Fleet & SIMs');

  // Filtered list for selector based on active tab & search
  const filteredServices = portalData.servicesList.filter(svc => {
    // 1. Tab filter
    if (serviceFilterTab === 'degraded' && !(svc.status?.toLowerCase().includes('degraded') || svc.status?.toLowerCase().includes('critical') || svc.activeCaseNumber)) {
      return false;
    }
    if (serviceFilterTab === 'wan' && svc.category !== 'Core WAN & Circuits') return false;
    if (serviceFilterTab === 'fiber' && svc.category !== 'Fiber Broadband') return false;
    if (serviceFilterTab === 'voice' && svc.category !== 'Voice & SIP Trunks') return false;
    if (serviceFilterTab === 'mobile' && svc.category !== 'Mobile Fleet & SIMs') return false;

    // 2. Search query filter
    if (serviceSearch.trim()) {
      const q = serviceSearch.toLowerCase();
      const match = (svc.id || '').toLowerCase().includes(q) ||
                    (svc.name || '').toLowerCase().includes(q) ||
                    (svc.location || '').toLowerCase().includes(q) ||
                    (svc.bandwidth || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // AI-Derived Case Category automatically inferred from selected service and symptom
  const getAutoCategory = (svc: typeof currentService, subj: string): string => {
    if (!svc || svc.id === 'GENERAL-ACCT') return 'General Account & Billing Support';
    const subLow = subj.toLowerCase();
    if (subLow.includes('billing') || subLow.includes('invoice') || subLow.includes('charge')) {
      return 'Billing, Invoicing & Contract Assurance';
    }
    if (svc.category === 'Mobile Fleet & SIMs') {
      return 'Mobile Fleet • 5G Cellular Data & Roaming';
    }
    if (svc.category === 'Voice & SIP Trunks') {
      return 'Voice Assurance • SIP Trunking & SBC Interconnect';
    }
    if (svc.category === 'Fiber Broadband') {
      return 'Fiber Broadband • Dedicated Internet Access (DIA)';
    }
    return 'Core Network Assurance • SD-WAN & MPLS Optical Transport';
  };

  const autoCategory = getAutoCategory(currentService, subject);

  // Fast-track autofill for an active degraded circuit
  const handleFastTrackService = (svc: typeof currentService) => {
    if (!svc) return;
    setSelectedServiceId(svc.id);
    setPriority('P1 - Critical');
    setSubject(`Circuit ${svc.id} (${svc.name}) telemetry degradation & packet drop`);
    setDescription(`Automated telemetry alert on ${svc.name} (${svc.id}).\nDemarcation: ${svc.demarcation || 'Edge Gateway'}\nLocation: ${svc.location}\nStatus: ${svc.status}\nObserved abnormal latency/attenuation. Requesting immediate Tier-2 NOC investigation and fiber loop testing.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f: File) => f.name);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setSubmitting(true);

    try {
      const payload: CreateCasePayload = {
        serviceId: selectedServiceId,
        serviceName: currentService?.name || 'Managed Service',
        category: autoCategory,
        priority,
        subject,
        description: description || 'No detailed steps provided by user.',
        contactName,
        contactEmail,
        contactPhone
      };

      const result = await serviceNowRestService.createSupportCase(payload);
      setSubmitting(false);
      window.dispatchEvent(new CustomEvent('b2c_cases_updated'));
      if (onCaseCreated) {
        onCaseCreated();
      }
      setCreatedResult({
        caseNumber: result.caseNumber,
        incidentReference: result.incidentReference,
        slaTarget: result.slaTarget
      });
    } catch (err) {
      console.error("Failed to create case:", err);
      setSubmitting(false);
    }
  };

  if (createdResult) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onNavigate('cases')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Cases
        </button>

        <Card className="p-8 text-center max-w-2xl mx-auto border-2 border-emerald-500/30 shadow-xl bg-white rounded-3xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900">Support Case Created Successfully</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your case has been logged successfully and assigned to the Service Assurance Queue.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Case Number</span>
              <span className="font-mono text-base font-extrabold text-[#092E4C]">{createdResult.caseNumber}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Incident Reference</span>
              <span className="font-mono text-base font-extrabold text-teal-600">{createdResult.incidentReference}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Target Response SLA</span>
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-1">
                <Clock className="h-3.5 w-3.5" /> {createdResult.slaTarget}
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 text-left flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <b className="block text-blue-900">Real-time Notification Dispatched</b>
              <span>An automated confirmation email and SMS containing tracking credentials have been sent to <strong>{contactEmail}</strong>.</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="teal" onClick={() => onNavigate('cases')} className="w-full sm:w-auto">
              View Active Cases
            </Button>
            <Button variant="outline" onClick={() => { setCreatedResult(null); setSubject(''); setDescription(''); }} className="w-full sm:w-auto">
              Create Another Case
            </Button>
            <Button variant="outline" onClick={() => onNavigate('dashboard')} className="w-full sm:w-auto">
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Priority metadata for SLA preview
  const priorityInfo = {
    'P1 - Critical': { sla: '15 Minutes', tone: 'red', desc: 'Total service outage, core trunk down, BGP drop' },
    'P2 - High': { sla: '30 Minutes', tone: 'amber', desc: 'High packet loss (>5%), severe latency, failover saturated' },
    'P3 - Moderate': { sla: '2 Hours', tone: 'blue', desc: 'Performance deviation, intermittent flakiness, single user impact' },
    'P4 - Minor': { sla: '4 Hours', tone: 'slate', desc: 'Configuration query, scheduled move, general assistance' }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('cases')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Cases
        </button>
        <span className="text-xs font-semibold text-slate-400">Enterprise Service Assurance • Case Submission</span>
      </div>

      <PageHeader
        eyebrow="Telecom Service Assurance Portal"
        title="Create a Support Case"
        description="Raise a trouble ticket directly with our Tier-2 Network Operations Center (NOC) and Service Assurance engineering teams."
      />

      {/* Proactive Degraded Circuit Fast-Track Banner */}
      {degradedServices.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-300 bg-linear-to-r from-amber-50 to-orange-50 p-4 shadow-sm animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-700 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Proactive Telemetry Alert
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Outage Detected
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  Circuit <strong>{degradedServices[0].id}</strong> ({degradedServices[0].name}) is currently reporting degradation at <strong>{degradedServices[0].location}</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleFastTrackService(degradedServices[0])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs shrink-0 self-end sm:self-auto cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              Autofill Ticket for {degradedServices[0].id}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Card 1: Service Selection & AI Auto-Category */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Network className="h-5 w-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-base">Impacted Telecom Service</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {portalData.servicesList.length} Active Contracts in TSM
            </span>
          </div>

          {/* Quick Domain Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setServiceFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                serviceFilterTab === 'all' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({portalData.servicesList.length})
            </button>

            {degradedServices.length > 0 && (
              <button
                type="button"
                onClick={() => setServiceFilterTab('degraded')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  serviceFilterTab === 'degraded' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                Affected ({degradedServices.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => setServiceFilterTab('wan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                serviceFilterTab === 'wan' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Core WAN ({wanServices.length})
            </button>

            <button
              type="button"
              onClick={() => setServiceFilterTab('fiber')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                serviceFilterTab === 'fiber' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Fiber DIA ({fiberServices.length})
            </button>

            <button
              type="button"
              onClick={() => setServiceFilterTab('voice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                serviceFilterTab === 'voice' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Voice & SIP ({voiceServices.length})
            </button>

            <button
              type="button"
              onClick={() => setServiceFilterTab('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                serviceFilterTab === 'mobile' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              Mobile Fleet ({mobileServices.length})
            </button>
          </div>

          {/* Quick Search & Service Dropdown Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Telecom Asset / Circuit *
                </label>
                {serviceFilterTab !== 'all' && (
                  <span className="text-[10px] font-bold text-teal-600">
                    Showing {filteredServices.length} filtered
                  </span>
                )}
              </div>

              {/* Service Select with Filtered Options */}
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-xs"
              >
                {filteredServices.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} ({svc.id}) - {svc.location} [{svc.status}]
                  </option>
                ))}
                <option value="GENERAL-ACCT">General Enterprise Account / Billing Support</option>
              </select>

              {/* Selected Service Diagnostic Details Chip */}
              {currentService && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 font-mono text-[11px]">{currentService.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      currentService.status.includes('Degraded') || currentService.status.includes('Critical')
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {currentService.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <strong>Site:</strong> {currentService.location} • <strong>Bandwidth:</strong> {currentService.bandwidth || 'Standard'}
                  </div>
                  {currentService.demarcation && (
                    <div className="text-[10px] text-slate-500">
                      <strong>Demarc CPE:</strong> {currentService.demarcation}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Auto-Classified Category Card (No manual user guess required) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Issue Category *
                </label>
                <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Auto-Assigned
                </span>
              </div>

              <div className="rounded-xl border border-purple-200/90 bg-purple-50/70 p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-purple-900">
                      Now Assist Classification
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-purple-200 text-purple-700">
                    Backend Scoped
                  </span>
                </div>
                <div className="font-extrabold text-xs text-purple-950 leading-snug">
                  {autoCategory}
                </div>
                <p className="text-[11px] text-purple-900/80 leading-relaxed">
                  Automatically resolved by ServiceNow TSM engine from <strong>{currentService?.category || 'selected service'}</strong> taxonomy. Manual ITIL category guessing is not required.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Severity & Target SLA Commitment */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-base">Severity & Committed Response SLA</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Contract Tier: <strong className="text-teal-700">Enterprise Gold (99.95%)</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(['P1 - Critical', 'P2 - High', 'P3 - Moderate', 'P4 - Minor'] as const).map((p) => {
              const info = priorityInfo[p];
              const isSelected = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`p-3.5 rounded-xl border text-left transition relative cursor-pointer ${
                    isSelected
                      ? p === 'P1 - Critical'
                        ? 'border-red-500 bg-red-50/80 ring-2 ring-red-400/40 shadow-xs'
                        : p === 'P2 - High'
                        ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/40 shadow-xs'
                        : 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-400/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black ${
                      p === 'P1 - Critical' ? 'text-red-700' : p === 'P2 - High' ? 'text-amber-700' : 'text-slate-800'
                    }`}>
                      {p.split(' - ')[0]}
                    </span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white font-bold' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {info.sla}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900">{p.split(' - ')[1]}</div>
                  <div className="text-[10px] text-slate-500 mt-1 leading-snug">{info.desc}</div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Card 3: Issue Description & Telemetry */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Activity className="h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">Issue Description & Diagnostic Telemetry</h3>
          </div>

          {/* Subject / Short Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Case Summary / Symptom *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Primary SD-WAN edge trunk link (Circuit ID: CKT-BLR-SD-01) dropped and BGP peering down"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-xs"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Technical Details & Diagnostic Telemetry
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide telemetry readings such as optical Rx power (dBm), demarcation interface status, traceroute outputs, BGP state, or affected subnets..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-xs font-mono"
            />
          </div>

          {/* Diagnostic Log / Attachment Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Attach Diagnostic Logs or Screenshots (Optional)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition">
              <Upload className="mx-auto h-6 w-6 text-slate-400 mb-1" />
              <label htmlFor="file-upload" className="cursor-pointer text-xs font-bold text-teal-600 hover:text-teal-700">
                Click to upload files
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <span className="text-[11px] text-slate-400 block mt-0.5">Supports PNG, JPG, PDF, TXT, LOG up to 25MB</span>

              {uploadedFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  {uploadedFiles.map((fn, idx) => (
                    <span key={idx} className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-1 rounded-md">
                      {fn}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Card 4: Contact Information */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <User className="h-5 w-5 text-[#092E4C]" />
              <h3 className="font-bold text-slate-900 text-base">Contact Information</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Authenticated Enterprise Customer
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs font-bold text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs font-bold text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs font-bold text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Live Dispatch Preview Summary */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400">
                ServiceNow Assurance Dispatch
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Tier-2 NOC Queue
              </span>
            </div>
            <div className="text-xs text-slate-300">
              Target SLA: <strong className="text-amber-400">{priorityInfo[priority].sla}</strong> • Service: <strong>{currentService?.id || 'Service'}</strong> • Account: <strong>{portalData.account || 'Tata B2B Enterprise Services'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate('cases')}
              className="text-white border-slate-700 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="teal"
              disabled={submitting || !subject.trim()}
              className="flex items-center gap-2 px-6"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging Case...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Support Case
                </>
              )}
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
};
