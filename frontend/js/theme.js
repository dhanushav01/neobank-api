/**
 * NeoBank Theme Manager (Dark & Light Mode)
 * Provides clean, instantaneous switching between Dark and Light mode
 * with full state synchronization across all interactive toggles.
 */

(function() {
  const THEME_STORAGE_KEY = 'neobank_theme';

  function getSavedTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  }

  function applyTheme(theme) {
    const targetTheme = (theme === 'light') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', targetTheme);
    document.documentElement.style.colorScheme = targetTheme;
    
    if (document.body) {
      if (targetTheme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      }
    }

    // Synchronize all theme toggle buttons across the page
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.setAttribute('data-current-theme', targetTheme);
      btn.setAttribute('aria-pressed', targetTheme === 'light' ? 'true' : 'false');
      btn.setAttribute('title', targetTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode');
      const label = btn.querySelector('.theme-toggle-label');
      if (label) {
        label.textContent = targetTheme === 'light' ? 'Light' : 'Dark';
      }
    });

    // Synchronize legacy theme dropdowns if any exist
    document.querySelectorAll('.theme-select').forEach(select => {
      select.value = targetTheme;
    });

    // Remove any stray theme-icon elements if present
    document.querySelectorAll('.theme-icon').forEach(icon => {
      icon.style.display = 'none';
    });
  }

  window.setAppTheme = function(theme) {
    const targetTheme = (theme === 'light') ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, targetTheme);
    applyTheme(targetTheme);
  };

  window.toggleAppTheme = function() {
    const current = getSavedTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    window.setAppTheme(next);
  };

  // Apply immediately before DOM content loads to avoid theme flicker
  applyTheme(getSavedTheme());

  // Re-sync UI inputs when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyTheme(getSavedTheme());
    });
  } else {
    applyTheme(getSavedTheme());
  }
})();
