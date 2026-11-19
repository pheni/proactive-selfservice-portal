import React from 'react';
import { PageHeader, Card, Badge, Button } from '../UIPrimitives';
import { PageType, PortalData, VirtualAssistantContext, ClosedCaseItem } from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';
import { ArrowLeft, CheckCircle2, Download, ShieldCheck, Bot } from 'lucide-react';

interface ClosedCaseDetailPageProps {
  portalData: PortalData;
  selectedCaseNumber?: string;
  previousPage?: PageType;
  onNavigate?: (page: PageType) => void;
  onOpenVirtualAssistant: (context?: VirtualAssistantContext) => void;
}

export const ClosedCaseDetailPage: React.FC<ClosedCaseDetailPageProps> = ({
  portalData,
  selectedCaseNumber,
  previousPage = 'history',
  onNavigate,
  onOpenVirtualAssistant
}) => {
  const cItem: ClosedCaseItem = serviceNowRestService.getClosedCaseByNumber(selectedCaseNumber || 'CSM001102');

  const backLabel = previousPage === 'dashboard' ? 'Back to Overview' : (previousPage === 'cases' ? 'Back to Cases Hub' : 'Back to Case History');
  const backTarget = previousPage === 'dashboard' ? 'dashboard' : (previousPage === 'cases' ? 'cases' : 'history');

  return (
    <div className="space-y-6">
      {onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate(backTarget as PageType)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-700 transition group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>{backLabel}</span>
        </button>
      )}
      <PageHeader
        eyebrow="Closed Case Record"
        title={cItem.caseNumber}
        description={`${cItem.service} · ${cItem.summary}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenVirtualAssistant({
                caseNumber: cItem.caseNumber,
                serviceName: cItem.service,
                status: 'Closed',
                category: cItem.category
              })}
              className="text-xs py-2 px-3 flex items-center gap-1.5 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80"
            >
              <Bot className="h-3.5 w-3.5 text-teal-600" />
              <span>Ask Digital Assistant</span>
            </Button>
            <Badge tone="green">Closed</Badge>
          </div>
        }
      />

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Resolution record</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {cItem.resolutionSummary}
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-100">
          {cItem.closureMilestones.map((m) => (
            <div key={m.label} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <b className="text-slate-900 font-bold">{m.label}</b>
              </div>
              <span className="text-slate-500 font-mono">{m.time}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2 border border-emerald-100">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>SLA resolution verified and closed. All customer milestones archived and verified.</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="outline" className="flex items-center gap-2 text-xs">
            <Download className="h-4 w-4 text-slate-500" />
            <span>Download summary</span>
          </Button>

          <Button
            variant="teal"
            onClick={() => onOpenVirtualAssistant({
              caseNumber: cItem.caseNumber,
              serviceName: cItem.service,
              status: 'Closed',
              category: cItem.category
            })}
            className="flex items-center gap-2 text-xs"
          >
            <Bot className="h-4 w-4 text-white" />
            <span>Digital Assistant Audit</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
