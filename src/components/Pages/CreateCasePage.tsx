import React, { useState } from 'react';
import { PageHeader, Card, Button } from '../UIPrimitives';
import { PortalData, PageType, CreateCasePayload } from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';
import { 
  FilePlus, 
  CheckCircle2, 
  AlertTriangle, 
  Network, 
  Clock, 
  ShieldCheck, 
  Upload, 
  ArrowLeft,
  Send,
  Building2,
  User,
  Mail,
  Phone
} from 'lucide-react';

interface CreateCasePageProps {
  portalData: PortalData;
  preselectedServiceId?: string;
  onNavigate: (page: PageType) => void;
  onCaseCreated?: () => void;
}

export const CreateCasePage: React.FC<CreateCasePageProps> = ({
  portalData,
  preselectedServiceId,
  onNavigate,
  onCaseCreated
}) => {
  const initialService = portalData.servicesList.find(s => s.id === preselectedServiceId) || portalData.servicesList[0];

  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialService?.id || portalData.servicesList[0]?.id || '');
  const [category, setCategory] = useState<string>('Service Degradation / Latency');
  const [priority, setPriority] = useState<'P1 - Critical' | 'P2 - High' | 'P3 - Moderate' | 'P4 - Minor'>('P2 - High');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [contactName, setContactName] = useState<string>(portalData.customer);
  const [contactEmail, setContactEmail] = useState<string>(portalData.email);
  const [contactPhone, setContactPhone] = useState<string>(portalData.phone);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    caseNumber: string;
    incidentReference: string;
    slaTarget: string;
  } | null>(null);

  const currentService = portalData.servicesList.find(s => s.id === selectedServiceId) || initialService;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f: File) => f.name);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setSubmitting(true);

    try {
      const payload: CreateCasePayload = {
        serviceId: selectedServiceId,
        serviceName: currentService?.name || 'Managed Service',
        category,
        priority,
        subject,
        description: description || 'No detailed steps provided by user.',
        contactName,
        contactEmail,
        contactPhone
      };

      const result = await serviceNowRestService.createSupportCase(payload);
      setSubmitting(false);
      if (onCaseCreated) {
        onCaseCreated();
      }
      setCreatedResult({
        caseNumber: result.caseNumber,
        incidentReference: result.incidentReference,
        slaTarget: result.slaTarget
      });
    } catch (err) {
      console.error("Failed to create case:", err);
      setSubmitting(false);
    }
  };

  if (createdResult) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onNavigate('cases')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Cases
        </button>

        <Card className="p-8 text-center max-w-2xl mx-auto border-2 border-emerald-500/30 shadow-xl bg-white rounded-3xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900">Support Case Created Successfully</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your case has been logged successfully and assigned to the Service Assurance Queue.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Case Number</span>
              <span className="font-mono text-base font-extrabold text-[#092E4C]">{createdResult.caseNumber}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Incident Reference</span>
              <span className="font-mono text-base font-extrabold text-teal-600">{createdResult.incidentReference}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Target Response SLA</span>
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-1">
                <Clock className="h-3.5 w-3.5" /> {createdResult.slaTarget}
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 text-left flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <b className="block text-blue-900">Real-time Notification Dispatched</b>
              <span>An automated confirmation email and SMS containing tracking credentials have been sent to <strong>{contactEmail}</strong>.</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="teal" onClick={() => onNavigate('cases')} className="w-full sm:w-auto">
              View Active Cases
            </Button>
            <Button variant="outline" onClick={() => { setCreatedResult(null); setSubject(''); setDescription(''); }} className="w-full sm:w-auto">
              Create Another Case
            </Button>
            <Button variant="outline" onClick={() => onNavigate('dashboard')} className="w-full sm:w-auto">
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('cases')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Cases
        </button>
        <span className="text-xs font-semibold text-slate-400">Step 1 of 1 • Case Submission</span>
      </div>

      <PageHeader
        eyebrow="Self-Service Support Portal"
        title="Create a Support Case"
        description="Raise a new support ticket directly with the Service Assurance engineering team."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Card 1: Service & Issue Classification */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <Network className="h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">Service & Issue Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Managed Service Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Impacted Service *
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-xs"
              >
                {portalData.servicesList.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} ({svc.bandwidth} - {svc.id}) [{svc.status}]
                  </option>
                ))}
                <option value="GENERAL-ACCT">General Account & Billing Support</option>
              </select>
              {currentService && (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Location: {currentService.location} • Status: <span className="font-bold text-teal-600">{currentService.status}</span>
                </p>
              )}
            </div>

            {/* Issue Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Issue Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-xs"
              >
                <option value="Service Degradation / Latency">Service Degradation / Packet Loss / Latency</option>
                <option value="Total Outage / Disconnection">Total Outage / Hard Disconnection</option>
                <option value="Configuration Change Request">Configuration / Router MACD Request</option>
                <option value="Billing & Contract Query">Billing, Invoicing & Contract Query</option>
                <option value="Hardware / Router Fault">Hardware / Physical Equipment Fault</option>
              </select>
            </div>
          </div>

          {/* Subject / Short Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Short Summary *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Intermittent latency spike on primary London DIA circuit"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-xs"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Detailed Description & Troubleshooting Steps Taken
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details such as affected IP addresses, timestamps, traceroute outputs, or impacted office departments..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-xs"
            />
          </div>

          {/* Diagnostic Log / Attachment Upload Simulation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Attach Diagnostic Logs or Screenshots (Optional)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition">
              <Upload className="mx-auto h-6 w-6 text-slate-400 mb-1" />
              <label htmlFor="file-upload" className="cursor-pointer text-xs font-bold text-teal-600 hover:text-teal-700">
                Click to upload files
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <span className="text-[11px] text-slate-400 block mt-0.5">Supports PNG, JPG, PDF, TXT, LOG up to 25MB</span>

              {uploadedFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  {uploadedFiles.map((fn, idx) => (
                    <span key={idx} className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-1 rounded-md">
                      {fn}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

        </Card>

        {/* Card 2: Contact Person Details */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-[#092E4C]" />
            <h3 className="font-bold text-slate-900 text-base">Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>
        </Card>



        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate('cases')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="teal"
            disabled={submitting || !subject.trim()}
            className="flex items-center gap-2 px-6"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Case...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Support Case
              </>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
};
