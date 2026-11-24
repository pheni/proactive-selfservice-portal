import React from 'react';
import { 
  LayoutDashboard, 
  Network, 
  FileText, 
  Bell, 
  Building2, 
  Package, 
  CreditCard,
  Activity, 
  Terminal
} from 'lucide-react';
import { PageType, PortalData } from '../types/portalTypes';
import { serviceNowRestService } from '../services/servicenowApi';

interface NavigationSidebarProps {
  activePage: PageType;
  onNavigate: (page: PageType) => void;
  onLogout: () => void;
  portalData: PortalData;
  onOpenClickToCall: () => void;
  onOpenRestInspector: () => void;
  isRestMockMode: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  showRestInspector?: boolean;
  unreadNotificationCount?: number;
  openCasesCount?: number;
  ordersCount?: number;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activePage,
  onNavigate,
  onLogout,
  portalData,
  onOpenRestInspector,
  isRestMockMode,
  mobileMenuOpen,
  setMobileMenuOpen,
  showRestInspector = false,
  unreadNotificationCount = 0,
  openCasesCount,
  ordersCount
}) => {
  const isCasesActive = ['cases', 'case-detail', 'create-case', 'history', 'closed-case'].includes(activePage);
  const displayedCasesCount = openCasesCount ?? serviceNowRestService.getActiveCases().length;
  const displayedOrdersCount = ordersCount !== undefined ? ordersCount : 0;
  const servicesCount = portalData.servicesList ? portalData.servicesList.length : 0;

  const navItems: Array<{
    id: PageType;
    label: string;
    icon: any;
    badge?: number | string;
    badgeTone?: 'teal' | 'rose' | 'slate';
    isActive: boolean;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: activePage === 'dashboard'
    },
    {
      id: 'services',
      label: 'Services Hub',
      icon: Network,
      badge: servicesCount,
      badgeTone: 'slate',
      isActive: activePage === 'services' || activePage === 'service-detail'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: Package,
      badge: displayedOrdersCount,
      badgeTone: 'teal',
      isActive: activePage === 'orders'
    },
    {
      id: 'cases',
      label: 'Support Center',
      icon: FileText,
      badge: displayedCasesCount,
      badgeTone: displayedCasesCount > 0 ? 'teal' : 'slate',
      isActive: isCasesActive
    },
    {
      id: 'billing',
      label: 'Billing & Invoices',
      icon: CreditCard,
      isActive: activePage === 'billing'
    },
    {
      id: 'account',
      label: 'Account & Sites',
      icon: Building2,
      isActive: activePage === 'account'
    }
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#092E4C] p-4 text-white transition-transform lg:translate-x-0 ${
      mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
    } flex flex-col justify-between shadow-2xl shrink-0 overflow-y-auto border-r border-slate-800`}>
      
      <div>
        {/* Brand Header: B2B SELFCARE */}
        <div 
          className="flex items-center gap-3 px-2 py-3 border-b border-white/10 mb-6 cursor-pointer group" 
          onClick={() => onNavigate('dashboard')}
          title="B2B Selfcare Portal - Executive Home"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 p-[1.5px] shadow-lg shadow-cyan-950/40 shrink-0">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#092E4C] transition group-hover:bg-[#0c395e]">
              <Activity className="h-5 w-5 text-cyan-300 transition-transform group-hover:scale-110" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white leading-none flex items-center gap-1">
              <span>B2B</span>
              <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-200 bg-clip-text text-transparent font-black">SELFCARE</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] font-semibold text-slate-300 tracking-wide">Enterprise Portal</span>
            </div>
          </div>
        </div>

        {/* Clean Wayfinding Navigation Tree (No Redundant Action Buttons) */}
        <nav className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Operations & Assets
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition group ${
                  item.isActive
                    ? 'bg-white/10 text-white font-bold border-l-4 border-teal-400 pl-2.5 shadow-xs'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                    item.isActive ? 'text-teal-300' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    item.badgeTone === 'rose'
                      ? 'bg-rose-500 text-white'
                      : item.isActive
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-800 text-teal-300 border border-teal-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Optional ServiceNow REST Inspector */}
        {showRestInspector && (
          <div className="mt-6 pt-3 border-t border-white/10">
            <button
              onClick={onOpenRestInspector}
              className="w-full flex items-center justify-between rounded-xl bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 p-2 text-xs font-bold text-purple-200 transition"
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-purple-400" />
                <span className="text-[11px]">REST Inspector</span>
              </div>
              <span className="text-[9px] bg-purple-500/30 px-1.5 py-0.5 rounded font-mono">
                {isRestMockMode ? 'Mock' : 'Live'}
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
