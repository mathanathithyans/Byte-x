"""
================================================================================
HNX26PSI07: Autonomous Vision & Behaviour Understanding
Campus Behaviour & Anomaly Detection System
================================================================================
Computer Vision · Action Recognition · Object Tracking · Behaviour Analysis

Key Capabilities:
1. Multi-Person Tracking with Persistent ID across frames (ByteTrack / BoT-SORT).
2. Action Recognition from Pose & Kinematics:
   - Walking, Running, Stationary, Crouching, Fallen / Collapse.
3. Anomaly & Rule Violations (Who, When, What, Where):
   - Loitering (Entity lingering beyond time threshold)
   - Restricted Zone Entry (Geo-fenced no-go zones via polygon test)
   - Rapid Panic / Running in corridors
   - Fallen / Medical Emergency posture
   - Crowd Congestion / Gathering
   - After-Hours / Curfew presence
4. Real-time Security Ops HUD:
   - Translucent telemetry dashboard
   - Live Anomaly Alert Feed
   - Zone overlays & Trajectory breadcrumb trails
   - Pose skeleton rendering
5. Structured Audit Logging:
   - Real-time JSON & CSV incident export with entity attribution & timestamps.
================================================================================
"""

import os
import sys
import time
import json
import csv
import math
from datetime import datetime
from collections import deque, defaultdict
import cv2
import numpy as np
from ultralytics import YOLO

# ==============================================================================
# 1. CONFIGURATION & DEFAULTS
# ==============================================================================
# Set your target video here. If this dummy path does not exist, the system
# will automatically fall back to an available sample video in the workspace.
DUMMY_VIDEO_SLOT = "test.mp4"
FALLBACK_VIDEOS = ["video.mp4", "video2.mp4", "vid3.mp4", "bag4.mp4"]

DEFAULT_MODEL_PATH = "yolov8n-pose.pt"  # Fast on CPU (6.8 MB), can also use yolov8l-pose.pt
DEVICE = "cpu"

# Anomaly Thresholdss
LOITERING_TIME_THRESHOLD_SEC = 4.0      # seconds stationary in same spot to trigger loitering
LOITERING_RADIUS_PIXELS = 65            # max spatial drift radius allowed for stationary classification
SPEED_RUNNING_THRESHOLD_PX_SEC = 240    # pixels/sec threshold for running
SPEED_WALKING_THRESHOLD_PX_SEC = 35     # pixels/sec threshold for walking vs standing

CROWD_DISTANCE_THRESHOLD_PX = 160       # distance between people to count as a group
CROWD_MIN_PERSON_COUNT = 3             # minimum people clustered to trigger crowd alert

AFTER_HOURS_MODE = False               # Can be enabled via --after-hours flag
AFTER_HOURS_START = "20:00"            # 8:00 PM
AFTER_HOURS_END = "06:00"              # 6:00 AM

# Pose COCO Keypoint Indices
NOSE = 0
L_EYE, R_EYE = 1, 2
L_EAR, R_EAR = 3, 4
L_SHOULDER, R_SHOULDER = 5, 6
L_ELBOW, R_ELBOW = 7, 8
L_WRIST, R_WRIST = 9, 10
L_HIP, R_HIP = 11, 12
L_KNEE, R_KNEE = 13, 14
L_ANKLE, R_ANKLE = 15, 16

SKELETON_CONNECTIONS = [
    (L_SHOULDER, R_SHOULDER),
    (L_SHOULDER, L_ELBOW), (L_ELBOW, L_WRIST),
    (R_SHOULDER, R_ELBOW), (R_ELBOW, R_WRIST),
    (L_SHOULDER, L_HIP), (R_SHOULDER, R_HIP),
    (L_HIP, R_HIP),
    (L_HIP, L_KNEE), (L_KNEE, L_ANKLE),
    (R_HIP, R_KNEE), (R_KNEE, R_ANKLE),
    (NOSE, L_SHOULDER), (NOSE, R_SHOULDER)
]

# Color Palette (BGR)
COLOR_NORMAL = (46, 204, 113)      # Emerald Green
COLOR_WARNING = (0, 215, 255)      # Amber / Gold
COLOR_ALERT = (38, 38, 235)        # Crimson Red
COLOR_ZONE_FILL = (0, 0, 180)      # Translucent Red for restricted zones
COLOR_ZONE_BORDER = (0, 50, 255)
COLOR_HUD_BG = (20, 24, 30)        # Dark Slate HUD
COLOR_TEXT_WHITE = (245, 245, 245)
COLOR_SKELETON = (0, 220, 180)


# ==============================================================================
# 2. RESTRICTED ZONE DEFINITIONS
# ==============================================================================
def get_default_zones(frame_width, frame_height):
    """
    Returns default campus zones scaled to video dimensions.
    Can be customized or drawn interactively by pressing 'z'.
    """
    w, h = frame_width, frame_height
    return [
        {
            "name": "Restricted Zone: Lab-01 / Hazardous",
            "polygon": np.array([
                [int(w * 0.03), int(h * 0.25)],
                [int(w * 0.35), int(h * 0.25)],
                [int(w * 0.35), int(h * 0.85)],
                [int(w * 0.03), int(h * 0.85)]
            ], dtype=np.int32),
            "color": (0, 0, 200),
            "description": "Authorized Personnel Only"
        },
        {
            "name": "Restricted Zone: Server Room Access",
            "polygon": np.array([
                [int(w * 0.70), int(h * 0.30)],
                [int(w * 0.96), int(h * 0.30)],
                [int(w * 0.96), int(h * 0.85)],
                [int(w * 0.70), int(h * 0.85)]
            ], dtype=np.int32),
            "color": (0, 100, 230),
            "description": "Restricted After Hours"
        }
    ]


