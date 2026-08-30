import React, { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import ActivityMap from '../components/ActivityMap';
import WeeklyStats from '../components/WeeklyStats';
import timezoneFormatter from '../utils/timezone';

function AnalyticsPage() {
  const { allActivities, loadAllActivities } = useApp();

  useEffect(() => {
    loadAllActivities();
  }, []);

  // Get activities from the last 7 days
  const recentActivities = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return allActivities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= sevenDaysAgo;
    });
  }, [allActivities]);

  // Get activities with GPS
  const activitiesWithGPS = useMemo(() => {
    return allActivities.filter(a => a.gps_lat !== null && a.gps_lon !== null);
  }, [allActivities]);

  return (
    <>
      <div className="activities">
        <h2>Weekly Statistics</h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Last 7 days
        </p>
        <WeeklyStats activities={recentActivities} />
      </div>

      {activitiesWithGPS.length > 0 && (
        <div className="activities">
          <h2>Activity Map</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            Showing {activitiesWithGPS.length} activities with GPS coordinates
          </p>
          <ActivityMap activities={activitiesWithGPS} />
        </div>
      )}

      {activitiesWithGPS.length === 0 && (
        <div className="activities">
          <h2>Activity Map</h2>
          <div className="empty-state">
            No activities with GPS coordinates yet.
            Enable GPS when logging activities to see them on the map.
          </div>
        </div>
      )}
    </>
  );
}

export default AnalyticsPage;
