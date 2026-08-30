import React, { useMemo } from 'react';
import { ACTIVITY_EMOJI } from '../constants';

function WeeklyStats({ activities }) {
  const stats = useMemo(() => {
    const typeCounts = {};
    activities.forEach(activity => {
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
    });

    return [
      { type: 'potty', count: typeCounts.potty || 0 },
      { type: 'vomit', count: typeCounts.vomit || 0 },
      { type: 'eating', count: typeCounts.eating || 0 },
      { type: 'groom', count: typeCounts.groom || 0 },
      { type: 'surgery', count: typeCounts.surgery || 0 }
    ];
  }, [activities]);

  const avgPerDay = useMemo(() => {
    return (activities.length / 7).toFixed(1);
  }, [activities]);

  return (
    <div>
      <div style={{ 
        background: '#f8f9fa', 
        padding: '16px', 
        borderRadius: '12px', 
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', fontWeight: '700', color: '#667eea' }}>
          {activities.length}
        </div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
          Total Activities
        </div>
        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
          {avgPerDay} per day average
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {stats.map(({ type, count }) => (
          <div
            key={type}
            style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>
              {ACTIVITY_EMOJI[type]}
            </div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#666', 
              marginBottom: '4px',
              textTransform: 'capitalize'
            }}>
              {type}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#667eea' }}>
              {count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeeklyStats;
