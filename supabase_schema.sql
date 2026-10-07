-- ==============================================================================
-- SENTRA-X: Security & Entity Tracking with Temporal Reasoning
-- by BYTE-X
-- Supabase PostgreSQL Database Schema
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Roles Enum & Users Table
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'OFFICER', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'OFFICER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Cameras Table
CREATE TABLE IF NOT EXISTS cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ONLINE', -- 'ONLINE', 'DEGRADED', 'OFFLINE'
    resolution TEXT NOT NULL DEFAULT '1920x1080',
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Videos Table
DO $$ BEGIN
    CREATE TYPE video_status AS ENUM ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    storage_path TEXT,
    camera_id UUID REFERENCES cameras(id) ON DELETE SET NULL,
    duration NUMERIC(8, 2) DEFAULT 0.0,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status video_status NOT NULL DEFAULT 'UPLOADED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Analysis Jobs Table
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'
    progress INT NOT NULL DEFAULT 0, -- 0 to 100%
    current_stage TEXT DEFAULT 'Ingestion',
    total_frames INT DEFAULT 0,
    processed_frames INT DEFAULT 0,
    fps NUMERIC(5, 2) DEFAULT 0.0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Restricted Zones Table
CREATE TABLE IF NOT EXISTS restricted_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id UUID REFERENCES cameras(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    polygon JSONB NOT NULL, -- Array of [x, y] points
    color TEXT NOT NULL DEFAULT '#EF4444',
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'CRITICAL', -- 'WARNING', 'CRITICAL'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Tracked People (Anonymous Entity Directory)
CREATE TABLE IF NOT EXISTS tracked_people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracker_id INT NOT NULL, -- Anonymous numeric ID e.g. 1, 17, 21
    camera_id UUID REFERENCES cameras(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_x NUMERIC(8, 2) DEFAULT 0.0,
    current_y NUMERIC(8, 2) DEFAULT 0.0,
    current_zone TEXT,
    current_behaviour TEXT DEFAULT 'Standing',
    risk_level TEXT NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'WARNING', 'CRITICAL'
    peak_risk_level TEXT NOT NULL DEFAULT 'NORMAL',
    total_distance_px NUMERIC(10, 2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tracker_per_video UNIQUE (video_id, tracker_id)
);

-- 8. Safety Events Table (Audit Log with Strict Temporal Attribution)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    camera_id UUID REFERENCES cameras(id) ON DELETE SET NULL,
    event_id INT NOT NULL,
    timestamp_str TEXT NOT NULL, -- e.g. "00:00:28.53"
    video_time_sec NUMERIC(8, 2) NOT NULL,
    frame_idx INT NOT NULL,
    person_id INT NOT NULL, -- Anonymous tracker ID
    action TEXT NOT NULL, -- "Walking", "Running", "FALLEN DOWN", etc.
    anomaly_type TEXT NOT NULL, -- "Abnormal Behavior: Fall Detected", "Restricted Zone Entry", etc.
    zone TEXT NOT NULL DEFAULT 'General Campus Courtyard',
    severity TEXT NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'WARNING', 'CRITICAL'
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_ALARM'
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Trajectories & Temporal State Table
CREATE TABLE IF NOT EXISTS trajectories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracked_person_id UUID REFERENCES tracked_people(id) ON DELETE CASCADE,
    frame_idx INT NOT NULL,
    video_time_sec NUMERIC(8, 2) NOT NULL,
    foot_x NUMERIC(8, 2) NOT NULL,
    foot_y NUMERIC(8, 2) NOT NULL,
    center_x NUMERIC(8, 2) NOT NULL,
    center_y NUMERIC(8, 2) NOT NULL,
    speed_px_sec NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    action TEXT NOT NULL,
    posture TEXT,
    zone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Indexes for Fast Realtime Queries
CREATE INDEX IF NOT EXISTS idx_events_video_id ON events(video_id);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_person_id ON events(person_id);
CREATE INDEX IF NOT EXISTS idx_tracked_people_video ON tracked_people(video_id);
CREATE INDEX IF NOT EXISTS idx_trajectories_person ON trajectories(tracked_person_id);

-- 11. Initial Seed Data
INSERT INTO users (id, email, name, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@sentra-x.security', 'Lead Security Admin', 'ADMIN'),
    ('22222222-2222-2222-2222-222222222222', 'officer.davis@sentra-x.security', 'Officer Marcus Davis', 'OFFICER'),
    ('33333333-3333-3333-3333-333333333333', 'viewer@sentra-x.security', 'Auditor Ops Desk', 'VIEWER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cameras (id, name, location, status, resolution)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Camera 01: Main Gate A', 'Campus North Entrance / Vehicle Gate', 'ONLINE', '1920x1080'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Camera 02: Science Quad & Lab Wing', 'Block B Science Complex Courtyard', 'ONLINE', '1920x1080'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Camera 03: Central Library Corridors', 'Library Ground Floor Atrium', 'ONLINE', '1920x1080'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Camera 04: Server Facility Hallway', 'IT Data Center Restricted Hallway', 'ONLINE', '1920x1080')
ON CONFLICT (id) DO NOTHING;

INSERT INTO restricted_zones (id, camera_id, name, polygon, color, description, severity)
VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Restricted Zone: Lab-01 / Hazardous', '[[25, 120], [297, 120], [297, 406], [25, 406]]'::jsonb, '#EF4444', 'Authorized Personnel Only - Bio/Hazardous Area', 'CRITICAL'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Restricted Zone: Server Room Access', '[[593, 143], [814, 143], [814, 406], [593, 406]]'::jsonb, '#F59E0B', 'Restricted After Hours / High-Security Corridor', 'WARNING')
ON CONFLICT (id) DO NOTHING;
