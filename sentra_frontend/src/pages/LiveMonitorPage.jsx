import React, { useState } from 'react';
import { Video, Maximize2, Shield, Radio, Activity, Eye, AlertTriangle } from 'lucide-react';

export default function LiveMonitorPage({ cameras = [], events = [], onSelectEvent }) {
  const [focalCamId, setFocalCamId] = useState('cam-gate-a');
  const [showOverlays, setShowOverlays] = useState(true);

  const activeCam = cameras.find((c) => c.id === focalCamId) || cameras[0] || {
    id: 'cam-gate-a',
    name: 'Camera 01: Main Gate A',
    location: 'Campus North Entrance / Pedestrian & Vehicle Portal',
    status: 'ONLINE',
    resolution: '1920x1080',
    fps: 30.0,
    active_entities: 3
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)' }}>
            MULTI-CHANNEL SURVEILLANCE MATRIX
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Real-time multi-camera array with synchronized ByteTrack telemetry and edge anomaly triggers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${showOverlays ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowOverlays(!showOverlays)}
          >
            {showOverlays ? 'Hide AI Telemetry Overlay' : 'Show AI Telemetry Overlay'}
          </button>
        </div>
      </div>

      <div className="split-view" style={{ gridTemplateColumns: '1fr 340px' }}>
        {/* Left Side: Focal View + Grid Switcher */}
        <div>
          {/* Focal Primary Feed */}
          <div className="ops-card" style={{ marginBottom: '16px' }}>
            <div className="ops-card-header">
              <div className="ops-card-title">
                <span className="indicator-dot"></span>
                <span>{activeCam.name} · {activeCam.location}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge normal">LIVE RTSP</span>
                <span className="mono-cell">{activeCam.resolution} @ {activeCam.fps} FPS</span>
              </div>
            </div>

            <div style={{ position: 'relative', background: '#04060A', minHeight: '360px', overflow: 'hidden' }}>
              <img
                src="/demo_snapshot.jpg"
                onError={(e) => { e.target.src = 'http://localhost:8000/api/snapshot'; }}
                alt="Focal Camera Feed"
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '460px', objectFit: 'cover' }}
              />

              {showOverlays && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(12, 16, 26, 0.88)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#F8FAFC'
                }}>
                  <div>MODEL: YOLOv8-POSE (COCO 17 KPS)</div>
                  <div>TRACKER: BYTETRACK (PERSISTENT IOU)</div>
                  <div style={{ color: '#10B981', marginTop: '4px' }}>
                    ACTIVE ENTITIES IN SECTOR: {activeCam.active_entities || 3}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4-Camera Selection Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {cameras.map((cam) => {
              const isSelected = cam.id === focalCamId;
              return (
                <div
                  key={cam.id}
                  onClick={() => setFocalCamId(cam.id)}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${isSelected ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
                    borderRadius: '4px',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: isSelected ? '#93C5FD' : 'var(--text-bright)' }}>
                      {cam.id.toUpperCase()}
                    </span>
                    <span className="indicator-dot"></span>
                  </div>
                  <div style={{
                    height: '70px',
                    background: '#090D14',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dim)',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {cam.name.replace('Camera ', 'CAM-')}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cam.location}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Live Behaviour & Incident Stream */}
        <div className="ops-card">
          <div className="ops-card-header">
            <div className="ops-card-title">
              <Activity size={14} color="#10B981" />
              <span>LIVE BEHAVIOUR STREAM</span>
            </div>
          </div>

          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
              CURRENT CLASSIFICATIONS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg-app)', padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Walking / Transit</span>
                <span className="mono-cell" style={{ color: 'var(--color-normal)' }}>2 Entities</span>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Stationary / Loitering</span>
                <span className="mono-cell" style={{ color: 'var(--color-warning)' }}>1 Entity (#21)</span>
              </div>
              <div style={{ background: 'var(--color-critical-bg)', border: '1px solid var(--color-critical-border)', padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#FCA5A5', fontWeight: 600 }}>ABNORMAL: FALLEN DOWN</span>
                <span className="mono-cell" style={{ color: 'var(--color-critical)' }}>1 Entity (#1)</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
              RECENT SECTOR AUDIT ALERTS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {events.slice(0, 6).map((ev) => (
                <div
                  key={ev.id || ev.event_id}
                  onClick={() => onSelectEvent(ev)}
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span className={`badge ${ev.severity === 'CRITICAL' ? 'critical' : 'warning'}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                      {ev.severity}
                    </span>
                    <span className="mono-cell" style={{ fontSize: '10px' }}>{ev.timestamp_str}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                    Entity #{ev.person_id}: {ev.anomaly_type}
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
                    {ev.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
