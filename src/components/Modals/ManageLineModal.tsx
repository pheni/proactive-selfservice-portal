import React, { useState } from 'react';
import { Modal, Button, Badge, KV } from '../UIPrimitives';
import { MobileSubscriptionItem } from '../../types/portalTypes';
import { 
  Smartphone, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  PauseCircle, 
  PlayCircle, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  SlidersHorizontal 
} from 'lucide-react';

interface ManageLineModalProps {
  open: boolean;
  onClose: () => void;
  subscription: MobileSubscriptionItem | null;
  onUpdateStatus: (id: string, newStatus: 'Active' | 'Suspended') => void;
  onModifyPlan: (id: string, newPlan: string, newCost: number) => void;
}

export const ManageLineModal: React.FC<ManageLineModalProps> = ({
  open,
  onClose,
  subscription,
  onUpdateStatus,
  onModifyPlan
}) => {
  const [activeAction, setActiveAction] = useState<'overview' | 'changePlan' | 'topUp' | 'simSwap'>('overview');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!subscription) return null;

  const handleToggleSuspend = () => {
    const nextStatus = subscription.status === 'Active' ? 'Suspended' : 'Active';
    onUpdateStatus(subscription.id, nextStatus);
    setSuccessMessage(`Line ${subscription.phoneNumber} is now ${nextStatus}.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleUpgradePlan = (planName: string, cost: number) => {
    onModifyPlan(subscription.id, planName, cost);
    setSuccessMessage(`Plan upgraded to ${planName}. Unlimited data cap activated.`);
    setActiveAction('overview');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleTopUp = () => {
    setSuccessMessage(`+20 GB Priority Data Top-Up successfully credited to ${subscription.phoneNumber}.`);
    setActiveAction('overview');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleSimSwap = () => {
    setSuccessMessage(`eSIM QR profile generated and dispatched to ${subscription.assignedUser}. Old physical SIM invalidated.`);
    setActiveAction('overview');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const dataPercent = subscription.dataLimitGB > 0 
    ? Math.min(100, Math.round((subscription.dataUsedGB / subscription.dataLimitGB) * 100))
    : 100;

  return (
    <Modal
      open={open}
      title={`Manage Subscription · ${subscription.phoneNumber}`}
      onClose={() => {
        setActiveAction('overview');
        setSuccessMessage(null);
        onClose();
      }}
    >
      <div className="space-y-5">
        {/* Success Toast */}
        {successMessage && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Hero Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
              subscription.status === 'Active' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-200 text-slate-600'
            }`}>
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 font-mono text-base">{subscription.phoneNumber}</span>
                <Badge tone={subscription.status === 'Active' ? 'green' : 'slate'}>{subscription.status}</Badge>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {subscription.device} · {subscription.assignedUser} ({subscription.department})
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Plan Cost</div>
            <div className="text-lg font-black text-slate-900 font-mono">£{subscription.monthlyCost.toFixed(2)}/mo</div>
          </div>
        </div>

        {/* Action Tabs Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveAction('overview')}
            className={`flex-1 py-1.5 rounded-lg transition ${activeAction === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
          >
            Overview & Telemetry
          </button>
          <button
            onClick={() => setActiveAction('changePlan')}
            className={`flex-1 py-1.5 rounded-lg transition ${activeAction === 'changePlan' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
          >
            Change Plan
          </button>
          <button
            onClick={() => setActiveAction('topUp')}
            className={`flex-1 py-1.5 rounded-lg transition ${activeAction === 'topUp' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
          >
            Data Top-Up
          </button>
          <button
            onClick={() => setActiveAction('simSwap')}
            className={`flex-1 py-1.5 rounded-lg transition ${activeAction === 'simSwap' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
          >
            SIM Swap
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeAction === 'overview' && (
          <div className="space-y-4">
            {/* Cycle Usage Meter */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 text-teal-600" />
                  <span>Current Billing Cycle Consumption</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {subscription.dataUsedGB.toFixed(1)} GB {subscription.dataLimitGB > 0 ? `/ ${subscription.dataLimitGB} GB (${dataPercent}%)` : '/ Unlimited GB'}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    dataPercent >= 90 ? 'bg-rose-500' : dataPercent >= 70 ? 'bg-amber-500' : 'bg-teal-600'
                  }`}
                  style={{ width: `${Math.min(100, dataPercent)}%` }}
                />
              </div>
              {subscription.hasAlert && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 mt-2 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>{subscription.alertReason || "High utilization warning on this line."}</span>
                </div>
              )}
            </div>

            {/* Technical Metadata KV */}
            <div className="divide-y divide-slate-100 text-xs">
              <KV label="Active Tariff" value={subscription.plan} />
              <KV label="Hardware / Device" value={subscription.device} />
              <KV label="ICCID (SIM Number)" value={<span className="font-mono">{subscription.simNumber}</span>} />
              <KV label="Roaming Status" value={subscription.roamingPass ? "Active (EU / Global Roaming Enabled)" : "Domestic UK Only"} />
              <KV label="Provisioned Department" value={`${subscription.department} · ${subscription.assignedUser}`} />
            </div>

            {/* Included Value Add Features */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Included Fleet Features</div>
              <div className="flex flex-wrap gap-1.5">
                {subscription.features.map(feat => (
                  <span key={feat} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80">
                    {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant={subscription.status === 'Active' ? 'danger' : 'teal'}
                onClick={handleToggleSuspend}
                className="w-full flex items-center justify-center gap-2 text-xs py-2.5"
              >
                {subscription.status === 'Active' ? (
                  <>
                    <PauseCircle className="h-4 w-4" />
                    <span>Temporarily Suspend Line</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    <span>Re-Activate Line</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Change Plan */}
        {activeAction === 'changePlan' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Select an enterprise corporate tariff. Changes take effect on the carrier HLR immediately with pro-rated billing.
            </p>

            {[
              { name: "Executive 5G Ultra Unlimited", cost: 68.00, cap: "Unlimited GB", speed: "Uncapped 5G Gigabit", badge: "Recommended" },
              { name: "Logistics Fleet Pro 5G Unlimited", cost: 55.00, cap: "Unlimited GB", speed: "Priority 5G (Up to 300 Mbps)" },
              { name: "Field Engineering High-Data (100 GB)", cost: 60.00, cap: "100 GB Data", speed: "Standard 5G" }
            ].map(planOption => (
              <div 
                key={planOption.name}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                  subscription.plan === planOption.name ? 'border-teal-500 bg-teal-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <b className="text-xs font-bold text-slate-900">{planOption.name}</b>
                    {planOption.badge && <span className="text-[10px] bg-teal-100 text-teal-800 font-extrabold px-1.5 py-0.5 rounded">{planOption.badge}</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{planOption.cap} · {planOption.speed}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-xs text-slate-900">£{planOption.cost.toFixed(2)}/mo</div>
                  {subscription.plan === planOption.name ? (
                    <span className="text-[10px] text-teal-700 font-bold block mt-1">Current Plan</span>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => handleUpgradePlan(planOption.name, planOption.cost)}
                      className="text-[11px] py-1 px-2.5 mt-1 border-teal-500 text-teal-700 hover:bg-teal-50"
                    >
                      Select Plan
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Data Top-Up */}
        {activeAction === 'topUp' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Instantly inject high-priority data allowances onto this mobile line to bypass throttle caps.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-white text-center">
                <div className="font-extrabold text-base text-slate-900">+10 GB Boost</div>
                <div className="text-slate-500 mt-1">Valid 30 days</div>
                <div className="font-mono font-bold text-teal-700 mt-2">£8.00</div>
                <Button variant="outline" onClick={handleTopUp} className="mt-3 w-full text-xs py-1.5">
                  Apply +10 GB
                </Button>
              </div>

              <div className="p-4 rounded-xl border-2 border-teal-500/40 bg-teal-50/30 text-center relative overflow-hidden">
                <div className="font-extrabold text-base text-slate-900">+20 GB Power Boost</div>
                <div className="text-slate-500 mt-1">Valid 30 days</div>
                <div className="font-mono font-bold text-teal-700 mt-2">£14.00</div>
                <Button variant="teal" onClick={handleTopUp} className="mt-3 w-full text-xs py-1.5 shadow-xs">
                  Apply +20 GB
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: SIM Swap */}
        {activeAction === 'simSwap' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Lost a device or upgrading to a new smartphone? Trigger an instantaneous eSIM profile delivery or order an overnight replacement physical triple-SIM.
            </p>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-teal-600" />
                <span>Instant Digital eSIM Transfer (Recommended)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                A secure activation QR code will be encrypted and emailed to {subscription.assignedUser}. Old SIM deactivated automatically upon activation.
              </p>
              <Button variant="teal" onClick={handleSimSwap} className="text-xs py-2 px-3 w-full">
                Dispatch eSIM Profile
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
