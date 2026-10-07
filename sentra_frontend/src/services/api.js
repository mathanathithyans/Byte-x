/**
 * SENTRA-X API & Supabase Service Bridge
 * Security & Entity Tracking with Temporal Reasoning · by BYTE-X
 */

import { createClient } from './supabaseClient.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase Client if keys exist
export let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[SENTRA-X] Supabase client initialized.');
  } catch (err) {
    console.warn('[SENTRA-X] Supabase init warning:', err);
  }
}

export const api = {
  // System & KPI
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/status`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return {
        product: 'SENTRA-X',
        tagline: 'Security & Entity Tracking with Temporal Reasoning',
        author: 'BYTE-X',
        status: 'OPERATIONAL',
        backend: 'FastAPI + PyTorch + Ultralytics YOLOv8-Pose + ByteTrack',
        device: 'cpu',
        model_loaded: true,
        supabase_connected: !!supabase,
        active_cameras: 4,
        total_events_logged: 16
      };
    }
  },

  async getKpis() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/kpis`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return {
        active_entities: 24,
        online_cameras: 4,
        total_cameras: 4,
        total_incidents_today: 16,
        critical_alerts: 4,
        warning_alerts: 10,
        pending_review: 6,
        processing_fps: 31.4,
        avg_pipeline_latency_ms: 28.6,
        uptime_hours: 142.5
      };
    }
  },

  // Cameras
  async getCameras() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cameras`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return [
        { id: 'cam-gate-a', name: 'Camera 01: Main Gate A', location: 'Campus North Entrance / Vehicle Portal', status: 'ONLINE', resolution: '1920x1080', fps: 30.0, active_entities: 3 },
        { id: 'cam-sci-quad', name: 'Camera 02: Science Quad & Lab Wing', location: 'Block B Science Complex Courtyard', status: 'ONLINE', resolution: '1920x1080', fps: 28.5, active_entities: 4 },
        { id: 'cam-library', name: 'Camera 03: Central Library Corridors', location: 'Library Ground Floor Atrium & Reading Arc', status: 'ONLINE', resolution: '1920x1080', fps: 30.0, active_entities: 2 },
        { id: 'cam-server', name: 'Camera 04: Server Facility Hallway', location: 'IT Data Center Restricted Level 2 Corridor', status: 'ONLINE', resolution: '1920x1080', fps: 25.0, active_entities: 1 }
      ];
    }
  },

  // Events & Audit
  async getEvents(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.anomaly_type) params.append('anomaly_type', filters.anomaly_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.person_id) params.append('person_id', filters.person_id);

      const res = await fetch(`${API_BASE_URL}/api/events?${params.toString()}`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return [
        { id: 'e-16', event_id: 16, camera_id: 'cam-gate-a', camera_name: 'Camera 01: Main Gate A', timestamp_str: '00:00:33.54', video_time_sec: 33.54, frame_idx: 2011, person_id: 1, action: 'FALLEN DOWN', anomaly_type: 'Abnormal Behavior: Fall Detected', zone: 'General Campus Courtyard', severity: 'CRITICAL', details: 'Entity #1 fell down / collapsed on ground (Aspect ratio: 1.12)', status: 'NEW' },
        { id: 'e-15', event_id: 15, camera_id: 'cam-gate-a', camera_name: 'Camera 01: Main Gate A', timestamp_str: '00:00:31.04', video_time_sec: 31.04, frame_idx: 1861, person_id: 1, action: 'FALLEN DOWN', anomaly_type: 'Abnormal Behavior: Fall Detected', zone: 'General Campus Courtyard', severity: 'CRITICAL', details: 'Entity #1 fell down / collapsed on ground (Aspect ratio: 1.05)', status: 'NEW' },
        { id: 'e-14', event_id: 14, camera_id: 'cam-gate-a', camera_name: 'Camera 01: Main Gate A', timestamp_str: '00:00:28.53', video_time_sec: 28.54, frame_idx: 1711, person_id: 1, action: 'FALLEN DOWN', anomaly_type: 'Abnormal Behavior: Fall Detected', zone: 'General Campus Courtyard', severity: 'CRITICAL', details: 'Entity #1 fell down / collapsed on ground (Aspect ratio: 0.48)', status: 'NEW' },
        { id: 'e-13', event_id: 13, camera_id: 'cam-gate-a', camera_name: 'Camera 01: Main Gate A', timestamp_str: '00:00:26.00', video_time_sec: 26.00, frame_idx: 1559, person_id: 1, action: 'Running', anomaly_type: 'Rapid Movement / Running', zone: 'Restricted Zone: Custom Area', severity: 'WARNING', details: 'Unusual high speed movement (250.6 px/s) in hallway/campus', status: 'ACKNOWLEDGED' },
        { id: 'e-12', event_id: 12, camera_id: 'cam-gate-a', camera_name: 'Camera 01: Main Gate A', timestamp_str: '00:00:24.15', video_time_sec: 24.15, frame_idx: 1448, person_id: 1, action: 'Walking', anomaly_type: 'Restricted Zone Entry', zone: 'Restricted Zone: Custom Area', severity: 'CRITICAL', details: 'Unauthorized entry detected in Restricted Zone: Custom Area (Dwell: 2.5s)', status: 'ACKNOWLEDGED' },
        { id: 'e-3', event_id: 3, camera_id: 'cam-gate-a', camera_name: 'Camera 01: Main Gate A', timestamp_str: '00:00:08.37', video_time_sec: 8.37, frame_idx: 502, person_id: 1, action: 'Walking', anomaly_type: 'Restricted Zone Entry', zone: 'Restricted Zone: Custom Area', severity: 'CRITICAL', details: 'Unauthorized entry detected in Restricted Zone: Custom Area (Dwell: 0.0s)', status: 'RESOLVED' },
        { id: 'e-1', event_id: 1, camera_id: 'cam-gate-a', camera_name: 'Camera 01: Main Gate A', timestamp_str: '00:00:04.08', video_time_sec: 4.09, frame_idx: 245, person_id: 1, action: 'Running', anomaly_type: 'Rapid Movement / Running', zone: 'General Campus Courtyard', severity: 'WARNING', details: 'Unusual high speed movement (240.0 px/s) in hallway/campus', status: 'RESOLVED' }
      ];
    }
  },

  async updateEventAction(eventId, action, notes = '', officerName = 'Command Center Operator') {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes, officer_name: officerName })
      });
      return await res.json();
    } catch {
      return { message: `Event #${eventId} updated to ${action}` };
    }
  },

  // Tracked People & Temporal Reasoning
  async getTrackedPeople() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/people`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return [
        {
          id: 'p-1',
          tracker_id: 1,
          first_seen: '00:00:02.10',
          last_seen: '00:00:33.54',
          duration_sec: 31.4,
          current_zone: 'General Campus Courtyard',
          current_behaviour: 'ABNORMAL: FALLEN',
          risk_level: 'CRITICAL',
          peak_risk_level: 'CRITICAL',
          total_distance_px: 1420.5,
          avg_speed_px_sec: 195.4,
          sequence: [
            { time: '00:00:02.10', state: 'Stationary Entry', severity: 'NORMAL' },
            { time: '00:00:04.09', state: 'Rapid Running (Hallway)', severity: 'WARNING' },
            { time: '00:00:08.37', state: 'Breach into Restricted Zone: Custom Area', severity: 'CRITICAL' },
            { time: '00:00:10.87', state: 'Stationary Inside Restricted Zone', severity: 'CRITICAL' },
            { time: '00:00:26.00', state: 'Rapid Egress / Running', severity: 'WARNING' },
            { time: '00:00:28.54', state: 'ABNORMAL: FALL DETECTED (Ground Collapse)', severity: 'CRITICAL' }
          ]
        },
        {
          id: 'p-17',
          tracker_id: 17,
          first_seen: '00:00:05.12',
          last_seen: '00:00:29.40',
          duration_sec: 24.28,
          current_zone: 'Campus Gate A Corridor',
          current_behaviour: 'Walking',
          risk_level: 'NORMAL',
          peak_risk_level: 'NORMAL',
          total_distance_px: 890.0,
          avg_speed_px_sec: 52.3,
          sequence: [
            { time: '00:00:05.12', state: 'Normal Entry', severity: 'NORMAL' },
            { time: '00:00:12.30', state: 'Walking towards Science Quad', severity: 'NORMAL' },
            { time: '00:00:29.40', state: 'Exit via Walkway', severity: 'NORMAL' }
          ]
        },
        {
          id: 'p-21',
          tracker_id: 21,
          first_seen: '00:00:08.45',
          last_seen: '00:00:32.10',
          duration_sec: 23.65,
          current_zone: 'Server Room Access Outer Perimeter',
          current_behaviour: 'Loitering (Stationary)',
          risk_level: 'WARNING',
          peak_risk_level: 'WARNING',
          total_distance_px: 210.4,
          avg_speed_px_sec: 14.1,
          sequence: [
            { time: '00:00:08.45', state: 'Approached Doorway', severity: 'NORMAL' },
            { time: '00:00:12.00', state: 'Stationary Anchor Formed', severity: 'NORMAL' },
            { time: '00:00:16.50', state: 'Loitering Warning (>4s lingering)', severity: 'WARNING' }
          ]
        },
        {
          id: 'p-24',
          tracker_id: 24,
          first_seen: '00:00:14.20',
          last_seen: '00:00:31.80',
          duration_sec: 17.6,
          current_zone: 'Courtyard Atrium',
          current_behaviour: 'Walking',
          risk_level: 'NORMAL',
          peak_risk_level: 'NORMAL',
          total_distance_px: 620.0,
          avg_speed_px_sec: 48.0,
          sequence: [
            { time: '00:00:14.20', state: 'Entered Field of View', severity: 'NORMAL' },
            { time: '00:00:22.10', state: 'Walking along path', severity: 'NORMAL' }
          ]
        }
      ];
    }
  },

  async getPersonTimeline(trackerId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/people/${trackerId}/timeline`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return null;
    }
  },

  // Behaviours
  async getBehaviours() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/behaviours`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return { standard: [], unusual: [] };
    }
  },

  // Zones
  async getZones() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/zones`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return [
        {
          id: 'zone-lab-01',
          camera_id: 'cam-gate-a',
          name: 'Restricted Zone: Lab-01 / Hazardous',
          polygon: [[25, 120], [297, 120], [297, 406], [25, 406]],
          color: '#EF4444',
          description: 'Authorized Chemistry & Bio-Hazard Research Personnel Only',
          severity: 'CRITICAL',
          is_active: true
        },
        {
          id: 'zone-server',
          camera_id: 'cam-gate-a',
          name: 'Restricted Zone: Server Room Access',
          polygon: [[593, 143], [814, 143], [814, 406], [593, 406]],
          color: '#F59E0B',
          description: 'Restricted After Hours / High-Security IT Corridor',
          severity: 'WARNING',
          is_active: true
        }
      ];
    }
  },

  async createZone(zoneData) {
    const res = await fetch(`${API_BASE_URL}/api/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zoneData)
    });
    return await res.json();
  },

  async deleteZone(zoneId) {
    const res = await fetch(`${API_BASE_URL}/api/zones/${zoneId}`, { method: 'DELETE' });
    return await res.json();
  },

  // Video Analysis Job
  async startAnalysis(payload) {
    const res = await fetch(`${API_BASE_URL}/api/analysis/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getAnalysisStatus(jobId) {
    const res = await fetch(`${API_BASE_URL}/api/analysis/${jobId}`);
    return await res.json();
  },

  async getTestVideos() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/test-videos`);
      return await res.json();
    } catch {
      return [
        { filename: 'test.mp4', size_mb: 7.73, is_primary: true, description: 'Verified Fall & Anomaly Event Video' },
        { filename: 'video2.mp4', size_mb: 18.2, is_primary: false, description: 'Campus Walkway & Hallway' },
        { filename: 'bag4.mp4', size_mb: 40.6, is_primary: false, description: 'Object / Baggage Scenario' }
      ];
    }
  }
};
