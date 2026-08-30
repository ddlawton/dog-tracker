import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Navigation from './components/Navigation';
import TodayPage from './pages/TodayPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('today');

  const renderPage = () => {
    switch (currentPage) {
      case 'today':
        return <TodayPage />;
      case 'history':
        return <HistoryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <TodayPage />;
    }
  };

  return (
    <AppProvider>
      <div className="container">
        <Header />
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="page">
          {renderPage()}
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
