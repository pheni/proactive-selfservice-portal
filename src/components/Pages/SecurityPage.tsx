import React from 'react';
import { PageHeader, Card, KV, Button } from '../UIPrimitives';
import { PortalData } from '../../types/portalTypes';
import { LogOut } from 'lucide-react';

interface SecurityPageProps {
  portalData: PortalData;
  onLogout?: () => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ portalData, onLogout }) => {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Security and access activity"
        description="Customer-visible authentication and account access history."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current secure session */}
        <Card className="border-emerald-200 bg-emerald-50/40 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-4">Current secure session</h3>
            {[
              ["Authenticated customer", portalData.customer],
              ["Account", portalData.account || "Enterprise Account"],
              ["Authentication", "Password + Authenticator"],
              ["Session started", "24 Sep 2026, 8:12 PM"],
              ["Session reference", "SEC-20260924-1842"]
            ].map(([label, val]) => (
              <div key={label}>
                <KV label={label} value={val} />
              </div>
            ))}
          </div>

          {onLogout && (
            <Button
              variant="outline"
              onClick={onLogout}
              className="mt-6 w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Terminate Session & Log Out
            </Button>
          )}
        </Card>

        {/* Account access controls */}
        <Card className="border-blue-200 bg-blue-50/40 p-6">
          <h3 className="font-bold text-slate-900 text-base mb-4">Account access controls</h3>
          {[
            ["Authorised accounts", "1"],
            ["Managed services visible", "4"],
            ["Customer Cases visible", "2"],
            ["Operational records", "Not available"],
            ["Last access check", "Just now"]
          ].map(([label, val]) => (
            <div key={label}>
              <KV label={label} value={val} />
            </div>
          ))}
        </Card>
      </div>

      {/* Recent security activity */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 text-base">Recent security activity</h3>
        <p className="mt-2 text-xs text-slate-600">
          8:12 PM · Successful sign-in · Chrome on Windows · MFA verified
        </p>
      </Card>
    </div>
  );
};
