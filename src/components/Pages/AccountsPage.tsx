import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge, Button } from '../UIPrimitives';
import { 
  CustomerAccountDetails, 
  CustomerSiteItem, 
  PageType, 
  CorporateContractItem, 
  InvoiceLedgerItem 
} from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';
import { CorporateContractsModal } from '../Modals/CorporateContractsModal';
import { 
  Building2, 
  ShieldCheck, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Layers, 
  ArrowRight,
  Headphones,
  CreditCard,
  Download,
  Receipt,
  Wallet
} from 'lucide-react';

interface AccountsPageProps {
  onNavigate: (page: PageType, param?: string) => void;
  onOpenCall?: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ onNavigate, onOpenCall }) => {
  const [account, setAccount] = useState<CustomerAccountDetails | null>(null);
  const [sites, setSites] = useState<CustomerSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contractsModalOpen, setContractsModalOpen] = useState(false);
  const [downloadingInv, setDownloadingInv] = useState<string | null>(null);
  const [invoiceToast, setInvoiceToast] = useState<string | null>(null);

  const contracts: CorporateContractItem[] = serviceNowRestService.getCorporateContracts();
  const invoices: InvoiceLedgerItem[] = serviceNowRestService.getInvoiceLedger();

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const [accData, siteList] = await Promise.all([
        serviceNowRestService.fetchAccountDetails(),
        serviceNowRestService.fetchSites()
      ]);
      setAccount(accData);
      setSites(siteList);
    } catch (err) {
      console.warn('Failed to load account details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadInvoice = (invId: string) => {
    setDownloadingInv(invId);
    setTimeout(() => {
      setDownloadingInv(null);
      setInvoiceToast(`Exported VAT statement PDF: ${invId}.pdf`);
      setTimeout(() => setInvoiceToast(null), 3500);
    }, 800);
  };

  if (loading || !account) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
        <span className="text-sm font-semibold text-slate-600">Resolving customer enterprise account...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Enterprise Governance & Sites"
          title={account.accountName}
          description="Corporate contract tier, multi-site hierarchy, SLA commitments, billing ledgers, and dedicated account management team."
        />

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setContractsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs py-2 px-3 border-teal-500/40 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 transition shadow-xs"
            title="Inspect Master Services Agreements and SLA terms"
          >
            <FileText className="h-3.5 w-3.5 text-teal-600" />
            <span>View Governing MSAs & Contracts</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs py-2 px-3 border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </Button>
        </div>
      </div>

      {invoiceToast && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{invoiceToast}</span>
        </div>
      )}

      {/* Top Corporate Governance Hero Card */}
      <Card className="p-6 border border-slate-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#092E4C] text-white shrink-0 shadow-md">
              <Building2 className="h-7 w-7 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-slate-900">{account.accountName}</h2>
                <Badge tone="purple">{account.contractTier}</Badge>
                <span className="text-xs font-mono font-bold text-slate-400">{account.accountId}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Parent Account Reference · Industry: {account.industry || "Global Enterprise Logistics & Supply Chain"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="text-left sm:text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Governing Agreement</div>
              <div className="text-sm font-black text-slate-900 font-mono">{account.contractNumber}</div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Guaranteed Target</div>
              <div className="text-sm font-black text-emerald-600 font-mono">{account.uptimeSla} Uptime</div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Health Rating</div>
              <div className="text-sm font-black text-teal-700 font-mono">{account.healthScore}/100 Optimal</div>
            </div>
          </div>
        </div>

        {/* 4 Summary Micro-KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-slate-500 font-medium">Provisioned Sites</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">{account.sitesCount} Global Locations</div>
            <div className="text-[11px] text-teal-700 mt-0.5">100% SLA compliance rate</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-slate-500 font-medium">Active WAN & Fibre Lines</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">{account.activeServicesCount} Monitored Links</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Continuous telemetry active</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-slate-500 font-medium">Active Delivery Orders</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">{account.activeOrdersCount} In Delivery</div>
            <div className="text-[11px] text-teal-700 mt-0.5">On-schedule milestones</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-slate-500 font-medium">Open Support Tickets</div>
            <div className="text-xl font-black text-amber-600 font-mono mt-1">
              {account.openTicketsCount} {account.openTicketsCount === 1 ? 'Active Case' : 'Active Cases'}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">Under automated monitoring</div>
          </div>
        </div>
      </Card>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Sites Hierarchy & SLA Guarantees */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Multi-Site Hierarchy Card */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-teal-600" />
                  <span>Subscribed Enterprise Operating Sites</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-branch breakdown with active local circuit counts and site-specific SLA status.
                </p>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60 self-start sm:self-auto">
                {sites.length} Active Sites
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {sites.map(site => (
                <div key={site.id} className="py-4 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 font-mono shrink-0">
                      {site.siteCode}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <b className="text-sm font-bold text-slate-900">{site.name}</b>
                        <Badge tone={site.status === 'Operational' ? 'green' : 'amber'}>{site.status}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {site.address} · {site.city}, {site.country}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Tier: <span className="font-semibold text-slate-600">{site.tier}</span> · Assets: <span className="font-semibold text-slate-600">{site.assetCount} connected circuits</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">SLA Performance</div>
                      <b className={`text-xs font-bold ${site.status === 'Operational' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {site.slaCompliance}
                      </b>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate('services', site.siteCode)}
                      className="text-xs py-1.5 px-2.5 border-slate-300 hover:border-teal-400 text-slate-700"
                    >
                      View Circuits →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Commercial Billing & Invoice Ledger (Cherry-Picked Standard) */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-teal-600" />
                  <span>Commercial Billing & Invoice Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly telecommunications statements, BACS direct debit settlement, and pro-rated circuit usage.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  Total MTD: £8,420.50
                </span>
                <Button
                  variant="outline"
                  onClick={() => onNavigate('billing')}
                  className="text-xs py-1 px-2.5 border-slate-300 hover:border-teal-400 text-teal-700 font-semibold flex items-center gap-1"
                >
                  <span>Open Billing Hub</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Settlement Method</div>
                <div className="font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-teal-600" />
                  <span>BACS Direct Debit (•••• 4920)</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 font-semibold">Auto-Pay Enabled</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Unbilled Usage Est.</div>
                <div className="font-extrabold text-slate-900 mt-1 font-mono">£270.50</div>
                <div className="text-[11px] text-slate-500 mt-1">320 MB international roaming</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Next Settlement Date</div>
                <div className="font-extrabold text-slate-900 mt-1">28 October 2026</div>
                <div className="text-[11px] text-slate-500 mt-1">Consolidated corporate bill</div>
              </div>
            </div>

            {/* Invoices List */}
            <div className="divide-y divide-slate-100 text-xs">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <b className="font-mono text-slate-900">{inv.id}</b>
                        <span className="text-slate-500">· {inv.billingPeriod}</span>
                        <Badge tone="green">{inv.status}</Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Circuits: £{inv.breakdown.fixedCircuits.toFixed(2)} · Fleet: £{inv.breakdown.mobileFleet.toFixed(2)} · Fibre: £{inv.breakdown.fiberBroadband.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="font-mono font-black text-sm text-slate-900">
                      £{inv.amount.toFixed(2)}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadInvoice(inv.id)}
                      disabled={downloadingInv === inv.id}
                      className="text-xs py-1 px-2.5 border-slate-300 hover:border-teal-400 flex items-center gap-1.5"
                    >
                      <Download className={`h-3 w-3 ${downloadingInv === inv.id ? 'animate-bounce text-teal-600' : 'text-slate-500'}`} />
                      <span>{downloadingInv === inv.id ? 'Exporting...' : 'PDF'}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Contract SLA Commitments */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <span>Contractual Service Level Guarantees</span>
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-400 uppercase font-bold">Network Availability</span>
                <div className="text-sm font-extrabold text-slate-900 mt-1">99.99% Contractual Target</div>
                <p className="text-[11px] text-slate-500 mt-1">Guaranteed round-the-clock availability across core fiber links.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-400 uppercase font-bold">P1 Incident Response</span>
                <div className="text-sm font-extrabold text-slate-900 mt-1">&lt; 15 Minutes</div>
                <p className="text-[11px] text-slate-500 mt-1">Instant duty manager engagement with active crisis bridge.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-400 uppercase font-bold">Target MTTR (Resolution)</span>
                <div className="text-sm font-extrabold text-slate-900 mt-1">&lt; 4 Hours Guaranteed</div>
                <p className="text-[11px] text-slate-500 mt-1">Automated dispatch of optical field engineering crews.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-400 uppercase font-bold">Breach Remediation</span>
                <div className="text-sm font-extrabold text-slate-900 mt-1">Pre-Approved SLA Credit Vouchers</div>
                <p className="text-[11px] text-slate-500 mt-1">Automatic invoice deductions generated upon SLA breach confirmation.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Dedicated Account Team */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">Dedicated Account Team</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Assigned enterprise service management contacts for {account.accountName}.
            </p>

            <div className="space-y-3 text-xs">
              {/* Account Director */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Account Director</div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{account.accountTeam.accountDirector.name}</div>
                <div className="mt-2 space-y-1 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{account.accountTeam.accountDirector.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{account.accountTeam.accountDirector.phone}</span>
                  </div>
                </div>
              </div>

              {/* Technical Account Manager */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Technical Account Manager (TAM)</div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{account.accountTeam.technicalAccountManager.name}</div>
                <div className="mt-2 space-y-1 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{account.accountTeam.technicalAccountManager.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{account.accountTeam.technicalAccountManager.phone}</span>
                  </div>
                </div>
              </div>

              {/* NOC Escalation Desk */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">24/7 Platinum Escalation Desk</div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{account.accountTeam.escalationNocLead.name}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-900">{account.accountTeam.escalationNocLead.hotline}</span>
                  {onOpenCall && (
                    <Button variant="teal" onClick={onOpenCall} className="text-xs py-1 px-2.5">
                      Call NOC Desk
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Navigations */}
          <Card className="p-5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Customer Quick Links</h4>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('billing')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                <span>Billing Statements & Invoices</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('orders')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                <span>Track Active Project Orders</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('services')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                <span>Subscribed Services Inventory</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('cases')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                <span>Support Center & Assurance</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </Card>
        </div>

      </div>

      {/* Corporate Contracts Inspection Modal */}
      <CorporateContractsModal
        open={contractsModalOpen}
        onClose={() => setContractsModalOpen(false)}
        contracts={contracts}
      />
    </div>
  );
};
