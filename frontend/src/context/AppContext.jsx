import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import timezoneFormatter from '../utils/timezone';
import { settingsAPI, activitiesAPI } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [timezone, setTimezone] = useState('America/New_York');
  const [currentDate, setCurrentDate] = useState(null);
  const [activities, setActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize app - load settings and set timezone
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        
        // Load user settings
        const settings = await settingsAPI.get();
        const userTimezone = settings.timezone;
        
        // Update timezone in formatter
        timezoneFormatter.setTimezone(userTimezone);
        setTimezone(userTimezone);
        
        // Set current date in user's timezone
        setCurrentDate(timezoneFormatter.getCurrentDate());
        
        // Store in localStorage as fallback
        localStorage.setItem('displayTimezone', userTimezone);
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing app:', err);
        
        // Fallback to localStorage or system timezone
        const fallbackTimezone = 
          localStorage.getItem('displayTimezone') ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          'America/New_York';
        
        timezoneFormatter.setTimezone(fallbackTimezone);
        setTimezone(fallbackTimezone);
        setCurrentDate(timezoneFormatter.getCurrentDate());
        setError('Failed to load settings. Using fallback timezone.');
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Load activities for a specific date
  const loadActivities = useCallback(async (date = null) => {
    try {
      const data = await activitiesAPI.getAll(date);
      setActivities(data);
      return data;
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
      throw err;
    }
  }, []);

  // Load all activities (no date filter)
  const loadAllActivities = useCallback(async () => {
    try {
      const data = await activitiesAPI.getAll();
      setAllActivities(data);
      return data;
    } catch (err) {
      console.error('Error loading all activities:', err);
      setError('Failed to load activities');
      throw err;
    }
  }, []);

  // Load today's stats
  const loadStats = useCallback(async () => {
    try {
      const data = await activitiesAPI.getStats();
      setStats(data);
      return data;
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load stats');
      throw err;
    }
  }, []);

  // Create a new activity
  const createActivity = useCallback(async (activityData) => {
    try {
      const newActivity = await activitiesAPI.create(activityData);
      
      // Refresh activities and stats
      await Promise.all([
        loadActivities(currentDate),
        loadAllActivities(),
        loadStats()
      ]);
      
      return newActivity;
    } catch (err) {
      console.error('Error creating activity:', err);
      setError('Failed to log activity');
      throw err;
    }
  }, [currentDate, loadActivities, loadAllActivities, loadStats]);

  // Delete an activity
  const deleteActivity = useCallback(async (id) => {
    try {
      await activitiesAPI.delete(id);
      
      // Refresh activities and stats
      await Promise.all([
        loadActivities(currentDate),
        loadAllActivities(),
        loadStats()
      ]);
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity');
      throw err;
    }
  }, [currentDate, loadActivities, loadAllActivities, loadStats]);

  // Update timezone setting
  const updateTimezone = useCallback(async (newTimezone) => {
    try {
      await settingsAPI.update(newTimezone);
      
      // Update timezone in formatter
      timezoneFormatter.setTimezone(newTimezone);
      setTimezone(newTimezone);
      
      // Update current date with new timezone
      setCurrentDate(timezoneFormatter.getCurrentDate());
      
      // Store in localStorage
      localStorage.setItem('displayTimezone', newTimezone);
      
      // Reload activities to refresh timestamps
      await loadActivities(timezoneFormatter.getCurrentDate());
      
      return true;
    } catch (err) {
      console.error('Error updating timezone:', err);
      setError('Failed to update timezone');
      throw err;
    }
  }, [loadActivities]);

  // Change the current date being viewed
  const changeDate = useCallback((newDate) => {
    setCurrentDate(newDate);
    loadActivities(newDate);
  }, [loadActivities]);

  // Go to today
  const goToToday = useCallback(() => {
    const today = timezoneFormatter.getCurrentDate();
    changeDate(today);
  }, [changeDate]);

  const value = {
    timezone,
    currentDate,
    activities,
    allActivities,
    stats,
    loading,
    error,
    loadActivities,
    loadAllActivities,
    loadStats,
    createActivity,
    deleteActivity,
    updateTimezone,
    changeDate,
    goToToday,
    clearError: () => setError(null)
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
