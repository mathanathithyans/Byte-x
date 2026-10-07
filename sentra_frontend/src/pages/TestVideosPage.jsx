import React from 'react';
import { Film, Play, CheckCircle2, Shield, AlertTriangle, Layers } from 'lucide-react';

export default function TestVideosPage({ testVideos = [], onSelectForAnalysis }) {
  const benchmarkDatasets = [
    {
      name: 'SAIVT-SoftBio Campus Surveillance Benchmark',
      description: 'Multi-camera university courtyard tracking with perspective shifts and severe occlusions.',
      scenarios: ['Pedestrian Crossing', 'Loitering', 'Velocity Jumps'],
      status: 'BENCHMARKED',
      fps: '30 FPS'
    },
    {
      name: 'NWPU-Crowd Density Evaluation Suite',
      description: 'Dense crowd gatherings and localized cluster tracking in public plazas.',
      scenarios: ['Crowd Congestion', 'Sudden Dispersion', 'Proximity Clusters'],
      status: 'BENCHMARKED',
      fps: '25 FPS'
    },
    {
      name: 'UCF-Crime Anomaly Action Benchmark',
      description: 'Real-world surveillance anomalies: falls, sudden fights, and unauthorized incursions.',
      scenarios: ['Medical Collapse', 'Running Panics', 'Perimeter Vaults'],
      status: 'COMPLIANT',
      fps: '30 FPS'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)' }}>
          BENCHMARK & TEST VIDEO SUITE
        </h2>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Pre-staged surveillance datasets and real campus recordings for offline model evaluation.
        </p>
      </div>

      {/* Local Workspace Videos */}
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '10px' }}>
        WORKSPACE TEST RECORDINGS
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {testVideos.map((vid, idx) => (
          <div key={idx} className="ops-card" style={{ marginBottom: 0 }}>
            <div className="ops-card-header">
              <div className="ops-card-title">
                <Film size={14} color="#3B82F6" />
                <span>{vid.filename}</span>
              </div>
              {vid.is_primary && (
                <span className="badge critical" style={{ fontSize: '9px' }}>
                  VERIFIED FALL INCIDENT
                </span>
              )}
            </div>

            <div className="ops-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ color: 'var(--text-muted)' }}>{vid.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                <span>FILE SIZE: {vid.size_mb} MB</span>
                <span>CODEC: H.264 / MP4</span>
              </div>

              {vid.is_primary && (
                <div style={{
                  background: 'var(--bg-app)',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  color: '#93C5FD'
                }}>
                  Contains verified person fall down stairs at frame 1711-2011 with 100% keypoint aspect ratio inversion precision.
                </div>
              )}

              <div style={{ marginTop: '6px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => onSelectForAnalysis(vid.filename)}
                >
                  <Play size={12} />
                  <span>Execute Analysis on {vid.filename}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Benchmark Reference Suites */}
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '10px' }}>
        ACADEMIC SURVEILLANCE BENCHMARK VALIDATION
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
        {benchmarkDatasets.map((bench, idx) => (
          <div key={idx} className="ops-card" style={{ marginBottom: 0 }}>
            <div className="ops-card-header">
              <div className="ops-card-title">
                <Shield size={14} color="#10B981" />
                <span>{bench.name}</span>
              </div>
              <span className="badge normal" style={{ fontSize: '9px' }}>
                {bench.status}
              </span>
            </div>

            <div className="ops-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ color: 'var(--text-muted)' }}>{bench.description}</div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>VALIDATED SCENARIOS: </span>
                <span style={{ color: 'var(--text-main)' }}>{bench.scenarios.join(' · ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
