import React, { useState } from 'react';
import Modal from './Modal';
import { useApp } from '../../context/AppContext';
import { getCurrentPosition } from '../../utils/gps';
import timezoneFormatter from '../../utils/timezone';
import { sanitizeInput } from '../../utils/security';

function PottyModal({ onClose }) {
  const { createActivity } = useApp();
  const [subtype, setSubtype] = useState('pee');
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
        type: 'potty',
        subtype,
        timestamp: timezoneFormatter.createTimestamp(),
        notes: sanitizeInput(notes) || null,
        gps_lat: gps.lat,
        gps_lon: gps.lon
      };

      await createActivity(activityData);
      onClose();
    } catch (error) {
      console.error('Failed to log activity:', error);
      alert('Failed to log potty activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="🚽 Log Potty">
      <div className="form-group">
        <label>Type</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="pee"
              checked={subtype === 'pee'}
              onChange={(e) => setSubtype(e.target.value)}
            />
            Pee
          </label>
          <label>
            <input
              type="radio"
              value="poo"
              checked={subtype === 'poo'}
              onChange={(e) => setSubtype(e.target.value)}
            />
            Poo
          </label>
          <label>
            <input
              type="radio"
              value="both"
              checked={subtype === 'both'}
              onChange={(e) => setSubtype(e.target.value)}
            />
            Both
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional details..."
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

export default PottyModal;
