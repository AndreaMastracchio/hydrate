import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const action = event.action || 'open'
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      let target = windows[0]
      if (target) {
        await target.focus()
      } else {
        target = await self.clients.openWindow('/')
      }
      if (target) target.postMessage({ source: 'hydrate', action })
    })()
  )
})
