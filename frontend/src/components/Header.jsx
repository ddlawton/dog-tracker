import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DatePickerModal from './modals/DatePickerModal';
import TimezoneModal from './modals/TimezoneModal';
import { activitiesAPI } from '../services/api';

function Header() {
  const { goToToday } = useApp();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);

  const handleExport = async () => {
    try {
      const data = await activitiesAPI.export();
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `josie-tracker-export-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  return (
    <>
      <header>
        <h1>🐕 Josie Tracker</h1>
        <div className="header-actions">
          <button 
            className="icon-btn" 
            onClick={() => setShowDatePicker(true)}
            title="Pick date"
          >
            📅
          </button>
          <button 
            className="icon-btn" 
            onClick={handleExport}
            title="Export data"
          >
            💾
          </button>
          <button 
            className="icon-btn" 
            onClick={() => setShowTimezonePicker(true)}
            title="Change timezone"
          >
            🌍
          </button>
        </div>
      </header>

      {showDatePicker && (
        <DatePickerModal onClose={() => setShowDatePicker(false)} />
      )}
      
      {showTimezonePicker && (
        <TimezoneModal onClose={() => setShowTimezonePicker(false)} />
      )}
    </>
  );
}

export default Header;
