import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge, Button } from '../UIPrimitives';
import { CustomerOrderItem, PageType } from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  ArrowRight, 
  RefreshCw, 
  PlusCircle, 
  Network, 
  Smartphone, 
  PhoneCall, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface OrdersPageProps {
  onNavigate: (page: PageType, param?: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<CustomerOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Pending Acceptance' | 'Completed'>('All');

  const loadOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const orderList = await serviceNowRestService.fetchOrders();
      setOrders(orderList);
    } catch (err) {
      console.warn('Failed to load orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (filter === 'In Progress') return o.status === 'In Progress';
    if (filter === 'Pending Acceptance') return o.status === 'Pending Acceptance';
    if (filter === 'Completed') return o.status === 'Completed';
    return true;
  });

  const getItemIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('broadband') || c.includes('circuit') || c.includes('fiber')) return <Network className="h-3.5 w-3.5 text-blue-600" />;
    if (c.includes('mobile') || c.includes('sim')) return <Smartphone className="h-3.5 w-3.5 text-emerald-600" />;
    if (c.includes('voice') || c.includes('trunk') || c.includes('sip')) return <PhoneCall className="h-3.5 w-3.5 text-purple-600" />;
    return <Package className="h-3.5 w-3.5 text-slate-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Delivery & Provisioning Hub"
          title="Customer Project Orders"
          description="Real-time delivery tracking, circuit provisioning stages, civil works milestones, and hardware dispatch."
        />

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs py-2 px-3 border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </Button>

          <Button
            variant="teal"
            onClick={() => onNavigate('create-case')}
            className="flex items-center gap-1.5 text-xs py-2 px-3 shadow-sm font-semibold"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>+ Request New Service</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {(['All', 'In Progress', 'Pending Acceptance', 'Completed'] as const).map(tab => {
          const count = tab === 'All' ? orders.length : orders.filter(o => o.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-[#092E4C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                filter === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
          <span className="text-sm font-semibold text-slate-600">Loading project orders from ServiceNow...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 text-base">No orders matching this filter</h3>
          <p className="text-xs text-slate-500 mt-1">All active customer delivery projects will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="p-6 border-slate-200 hover:border-teal-300 transition shadow-xs">
              
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="font-mono text-xs font-bold text-teal-800">{order.orderNumber}</b>
                      <Badge tone={order.status === 'Completed' ? 'green' : (order.status === 'Pending Acceptance' ? 'purple' : 'blue')}>
                        {order.status}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-medium hidden md:inline">• {order.orderType}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{order.projectTitle}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Estimated Ready</div>
                    <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      <span>{order.estimatedDelivery}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Progress Bar */}
              <div className="my-5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-teal-600" />
                    <span>Current Stage: <b className="text-teal-800">{order.currentMilestone}</b></span>
                  </span>
                  <span className="font-mono font-bold text-teal-700">{order.progressPct}% Complete</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${order.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Milestone Stepper */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-4 text-xs pt-2">
                {order.stages.map((stage, sIdx) => (
                  <div 
                    key={sIdx} 
                    className={`p-2.5 rounded-xl border ${
                      stage.status === 'complete' 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                        : stage.status === 'current' 
                        ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold ring-1 ring-amber-300' 
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span>Step {sIdx + 1}</span>
                      {stage.status === 'complete' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : stage.status === 'current' ? (
                        <Clock className="h-3.5 w-3.5 text-amber-600 animate-spin" />
                      ) : null}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold line-clamp-1">{stage.name}</div>
                    {stage.date && <div className="text-[10px] font-mono mt-0.5 opacity-80">{stage.date}</div>}
                  </div>
                ))}
              </div>

              {/* Delivered Units Micro-Badges & Site Details */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Package Items:</span>
                  {order.items.map((item, iIdx) => (
                    <div 
                      key={iIdx} 
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-medium"
                    >
                      {getItemIcon(item.category)}
                      <span className="font-bold">{item.quantity} {item.unit}</span>
                      <span className="text-slate-500">· {item.status}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-slate-500 self-end sm:self-auto shrink-0">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{order.siteName} ({order.siteCode})</span>
                </div>
              </div>

            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
