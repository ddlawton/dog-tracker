import React from 'react';

function Navigation({ currentPage, onPageChange }) {
  const pages = [
    { id: 'today', label: 'Today' },
    { id: 'history', label: 'History' },
    { id: 'analytics', label: 'Analytics' }
  ];

  return (
    <div className="nav-tabs">
      {pages.map((page) => (
        <button
          key={page.id}
          className={`nav-tab ${currentPage === page.id ? 'active' : ''}`}
          onClick={() => onPageChange(page.id)}
        >
          {page.label}
        </button>
      ))}
    </div>
  );
}

export default Navigation;
