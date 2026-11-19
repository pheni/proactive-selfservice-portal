import React, { useState } from 'react';
import { Modal, Button, KV } from '../UIPrimitives';
import { PortalData } from '../../types/portalTypes';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { serviceNowRestService } from '../../services/servicenowApi';

interface RestorationConfirmModalProps {
  open: boolean;
  onClose: () => void;
  portalData: PortalData;
  onConfirmSuccess?: () => void;
}

export const RestorationConfirmModal: React.FC<RestorationConfirmModalProps> = ({
  open,
  onClose,
  portalData,
  onConfirmSuccess
}) => {
  const [result, setResult] = useState<'yes' | 'no' | null>(null);
  const [comments, setComments] = useState('Dispatch platform status: Operating normally');

  const handleSubmit = (chosenResult: 'yes' | 'no') => {
    setResult(chosenResult);
    serviceNowRestService.submitRestorationConfirmation({
      result: chosenResult,
      comments,
      confirmedBy: portalData.customer
    });
    if (onConfirmSuccess) onConfirmSuccess();
  };

  const handleModalClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={result === 'yes' ? 'Restoration confirmed' : result === 'no' ? 'Issue remains open' : 'Confirm service restoration'}
      onClose={handleModalClose}
    >
      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Can users access the dispatch platform without delays?
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleSubmit('yes')}
              className="w-full text-left p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 transition"
            >
              <b className="text-sm font-bold text-slate-900 block">Yes, service restored</b>
              <span className="text-xs text-slate-600 mt-1 block">The dispatch platform is operating normally.</span>
            </button>

            <button
              onClick={() => handleSubmit('no')}
              className="w-full text-left p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/50 hover:bg-amber-50 transition"
            >
              <b className="text-sm font-bold text-slate-900 block">Still experiencing issues</b>
              <span className="text-xs text-slate-600 mt-1 block">Keep the Case open and start follow-up.</span>
            </button>
          </div>
        </div>
      ) : result === 'yes' ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-emerald-50 p-6 border border-emerald-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-2" />
            <h3 className="text-xl font-bold text-slate-900">Customer confirmation recorded</h3>

            <div className="mt-4 space-y-1 text-xs">
              <KV label="Confirmed by" value={portalData.customer} />
              <KV label="Confirmed at" value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
              <KV label="Response" value="Yes, service restored" />
              <KV label="Case status" value="Monitoring" />
              <KV label="Reference" value="CONF-009184" />
            </div>
          </div>

          <Button variant="teal" className="w-full text-xs" onClick={handleModalClose}>
            Close window
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-amber-50 p-6 border border-amber-200">
            <AlertTriangle className="h-10 w-10 text-amber-600 mb-2" />
            <h3 className="text-xl font-bold text-slate-900">Follow-up initiated</h3>

            <div className="mt-4 space-y-1 text-xs">
              <KV label="Case status" value="Open - Follow-up in progress" />
              <KV label="Follow-up task" value="TASK001842" />
              <KV label="Expected contact" value="Within 15 minutes" />
              <KV label="Submitted by" value={portalData.customer} />
              <KV label="Submitted at" value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
            </div>
          </div>

          <Button variant="teal" className="w-full text-xs" onClick={handleModalClose}>
            Close window
          </Button>
        </div>
      )}
    </Modal>
  );
};
