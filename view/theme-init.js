/**
 * Theme and zoom-ladder initialization.
 * Runs before first paint so neither the colour palette nor the type scale flashes.
 */
(function () {
  var ZOOM_MIN = 0.7;
  var ZOOM_MAX = 2.5;
  var ZOOM_STEP = 0.1;
  var ZOOM_DEFAULT = 1;

  function clampZoom(level) {
    if (!isFinite(level)) return ZOOM_DEFAULT;
    var snapped = Math.round(level / ZOOM_STEP) * ZOOM_STEP;
    return Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, snapped)) * 100) / 100;
  }

  try {
    var storedTheme = localStorage.getItem('interview-theme');
    var theme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    // Fallback to dark theme if anything goes wrong
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // The ladder scales the root font size (see the --z note in style.css), which
  // grows type and every rem-based floor while the layout viewport stays the
  // real window. The stored value used to feed documentElement.style.zoom, and
  // that magnified the shell past the window instead of re-flowing it, so a
  // legacy value is retired once rather than applied on top of the baked size.
  var zoom = ZOOM_DEFAULT;
  try {
    if (localStorage.getItem('interview-ui-zoom-v2') === null) {
      localStorage.setItem('interview-ui-zoom', String(ZOOM_DEFAULT));
      localStorage.setItem('interview-ui-zoom-v2', '1');
    } else {
      zoom = clampZoom(parseFloat(localStorage.getItem('interview-ui-zoom')));
    }
  } catch (e) {
    zoom = ZOOM_DEFAULT;
  }
  document.documentElement.style.setProperty('--z', String(zoom));
})();
