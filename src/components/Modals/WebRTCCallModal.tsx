import React, { useState, useEffect } from 'react';
import { Modal, Button, KV } from '../UIPrimitives';
import { PortalData } from '../../types/portalTypes';
import { PhoneCall, CheckCircle2, AlertTriangle, Mic, MicOff, PhoneOff } from 'lucide-react';
import { serviceNowRestService } from '../../services/servicenowApi';

interface WebRTCCallModalProps {
  open: boolean;
  onClose: () => void;
  portalData: PortalData;
}

export const WebRTCCallModal: React.FC<WebRTCCallModalProps> = ({ open, onClose, portalData }) => {
  const [state, setState] = useState<'ready' | 'connected' | 'complete' | 'failed'>('ready');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer: any;
    if (state === 'connected') {
      timer = setInterval(() => setDuration(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [state]);

  const handleStartCall = () => {
    setState('connected');
    setDuration(0);
  };

  const handleEndCall = async () => {
    setState('complete');
    await serviceNowRestService.logGenesysCallInteraction('Customer advised monitoring continues', duration);
  };

  const handleModalClose = () => {
    setState('ready');
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Modal open={open} title="Call support" onClose={handleModalClose}>
      {state === 'ready' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Authenticated account, service and Case context will be passed securely.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Subscriber</div>
              <b className="text-xs text-slate-900 block mt-0.5">{portalData.customer}</b>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Case</div>
              <b className="text-xs font-mono text-teal-700 block mt-0.5">{portalData.caseNumber}</b>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Service</div>
              <b className="text-xs text-slate-900 block mt-0.5">{portalData.service}</b>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Stage</div>
              <b className="text-xs text-amber-700 block mt-0.5">Monitoring</b>
            </div>
          </div>

          <p className="text-[11px] text-blue-800 bg-blue-50 p-3 rounded-xl border border-blue-100">
            Internal Incident details are not shared. Agent Case access is role-controlled.
          </p>

          <div className="flex gap-2">
            <Button variant="teal" className="flex-1 text-xs" onClick={handleStartCall}>
              Start secure call
            </Button>
            <Button variant="outline" className="text-xs" onClick={() => setState('failed')}>
              Simulate failure
            </Button>
          </div>
        </div>
      )}

      {state === 'connected' && (
        <div className="text-center py-4 space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-teal-600 animate-pulse">
            <PhoneCall className="h-10 w-10" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Connected to Service Assurance Support</h3>
            <p className="mt-1 text-xs text-slate-500">
              Duration: {formatTime(duration)} · {portalData.caseNumber} delivered · Agent context available
            </p>
          </div>

          <Button variant="danger" className="mx-auto text-xs flex items-center gap-1.5" onClick={handleEndCall}>
            <PhoneOff className="h-4 w-4" />
            <span>End call</span>
          </Button>
        </div>
      )}

      {state === 'complete' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-blue-50 p-6 border border-blue-200">
            <CheckCircle2 className="h-10 w-10 text-blue-600 mb-2" />
            <h3 className="text-xl font-bold text-slate-900">Call completed</h3>

            <div className="mt-4 space-y-1 text-xs">
              <KV label="Start time" value="10:42:16 AM" />
              <KV label="End time" value="10:48:52 AM" />
              <KV label="Duration" value={formatTime(duration)} />
              <KV label="Outcome" value="Customer advised monitoring continues" />
              <KV label="Interaction reference" value="GEN-INT-738492" />
              <KV label="Recorded against" value={portalData.caseNumber} />
            </div>
          </div>

          <Button variant="teal" className="w-full text-xs" onClick={handleModalClose}>
            Close window
          </Button>
        </div>
      )}

      {state === 'failed' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-red-50 p-6 border border-red-200">
            <AlertTriangle className="h-10 w-10 text-red-600 mb-2" />
            <h3 className="text-xl font-bold text-slate-900">Unable to start browser call</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Microphone permission was denied or the calling service is unavailable.
            </p>
          </div>

          <div className="grid gap-2">
            <Button variant="teal" className="w-full text-xs" onClick={() => setState('ready')}>
              Allow microphone and retry
            </Button>
            <Button variant="outline" className="w-full text-xs" onClick={handleModalClose}>
              Request a callback
            </Button>
            <Button variant="outline" className="w-full text-xs" onClick={handleModalClose}>
              Call 1800 000 000
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
