import { useState, useEffect } from 'react'
import { savePushSubscription, removePushSubscription } from '../lib/queries'

// Public VAPID key — must match VAPID_PUBLIC_KEY secret in Supabase
// Replace with your own key from: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotifications(member) {
  const [permission,  setPermission]  = useState(Notification.permission)
  const [subscribed,  setSubscribed]  = useState(false)
  const [supported,   setSupported]   = useState(false)
  const [loading,     setLoading]     = useState(false)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY)
    // Check if already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
      )
    }
  }, [])

  async function subscribe() {
    if (!supported || !member) return
    setLoading(true)
    try {
      const reg  = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setLoading(false); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const json = sub.toJSON()
      await savePushSubscription({
        member_id: member.id,
        endpoint:  json.endpoint,
        p256dh:    json.keys.p256dh,
        auth:      json.keys.auth,
      })
      setSubscribed(true)
    } catch (e) {
      console.error('Push subscribe error:', e)
    }
    setLoading(false)
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await removePushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (e) {
      console.error('Push unsubscribe error:', e)
    }
    setLoading(false)
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}
