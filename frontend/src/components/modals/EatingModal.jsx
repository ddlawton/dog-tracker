import React, { useState } from 'react';
import Modal from './Modal';
import { useApp } from '../../context/AppContext';
import { getCurrentPosition } from '../../utils/gps';
import timezoneFormatter from '../../utils/timezone';
import { sanitizeInput } from '../../utils/security';

function EatingModal({ onClose }) {
  const { createActivity } = useApp();
  const [notes, setNotes] = useState('');
  const [useGPS, setUseGPS] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let gps = { lat: null, lon: null };
      
      if (useGPS) {
        gps = await getCurrentPosition();
      }

      const activityData = {
        type: 'eating',
        subtype: null,
        timestamp: timezoneFormatter.createTimestamp(),
        notes: sanitizeInput(notes) || null,
        gps_lat: gps.lat,
        gps_lon: gps.lon
      };

      await createActivity(activityData);
      onClose();
    } catch (error) {
      console.error('Failed to log activity:', error);
      alert('Failed to log eating activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="🍽️ Log Eating">
      <div className="form-group">
        <label>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did Josie eat?"
          maxLength={5000}
        />
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={useGPS}
          onChange={(e) => setUseGPS(e.target.checked)}
        />
        Include GPS location
      </label>

      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Logging...' : 'Log Activity'}
        </button>
      </div>
    </Modal>
  );
}

export default EatingModal;
