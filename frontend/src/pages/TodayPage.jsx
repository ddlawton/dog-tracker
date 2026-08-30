import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import QuickAdd from '../components/QuickAdd';
import StatsCard from '../components/StatsCard';
import ActivityList from '../components/ActivityList';

function TodayPage() {
  const { 
    currentDate, 
    activities, 
    allActivities,
    stats, 
    loading, 
    loadActivities, 
    loadAllActivities,
    loadStats,
    deleteActivity 
  } = useApp();

  useEffect(() => {
    if (currentDate) {
      loadActivities(currentDate);
      loadAllActivities();
      loadStats();
    }
  }, [currentDate]);

  if (loading || !currentDate) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
        <div className="spinner" style={{ display: 'inline-block' }}></div>
        <div style={{ marginTop: '16px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <QuickAdd />
      <StatsCard stats={stats} allActivities={allActivities} />
      <ActivityList 
        activities={activities} 
        onDelete={deleteActivity}
        currentDate={currentDate}
      />
    </>
  );
}

export default TodayPage;
