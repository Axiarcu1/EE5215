// Main Logic - Performance Optimized

const state = {
    currentSlide: 0,
    totalSlides: 0,
    isPresentationMode: false,
    resizeTimeout: null,
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

// Load all HTML fragments with performance optimization
async function loadSections() {
    const container = document.getElementById('slides-container');

    // Use DocumentFragment for batch DOM insertion
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');

    // Load all sections in parallel for faster loading
    const promises = state.sections.map(url =>
        fetch(url).then(resp => resp.ok ? resp.text() : '')
    );

    const htmlContents = await Promise.all(promises);

    htmlContents.forEach(html => {
        if (html) {
            html = html.replace(/\.\.\/assets\//g, 'assets/');
            tempDiv.innerHTML = html;
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
        }
    });

    // Single DOM insertion
    container.appendChild(fragment);

    // Count slides
    const slides = document.querySelectorAll('.slide-container');
    state.totalSlides = slides.length;

    // Mark first as active
    if (slides.length > 0) slides[0].classList.add('active');
}

// Navigation & Controls
function initControls() {
    document.getElementById('prev-arrow').onclick = prevSlide;
    document.getElementById('next-arrow').onclick = nextSlide;
    document.getElementById('btn-present').onclick = togglePresentation;
    document.getElementById('btn-fullscreen').onclick = toggleFullscreen;

    // Keyboard - use passive listener for performance
    document.addEventListener('keydown', handleKeydown, { passive: false });

    // Debounced resize handler
    window.addEventListener('resize', debouncedResize, { passive: true });
}

function handleKeydown(e) {
    if (!state.isPresentationMode) return;

    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
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

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
        updateCounter();

        const slides = document.querySelectorAll('.slide-container');

        slides.forEach((slide, i) => {
            const isActive = i === index;
            slide.classList.toggle('active', isActive);

            // Reset fragments on inactive slides
            if (!isActive) {
                slide.querySelectorAll('.fragment.visible').forEach(f =>
                    f.classList.remove('visible')
                );
            }
        });

        if (state.isPresentationMode) {
            triggerAnimations(slides[index]);
        }
    });
}

function updateCounter() {
    const el = document.getElementById('slide-counter');
    el.textContent = `${state.currentSlide + 1} / ${state.totalSlides}`;
}

function togglePresentation() {
    state.isPresentationMode = !state.isPresentationMode;
    document.body.classList.toggle('presentation-mode', state.isPresentationMode);

    const btnIcon = document.querySelector('#btn-present i');
    if (state.isPresentationMode) {
        btnIcon.classList.replace('fa-play', 'fa-stop');
        handleResize();
        setSlide(state.currentSlide);

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
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

// Debounced resize for performance
function debouncedResize() {
    if (state.resizeTimeout) {
        cancelAnimationFrame(state.resizeTimeout);
    }
    state.resizeTimeout = requestAnimationFrame(handleResize);
}

function handleResize() {
    if (!state.isPresentationMode) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = Math.min(w / 1280, h / 720);
    document.documentElement.style.setProperty('--slide-scale', scale);
}

function triggerAnimations(slide) {
    const fragments = slide.querySelectorAll('.fragment:not(.visible)');

    // Faster animation timing (100ms instead of 200ms)
    fragments.forEach((f, i) => {
        setTimeout(() => {
            requestAnimationFrame(() => f.classList.add('visible'));
        }, i * 100 + 150);
    });
}
