import React, { useState } from 'react';
import { PageType, PortalData, VirtualAssistantContext, NotificationItem, initialNotifications } from './types/portalTypes';
import { serviceNowRestService } from './services/servicenowApi';
import { serviceNowAuthService } from './services/servicenowAuth';
import { SERVICENOW_CONFIG } from './config/servicenow.config';

// Layout & Global Components
import { NavigationSidebar } from './components/NavigationSidebar';
import { TopHeaderBar } from './components/TopHeaderBar';
import { ServiceNowRestInspector } from './components/ServiceNowRestInspector';
import { AuthenticationModal } from './components/Modals/AuthenticationModal';
import { BusinessImpactModal } from './components/Modals/BusinessImpactModal';
import { RestorationConfirmModal } from './components/Modals/RestorationConfirmModal';
import { WebRTCCallModal } from './components/Modals/WebRTCCallModal';
import { OttoAssistantModal } from './components/Modals/OttoAssistantModal';

// Pages
import { OverviewDashboard } from './components/Pages/OverviewDashboard';
import { AccountsPage } from './components/Pages/AccountsPage';
import { BillingPage } from './components/Pages/BillingPage';
import { OrdersPage } from './components/Pages/OrdersPage';
import { MyServicesPage } from './components/Pages/MyServicesPage';
import { ServiceDetailPage } from './components/Pages/ServiceDetailPage';
import { ActiveCasesPage } from './components/Pages/ActiveCasesPage';
import { ActiveCaseDetailPage } from './components/Pages/ActiveCaseDetailPage';
import { CreateCasePage } from './components/Pages/CreateCasePage';
import { NotificationsPage } from './components/Pages/NotificationsPage';
import { SupportPage } from './components/Pages/SupportPage';
import { CaseHistoryPage } from './components/Pages/CaseHistoryPage';
import { ClosedCaseDetailPage } from './components/Pages/ClosedCaseDetailPage';
import { ProfilePreferencesPage } from './components/Pages/ProfilePreferencesPage';
import { SecurityPage } from './components/Pages/SecurityPage';
import ServiceNowVirtualAgent from './components/ServiceNowVirtualAgent';
import ServiceNowEngagementMessenger from './components/ServiceNowEngagementMessenger';
import ServiceNowEnhancedChat from './components/ServiceNowEnhancedChat';
import { ServiceNowAutonomousNLQChat } from './components/ServiceNowAutonomousNLQChat';


