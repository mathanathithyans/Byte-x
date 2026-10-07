import React, { useState } from 'react';
import { Database, Shield, Sliders, CheckCircle2, Copy, AlertTriangle, Key } from 'lucide-react';

export default function SettingsPage({ userRole, setUserRole, systemStatus = {} }) {
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [testResult, setTestResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleTestSupabase = () => {
    if (!supabaseUrl || !supabaseKey) {
      setTestResult({ success: false, message: 'Please provide both Supabase URL and Anon Key' });
      return;
    }
    // Test fetch
    fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    })
      .then((res) => {
        if (res.ok || res.status === 404 || res.status === 200) {
          setTestResult({ success: true, message: 'Successfully connected to Supabase endpoint!' });
        } else {
          setTestResult({ success: false, message: `Supabase returned HTTP ${res.status}` });
        }
      })
      .catch((err) => {
        setTestResult({ success: false, message: `Connection failed: ${err.message}` });
      });
  };

  const sqlSchemaSnippet = `-- SENTRA-X Database Schema
CREATE TABLE users (id UUID PRIMARY KEY, email TEXT, name TEXT, role TEXT);
CREATE TABLE cameras (id UUID PRIMARY KEY, name TEXT, location TEXT, status TEXT);
CREATE TABLE videos (id UUID PRIMARY KEY, filename TEXT, duration NUMERIC);
CREATE TABLE tracked_people (id UUID PRIMARY KEY, tracker_id INT, risk_level TEXT);
CREATE TABLE events (id UUID PRIMARY KEY, event_id INT, person_id INT, action TEXT, anomaly_type TEXT, zone TEXT, severity TEXT);
CREATE TABLE restricted_zones (id UUID PRIMARY KEY, name TEXT, polygon JSONB, severity TEXT);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)' }}>
          SYSTEM SETTINGS & SUPABASE INTEGRATION
        </h2>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Configure remote PostgreSQL connection, role-based access, and temporal detection parameters.
        </p>
      </div>

      <div className="split-view" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        {/* Left: Supabase Configuration */}
        <div className="ops-card">
          <div className="ops-card-header">
            <div className="ops-card-title">
              <Database size={14} color="#10B981" />
              <span>SUPABASE POSTGRESQL & REALTIME SYNC</span>
            </div>
            <span className={`badge ${systemStatus.supabase_connected ? 'normal' : 'warning'}`}>
              {systemStatus.supabase_connected ? 'CONNECTED' : 'LOCAL MODE'}
            </span>
          </div>

          <div className="ops-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                VITE_SUPABASE_URL
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="https://your-project.supabase.co"
                style={{ width: '100%' }}
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                VITE_SUPABASE_ANON_KEY
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                style={{ width: '100%' }}
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={handleTestSupabase}>
                Test Supabase Connection
              </button>
              {testResult && (
                <span style={{ fontSize: '11px', color: testResult.success ? 'var(--color-normal)' : 'var(--color-critical)' }}>
                  {testResult.message}
                </span>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)' }}>
                  DATABASE SCHEMA SCRIPT (supabase_schema.sql)
                </span>
                <button className="btn btn-secondary btn-sm" onClick={copySql}>
                  <Copy size={12} />
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre style={{
                background: 'var(--bg-app)',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                {sqlSchemaSnippet}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Role & Product Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* User Role Switcher */}
          <div className="ops-card" style={{ marginBottom: 0 }}>
            <div className="ops-card-header">
              <div className="ops-card-title">
                <Shield size={14} color="#3B82F6" />
                <span>ROLE-BASED ACCESS CONTROL (RBAC)</span>
              </div>
            </div>

            <div className="ops-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>ACTIVE SESSION ROLE: </span>
                <strong style={{ color: '#93C5FD' }}>{userRole}</strong>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {['ADMIN', 'OFFICER', 'VIEWER'].map((role) => (
                  <button
                    key={role}
                    className={`btn btn-sm ${userRole === role ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setUserRole(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                • <strong>ADMIN:</strong> Full zone editing, system calibrations, schema management.<br />
                • <strong>OFFICER:</strong> Incident triage, guard dispatch, event resolution.<br />
                • <strong>VIEWER:</strong> Read-only CCTV monitoring and report downloads.
              </div>
            </div>
          </div>

          {/* Product Identity Card */}
          <div className="ops-card" style={{ marginBottom: 0 }}>
            <div className="ops-card-header">
              <div className="ops-card-title">
                <Sliders size={14} color="#94A3B8" />
                <span>ABOUT SENTRA-X</span>
              </div>
            </div>

            <div className="ops-card-body" style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Application:</strong> SENTRA-X</div>
              <div><strong>Full Form:</strong> Security & Entity Tracking with Temporal Reasoning</div>
              <div><strong>Engineering Team:</strong> BYTE-X</div>
              <div><strong>CV Engine:</strong> YOLOv8-Pose (17 COCO Keypoints) + ByteTrack Tracker</div>
              <div><strong>Edge Framework:</strong> FastAPI + PyTorch + OpenCV</div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', color: 'var(--text-dim)' }}>
                Certified for enterprise CCTV monitoring operations centers.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
