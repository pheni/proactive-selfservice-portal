import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  History, 
  PhoneCall, 
  Terminal, 
  Wifi, 
  CheckCircle2, 
  User, 
  Sliders,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export type SidebarTab = 'assurance' | 'inventory' | 'history';

interface SidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  onOpenClickToCall: () => void;
  onOpenRestInspector: () => void;
  isRestMockMode: boolean;
  currentStep: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenClickToCall,
  onOpenRestInspector,
  isRestMockMode,
  currentStep
}) => {
  const navItems: Array<{ id: SidebarTab; label: string; icon: any; badge?: string; desc: string }> = [
    {
      id: 'assurance',
      label: 'Proactive Assurance',
      icon: ShieldAlert,
      badge: 'Live',
      desc: 'Self-heal diagnostics & timeline'
    },
    {
      id: 'inventory',
      label: 'DIA Service Inventory',
      icon: Activity,
      desc: '100 Mbps circuit health & metrics'
    },
    {
      id: 'history',
      label: 'Case History Archive',
      icon: History,
      desc: 'Retained closed case resolution records'
    }
  ];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 text-white flex flex-col justify-between h-screen sticky top-0 z-40 shrink-0 shadow-2xl">
      
      {/* Top Header & Branding */}
      <div>
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-950/80 shrink-0">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold tracking-tight text-white leading-none">Dfc Business</h1>
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Self-Care
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Enterprise Service Assurance</p>
            </div>
          </div>
        </div>

        {/* Authenticated Customer Context Card (Row 57 Requirement) */}
        <div className="p-4 mx-4 mt-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3 text-rose-400" /> Authenticated Customer
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Account Verified" />
          </div>

          <div>
            <div className="font-bold text-white text-sm">Roger</div>
            <div className="text-[11px] text-slate-300 font-medium">Abc Ltd</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Acc: ACC-DFC-8921</div>
          </div>

          <div className="pt-1.5 border-t border-slate-700/50 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Authorised DIA Services Only
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 mt-6">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
            Service Assurance Menu
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all group flex items-start justify-between ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-rose-400'}`} />
                    <div>
                      <div className="text-xs font-bold leading-tight flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isActive ? 'text-rose-100' : 'text-slate-400'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white translate-x-0.5' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              );
            })}
          </nav>

          {/* Action Trigger Buttons (Click to Call & REST Inspector) */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-1">
              Direct Support & Tools
            </div>

            {/* Row 66 Requirement: Genesys Click to Call Button */}
            <button
              onClick={onOpenClickToCall}
              className="w-full p-3 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs font-bold transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-rose-400" />
                <span>Click to Call Support</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-rose-500/30 text-rose-200 rounded-full font-mono">WebRTC</span>
            </button>

            {/* ServiceNow REST Inspector Button */}
            <button
              onClick={onOpenRestInspector}
              className="w-full p-3 rounded-2xl bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>ServiceNow REST Inspector</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-purple-500/30 text-purple-200 rounded-full font-mono">
                {isRestMockMode ? 'Mock API' : 'Live ServiceNow'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between font-mono">
          <span>ServiceNow CSM REST:</span>
          <span className="text-emerald-400 font-bold">200 OK</span>
        </div>
        <div className="flex items-center justify-between font-mono">
          <span>Storyboard Step:</span>
          <span className="text-rose-400 font-bold">Step {currentStep} / 13</span>
        </div>
      </div>

    </aside>
  );
};
