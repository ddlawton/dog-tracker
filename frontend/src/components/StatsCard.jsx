import React from 'react';
import { ACTIVITY_EMOJI, ACTIVITY_COLORS } from '../constants';
import timezoneFormatter from '../utils/timezone';

function StatsCard({ stats, allActivities }) {
  const getLastActivityTime = (type) => {
    const activities = allActivities.filter(a => a.type === type);
    if (activities.length === 0) return 'Never';
    
    const lastActivity = activities[0]; // Already sorted by timestamp DESC
    return timezoneFormatter.getRelativeTime(lastActivity.timestamp);
  };

  const getTodayCount = (type) => {
    const stat = stats.find(s => s.type === type);
    return stat ? stat.count : 0;
  };

  const activityTypes = ['potty', 'vomit', 'eating', 'groom', 'surgery'];

  return (
    <div className="stats">
      <h2>Today's Activity</h2>
      <div className="stats-grid">
        {activityTypes.map(type => (
          <div key={type} className={`stat-card ${type}`}>
            <div className="stat-emoji">{ACTIVITY_EMOJI[type]}</div>
            <div className="stat-type">{type}</div>
            <div className="stat-count">{getTodayCount(type)} times</div>
            <div className="stat-last">{getLastActivityTime(type)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatsCard;
