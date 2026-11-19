// src/components/B2CTelecomAssistant.tsx
import React, { useState } from 'react';

export interface PortalCustomer {
  name: string;
  email: string;
  accountNumber?: string;
}

interface B2CTelecomAssistantProps {
  /** The logged-in customer on your AWS Amplify Portal */
  customer?: PortalCustomer;
}

export const B2CTelecomAssistant: React.FC<B2CTelecomAssistantProps> = ({ customer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const activeCustomer: PortalCustomer = customer || {
    name: 'Goutam Hazra',
    email: 'goutam.hazra@tataglobal.com',
    accountNumber: 'ACC-TATA-9941',
  };

  // Construct the ServiceNow Now Assist Web Client URL
  const buildAssistantUrl = () => {
    const params = new URLSearchParams({
      sysparm_nostack: 'true',
      sysparm_stack: 'no',
      sysparm_nowassist: 'true',
      sysparm_branding_key: 'now_assist_in_va',
      sysparm_skip_load_history: 'true',
      sysparm_load_active_only: 'true',
      sysparm_portal: '72be85142bc81b1016f8f0aef291bfb9',
      sysparm_agent: '4ea367c92b989310c4d0f7d54391bf26', // B2C Telecom Selfcare Assistant
      sysparm_context_profile: '8aa367c92b989310c4d0f7d54391bf2e', // B2C Selfcare AI Assistant Profile
      // Pass the authenticated customer identity into vaContext/vaVars
      sysparm_liveagent_user_name: activeCustomer.name,
      sysparm_liveagent_consumer_email: activeCustomer.email,
      sysparm_user_name: activeCustomer.name,
      sysparm_user_email: activeCustomer.email,
      ...(activeCustomer.accountNumber ? { sysparm_account_number: activeCustomer.accountNumber } : {}),
    });

    return `https://tataamericaintlcorpdemo3.service-now.com/$sn-va-web-client-app.do?${params.toString()}`;
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {isOpen && (
        <div
          style={{
            width: 410,
            height: 640,
            marginBottom: 14,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.22)',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #cbd5e1',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #003366 0%, #0055a5 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Tata Telecom Assurance</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                👤 {activeCustomer.name} ({activeCustomer.email})
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSessionKey((k) => k + 1)}
                title="Reset conversation"
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                ↻ Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: 18,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Context Banner */}
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: '#f0f7ff',
              borderBottom: '1px solid #dbeafe',
              fontSize: 12,
              color: '#1e3a8a',
            }}
          >
            Authenticated as <strong>{activeCustomer.name}</strong> • All 6 Telecom Selfcare Skills Ready
          </div>

          {/* Assistant Web Client Frame */}
          <iframe
            key={sessionKey}
            src={buildAssistantUrl()}
            title="Tata Telecom Selfcare Assistant"
            style={{ width: '100%', flex: 1, border: 'none' }}
            allow="microphone; clipboard-read; clipboard-write"
          />
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '14px 22px',
          borderRadius: 30,
          border: 'none',
          background: 'linear-gradient(135deg, #003366 0%, #0055a5 100%)',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0, 85, 165, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>💬</span>
        <span>{isOpen ? 'Close Assistant' : `Hi ${activeCustomer.name.split(' ')[0]}, Need Help?`}</span>
      </button>
    </div>
  );
};

export default B2CTelecomAssistant;
