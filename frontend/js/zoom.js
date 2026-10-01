/**
 * NeoBank Accessibility Page Zoom Controller
 * Enables on-page Zoom In (+), Zoom Out (-), and Reset (100%) controls
 * for all users without needing keyboard shortcuts (Ctrl +/-).
 * Supports full range from 25% minimum to 500% maximum (matching Chrome DevTools zoom restrictions).
 * Persists zoom state across sessions and page navigation.
 */

(function() {
  const ZOOM_STORAGE_KEY = 'neobank_page_zoom';
  const MIN_ZOOM = 0.25; // 25% minimum
  const MAX_ZOOM = 5.00; // 500% maximum
  const DEFAULT_ZOOM = 1.00;

  // Standard Chrome / DevTools zoom ladder from 25% up to 500%
  const ZOOM_STEPS = [
    0.25, 0.33, 0.50, 0.67, 0.75, 0.80, 0.90,
    1.00,
    1.10, 1.25, 1.50, 1.75, 2.00, 2.50, 3.00, 4.00, 5.00
  ];

  function getSavedZoom() {
    try {
      const saved = parseFloat(localStorage.getItem(ZOOM_STORAGE_KEY));
      if (!isNaN(saved) && saved >= MIN_ZOOM && saved <= MAX_ZOOM) {
        return Math.round(saved * 100) / 100;
      }
    } catch (e) {}
    return DEFAULT_ZOOM;
  }

  function updateZoomUI(level) {
    const pct = Math.round(level * 100) + '%';
    document.querySelectorAll('.zoom-level-text').forEach(el => {
      el.textContent = pct;
    });

    const atMin = level <= MIN_ZOOM + 0.005;
    const atMax = level >= MAX_ZOOM - 0.005;

    // Update disabled/opacity states and titles on +/- buttons
    document.querySelectorAll('.zoom-out-btn').forEach(btn => {
      btn.style.opacity = atMin ? '0.35' : '1';
      btn.style.cursor = atMin ? 'not-allowed' : 'pointer';
      btn.setAttribute('aria-disabled', atMin ? 'true' : 'false');
      btn.title = atMin ? 'Minimum zoom reached (25%)' : 'Zoom Out (Smaller -)';
    });

    document.querySelectorAll('.zoom-in-btn').forEach(btn => {
      btn.style.opacity = atMax ? '0.35' : '1';
      btn.style.cursor = atMax ? 'not-allowed' : 'pointer';
      btn.setAttribute('aria-disabled', atMax ? 'true' : 'false');
      btn.title = atMax ? 'Maximum zoom reached (500%)' : 'Zoom In (Larger +)';
    });

    document.querySelectorAll('.zoom-reset-btn').forEach(btn => {
      btn.title = `Current Zoom: ${pct}. Click to reset to 100%`;
    });
  }

  function applyZoom(level) {
    const clampedLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(level * 100) / 100));

    if (document.body) {
      document.body.style.zoom = clampedLevel;
    }
    if (document.documentElement) {
      document.documentElement.style.setProperty('--page-zoom', clampedLevel);
    }

    updateZoomUI(clampedLevel);

    try {
      localStorage.setItem(ZOOM_STORAGE_KEY, clampedLevel.toString());
    } catch (e) {}
  }

  window.zoomPageIn = function() {
    const current = getSavedZoom();
    // Find next step strictly greater than current
    const next = ZOOM_STEPS.find(s => s > current + 0.01);
    applyZoom(next !== undefined ? next : MAX_ZOOM);
  };

  window.zoomPageOut = function() {
    const current = getSavedZoom();
    // Find next step strictly lower than current
    const reversed = [...ZOOM_STEPS].reverse();
    const prev = reversed.find(s => s < current - 0.01);
    applyZoom(prev !== undefined ? prev : MIN_ZOOM);
  };

  window.resetPageZoom = function() {
    applyZoom(DEFAULT_ZOOM);
  };

  // Keyboard shortcut listeners (Ctrl + / Ctrl - / Ctrl 0) to keep on-page UI in perfect sync
  window.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        window.zoomPageIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        window.zoomPageOut();
      } else if (e.key === '0') {
        e.preventDefault();
        window.resetPageZoom();
      }
    }
  });

  // Ctrl + Mouse Wheel listener to sync zoom level smoothly
  window.addEventListener('wheel', function(e) {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        window.zoomPageIn();
      } else {
        window.zoomPageOut();
      }
    }
  }, { passive: false });

  // Immediate execution before DOM finishes loading to prevent layout shifts
  const initialZoom = getSavedZoom();
  if (document.body) {
    document.body.style.zoom = initialZoom;
  }

  // Re-sync UI inputs when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyZoom(getSavedZoom());
    });
  } else {
    applyZoom(getSavedZoom());
  }
})();
