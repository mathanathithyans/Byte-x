import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  CheckCircle,
  Shield,
  Clock,
  MapPin,
  Flame,
  User,
  Radio,
  X
} from 'lucide-react';

export default function SafetyEventsPage({ events = [], onUpdateEventStatus, selectedEvent, setSelectedEvent }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      (ev.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.anomaly_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.zone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(ev.person_id).includes(searchTerm);

    const matchesSeverity = severityFilter === 'ALL' || ev.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || (ev.status || 'NEW') === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)' }}>
            SAFETY INCIDENTS & AUDIT REPOSITORY
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Immutable chronological record of campus behavioural violations and medical emergency collapses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href="http://localhost:8000/api/reports/export?format=json"
            download="sentra_events.json"
            className="btn btn-secondary btn-sm"
          >
            <Download size={12} />
            <span>Export JSON</span>
          </a>
          <a
            href="http://localhost:8000/api/reports/export?format=csv"
            download="sentra_events.csv"
            className="btn btn-secondary btn-sm"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '12px 16px',
        borderRadius: '6px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by entity #, action, rule or zone..."
            style={{ width: '100%', paddingLeft: '32px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>SEVERITY:</span>
          <select
            className="input-field"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">ALL SEVERITIES</option>
            <option value="CRITICAL">CRITICAL ONLY</option>
            <option value="WARNING">WARNING ONLY</option>
            <option value="NORMAL">NORMAL ONLY</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>STATUS:</span>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="NEW">NEW</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="FALSE_ALARM">FALSE ALARM</option>
          </select>
        </div>

        <span className="mono-cell" style={{ marginLeft: 'auto' }}>
          SHOWING {filteredEvents.length} OF {events.length}
        </span>
      </div>

      {/* Structured Events Table */}
      <div className="ops-table-container">
        <table className="ops-table">
          <thead>
            <tr>
              <th>EVENT ID</th>
              <th>VIDEO TIME</th>
              <th>ENTITY #</th>
              <th>ANOMALY CLASSIFICATION</th>
              <th>POSTURE / ACTION</th>
              <th>GEO-ZONE</th>
              <th>SEVERITY</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((ev) => (
              <tr
                key={ev.id || ev.event_id}
                onClick={() => setSelectedEvent(ev)}
                style={{ cursor: 'pointer' }}
              >
                <td className="mono-cell">#{ev.event_id}</td>
                <td className="mono-cell">
                  {ev.timestamp_str}
                  <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>Frame {ev.frame_idx}</div>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                    Entity #{ev.person_id}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {ev.anomaly_type}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {ev.details}
                  </div>
                </td>
                <td>
                  <span className="mono-cell">{ev.action}</span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>
                  {ev.zone}
                </td>
                <td>
                  <span className={`badge ${ev.severity.toLowerCase()}`}>
                    {ev.severity}
                  </span>
                </td>
                <td>
                  <span className="mono-cell" style={{ fontSize: '10px' }}>
                    {ev.status || 'NEW'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onUpdateEventStatus(ev.event_id, 'ACKNOWLEDGED')}
                    >
                      Ack
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onUpdateEventStatus(ev.event_id, 'RESOLVED')}
                    >
                      Resolve
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Incident Detail Modal Drawer */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${selectedEvent.severity.toLowerCase()}`}>
                  {selectedEvent.severity}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-bright)' }}>
                  INCIDENT AUDIT: #{selectedEvent.event_id}
                </span>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Temporal Reasoning Core Breakdown */}
              <div style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#93C5FD', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  TEMPORAL REASONING ATTRIBUTION: WHO → DID WHAT → WHERE → WHEN → HOW SERIOUS
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>WHO (Entity ID): </span>
                    <strong style={{ color: 'var(--text-bright)' }}>Entity #{selectedEvent.person_id}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>DID WHAT: </span>
                    <strong style={{ color: 'var(--text-bright)' }}>{selectedEvent.action}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>WHERE (Zone): </span>
                    <strong style={{ color: 'var(--text-bright)' }}>{selectedEvent.zone}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>WHEN (Video Time): </span>
                    <strong className="mono-cell">{selectedEvent.timestamp_str} (Frame {selectedEvent.frame_idx})</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-dim)' }}>HOW SERIOUS: </span>
                    <strong style={{
                      color: selectedEvent.severity === 'CRITICAL' ? 'var(--color-critical)' : 'var(--color-warning)'
                    }}>
                      {selectedEvent.severity} — {selectedEvent.anomaly_type}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Incident Details & Telemetry */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '4px' }}>
                  TECHNICAL TELEMETRY & KINEMATICS
                </div>
                <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {selectedEvent.details}
                </div>
              </div>

              {/* Triage Decision Section */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px' }}>
                  OPERATIONS DISPATCH & REVIEW
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      onUpdateEventStatus(selectedEvent.event_id, 'ACKNOWLEDGED');
                      setSelectedEvent(null);
                    }}
                  >
                    Acknowledge Incident
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      onUpdateEventStatus(selectedEvent.event_id, 'DISPATCH_OFFICER');
                      setSelectedEvent(null);
                    }}
                  >
                    Dispatch Campus Security Unit
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      onUpdateEventStatus(selectedEvent.event_id, 'RESOLVED');
                      setSelectedEvent(null);
                    }}
                  >
                    Mark Resolved
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      onUpdateEventStatus(selectedEvent.event_id, 'FALSE_ALARM');
                      setSelectedEvent(null);
                    }}
                  >
                    Mark False Alarm
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
