import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ACTIVITY_EMOJI } from '../constants';
import timezoneFormatter from '../utils/timezone';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function ActivityMap({ activities }) {
  const mapRef = useRef(null);

  // Calculate center and bounds
  const { center, bounds } = React.useMemo(() => {
    if (activities.length === 0) {
      return {
        center: [40.7128, -74.0060], // Default to NYC
        bounds: null
      };
    }

    if (activities.length === 1) {
      return {
        center: [activities[0].gps_lat, activities[0].gps_lon],
        bounds: null
      };
    }

    // Calculate bounds for multiple markers
    const lats = activities.map(a => a.gps_lat);
    const lons = activities.map(a => a.gps_lon);
    
    const bounds = [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)]
    ];

    const center = [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lons) + Math.max(...lons)) / 2
    ];

    return { center, bounds };
  }, [activities]);

  // Fit bounds when activities change
  useEffect(() => {
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds]);

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={bounds ? 13 : 15}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {activities.map((activity) => (
          <Marker
            key={activity.id}
            position={[activity.gps_lat, activity.gps_lon]}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '4px',
                  textTransform: 'capitalize'
                }}>
                  {ACTIVITY_EMOJI[activity.type]} {activity.type}
                  {activity.subtype && ` (${activity.subtype})`}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {timezoneFormatter.formatDateTime(activity.timestamp)}
                </div>
                {activity.notes && (
                  <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#666' }}>
                    {activity.notes}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default ActivityMap;
