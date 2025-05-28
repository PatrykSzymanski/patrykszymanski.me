// Dynamic favicon for dark mode support
(function() {
  function updateFavicon() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Remove existing favicon links (except apple-touch-icon)
    document.querySelectorAll('link[rel="icon"]').forEach(link => {
      if (!link.href.includes('apple-touch-icon')) link.remove();
    });
    
    // Add SVG favicon with dark mode support
    const svgFavicon = document.createElement('link');
    svgFavicon.rel = 'icon';
    svgFavicon.type = 'image/svg+xml';
    svgFavicon.href = isDarkMode ? '/favicon-dark.svg' : '/favicon-light.svg';
    document.head.insertBefore(svgFavicon, document.head.firstChild);
    
    // Add PNG fallback
    const pngFavicon = document.createElement('link');
    pngFavicon.rel = 'icon';
    pngFavicon.type = 'image/png';
    pngFavicon.href = '/favicon.png';
    document.head.appendChild(pngFavicon);
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateFavicon);
  } else {
    updateFavicon();
  }

  // Listen for color scheme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateFavicon);
})();
