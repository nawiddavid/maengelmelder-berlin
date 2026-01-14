/**
 * Mängelmelder - Meldungsformular
 */

// State
let currentStep = 1;
let selectedCategory = null;
let photos = [];
let map = null;
let marker = null;
let currentLocation = { lat: null, lng: null, address: null };

// DOM Elements
const form = document.getElementById('reportForm');
const stepper = document.getElementById('stepper');
const loading = document.getElementById('loading');
const successScreen = document.getElementById('successScreen');

// Device ID generieren/laden
function getDeviceId() {
  let deviceId = localStorage.getItem('maengelmelder_device_id');
  if (!deviceId) {
    deviceId = 'dev-' + crypto.randomUUID();
    localStorage.setItem('maengelmelder_device_id', deviceId);
  }
  return deviceId;
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('deviceIdInput').value = getDeviceId();
  
  initCategorySelection();
  initPhotoUpload();
  initLocationTabs();
  initAddressSearch();
  initCommentField();
  initUrgencyButtons();
  initNavigation();
});

// Location Tabs (GPS / Adresse)
function initLocationTabs() {
  const tabs = document.querySelectorAll('.location-tab');
  const gpsMethod = document.getElementById('gpsMethod');
  const addressMethod = document.getElementById('addressMethod');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const method = tab.dataset.method;
      
      if (method === 'gps') {
        gpsMethod.classList.add('active');
        addressMethod.classList.remove('active');
        // GPS erneut versuchen
        tryGetGPSLocation();
      } else {
        gpsMethod.classList.remove('active');
        addressMethod.classList.add('active');
        // Fokus auf Eingabefeld
        document.getElementById('addressInput').focus();
      }
    });
  });
}

// GPS-Position ermitteln
function tryGetGPSLocation() {
  const gpsStatus = document.getElementById('gpsStatus');
  
  if (!navigator.geolocation) {
    gpsStatus.className = 'gps-status error';
    gpsStatus.innerHTML = `
      <span class="icon">❌</span>
      <span>GPS wird von Ihrem Browser nicht unterstützt. Bitte geben Sie eine Adresse ein.</span>
    `;
    return;
  }
  
  gpsStatus.className = 'gps-status';
  gpsStatus.innerHTML = `
    <span class="icon">⏳</span>
    <span>Ermittle Ihren Standort...</span>
  `;
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      gpsStatus.className = 'gps-status success';
      gpsStatus.innerHTML = `
        <span class="icon">✅</span>
        <span>Standort gefunden! Sie können den Marker bei Bedarf verschieben.</span>
      `;
      
      setMapLocation(lat, lng, 17);
    },
    (error) => {
      let message = 'Standort konnte nicht ermittelt werden.';
      if (error.code === 1) {
        message = 'Standortzugriff wurde verweigert. Bitte erlauben Sie den Zugriff oder geben Sie eine Adresse ein.';
      } else if (error.code === 2) {
        message = 'Standort nicht verfügbar. Bitte geben Sie eine Adresse ein.';
      } else if (error.code === 3) {
        message = 'Zeitüberschreitung. Bitte versuchen Sie es erneut oder geben Sie eine Adresse ein.';
      }
      
      gpsStatus.className = 'gps-status error';
      gpsStatus.innerHTML = `
        <span class="icon">⚠️</span>
        <span>${message}</span>
      `;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

// Adresssuche initialisieren
function initAddressSearch() {
  const input = document.getElementById('addressInput');
  const searchBtn = document.getElementById('searchAddressBtn');
  const resultsContainer = document.getElementById('searchResults');
  
  let searchTimeout = null;
  
  // Suche bei Eingabe (mit Debounce)
  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = input.value.trim();
    
    if (query.length < 3) {
      resultsContainer.classList.remove('active');
      return;
    }
    
    searchTimeout = setTimeout(() => searchAddress(query), 500);
  });
  
  // Suche bei Klick auf Button
  searchBtn.addEventListener('click', () => {
    const query = input.value.trim();
    if (query.length >= 3) {
      searchAddress(query);
    }
  });
  
  // Suche bei Enter
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = input.value.trim();
      if (query.length >= 3) {
        searchAddress(query);
      }
    }
  });
  
  // Ergebnisse ausblenden bei Klick außerhalb
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.address-search')) {
      resultsContainer.classList.remove('active');
    }
  });
}

