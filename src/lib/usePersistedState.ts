import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export function usePersistedState<T>(key: string | undefined, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (!key || typeof window === 'undefined') return initialValue
    try {
      const stored = window.localStorage.getItem(key)
      return stored === null ? initialValue : JSON.parse(stored) as T
    } catch {
      return initialValue
    }
  })

  const setPersistedValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    setValue((current) => {
      const value = typeof next === 'function' ? (next as (current: T) => T)(current) : next
      if (key) window.localStorage.setItem(key, JSON.stringify(value))
      return value
    })
  }, [key])

  return [value, setPersistedValue]
}