# ==============================================================================
# 3. STRUCTURED EVENT LOGGER (AUDIT TRAIL)
# ==============================================================================
class EventLogger:
    """Logs anomalies with strict attribution: WHO, WHEN, WHAT, WHERE, SEVERITY."""
    def __init__(self, json_path="campus_events.json", csv_path="campus_events.csv"):
        self.json_path = json_path
        self.csv_path = csv_path
        self.events = []
        self.recent_alerts = deque(maxlen=8)  # for live on-screen HUD feed
        self.event_counter = 0
        self._last_alert_time = defaultdict(lambda: 0.0)  # throttle duplicate spam per (id, type)

        # Initialize CSV header
        with open(self.csv_path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "event_id", "timestamp_str", "video_time_sec", "frame_idx",
                "person_id", "action", "anomaly_type", "zone", "severity", "details"
            ])

    def log_event(self, person_id, action, anomaly_type, zone, severity, details, video_time_sec, frame_idx):
        # Throttle repeated logs for identical event on same person within 2.5 seconds
        throttle_key = (person_id, anomaly_type, zone)
        now_t = video_time_sec
        if now_t - self._last_alert_time[throttle_key] < 2.5:
            return None

        self._last_alert_time[throttle_key] = now_t
        self.event_counter += 1

        time_str = time.strftime("%H:%M:%S", time.gmtime(max(0, video_time_sec)))
        msec = int((video_time_sec % 1.0) * 100)
        formatted_time = f"{time_str}.{msec:02d}"

        event = {
            "event_id": self.event_counter,
            "timestamp_str": formatted_time,
            "video_time_sec": round(video_time_sec, 2),
            "frame_idx": frame_idx,
            "person_id": person_id,
            "action": action,
            "anomaly_type": anomaly_type,
            "zone": zone or "General Campus Courtyard",
            "severity": severity,  # NORMAL, WARNING, CRITICAL
            "details": details
        }

        self.events.append(event)
        self.recent_alerts.appendleft(event)

        # Append to CSV
        with open(self.csv_path, mode="a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                event["event_id"], event["timestamp_str"], event["video_time_sec"],
                event["frame_idx"], event["person_id"], event["action"],
                event["anomaly_type"], event["zone"], event["severity"], event["details"]
            ])

        # Write / Update JSON atomically
        try:
            with open(self.json_path, mode="w", encoding="utf-8") as f:
                json.dump(self.events, f, indent=2)
        except Exception as e:
            print(f"[Logger Warning] JSON save error: {e}")

        print(f"[{severity}] Time: {formatted_time} (Frame {frame_idx}) | Entity: Person #{person_id} | "
              f"Action: {action} | Anomaly: {anomaly_type} ({zone}) | Details: {details}")
        return event


