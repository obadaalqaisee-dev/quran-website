// Google Analytics (same measurement ID as the original site), moved out of an inline <script>
// so the Content Security Policy can forbid inline scripts.
(function () {
  var ID = 'G-PMNKGK1Y97';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ID);
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
})();
