const API_BASE = '/api';
let displayTimezone = localStorage.getItem('displayTimezone') ||
  Intl.DateTimeFormat().resolvedOptions().timeZone ||
  'America/New_York';
let currentDate = toLocalDateString(new Date());
let currentGPS = { lat: null, lon: null };
let allActivities = []; // Cache all activities
let map = null;
let markers = [];
let infoWindow = null;

// Timezone-aware formatting helpers
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: displayTimezone
  });
}

function formatDate(timestamp, options = {}) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    ...options,
    timeZone: displayTimezone
  });
}

function formatDateTime(timestamp, options = {}) {
  return new Date(timestamp).toLocaleString('en-US', {
    ...options,
    timeZone: displayTimezone
  });
}

// Returns YYYY-MM-DD in the display timezone (used for date grouping)
function toLocalDateString(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-CA', { timeZone: displayTimezone });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadAllActivities();
  setupEventListeners();
  updateDateHeader();
  loadStats();
});

// Event Listeners
function setupEventListeners() {
  // Activity buttons
  document.querySelectorAll('.activity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modal;
      openModal(modalId);
    });
  });

  // Date picker
  document.getElementById('date-picker-btn').addEventListener('click', () => {
    document.getElementById('date-input').value = currentDate;
    openModal('date-picker-modal');
  });

  // Export button
  document.getElementById('export-btn').addEventListener('click', exportData);

  // Navigation
  document.getElementById('today-nav').addEventListener('click', () => showPage('today'));
  document.getElementById('history-nav').addEventListener('click', () => showPage('history'));
  document.getElementById('analytics-nav').addEventListener('click', () => showPage('analytics'));
}

// Modal Management
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function closeDatePickerModal() {
  closeModal('date-picker-modal');
}

function changeDate() {
  const newDate = document.getElementById('date-input').value;
  if (newDate) {
    currentDate = newDate;
    updateDateHeader();
    loadActivities();
    closeModal('date-picker-modal');
  }
}

function updateDateHeader() {
  const header = document.getElementById('date-header');
  const today = toLocalDateString(new Date());
  
  if (currentDate === today) {
    header.textContent = "Today's Activities";
  } else {
    header.textContent = formatDate(currentDate + 'T12:00:00', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// GPS Functionality
async function getGPSCoordinates(useGPS) {
  if (!useGPS) {
    return { lat: null, lon: null };
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      resolve({ lat: null, lon: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.log('GPS error:', error.message);
        resolve({ lat: null, lon: null });
      },
      {
        enableHighAccuracy: true,
        timeout: 27000,
        maximumAge: 30000
      }
    );
  });
}

// Log Activity
async function logActivity(type) {
  let subtype = null;
  let notes = '';
  let useGPS = false;

  if (type === 'potty') {
    subtype = document.querySelector('input[name="potty-type"]:checked').value;
    notes = document.getElementById('potty-notes').value;
    useGPS = document.getElementById('potty-gps').checked;
  } else if (type === 'vomit') {
    notes = document.getElementById('vomit-notes').value;
    useGPS = document.getElementById('vomit-gps').checked;
  } else if (type === 'eating') {
    notes = document.getElementById('eating-notes').value;
    useGPS = document.getElementById('eating-gps').checked;
  } else if (type === 'groom') {
    notes = document.getElementById('groom-notes').value;
    useGPS = document.getElementById('groom-gps').checked;
  } else if (type === 'surgery') {
    notes = document.getElementById('surgery-notes').value;
    useGPS = document.getElementById('surgery-gps').checked;
  }

  // Get GPS coordinates if needed
  const gps = await getGPSCoordinates(useGPS);

  const activityData = {
    type,
    subtype,
    timestamp: new Date().toISOString(),
    notes: notes || null,
    gps_lat: gps.lat,
    gps_lon: gps.lon
  };

  try {
    const response = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    });

    if (response.ok) {
      // Clear form
      if (type === 'potty') {
        document.getElementById('potty-notes').value = '';
      } else if (type === 'vomit') {
        document.getElementById('vomit-notes').value = '';
      } else if (type === 'eating') {
        document.getElementById('eating-notes').value = '';
      } else if (type === 'groom') {
        document.getElementById('groom-notes').value = '';
      } else if (type === 'surgery') {
        document.getElementById('surgery-notes').value = '';
      }

      // Close modal and reload activities
      closeModal(`${type}-modal`);
      loadAllActivities(); // Reload all activities to get updated stats
    } else {
      alert('Failed to log activity');
    }
  } catch (error) {
    console.error('Error logging activity:', error);
    alert('Error logging activity');
  }
}

