import React from 'react';
import { ShieldAlert, Activity, History, PhoneCall, Terminal, Wifi, CheckCircle2, User, Globe } from 'lucide-react';

export type MainNavTab = 'assurance' | 'inventory' | 'history' | 'support' | 'rest-inspector';

interface NavbarProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenRestInspector: () => void;
  onOpenClickToCall: () => void;
  isRestMockMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenRestInspector,
  onOpenClickToCall,
  isRestMockMode
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Brand & Logo */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('assurance')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-950">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tracking-tight text-white uppercase">Dfc Business</span>
                  <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                    Proactive Self-Care
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Enterprise Service Assurance Portal</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              <button
                onClick={() => onSelectTab('assurance')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'assurance'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Service Assurance & Healing</span>
              </button>

              <button
                onClick={() => onSelectTab('inventory')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'inventory'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>DIA Service Inventory</span>
              </button>

              <button
                onClick={() => onSelectTab('history')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Case History Archive</span>
              </button>
            </nav>
          </div>

          {/* Right Controls: Account info, WebRTC Call, REST Inspector */}
          <div className="flex items-center gap-3">
            
            {/* Authenticated Customer Context Badge (Row 57 AC1) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                R
              </div>
              <div className="text-left leading-none">
                <div className="font-bold text-white text-[11px]">Roger</div>
                <div className="text-[10px] text-slate-400 font-mono">Abc Ltd (ACC-DFC-8921)</div>
              </div>
            </div>

            {/* Genesys Click to Call Button (Row 66) */}
            <button
              onClick={onOpenClickToCall}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md hover:shadow-red-950 transition-all flex items-center gap-1.5 border border-red-400/30"
              title="Open Genesys WebRTC Customer Call Widget"
            >
              <PhoneCall className="w-4 h-4" />
              <span className="hidden md:inline">Click to Call</span>
            </button>

            {/* ServiceNow REST Inspector Toggle */}
            <button
              onClick={onOpenRestInspector}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 transition-all flex items-center gap-1.5"
              title="Open ServiceNow REST API Inspector"
            >
              <Terminal className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">REST Inspector</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
