import React from 'react';
import {
  LayoutDashboard,
  Video,
  PlaySquare,
  AlertTriangle,
  Users,
  ShieldAlert,
  Film,
  Settings,
  Activity,
  Radio
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, counts = {}, systemStatus = {} }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-monitor', label: 'Live Monitor', icon: Video, badge: counts.cameras || 4, badgeType: 'live' },
    { id: 'video-analysis', label: 'Video Analysis', icon: PlaySquare },
    { id: 'safety-events', label: 'Safety Events', icon: AlertTriangle, badge: counts.events || 16, badgeType: 'alert' },
    { id: 'tracked-people', label: 'Tracked People', icon: Users, badge: counts.people || 4 },
    { id: 'restricted-zones', label: 'Restricted Zones', icon: ShieldAlert, badge: counts.zones || 3 },
    { id: 'test-videos', label: 'Test Videos', icon: Film },
    { id: 'settings', label: 'Settings & Supabase', icon: Settings }
  ];

  return (
    <aside className="sidebar">
      {/* Product Identity */}
      <div className="brand-section">
        <div className="brand-title">
          <span>SENTRA-X</span>
          <span className="brand-badge">PRO-OPS</span>
        </div>
        <div className="brand-subtitle">
          Security & Entity Tracking with Temporal Reasoning
        </div>
        <div className="brand-author">
          <Activity size={12} />
          <span>by BYTE-X</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="nav-menu">
        <div className="nav-section-label">SURVEILLANCE OPERATIONS</div>
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="nav-item-left">
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`nav-count ${item.badgeType === 'alert' ? 'alert' : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="nav-section-label">INTELLIGENCE & CONFIG</div>
        {navItems.slice(4).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="nav-item-left">
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="nav-count">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Operations Footer */}
      <div className="sidebar-footer">
        <div className="status-pill">
          <span className="indicator-dot"></span>
          <span>CV ENGINE: YOLOv8-POSE</span>
        </div>
        <div className="status-pill">
          <span className={`indicator-dot ${systemStatus.supabase_connected ? '' : 'amber'}`}></span>
          <span>{systemStatus.supabase_connected ? 'SUPABASE: SYNCED' : 'STORAGE: LOCAL/FILE'}</span>
        </div>
      </div>
    </aside>
  );
}
