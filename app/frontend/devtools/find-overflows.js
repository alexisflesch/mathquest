// DevTools helper: find-overflows.js
// Usage: paste the functions into the browser console, or open this file in DevTools Snippets and run.
// findOverflows(limit) -> returns up to `limit` elements inside the first card-like container that have scrollHeight > clientHeight
// sampleScrollbarElement() -> returns the element sampled at the right-middle edge of the first card-like container

function findOverflows(limit = 5) {
    const card = document.querySelector('.tqcard-content') || document.querySelector('.card') || document.querySelector('.question-text-in-live-page') || document.body;
    if (!card) return { error: 'no card found' };
    const els = Array.from(card.querySelectorAll('*'));
    const found = els.filter(e => e.scrollHeight > e.clientHeight);
    return found.slice(0, limit).map(e => ({
        tag: e.tagName.toLowerCase(),
        classes: e.className || '(no class)',
        clientHeight: e.clientHeight,
        scrollHeight: e.scrollHeight,
        bbox: e.getBoundingClientRect ? e.getBoundingClientRect() : null,
        computed: (window.getComputedStyle(e).overflow + ' / ' + window.getComputedStyle(e).overflowX + ' / ' + window.getComputedStyle(e).overflowY)
    }));
}

function sampleScrollbarElement() {
    const card = document.querySelector('.tqcard-content') || document.querySelector('.card') || document.querySelector('.question-text-in-live-page');
    if (!card) return { error: 'no card-like element found' };
    const r = card.getBoundingClientRect();
    const sampleX = Math.min(window.innerWidth - 10, Math.floor(r.right) - 5);
    const sampleY = Math.floor((r.top + r.bottom) / 2);
    const el = document.elementFromPoint(sampleX, sampleY);
    if (!el) return { sampleX, sampleY, el: null };
    const s = window.getComputedStyle(el);
    return {
        sampleX, sampleY,
        tag: el.tagName.toLowerCase(),
        classes: el.className || '(no class)',
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        overflow: s.overflow,
        overflowX: s.overflowX,
        overflowY: s.overflowY,
        bbox: el.getBoundingClientRect()
    };
}

// Convenience: auto-run and log first 5 results
console.log('findOverflows(5) =>', findOverflows(5));
console.log('sampleScrollbarElement() =>', sampleScrollbarElement());
