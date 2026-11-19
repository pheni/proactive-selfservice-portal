import React from 'react';
import { PageHeader, Card, Button } from '../UIPrimitives';
import { PortalData } from '../../types/portalTypes';
import { LogOut } from 'lucide-react';

interface ProfilePreferencesPageProps {
  portalData: PortalData;
  onNavigate: (page: any) => void;
  onLogout: () => void;
}

export const ProfilePreferencesPage: React.FC<ProfilePreferencesPageProps> = ({ portalData, onNavigate, onLogout }) => {
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
