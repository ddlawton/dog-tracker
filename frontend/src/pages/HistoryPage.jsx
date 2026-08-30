import React, { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Calendar from '../components/Calendar';
import timezoneFormatter from '../utils/timezone';

function HistoryPage() {
  const { allActivities, loadAllActivities, changeDate } = useApp();

  useEffect(() => {
    loadAllActivities();
  }, []);

  // Group activities by date for calendar display
  const activityCounts = useMemo(() => {
    const counts = {};
    allActivities.forEach(activity => {
      const date = timezoneFormatter.toLocalDateString(activity.timestamp);
      counts[date] = (counts[date] || 0) + 1;
    });
    return counts;
  }, [allActivities]);

  const handleDateClick = (date) => {
    changeDate(date);
    // Switch to today page would require lifting state, so we'll just change the date
  };

  return (
    <div className="activities">
      <h2>Activity History</h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        Tap a date to view activities
      </p>
      <Calendar 
        activityCounts={activityCounts}
        onDateClick={handleDateClick}
      />
    </div>
  );
}

export default HistoryPage;
