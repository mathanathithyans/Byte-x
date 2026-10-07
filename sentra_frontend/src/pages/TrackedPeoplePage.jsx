import React, { useState } from 'react';
import { Users, Activity, Clock, MapPin, ArrowRight, Shield, X } from 'lucide-react';

export default function TrackedPeoplePage({ people = [], onSelectPerson }) {
  const [selectedPerson, setSelectedPerson] = useState(null);

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)' }}>
          ANONYMOUS ENTITY DIRECTORY & TRAJECTORIES
        </h2>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Privacy-preserving entity identification via persistent ByteTrack spatial association without biometric facial profiling.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {people.map((person) => {
          const isCritical = person.peak_risk_level === 'CRITICAL';
          const isWarning = person.peak_risk_level === 'WARNING';
          return (
            <div
              key={person.id || person.tracker_id}
              className="ops-card"
              style={{
                marginBottom: 0,
                borderLeft: `4px solid ${isCritical ? 'var(--color-critical)' : isWarning ? 'var(--color-warning)' : 'var(--color-normal)'}`,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedPerson(person)}
            >
              <div className="ops-card-header">
                <div className="ops-card-title">
                  <Users size={14} color="#3B82F6" />
                  <span>ENTITY #{person.tracker_id}</span>
                </div>
                <span className={`badge ${person.peak_risk_level.toLowerCase()}`}>
                  {person.peak_risk_level}
                </span>
              </div>

              <div className="ops-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Current Status:</span>
                  <strong style={{ color: isCritical ? 'var(--color-critical)' : 'var(--text-bright)' }}>
                    {person.current_behaviour}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Last Seen Zone:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{person.current_zone}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Observation Window:</span>
                  <span className="mono-cell">{person.first_seen} → {person.last_seen} ({person.duration_sec}s)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Total Displacement:</span>
                  <span className="mono-cell">{person.total_distance_px} px ({person.avg_speed_px_sec} px/s avg)</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '4px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                    <span>Inspect Full Chronological Sequence</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Entity Chronological Modal Drawer */}
      {selectedPerson && (
        <div className="modal-overlay" onClick={() => setSelectedPerson(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="#3B82F6" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-bright)' }}>
                  TEMPORAL SEQUENCE TRAJECTORY: ENTITY #{selectedPerson.tracker_id}
                </span>
              </div>
              <button onClick={() => setSelectedPerson(null)} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                background: 'var(--bg-app)',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>TRACKER LIFETIME: </span>
                  <strong className="mono-cell">{selectedPerson.duration_sec} SECONDS</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>TOTAL DRIFT: </span>
                  <strong className="mono-cell">{selectedPerson.total_distance_px} PX</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>PEAK RISK: </span>
                  <strong style={{
                    color: selectedPerson.peak_risk_level === 'CRITICAL' ? 'var(--color-critical)' : 'var(--color-normal)'
                  }}>
                    {selectedPerson.peak_risk_level}
                  </strong>
                </div>
              </div>

              {/* Step By Step Timeline */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '8px' }}>
                CHRONOLOGICAL BEHAVIOURAL CHAIN (WHO → DID WHAT → WHEN):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedPerson.sequence || []).map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      borderLeft: `3px solid ${step.severity === 'CRITICAL' ? 'var(--color-critical)' : step.severity === 'WARNING' ? 'var(--color-warning)' : 'var(--color-normal)'}`,
                      padding: '8px 12px',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{step.state}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="mono-cell">{step.time}</span>
                      <span className={`badge ${step.severity.toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {step.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedPerson(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
