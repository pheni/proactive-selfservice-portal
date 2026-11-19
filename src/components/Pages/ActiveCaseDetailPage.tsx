import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge, Button, Modal } from '../UIPrimitives';
import { PageType, PortalData, TimelineStep, VirtualAssistantContext, ActiveCaseItem } from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  PhoneCall, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Bot,
Zap, 
  CheckCircle2,
Network, 
  Tag, 
  User, 
  Calendar,
  Activity,
  FileText
} from 'lucide-react';

interface CaseActivityItem {
  id: string;
  author: string;
  role: 'Customer' | 'ServiceNow Specialist' | 'System Automation';
  text: string;
  timestamp: string;
  isUrgent?: boolean;
}

interface ActiveCaseDetailPageProps {
  portalData: PortalData;
  timeline: TimelineStep[];
  selectedCaseNum?: string;
  previousPage?: PageType;
  onNavigate?: (page: PageType) => void;
  onOpenImpact?: () => void;
  onOpenConfirm?: () => void;
  onOpenCall?: () => void;
  onOpenVirtualAssistant: (context?: VirtualAssistantContext) => void;
  onCaseClosed?: () => void;
}

export const ActiveCaseDetailPage: React.FC<ActiveCaseDetailPageProps> = ({
  portalData,
  selectedCaseNum,
  previousPage = 'cases',
  onNavigate,
  onOpenImpact,
  onOpenConfirm,
  onOpenCall,
  onOpenVirtualAssistant,
  onCaseClosed
}) => {
  const caseId = selectedCaseNum || portalData.caseNumber;
  const activeCase: ActiveCaseItem | undefined = serviceNowRestService.getActiveCaseByNumber(caseId);

  // Dynamic Case State
  const [currentPriority, setCurrentPriority] = useState<string>(activeCase.priority || 'P2');
  const [currentStatus, setCurrentStatus] = useState<string>(activeCase.status || 'Investigating');
  


  // Escalation State
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalateSuccess, setEscalateSuccess] = useState(false);

  // Case Closure Modal & State
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isClosingCase, setIsClosingCase] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('Service restored and operating normally.');

  const defaultActivities: CaseActivityItem[] = [
    {
      id: 'act-reported',
      author: activeCase.contact || portalData.customer,
      role: 'Customer',
      text: activeCase.description || 'Customer reported service disruption via self-care portal.',
      timestamp: activeCase.openedTime || 'Initial Registration'
    },
    {
      id: 'act-init',
      author: 'Service Assurance Automation',
      role: 'System Automation',
      text: `Support case ${activeCase.caseNumber} initialized. Assigned to ${activeCase.queue || 'Service Assurance Support Queue'}.`,
      timestamp: activeCase.openedTime || 'Case Triaged'
    }
  ];

  // Activity Stream History loaded from persistent store!
  const [activityList, setActivityList] = useState<CaseActivityItem[]>(() => 
    serviceNowRestService.getCaseActivities(activeCase.caseNumber, defaultActivities)
  );
  const [isRefreshingActivities, setIsRefreshingActivities] = useState(false);

  // Sync real-time journal comments & work notes from ServiceNow
  const refreshLiveActivities = async () => {
    if (!activeCase.caseNumber) return;
    setIsRefreshingActivities(true);
    try {
      const live = await serviceNowRestService.fetchCaseActivitiesLive(activeCase.caseNumber, defaultActivities);
      if (live && live.length > 0) {
        setActivityList(live);
      }
    } catch (err) {
      console.warn('Failed to refresh live activities:', err);
    } finally {
      setIsRefreshingActivities(false);
    }
  };

  // Reload activities if case changes, on mount, and listen for live updates from Otto or tabs
  useEffect(() => {
    // 1. Initial cached render
    setActivityList(serviceNowRestService.getCaseActivities(activeCase.caseNumber, defaultActivities));

    // 2. Fetch live journal entries from ServiceNow (e.g. comments added via Otto or backend)
    refreshLiveActivities();

    // 3. Real-time event listener for updates within portal or assistant modal
    const handleActivitiesUpdated = (event?: any) => {
      const targetCaseNum = event?.detail?.caseNumber;
      if (!targetCaseNum || targetCaseNum === activeCase.caseNumber) {
        setActivityList(serviceNowRestService.getCaseActivities(activeCase.caseNumber, defaultActivities));
      }
    };

    window.addEventListener('b2c_case_activities_updated', handleActivitiesUpdated);
    window.addEventListener('storage', handleActivitiesUpdated);

    return () => {
      window.removeEventListener('b2c_case_activities_updated', handleActivitiesUpdated);
      window.removeEventListener('storage', handleActivitiesUpdated);
    };
  }, [activeCase.caseNumber]);



  // Handle 1-Click Priority Escalation directly via REST API
  const handleEscalatePriority = async () => {
    setIsEscalating(true);
    try {
      // Direct REST API call to escalate priority
      await serviceNowRestService.escalateCaseViaRest(activeCase.caseNumber);

      setCurrentPriority('P1');
      activeCase.priority = 'P1';
      activeCase.priorityTone = 'red';

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const escItem: CaseActivityItem = {
        id: Math.random().toString(),
        author: portalData.customer,
        role: 'Customer',
        text: `⚡ Case priority escalated to Priority 1 (Critical Outage). Duty lead engineer alerted via priority incident protocol.`,
        timestamp: `Today, ${nowTime}`,
        isUrgent: true
      };
      serviceNowRestService.addCaseActivity(activeCase.caseNumber, escItem);
      setActivityList(prev => [escItem, ...prev]);
      window.dispatchEvent(new CustomEvent('b2c_case_activities_updated', {
        detail: { caseNumber: activeCase.caseNumber, activity: escItem }
      }));

      setEscalateSuccess(true);
      setTimeout(() => setEscalateSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to escalate case:', err);
    } finally {
      setIsEscalating(false);
    }
  };

  // Handle Customer Service Restoration Confirmation & Case Closure via Scripted REST API
  const handleConfirmAndClose = async () => {
    setIsClosingCase(true);
    try {
      // 1. Direct Scripted REST call to /api/taair/b2b_auth_api/confirm_restoration
      await serviceNowRestService.confirmRestorationViaRest({
        caseNumber: activeCase.caseNumber,
        comments: resolutionNotes,
        confirmedBy: portalData.customer
      });

      // 2. Close active case in service cache and update activity log
      serviceNowRestService.closeActiveCase(
        activeCase.caseNumber,
        resolutionNotes,
        portalData.customer
      );

      setCurrentStatus('Closed');
      activeCase.status = 'Closed';
      activeCase.statusTone = 'green';
      setActivityList(serviceNowRestService.getCaseActivities(activeCase.caseNumber));
      setCloseSuccess(true);
      setIsClosingModalOpen(false);

      if (onCaseClosed) onCaseClosed();
    } catch (err) {
      console.error('Failed to close case:', err);
    } finally {
      setIsClosingCase(false);
    }
  };

  const getPriorityBadgeTone = (p: string) => {
    if (p.includes('1')) return 'red';
    if (p.includes('2')) return 'amber';
    if (p.includes('3')) return 'blue';
    return 'slate';
  };

  const slaResponseTarget = currentPriority.includes('1') 
    ? '15 Minutes (Critical)' 
    : currentPriority.includes('2') 
    ? '30 Minutes (High)' 
    : '2 Hours (Standard)';

  const getBackNav = (prev?: string) => {
    switch (prev) {
      case 'dashboard':
        return { target: 'dashboard' as PageType, label: 'Back to Overview' };
      case 'services':
        return { target: 'services' as PageType, label: 'Back to My Services' };
      case 'service-detail':
        return { target: 'service-detail' as PageType, label: 'Back to Service Details' };
      case 'notifications':
        return { target: 'notifications' as PageType, label: 'Back to Notifications' };
      case 'history':
        return { target: 'history' as PageType, label: 'Back to Case History' };
      case 'cases':
      default:
        return { target: 'cases' as PageType, label: 'Back to Active Cases' };
    }
  };

  const backNav = getBackNav(previousPage);

  return (
    <div className="space-y-6">
      
      {/* 1. Back Navigation & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate(backNav.target)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-700 transition group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{backNav.label}</span>
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenVirtualAssistant({
              caseNumber: activeCase.caseNumber,
              serviceName: activeCase.service,
              status: currentStatus,
              category: activeCase.category
            })}
            className="text-xs py-2 px-3 flex items-center gap-1.5 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 shadow-xs"
          >
            <Bot className="h-3.5 w-3.5 text-teal-600" />
            <span>Ask Digital Assistant</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={onOpenCall} 
            className="text-xs py-2 px-3 flex items-center gap-1.5 shadow-xs"
          >
            <PhoneCall className="h-3.5 w-3.5 text-teal-600" />
            <span>Call Specialist</span>
          </Button>

          {currentPriority !== 'P1' && (
            <Button
              variant="outline"
              disabled={isEscalating}
              onClick={handleEscalatePriority}
              className="text-xs py-2 px-3 flex items-center gap-1.5 border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-900 shadow-xs font-bold"
            >
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              <span>{isEscalating ? 'Escalating...' : 'Escalate to P1'}</span>
            </Button>
          )}

          {currentStatus === 'Closed' ? (
            <Badge tone="green">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600 inline" />
              <span>Resolved & Closed</span>
            </Badge>
          ) : (
            <Button 
              variant="teal" 
              onClick={() => setIsClosingModalOpen(true)} 
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Confirm Resolution</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Header with Badges */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
            {activeCase.caseNumber}
          </span>
          <Badge tone={getPriorityBadgeTone(currentPriority) as any}>
            Priority {currentPriority}
          </Badge>
          <Badge tone={(activeCase.statusTone || 'blue') as any}>
            {currentStatus}
          </Badge>
          <span className="text-xs text-slate-500 font-medium">
            Category: <strong className="text-slate-800">{activeCase.category || 'Network Assurance'}</strong>
          </span>
        </div>

        <h1 className="text-2xl font-black text-[#092E4C] leading-snug">
          {activeCase.description || 'Service Assurance Case'}
        </h1>

        <p className="text-xs text-slate-500 flex items-center gap-2">
          <span>Service: <strong className="text-slate-800">{activeCase.service}</strong></span>
          <span>•</span>
          <span>Asset ID: <strong className="font-mono text-slate-800">{activeCase.serviceId}</strong></span>
          <span>•</span>
          <span>Opened: <strong className="text-slate-800">{activeCase.openedTime}</strong></span>
        </p>

        {escalateSuccess && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 animate-in fade-in">
            <Zap className="h-4 w-4 text-amber-600 shrink-0" />
            <span><strong>Case Escalated:</strong> Priority escalated to P1 Critical Response. Duty lead engineer paged.</span>
          </div>
        )}

        {closeSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span><strong>Case {activeCase.caseNumber} Closed:</strong> Service restoration confirmed. Case successfully moved to Closed Cases archive.</span>
            </div>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('history')}
                className="font-bold underline text-emerald-700 hover:text-emerald-900 text-xs shrink-0 cursor-pointer"
              >
                View Closed Cases →
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Milestone Progress Lifecycle */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-5">Case Resolution Lifecycle</h3>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[650px] items-start justify-between relative">
            {[
              { 
                label: "Case Registered", 
                time: activeCase.openedTime || "Logged", 
                done: true, 
                current: false 
              },
              { 
                label: "Investigation & Triage", 
                time: currentStatus === 'Investigating' ? "In Progress" : (currentStatus === 'Recovery' || currentStatus === 'Monitoring' || currentStatus === 'Closed' ? "Completed" : "Pending"), 
                done: currentStatus === 'Recovery' || currentStatus === 'Monitoring' || currentStatus === 'Closed', 
                current: currentStatus === 'Investigating' 
              },
              { 
                label: "Remediation & Recovery", 
                time: currentStatus === 'Recovery' ? "In Progress" : (currentStatus === 'Monitoring' || currentStatus === 'Closed' ? "Completed" : "Pending Action"), 
                done: currentStatus === 'Monitoring' || currentStatus === 'Closed', 
                current: currentStatus === 'Recovery' 
              },
              { 
                label: "Stability Monitoring", 
                time: currentStatus === 'Monitoring' ? "In Progress" : (currentStatus === 'Closed' ? "Completed" : "Pending"), 
                done: currentStatus === 'Closed', 
                current: currentStatus === 'Monitoring' 
              },
              { 
                label: "Resolved & Closed", 
                time: currentStatus === 'Closed' ? "Resolved" : "Pending", 
                done: currentStatus === 'Closed', 
                current: false 
              }
            ].map((item, index, arr) => {
              const isComplete = item.done && !item.current;
              const isCurrent = item.current;

              return (
                <div key={item.label} className="relative flex-1 text-center">
                  {/* Connecting Line to next milestone node */}
                  {index < arr.length - 1 && (
                    <div 
                      className={`absolute top-[18px] -translate-y-1/2 left-1/2 w-full h-[5px] z-0 transition-colors ${
                        isComplete ? 'bg-teal-600' : 'bg-slate-200'
                      }`} 
                    />
                  )}

                  {/* Milestone Node */}
                  <div className={`relative z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                    isCurrent
                      ? 'border-2 border-teal-500 bg-teal-50 text-teal-700 ring-4 ring-teal-100 font-bold shadow-xs'
                      : isComplete
                      ? 'bg-teal-600 text-white font-bold shadow-xs'
                      : 'border-2 border-slate-300 bg-white text-slate-400 font-bold'
                  }`}>
                    {isComplete ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4 text-teal-600 animate-pulse" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>

                  <b className={`mt-2.5 block text-xs font-bold ${isCurrent || isComplete ? 'text-slate-900' : 'text-slate-600'}`}>
                    {item.label}
                  </b>
                  <span className={`text-[11px] block mt-0.5 ${isCurrent ? 'text-teal-700 font-semibold' : 'text-slate-500'}`}>
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 4. Main Two-Column Layout: Details & Activity Stream vs Service & SLA */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        
        {/* Left Column: Post Update & Activity Stream */}
        <div className="space-y-6">

          {/* Activity Stream & Case History */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-600" />
                <span>Conversation & Case History</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">{activityList.length} updates</span>
                <button
                  type="button"
                  onClick={() => refreshLiveActivities()}
                  disabled={isRefreshingActivities}
                  title="Refresh comments and activities from ServiceNow"
                  className="p-1 rounded-md text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingActivities ? 'animate-spin text-teal-600' : ''}`} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {activityList.map((act) => (
                <div 
                  key={act.id} 
                  className={`p-4 rounded-xl border transition ${
                    act.isUrgent 
                      ? 'bg-amber-50/70 border-amber-200' 
                      : act.role === 'Customer' 
                      ? 'bg-teal-50/40 border-teal-200/60' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className={`h-2 w-2 rounded-full ${
                        act.role === 'Customer' ? 'bg-teal-500' : 'bg-cyan-500'
                      }`} />
                      <span>{act.author}</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                        {act.role}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">{act.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pl-4 whitespace-pre-wrap">
                    {act.text}
                  </p>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* Right Column: Key Details, SLA, & Support Actions */}
        <div className="space-y-6">

          {/* Case Metadata Box */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Case Record Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Assigned Team</span>
                <span className="font-bold text-slate-800">{activeCase.queue || 'Service Assurance Support'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Assigned Specialist</span>
                <span className="font-bold text-slate-800">{activeCase.assignedTo || 'Duty Lead Engineer'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Incident Reference</span>
                <span className="font-mono font-bold text-teal-700">{activeCase.incidentRef || 'None (Direct Case)'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Service Circuit</span>
                <span className="font-mono font-bold text-slate-800">{activeCase.serviceId}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Contact Person</span>
                <span className="font-bold text-slate-800">{activeCase.contact || portalData.customer}</span>
              </div>
            </div>
          </Card>

          {/* SLA Commitment Card */}
          <Card className="p-6 border-slate-200 space-y-3 bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">SLA Assurance Target</h3>
              <Clock className="h-4 w-4 text-teal-600" />
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
              <div className="text-[11px] text-teal-800 uppercase tracking-wider font-bold">Response Guarantee</div>
              <div className="text-lg font-black text-teal-950">{slaResponseTarget}</div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Target response time is indexed to case priority. Escalating priority automatically pages duty specialists.
            </p>
          </Card>

          {/* Confirm Restoration / Closure Card */}
          {currentStatus === 'Closed' ? (
            <Card className="border-emerald-200 bg-emerald-50/60 p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Case Resolved & Closed</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Service restoration has been verified and confirmed. All case records and telemetry milestones have been archived.
              </p>
              {onNavigate && (
                <Button 
                  variant="outline" 
                  className="w-full text-xs shadow-xs border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 font-bold"
                  onClick={() => onNavigate('history')}
                >
                  View in Closed Cases History
                </Button>
              )}
            </Card>
          ) : (
            <Card className="border-teal-200 bg-teal-50/50 p-6 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Confirm Service Restoration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If your service has been fully restored and performance is normal, you can confirm resolution to close the case.
              </p>
              <Button 
                variant="teal" 
                className="w-full text-xs shadow-xs" 
                onClick={() => setIsClosingModalOpen(true)}
              >
                Confirm & Close Case
              </Button>
            </Card>
          )}

        </div>

      </div>

      {/* Confirm Service Restoration & Case Closure Modal */}
      <Modal
        open={isClosingModalOpen}
        title="Confirm Service Restoration"
        onClose={() => setIsClosingModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-teal-950 font-mono">{activeCase.caseNumber}</span>
              <span className="text-teal-700 font-medium">{activeCase.service}</span>
            </div>
            <p className="text-xs text-teal-900 pt-1">
              Please confirm that your service performance is restored and operating normally. This will officially close and archive the case.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Resolution Feedback / Note (Optional)
            </label>
            <textarea
              rows={2}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Verified throughput and latency are normal, all tests passed."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              disabled={isClosingCase}
              onClick={() => setIsClosingModalOpen(false)}
              className="text-xs py-2 px-4"
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              disabled={isClosingCase}
              onClick={handleConfirmAndClose}
              className="text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isClosingCase ? 'Closing Case...' : 'Confirm & Close Case'}</span>
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ActiveCaseDetailPage;