// Adresse suchen (Nominatim API)
async function searchAddress(query) {
  const resultsContainer = document.getElementById('searchResults');
  
  resultsContainer.innerHTML = '<div class="search-loading">🔍 Suche...</div>';
  resultsContainer.classList.add('active');
  
  try {
    // Nominatim API mit deutschen Ergebnissen bevorzugt
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=de`;
    
    const response = await fetch(url, {
      headers: { 
        'Accept-Language': 'de',
        'User-Agent': 'Maengelmelder/1.0'
      }
    });
    
    const results = await response.json();
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="search-loading">Keine Ergebnisse gefunden</div>';
      return;
    }
    
    resultsContainer.innerHTML = results.map((result, index) => `
      <div class="search-result-item" data-lat="${result.lat}" data-lng="${result.lon}" data-address="${result.display_name}">
        📍 ${result.display_name}
      </div>
    `).join('');
    
    // Klick-Handler für Ergebnisse
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const lat = parseFloat(item.dataset.lat);
        const lng = parseFloat(item.dataset.lng);
        const address = item.dataset.address;
        
        // Eingabefeld aktualisieren
        document.getElementById('addressInput').value = address;
        
        // Ergebnisse ausblenden
        resultsContainer.classList.remove('active');
        
        // Karte aktualisieren
        setMapLocation(lat, lng, 17, address);
      });
    });
    
  } catch (error) {
    console.error('Address search error:', error);
    resultsContainer.innerHTML = '<div class="search-loading">Fehler bei der Suche. Bitte versuchen Sie es erneut.</div>';
  }
}

// Karte auf Position setzen
function setMapLocation(lat, lng, zoom = 17, address = null) {
  if (map) {
    map.setView([lat, lng], zoom);
    marker.setLatLng([lat, lng]);
  }
  updateLocation(lat, lng, address);
}

// Location aktualisieren (zentrale Funktion)
function updateLocation(lat, lng, providedAddress = null) {
  currentLocation.lat = lat;
  currentLocation.lng = lng;
  
  document.getElementById('latitudeInput').value = lat;
  document.getElementById('longitudeInput').value = lng;
  
  const locationInfo = document.getElementById('locationInfo');
  const nextBtn = document.getElementById('nextStep3');
  
  if (providedAddress) {
    currentLocation.address = providedAddress;
    locationInfo.innerHTML = `
      <p><strong>📍 Gewählter Standort:</strong></p>
      <p>${providedAddress}</p>
    `;
    nextBtn.disabled = false;
  } else {
    // Reverse Geocoding für Adresse
    locationInfo.innerHTML = '<p>📍 Ermittle Adresse...</p>';
    
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'Accept-Language': 'de' }
    })
    .then(res => res.json())
    .then(data => {
      currentLocation.address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      locationInfo.innerHTML = `
        <p><strong>📍 Gewählter Standort:</strong></p>
        <p>${currentLocation.address}</p>
      `;
    })
    .catch(() => {
      currentLocation.address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      locationInfo.innerHTML = `<p>📍 ${currentLocation.address}</p>`;
    });
    
    nextBtn.disabled = false;
  }
}

// Kategorie-Auswahl
function initCategorySelection() {
  const tiles = document.querySelectorAll('.category-tile');
  const input = document.getElementById('categoryInput');
  const nextBtn = document.getElementById('nextStep1');
  
  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      tiles.forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');
      selectedCategory = tile.dataset.category;
      input.value = selectedCategory;
      nextBtn.disabled = false;
    });
  });
  
  nextBtn.addEventListener('click', () => goToStep(2));
}

// Foto-Upload
function initPhotoUpload() {
  const uploadArea = document.getElementById('photoUpload');
  const photoInput = document.getElementById('photoInput');
  const additionalInput = document.getElementById('additionalPhotos');
  const preview = document.getElementById('photoPreview');
  const addMoreBtn = document.getElementById('addMorePhotos');
  const nextBtn = document.getElementById('nextStep2');
  
  uploadArea.addEventListener('click', () => {
    if (photos.length === 0) {
      photoInput.click();
    } else {
      additionalInput.click();
    }
  });
  
  addMoreBtn.addEventListener('click', () => additionalInput.click());
  
  photoInput.addEventListener('change', handlePhotoSelect);
  additionalInput.addEventListener('change', handleAdditionalPhotos);
  
  function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (file) {
      addPhoto(file, true);
    }
  }
  
  function handleAdditionalPhotos(e) {
    const files = Array.from(e.target.files);
    const remaining = 3 - photos.length;
    files.slice(0, remaining).forEach(file => addPhoto(file, false));
    additionalInput.value = '';
  }
  
  function addPhoto(file, isPrimary) {
    if (photos.length >= 3) {
      alert('Maximal 3 Fotos erlaubt');
      return;
    }
    
    // Komprimieren
    compressImage(file).then(compressedFile => {
      const photoData = {
        file: compressedFile,
        url: URL.createObjectURL(compressedFile),
        isPrimary
      };
      photos.push(photoData);
      updatePhotoPreview();
    });
  }
  
  function updatePhotoPreview() {
    preview.innerHTML = '';
    
    photos.forEach((photo, index) => {
      const item = document.createElement('div');
      item.className = 'photo-item';
      item.innerHTML = `
        <img src="${photo.url}" alt="Foto ${index + 1}">
        <button type="button" class="remove-photo" data-index="${index}">×</button>
      `;
      preview.appendChild(item);
    });
    
    // Remove-Buttons
    preview.querySelectorAll('.remove-photo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        URL.revokeObjectURL(photos[index].url);
        photos.splice(index, 1);
        updatePhotoPreview();
      });
    });
    
    // UI aktualisieren
    uploadArea.classList.toggle('has-photo', photos.length > 0);
    addMoreBtn.style.display = photos.length > 0 && photos.length < 3 ? 'block' : 'none';
    nextBtn.disabled = photos.length === 0;
    
    if (photos.length > 0) {
      uploadArea.innerHTML = `<p>📷 ${photos.length}/3 Fotos - Tippen zum Hinzufügen</p>`;
    } else {
      uploadArea.innerHTML = `
        <p>📷 Tippen Sie hier, um ein Foto aufzunehmen oder hochzuladen</p>
        <p style="font-size: 0.85rem; color: var(--matrix-green-dark);">Mindestens 1 Foto erforderlich (max. 3)</p>
      `;
    }
  }
  
  nextBtn.addEventListener('click', () => {
    goToStep(3);
    initMap();
  });
}

// Bild komprimieren
async function compressImage(file, maxSizeMB = 2, maxDimension = 1920) {
  return new Promise((resolve) => {
    // Wenn bereits klein genug, nicht komprimieren
    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve(file);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
        resolve(compressedFile);
      }, 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
}

// Karte initialisieren
function initMap() {
  if (map) return;
  
  // Default: Berlin Mitte
  const defaultLat = 52.520008;
  const defaultLng = 13.404954;
  
  map = L.map('map').setView([defaultLat, defaultLng], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  
  // Marker erstellen (verschiebbar)
  marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
  
  // Marker-Position aktualisieren bei Drag
  marker.on('dragend', () => {
    const pos = marker.getLatLng();
    updateLocation(pos.lat, pos.lng);
  });
  
  // Klick auf Karte setzt Marker
  map.on('click', (e) => {
    marker.setLatLng(e.latlng);
    updateLocation(e.latlng.lat, e.latlng.lng);
  });
  
  // GPS automatisch versuchen wenn Tab aktiv
  tryGetGPSLocation();
  
  // NextStep3 Button Event
  document.getElementById('nextStep3').addEventListener('click', () => goToStep(4));
}

// Kommentar-Feld
function initCommentField() {
  const textarea = document.getElementById('comment');
  const charCount = document.getElementById('charCount');
  const nextBtn = document.getElementById('nextStep4');
  
  textarea.addEventListener('input', () => {
    const count = textarea.value.length;
    charCount.textContent = count;
    
    charCount.parentElement.classList.remove('warning', 'error');
    if (count > 450) charCount.parentElement.classList.add('warning');
    if (count > 500) charCount.parentElement.classList.add('error');
  });
  
  nextBtn.addEventListener('click', () => {
    if (!textarea.value.trim()) {
      alert('Bitte geben Sie eine Beschreibung ein.');
      return;
    }
    updateSummary();
    goToStep(5);
  });
}

// Dringlichkeits-Buttons
function initUrgencyButtons() {
  const buttons = document.querySelectorAll('.urgency-btn');
  const input = document.getElementById('urgencyInput');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      input.value = btn.dataset.urgency;
    });
  });
}

// Zusammenfassung aktualisieren
function updateSummary() {
  const categoryLabels = {
    'TRASH': '🗑️ Müll',
    'DAMAGE': '🚧 Schäden an Infrastruktur',
    'VANDALISM': '🎨 Vandalismus',
    'OTHER': '❓ Sonstiges'
  };
  
  document.getElementById('summaryCategory').textContent = categoryLabels[selectedCategory] || '-';
  document.getElementById('summaryLocation').textContent = currentLocation.address || '-';
  document.getElementById('summaryComment').textContent = document.getElementById('comment').value;
  
  const photosContainer = document.getElementById('summaryPhotos');
  photosContainer.innerHTML = '';
  photos.forEach(photo => {
    const img = document.createElement('img');
    img.src = photo.url;
    photosContainer.appendChild(img);
  });
}

// Navigation
function initNavigation() {
  // Zurück-Buttons
  document.querySelectorAll('[data-prev]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(currentStep - 1));
  });
  
  // Submit
  form.addEventListener('submit', handleSubmit);
}

// Schritt wechseln
function goToStep(step) {
  if (step < 1 || step > 5) return;
  
  // Aktuelle Form-Step ausblenden
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
  
  // Stepper aktualisieren
  document.querySelectorAll('.stepper li').forEach((li, index) => {
    li.classList.remove('active', 'completed');
    if (index + 1 < step) li.classList.add('completed');
    if (index + 1 === step) li.classList.add('active');
  });
  
  currentStep = step;
  
  // Nach oben scrollen
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Formular absenden
async function handleSubmit(e) {
  e.preventDefault();
  
  const privacyCheckbox = document.getElementById('privacyAccepted');
  if (!privacyCheckbox.checked) {
    alert('Bitte akzeptieren Sie die Datenschutzerklärung.');
    return;
  }
  
  // Loading anzeigen
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  loading.classList.add('active');
  
  try {
    const formData = new FormData();
    formData.append('category', selectedCategory);
    formData.append('latitude', currentLocation.lat);
    formData.append('longitude', currentLocation.lng);
    formData.append('comment', document.getElementById('comment').value);
    formData.append('urgency', document.getElementById('urgencyInput').value);
    formData.append('deviceId', document.getElementById('deviceIdInput').value);
    formData.append('privacyAccepted', 'true');
    
    const email = document.getElementById('contactEmail').value;
    if (email) formData.append('contactEmail', email);
    
    // Fotos hinzufügen
    if (photos.length > 0) {
      formData.append('photo', photos[0].file, photos[0].file.name);
      
      for (let i = 1; i < photos.length; i++) {
        formData.append('photos', photos[i].file, photos[i].file.name);
      }
    }
    
    const response = await fetch('/api/reports', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Fehler beim Senden der Meldung');
    }
    
    // Erfolg anzeigen
    loading.classList.remove('active');
    successScreen.style.display = 'block';
    document.getElementById('ticketIdDisplay').textContent = data.ticketId;
    
    // Ticket-ID in localStorage speichern
    const savedTickets = JSON.parse(localStorage.getItem('maengelmelder_tickets') || '[]');
    savedTickets.unshift({
      ticketId: data.ticketId,
      category: selectedCategory,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('maengelmelder_tickets', JSON.stringify(savedTickets.slice(0, 10)));
    
  } catch (error) {
    loading.classList.remove('active');
    goToStep(5);
    alert('Fehler: ' + error.message);
    console.error('Submit error:', error);
  }
}
