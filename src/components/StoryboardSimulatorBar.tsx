import React from 'react';
import { Layers, SkipBack, SkipForward, Terminal } from 'lucide-react';
import { StoryboardStepNumber } from '../types/portalTypes';

interface StoryboardSimulatorBarProps {
  currentStep: StoryboardStepNumber;
  onSelectStep: (step: StoryboardStepNumber) => void;
  onToggleRestInspector: () => void;
}

const storyboardSteps: Array<{ step: StoryboardStepNumber; title: string; desc: string }> = [
  { step: 1, title: 'Step 1: Degradation Detected', desc: 'Packet loss & latency detected; INC-498221 auto created.' },
  { step: 2, title: 'Step 2: AI Multi-Domain Correlation', desc: 'AI identifies Service Profile Mismatch (45% confidence).' },
  { step: 3, title: 'Step 3: Proactive Customer Notification', desc: 'Notification sent to customer; no action required.' },
  { step: 4, title: 'Step 4: Automated Diagnostics', desc: 'Router, interface & WAN session online; 0 hardware faults.' },
  { step: 5, title: 'Step 5: Customer Contacts dfc (Voice AI)', desc: 'Voice AI welcomes Roger, asks business impact ("Dispatch Platform").' },
  { step: 6, title: 'Step 6: Service Layer Diagnostics', desc: 'QoS policy & profile mismatch confirmed high confidence.' },
  { step: 7, title: 'Step 7: Recovery Stage 1 (Session Rebuild)', desc: 'Session reset & re-auth; packet loss reduced to 8.2%.' },
  { step: 8, title: 'Step 8: Recovery Stage 2 (Profile Refresh)', desc: 'Policy sync & QoS refresh; packet loss reduced to 1.4%.' },
  { step: 9, title: 'Step 9: Recovery Stage 3 (Path Optimisation)', desc: 'Route recalculation; latency returns to 14ms (Restored).' },
  { step: 10, title: 'Step 10: Business Validation', desc: 'Voice AI re-engages; Roger confirms dispatch platform restored.' },
  { step: 11, title: 'Step 11: Stability Monitoring', desc: 'Continuous telemetry checks; no new anomalies detected.' },
  { step: 12, title: 'Step 12: Problem Management', desc: 'Problem record PRB-008912 created for RCA & prevention.' },
  { step: 13, title: 'Step 13: Business Outcome Summary', desc: 'Reduced disruption, SLA compliance, full resolution.' }
];

export const StoryboardSimulatorBar: React.FC<StoryboardSimulatorBarProps> = ({
  currentStep,
  onSelectStep,
  onToggleRestInspector
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                Interactive Storyboard Simulator
              </span>
              <span className="text-xs text-slate-400 font-mono">Use Case 2 - Self-Heal Journey</span>
            </div>
            <div className="text-xs font-bold text-slate-200 mt-0.5 truncate max-w-xl">
              {storyboardSteps.find(s => s.step === currentStep)?.title}: <span className="font-normal text-slate-400">{storyboardSteps.find(s => s.step === currentStep)?.desc}</span>
            </div>
          </div>
        </div>

        {/* Center: Step Selector Stepper */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          <button
            onClick={() => onSelectStep(Math.max(1, currentStep - 1) as StoryboardStepNumber)}
            disabled={currentStep === 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
            title="Previous Step"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {storyboardSteps.map((s) => (
            <button
              key={s.step}
              onClick={() => onSelectStep(s.step)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
                currentStep === s.step
                  ? 'bg-teal-600 text-white ring-2 ring-teal-400/50 shadow-md scale-110'
                  : currentStep > s.step
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title={s.title}
            >
              {s.step}
            </button>
          ))}

          <button
            onClick={() => onSelectStep(Math.min(13, currentStep + 1) as StoryboardStepNumber)}
            disabled={currentStep === 13}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
            title="Next Step"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: REST Inspector Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleRestInspector}
            className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 text-xs font-bold border border-purple-500/40 transition-all flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>ServiceNow REST Inspector</span>
          </button>
        </div>

      </div>
    </div>
  );
};