// Load Activities
async function loadActivities() {
  try {
    const response = await fetch(`${API_BASE}/activities?date=${currentDate}`);
    const activities = await response.json();
    renderActivities(activities);
  } catch (error) {
    console.error('Error loading activities:', error);
  }
}

// Load all activities (for stats and history)
async function loadAllActivities() {
  try {
    const response = await fetch(`${API_BASE}/activities`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allActivities = await response.json();
    console.log('Loaded activities:', allActivities);
    loadActivities();
    loadStats();
  } catch (error) {
    console.error('Error loading all activities:', error);
  }
}

// Render Activities
function renderActivities(activities) {
  const list = document.getElementById('activities-list');

  if (activities.length === 0) {
    list.innerHTML = '<p class="empty-state">No activities logged yet</p>';
    return;
  }

  list.innerHTML = activities.map(activity => {
    const time = formatTime(activity.timestamp);

    const typeEmoji = {
      potty: '🚽',
      vomit: '🤢',
      eating: '🍽️',
      groom: '✨',
      surgery: '⚕️'
    }[activity.type];

    const typeLabel = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
    const subtypeLabel = activity.subtype ? ` - ${activity.subtype.charAt(0).toUpperCase() + activity.subtype.slice(1)}` : '';

    let gpsLabel = '';
    if (activity.gps_lat !== null && activity.gps_lon !== null && activity.gps_lat !== undefined && activity.gps_lon !== undefined) {
      const lat = typeof activity.gps_lat === 'string' ? parseFloat(activity.gps_lat) : activity.gps_lat;
      const lon = typeof activity.gps_lon === 'string' ? parseFloat(activity.gps_lon) : activity.gps_lon;
      if (!isNaN(lat) && !isNaN(lon)) {
        gpsLabel = `<div class="activity-coords">📍 ${lat.toFixed(6)}, ${lon.toFixed(6)}</div>`;
      }
    }

    const notesHtml = activity.notes ? `<div class="activity-notes">${escapeHtml(activity.notes)}</div>` : '';

    return `
      <div class="activity-item ${activity.type}">
        <div class="activity-info">
          <div class="activity-header">
            ${typeEmoji} ${typeLabel}${subtypeLabel}
          </div>
          <div class="activity-time">${time}</div>
          ${notesHtml}
          ${gpsLabel}
        </div>
        <button class="activity-delete" onclick="deleteActivity(${activity.id})">✕</button>
      </div>
    `;
  }).join('');
}

// Delete Activity
async function deleteActivity(id) {
  if (!confirm('Delete this activity?')) return;

  try {
    const response = await fetch(`${API_BASE}/activities/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadAllActivities();
    } else {
      alert('Failed to delete activity');
    }
  } catch (error) {
    console.error('Error deleting activity:', error);
    alert('Error deleting activity');
  }
}

// Export Data
async function exportData() {
  try {
    const response = await fetch(`${API_BASE}/export`);
    const data = await response.json();

    // Create download link
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `josie-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data');
  }
}

// Utility
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Page Navigation
function showPage(page) {
  document.getElementById('today-page').style.display = page === 'today' ? 'block' : 'none';
  document.getElementById('history-page').style.display = page === 'history' ? 'block' : 'none';
  document.getElementById('analytics-page').style.display = page === 'analytics' ? 'block' : 'none';
  
  document.getElementById('today-nav').classList.toggle('active', page === 'today');
  document.getElementById('history-nav').classList.toggle('active', page === 'history');
  document.getElementById('analytics-nav').classList.toggle('active', page === 'analytics');

  if (page === 'history') {
    renderHistoryPage();
  } else if (page === 'analytics') {
    renderAnalyticsPage();
  }
}

// Stats and History
function loadStats() {
  renderStats();
}

function renderStats() {
  const statsHtml = document.getElementById('stats-grid');
  
  const typeCounts = {
    potty: { count: 0, emoji: '🚽', color: '#667eea' },
    vomit: { count: 0, emoji: '🤢', color: '#ff6b6b' },
    eating: { count: 0, emoji: '🍽️', color: '#51cf66' },
    groom: { count: 0, emoji: '✨', color: '#ffd93d' },
    surgery: { count: 0, emoji: '⚕️', color: '#ff922b' }
  };

  allActivities.forEach(activity => {
    if (typeCounts[activity.type]) {
      typeCounts[activity.type].count++;
    }
  });

  // Get last activity of each type
  const lastActivities = {};
  allActivities.forEach(activity => {
    if (!lastActivities[activity.type]) {
      lastActivities[activity.type] = activity;
    }
  });

  statsHtml.innerHTML = Object.entries(typeCounts).map(([type, data]) => {
    const last = lastActivities[type];
    const lastTime = last ? formatDate(last.timestamp, { month: 'short', day: 'numeric' }) : 'Never';
    
    return `
      <div class="stat-card" style="border-top-color: ${data.color}">
        <div class="stat-emoji">${data.emoji}</div>
        <div class="stat-type">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
        <div class="stat-count">${data.count} total</div>
        <div class="stat-last">Last: ${lastTime}</div>
      </div>
    `;
  }).join('');
}

function renderHistoryPage() {
  const historyHtml = document.getElementById('history-list');

  // Group by date in display timezone
  const byDate = {};
  allActivities.forEach(activity => {
    const date = toLocalDateString(activity.timestamp);
    if (!byDate[date]) {
      byDate[date] = [];
    }
    byDate[date].push(activity);
  });

  if (Object.keys(byDate).length === 0) {
    historyHtml.innerHTML = '<p class="empty-state">No activity history</p>';
    return;
  }

  historyHtml.innerHTML = Object.entries(byDate)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, activities]) => {
      const dateStr = formatDate(date + 'T12:00:00', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const typeCounts = {};
      activities.forEach(act => {
        typeCounts[act.type] = (typeCounts[act.type] || 0) + 1;
      });

      const typeEmoji = {
        potty: '🚽',
        vomit: '🤢',
        eating: '🍽️',
        groom: '✨',
        surgery: '⚕️'
      };

      const summary = Object.entries(typeCounts)
        .map(([type, count]) => `${typeEmoji[type]} ${count}`)
        .join(' • ');

      return `
        <div class="history-date-group">
          <div class="history-date-header">${dateStr}</div>
          <div class="history-summary">${summary}</div>
        </div>
      `;
    }).join('');
}

