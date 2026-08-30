import React, { useMemo } from 'react';
import { DateTime } from 'luxon';
import { useApp } from '../context/AppContext';
import timezoneFormatter from '../utils/timezone';

function Calendar({ activityCounts, onDateClick }) {
  const { timezone } = useApp();

  const { year, month, weeks } = useMemo(() => {
    const now = DateTime.now().setZone(timezone);
    const firstDay = now.startOf('month');
    const lastDay = now.endOf('month');
    
    // Get the first day of the calendar (might be from previous month)
    let calendarStart = firstDay.startOf('week');
    // Get the last day of the calendar (might be from next month)
    let calendarEnd = lastDay.endOf('week');
    
    const weeks = [];
    let currentWeek = [];
    let current = calendarStart;
    
    while (current <= calendarEnd) {
      currentWeek.push({
        date: current.toFormat('yyyy-MM-dd'),
        day: current.day,
        isCurrentMonth: current.month === now.month,
        isToday: current.hasSame(now, 'day'),
        activityCount: activityCounts[current.toFormat('yyyy-MM-dd')] || 0
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      current = current.plus({ days: 1 });
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return {
      year: now.year,
      month: now.toFormat('MMMM'),
      weeks
    };
  }, [timezone, activityCounts]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDateClassName = (dayInfo) => {
    const classes = ['calendar-date'];
    if (!dayInfo.isCurrentMonth) classes.push('inactive');
    if (dayInfo.activityCount > 0) classes.push('has-activities');
    if (dayInfo.activityCount >= 5) classes.push('high-activity');
    return classes.join(' ');
  };

  return (
    <div>
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: '600', 
        marginBottom: '16px', 
        color: '#333',
        textAlign: 'center'
      }}>
        {month} {year}
      </h3>
      
      <div className="calendar-header">
        {dayNames.map(day => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
      </div>
      
      <div className="calendar">
        {weeks.map((week, weekIndex) => (
          week.map((dayInfo, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className={getDateClassName(dayInfo)}
              onClick={() => dayInfo.isCurrentMonth && onDateClick(dayInfo.date)}
            >
              <div className="calendar-date-number">{dayInfo.day}</div>
              {dayInfo.activityCount > 0 && (
                <div className="calendar-date-count">
                  {dayInfo.activityCount}
                </div>
              )}
            </div>
          ))
        ))}
      </div>
    </div>
  );
}

export default Calendar;
