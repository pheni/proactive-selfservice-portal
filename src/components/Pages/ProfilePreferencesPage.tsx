import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button } from '../UIPrimitives';
import { PortalData } from '../../types/portalTypes';
import { LogOut, Sparkles } from 'lucide-react';

interface ProfilePreferencesPageProps {
  portalData: PortalData;
  onNavigate: (page: any) => void;
  onLogout: () => void;
}

export const ProfilePreferencesPage: React.FC<ProfilePreferencesPageProps> = ({ portalData, onNavigate, onLogout }) => {
  const [deflectionEnabled, setDeflectionEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sn_feature_deflection_playbooks') !== 'false';
    }
    return true;
  });

  const toggleDeflection = () => {
    const nextVal = !deflectionEnabled;
    setDeflectionEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sn_feature_deflection_playbooks', String(nextVal));
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile and preferences"
        description="Manage customer profile, communication preferences and security."
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Contact details</h3>
          <div className="space-y-3 text-xs">
            {[
              ["First name", portalData.customer.split(' ')[0] || "Goutam"],
              ["Last name", portalData.customer.split(' ').slice(1).join(' ') || "Hazra"],
              ["Email", portalData.email],
              ["Telephone", portalData.phone]
            ].map(([label, val]) => (
              <div key={label}>
                <label className="block text-slate-500 font-bold mb-1">{label}</label>
                <input
                  type="text"
                  readOnly
                  value={val}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal text-slate-900 outline-none"
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 space-y-3">
            <h3 className="font-bold text-slate-900 text-base">Communication preferences</h3>
            <div className="space-y-3 text-xs">
              {[
                ["Portal notifications", "ON"],
                ["Email updates", "ON"],
                ["SMS for major issues", "OFF"]
              ].map(([item, val]) => (
                <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">{item}</span>
                  <b className="font-bold text-teal-700">{val}</b>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-3 border-purple-100 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Now Assist AI Preferences</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                deflectionEnabled ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {deflectionEnabled ? 'ACTIVE' : 'STANDARD'}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure intelligent telecom self-service diagnostic playbooks and case deflection behavior.
            </p>

            <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100/80 flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <div className="font-semibold text-xs text-slate-800">
                  Self-Service Deflection Playbooks
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  Offer step-by-step equipment diagnostics & check active outages before opening tickets
                </div>
              </div>
              
              <button
                type="button"
                role="switch"
                aria-checked={deflectionEnabled}
                onClick={toggleDeflection}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  deflectionEnabled ? 'bg-purple-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    deflectionEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="font-bold text-slate-900 text-base">Security & Session</h3>
            <Button variant="outline" className="w-full text-xs" onClick={() => onNavigate('security')}>
              View security and access activity
            </Button>
            <Button variant="outline" className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center justify-center gap-2" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Log out of portal session
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
