self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
    // وجود هذا الحدث ضروري جداً ليتمكن المتصفح من التعرف على الموقع كتطبيق PWA قابل للتثبيت
});