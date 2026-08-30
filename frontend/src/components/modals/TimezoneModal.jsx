import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { useApp } from '../../context/AppContext';

// Common US timezones
const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
];

// Get all available timezones
const getAllTimezones = () => {
  try {
    if (Intl.supportedValuesOf) {
      return Intl.supportedValuesOf('timeZone');
    }
  } catch (e) {
    console.warn('Intl.supportedValuesOf not available');
  }
  return COMMON_TIMEZONES;
};

function TimezoneModal({ onClose }) {
  const { timezone, updateTimezone } = useApp();
  const [selectedTimezone, setSelectedTimezone] = useState(timezone);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const allTimezones = useMemo(() => getAllTimezones(), []);

  const filteredTimezones = useMemo(() => {
    if (!searchTerm) {
      // Show common timezones at top, then all others
      const others = allTimezones.filter(tz => !COMMON_TIMEZONES.includes(tz));
      return [...COMMON_TIMEZONES, ...others];
    }
    
    return allTimezones.filter(tz =>
      tz.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allTimezones]);

  const handleSubmit = async () => {
    if (selectedTimezone === timezone) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await updateTimezone(selectedTimezone);
      onClose();
    } catch (error) {
      alert('Failed to update timezone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="🌍 Change Timezone">
      <div className="form-group">
        <label>Current: {timezone}</label>
        <input
          type="text"
          placeholder="Search timezones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '12px'
          }}
        />
      </div>

      <div className="timezone-list">
        {filteredTimezones.map((tz) => (
          <div
            key={tz}
            className={`timezone-option ${selectedTimezone === tz ? 'selected' : ''}`}
            onClick={() => setSelectedTimezone(tz)}
          >
            {tz}
            {COMMON_TIMEZONES.includes(tz) && ' ⭐'}
          </div>
        ))}
      </div>

      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Updating...' : 'Update Timezone'}
        </button>
      </div>
    </Modal>
  );
}

export default TimezoneModal;
