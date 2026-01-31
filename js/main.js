// Main Logic

const state = {
    currentSlide: 0,
    totalSlides: 0,
    isPresentationMode: false,
    sections: [
        'sections/cover.html',
        'sections/section1.html',
        'sections/section2.html',
        'sections/section3.html',
        'sections/section4.html',
        'sections/section5.html',
        'sections/qa.html'
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadSections();
    initControls();
    updateCounter();
    handleResize();
});

// Load all HTML fragments
async function loadSections() {
    const container = document.getElementById('slides-container');

    for (const url of state.sections) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`Failed to load ${url}`);

            let html = await resp.text();
            // Basic cleanup of old paths if needed
            html = html.replace(/\.\.\/assets\//g, 'assets/');

            container.insertAdjacentHTML('beforeend', html);
        } catch (err) {
            console.error(err);
        }
    }

    // Count slides
    const slides = document.querySelectorAll('.slide-container');
    state.totalSlides = slides.length;

    // Mark first as active (visually only relevant in presentation mode)
    if (slides.length > 0) slides[0].classList.add('active');
}

// Navigation & Controls
function initControls() {
    // Buttons
    document.getElementById('prev-arrow').onclick = prevSlide;
    document.getElementById('next-arrow').onclick = nextSlide;

    document.getElementById('btn-present').onclick = togglePresentation;
    document.getElementById('btn-fullscreen').onclick = toggleFullscreen;

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (!state.isPresentationMode) return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case 'Space':
            case ' ':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'Escape':
                if (state.isPresentationMode) togglePresentation();
                break;
        }
    });

    // Presentation mode specifics
    window.addEventListener('resize', handleResize);
}

function nextSlide() {
    if (state.currentSlide < state.totalSlides - 1) {
        setSlide(state.currentSlide + 1);
    }
}

function prevSlide() {
    if (state.currentSlide > 0) {
        setSlide(state.currentSlide - 1);
    }
}

function setSlide(index) {
    state.currentSlide = index;
    updateCounter();

    const slides = document.querySelectorAll('.slide-container');

    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);

        // Reset fragments
        if (i !== index) {
            slide.querySelectorAll('.fragment').forEach(f => f.classList.remove('visible'));
        }
    });

    if (state.isPresentationMode) {
        triggerAnimations(slides[index]);
    }
}

function updateCounter() {
    const el = document.getElementById('slide-counter');
    el.innerText = `${state.currentSlide + 1} / ${state.totalSlides}`;
}

function togglePresentation() {
    state.isPresentationMode = !state.isPresentationMode;
    document.body.classList.toggle('presentation-mode', state.isPresentationMode);

    const btnIcon = document.querySelector('#btn-present i');
    if (state.isPresentationMode) {
        btnIcon.classList.replace('fa-play', 'fa-stop');
        handleResize(); // Calc scale
        setSlide(state.currentSlide); // Refresh view

        // Try fullscreen
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => { });
        }
    } else {
        btnIcon.classList.replace('fa-stop', 'fa-play');
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function handleResize() {
    if (!state.isPresentationMode) return;

    // Scale slides to fit viewport
    // Default slide size: 1280 x 720
    const w = window.innerWidth;
    const h = window.innerHeight;

    const scale = Math.min(w / 1280, h / 720);
    document.documentElement.style.setProperty('--slide-scale', scale);
}

function triggerAnimations(slide) {
    // Simple stagger for .fragment items
    const fragments = slide.querySelectorAll('.fragment');
    fragments.forEach((f, i) => {
        setTimeout(() => {
            f.classList.add('visible');
        }, i * 200 + 300);
    });
}