function renderAnalyticsPage() {
  renderCalendar();
  renderMap();
  renderWeeklyStats();
}

function renderCalendar() {
  const calendarHtml = document.getElementById('calendar');
  
  // Get current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Group activities by date in display timezone
  const byDate = {};
  allActivities.forEach(activity => {
    const date = toLocalDateString(activity.timestamp);
    byDate[date] = (byDate[date] || 0) + 1;
  });

  // Build calendar
  let calendarContent = `
    <div style="grid-column: 1 / -1; margin-bottom: 8px;">
      <h3 style="text-align: center; color: #333; margin: 0; font-size: 16px;">
        ${formatDate(firstDay.toISOString(), { month: 'long', year: 'numeric' })}
      </h3>
    </div>
  `;

  // Day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    calendarContent += `<div class="calendar-day-name">${day}</div>`;
  });

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarContent += `<div class="calendar-date inactive"></div>`;
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const count = byDate[dateStr] || 0;
    const hasActivities = count > 0;
    const highActivity = count >= 5;

    calendarContent += `
      <div class="calendar-date ${hasActivities ? 'has-activities' : ''} ${highActivity ? 'high-activity' : ''}">
        <div class="calendar-date-number">${day}</div>
        ${hasActivities ? `<div class="calendar-date-count">${count}</div>` : ''}
      </div>
    `;
  }

  calendarHtml.innerHTML = calendarContent;
}

