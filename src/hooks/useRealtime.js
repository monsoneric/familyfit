import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Subscribes to INSERT/UPDATE/DELETE on a Supabase table.
// Calls onchange() when any event fires so callers can re-fetch.
// Uses a ref to prevent duplicate subscriptions on re-render.
export function useRealtime(table, onchange) {
  const callbackRef = useRef(onchange)

  // Keep ref current without re-subscribing
  useEffect(() => {
    callbackRef.current = onchange
  }, [onchange])

  useEffect(() => {
    const channelName = `realtime:${table}:${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => callbackRef.current(payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table])  // only re-subscribe if table name changes
}
