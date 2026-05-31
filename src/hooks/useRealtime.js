import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Subscribes to INSERT/UPDATE/DELETE on a Supabase table.
// Calls onchange() when any event fires so callers can re-fetch.
export function useRealtime(table, onchange) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, onchange)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, onchange])
}
