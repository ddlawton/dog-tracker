import React, { useState } from 'react';
import Modal from './Modal';
import { useApp } from '../../context/AppContext';
import timezoneFormatter from '../../utils/timezone';

function DatePickerModal({ onClose }) {
  const { currentDate, changeDate } = useApp();
  const [selectedDate, setSelectedDate] = useState(currentDate || timezoneFormatter.getCurrentDate());

  const handleSubmit = () => {
    changeDate(selectedDate);
    onClose();
  };

  const goToToday = () => {
    const today = timezoneFormatter.getCurrentDate();
    setSelectedDate(today);
    changeDate(today);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="📅 Pick Date">
      <div className="form-group">
        <label>Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={goToToday}>
          Today
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          Go to Date
        </button>
      </div>
    </Modal>
  );
}

export default DatePickerModal;
