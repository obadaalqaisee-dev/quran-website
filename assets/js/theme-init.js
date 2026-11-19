// Runs before first paint so the chosen theme never flashes.
// Uses the original "theme" storage key; on a first visit it follows the system preference.
(function () {
  var theme = null;
  try { theme = localStorage.getItem('theme'); } catch (e) { /* storage unavailable */ }
  var dark = theme ? theme === 'dark' : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark-mode');
})();
