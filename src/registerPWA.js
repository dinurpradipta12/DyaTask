export const registerDyaTaskPWA = () => {
  if (import.meta.env.DEV) return
  if (!('serviceWorker' in navigator)) return
  if (!['http:', 'https:'].includes(window.location.protocol)) return

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('dyatask:pwa-update-ready'))
          }
        })
      })
    } catch (error) {
      console.warn('DyaTask PWA registration failed:', error)
    }
  })
}