# ==============================================================================
# 4. TRACK STATE & BEHAVIOUR ANALYSIS ENGINE
# ==============================================================================
class TrackState:
    """Maintains trajectory history, kinematics, posture state, and dwell times for one person."""
    def __init__(self, track_id, initial_pos, timestamp_sec):
        self.track_id = track_id
        # positions: deque of (foot_x, foot_y, center_x, center_y, time_sec)
        self.positions = deque(maxlen=60)
        self.positions.append((*initial_pos, timestamp_sec))

        self.first_seen_time = timestamp_sec
        self.last_seen_time = timestamp_sec




        # Loitering state
        self.stationary_anchor = initial_pos[0:2]  # (foot_x, foot_y)
        self.stationary_start_time = timestamp_sec
        self.loiter_duration = 0.0
        self.is_loitering = False

        # Kinematics
        self.speed_px_sec = 0.0
        self.current_action = "Standing"
        self.severity = "NORMAL"
        self.active_anomalies = set()
        self.current_zone = None
        self.zone_entry_time = None
        self.zone_dwell_sec = 0.0

        # Posture metrics
        self.is_fallen = False
        self.is_crouched = False

    def update(self, bbox, keypoints, timestamp_sec, zones, loiter_thresh=LOITERING_TIME_THRESHOLD_SEC):
        x1, y1, x2, y2 = bbox
        foot_x = (x1 + x2) / 2.0
        foot_y = float(y2)
        cx = (x1 + x2) / 2.0
        cy = (y1 + y2) / 2.0

        dt = max(0.001, timestamp_sec - self.last_seen_time)
        self.last_seen_time = timestamp_sec
        self.positions.append((foot_x, foot_y, cx, cy, timestamp_sec))

        # ----------------- 1. Calculate Speed & Kinematics -----------------
        if len(self.positions) >= 4:
            # smooth over past ~0.3-0.5s
            old_foot_x, old_foot_y, _, _, old_t = self.positions[-4]
            dist = math.hypot(foot_x - old_foot_x, foot_y - old_foot_y)
            elapsed = max(0.01, timestamp_sec - old_t)
            self.speed_px_sec = dist / elapsed
        else:
            self.speed_px_sec = 0.0

        # ----------------- 2. Posture & Pose Analysis -----------------
        self.analyze_pose(bbox, keypoints)

        # ----------------- 3. Action Recognition -----------------
        if self.is_fallen:
            self.current_action = "ABNORMAL: FALLEN"
        elif self.is_crouched:
            self.current_action = "Crouching"
        elif self.speed_px_sec > SPEED_RUNNING_THRESHOLD_PX_SEC:
            self.current_action = "Running"
        elif self.speed_px_sec > SPEED_WALKING_THRESHOLD_PX_SEC:
            self.current_action = "Walking"
        else:
            self.current_action = "Standing"

        # ----------------- 4. Loitering Detection -----------------
        anchor_dist = math.hypot(foot_x - self.stationary_anchor[0], foot_y - self.stationary_anchor[1])
        # Truly stationary: small spatial displacement AND low velocity
        is_stationary = (anchor_dist < LOITERING_RADIUS_PIXELS) and (self.speed_px_sec < SPEED_WALKING_THRESHOLD_PX_SEC * 1.6)
        if is_stationary:
            self.loiter_duration = timestamp_sec - self.stationary_start_time
            if self.loiter_duration >= loiter_thresh:
                self.is_loitering = True
        else:
            # Actively moving/walked away -> reset anchor
            self.stationary_anchor = (foot_x, foot_y)
            self.stationary_start_time = timestamp_sec
            self.loiter_duration = 0.0
            self.is_loitering = False

        # ----------------- 5. Restricted Zone Inspection -----------------
        new_zone = None
        for z in zones:
            pt = (float(foot_x), float(foot_y))
            inside = cv2.pointPolygonTest(z["polygon"], pt, False) >= 0
            if inside:
                new_zone = z["name"]
                break

        if new_zone is not None:
            if self.current_zone != new_zone:
                self.zone_entry_time = timestamp_sec
            self.current_zone = new_zone
            self.zone_dwell_sec = timestamp_sec - (self.zone_entry_time or timestamp_sec)
        else:
            self.current_zone = None
            self.zone_entry_time = None
            self.zone_dwell_sec = 0.0

    def analyze_pose(self, bbox, keypoints):
        """Inspects 17 COCO keypoints and aspect ratio to detect falls or crouching."""
        x1, y1, x2, y2 = bbox
        bw = max(1, x2 - x1)
        bh = max(1, y2 - y1)
        aspect_ratio = bw / float(bh)

        # Track max standing height seen for this individual
        if not hasattr(self, "max_standing_height"):
            self.max_standing_height = bh
        elif not self.is_fallen and bh > self.max_standing_height:
            self.max_standing_height = bh

        self.is_fallen = False

        # 1. Fall detection heuristic:
        # Bbox aspect ratio flip (lying flat on ground)
        if aspect_ratio >= 1.05:
            self.is_fallen = True
        elif aspect_ratio >= 0.82 and bh < self.max_standing_height * 0.65:
            self.is_fallen = True

        if keypoints is not None and len(keypoints) >= 17:
            nose = keypoints[NOSE]
            l_sh, r_sh = keypoints[L_SHOULDER], keypoints[R_SHOULDER]
            l_hip, r_hip = keypoints[L_HIP], keypoints[R_HIP]
            l_knee, r_knee = keypoints[L_KNEE], keypoints[R_KNEE]

            has_shoulders = l_sh[2] > 0.20 or r_sh[2] > 0.20
            has_hips = l_hip[2] > 0.20 or r_hip[2] > 0.20

            # Spine angle check: vector from shoulder midpoint to hip midpoint
            if has_shoulders and has_hips:
                sh_y = (l_sh[1] + r_sh[1]) / 2.0 if (l_sh[2] > 0.20 and r_sh[2] > 0.20) else (l_sh[1] if l_sh[2] > 0.20 else r_sh[1])
                sh_x = (l_sh[0] + r_sh[0]) / 2.0 if (l_sh[2] > 0.20 and r_sh[2] > 0.20) else (l_sh[0] if l_sh[2] > 0.20 else r_sh[0])
                hip_y = (l_hip[1] + r_hip[1]) / 2.0 if (l_hip[2] > 0.20 and r_hip[2] > 0.20) else (l_hip[1] if l_hip[2] > 0.20 else r_hip[1])
                hip_x = (l_hip[0] + r_hip[0]) / 2.0 if (l_hip[2] > 0.20 and r_hip[2] > 0.20) else (l_hip[0] if l_hip[2] > 0.20 else r_hip[0])

                dx = abs(sh_x - hip_x)
                dy = abs(sh_y - hip_y)
                # If horizontal span exceeds 85% of vertical span, torso is horizontal -> fallen
                if dx > dy * 0.85:
                    self.is_fallen = True

                # If head/nose is near or below hip level
                if nose[2] > 0.20 and nose[1] >= hip_y - 20:
                    self.is_fallen = True

            # 2. Crouching / suspicious posture:
            if not self.is_fallen and (l_knee[2] > 0.20 or r_knee[2] > 0.20):
                if bh < bw * 1.15 and aspect_ratio > 0.85:
                    self.is_crouched = True
                else:
                    self.is_crouched = False
            else:
                self.is_crouched = False
        else:
            self.is_crouched = False


