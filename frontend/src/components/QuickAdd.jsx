import React, { useState } from 'react';
import { ACTIVITY_TYPES, ACTIVITY_EMOJI } from '../constants';
import PottyModal from './modals/PottyModal';
import VomitModal from './modals/VomitModal';
import EatingModal from './modals/EatingModal';
import GroomModal from './modals/GroomModal';
import SurgeryModal from './modals/SurgeryModal';

function QuickAdd() {
  const [activeModal, setActiveModal] = useState(null);

  const activities = [
    { type: 'potty', label: 'Potty', component: PottyModal },
    { type: 'vomit', label: 'Vomit', component: VomitModal },
    { type: 'eating', label: 'Eating', component: EatingModal },
    { type: 'groom', label: 'Groom', component: GroomModal },
    { type: 'surgery', label: 'Surgery', component: SurgeryModal }
  ];

  const handleClose = () => setActiveModal(null);

  const ActiveModalComponent = activeModal ? 
    activities.find(a => a.type === activeModal)?.component : null;

  return (
    <>
      <div className="quick-add">
        {activities.map(({ type, label }) => (
          <button
            key={type}
            className="activity-btn"
            onClick={() => setActiveModal(type)}
          >
            <span className="emoji">{ACTIVITY_EMOJI[type]}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {ActiveModalComponent && (
        <ActiveModalComponent onClose={handleClose} />
      )}
    </>
  );
}

export default QuickAdd;
