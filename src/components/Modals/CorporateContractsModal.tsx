import React, { useState } from 'react';
import { Modal, Button, Badge } from '../UIPrimitives';
import { CorporateContractItem } from '../../types/portalTypes';
import { FileText, Download, ShieldCheck, CheckCircle2, Calendar, Scale } from 'lucide-react';

interface CorporateContractsModalProps {
  open: boolean;
  onClose: () => void;
  contracts: CorporateContractItem[];
}

export const CorporateContractsModal: React.FC<CorporateContractsModalProps> = ({
  open,
  onClose,
  contracts
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = (id: string, title: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      setDownloadSuccess(`Downloaded signed PDF: ${title} (${id}.pdf)`);
      setTimeout(() => setDownloadSuccess(null), 3500);
    }, 800);
  };

  return (
    <Modal
      open={open}
      title="Governing Legal Agreements & Master Contracts"
      onClose={() => {
        setDownloadSuccess(null);
        onClose();
      }}
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Inspect active enterprise master service agreements, SLA schedules, device addenda, and data residency commitments.
        </p>

        {downloadSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        <div className="space-y-3">
          {contracts.map(contract => (
            <div 
              key={contract.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-sm font-bold text-slate-900">{contract.title}</b>
                      <Badge tone={contract.status === 'In Force' || contract.status === 'Active' ? 'green' : 'amber'}>
                        {contract.status}
                      </Badge>
                    </div>
                    <div className="text-xs font-mono font-bold text-teal-700 mt-0.5">
                      {contract.id} · {contract.type} Agreement
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleDownload(contract.id, contract.title)}
                  disabled={downloadingId === contract.id}
                  className="flex items-center gap-1.5 text-xs py-1.5 px-3 border-slate-300 self-start sm:self-auto shrink-0"
                >
                  <Download className={`h-3.5 w-3.5 ${downloadingId === contract.id ? 'animate-bounce text-teal-600' : 'text-slate-500'}`} />
                  <span>{downloadingId === contract.id ? 'Generating PDF...' : 'Download PDF'}</span>
                </Button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {contract.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Term: <b>{contract.effectiveDate}</b> – <b>{contract.renewalDate}</b></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Jurisdiction: <b>{contract.governingLaw}</b></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>SLA: <b>{contract.slaCommitment}</b></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
