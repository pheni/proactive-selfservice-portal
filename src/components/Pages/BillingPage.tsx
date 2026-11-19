import React, { useState } from 'react';
import { PageHeader, Card, Badge, Button } from '../UIPrimitives';
import { PortalData, InvoiceLedgerItem } from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';
import { 
  CreditCard, 
  Download, 
  CheckCircle2, 
  Building2, 
  FileText, 
  Calendar, 
  RefreshCw, 
  Search, 
  Plus, 
  ShieldCheck, 
  ArrowUpRight, 
  AlertCircle, 
  Network, 
  Wifi, 
  Smartphone,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface BillingPageProps {
  portalData: PortalData;
  onNavigate: (page: any, param?: string) => void;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export const BillingPage: React.FC<BillingPageProps> = ({
  portalData,
  onNavigate,
  onSync,
  isSyncing = false
}) => {
  // Domain breakdown view (cherry-picked from CustomerAdminv2)
  const [activeDomain, setActiveDomain] = useState<'all' | 'wan' | 'fiber' | 'mobile'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Processing' | 'Due'>('All');
  
  // Payment and Autopay states
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceLedgerItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [invoiceToast, setInvoiceToast] = useState<string | null>(null);
  const [downloadingInv, setDownloadingInv] = useState<string | null>(null);

  // Corporate Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 'pm-1',
      type: 'BACS Direct Debit',
      institution: 'Barclays Enterprise Corporate Banking',
      accountNumber: '•••• 4920',
      sortCode: '20-00-00',
      isDefault: true,
      expiry: 'Continuous Mandate'
    },
    {
      id: 'pm-2',
      type: 'Corporate Purchasing Card',
      institution: 'American Express Enterprise',
      accountNumber: '•••• 3004',
      sortCode: 'N/A',
      isDefault: false,
      expiry: '09/28'
    },
    {
      id: 'pm-3',
      type: 'SEPA International B2B',
      institution: 'Deutsche Bank AG London',
      accountNumber: '•••• 1182',
      sortCode: 'DE89 ••••',
      isDefault: false,
      expiry: 'Continuous Mandate'
    }
  ]);

  // Invoice Ledger
  const [invoices] = useState<InvoiceLedgerItem[]>(() => {
    return portalData.invoices || serviceNowRestService.getInvoiceLedger();
  });

  const latestBill = invoices[0] || {
    id: 'INV-2026-003',
    billingPeriod: 'October 2026',
    amount: 8420.50,
    currency: 'GBP',
    status: 'Paid',
    dueDate: '28 Oct 2026',
    paymentMethod: 'BACS Direct Debit (•••• 4920)',
    breakdown: {
      fixedCircuits: 4200.00,
      mobileFleet: 2850.00,
      fiberBroadband: 1100.00,
      usageAddons: 270.50
    }
  };

  const handleDownloadInvoice = (invId: string) => {
    setDownloadingInv(invId);
    setTimeout(() => {
      setDownloadingInv(null);
      setInvoiceToast(`Tax Statement PDF exported: ${invId}.pdf`);
      setTimeout(() => setInvoiceToast(null), 3500);
    }, 700);
  };

  const handleSimulatePayment = () => {
    setShowPaymentModal(false);
    setInvoiceToast(`Statement payment of £${latestBill.amount.toLocaleString()} scheduled successfully via default BACS mandate.`);
    setTimeout(() => setInvoiceToast(null), 4000);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(search.toLowerCase()) || 
                          inv.billingPeriod.toLowerCase().includes(search.toLowerCase()) ||
                          inv.paymentMethod.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Financial & Commercial Command Center"
          title="Billing, Invoices & Statements"
          description="Consolidated monthly recurring charges (MRR), itemized telecom circuit invoices, tax statements, and automated payment mandates."
        />

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onSync && (
            <Button
              variant="outline"
              onClick={() => onSync()}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-xs py-2 px-3 border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => handleDownloadInvoice(latestBill.id)}
            className="flex items-center gap-1.5 text-xs py-2 px-3 border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Statement</span>
          </Button>

          <Button
            variant="teal"
            onClick={() => setShowAddMethodModal(true)}
            className="flex items-center gap-1.5 text-xs py-2 px-3 shadow-sm font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add Payment Mandate</span>
          </Button>
        </div>
      </div>

      {invoiceToast && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{invoiceToast}</span>
        </div>
      )}

      {/* Top 4 Executive Financial KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Current Statement Balance */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Latest Statement</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#092E4C]">
            £{latestBill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <Badge tone="green">{latestBill.status === 'Paid' ? 'Paid in Full' : 'Due for Payment'}</Badge>
            <span className="text-[11px] text-slate-500">Period: {latestBill.billingPeriod}</span>
          </div>
        </Card>

        {/* KPI 2: Next Auto-Debit */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Next Auto-Debit</span>
            <Calendar className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#092E4C]">28 Nov 2026</div>
          <div className="mt-2 flex items-center gap-1.5">
            <Badge tone="blue">BACS Direct Debit</Badge>
            <span className="text-[11px] text-slate-500">Mandate •••• 4920</span>
          </div>
        </Card>

        {/* KPI 3: Estate Monthly MRR */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Subscribed MRR</span>
            <Building2 className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#092E4C]">
            £8,420.50 <span className="text-xs font-normal text-slate-500">/ mo</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <Badge tone="purple">{portalData.servicesList?.length || 88} Total Assets</Badge>
            <span className="text-[11px] text-slate-500">Fixed + Fleet</span>
          </div>
        </Card>

        {/* KPI 4: Payment Terms & VAT Status */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Corporate Terms</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-black text-[#092E4C]">Net-30 SLA Terms</div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-slate-600">VAT: GB 892 1400 92</span>
          </div>
        </Card>
      </div>

      {/* Main Billing Management Card: Current Bill Overview & Service Breakdown */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Current Billing Statement
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">{latestBill.id}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Consolidated Telecom Statement · {latestBill.billingPeriod}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Governed under Master Services Agreement <span className="font-mono font-bold text-slate-700">CONT-00283</span> · Tata B2B Enterprise Services
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedInvoice(latestBill)}
              className="text-xs py-2 px-3 border-slate-300 hover:border-teal-400 flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-teal-600" />
              <span>Inspect Itemized Line Items</span>
            </Button>

            <Button
              variant="teal"
              onClick={() => setShowPaymentModal(true)}
              className="text-xs py-2 px-3 flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Pay Early / Schedule</span>
            </Button>
          </div>
        </div>

        {/* Domain Level Breakdown Switcher (Cherry-picked standard from CustomerAdminv2) */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Service Domain Charges Breakdown
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveDomain('all')}
                className={`px-3 py-1 rounded-lg transition ${activeDomain === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
              >
                All Consolidated
              </button>
              <button
                onClick={() => setActiveDomain('wan')}
                className={`px-3 py-1 rounded-lg transition ${activeDomain === 'wan' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
              >
                Core WAN (4)
              </button>
              <button
                onClick={() => setActiveDomain('fiber')}
                className={`px-3 py-1 rounded-lg transition ${activeDomain === 'fiber' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
              >
                Fiber Links (3)
              </button>
              <button
                onClick={() => setActiveDomain('mobile')}
                className={`px-3 py-1 rounded-lg transition ${activeDomain === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
              >
                Mobile Fleet (156)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Category 1: Fixed Core WAN Circuits */}
            <div className={`p-4 rounded-xl border transition ${activeDomain === 'wan' || activeDomain === 'all' ? 'border-teal-300 bg-teal-50/20 shadow-xs' : 'border-slate-200 bg-white opacity-70'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-teal-600" />
                  <span className="font-bold text-slate-700">Core WAN Circuits</span>
                </div>
                <Badge tone="green">4 Circuits</Badge>
              </div>
              <div className="mt-2 text-lg font-black text-slate-900 font-mono">
                £{latestBill.breakdown.fixedCircuits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">DIA, MPLS Trunk, SD-WAN, Cloud Connect</div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-teal-700 font-semibold">
                Flat recurring enterprise rate
              </div>
            </div>

            {/* Category 2: Mobile Fleet SIMs */}
            <div className={`p-4 rounded-xl border transition ${activeDomain === 'mobile' || activeDomain === 'all' ? 'border-purple-300 bg-purple-50/20 shadow-xs' : 'border-slate-200 bg-white opacity-70'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-purple-600" />
                  <span className="font-bold text-slate-700">Mobile Fleet & SIMs</span>
                </div>
                <Badge tone="purple">156 Lines</Badge>
              </div>
              <div className="mt-2 text-lg font-black text-slate-900 font-mono">
                £{latestBill.breakdown.mobileFleet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Zebra Rugged, Exec Handsets, IoT M2M</div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-purple-700 font-semibold">
                Tiered corporate data pool
              </div>
            </div>

            {/* Category 3: Dedicated Fiber Broadband */}
            <div className={`p-4 rounded-xl border transition ${activeDomain === 'fiber' || activeDomain === 'all' ? 'border-blue-300 bg-blue-50/20 shadow-xs' : 'border-slate-200 bg-white opacity-70'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-blue-600" />
                  <span className="font-bold text-slate-700">Fiber Broadband</span>
                </div>
                <Badge tone="blue">3 Links</Badge>
              </div>
              <div className="mt-2 text-lg font-black text-slate-900 font-mono">
                £{latestBill.breakdown.fiberBroadband.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">1 Gbps & 2 Gbps Symmetrical Fiber</div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-blue-700 font-semibold">
                Optical tail termination included
              </div>
            </div>

            {/* Category 4: Telemetry & Bursting Add-ons */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span className="font-bold text-slate-700">Usage & Add-ons</span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Variable
                </span>
              </div>
              <div className="mt-2 text-lg font-black text-slate-900 font-mono">
                £{latestBill.breakdown.usageAddons.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Roaming passes & 95th percentile burst</div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                Audited against SLA thresholds
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Two-Column Layout: Payment Mandates vs Autopay Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Active Corporate Payment Mandates */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registered Corporate Payment Mandates</h3>
                <p className="text-xs text-slate-500 mt-0.5">Authorised banking accounts, BACS mandates, and purchasing cards for monthly reconciliation</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAddMethodModal(true)}
                className="text-xs py-1.5 px-3 border-slate-300 hover:border-teal-400 flex items-center gap-1 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Mandate</span>
              </Button>
            </div>

            <div className="space-y-3">
              {paymentMethods.map(method => (
                <div
                  key={method.id}
                  className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    method.isDefault ? 'border-teal-300 bg-teal-50/20' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      method.type.includes('BACS') || method.type.includes('SEPA') ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{method.institution}</span>
                        {method.isDefault && (
                          <Badge tone="green">Default Autopay</Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{method.type}</span>
                        <span>·</span>
                        <span className="font-mono font-bold text-slate-700">{method.accountNumber}</span>
                        <span>·</span>
                        <span className="text-[11px] text-slate-400">{method.expiry}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {!method.isDefault && (
                      <button
                        onClick={() => {
                          setPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === method.id })));
                          setInvoiceToast(`Set ${method.institution} as primary payment mandate.`);
                          setTimeout(() => setInvoiceToast(null), 3000);
                        }}
                        className="text-xs font-semibold text-teal-700 hover:underline px-2 py-1"
                      >
                        Set as Default
                      </button>
                    )}
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      Verified Mandate
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): Autopay & Invoicing Preferences */}
        <div>
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Corporate Billing Governance</h3>
              <p className="text-xs text-slate-500 mb-4">Automated reconciliation and tax address</p>

              {/* Autopay Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-900">Continuous Autopay</span>
                  </div>
                  <button
                    onClick={() => {
                      setAutoPayEnabled(!autoPayEnabled);
                      setInvoiceToast(autoPayEnabled ? "Autopay paused. Manual statement approvals required." : "Autopay activated on default BACS mandate.");
                      setTimeout(() => setInvoiceToast(null), 3000);
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      autoPayEnabled ? 'bg-teal-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        autoPayEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Monthly statements automatically cleared on the 28th via BACS Direct Debit without incurring late penalties.
                </p>
              </div>

              {/* Invoicing Contact & Delivery */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Tax Entity</span>
                  <span className="font-bold text-slate-900">Tata B2B Enterprise Services UK Ltd</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Registered Address</span>
                  <span className="text-slate-700">10 Collyer Quay, London & Global Hubs</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Primary Invoicing Lead</span>
                  <span className="text-slate-700">Goutam Hazra (goutam.hazra@tata-enterprise.com)</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Statement Format</span>
                  <span className="font-mono text-slate-700">PDF + CSV (EDI 810 Compatible)</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Electronic Billing Status:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Paperless 100% Active</span>
              </span>
            </div>
          </Card>
        </div>

      </div>

      {/* Commercial Invoices Ledger Table */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Commercial Invoices & Statement Archive</h3>
            <p className="text-xs text-slate-500 mt-0.5">Audited monthly billing statements with downloadable legal VAT tax receipts</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice or period..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-teal-500 w-48 sm:w-56"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-teal-500 font-medium"
            >
              <option value="All">All Invoices</option>
              <option value="Paid">Paid Only</option>
              <option value="Processing">Processing</option>
              <option value="Due">Due Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Billing Period</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Settlement Mandate</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {inv.id}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {inv.billingPeriod}
                  </td>
                  <td className="py-3 px-4 font-mono font-black text-slate-900">
                    £{inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    <Badge tone={inv.status === 'Paid' ? 'green' : (inv.status === 'Processing' ? 'blue' : 'amber')}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {inv.paymentMethod}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {inv.dueDate}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedInvoice(inv)}
                        className="py-1 px-2.5 text-[11px] border-slate-200 hover:border-teal-400 font-semibold text-slate-700"
                        title="View itemized service breakdown"
                      >
                        Itemized
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleDownloadInvoice(inv.id)}
                        disabled={downloadingInv === inv.id}
                        className="py-1 px-2.5 text-[11px] border-slate-200 hover:border-teal-400 text-teal-700 font-semibold flex items-center gap-1"
                        title="Download official VAT Tax PDF"
                      >
                        {downloadingInv === inv.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin text-teal-600" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        <span>PDF</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL 1: Itemized Circuit Line Items Breakdown Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#092E4C] text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Itemized Billing Statement</span>
                <h3 className="text-lg font-extrabold mt-0.5">{selectedInvoice.id} · {selectedInvoice.billingPeriod}</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Billed Account</span>
                  <b className="text-slate-900 text-sm">Tata B2B Enterprise Services</b>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Total Statement Due</span>
                  <b className="text-base font-black text-teal-700 font-mono">
                    £{selectedInvoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </b>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Itemized Telecom Asset Line Items</h4>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  <div className="p-3 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="font-bold text-slate-900">1 Gbps Primary Optical MPLS Trunk (CKT-PUN-001)</div>
                      <div className="text-[11px] text-slate-500">Core WAN · Pune Technical Center Hub</div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">£1,800.00</span>
                  </div>

                  <div className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <div className="font-bold text-slate-900">Enterprise SD-WAN Gateway (SDW-1000-MCH)</div>
                      <div className="text-[11px] text-slate-500">Core WAN · Regional Logistics Hub, Manchester</div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">£1,200.00</span>
                  </div>

                  <div className="p-3 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="font-bold text-slate-900">Cloud Connect Express 500M (CCE-500-SLG)</div>
                      <div className="text-[11px] text-slate-500">AWS DirectConnect Cross-Connect · Slough Primary DC</div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">£850.00</span>
                  </div>

                  <div className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <div className="font-bold text-slate-900">Managed SIP Voice Trunking 30 Channels (SIP-30-LON)</div>
                      <div className="text-[11px] text-slate-500">Corporate Telephony SBC Trunk · Head Office London</div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">£350.00</span>
                  </div>

                  <div className="p-3 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="font-bold text-slate-900">Workplace Dedicated Optical Fibre (LON-CW-FIB-9002)</div>
                      <div className="text-[11px] text-slate-500">Fiber Broadband · 1 Gbps / 1 Gbps Symmetrical · Canary Wharf</div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">£1,100.00</span>
                  </div>

                  <div className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <div className="font-bold text-slate-900">Mobile Fleet 5G Subscriptions Pool (156 SIMs)</div>
                      <div className="text-[11px] text-slate-500">Logistics Zebra Rugged, Field Engineers, Exec Handsets, IoT M2M</div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">£2,850.00</span>
                  </div>

                  <div className="p-3 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="font-bold text-slate-900">Bandwidth Bursting & International Roaming Passes</div>
                      <div className="text-[11px] text-slate-500">Telemetry overages & UK/EU Cross-Border Roaming passes</div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">£270.50</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">UK B2B Telecommunications VAT (Reverse Charge Protocol):</span>
                <span className="font-mono font-bold text-slate-700">£0.00 (0%)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedInvoice(null)}
                className="text-xs py-2 px-4 border-slate-300"
              >
                Close
              </Button>
              <Button
                variant="teal"
                onClick={() => {
                  handleDownloadInvoice(selectedInvoice.id);
                  setSelectedInvoice(null);
                }}
                className="text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Tax Invoice PDF</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Ad-Hoc / Early Statement Payment Flow (CustomerAdminv2 Cherry-Pick) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#092E4C] text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Settlement Authorization</span>
                <h3 className="text-lg font-extrabold mt-0.5">Authorise Statement Payment</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Invoice Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{latestBill.id}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-teal-100">
                  <span className="text-slate-700 font-bold">Total Payable:</span>
                  <span className="font-mono font-black text-teal-800 text-lg">
                    £{latestBill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Select Payment Mandate</span>
                <div className="space-y-2">
                  {paymentMethods.map(pm => (
                    <div
                      key={pm.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-400 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-teal-600" />
                        <div>
                          <div className="font-bold text-slate-900">{pm.type}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{pm.institution} · {pm.accountNumber}</div>
                        </div>
                      </div>
                      <span className="h-4 w-4 rounded-full border-2 border-teal-600 bg-teal-600 flex items-center justify-center text-white text-[10px]">
                        ✓
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="text-xs py-2 px-4 border-slate-300"
              >
                Cancel
              </Button>
              <Button
                variant="teal"
                onClick={handleSimulatePayment}
                className="text-xs py-2 px-4 shadow-sm font-semibold"
              >
                Confirm Payment (£{latestBill.amount.toLocaleString()})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Payment Mandate Modal */}
      {showAddMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-[#092E4C] text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Commercial Banking</span>
                <h3 className="text-lg font-extrabold mt-0.5">Add Corporate Payment Mandate</h3>
              </div>
              <button
                onClick={() => setShowAddMethodModal(false)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mandate Type</label>
                <select className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium">
                  <option>BACS Direct Debit Mandate (UK GBP)</option>
                  <option>SEPA B2B Direct Debit (Eurozone EUR)</option>
                  <option>Corporate Purchasing Card (P-Card)</option>
                  <option>ACH Electronic Funds Transfer (US USD)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Banking Institution</label>
                <input
                  type="text"
                  placeholder="e.g. HSBC Commercial Banking"
                  defaultValue="HSBC Commercial Banking"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sort Code / Routing</label>
                  <input
                    type="text"
                    placeholder="40-05-15"
                    defaultValue="40-05-15"
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="•••• 7712"
                    defaultValue="82917712"
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                Authorising this corporate BACS mandate allows automated clearing of monthly recurring telecom charges under Master Agreement CONT-00283.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowAddMethodModal(false)}
                className="text-xs py-2 px-4 border-slate-300"
              >
                Cancel
              </Button>
              <Button
                variant="teal"
                onClick={() => {
                  setShowAddMethodModal(false);
                  setInvoiceToast("New corporate BACS mandate registered and verified with Barclays clearing house.");
                  setTimeout(() => setInvoiceToast(null), 3500);
                }}
                className="text-xs py-2 px-4 shadow-sm font-semibold"
              >
                Save Mandate
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
