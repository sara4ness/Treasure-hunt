document.addEventListener('DOMContentLoaded', () => {
    // Array of the images you provided. 
    // In a real scenario, you might add 'clues' or specific gps locations to these objects.
    const fragments = [
        { id: 1, src: 'images/IMG_2203.jpg', clue: 'Look closely at the layered brickwork.' },
        { id: 2, src: 'images/IMG_2208.jpg', clue: 'Weathered words painted on stone.' },
        { id: 3, src: 'images/IMG_2214.jpg', clue: 'A vibrant burst of street art.' },
        { id: 4, src: 'images/IMG_2224.jpg', clue: 'Distressed posters overlapping in time.' },
        { id: 5, src: 'images/IMG_2239 2.jpg', clue: 'A hidden mark in the alleyway.' },
        { id: 6, src: 'images/IMG_2240 2.jpg', clue: 'A small tag on a rusted surface.' },
        { id: 7, src: 'images/IMG_2241 2.jpg', clue: 'Remnants of old Denmark Street.' },
        { id: 8, src: 'images/IMG_2242 2.jpg', clue: 'A textured architectural detail.' },
        { id: 9, src: 'images/IMG_3168.jpg', clue: 'Stickers layered on a lamppost.' },
        { id: 10, src: 'images/IMG_3187.jpg', clue: 'A bold slash of colorful paint.' },
        { id: 11, src: 'images/IMG_3201 (1).jpg', clue: 'A subtle engraving near the ground.' },
        { id: 12, src: 'images/IMG_3221.jpg', clue: 'A peeling advertisement.' },
        { id: 13, src: 'images/IMG_3223.jpg', clue: 'A mysterious stencil.' },
        { id: 14, src: 'images/IMG_3228.jpg', clue: 'An intricate pattern etched in cement.' },
        { id: 15, src: 'images/IMG_3239 2.jpg', clue: 'A macro shot of weathered wood.' },
        { id: 16, src: 'images/IMG_3201.jpg', clue: 'A final piece of the urban puzzle.' }
    ];

    // State
    const TOTAL_FRAGMENTS = fragments.length;
    let foundFragments = [];
    let activeFragmentId = null;

    // DOM Elements
    const gridContainer = document.getElementById('fragment-grid');
    const modal = document.getElementById('capture-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalInstruction = document.querySelector('.modal-instruction');
    const cameraInput = document.getElementById('camera-input');
    const scanningOverlay = document.getElementById('scanning-overlay');
    const successOverlay = document.getElementById('success-overlay');
    const continueBtn = document.getElementById('continue-btn');
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');

    // Load state from local storage
    if (localStorage.getItem('imprintsState')) {
        foundFragments = JSON.parse(localStorage.getItem('imprintsState'));
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
            img.loading = 'lazy'; // Improve performance

            card.appendChild(img);

            // Add click listener to open modal if not yet found
            if (!isFound) {
                card.addEventListener('click', () => openModal(fragment, numStr));
            } else {
                // Feature enhancement: If found, maybe click just shows it full screen
                card.addEventListener('click', () => {
                    alert('You have already unlocked this imprint!');
                });
            }

            gridContainer.appendChild(card);
        });
        
        updateProgress();
    }

    // Update Progress Bar
    function updateProgress() {
        progressText.textContent = `${foundFragments.length} / ${TOTAL_FRAGMENTS}`;
        const percentage = (foundFragments.length / TOTAL_FRAGMENTS) * 100;
        progressFill.style.width = `${percentage}%`;
    }

    // Open Modal
    function openModal(fragment, numStr) {
        activeFragmentId = fragment.id;
        modalImage.src = fragment.src;
        modalTitle.textContent = `Fragment #${numStr}`;
        modalInstruction.textContent = fragment.clue;
        modal.classList.remove('hidden');
    }

    // Close Modal
    function closeModal() {
        modal.classList.add('hidden');
        activeFragmentId = null;
        cameraInput.value = ''; // Reset input
    }
    
    closeModalBtn.addEventListener('click', closeModal);

    // Handle Camera Input
    cameraInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simulate "Analyzing" process
        scanningOverlay.classList.remove('hidden');

        setTimeout(() => {
            scanningOverlay.classList.add('hidden');
            
            // Success! Save state
            if (!foundFragments.includes(activeFragmentId)) {
                foundFragments.push(activeFragmentId);
                localStorage.setItem('imprintsState', JSON.stringify(foundFragments));
            }
            
            // Show Success Overlay
            successOverlay.classList.remove('hidden');

        }, 1800); // Wait 1.8 seconds simulating AI analysis
    });

    // Continue button after success
    continueBtn.addEventListener('click', () => {
        successOverlay.classList.add('hidden');
        closeModal();
        renderGrid(); // Re-render to show new checkmark
    });

    // Setup initial view
    renderGrid();
});
