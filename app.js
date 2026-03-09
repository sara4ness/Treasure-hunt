document.addEventListener('DOMContentLoaded', () => {
    // Geofencing constants
    const REQUIRED_DISTANCE_METERS = 50; // User must be within 50m to unlock

    // Coordinates simulating spots around Outernet / Denmark Street (approx 51.515, -0.130)
    // These are randomized around the center to simulate the hunt
    const centerLat = 51.5160;
    const centerLng = -0.1303;

    // Helper to generate a slight offset
    const randomOffset = () => (Math.random() - 0.5) * 0.003;

    // Array of the images
    const fragments = [
        { id: 1, src: 'images/IMG_2203.jpg', clue: 'Look closely at the layered brickwork.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 2, src: 'images/IMG_2208.jpg', clue: 'Weathered words painted on stone.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 3, src: 'images/IMG_2214.jpg', clue: 'A vibrant burst of street art.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 4, src: 'images/IMG_2224.jpg', clue: 'Distressed posters overlapping in time.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 5, src: 'images/IMG_2239 2.jpg', clue: 'A hidden mark in the alleyway.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 6, src: 'images/IMG_2240 2.jpg', clue: 'A small tag on a rusted surface.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 7, src: 'images/IMG_2241 2.jpg', clue: 'Remnants of old Denmark Street.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 8, src: 'images/IMG_2242 2.jpg', clue: 'A textured architectural detail.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 9, src: 'images/IMG_3168.jpg', clue: 'Stickers layered on a lamppost.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 10, src: 'images/IMG_3187.jpg', clue: 'A bold slash of colorful paint.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 12, src: 'images/IMG_3221.jpg', clue: 'A peeling advertisement.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 13, src: 'images/IMG_3223.jpg', clue: 'A mysterious stencil.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 14, src: 'images/IMG_3228.jpg', clue: 'An intricate pattern etched in cement.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 15, src: 'images/IMG_3239 2.jpg', clue: 'A macro shot of weathered wood.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() },
        { id: 16, src: 'images/IMG_3201.jpg', clue: 'A final piece of the urban puzzle.', lat: centerLat + randomOffset(), lng: centerLng + randomOffset() }
    ];

    // State
    const TOTAL_FRAGMENTS = fragments.length;
    let foundFragments = [];
    let activeFragment = null;
    let map = null;
    let userMarker = null;
    let markers = {};
    let currentUserLat = null;
    let currentUserLng = null;
    let watchId = null;

    // DOM Elements
    const gridContainer = document.getElementById('fragment-grid');
    const modal = document.getElementById('capture-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalInstruction = document.getElementById('modal-instruction');
    const modalDistance = document.getElementById('modal-distance');

    const cameraInput = document.getElementById('camera-input');
    const captureLabel = document.getElementById('capture-label');
    const captureText = document.getElementById('capture-text');
    const captureIcon = document.getElementById('capture-icon');

    const scanningOverlay = document.getElementById('scanning-overlay');
    const successOverlay = document.getElementById('success-overlay');
    const errorOverlay = document.getElementById('error-overlay');

    const continueBtn = document.getElementById('continue-btn');
    const errorBtn = document.getElementById('error-btn');
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');

    const btnGrid = document.getElementById('btn-grid');
    const btnMap = document.getElementById('btn-map');
    const viewGrid = document.getElementById('view-grid');
    const viewMap = document.getElementById('view-map');

    const debugToggle = document.getElementById('debug-location');

    // Navigation Logic
    btnGrid.addEventListener('click', () => {
        btnGrid.classList.add('active');
        btnMap.classList.remove('active');
        viewGrid.classList.add('active-view');
        viewMap.classList.remove('active-view');
    });

    btnMap.addEventListener('click', () => {
        btnMap.classList.add('active');
        btnGrid.classList.remove('active');
        viewMap.classList.add('active-view');
        viewGrid.classList.remove('active-view');

        // Initialize map if it hasn't been yet, or invalidate size if hidden
        if (!map) {
            initMap();
        } else {
            map.invalidateSize();
        }
    });

    // Load state from local storage
    if (localStorage.getItem('imprintsState2')) {
        foundFragments = JSON.parse(localStorage.getItem('imprintsState2'));
    }

    // Initialize Leaflet Map
    function initMap() {
        // Center on Outernet / Denmark St
        map = L.map('leaflet-map').setView([centerLat, centerLng], 16);

        // Light mode map tiles (CartoDB Positron)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Add pins for fragments
        fragments.forEach((fragment) => {
            const isFound = foundFragments.includes(fragment.id);

            // Create a custom div icon
            const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="marker-pin ${isFound ? 'found-pin' : ''}"></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker([fragment.lat, fragment.lng], { icon: customIcon }).addTo(map);

            // Clicking a pin opens the modal
            marker.on('click', () => {
                const numStr = fragment.id.toString().padStart(2, '0');
                if (!isFound) {
                    openModal(fragment, numStr);
                } else {
                    alert('You have already unlocked this imprint!');
                }
            });

            markers[fragment.id] = marker;
        });

        // Start Tracking User Location
        startLocationTracking();
    }

    // Geolocation Tracking
    function startLocationTracking() {
        if ("geolocation" in navigator) {
            // Watch position updates continuously
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    currentUserLat = position.coords.latitude;
                    currentUserLng = position.coords.longitude;
                    updateUserMarker();

                    // If modal is open, continuously update distance text
                    if (activeFragment) {
                        checkDistance(activeFragment);
                    }
                },
                (error) => {
                    console.warn("Geolocation Error:", error);
                    // Handle error (e.g. permission denied) silent fallback to debug mode if needed
                },
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        } else {
            console.error("Geolocation not supported by this browser.");
        }
    }

    function updateUserMarker() {
        if (!map || currentUserLat === null) return;

        // Custom user icon (pulsing blue dot)
        if (!userMarker) {
            const userIcon = L.divIcon({
                className: 'custom-div-icon',
                html: '<div class="user-location-marker"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            userMarker = L.marker([currentUserLat, currentUserLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        } else {
            userMarker.setLatLng([currentUserLat, currentUserLng]);
        }
    }

    // Distance Calculation (Haversine formula) in meters
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // Initialize Grid
    function renderGrid() {
        gridContainer.innerHTML = '';
        fragments.forEach((fragment, index) => {
            const isFound = foundFragments.includes(fragment.id);
            const numStr = (index + 1).toString().padStart(2, '0');

            const card = document.createElement('div');
            card.className = `fragment-card ${isFound ? 'found' : ''}`;
            card.dataset.id = fragment.id;

            const img = document.createElement('img');
            img.src = fragment.src;
            img.alt = `Fragment ${numStr}`;
            img.className = 'fragment-image';
            img.loading = 'lazy';

            card.appendChild(img);

            if (!isFound) {
                card.addEventListener('click', () => openModal(fragment, numStr));
            } else {
                card.addEventListener('click', () => alert('You have already unlocked this imprint!'));
            }

            gridContainer.appendChild(card);
        });

        updateProgress();
    }

    function updateProgress() {
        progressText.textContent = `${foundFragments.length} / ${TOTAL_FRAGMENTS}`;
        const percentage = (foundFragments.length / TOTAL_FRAGMENTS) * 100;
        progressFill.style.width = `${percentage}%`;
    }

    // Modal & Distance Logic
    function checkDistance(fragment) {
        if (debugToggle.checked) {
            // Debug mode allows capturing from anywhere
            enableCapture("Debug Mode Active");
            return;
        }

        if (currentUserLat === null || currentUserLng === null) {
            modalDistance.textContent = "Waiting for GPS signal...";
            modalDistance.className = "modal-distance";
            disableCapture();
            return;
        }

        const dist = calculateDistance(currentUserLat, currentUserLng, fragment.lat, fragment.lng);

        if (dist <= REQUIRED_DISTANCE_METERS) {
            enableCapture(`You are ${Math.round(dist)}m away!`);
        } else {
            disableCapture(`${Math.round(dist)}m away. Move closer!`);
        }
    }

    function enableCapture(msg) {
        modalDistance.textContent = msg;
        modalDistance.className = "modal-distance valid";
        captureLabel.classList.remove('disabled');
        cameraInput.disabled = false;
        captureText.textContent = "Capture Imprint";
        captureIcon.innerHTML = "&#128247;"; // Camera
    }

    function disableCapture(msg = "Too far away") {
        modalDistance.textContent = msg;
        modalDistance.className = "modal-distance";
        captureLabel.classList.add('disabled');
        cameraInput.disabled = true;
        captureText.textContent = "Move Closer";
        captureIcon.innerHTML = "&#128681;"; // Flag/Map pin
    }

    function openModal(fragment, numStr) {
        activeFragment = fragment;
        modalImage.src = fragment.src;
        modalTitle.textContent = `Fragment #${numStr}`;
        modalInstruction.textContent = fragment.clue;

        // Initial distance check
        checkDistance(fragment);

        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
        activeFragment = null;
        cameraInput.value = ''; // Reset input
    }

    closeModalBtn.addEventListener('click', closeModal);

    // Handle Camera Input and Verification
    cameraInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        scanningOverlay.classList.remove('hidden');

        // Check distance one final time at the moment of capture
        let isValid = debugToggle.checked;
        if (!isValid && currentUserLat !== null) {
            const dist = calculateDistance(currentUserLat, currentUserLng, activeFragment.lat, activeFragment.lng);
            isValid = dist <= REQUIRED_DISTANCE_METERS;
        }

        setTimeout(() => {
            scanningOverlay.classList.add('hidden');

            if (isValid) {
                // Success!
                if (!foundFragments.includes(activeFragment.id)) {
                    foundFragments.push(activeFragment.id);
                    localStorage.setItem('imprintsState2', JSON.stringify(foundFragments));

                    // Update map marker instantly
                    if (markers[activeFragment.id]) {
                        const iconHtml = markers[activeFragment.id].options.icon.options.html;
                        markers[activeFragment.id].options.icon.options.html = iconHtml.replace('marker-pin', 'marker-pin found-pin');
                        markers[activeFragment.id].setIcon(markers[activeFragment.id].options.icon);
                    }
                }
                successOverlay.classList.remove('hidden');
            } else {
                // Failed! (They moved out of range or spoofed)
                errorOverlay.classList.remove('hidden');
            }
        }, 2000); // 2 second mock analysis
    });

    continueBtn.addEventListener('click', () => {
        successOverlay.classList.add('hidden');
        closeModal();
        renderGrid();
    });

    errorBtn.addEventListener('click', () => {
        errorOverlay.classList.add('hidden');
        cameraInput.value = '';
    });

    // Request initial position to speed up acquisition
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                currentUserLat = pos.coords.latitude;
                currentUserLng = pos.coords.longitude;
                // If map is already initialized, update marker
                if (map) updateUserMarker();
            },
            () => console.warn("Initial GPS request failed or denied.")
        );
    }

    // Setup initial view
    renderGrid();
});
