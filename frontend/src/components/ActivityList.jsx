import React from 'react';
import ActivityItem from './ActivityItem';

function ActivityList({ activities, onDelete, currentDate }) {
  if (activities.length === 0) {
    return (
      <div className="activities">
        <h2>Activities for {currentDate}</h2>
        <div className="empty-state">
          No activities logged for this date
        </div>
      </div>
    );
  }

  return (
    <div className="activities">
      <h2>Activities for {currentDate}</h2>
      <div className="activities-list">
        {activities.map(activity => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onDelete={() => onDelete(activity.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default ActivityList;
