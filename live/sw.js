const CACHE_VERSION = 'v8.0.0';


self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installed:', CACHE_VERSION);
  self.skipWaiting(); // تفعيل فوري
});

// التفعيل - مسح أي كاش قديم
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated:', CACHE_VERSION);
  
  event.waitUntil(
    // مسح كل الكاش القديم
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ All caches cleared');
      return self.clients.claim();
    })
  );
});

// معالجة الطلبات - كل حاجة تعدي عادي بدون تدخل
self.addEventListener('fetch', (event) => {
  
  return;
});

// معالجة الرسائل
self.addEventListener('message', (event) => {
  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
    if (event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  }
  
  if (event.data?.action === 'clearCache') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
    }).then(() => {
      if (event.ports[0]) {
        event.ports[0].postMessage({ success: true, message: 'Cache cleared' });
      }
    });
  }
});

console.log('🚀 Service Worker loaded - PWA ready (No Caching)');
