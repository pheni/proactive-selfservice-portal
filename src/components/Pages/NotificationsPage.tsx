import React, { useState } from 'react';
import { PageHeader, Card, Badge, Button } from '../UIPrimitives';
import { ApprovedUpdate, PortalData, NotificationItem } from '../../types/portalTypes';
import { Bell, AlertTriangle, CheckCircle2, Wrench, Check, ArrowRight } from 'lucide-react';

interface NotificationsPageProps {
  portalData: PortalData;
  updates: ApprovedUpdate[];
  onNavigate: (page: any) => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onToggleRead: (id: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ 
  portalData, 
  updates, 
  onNavigate,
  notifications,
  onMarkAllRead,
  onToggleRead
}) => {
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Incidents' | 'Maintenance'>('All');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.isRead;
    if (filter === 'Incidents') return n.type === 'incident';
    if (filter === 'Maintenance') return n.type === 'maintenance';
    return true;
  });

  const getSeverityBadge = (sev: string) => {
    if (sev === 'P1') return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">P1 · Critical</span>;
    if (sev === 'P2') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">P2 · High</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Notice</span>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Communication centre"
          title="Notifications & Alerts"
          description="Operational announcements, live incident milestones, and maintenance advisories."
        />

        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 text-xs py-2 px-3 self-start sm:self-auto hover:border-slate-300"
          >
            <Check className="h-4 w-4 text-teal-600" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {(['All', 'Unread', 'Incidents', 'Maintenance'] as const).map(tab => {
          const count = tab === 'All' ? notifications.length :
                        tab === 'Unread' ? unreadCount :
                        tab === 'Incidents' ? notifications.filter(n => n.type === 'incident').length :
                        notifications.filter(n => n.type === 'maintenance').length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-[#092E4C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              <span>{tab}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filter === tab ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List (Unified Enterprise Card Rhythm) */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <Card 
            key={item.id} 
            className={`p-5 transition hover:shadow-xs ${
              !item.isRead 
                ? 'border-l-4 border-l-teal-500 bg-teal-50/15 border-slate-200' 
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                {/* Icon based on notification type */}
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  item.type === 'incident' ? 'bg-amber-100 text-amber-800' :
                  item.type === 'resolution' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {item.type === 'incident' ? <AlertTriangle className="h-5 w-5" /> :
                   item.type === 'resolution' ? <CheckCircle2 className="h-5 w-5" /> :
                   <Wrench className="h-5 w-5" />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    {getSeverityBadge(item.severity)}
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" title="Unread" />
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {item.summary}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span className="text-slate-700 font-semibold">{item.service}</span>
                    <span>•</span>
                    <span className="font-mono">{item.timestamp}</span>
                    {item.caseNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-teal-700 font-bold">Case {item.caseNumber}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {item.caseNumber && (
                  <Button
                    variant="teal"
                    onClick={() => onNavigate('case-detail')}
                    className="text-xs py-1.5 px-3 flex items-center gap-1 shadow-xs"
                  >
                    <span>View Case</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}

                <button
                  onClick={() => onToggleRead(item.id)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 font-medium"
                >
                  {item.isRead ? 'Mark unread' : 'Dismiss'}
                </button>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="p-12 text-center text-slate-500 text-xs">
            <Bell className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <b className="text-slate-700 text-sm block">No notifications</b>
            <p className="mt-1 text-slate-400">All alerts in this category have been acknowledged.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
