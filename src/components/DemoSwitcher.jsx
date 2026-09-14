import React from 'react';
import { useAuth } from '../context/AuthContext';
import * as mockStore from '../services/mockStorage';
import { Users, Sparkles, RotateCcw } from 'lucide-react';

export const DemoSwitcher = () => {
  const { userProfile, switchDemoUser, isLiveFirebase } = useAuth();

  if (isLiveFirebase) {
    return (
      <div className="demo-banner" style={{ background: '#064e3b' }}>
        <div className="demo-banner-content">
          <Sparkles size={14} style={{ color: '#34d399' }} />
          <span><strong>Firebase Live Mode Active</strong> &mdash; connected to Cloud Firestore & Auth.</span>
        </div>
      </div>
    );
  }

  const users = mockStore.getStoredUsers();

  return (
    <div className="demo-banner">
      <div className="demo-banner-content">
        <Users size={15} style={{ color: '#fbbf24' }} />
        <span>
          <strong>Hackathon Multi-Student Demo Mode</strong> &mdash; Quick Switch Persona:
        </span>
        <div className="demo-pills">
          {users.map(u => (
            <button
              key={u.uid}
              onClick={() => switchDemoUser(u.uid)}
              className={`demo-user-btn ${userProfile?.uid === u.uid ? 'active' : ''}`}
              title={`Switch to ${u.name} (${u.classLevel})`}
            >
              {u.name.split(' ')[0]} ({u.classLevel})
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Real-time 2-Tab Sync Ready</span>
        <button
          onClick={() => {
            if (window.confirm('Reset sample doubts and user balances to initial state?')) {
              mockStore.resetToInitialData();
            }
          }}
          className="demo-user-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)' }}
          title="Reset sample data"
        >
          <RotateCcw size={12} /> Reset Data
        </button>
      </div>
    </div>
  );
};

export default DemoSwitcher;