class BehaviourAnalyzer:
    """Orchestrates multi-object tracks, checks anomaly rules, triggers event logs."""
    def __init__(self, logger, zones, loiter_thresh=LOITERING_TIME_THRESHOLD_SEC, after_hours_enabled=False):
        self.logger = logger
        self.zones = zones
        self.loiter_thresh = loiter_thresh
        self.after_hours_enabled = after_hours_enabled
        self.tracks = {}  # track_id -> TrackState

    def update_frame(self, detections, timestamp_sec, frame_idx):
        active_ids = set()

        for det in detections:
            tid = det["id"]
            bbox = det["bbox"]
            kps = det["keypoints"]
            active_ids.add(tid)

            foot_x = (bbox[0] + bbox[2]) / 2.0
            foot_y = float(bbox[3])
            cx = (bbox[0] + bbox[2]) / 2.0
            cy = (bbox[1] + bbox[3]) / 2.0

            if tid not in self.tracks:
                self.tracks[tid] = TrackState(tid, (foot_x, foot_y, cx, cy), timestamp_sec)

            track = self.tracks[tid]
            track.update(bbox, kps, timestamp_sec, self.zones, loiter_thresh=self.loiter_thresh)

            # Evaluate anomalies for this entity
            track.active_anomalies.clear()
            track.severity = "NORMAL"

            # Check 1: Restricted Zone Breach
            if track.current_zone is not None:
                track.active_anomalies.add(f"Restricted Zone: {track.current_zone}")
                track.severity = "CRITICAL"
                self.logger.log_event(
                    person_id=tid,
                    action=track.current_action,
                    anomaly_type="Restricted Zone Entry",
                    zone=track.current_zone,
                    severity="CRITICAL",
                    details=f"Unauthorized entry detected in {track.current_zone} (Dwell: {track.zone_dwell_sec:.1f}s)",
                    video_time_sec=timestamp_sec,
                    frame_idx=frame_idx
                )

            # Check 2: Loitering Violation
            if track.is_loitering:
                track.active_anomalies.add(f"Loitering ({track.loiter_duration:.1f}s)")
                if track.severity != "CRITICAL":
                    track.severity = "WARNING"
                self.logger.log_event(
                    person_id=tid,
                    action=track.current_action,
                    anomaly_type="Loitering Violation",
                    zone=track.current_zone,
                    severity="WARNING",
                    details=f"Stationary in spot for {track.loiter_duration:.1f}s (Threshold: {self.loiter_thresh:.1f}s)",
                    video_time_sec=timestamp_sec,
                    frame_idx=frame_idx
                )

            # Check 3: Abnormal Behavior: Fall Detected
            if track.is_fallen:
                track.active_anomalies.add("ABNORMAL: FALL DETECTED")
                track.severity = "CRITICAL"
                bw = max(1, bbox[2] - bbox[0])
                bh = max(1, bbox[3] - bbox[1])
                self.logger.log_event(
                    person_id=tid,
                    action="FALLEN DOWN",
                    anomaly_type="Abnormal Behavior: Fall Detected",
                    zone=track.current_zone,
                    severity="CRITICAL",
                    details=f"Entity #{tid} fell down / collapsed on ground (Aspect ratio: {bw/bh:.2f})",
                    video_time_sec=timestamp_sec,
                    frame_idx=frame_idx
                )

            # Check 4: Suspicious Rapid Flight / Running
            if track.current_action == "Running":
                track.active_anomalies.add(f"Rapid Running ({track.speed_px_sec:.0f} px/s)")
                if track.severity == "NORMAL":
                    track.severity = "WARNING"
                self.logger.log_event(
                    person_id=tid,
                    action="Running",
                    anomaly_type="Rapid Movement / Running",
                    zone=track.current_zone,
                    severity="WARNING",
                    details=f"Unusual high speed movement ({track.speed_px_sec:.1f} px/s) in hallway/campus",
                    video_time_sec=timestamp_sec,
                    frame_idx=frame_idx
                )

            # Check 5: After-Hours Presence
            if self.after_hours_enabled:
                track.active_anomalies.add("After-Hours Campus Presence")
                if track.severity == "NORMAL":
                    track.severity = "WARNING"
                self.logger.log_event(
                    person_id=tid,
                    action=track.current_action,
                    anomaly_type="After-Hours Presence",
                    zone=track.current_zone,
                    severity="WARNING",
                    details=f"Individual active during curfew window ({AFTER_HOURS_START} - {AFTER_HOURS_END})",
                    video_time_sec=timestamp_sec,
                    frame_idx=frame_idx
                )

        # ----------------- Check 6: Crowd Gathering -----------------
        self.check_crowd_clustering(active_ids, timestamp_sec, frame_idx)

        # Remove stale tracks that haven't been seen in > 5 seconds
        stale_ids = [tid for tid, trk in self.tracks.items() if timestamp_sec - trk.last_seen_time > 5.0]
        for tid in stale_ids:
            del self.tracks[tid]

        return active_ids

    def check_crowd_clustering(self, active_ids, timestamp_sec, frame_idx):
        """Detects if multiple persons cluster together within proximity threshold."""
        active_list = [self.tracks[tid] for tid in active_ids if tid in self.tracks]
        n = len(active_list)
        if n < CROWD_MIN_PERSON_COUNT:
            return

        cluster_counts = defaultdict(set)
        for i in range(n):
            for j in range(i + 1, n):
                p1 = active_list[i].positions[-1][:2]
                p2 = active_list[j].positions[-1][:2]
                dist = math.hypot(p1[0] - p2[0], p1[1] - p2[1])
                if dist < CROWD_DISTANCE_THRESHOLD_PX:
                    cluster_counts[active_list[i].track_id].add(active_list[j].track_id)
                    cluster_counts[active_list[j].track_id].add(active_list[i].track_id)

        for tid, neighbors in cluster_counts.items():
            if len(neighbors) + 1 >= CROWD_MIN_PERSON_COUNT:
                trk = self.tracks[tid]
                trk.active_anomalies.add(f"Crowd Cluster ({len(neighbors)+1} people)")
                if trk.severity == "NORMAL":
                    trk.severity = "WARNING"
                self.logger.log_event(
                    person_id=tid,
                    action="Gathering",
                    anomaly_type="Crowd Density Alert",
                    zone=trk.current_zone,
                    severity="WARNING",
                    details=f"Dense gathering of {len(neighbors)+1} individuals detected in close proximity",
                    video_time_sec=timestamp_sec,
                    frame_idx=frame_idx
                )