export function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    return serviceNowAuthService.isAuthenticated();
  });

  const [nlqChatOpen, setNlqChatOpen] = useState(false);
  const [page, setPage] = useState<PageType>('dashboard');
  const [previousPage, setPreviousPage] = useState<PageType | undefined>(undefined);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [impactOpen, setImpactOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [vaOpen, setVaOpen] = useState(false);
  const [vaContext, setVaContext] = useState<VirtualAssistantContext | undefined>(undefined);
  const [restInspectorOpen, setRestInspectorOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>(undefined);
  
  // Selection state for detail pages
  const [selectedActiveCaseNum, setSelectedActiveCaseNum] = useState<string>(() => serviceNowRestService.getActiveCases()[0]?.caseNumber || '');
  const [selectedClosedCaseNum, setSelectedClosedCaseNum] = useState<string>(() => serviceNowRestService.getClosedCases()[0]?.caseNumber || '');

  const [portalData, setPortalData] = useState<PortalData>(() => serviceNowRestService.getPortalData());
  const [timeline, setTimeline] = useState(() => serviceNowRestService.getTimeline());
  const [updates, setUpdates] = useState(() => serviceNowRestService.getApprovedUpdates());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [openCasesCount, setOpenCasesCount] = useState<number>(() => serviceNowRestService.getActiveCases().length);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [accountTier, setAccountTier] = useState<string>('Tier-1 Platinum SLA');
  const [ordersStage, setOrdersStage] = useState<string>('In Provisioning');
  const [outages, setOutages] = useState<any[]>([]);
  const [slaData, setSlaData] = useState<any | null>(null);

  const handleSyncBackend = async () => {
    setIsSyncing(true);
    try {
      const [freshActive, freshClosed, freshServices, accountData, freshOrders, freshOutages, freshSla]: any = await Promise.all([
        serviceNowRestService.fetchActiveCases(10, true),
        serviceNowRestService.fetchClosedCases(10, true),
        serviceNowRestService.fetchServices(),
        serviceNowRestService.fetchAccountDetails(),
        serviceNowRestService.fetchOrders(),
        serviceNowRestService.fetchOutages(),
        serviceNowRestService.fetchSla()
      ]);
      setOutages(freshOutages || []);
      setSlaData(freshSla || null);
      const refreshedPortalData = serviceNowRestService.getPortalData();
      if (accountData?.accountName) {
        refreshedPortalData.account = accountData.accountName;
      }
      refreshedPortalData.servicesList = freshServices || [];
      if (accountData?.accountName === 'No Account Associated' || !accountData?.accountId) {
        refreshedPortalData.invoices = [];
        refreshedPortalData.contracts = [];
        refreshedPortalData.mobileSubscriptions = [];
        refreshedPortalData.fiberBroadband = [];
        refreshedPortalData.voiceTrunks = [];
        refreshedPortalData.service = '';
        refreshedPortalData.serviceId = '';
        refreshedPortalData.caseNumber = '';
        refreshedPortalData.incidentReference = '';
        setUpdates([]);
        setOutages([]);
      }
      setPortalData(refreshedPortalData);
      setOpenCasesCount(freshActive.length);
      setOrdersCount(freshOrders?.length || 0);
      if (accountData?.contractTier) {
        setAccountTier(accountData.contractTier.includes('SLA') ? accountData.contractTier : `${accountData.contractTier} SLA`);
      }
      if (freshOrders && freshOrders.length > 0) {
        const topStage = freshOrders[0].currentMilestone || freshOrders[0].status || 'In Provisioning';
        setOrdersStage(topStage.startsWith('In ') ? topStage : `In ${topStage}`);
      } else {
        setOrdersStage('None');
      }
      setUpdates(serviceNowRestService.getApprovedUpdates());
      if (freshActive.length > 0 && (!selectedActiveCaseNum || !freshActive.some(c => c.caseNumber === selectedActiveCaseNum))) {
        setSelectedActiveCaseNum(freshActive[0].caseNumber);
      }
    } catch (err) {
      console.warn('Backend sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  React.useEffect(() => {
    if (authenticated) {
      handleSyncBackend();
    }
  }, [authenticated]);

  React.useEffect(() => {
    const handleCasesUpdatedGlobal = () => {
      const active = serviceNowRestService.getActiveCases();
      setOpenCasesCount(active.length);
      setPortalData(serviceNowRestService.getPortalData());
      if (authenticated) {
        handleSyncBackend();
      }
    };

    window.addEventListener('b2c_cases_updated', handleCasesUpdatedGlobal);
    return () => {
      window.removeEventListener('b2c_cases_updated', handleCasesUpdatedGlobal);
    };
  }, [authenticated]);

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleToggleNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  if (!authenticated) {
    return (
      <AuthenticationModal 
        onComplete={() => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('sn_portal_authenticated', 'true');
            localStorage.setItem('sn_portal_authenticated', 'true');
          }
          setAuthenticated(true);
          const freshData = serviceNowRestService.getPortalData();
          setPortalData(freshData);
          handleSyncBackend();
        }} 
      />
    );
  }

  const handleLogout = () => {
    serviceNowAuthService.logout();
    setAuthenticated(false);
    setPage('dashboard');
    const resetData = serviceNowRestService.getPortalData();
    setPortalData(resetData);
  };

  const go = (target: PageType, param?: string) => {
    if (target === 'create-case') {
      setPreselectedServiceId(param);
    }
    // Track originating page for dynamic back buttons
    if (page !== target && page !== 'case-detail' && page !== 'closed-case') {
      setPreviousPage(page);
    }
    setPage(target);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openVirtualAssistant = (ctx?: VirtualAssistantContext) => {
    setVaContext(ctx || {
      caseNumber: portalData.caseNumber,
      serviceName: portalData.service,
      status: 'Monitoring'
    });
    setVaOpen(true);
  };

  const restConfig = serviceNowRestService.getRestConfig();

  let content = (
    <OverviewDashboard
      portalData={portalData}
      updates={updates}
      onNavigate={go}
      onOpenVirtualAssistant={openVirtualAssistant}
      onOpenNlqChat={() => setNlqChatOpen(true)}
      onSelectActiveCase={(caseNum) => setSelectedActiveCaseNum(caseNum)}
      onSyncCases={handleSyncBackend}
      isSyncing={isSyncing}
      notificationsCount={notifications.length}
      unreadNotificationsCount={unreadNotificationCount}
      openCasesCount={openCasesCount}
      ordersCount={ordersCount}
      accountTier={accountTier}
      ordersStage={ordersStage}
      outages={outages}
      slaData={slaData}
    />
  );

  if (page === 'account') {
    content = <AccountsPage onNavigate={go} onOpenCall={() => setCallOpen(true)} />;
  }
  if (page === 'orders') {
    content = <OrdersPage onNavigate={go} />;
  }
  if (page === 'services') {
    content = (
      <MyServicesPage
        portalData={portalData}
        onNavigate={go}
        onOpenVirtualAssistant={openVirtualAssistant}
        onSelectActiveCase={(caseNum) => setSelectedActiveCaseNum(caseNum)}
        onSyncCases={handleSyncBackend}
        isSyncing={isSyncing}
      />
    );
  }
  if (page === 'service-detail') content = <ServiceDetailPage portalData={portalData} onNavigate={go} />;
  if (page === 'cases') {
    content = (
      <ActiveCasesPage
        portalData={portalData}
        onNavigate={go}
        onOpenVirtualAssistant={openVirtualAssistant}
        onSelectActiveCase={(caseNum) => setSelectedActiveCaseNum(caseNum)}
        onSelectClosedCase={(caseNum) => setSelectedClosedCaseNum(caseNum)}
        initialTab="active"
        onOpenCall={() => setCallOpen(true)}
        onCasesUpdated={(activeCount) => {
          setOpenCasesCount(activeCount);
          setPortalData(serviceNowRestService.getPortalData());
        }}
      />
    );
  }
  if (page === 'create-case') {
    content = (
      <CreateCasePage
        portalData={portalData}
        preselectedServiceId={preselectedServiceId}
        onNavigate={go}
        onCaseCreated={() => {
          const freshCases = serviceNowRestService.getActiveCases();
          setOpenCasesCount(freshCases.length);
          setPortalData(serviceNowRestService.getPortalData());
          if (freshCases.length > 0) {
            setSelectedActiveCaseNum(freshCases[0].caseNumber);
          }
        }}
      />
    );
  }
  if (page === 'case-detail') {
    content = (
      <ActiveCaseDetailPage
        portalData={portalData}
        timeline={timeline}
        selectedCaseNum={selectedActiveCaseNum}
        previousPage={previousPage}
        onNavigate={go}
        onOpenImpact={() => setImpactOpen(true)}
        onOpenConfirm={() => setConfirmOpen(true)}
        onOpenCall={() => setCallOpen(true)}
        onOpenVirtualAssistant={openVirtualAssistant}
        onCaseClosed={() => {
          setOpenCasesCount(serviceNowRestService.getActiveCases().length);
          setTimeline(serviceNowRestService.getTimeline());
          setUpdates(serviceNowRestService.getApprovedUpdates());
          setPortalData(serviceNowRestService.getPortalData());
        }}
      />
    );
  }
  if (page === 'billing') {
    content = (
      <BillingPage
        portalData={portalData}
        onNavigate={go}
        onSync={handleSyncBackend}
        isSyncing={isSyncing}
      />
    );
  }
  if (page === 'notifications') {
    content = (
      <NotificationsPage
        portalData={portalData}
        updates={updates}
        onNavigate={go}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onToggleRead={handleToggleNotificationRead}
      />
    );
  }
  if (page === 'support') {
    content = (
      <ActiveCasesPage
        portalData={portalData}
        onNavigate={go}
        onOpenVirtualAssistant={openVirtualAssistant}
        onSelectActiveCase={(caseNum) => setSelectedActiveCaseNum(caseNum)}
        onSelectClosedCase={(caseNum) => setSelectedClosedCaseNum(caseNum)}
        initialTab="escalation"
        onOpenCall={() => setCallOpen(true)}
        onCasesUpdated={(activeCount) => {
          setOpenCasesCount(activeCount);
          setPortalData(serviceNowRestService.getPortalData());
        }}
      />
    );
  }
  if (page === 'history') {
    content = (
      <ActiveCasesPage
        portalData={portalData}
        onNavigate={go}
        onOpenVirtualAssistant={openVirtualAssistant}
        onSelectActiveCase={(caseNum) => setSelectedActiveCaseNum(caseNum)}
        onSelectClosedCase={(caseNum) => setSelectedClosedCaseNum(caseNum)}
        initialTab="closed"
        onOpenCall={() => setCallOpen(true)}
        onCasesUpdated={(activeCount) => setOpenCasesCount(activeCount)}
      />
    );
  }
  if (page === 'closed-case') {
    content = (
      <ClosedCaseDetailPage
        portalData={portalData}
        selectedCaseNumber={selectedClosedCaseNum}
        previousPage={previousPage}
        onNavigate={go}
        onOpenVirtualAssistant={openVirtualAssistant}
      />
    );
  }
  if (page === 'profile') content = <ProfilePreferencesPage portalData={portalData} onNavigate={go} onLogout={handleLogout} />;
  if (page === 'security') content = <SecurityPage portalData={portalData} onLogout={handleLogout} />;

  return (
    <div className="min-h-screen bg-[#F4F8FA] text-slate-900 font-sans flex">
      
      {/* 1. Left Navigation Sidebar */}
      <NavigationSidebar
        activePage={page}
        onNavigate={go}
        onLogout={handleLogout}
        portalData={portalData}
        onOpenClickToCall={() => setCallOpen(true)}
        onOpenRestInspector={() => setRestInspectorOpen(true)}
        onOpenVirtualAssistant={openVirtualAssistant}
        isRestMockMode={!restConfig.isLiveMode}
        mobileMenuOpen={mobileMenu}
        setMobileMenuOpen={setMobileMenu}
        showRestInspector={SERVICENOW_CONFIG.showRestInspector}
        unreadNotificationCount={unreadNotificationCount}
        openCasesCount={openCasesCount}
        ordersCount={ordersCount}
      />

      {/* 2. Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        {/* Top Header Bar */}
        <TopHeaderBar
          portalData={portalData}
          onNavigate={go}
          onSelectActiveCase={(caseNum) => setSelectedActiveCaseNum(caseNum)}
          onLogout={handleLogout}
          mobileMenuOpen={mobileMenu}
          setMobileMenuOpen={setMobileMenu}
          unreadNotificationCount={unreadNotificationCount}
          onOpenNlqChat={() => setNlqChatOpen(true)}
        />

        {/* Dynamic Page Container */}
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{content}</div>
        </main>
      </div>

      {/* Modals & Drawers */}
      <BusinessImpactModal
        open={impactOpen}
        onClose={() => setImpactOpen(false)}
        portalData={portalData}
        onSubmitSuccess={() => {
          setUpdates(serviceNowRestService.getApprovedUpdates());
        }}
      />

      <RestorationConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        portalData={portalData}
        onConfirmSuccess={() => {
          setTimeline(serviceNowRestService.getTimeline());
          setUpdates(serviceNowRestService.getApprovedUpdates());
        }}
      />

      <WebRTCCallModal
        open={callOpen}
        onClose={() => setCallOpen(false)}
        portalData={portalData}
      />

      <OttoAssistantModal
        isOpen={vaOpen}
        onClose={() => setVaOpen(false)}
        context={vaContext}
        portalData={portalData}
        onOpenCall={() => {
          setVaOpen(false);
          setCallOpen(true);
        }}
      />

      {SERVICENOW_CONFIG.showRestInspector && (
        <ServiceNowRestInspector
          isOpen={restInspectorOpen}
          onClose={() => setRestInspectorOpen(false)}
        />
      )}

      {/* Left Bottom: Customer Service Engagement Messenger (CSM Self-Service Hub) */}
      {/* <ServiceNowEngagementMessenger key={authenticated ? "sn-em-auth" : "sn-em-guest"} /> */}



      {/* Top Navbar Modal: Now Assist for TSM (Autonomous NLQ Chat) */}
      <ServiceNowAutonomousNLQChat
        isOpen={nlqChatOpen}
        onClose={() => setNlqChatOpen(false)}
        customerName={portalData.customer || ''}
        customerEmail={portalData.email || ''}
      />

      {/* Right Bottom: Official ServiceNow Virtual Agent Portable Widget Client */}
      {/* <ServiceNowVirtualAgent key={authenticated ? "sn-va-auth" : "sn-va-guest"} /> */}
      <ServiceNowEnhancedChat
        customer={{
          name: portalData.customer || (typeof window !== 'undefined' ? (sessionStorage.getItem('sn_first_name') ? `${sessionStorage.getItem('sn_first_name')} ${sessionStorage.getItem('sn_last_name') || ''}`.trim() : null) : null) || 'Customer',
          userName: (typeof window !== 'undefined' ? (sessionStorage.getItem('sn_username') || localStorage.getItem('sn_username')) : null) || '',
          email: portalData.email || (typeof window !== 'undefined' ? (sessionStorage.getItem('sn_email') || localStorage.getItem('sn_email')) : null) || '',
          accountName: portalData.account || ''
        }}
        endpointUrl={`${SERVICENOW_CONFIG.instanceUrl}/api/sn_itsm_gen_ai/b2c_telecom_selfcare/ai-chat`}
      />

    </div>
  );
}

export default App;
