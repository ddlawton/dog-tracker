import React from 'react';
import { ACTIVITY_EMOJI } from '../constants';
import timezoneFormatter from '../utils/timezone';
import { hasValidGPS, formatGPSCoordinates } from '../utils/gps';
import { escapeHtml } from '../utils/security';

function ActivityItem({ activity, onDelete }) {
  const { type, subtype, timestamp, notes, gps_lat, gps_lon } = activity;

  const displayType = type === 'potty' && subtype ? `${type} (${subtype})` : type;
  const hasGPS = hasValidGPS(activity);
  const coords = hasGPS ? formatGPSCoordinates(gps_lat, gps_lon) : null;

  const handleDelete = async () => {
    if (window.confirm(`Delete this ${type} activity?`)) {
      try {
        await onDelete();
      } catch (error) {
        alert('Failed to delete activity');
      }
    }
  };

  return (
    <div className={`activity-item ${type}`}>
      <div className="activity-info">
        <div className="activity-header">
          <span className="emoji">{ACTIVITY_EMOJI[type]}</span>
          <span>{displayType}</span>
        </div>
        <div className="activity-time">
          {timezoneFormatter.formatTime(timestamp)}
        </div>
        {notes && (
          <div 
            className="activity-notes"
            dangerouslySetInnerHTML={{ __html: escapeHtml(notes) }}
          />
        )}
        {hasGPS && coords && (
          <div className="activity-coords">
            📍 {coords.lat}, {coords.lon}
          </div>
        )}
      </div>
      <button className="activity-delete" onClick={handleDelete}>
        ✕
      </button>
    </div>
  );
}

export default ActivityItem;