function renderMap() {
  const mapContainer = document.getElementById('map');
  
  // Get activities with GPS data
  const gpsActivities = allActivities.filter(a => {
    const lat = typeof a.gps_lat === 'string' ? parseFloat(a.gps_lat) : a.gps_lat;
    const lon = typeof a.gps_lon === 'string' ? parseFloat(a.gps_lon) : a.gps_lon;
    return !isNaN(lat) && !isNaN(lon);
  });

  if (gpsActivities.length === 0) {
    mapContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #999; text-align: center; padding: 20px;">
        <p style="font-size: 32px; margin-bottom: 8px;">🗺️</p>
        <p>No GPS data available yet</p>
        <p style="font-size: 12px; color: #999; margin-top: 8px;">Enable GPS when logging activities to see them on the map</p>
      </div>
    `;
    return;
  }

  // Clear previous map if exists
  if (map) {
    map.remove();
    map = null;
  }

  // Calculate center
  const lats = gpsActivities.map(a => {
    const lat = typeof a.gps_lat === 'string' ? parseFloat(a.gps_lat) : a.gps_lat;
    return lat;
  });
  const lons = gpsActivities.map(a => {
    const lon = typeof a.gps_lon === 'string' ? parseFloat(a.gps_lon) : a.gps_lon;
    return lon;
  });

  const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
  const centerLon = (Math.max(...lons) + Math.min(...lons)) / 2;

  // Initialize Leaflet map
  map = L.map('map').setView([centerLat, centerLon], 16);

  // Add OpenStreetMap hybrid tile layer (using ESRI satellite with labels)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri, DigitalGlobe, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
    maxZoom: 18,
  }).addTo(map);

  // Add labels layer on top
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
    opacity: 0.3,
    className: 'label-layer'
  }).addTo(map);

  const typeEmoji = {
    potty: '🚽',
    vomit: '🤢',
    eating: '🍽️',
    groom: '✨',
    surgery: '⚕️'
  };

  const typeColor = {
    potty: '#667eea',
    vomit: '#ff6b6b',
    eating: '#51cf66',
    groom: '#ffd93d',
    surgery: '#ff922b'
  };

  // Add markers for each activity
  markers = [];
  gpsActivities.forEach(activity => {
    const lat = typeof activity.gps_lat === 'string' ? parseFloat(activity.gps_lat) : activity.gps_lat;
    const lon = typeof activity.gps_lon === 'string' ? parseFloat(activity.gps_lon) : activity.gps_lon;

    const time = formatDateTime(activity.timestamp, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const popupContent = `
      <div style="font-size: 13px; min-width: 200px;">
        <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">
          ${typeEmoji[activity.type]} ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
        </div>
        <div style="color: #666; margin-bottom: 6px; font-size: 12px;">${time}</div>
        ${activity.notes ? `<div style="color: #666; font-size: 12px; margin-bottom: 6px; font-style: italic; padding: 6px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">"${escapeHtml(activity.notes)}"</div>` : ''}
        <div style="color: #999; font-size: 11px; margin-top: 6px;">
          📍 ${lat.toFixed(6)}, ${lon.toFixed(6)}
        </div>
      </div>
    `;

    const marker = L.circleMarker([lat, lon], {
      radius: 10,
      fillColor: typeColor[activity.type] || '#667eea',
      color: 'white',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).bindPopup(popupContent).addTo(map);

    marker.on('click', () => {
      document.getElementById('map-info').style.display = 'block';
      document.getElementById('map-marker-info').innerHTML = `
        <strong>${typeEmoji[activity.type]} ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</strong> at ${time}
        ${activity.notes ? `<br><em>"${escapeHtml(activity.notes)}"</em>` : ''}
      `;
    });

    markers.push(marker);
  });

  // Fit map to all markers
  if (markers.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}

function renderWeeklyStats() {
  const weeklyHtml = document.getElementById('weekly-stats');

  // Get last 7 days in display timezone
  const today = new Date();
  const last7Days = {};
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = toLocalDateString(date);
    last7Days[dateStr] = [];
  }

  allActivities.forEach(activity => {
    const date = toLocalDateString(activity.timestamp);
    if (last7Days[date]) {
      last7Days[date].push(activity);
    }
  });

  const typeEmoji = {
    potty: '🚽',
    vomit: '🤢',
    eating: '🍽️',
    groom: '✨',
    surgery: '⚕️'
  };

  const typeCounts = {
    potty: 0,
    vomit: 0,
    eating: 0,
    groom: 0,
    surgery: 0
  };

  Object.values(last7Days).forEach(activities => {
    activities.forEach(a => {
      if (typeCounts[a.type] !== undefined) {
        typeCounts[a.type]++;
      }
    });
  });

  const avgDaily = {
    potty: (typeCounts.potty / 7).toFixed(1),
    vomit: (typeCounts.vomit / 7).toFixed(1),
    eating: (typeCounts.eating / 7).toFixed(1),
    groom: (typeCounts.groom / 7).toFixed(1),
    surgery: (typeCounts.surgery / 7).toFixed(1)
  };

  weeklyHtml.innerHTML = Object.entries(typeCounts).map(([type, count]) => {
    const trend = avgDaily[type] >= 1 ? '📈' : '📉';
    return `
      <div class="weekly-stat">
        <div class="weekly-stat-emoji">${typeEmoji[type]}</div>
        <div class="weekly-stat-label">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
        <div class="weekly-stat-value">${count}</div>
        <div class="weekly-stat-trend">${trend} ${avgDaily[type]}/day</div>
      </div>
    `;
  }).join('');
}

// Timezone Selector
const COMMON_TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern (New York / Raleigh)' },
  { value: 'America/Chicago',     label: 'Central (Chicago)' },
  { value: 'America/Denver',      label: 'Mountain (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
  { value: 'America/Anchorage',   label: 'Alaska (Anchorage)' },
  { value: 'Pacific/Honolulu',    label: 'Hawaii (Honolulu)' },
  { value: 'Europe/London',       label: 'London (GMT/BST)' },
  { value: 'Europe/Paris',        label: 'Paris / Berlin (CET)' },
  { value: 'Asia/Tokyo',          label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai',       label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney',    label: 'Sydney (AEST)' },
  { value: 'UTC',                 label: 'UTC' },
];

function openTimezoneModal() {
  const select = document.getElementById('timezone-select');
  select.innerHTML = '';

  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const inList = COMMON_TIMEZONES.some(tz => tz.value === browserTz);
  if (browserTz && !inList) {
    const opt = document.createElement('option');
    opt.value = browserTz;
    opt.textContent = `Auto-detected: ${browserTz}`;
    select.appendChild(opt);
  }

  COMMON_TIMEZONES.forEach(tz => {
    const opt = document.createElement('option');
    opt.value = tz.value;
    opt.textContent = tz.label + (tz.value === browserTz ? ' ★ (browser)' : '');
    select.appendChild(opt);
  });

  select.value = displayTimezone;
  if (!select.value) select.value = 'America/New_York';
  openModal('timezone-modal');
}

function saveTimezone() {
  const select = document.getElementById('timezone-select');
  displayTimezone = select.value;
  localStorage.setItem('displayTimezone', displayTimezone);
  closeModal('timezone-modal');
  currentDate = toLocalDateString(new Date());
  updateDateHeader();
  loadActivities();
  loadStats();
}
