import React from 'react';
import { PageHeader, Card, Badge, Button } from '../UIPrimitives';
import { PortalData } from '../../types/portalTypes';

interface ServiceDetailPageProps {
  portalData: PortalData;
  onNavigate: (page: any) => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({ portalData, onNavigate }) => {
  const currentService = portalData.servicesList.find(s => s.id === portalData.serviceId || s.name === portalData.service) || portalData.servicesList[0];
  const serviceName = currentService?.name || portalData.service || 'Managed Telecom Service';
  const serviceId = currentService?.id || portalData.serviceId || 'SVC-CI';
  const bandwidth = currentService?.bandwidth || portalData.bandwidth || '1 Gbps';
  const location = currentService?.location || portalData.location || 'Customer Site';
  const category = currentService?.category || 'Core WAN';
  const isDegraded = currentService?.status === 'Critical' || currentService?.status === 'Degraded';
  const availability = currentService?.availability || (isDegraded ? '92.1%' : '99.99%');
  const latency = currentService?.latency || (isDegraded ? 'Elevated (48ms)' : 'Normal (14ms)');
  const packetLoss = currentService?.packetLoss || (isDegraded ? '14.8%' : '0.0%');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Managed service"
        title={serviceName}
        description="Customer-facing service health and live assurance status."
        action={
          <Badge tone={isDegraded ? "red" : "green"}>
            {isDegraded ? "Degraded · Active Assurance" : "Operational · Healthy"}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        
        {/* Left Column: Service Details & Health Telemetry */}
        <div className="space-y-6">
          {/* Attributes Grid */}
          <Card className="p-6">
            <div className="grid gap-5 sm:grid-cols-4">
              {[
                ["Service ID", serviceId],
                ["Bandwidth", bandwidth],
                ["Location", location],
                ["Category", category]
              ].map(([a, b]) => (
                <div key={a}>
                  <div className="text-xs font-medium text-slate-500">{a}</div>
                  <b className="mt-1 block text-sm font-bold text-slate-900">{b}</b>
                </div>
              ))}
            </div>
          </Card>

          {/* Current Service Health Telemetry */}
          <Card className="p-6">
            <h3 className="font-bold text-slate-900 text-sm">Live Service Health Telemetry</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium text-slate-500">Availability</div>
                <b className="mt-1 block text-sm font-bold text-slate-900">{availability}</b>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium text-slate-500">Latency</div>
                <b className="mt-1 block text-sm font-bold text-slate-900">{latency}</b>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-medium text-slate-500">Packet Loss</div>
                <b className="mt-1 block text-sm font-bold text-slate-900">{packetLoss}</b>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Live telemetry ingested directly from ServiceNow CMDB & network monitoring sensors.
            </p>
          </Card>
        </div>

        {/* Right Column: Active Case Card */}
        <div>
          <Card className="bg-amber-50/60 border-amber-200 p-6">
            <h3 className="font-bold text-slate-900 text-sm">Active Case</h3>
            <div className="mt-2 text-2xl font-black text-slate-900">{portalData.caseNumber || 'No Active Incident'}</div>
            <div className="mt-2">
              <Badge tone={portalData.caseNumber ? "amber" : "green"}>
                {portalData.caseNumber ? "In Assurance" : "Operational"}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              {portalData.caseNumber 
                ? "This service has an active ticket logged with the Network Operations Center." 
                : "All monitoring thresholds normal. No active degradation logged."}
            </p>
            {portalData.caseNumber && (
              <Button variant="primary" className="mt-5 w-full text-xs" onClick={() => onNavigate('case-detail')}>
                View Case Details
              </Button>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
