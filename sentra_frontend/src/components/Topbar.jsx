import React, { useState, useEffect } from 'react';
import { Clock, Shield, Bell, Database, Cpu } from 'lucide-react';

export default function Topbar({ activeTab, userRole, setUserRole, kpis = {} }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC+5:30');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const titles = {
    'dashboard': 'OPERATIONS DASHBOARD',
    'live-monitor': 'LIVE CCTV MULTI-MONITOR',
    'video-analysis': 'COMPUTER VISION TEMPORAL REASONING PIPELINE',
    'safety-events': 'STRUCTURED SAFETY EVENTS AUDIT LOG',
    'tracked-people': 'TRACKED ENTITY DIRECTORY',
    'restricted-zones': 'GEO-FENCED RESTRICTED ZONES',
    'test-videos': 'BENCHMARK & TEST VIDEO SUITE',
    'settings': 'SETTINGS & SUPABASE INTEGRATION'
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">
          <Shield size={16} color="#3B82F6" />
          <span>{titles[activeTab] || 'COMMAND CONSOLE'}</span>
        </h1>
      </div>

      <div className="topbar-right">
        {/* Clock */}
        <div className="telemetry-chip">
          <Clock size={13} color="#94A3B8" />
          <span>{timeStr}</span>
        </div>

        {/* Telemetry */}
        <div className="telemetry-chip">
          <Cpu size={13} color="#10B981" />
          <span>{kpis.processing_fps || 31.4} FPS · {kpis.avg_pipeline_latency_ms || 28.6}ms</span>
        </div>

        {/* Critical Alarm Alert Indicator */}
        <div className="telemetry-chip" style={{ color: (kpis.critical_alerts || 4) > 0 ? '#EF4444' : '#10B981' }}>
          <Bell size={13} />
          <span>{kpis.critical_alerts || 4} CRITICAL ALARMS</span>
        </div>

        {/* Role Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            className="input-field"
            style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
          >
            <option value="ADMIN">ROLE: ADMIN</option>
            <option value="OFFICER">ROLE: OFFICER</option>
            <option value="VIEWER">ROLE: VIEWER</option>
          </select>
        </div>
      </div>
    </header>
  );
}
