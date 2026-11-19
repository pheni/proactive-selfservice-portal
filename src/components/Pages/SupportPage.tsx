import React from 'react';
import { PageHeader, Card, Button } from '../UIPrimitives';
import { PortalData, VirtualAssistantContext } from '../../types/portalTypes';
import { PhoneCall, Clock, PlusCircle, Bot, ShieldCheck, Zap, PhoneForwarded } from 'lucide-react';

interface SupportPageProps {
  portalData: PortalData;
  onOpenCall: () => void;
  onNavigate: (page: any) => void;
  onOpenVirtualAssistant?: (context?: VirtualAssistantContext) => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({ 
  portalData, 
  onOpenCall, 
  onNavigate,
  onOpenVirtualAssistant 
}) => {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Help & technical assurance"
        title="How can we help?"
        description="Access 24/7 technical support, AI diagnostics, submit service requests, or contact engineering."
      />

      {/* 4 Support Channels: AI Assistant is Channel #1! */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Ask Digital Assistant (Featured AI Support) */}
        <Card className="p-6 border-2 border-teal-500/40 bg-teal-50/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
              Instant AI
            </span>
          </div>
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-extrabold text-slate-900 text-base">Ask Digital Assistant</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Instant AI line diagnostics, incident summaries, and automated priority escalations without waiting.
            </p>
          </div>
          <Button 
            variant="teal" 
            className="mt-5 w-full text-xs shadow-xs flex items-center justify-center gap-1.5" 
            onClick={() => {
              if (onOpenVirtualAssistant) {
                onOpenVirtualAssistant({
                  caseNumber: portalData.caseNumber,
                  serviceName: portalData.service,
                  status: 'Monitoring'
                });
              }
            }}
          >
            <Bot className="h-4 w-4" />
            <span>Launch Digital Assistant</span>
          </Button>
        </Card>

        {/* Card 2: Create Support Case */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <PlusCircle className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-base">Create Support Case</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Submit a formal incident ticket or service change request directly to our service assurance team.
            </p>
          </div>
          <Button variant="outline" className="mt-5 w-full text-xs hover:border-slate-300" onClick={() => onNavigate('create-case')}>
            Create Support Case
          </Button>
        </Card>

        {/* Card 3: Instant Voice Call (Customer Friendly - No WebRTC Jargon!) */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <PhoneCall className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-base">Instant Voice Bridge</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Connect directly to a senior duty specialist with verified priority routing right from your browser.
            </p>
          </div>
          <Button variant="outline" className="mt-5 w-full text-xs hover:border-slate-300" onClick={onOpenCall}>
            Start Voice Call
          </Button>
        </Card>

        {/* Card 4: Request a callback */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-base">Request a Callback</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Schedule a dedicated 30-minute window and a service assurance specialist will call your direct line.
            </p>
          </div>
          <Button variant="outline" className="mt-5 w-full text-xs hover:border-slate-300" onClick={onOpenCall}>
            Schedule Callback
          </Button>
        </Card>
      </div>

      {/* Enterprise SLA Response Matrix & Emergency Escalation Hotline */}
      <Card className="p-6 border border-slate-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">24/7 Priority Emergency Hotline</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                For catastrophic service outages affecting core site traffic, bypass queues via the direct carrier bridge.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Direct NOC Hotline</div>
              <div className="text-lg font-black text-slate-900 font-mono">+44 (0) 800 496 0123</div>
            </div>
            <Button variant="teal" onClick={onOpenCall} className="text-xs py-2 px-3 flex items-center gap-1.5">
              <PhoneForwarded className="h-3.5 w-3.5" />
              <span>Call Now</span>
            </Button>
          </div>
        </div>

        {/* Enterprise Response SLA Matrix */}
        <div className="pt-6">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>Guaranteed Service Assurance SLAs</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
              <div className="flex items-center justify-between">
                <b className="font-extrabold text-rose-800">P1 · Critical Outage</b>
                <span className="font-mono font-bold text-rose-700 text-[11px]">&lt; 15 mins</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">Complete site down or link loss. Dedicated crisis lead assigned.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center justify-between">
                <b className="font-extrabold text-amber-800">P2 · High Degradation</b>
                <span className="font-mono font-bold text-amber-700 text-[11px]">&lt; 1 hour</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">Elevated latency or jitter. Automated diagnostics & telemetry review.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="flex items-center justify-between">
                <b className="font-extrabold text-blue-800">P3 · Moderate Impact</b>
                <span className="font-mono font-bold text-blue-700 text-[11px]">&lt; 4 hours</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">Redundancy failure without customer service interruption.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <b className="font-bold text-slate-800">P4 · Minor Request</b>
                <span className="font-mono font-bold text-slate-600 text-[11px]">&lt; 8 hours</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Service inquiries, configuration questions, or routine reporting.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
