import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  PlusCircle, 
  Search, 
  ShieldCheck, 
  ChevronDown, 
  Building2, 
  CheckCircle2,
  Settings,
  CreditCard,
  Sparkles,
  Network,
  LifeBuoy,
  Package,
  ArrowRight,
  X
} from 'lucide-react';
import { PortalData } from '../types/portalTypes';
import { serviceNowRestService } from '../services/servicenowApi';

interface TopHeaderBarProps {
  portalData: PortalData;
  onNavigate: (page: any) => void;
  onSelectActiveCase?: (caseNum: string) => void;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  unreadNotificationCount?: number;
  onOpenNlqChat?: () => void;
}

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  portalData,
  onNavigate,
  onSelectActiveCase,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
  unreadNotificationCount = 0,
  onOpenNlqChat
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Federated Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Federated multi-table search (Sold Products, Support Cases, Orders) per TSM PDF Page 2
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { circuits: [], cases: [], orders: [] };

    const circuits = (portalData.servicesList || []).filter(s =>
      (s.id && s.id.toLowerCase().includes(q)) ||
      (s.circuitId && s.circuitId.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.location && s.location.toLowerCase().includes(q))
    ).slice(0, 4);

    const allCases = [
      ...serviceNowRestService.getActiveCases(),
      ...serviceNowRestService.getClosedCases()
    ];
    const cases = allCases.filter(c =>
      (c.caseNumber && c.caseNumber.toLowerCase().includes(q)) ||
      (c.service && c.service.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    ).slice(0, 4);

    const orders = (serviceNowRestService.getOrders() || []).filter(o =>
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.projectTitle && o.projectTitle.toLowerCase().includes(q)) ||
      (o.orderType && o.orderType.toLowerCase().includes(q))
    ).slice(0, 3);

    return { circuits, cases, orders };
  }, [searchQuery, portalData.servicesList]);

  const hasResults = searchResults.circuits.length > 0 || searchResults.cases.length > 0 || searchResults.orders.length > 0;

  const userInitials = portalData.customer
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'CU';

  return (
    <header className="sticky top-0 z-30 flex h-16 border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
      <div className="flex w-full items-center justify-between gap-4">
        
        {/* Left: Mobile hamburger & customer context */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div 
            onClick={() => onNavigate('account')}
            className="flex items-center gap-2 cursor-pointer group"
            title="View Account & Sites"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 group-hover:bg-teal-100 transition">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <b className="text-xs sm:text-sm text-slate-900 font-bold group-hover:text-teal-700 transition">
                {portalData.customer}
              </b>
              <span className="hidden sm:inline text-xs text-slate-500 font-medium">
                {' '}· {portalData.account || 'Enterprise Account'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Quick Federated Search (TSM Federated Query per Reference PDF Page 2) */}
        <div ref={searchContainerRef} className="relative hidden md:block">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus-within:bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition px-3.5 py-1.5 w-72 lg:w-96 text-xs text-slate-500 shadow-2xs">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search circuits, orders, tickets..." 
              className="w-full bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400 font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchOpen(false);
                  onNavigate('services');
                } else if (e.key === 'Escape') {
                  setSearchOpen(false);
                }
              }}
            />
            {searchQuery ? (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-block text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-semibold shadow-2xs">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Floating Federated Search Results Dropdown */}
          {searchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[460px] overflow-y-auto">
              <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-bold uppercase tracking-wider text-[10px]">TSM Federated Search Results</span>
                <span className="text-[10px]">Press ESC to close</span>
              </div>

              {!hasResults ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No matching circuits, cases, or orders found for "<strong className="text-slate-600">{searchQuery}</strong>".
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {/* 1. Circuits / Sold Products (sn_install_base_sold_product) */}
                  {searchResults.circuits.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                        <Network className="h-3 w-3 text-teal-600" />
                        <span>Telecom Circuits & Assets ({searchResults.circuits.length})</span>
                      </div>
                      {searchResults.circuits.map((svc) => (
                        <div
                          key={'search-svc-' + svc.id}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                            onNavigate('services');
                          }}
                          className="px-2.5 py-2 rounded-xl hover:bg-teal-50/70 cursor-pointer flex items-center justify-between group transition"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-teal-700">
                                {svc.circuitId || svc.id}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                                svc.status.includes('Degraded') || svc.status.includes('Critical')
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {svc.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {svc.name} · {svc.location}
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-teal-600 transition" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 2. Support Cases (sn_customerservice_case) */}
                  {searchResults.cases.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                        <LifeBuoy className="h-3 w-3 text-purple-600" />
                        <span>Support Cases ({searchResults.cases.length})</span>
                      </div>
                      {searchResults.cases.map((cs) => (
                        <div
                          key={'search-cs-' + cs.caseNumber}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                            if (onSelectActiveCase) onSelectActiveCase(cs.caseNumber);
                            onNavigate('case-detail');
                          }}
                          className="px-2.5 py-2 rounded-xl hover:bg-purple-50/70 cursor-pointer flex items-center justify-between group transition"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-purple-700">
                                {cs.caseNumber}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-red-100 text-red-700">
                                {cs.priority}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {cs.service}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 truncate max-w-xs mt-0.5">
                              {cs.description}
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-purple-600 transition" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3. Orders (sn_ind_tmt_orm_order) */}
                  {searchResults.orders.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                        <Package className="h-3 w-3 text-blue-600" />
                        <span>Fulfillment Orders ({searchResults.orders.length})</span>
                      </div>
                      {searchResults.orders.map((ord) => (
                        <div
                          key={'search-ord-' + ord.orderNumber}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                            onNavigate('orders');
                          }}
                          className="px-2.5 py-2 rounded-xl hover:bg-blue-50/70 cursor-pointer flex items-center justify-between group transition"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-700">
                                {ord.orderNumber}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-blue-100 text-blue-700">
                                {ord.orderType || 'Order'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                              {ord.projectTitle}
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-600 transition" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions: Single Global Create Case Button, Bell Icon, User Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Primary Global Action: Single Create Case Button */}
          <button
            onClick={() => onNavigate('create-case')}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs group"
          >
            <PlusCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Create Case</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => onNavigate('notifications')}
            className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-2 ring-white"></span>
              </span>
            )}
          </button>

          {/* 3rd Chat: Now Assist TSM Button */}
          {onOpenNlqChat && (
            <button
              onClick={onOpenNlqChat}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs hover:shadow-md group cursor-pointer border border-purple-400/30"
              title="Open Now Assist for TSM (Autonomous NLQ Agent)"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 transition-transform group-hover:scale-110 animate-pulse" />
              <span className="hidden md:inline font-semibold tracking-wide">Now Assist TSM</span>
              <span className="md:hidden font-semibold">Now Assist</span>
            </button>
          )}

          {/* Interactive User Profile Menu (Absorbs Profile & Security) */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition focus:outline-none"
              aria-label="User Account Menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#092E4C] text-xs font-black text-white shadow-xs ring-2 ring-teal-500/20">
                {userInitials}
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform hidden sm:block ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Popover Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 text-xs animate-in fade-in duration-150 z-50">
                
                {/* Popover Header */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="font-bold text-slate-900 text-sm truncate">{portalData.customer}</div>
                  <div className="text-slate-500 text-[11px] truncate mt-0.5">{portalData.account || 'Enterprise Account'}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Tier-1 Enterprise</span>
                  </div>
                </div>

                {/* Menu Links */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition text-left"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Profile & Preferences</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('billing');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition text-left"
                  >
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span>Billing & Invoices</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('security');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition text-left"
                  >
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    <span>Security & Access History</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-1" />

                {/* Log Out Button */}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition text-left font-semibold"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  <span>Log Out of Portal</span>
                </button>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
