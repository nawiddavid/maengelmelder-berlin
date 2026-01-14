import { log } from '../logger.js';

/**
 * Geocoding Service - Reverse Geocoding mit Nominatim (OpenStreetMap)
 */

const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';

/**
 * Führt Reverse Geocoding durch (Koordinaten -> Adresse)
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const url = `${NOMINATIM_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    
    log('geocoding', `Reverse geocoding: ${latitude}, ${longitude}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Maengelmelder/1.0 (contact@example.com)',
        'Accept-Language': 'de'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.error) {
      log('geocoding', `No results for ${latitude}, ${longitude}`);
      return null;
    }

    const address = data.address || {};
    
    // Adresse formatieren
    const parts = [];
    if (address.road) {
      parts.push(address.road + (address.house_number ? ' ' + address.house_number : ''));
    }
    if (address.postcode || address.city || address.town || address.village) {
      parts.push([address.postcode, address.city || address.town || address.village].filter(Boolean).join(' '));
    }

    const formattedAddress = parts.join(', ') || data.display_name;

    // Bezirk/Stadtteil ermitteln
    const district = address.suburb || 
                     address.neighbourhood || 
                     address.quarter ||
                     address.city_district ||
                     address.borough ||
                     null;

    log('geocoding', `Result: ${formattedAddress} (District: ${district || 'unknown'})`);

    return {
      address: formattedAddress,
      district,
      raw: address
    };
  } catch (error) {
    log('error', `Geocoding failed: ${error.message}`);
    return null;
  }
}

/**
 * Führt Forward Geocoding durch (Adresse -> Koordinaten)
 */
export async function forwardGeocode(query) {
  try {
    const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
    
    log('geocoding', `Forward geocoding: ${query}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Maengelmelder/1.0 (contact@example.com)',
        'Accept-Language': 'de'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: item.display_name,
      district: item.address?.suburb || item.address?.neighbourhood || null
    }));
  } catch (error) {
    log('error', `Forward geocoding failed: ${error.message}`);
    return [];
  }
}
