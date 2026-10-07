import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardPage from './pages/DashboardPage';
import LiveMonitorPage from './pages/LiveMonitorPage';
import VideoAnalysisPage from './pages/VideoAnalysisPage';
import SafetyEventsPage from './pages/SafetyEventsPage';
import TrackedPeoplePage from './pages/TrackedPeoplePage';
import RestrictedZonesPage from './pages/RestrictedZonesPage';
import TestVideosPage from './pages/TestVideosPage';
import SettingsPage from './pages/SettingsPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('OFFICER');

  const [systemStatus, setSystemStatus] = useState({});
  const [kpis, setKpis] = useState({});
  const [cameras, setCameras] = useState([]);
  const [events, setEvents] = useState([]);
  const [people, setPeople] = useState([]);
  const [zones, setZones] = useState([]);
  const [testVideos, setTestVideos] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load all system data
  const refreshAllData = async () => {
    try {
      const [statusData, kpiData, camData, evData, peopleData, zoneData, vidData] = await Promise.all([
        api.getStatus(),
        api.getKpis(),
        api.getCameras(),
        api.getEvents(),
        api.getTrackedPeople(),
        api.getZones(),
        api.getTestVideos()
      ]);

      setSystemStatus(statusData || {});
      setKpis(kpiData || {});
      setCameras(camData || []);
      setEvents(evData || []);
      setPeople(peopleData || []);
      setZones(zoneData || []);
      setTestVideos(vidData || []);
    } catch (err) {
      console.warn('[SENTRA-X] Data fetch warning:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Event status update handler
  const handleUpdateEventStatus = async (eventId, action) => {
    await api.updateEventAction(eventId, action);
    setEvents((prev) =>
      prev.map((e) => (e.event_id === eventId ? { ...e, status: action } : e))
    );
  };

  // Zone handlers
  const handleAddZone = async (zoneData) => {
    try {
      const created = await api.createZone(zoneData);
      setZones((prev) => [...prev, created]);
    } catch (err) {
      console.error('Failed to create zone:', err);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      await api.deleteZone(zoneId);
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
    } catch (err) {
      console.error('Failed to delete zone:', err);
    }
  };

  const handleSelectVideoForAnalysis = (filename) => {
    setActiveTab('video-analysis');
  };

  return (
    <div className="app-container">
      {/* Sidebar with SENTRA-X branding */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{
          cameras: cameras.length,
          events: events.length,
          people: people.length,
          zones: zones.length
        }}
        systemStatus={systemStatus}
      />

      {/* Main Operations Console */}
      <div className="main-wrapper">
        <Topbar
          activeTab={activeTab}
          userRole={userRole}
          setUserRole={setUserRole}
          kpis={kpis}
        />

        <main className="content-body">
          {activeTab === 'dashboard' && (
            <DashboardPage
              kpis={kpis}
              events={events}
              onSelectEvent={setSelectedEvent}
              onUpdateEventStatus={handleUpdateEventStatus}
              onViewEntity={(id) => setActiveTab('tracked-people')}
            />
          )}

          {activeTab === 'live-monitor' && (
            <LiveMonitorPage
              cameras={cameras}
              events={events}
              onSelectEvent={setSelectedEvent}
            />
          )}

          {activeTab === 'video-analysis' && (
            <VideoAnalysisPage onEventsUpdated={refreshAllData} />
          )}

          {activeTab === 'safety-events' && (
            <SafetyEventsPage
              events={events}
              onUpdateEventStatus={handleUpdateEventStatus}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
            />
          )}

          {activeTab === 'tracked-people' && (
            <TrackedPeoplePage people={people} />
          )}

          {activeTab === 'restricted-zones' && (
            <RestrictedZonesPage
              zones={zones}
              onAddZone={handleAddZone}
              onDeleteZone={handleDeleteZone}
            />
          )}

          {activeTab === 'test-videos' && (
            <TestVideosPage
              testVideos={testVideos}
              onSelectForAnalysis={handleSelectVideoForAnalysis}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              userRole={userRole}
              setUserRole={setUserRole}
              systemStatus={systemStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}