# ==============================================================================
# 5. SECURITY OPERATIONS CENTER HUD & VISUALIZATION
# ==============================================================================
class CampusHUDVisualizer:
    """Renders professional ops-center telemetry, glowing zones, and live alert ticker."""
    def __init__(self, frame_width, frame_height):
        self.w = frame_width
        self.h = frame_height

    def render(self, frame, tracks, active_ids, zones, logger, fps, video_time_sec, frame_idx, show_ticker=True):
        output = frame.copy()

        # 1. Draw Restricted Zones (Semi-transparent overlay)
        self.draw_zones(output, zones)

        # 2. Draw Trajectories & Breadcrumb Trails
        self.draw_trajectories(output, tracks, active_ids)

        # 3. Draw Persons: Skeletons, Bounding Boxes, Action & Anomaly Tags
        for tid in active_ids:
            if tid not in tracks:
                continue
            trk = tracks[tid]
            bbox = trk.positions[-1]  # (foot_x, foot_y, cx, cy)
            # Draw person representation
            self.draw_person_card(output, trk)

        # 4. Draw Top Telemetry Bar
        self.draw_top_bar(output, len(active_ids), logger.event_counter, fps, video_time_sec, frame_idx)

        # 5. Draw Live Anomaly Event Sidebar (Compact & toggleable)
        if show_ticker:
            self.draw_event_ticker(output, logger.recent_alerts)

        return output

    def draw_zones(self, frame, zones):
        overlay = frame.copy()
        alpha = 0.28

        for z in zones:
            poly = z["polygon"]
            color = z["color"]
            # Fill polygon
            cv2.fillPoly(overlay, [poly], color)
            # Outline
            cv2.polylines(frame, [poly], True, COLOR_ZONE_BORDER, 2, cv2.LINE_AA)

            # Zone Label banner
            cx = int(np.mean(poly[:, 0]))
            top_y = int(np.min(poly[:, 1])) + 24
            name = z["name"].upper()
            (tw, th), _ = cv2.getTextSize(name, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            cv2.rectangle(frame, (cx - tw // 2 - 8, top_y - th - 6), (cx + tw // 2 + 8, top_y + 6), (15, 15, 20), -1)
            cv2.rectangle(frame, (cx - tw // 2 - 8, top_y - th - 6), (cx + tw // 2 + 8, top_y + 6), COLOR_ZONE_BORDER, 1)
            cv2.putText(frame, name, (cx - tw // 2, top_y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (230, 230, 255), 2, cv2.LINE_AA)

        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

    def draw_trajectories(self, frame, tracks, active_ids):
        for tid in active_ids:
            if tid not in tracks:
                continue
            trk = tracks[tid]
            pts = list(trk.positions)
            if len(pts) < 2:
                continue

            color = COLOR_NORMAL
            if trk.severity == "WARNING":
                color = COLOR_WARNING
            elif trk.severity == "CRITICAL":
                color = COLOR_ALERT

            # Draw fading trajectory polyline
            for i in range(1, len(pts)):
                p1 = (int(pts[i - 1][0]), int(pts[i - 1][1]))
                p2 = (int(pts[i][0]), int(pts[i][1]))
                thickness = max(1, int(i / len(pts) * 3))
                cv2.line(frame, p1, p2, color, thickness, cv2.LINE_AA)

    def draw_person_card(self, frame, track):
        """Draws bounding box, status badges, and action labels."""
        if not hasattr(track, "last_bbox") or track.last_bbox is None:
            return

        x1, y1, x2, y2 = track.last_bbox
        tid = track.track_id
        action = track.current_action
        severity = track.severity

        # Determine theme color & header badge
        if track.is_fallen:
            box_color = (0, 0, 255)  # Bright Red
            header_text = f"ID:{tid} | ABNORMAL: FALLEN"
        elif severity == "WARNING":
            box_color = COLOR_WARNING
            header_text = f"ID:{tid} | {action}"
        elif severity == "CRITICAL":
            box_color = COLOR_ALERT
            header_text = f"ID:{tid} | {action}"
        else:
            box_color = COLOR_NORMAL
            header_text = f"ID:{tid} | {action}"

        # Sleek Corner Brackets (thicker for abnormal falls)
        box_thickness = 3 if track.is_fallen else 2
        self.draw_corner_box(frame, x1, y1, x2, y2, box_color, thickness=box_thickness)

        # Primary Badge: [ID: # | Action or ABNORMAL: FALLEN]
        (tw, th), _ = cv2.getTextSize(header_text, cv2.FONT_HERSHEY_SIMPLEX, 0.58, 2)
        badge_y1 = max(24, y1 - 10)
        cv2.rectangle(frame, (x1, badge_y1 - th - 8), (x1 + tw + 12, badge_y1 + 4), (15, 18, 25), -1)
        cv2.rectangle(frame, (x1, badge_y1 - th - 8), (x1 + tw + 12, badge_y1 + 4), box_color, 2 if track.is_fallen else 1)
        badge_text_color = (255, 255, 255) if track.is_fallen else box_color
        cv2.putText(frame, header_text, (x1 + 6, badge_y1 - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.58, badge_text_color, 2, cv2.LINE_AA)

        # Prominent banner below bbox for abnormal fall
        if track.is_fallen:
            fall_banner = "! ABNORMAL BEHAVIOR: PERSON FELL DOWN !"
            (fbw, fbh), _ = cv2.getTextSize(fall_banner, cv2.FONT_HERSHEY_SIMPLEX, 0.52, 2)
            banner_y = y2 + 22
            cv2.rectangle(frame, (x1, banner_y - fbh - 6), (x1 + fbw + 12, banner_y + 6), (0, 0, 220), -1)
            cv2.rectangle(frame, (x1, banner_y - fbh - 6), (x1 + fbw + 12, banner_y + 6), (0, 255, 255), 2)
            cv2.putText(frame, fall_banner, (x1 + 6, banner_y), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 2, cv2.LINE_AA)
        elif track.active_anomalies:
            offset_y = y2 + 16
            for anomaly in list(track.active_anomalies)[:2]:
                atxt = f"! {anomaly}"
                (atw, ath), _ = cv2.getTextSize(atxt, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                cv2.rectangle(frame, (x1, offset_y - ath - 4), (x1 + atw + 8, offset_y + 4), (10, 10, 15), -1)
                cv2.rectangle(frame, (x1, offset_y - ath - 4), (x1 + atw + 8, offset_y + 4), box_color, 1)
                cv2.putText(frame, atxt, (x1 + 4, offset_y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, box_color, 1, cv2.LINE_AA)
                offset_y += ath + 12

    def draw_corner_box(self, frame, x1, y1, x2, y2, color, thickness=2, corner_len=16):
        # Draw base thin rectangle
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 1)
        # Top-Left
        cv2.line(frame, (x1, y1), (x1 + corner_len, y1), color, thickness)
        cv2.line(frame, (x1, y1), (x1, y1 + corner_len), color, thickness)
        # Top-Right
        cv2.line(frame, (x2, y1), (x2 - corner_len, y1), color, thickness)
        cv2.line(frame, (x2, y1), (x2, y1 + corner_len), color, thickness)
        # Bottom-Left
        cv2.line(frame, (x1, y2), (x1 + corner_len, y2), color, thickness)
        cv2.line(frame, (x1, y2), (x1, y2 - corner_len), color, thickness)
        # Bottom-Right
        cv2.line(frame, (x2, y2), (x2 - corner_len, y2), color, thickness)
        cv2.line(frame, (x2, y2), (x2, y2 - corner_len), color, thickness)

    def draw_skeleton(self, frame, keypoints):
        if keypoints is None:
            return
        # Keypoints: [[x, y, conf], ...]
        for kp in keypoints:
            x, y, c = kp
            if c > 0.35:
                cv2.circle(frame, (int(x), int(y)), 4, (0, 255, 200), -1, cv2.LINE_AA)

        for a, b in SKELETON_CONNECTIONS:
            if keypoints[a][2] > 0.35 and keypoints[b][2] > 0.35:
                p1 = (int(keypoints[a][0]), int(keypoints[a][1]))
                p2 = (int(keypoints[b][0]), int(keypoints[b][1]))
                cv2.line(frame, p1, p2, COLOR_SKELETON, 2, cv2.LINE_AA)

    def draw_top_bar(self, frame, active_people, total_events, fps, video_time_sec, frame_idx):
        bar_h = 36 if self.w < 1000 else 44
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (self.w, bar_h), COLOR_HUD_BG, -1)
        cv2.addWeighted(overlay, 0.88, frame, 0.12, 0, frame)
        cv2.line(frame, (0, bar_h), (self.w, bar_h), (60, 70, 85), 1)

        font_scale = 0.44 if self.w < 1000 else 0.58
        title = "CAMPUS VISION AI" if self.w < 1000 else "HNX26PSI07: CAMPUS AUTONOMOUS VISION & BEHAVIOUR ANALYTICS"
        cv2.putText(frame, title, (12, bar_h - 12), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 220, 255), 2, cv2.LINE_AA)

        # Video Clock & Frame
        time_str = time.strftime("%M:%S", time.gmtime(max(0, video_time_sec)))
        msec = int((video_time_sec % 1.0) * 10)
        time_display = f"{time_str}.{msec}s | F:{frame_idx}"
        stat_text = f"P:{active_people} | ALERTS:{total_events} | FPS:{fps:.0f}"

        if self.w < 1000:
            right_combo = f"{time_display}  {stat_text}"
            (rtw, _), _ = cv2.getTextSize(right_combo, cv2.FONT_HERSHEY_SIMPLEX, font_scale - 0.06, 1)
            cv2.putText(frame, right_combo, (self.w - rtw - 10, bar_h - 12),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale - 0.06, (0, 255, 130), 1, cv2.LINE_AA)
        else:
            cv2.putText(frame, time_display, (self.w - 440, bar_h - 13), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (200, 200, 200), 1, cv2.LINE_AA)
            cv2.putText(frame, stat_text, (self.w - 270, bar_h - 13), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 120), 2, cv2.LINE_AA)

    def draw_event_ticker(self, frame, recent_alerts):
        """Renders compact, streamlined security events ticker in top-right."""
        if not recent_alerts:
            return

        num_alerts = min(3, len(recent_alerts))
        panel_w = 175 if self.w < 1000 else 215
        panel_x = self.w - panel_w - 8
        panel_y = 42 if self.w < 1000 else 52
        panel_h = 20 + num_alerts * 18

        overlay = frame.copy()
        cv2.rectangle(overlay, (panel_x, panel_y), (panel_x + panel_w, panel_y + panel_h), (14, 16, 22), -1)
        cv2.addWeighted(overlay, 0.65, frame, 0.35, 0, frame)
        cv2.rectangle(frame, (panel_x, panel_y), (panel_x + panel_w, panel_y + panel_h), (50, 65, 80), 1)

        # Header
        f_sz = 0.32 if self.w < 1000 else 0.36
        cv2.putText(frame, "AUDIT STREAM", (panel_x + 6, panel_y + 13),
                    cv2.FONT_HERSHEY_SIMPLEX, f_sz, (0, 210, 255), 1, cv2.LINE_AA)
        cv2.line(frame, (panel_x + 5, panel_y + 16), (panel_x + panel_w - 5, panel_y + 16), (45, 55, 70), 1)

        # Compact Rows
        curr_y = panel_y + 30
        for ev in list(recent_alerts)[:num_alerts]:
            sev = ev["severity"]
            sev_color = COLOR_ALERT if sev == "CRITICAL" else COLOR_WARNING

            cv2.circle(frame, (panel_x + 9, curr_y - 3), 3, sev_color, -1)

            t_sec = ev.get("video_time_sec", 0.0)
            short_type = ev["anomaly_type"].replace("Abnormal Behavior: ", "").replace("Restricted Zone Entry", "Zone Breach")[:15]
            row_text = f"[{t_sec:.1f}s] #{ev['person_id']}: {short_type}"
            cv2.putText(frame, row_text, (panel_x + 16, curr_y), cv2.FONT_HERSHEY_SIMPLEX, f_sz - 0.03, COLOR_TEXT_WHITE, 1, cv2.LINE_AA)

            curr_y += 17


# ==============================================================================
# 6. INTERACTIVE RESTRICTED ZONE CALIBRATOR
# ==============================================================================
class ZoneCalibrator:
    """Allows user to click on the video frame to draw custom restricted zones!"""
    def __init__(self):
        self.points = []
        self.is_drawing = False

    def mouse_callback(self, event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN:
            self.points.append([x, y])
            print(f"[Zone Calibrator] Point added: ({x}, {y})")
        elif event == cv2.EVENT_RBUTTONDOWN and self.points:
            self.points.pop()
            print("[Zone Calibrator] Removed last point.")


# ==============================================================================
# 7. MAIN PIPELINE EXECUTION
# ==============================================================================
def resolve_video_source(custom_path=None):
    """Finds target video path or selects the best fallback sample in workspace."""
    if custom_path and os.path.exists(custom_path):
        return custom_path

    if os.path.exists(DUMMY_VIDEO_SLOT):
        return DUMMY_VIDEO_SLOT

    for fb in FALLBACK_VIDEOS:
        if os.path.exists(fb):
            print(f"[Auto-Detection] '{DUMMY_VIDEO_SLOT}' not found. Falling back to sample video: '{fb}'")
            return fb

    raise FileNotFoundError(f"Could not locate '{DUMMY_VIDEO_SLOT}' or any fallback video ({FALLBACK_VIDEOS}).")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="HNX26PSI07 Campus Behaviour & Anomaly Vision AI")
    parser.add_argument("--video", type=str, default=None, help="Path to campus video (dummy slot: input_campus.mp4)")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL_PATH, help="YOLO Pose model path")
    parser.add_argument("--save", action="store_true", help="Save annotated video output (output_campus_anomaly.mp4)")
    parser.add_argument("--headless", action="store_true", help="Run without cv2.imshow GUI (useful for background batches)")
    parser.add_argument("--loiter-sec", type=float, default=LOITERING_TIME_THRESHOLD_SEC, help="Loitering threshold in seconds")
    parser.add_argument("--max-frames", type=int, default=0, help="Stop after N frames (0 for full video)")
    parser.add_argument("--after-hours", action="store_true", help="Enable curfew / after-hours presence alert")
    parser.add_argument("--skip-draw", action="store_true", help="Skip manual zone drawing at startup and use defaults")
    args = parser.parse_args()

    video_path = resolve_video_source(args.video)
    print(f"\n=======================================================")
    print(f" HNX26PSI07: AUTONOMOUS VISION & BEHAVIOUR ANALYTICS")
    print(f" Target Video Source : {video_path}")
    print(f" Pose & Track Model  : {args.model}")
    print(f" Loitering Threshold : {args.loiter_sec} seconds")
    print(f" After-Hours Check   : {'ENABLED' if args.after_hours else 'DISABLED'}")
    print(f" Interactive Keys    : 'q' -> Quit & Export Report")
    print(f"                       'p' -> Pause/Resume")
    print(f"                       's' -> Save Snapshot")
    print(f"                       'z' -> Calibrate Restricted Zone")
    print(f"=======================================================\n")

    # Load YOLO-Pose Model
    print(f"[Loading Model] Initializing {args.model} ...")
    model = YOLO(args.model)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video source '{video_path}'")
        sys.exit(1)

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    ret, first_frame = cap.read()
    if not ret:
        print(f"Error: Could not read first frame from '{video_path}'")
        sys.exit(1)

    # ---------------- MANUAL RESTRICTED ZONE SETUP ----------------
    zones = []
    if not args.headless and not args.skip_draw:
        print("\n" + "=" * 65)
        print(" [MANUAL RESTRICTED AREA SETUP]")
        print(" A window has opened with the first frame.")
        print(" 1. Click and drag a box with your mouse to set the restricted area.")
        print(" 2. Press ENTER or SPACE to confirm.")
        print(" 3. (Or press 'c' / ESC to skip and use default campus zones).")
        print("=" * 65 + "\n")

        roi_title = "DRAW RESTRICTED AREA: Drag box & press ENTER (or 'c' to skip)"
        roi_box = cv2.selectROI(roi_title, first_frame, fromCenter=False, showCrosshair=True)
        cv2.destroyWindow(roi_title)

        rx, ry, rw, rh = roi_box
        if rw > 15 and rh > 15:
            user_zone = {
                "name": "Restricted Zone: Custom Area",
                "polygon": np.array([
                    [rx, ry],
                    [rx + rw, ry],
                    [rx + rw, ry + rh],
                    [rx, ry + rh]
                ], dtype=np.int32),
                "color": (0, 0, 220),
                "description": "User Drawn Restricted Area"
            }
            zones.append(user_zone)
            print(f"[Zone Configured] Restricted Area locked: x={rx}, y={ry}, w={rw}, h={rh}\n")
        else:
            print("[Zone Configured] No custom box drawn — loading default campus zones.\n")
            zones = get_default_zones(width, height)
    else:
        zones = get_default_zones(width, height)

    # Rewind video to frame 0 for processing
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    logger = EventLogger(json_path="campus_events.json", csv_path="campus_events.csv")
    analyzer = BehaviourAnalyzer(
        logger=logger,
        zones=zones,
        loiter_thresh=args.loiter_sec,
        after_hours_enabled=args.after_hours
    )
    visualizer = CampusHUDVisualizer(width, height)

    # Optional Video Writer
    writer = None
    if args.save:
        out_name = "output_campus_anomaly.mp4"
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(out_name, fourcc, fps, (width, height))
        print(f"[Video Writer] Output will be saved to: {out_name}")

    frame_idx = 0
    start_wall_time = time.time()
    paused = False
    show_ticker = True

    win_name = "HNX26PSI07 - Autonomous Campus Behaviour & Anomaly AI"
    if not args.headless:
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_name, min(1280, width), min(720, height))

    try:
        while cap.isOpened():
            if not paused:
                ret, frame = cap.read()
                if not ret:
                    print("\n[Video Complete] Reached end of video stream.")
                    break

                frame_idx += 1
                video_time_sec = frame_idx / fps
                if args.max_frames > 0 and frame_idx >= args.max_frames:
                    print(f"[Testing] Reached max frames limit ({args.max_frames}). Stopping.")
                    break

                # Track using YOLOv8-Pose with ByteTrack
                # ByteTrack is extremely fast and robust for continuous ID tracking
                results = model.track(
                    frame,
                    persist=True,
                    classes=[0],  # Person class only
                    tracker="bytetrack.yaml",
                    verbose=False
                )[0]

                detections = []
                if results.boxes.id is not None:
                    ids = results.boxes.id.int().cpu().tolist()
                    boxes = results.boxes.xyxy.cpu().tolist()
                    keypoints_data = results.keypoints.data.cpu().tolist() if results.keypoints is not None else [None] * len(ids)

                    for tid, box, kps in zip(ids, boxes, keypoints_data):
                        detections.append({
                            "id": tid,
                            "bbox": [int(b) for b in box],
                            "keypoints": kps
                        })

                # Update Behaviour Analyzer & Rules
                active_ids = analyzer.update_frame(detections, video_time_sec, frame_idx)

                # Cache current bbox & skeleton on track for visualizer
                for det in detections:
                    tid = det["id"]
                    if tid in analyzer.tracks:
                        analyzer.tracks[tid].last_bbox = det["bbox"]
                        analyzer.tracks[tid].last_kps = det["keypoints"]

                # Render Ops HUD
                calc_fps = frame_idx / max(0.01, time.time() - start_wall_time)
                hud_frame = visualizer.render(
                    frame=frame,
                    tracks=analyzer.tracks,
                    active_ids=active_ids,
                    zones=zones,
                    logger=logger,
                    fps=calc_fps,
                    video_time_sec=video_time_sec,
                    frame_idx=frame_idx,
                    show_ticker=show_ticker
                )

                # Draw Skeletons
                for det in detections:
                    if det["keypoints"] is not None:
                        visualizer.draw_skeleton(hud_frame, det["keypoints"])

                if frame_idx == 65:
                    cv2.imwrite("demo_snapshot.jpg", hud_frame)
                    print(f"[Snapshot] Auto-saved demo preview to demo_snapshot.jpg")

                if writer:
                    writer.write(hud_frame)

                if not args.headless:
                    cv2.imshow(win_name, hud_frame)

            # Keyboard controls
            if not args.headless:
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    print("[User] Exiting on 'q'...")
                    break
                elif key == ord('p'):
                    paused = not paused
                    print(f"[User] {'PAUSED' if paused else 'RESUMED'}")
                elif key == ord('s'):
                    snap_name = f"snapshot_f{frame_idx}.jpg"
                    cv2.imwrite(snap_name, hud_frame)
                    print(f"[Snapshot] Saved to {snap_name}")
                elif key == ord('t'):
                    show_ticker = not show_ticker
                    print(f"[HUD] Audit stream ticker {'ENABLED' if show_ticker else 'HIDDEN'}")
                elif key == ord('z'):
                    print("\n[Zone Calibrator] Video paused.")
                    print(" Drag a box on the window to add a restricted area, then press ENTER.")
                    roi_title = "Add Restricted Area - Drag box & press ENTER (or 'c' to cancel)"
                    roi_box = cv2.selectROI(roi_title, frame, fromCenter=False, showCrosshair=True)
                    cv2.destroyWindow(roi_title)
                    rx, ry, rw, rh = roi_box
                    if rw > 15 and rh > 15:
                        new_zone = {
                            "name": f"Restricted Zone #{len(zones) + 1}",
                            "polygon": np.array([
                                [rx, ry],
                                [rx + rw, ry],
                                [rx + rw, ry + rh],
                                [rx, ry + rh]
                            ], dtype=np.int32),
                            "color": (0, 0, 220),
                            "description": "User Drawn Restricted Area"
                        }
                        zones.append(new_zone)
                        print(f"[Zone Added] {new_zone['name']} created at ({rx}, {ry}, {rw}, {rh})!\n")
                    else:
                        print("[Zone Calibrator] Cancelled.\n")

    finally:
        cap.release()
        if writer:
            writer.release()
        if not args.headless:
            cv2.destroyAllWindows()

    # Final Summary Report
    print(f"\n=======================================================")
    print(f" AUDIT & BEHAVIOUR SUMMARY REPORT")
    print(f"=======================================================")
    print(f" Total Video Frames Processed: {frame_idx}")
    print(f" Total Unique People Tracked : {len(analyzer.tracks)}")
    print(f" Total Anomaly Events Flagged: {logger.event_counter}")
    print(f" Structured Audit JSON       : {logger.json_path}")
    print(f" Structured Audit CSV        : {logger.csv_path}")
    if args.save:
        print(f" Annotated Video             : output_campus_anomaly.mp4")
    print(f"=======================================================\n")


if __name__ == "__main__":
    main()
