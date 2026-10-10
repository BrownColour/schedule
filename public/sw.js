const CACHE = 'trimester-v1'

// App shell files to cache on install
const SHELL = [
  '/',
  '/dashboard',
  '/calendar',
  '/courses',
  '/attendance',
  '/settings',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Let Supabase requests go network-first, fall back to nothing (can't cache POST/auth)
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(
      fetch(request).catch(() => new Response(
        JSON.stringify({ error: 'offline' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    )
    return
  }

  // For navigation and static assets: cache-first, fall back to network
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        // Cache successful GET responses for app pages and assets
        if (request.method === 'GET' && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      }).catch(() => {
        // If offline and nothing cached, return the cached root
        return caches.match('/') || new Response('Offline', { status: 503 })
      })
    })
  )
})
