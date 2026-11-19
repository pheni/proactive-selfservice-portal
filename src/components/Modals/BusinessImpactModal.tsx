import React, { useState } from 'react';
import { Modal, Button, KV } from '../UIPrimitives';
import { PortalData, BusinessImpactPayload } from '../../types/portalTypes';
import { CheckCircle2, Send } from 'lucide-react';
import { serviceNowRestService } from '../../services/servicenowApi';

interface BusinessImpactModalProps {
  open: boolean;
  onClose: () => void;
  portalData: PortalData;
  onSubmitSuccess?: () => void;
}

export const BusinessImpactModal: React.FC<BusinessImpactModalProps> = ({
  open,
  onClose,
  portalData,
  onSubmitSuccess
}) => {
  const [stage, setStage] = useState<'form' | 'done'>('form');

  const [affectedApp, setAffectedApp] = useState('Dispatch platform');
  const [impactDesc, setImpactDesc] = useState('Dispatch operations delayed');
  const [location, setLocation] = useState('Head Office');
  const [usersAffected, setUsersAffected] = useState('120');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [comments, setComments] = useState('Users are experiencing dispatch delays.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    serviceNowRestService.submitBusinessImpact({
      affectedApplication: affectedApp,
      location,
      usersAffected,
      urgency,
      comments
    });
    setStage('done');
    if (onSubmitSuccess) onSubmitSuccess();
  };

  const handleModalClose = () => {
    setStage('form');
    onClose();
  };

  return (
    <Modal
      open={open}
      title={stage === 'done' ? 'Business impact submitted' : 'Add business impact'}
      onClose={handleModalClose}
    >
      {stage === 'done' ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-emerald-50 p-6 border border-emerald-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-2" />
            <h3 className="text-xl font-bold text-slate-900">Submission accepted</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Case {portalData.caseNumber} was updated. No additional Case was created. Information passed to internal workflow.
            </p>

            <div className="mt-4 space-y-1 text-xs">
              <KV label="Submitted by" value={portalData.customer} />
              <KV label="Submitted at" value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
              <KV label="Workflow reference" value={`${portalData.incidentReference}`} />
              <KV label="Urgency" value={urgency} />
            </div>
          </div>

          <Button variant="teal" className="w-full text-xs" onClick={handleModalClose}>
            Close window
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <p className="text-xs text-slate-500">
            This updates Case {portalData.caseNumber} without creating another Case.
          </p>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Affected application *</label>
            <input
              type="text"
              required
              value={affectedApp}
              onChange={(e) => setAffectedApp(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 font-medium text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Business impact description *</label>
            <input
              type="text"
              required
              value={impactDesc}
              onChange={(e) => setImpactDesc(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 font-medium text-slate-900 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 font-medium text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Users affected *</label>
              <input
                type="text"
                required
                value={usersAffected}
                onChange={(e) => setUsersAffected(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 font-medium text-slate-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Urgency *</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Low', 'Medium', 'High', 'Critical'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setUrgency(l)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition ${
                    urgency === l ? 'bg-teal-600 text-white border-teal-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Additional comments</label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 font-medium text-slate-900 outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleModalClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" variant="teal" className="text-xs flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5" />
              <span>Submit impact</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
