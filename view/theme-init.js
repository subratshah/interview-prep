/**
 * Theme and zoom initialization script
 * This script runs immediately to prevent flash of unstyled content (FOUC)
 */
(function () {
  try {
    // Initialize theme
    var stored = localStorage.getItem('interview-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    
    // Initialize zoom
    var zoomRaw = localStorage.getItem('interview-ui-zoom');
    var zoom = zoomRaw != null ? parseFloat(zoomRaw) : 1.5;
    if (zoom >= 0.75 && zoom <= 1.75) {
      document.documentElement.style.zoom = String(zoom);
    }
  } catch (e) {
    // Fallback to dark theme if anything goes wrong
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();