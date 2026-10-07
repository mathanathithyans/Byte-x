import React, { useState } from 'react';
import {
  Users,
  Video,
  AlertTriangle,
  Flame,
  Activity,
  ArrowRight,
  Eye,
  CheckCircle,
  Shield,
  Layers,
  Crosshair,
  UserCheck
} from 'lucide-react';

export default function DashboardPage({ kpis = {}, events = [], onSelectEvent, onUpdateEventStatus, onViewEntity }) {
  const [selectedEntityId, setSelectedEntityId] = useState(1);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showIds, setShowIds] = useState(true);
  const [showSkeletons, setShowSkeletons] = useState(true);
  const [showZones, setShowZones] = useState(true);

  // Entities with full temporal progression
  const temporalData = {
    1: {
      tracker_id: 1,
      peak_risk: 'CRITICAL',
      total_duration: '31.44s',
      summary: 'Entity entered at normal pace, accelerated into hallway sprint, trespassed restricted zone, and collapsed on ground.',
      steps: [
        {
          order: 1,
          time: '00:00:02.10',
          what: 'Stationary / Entry',
          where: 'Courtyard Ingress',
          speed: '12 px/s',
          severity: 'NORMAL',
          note: 'Normal entity entry into field of view'
        },
        {
          order: 2,
          time: '00:00:04.09',
          what: 'Rapid Movement / Running',
          where: 'General Campus Hallway',
          speed: '240.0 px/s',
          severity: 'WARNING',
          note: 'Sudden kinematic acceleration above normal threshold'
        },
        {
          order: 3,
          time: '00:00:08.37',
          what: 'Restricted Zone Breach',
          where: 'Restricted Zone: Custom Area',
          speed: '45.0 px/s',
          severity: 'CRITICAL',
          note: 'Point-in-polygon verification triggered alert'
        },
        {
          order: 4,
          time: '00:00:10.87',
          what: 'Lingering inside Zone',
          where: 'Restricted Zone: Custom Area',
          speed: '0 px/s',
          severity: 'CRITICAL',
          note: 'Stationary anchor dwell >2.5 seconds'
        },
        {
          order: 5,
          time: '00:00:26.00',
          what: 'Rapid Sprint / Egress',
          where: 'Restricted Zone: Custom Area',
          speed: '250.6 px/s',
          severity: 'WARNING',
          note: 'High velocity exit trajectory'
        },
        {
          order: 6,
          time: '00:00:28.54',
          what: 'ABNORMAL: FALL DETECTED',
          where: 'Courtyard Stairs / Walkway',
          speed: '0 px/s',
          severity: 'CRITICAL',
          note: 'Anatomical collapse: Aspect ratio flipped, horizontal torso, spine parallel to ground'
        }
      ]
    },
    21: {
      tracker_id: 21,
      peak_risk: 'WARNING',
      total_duration: '23.65s',
      summary: 'Entity loitered adjacent to high-security server room doorway for >4 seconds.',
      steps: [
        {
          order: 1,
          time: '00:00:08.45',
          what: 'Approached Server Wing',
          where: 'North Outer Perimeter',
          speed: '48 px/s',
          severity: 'NORMAL',
          note: 'Standard walking gait'
        },
        {
          order: 2,
          time: '00:00:12.00',
          what: 'Velocity Halt / Standstill',
          where: 'Server Room Doorway',
          speed: '4 px/s',
          severity: 'NORMAL',
          note: 'Stationary anchor established'
        },
        {
          order: 3,
          time: '00:00:16.50',
          what: 'Loitering Violation Triggered',
          where: 'Server Room Access Perimeter',
          speed: '2 px/s',
          severity: 'WARNING',
          note: 'Stationary duration exceeded 4.0s threshold (4.5s lingering)'
        }
      ]
    },
    17: {
      tracker_id: 17,
      peak_risk: 'NORMAL',
      total_duration: '24.28s',
      summary: 'Normal pedestrian transit across campus gate walkway.',
      steps: [
        {
          order: 1,
          time: '00:00:05.12',
          what: 'Entered Field of View',
          where: 'Gate A Turnstile Walkway',
          speed: '52 px/s',
          severity: 'NORMAL',
          note: 'Authorized credential scan simulated'
        },
        {
          order: 2,
          time: '00:00:18.40',
          what: 'Continuous Walking',
          where: 'Central Courtyard',
          speed: '54 px/s',
          severity: 'NORMAL',
          note: 'Normal kinematic trajectory maintained'
        },
        {
          order: 3,
          time: '00:00:29.40',
          what: 'Normal Corridor Exit',
          where: 'Science Quad Access Walkway',
          speed: '50 px/s',
          severity: 'NORMAL',
          note: 'Standard transit departure'
        }
      ]
    }
  };

  const activeTemporal = temporalData[selectedEntityId] || temporalData[1];

  return (
    <div>
      {/* 1. KPIs Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Active Entities</span>
            <Users size={14} color="#94A3B8" />
          </div>
          <div className="kpi-value-row">
            <div className="kpi-value">{kpis.active_entities || 24}</div>
            <div className="badge normal">Tracking</div>
          </div>
          <div className="kpi-subtext">Persistent ByteTrack IDs</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Connected Cameras</span>
            <Video size={14} color="#94A3B8" />
          </div>
          <div className="kpi-value-row">
            <div className="kpi-value">{kpis.online_cameras || 4} / {kpis.total_cameras || 4}</div>
            <div className="badge normal">Online</div>
          </div>
          <div className="kpi-subtext">1080p RTSP/HTTP Ingestion</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Safety Incidents Today</span>
            <AlertTriangle size={14} color="#94A3B8" />
          </div>
          <div className="kpi-value-row">
            <div className="kpi-value warning">{events.length || 16}</div>
            <div className="badge warning">Audit Logged</div>
          </div>
          <div className="kpi-subtext">Automated Temporal Rule Triggers</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Critical High-Risk</span>
            <Flame size={14} color="#EF4444" />
          </div>
          <div className="kpi-value-row">
            <div className="kpi-value critical">{kpis.critical_alerts || 4}</div>
            <div className="badge critical">Urgent</div>
          </div>
          <div className="kpi-subtext">Includes Confirmed Fall / Breach</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Inference Pipeline</span>
            <Activity size={14} color="#10B981" />
          </div>
          <div className="kpi-value-row">
            <div className="kpi-value normal">{kpis.processing_fps || 31.4}</div>
            <div className="mono-cell" style={{ fontSize: '13px' }}>FPS</div>
          </div>
          <div className="kpi-subtext">Latency: {kpis.avg_pipeline_latency_ms || 28.6}ms (CPU)</div>
        </div>
      </div>

      {/* 2. Main Live Feed & Temporal Progression Split */}
      <div className="split-view" style={{ gridTemplateColumns: '1.45fr 1fr', marginBottom: '20px' }}>
        {/* Left: CCTV Primary Monitor */}
        <div className="ops-card">
          <div className="ops-card-header">
            <div className="ops-card-title">
              <span className="indicator-dot"></span>
              <span>LIVE CCTV · CAMERA 01 (CAMPUS MAIN GATE A)</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`btn btn-sm ${showBoxes ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowBoxes(!showBoxes)}
                title="Toggle Bounding Boxes"
              >
                Boxes
              </button>
              <button
                className={`btn btn-sm ${showIds ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowIds(!showIds)}
                title="Toggle Anonymous IDs"
              >
                IDs
              </button>
              <button
                className={`btn btn-sm ${showSkeletons ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowSkeletons(!showSkeletons)}
                title="Toggle Keypoint Skeletons"
              >
                Pose
              </button>
              <button
                className={`btn btn-sm ${showZones ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowZones(!showZones)}
                title="Toggle Geo-fenced Zones"
              >
                Zones
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', background: '#05070B', minHeight: '340px', overflow: 'hidden' }}>
            {/* Live Camera View Canvas / Snapshot */}
            <img
              src="/demo_snapshot.jpg"
              onError={(e) => {
                // If not found in public, fetch via API endpoint
                e.target.src = 'http://localhost:8000/api/snapshot';
              }}
              alt="Live Camera Feed Gate A"
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '420px', objectFit: 'cover' }}
            />

            {/* Overlaid Live Feed HUD Telemetry */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '12px',
              background: 'rgba(10, 14, 22, 0.82)',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: '#F8FAFC'
            }}>
              <div>GATE A · STREAM: 1080p@30FPS</div>
              <div style={{ color: '#10B981' }}>TRACKED ENTITIES: #1, #17, #21, #24</div>
            </div>

            {/* Entity Badge Simulation Markers if enabled */}
            {showBoxes && (
              <div style={{
                position: 'absolute',
                bottom: '14px',
                left: '12px',
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid #EF4444',
                color: '#FFFFFF',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)'
              }}>
                ! ALERT: ENTITY #1 COLLAPSED / FALLEN (SEVERITY: CRITICAL)
              </div>
            )}
          </div>
        </div>

        {/* Right: Real-time Incident Ticker */}
        <div className="ops-card">
          <div className="ops-card-header">
            <div className="ops-card-title">
              <AlertTriangle size={14} color="#F59E0B" />
              <span>INCIDENT AUDIT STREAM</span>
            </div>
            <span className="mono-cell">{events.length} LOGGED</span>
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {events.slice(0, 6).map((ev) => (
                <div
                  key={ev.id || ev.event_id}
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: `3px solid ${ev.severity === 'CRITICAL' ? 'var(--color-critical)' : 'var(--color-warning)'}`,
                    borderRadius: '4px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelectEvent(ev)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge ${ev.severity === 'CRITICAL' ? 'critical' : 'warning'}`}>
                        {ev.severity}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                        Entity #{ev.person_id}
                      </span>
                    </div>
                    <span className="mono-cell">{ev.timestamp_str}</span>
                  </div>

                  <div style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '11px' }}>
                    {ev.anomaly_type}
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '10px', marginTop: '2px' }}>
                    {ev.zone} · {ev.action}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="mono-cell" style={{ fontSize: '10px' }}>STATUS: {ev.status || 'NEW'}</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateEventStatus(ev.event_id, 'ACKNOWLEDGED');
                      }}
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TEMPORAL REASONING SEQUENCE PANEL (CORE MISSION CONCEPT) */}
      <div className="temporal-panel">
        <div className="temporal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-bright)' }}>
                TEMPORAL BEHAVIOUR REASONING ENGINE
              </span>
              <span className="temporal-question-badge">
                WHO → DID WHAT → IN WHAT ORDER → WHERE → WHEN → HOW SERIOUS
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Chronological behavioural transitions reconstructed from persistent ByteTrack tracking and YOLOv8 kinematics.
            </div>
          </div>

          {/* Entity Selector Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>INSPECT ENTITY:</span>
            {[1, 21, 17].map((id) => (
              <button
                key={id}
                className={`btn btn-sm ${selectedEntityId === id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedEntityId(id)}
              >
                #{id} {id === 1 ? '(Critical Fall)' : id === 21 ? '(Loitering)' : '(Normal)'}
              </button>
            ))}
          </div>
        </div>

        {/* Entity Context Bar */}
        <div style={{
          background: 'var(--bg-app)',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px'
        }}>
          <div>
            <strong style={{ color: 'var(--text-bright)' }}>ENTITY #{activeTemporal.tracker_id} SUMMARY: </strong>
            <span style={{ color: 'var(--text-muted)' }}>{activeTemporal.summary}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontFamily: 'var(--font-mono)' }}>
            <span>OBSERVATION WINDOW: {activeTemporal.total_duration}</span>
            <span style={{ color: activeTemporal.peak_risk === 'CRITICAL' ? 'var(--color-critical)' : activeTemporal.peak_risk === 'WARNING' ? 'var(--color-warning)' : 'var(--color-normal)' }}>
              PEAK SEVERITY: {activeTemporal.peak_risk}
            </span>
          </div>
        </div>

        {/* The Progression Chain */}
        <div className="temporal-flow">
          {activeTemporal.steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className={`temporal-step ${step.severity.toLowerCase()}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="temporal-step-time">T: {step.time}</span>
                  <span className={`badge ${step.severity.toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                    {step.severity}
                  </span>
                </div>
                <div className="temporal-step-state">{step.what}</div>
                <div className="temporal-step-desc">
                  <strong>Loc:</strong> {step.where}<br />
                  <strong>Speed:</strong> {step.speed}<br />
                  <span style={{ color: 'var(--text-dim)' }}>{step.note}</span>
                </div>
              </div>

              {idx < activeTemporal.steps.length - 1 && (
                <div className="temporal-arrow">
                  <ArrowRight size={16} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
