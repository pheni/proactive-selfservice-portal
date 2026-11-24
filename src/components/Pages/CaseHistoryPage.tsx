import React from 'react';
import { PageHeader, Card, Badge, Button } from '../UIPrimitives';
import { PortalData, VirtualAssistantContext, ClosedCaseItem } from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';
import { ChevronRight, Bot } from 'lucide-react';

interface CaseHistoryPageProps {
  portalData: PortalData;
  onNavigate: (page: any, caseNum?: string) => void;
  onOpenVirtualAssistant: (context?: VirtualAssistantContext) => void;
  onSelectCase?: (caseNum: string) => void;
}

export const CaseHistoryPage: React.FC<CaseHistoryPageProps> = ({
  portalData,
  onNavigate,
  onOpenVirtualAssistant,
  onSelectCase
}) => {
  const closedCases: ClosedCaseItem[] = serviceNowRestService.getClosedCases();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Service records"
          title="Closed Cases"
          description="Historical resolution records and closed service cases."
        />

        <Button
          variant="outline"
          onClick={() => onOpenVirtualAssistant({
            caseNumber: closedCases[0]?.caseNumber || '',
            serviceName: closedCases[0]?.service || 'Telecom Service',
            status: 'Closed'
          })}
          className="flex items-center gap-2 text-xs py-2 px-3 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 self-start sm:self-auto"
        >
          <Bot className="h-4 w-4 text-teal-600" />
          <span>Ask Digital Assistant</span>
        </Button>
      </div>

      <Card className="p-6 overflow-hidden">
        <div className="overflow-x-auto space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-5 p-3 font-bold text-xs uppercase tracking-wider text-white bg-[#092E4C] rounded-xl hidden sm:grid">
            <div>Case</div>
            <div className="col-span-2">Service & Description</div>
            <div>Closed Date</div>
            <div className="text-right">Digital Assistant</div>
          </div>

          {closedCases.map((cItem) => (
            <div
              key={cItem.caseNumber}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition flex flex-col sm:grid sm:grid-cols-5 items-start sm:items-center gap-3 text-xs text-slate-700 font-medium"
            >
              <div
                onClick={() => {
                  if (onSelectCase) onSelectCase(cItem.caseNumber);
                  onNavigate('closed-case');
                }}
                className="font-bold text-teal-700 font-mono cursor-pointer hover:underline flex items-center gap-1.5"
              >
                <span>{cItem.caseNumber}</span>
                <Badge tone="green" className="text-[10px] py-0 px-1.5">Closed</Badge>
              </div>

              <div
                onClick={() => {
                  if (onSelectCase) onSelectCase(cItem.caseNumber);
                  onNavigate('closed-case');
                }}
                className="col-span-2 cursor-pointer"
              >
                <b className="text-slate-900 block font-bold">{cItem.service}</b>
                <span className="text-[11px] text-slate-500 line-clamp-1">{cItem.summary}</span>
              </div>

              <div className="text-slate-500 font-mono">
                {cItem.closedDate}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenVirtualAssistant({
                      caseNumber: cItem.caseNumber,
                      serviceName: cItem.service,
                      status: 'Closed',
                      category: cItem.category
                    });
                  }}
                  className="flex items-center gap-1.5 text-[11px] py-1.5 px-2.5 bg-white border-teal-500/40 text-teal-700 hover:bg-teal-50"
                >
                  <Bot className="h-3.5 w-3.5 text-teal-600" />
                  <span>Ask Digital Assistant</span>
                </Button>

                <button
                  onClick={() => {
                    if (onSelectCase) onSelectCase(cItem.caseNumber);
                    onNavigate('closed-case');
                  }}
                  className="p-1 text-slate-400 hover:text-teal-600"
                  title="View details"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
