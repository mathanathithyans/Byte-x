import React, { useState } from 'react';
import { ShieldAlert, Plus, Trash2, MapPin, Eye, CheckCircle2, X } from 'lucide-react';

export default function RestrictedZonesPage({ zones = [], onAddZone, onDeleteZone }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneSeverity, setNewZoneSeverity] = useState('CRITICAL');
  const [newZoneDesc, setNewZoneDesc] = useState('');

  const handleCreate = () => {
    if (!newZoneName) return;
    onAddZone({
      camera_id: 'cam-gate-a',
      name: newZoneName,
      severity: newZoneSeverity,
      description: newZoneDesc || 'Restricted perimeter',
      color: newZoneSeverity === 'CRITICAL' ? '#EF4444' : '#F59E0B',
      polygon: [[100, 100], [400, 100], [400, 350], [100, 350]]
    });
    setNewZoneName('');
    setNewZoneDesc('');
    setShowAddModal(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)' }}>
            GEO-FENCED RESTRICTED ZONES & PERIMETER GATES
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Arbitrary point-in-polygon intrusion boundaries evaluated in real time on entity foot coordinates.
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          <span>Define New Restricted Zone</span>
        </button>
      </div>

      <div className="split-view" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        {/* Left: Interactive Canvas Overlay Preview */}
        <div className="ops-card">
          <div className="ops-card-header">
            <div className="ops-card-title">
              <MapPin size={14} color="#3B82F6" />
              <span>SPATIAL PERIMETER VISUALIZER · CAMERA 01</span>
            </div>
            <span className="mono-cell">{zones.length} ACTIVE ZONES</span>
          </div>

          <div style={{ position: 'relative', background: '#05080E' }}>
            <img
              src="/demo_snapshot.jpg"
              onError={(e) => { e.target.src = 'http://localhost:8000/api/snapshot'; }}
              alt="Perimeter Zone View"
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '420px', objectFit: 'cover' }}
            />

            {/* Visual SVG Polygons overlaid on camera frame */}
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              viewBox="0 0 848 478"
              preserveAspectRatio="none"
            >
              {zones.map((z, idx) => {
                const pts = (z.polygon || []).map((p) => `${p[0]},${p[1]}`).join(' ');
                const isCrit = z.severity === 'CRITICAL';
                return (
                  <g key={z.id || idx}>
                    <polygon
                      points={pts}
                      fill={isCrit ? 'rgba(239, 68, 68, 0.22)' : 'rgba(245, 158, 11, 0.22)'}
                      stroke={isCrit ? '#EF4444' : '#F59E0B'}
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Zones Configuration Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {zones.map((zone) => {
            const isCritical = zone.severity === 'CRITICAL';
            return (
              <div
                key={zone.id}
                className="ops-card"
                style={{
                  marginBottom: 0,
                  borderLeft: `4px solid ${isCritical ? 'var(--color-critical)' : 'var(--color-warning)'}`
                }}
              >
                <div className="ops-card-header">
                  <div className="ops-card-title">
                    <ShieldAlert size={14} color={isCritical ? '#EF4444' : '#F59E0B'} />
                    <span>{zone.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${zone.severity.toLowerCase()}`}>
                      {zone.severity}
                    </span>
                    <button
                      onClick={() => onDeleteZone(zone.id)}
                      style={{ color: 'var(--text-dim)', padding: '2px' }}
                      title="Delete Zone"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="ops-card-body" style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>{zone.description}</div>
                  <div className="mono-cell" style={{ fontSize: '10px' }}>
                    VERTICES: {JSON.stringify(zone.polygon)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginTop: '4px' }}>
                    <span>EVALUATION: Point-in-polygon foot anchor</span>
                    <span style={{ color: 'var(--color-normal)' }}>ACTIVE ENFORCEMENT</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Define Zone Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-bright)' }}>
                CALIBRATE NEW RESTRICTED ZONE
              </span>
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  ZONE NAME / SECTOR IDENTIFIER
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Restricted Zone: Electrical Transformer Yard"
                  style={{ width: '100%' }}
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  INTRUSION SEVERITY RATING
                </label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newZoneSeverity}
                  onChange={(e) => setNewZoneSeverity(e.target.value)}
                >
                  <option value="CRITICAL">CRITICAL (Immediate High-Risk Alarm)</option>
                  <option value="WARNING">WARNING (Medium Priority Warning)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  DESCRIPTION & POLICY
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="e.g. Authorized Facilities Team Only - Immediate Dispatch Required"
                  style={{ width: '100%', resize: 'none' }}
                  value={newZoneDesc}
                  onChange={(e) => setNewZoneDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>
                Lock & Save Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
