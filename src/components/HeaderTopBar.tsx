import React from 'react';
import { Layers, PhoneCall, Terminal, RefreshCw, ChevronRight, SkipBack, SkipForward, ShieldAlert } from 'lucide-react';
import { StoryboardStepNumber } from '../types/portalTypes';

interface HeaderTopBarProps {
  activeTabTitle: string;
  activeTabDesc: string;
  currentStep: StoryboardStepNumber;
  onSelectStep: (step: StoryboardStepNumber) => void;
  onOpenClickToCall: () => void;
  onOpenRestInspector: () => void;
}

const storyboardStepTitles: Record<StoryboardStepNumber, { title: string; desc: string }> = {
  1: { title: 'Step 1: Degradation Detected', desc: 'Packet loss & latency detected; INC-498221 created.' },
  2: { title: 'Step 2: AI Multi-Domain Correlation', desc: 'AI identifies Service Profile Mismatch (45% confidence).' },
  3: { title: 'Step 3: Customer Notification', desc: 'Proactive update sent; no action required.' },
  4: { title: 'Step 4: Automated Diagnostics', desc: 'Router & circuit online; 0 hardware faults.' },
  5: { title: 'Step 5: Customer Contact (Voice AI)', desc: 'Voice AI welcomes Roger, asks business impact ("Dispatch Platform").' },
  6: { title: 'Step 6: Service Layer Diagnostics', desc: 'QoS policy & subscriber profile mismatch confirmed.' },
  7: { title: 'Step 7: Recovery Stage 1 (Session Rebuild)', desc: 'Session reset; packet loss reduced to 8.2%.' },
  8: { title: 'Step 8: Recovery Stage 2 (Profile Refresh)', desc: 'Policy sync; packet loss reduced to 1.4%.' },
  9: { title: 'Step 9: Recovery Stage 3 (Path Optimisation)', desc: 'Route recalculation; latency drops to 14ms (Restored).' },
  10: { title: 'Step 10: Business Validation', desc: 'Customer confirms dispatch platform restored.' },
  11: { title: 'Step 11: Stability Monitoring', desc: 'Continuous telemetry checks active.' },
  12: { title: 'Step 12: Problem Management', desc: 'Problem Record PRB-008912 created for RCA.' },
  13: { title: 'Step 13: Business Outcome Summary', desc: 'Service fully operating normally.' }
};

export const HeaderTopBar: React.FC<HeaderTopBarProps> = ({
  activeTabTitle,
  activeTabDesc,
  currentStep,
  onSelectStep,
  onOpenClickToCall,
  onOpenRestInspector
}) => {
  const currentStepData = storyboardStepTitles[currentStep];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Page Title & Active Context */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{activeTabTitle}</h2>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
              Live Managed Assurance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{activeTabDesc}</p>
        </div>

        {/* Integrated Storyboard Stepper Controller Bar */}
        <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-inner border border-slate-800">
          <div className="hidden xl:flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400">
              {currentStepData.title}
            </span>
            <span className="text-[11px] text-slate-300 font-medium truncate max-w-xs">
              {currentStepData.desc}
            </span>
          </div>

          {/* Stepper Buttons 1 - 13 */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
            <button
              onClick={() => onSelectStep(Math.max(1, currentStep - 1) as StoryboardStepNumber)}
              disabled={currentStep === 1}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
              title="Previous Storyboard Step"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((stepNum) => (
              <button
                key={stepNum}
                onClick={() => onSelectStep(stepNum as StoryboardStepNumber)}
                className={`w-6 h-6 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center justify-center ${
                  currentStep === stepNum
                    ? 'bg-rose-600 text-white shadow-md scale-110 ring-2 ring-rose-400/50'
                    : currentStep > stepNum
                    ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                title={`Jump to Step ${stepNum}`}
              >
                {stepNum}
              </button>
            ))}

            <button
              onClick={() => onSelectStep(Math.min(13, currentStep + 1) as StoryboardStepNumber)}
              disabled={currentStep === 13}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
              title="Next Storyboard Step"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenClickToCall}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Click to Call</span>
          </button>

          <button
            onClick={onOpenRestInspector}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-600" />
            <span>REST Inspector</span>
          </button>
        </div>

      </div>
    </header>
  );
};
