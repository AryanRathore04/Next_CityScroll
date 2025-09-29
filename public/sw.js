// Service Worker for offline functionality
const CACHE_NAME = "cityscroll-v1.0.0";
const STATIC_CACHE_NAME = "cityscroll-static-v1.0.0";
const DYNAMIC_CACHE_NAME = "cityscroll-dynamic-v1.0.0";

// Resources to cache immediately
const STATIC_ASSETS = [
  "/",
  "/salons",
  "/bookings",
  "/account",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/salons/,
  /^\/api\/services/,
  /^\/api\/bookings/,
  /^\/api\/user/,
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets...");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName !== STATIC_CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith("cityscroll-")
              );
            })
            .map((cacheName) => {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => {
        return self.clients.claim();
      }),
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticAssets(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Check if this API should be cached
  const shouldCache = API_CACHE_PATTERNS.some((pattern) =>
    pattern.test(url.pathname),
  );

  if (!shouldCache) {
    return fetch(request);
  }

  try {
    // Try network first
    const networkResponse = await fetch(request.clone());

    if (networkResponse.ok) {
      // Cache successful responses for GET requests
      if (request.method === "GET") {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }

    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for critical endpoints
    if (url.pathname.includes("/bookings") || url.pathname.includes("/user")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "offline",
          message: "You are currently offline. Some features may be limited.",
          cached: true,
        }),
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    throw error;
  }
}

// Handle navigation requests with cache-first for app shell
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the page
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fall back to offline page
    const offlinePage = await caches.match("/offline");
    if (offlinePage) {
      return offlinePage;
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fall back to offline page
    const offlinePage = await caches.match("/offline");
    if (offlinePage) {
      return offlinePage;
    }

    // Return basic offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CityScroll - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
            }
            .container { max-width: 400px; padding: 2rem; }
            h1 { font-size: 2rem; margin-bottom: 1rem; }
            p { font-size: 1.1rem; line-height: 1.6; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔌 You're Offline</h1>
            <p>
              No internet connection detected. Please check your connection and try again.
              Your bookings and account information will be available once you're back online.
            </p>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "text/html" },
      },
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
  try {
    // Try cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch from network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the asset
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // If both cache and network fail, return a fallback
    if (request.destination === "image") {
      return new Response(
        `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f3f4f6"/>
          <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af">Image Unavailable</text>
        </svg>`,
        { headers: { "Content-Type": "image/svg+xml" } },
      );
    }

    throw error;
  }
}

// Background sync for offline bookings
self.addEventListener("sync", (event) => {
  if (event.tag === "booking-sync") {
    event.waitUntil(syncOfflineBookings());
  }
});

// Sync offline bookings when connection is restored
async function syncOfflineBookings() {
  try {
    const cache = await caches.open("offline-bookings");
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        const response = await cache.match(request);
        if (response) {
          const data = await response.json();

          // Attempt to submit the offline booking
          const submitResponse = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (submitResponse.ok) {
            // Successfully synced, remove from offline cache
            await cache.delete(request);

            // Notify user of successful sync
            self.registration.showNotification("Booking Confirmed", {
              body: "Your offline booking has been confirmed!",
              icon: "/icons/icon-192x192.png",
              badge: "/icons/icon-72x72.png",
              tag: "booking-sync",
            });
          }
        }
      } catch (error) {
        console.error("Failed to sync booking:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Push notification handling
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    image: data.image,
    data: data.data,
    actions: [
      {
        action: "view",
        title: "View Details",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === "view" || !action) {
    // Open the app to the relevant page
    const urlToOpen = data?.url || "/bookings";

    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }

          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        }),
    );
  }
});

// Cache management - limit cache size
setInterval(async () => {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const keys = await cache.keys();

  // Keep only the 50 most recent entries
  if (keys.length > 50) {
    const keysToDelete = keys.slice(0, keys.length - 50);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
  }
}, 60000); // Run every minute
