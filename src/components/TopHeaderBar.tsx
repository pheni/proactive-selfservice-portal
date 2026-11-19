import React, { useState, useRef, useEffect } from 'react';
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
  CreditCard
} from 'lucide-react';
import { PortalData } from '../types/portalTypes';

interface TopHeaderBarProps {
  portalData: PortalData;
  onNavigate: (page: any) => void;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  unreadNotificationCount?: number;
}

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  portalData,
  onNavigate,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
  unreadNotificationCount = 0
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {/* Center: Global Quick Search (Standard Tier-1 Enterprise Pattern) */}
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 transition px-3.5 py-1.5 w-64 lg:w-80 text-xs text-slate-500 shadow-2xs">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search circuits, orders, tickets..." 
            className="w-full bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onNavigate('services');
              }
            }}
          />
          <kbd className="hidden lg:inline-block text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-semibold shadow-2xs">
            ⌘K
          </kbd>
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
