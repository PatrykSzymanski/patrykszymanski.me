// Dynamic favicon for dark mode support
(function() {
  function updateFavicon() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const faviconLink = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
    
    if (faviconLink) {
      faviconLink.href = isDarkMode ? '/favicon-dark.svg' : '/favicon-light.svg';
    }
  }

  // Update favicon on page load
  updateFavicon();

  // Listen for color scheme changes
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeMediaQuery.addEventListener('change', updateFavicon);
})();
