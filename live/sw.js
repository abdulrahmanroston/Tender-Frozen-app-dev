const CACHE_VERSION = 'v2.2.1'; //
const STATIC_CACHE = `tenderfrozen-static-${CACHE_VERSION}`;

// الملفات الثابتة الأساسية لتحميل التطبيق كـ PWA
const STATIC_FILES = [
  'https://darkviolet-antelope-523488.hostingersite.com/admin-app/',
  'https://darkviolet-antelope-523488.hostingersite.com/admin-app/index.html',
  'https://darkviolet-antelope-523488.hostingersite.com/admin-app/pos.html', 
  'https://darkviolet-antelope-523488.hostingersite.com/admin-app/warehouses.html',
  'https://darkviolet-antelope-523488.hostingersite.com/admin-app/acc.html',
  'https://darkviolet-antelope-523488.hostingersite.com/admin-app/tf-navigation.js',
  'https://darkviolet-antelope-523488.hostingersite.com/admin-app/tf-navigation.css',
  'https://darkviolet-antelope-523488.hostingersite.com/admin-app/icons/icon1.png',
  'https://darkviolet-antelope-523488.hostingersite.com/admin-app/icons/icon2.png',
  'https://darkviolet-antelope-523488.hostingersite.com/admin-app/manifest.json' =
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing version', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files for PWA');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached successfully');
        return self.skipWaiting(); // تفعيل فوري
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed:', error);
      })
  );
});

// تفعيل Service Worker ومسح أي كاش قديم
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating version', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Service Worker: Deleting cache:', cacheName);
          return caches.delete(cacheName); // مسح كل الكاش
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated and controlling all clients');
      return self.clients.claim();
    })
  );
});

// معالجة الطلبات
self.addEventListener('fetch', (event) => {
  const requestURL = new URL(event.request.url);
  
  // إذا كان طلب API، استخدم استراتيجية Network Only مع cache busting
  if (isAPIRequest(requestURL)) {
    event.respondWith(networkOnlyStrategy(event.request));
  } 
  // إذا كان ملف ثابت، استخدم Cache First لتحميل واجهة PWA
  else if (isStaticFile(requestURL)) {
    event.respondWith(cacheFirstStrategy(event.request));
  } 
  // أي طلبات أخرى، استخدم Network Only بدون كاش
  else {
    event.respondWith(networkOnlyStrategy(event.request));
  }
});

// فحص إذا كان الطلب لـ API
function isAPIRequest(url) {
  return url.pathname.includes('/wp-json/') || 
         url.pathname.includes('/api/') ||
         url.pathname.includes('wc/v3/') ||
         url.pathname.includes('/wp-admin/admin-ajax.php') ||
         url.search.includes('rest_route') ||
         url.search.includes('action=');
}

// فحص إذا كان ملف ثابت
function isStaticFile(url) {
  return STATIC_FILES.some(file => url.href === file) ||
         /\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|json)$/i.test(url.pathname);
}

// استراتيجية Network Only للـ API وأي طلبات غير ثابتة
async function networkOnlyStrategy(request) {
  console.log('Service Worker: Network Only for:', request.url);
  
  try {
    const cacheBustedRequest = addCacheBuster(request);
    console.log('Service Worker: Fetching with cache buster:', cacheBustedRequest.url);
    const networkResponse = await fetch(cacheBustedRequest, {
      cache: 'no-store', // منع الكاش في المتصفح
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!networkResponse.ok) {
      throw new Error(`Network response not ok: ${networkResponse.status}`);
    }
    
    console.log('Service Worker: Network response received:', networkResponse.status);
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Network failed for:', request.url, error);
    
    // إرجاع رسالة خطأ إذا فشل الطلب
    return new Response(JSON.stringify({
      error: 'Network unavailable, request failed',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// استراتيجية Cache First للملفات الثابتة فقط (لدعم PWA)
async function cacheFirstStrategy(request) {
  console.log('Service Worker: Cache First for static file:', request.url);
  
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request, {
      cache: 'no-store' // منع الكاش في المتصفح
    });
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch static file:', error);
    // إرجاع صفحة offline إذا كانت موجودة
    return caches.match('https://tenderfrozen.com/admin-app/index.html');
  }
}

// إضافة cache buster للطلبات
function addCacheBuster(request) {
  const url = new URL(request.url);
  url.searchParams.set('_cb', Date.now());
  url.searchParams.set('_v', CACHE_VERSION);
  
  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    credentials: request.credentials,
    mode: request.mode,
    cache: 'no-store'
  });
}

// معالجة الرسائل من الصفحة الرئيسية
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message:', event.data);
  
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
    event.ports[0].postMessage({ success: true });
  }
  
  if (event.data && event.data.action === 'clearCache') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true, message: 'Cache cleared' });
    });
  }
});

// مسح جميع الكاش
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(name => {
      console.log('Service Worker: Deleting cache:', name);
      return caches.delete(name);
    })
  );
}

// error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker: Global error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection:', event.reason);
});