import React, { useState, useEffect } from 'react';
import { RefreshCw, Terminal, Globe, X } from 'lucide-react';
import { serviceNowRestService } from '../services/servicenowApi';
import { ServiceNowCallLog } from '../types/portalTypes';
import { SERVICENOW_CONFIG, getServiceNowFullUrl } from '../config/servicenow.config';

interface ServiceNowRestInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceNowRestInspector: React.FC<ServiceNowRestInspectorProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ServiceNowCallLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ServiceNowCallLog | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState(getServiceNowFullUrl(SERVICENOW_CONFIG.tableApi.case));

  useEffect(() => {
    if (isOpen) {
      const currentLogs = serviceNowRestService.getCallLogs();
      setLogs(currentLogs);
      if (currentLogs.length > 0 && !selectedLog) {
        setSelectedLog(currentLogs[0]);
      }
      const config = serviceNowRestService.getRestConfig();
      setIsLiveMode(config.isLiveMode);
      setEndpointUrl(config.endpointUrl);
    }
  }, [isOpen]);

  const refreshLogs = () => {
    const fresh = serviceNowRestService.getCallLogs();
    setLogs(fresh);
    if (fresh.length > 0) setSelectedLog(fresh[0]);
  };

  const handleToggleMode = (live: boolean) => {
    setIsLiveMode(live);
    serviceNowRestService.setRestMode(live, endpointUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-xs flex items-center justify-end">
      <div className="bg-slate-900 border-l border-slate-700 text-white h-full w-full max-w-2xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                ServiceNow CSM REST API Inspector
              </h3>
              <p className="text-xs text-slate-400">Live HTTP Request/Response Audit Console</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={refreshLogs} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" /> API Connection Target:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleMode(false)}
                className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                  !isLiveMode ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Mock REST Mode
              </button>
              <button
                onClick={() => handleToggleMode(true)}
                className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                  isLiveMode ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Live ServiceNow URL
              </button>
            </div>
          </div>

          {isLiveMode && (
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">ServiceNow Instance REST Endpoint URL</label>
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => {
                  setEndpointUrl(e.target.value);
                  serviceNowRestService.setRestMode(true, e.target.value);
                }}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-emerald-300 outline-none"
              />
            </div>
          )}
        </div>

        {/* Console Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          
          {/* Left: Log List */}
          <div className="border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-950/40">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 pb-1">
              Audit Call Logs ({logs.length})
            </div>

            {logs.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 text-center">No REST calls logged yet. Perform an action on the portal to generate calls.</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                    selectedLog?.id === log.id
                      ? 'bg-purple-950/40 border-purple-500/50 ring-1 ring-purple-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      log.method === 'GET' ? 'bg-blue-900/60 text-blue-300 border border-blue-700' :
                      log.method === 'POST' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' :
                      'bg-amber-900/60 text-amber-300 border border-amber-700'
                    }`}>
                      {log.method}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>

                  <div className="font-mono text-[11px] text-slate-200 truncate">{log.endpoint}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center justify-between">
                    <span>{log.statusText}</span>
                    <span className="font-mono">{log.statusCode}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Detail Inspector */}
          <div className="overflow-y-auto p-4 bg-slate-950 font-mono text-xs space-y-4">
            {selectedLog ? (
              <>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Endpoint</span>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-purple-300 break-all">
                    {selectedLog.endpoint}
                  </div>
                </div>

                {selectedLog.requestPayload && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Request Payload (JSON)</span>
                    <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-[11px] overflow-x-auto leading-relaxed">
                      {JSON.stringify(selectedLog.requestPayload, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Response Payload (JSON)</span>
                  <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-emerald-300 text-[11px] overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedLog.responsePayload, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-center py-10">Select a log entry to view headers and JSON payload details.</div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Target Table: sn_customerservice_case</span>
          <span className="text-purple-400 font-semibold">ServiceNow CSM REST API v2</span>
        </div>

      </div>
    </div>
  );
};
