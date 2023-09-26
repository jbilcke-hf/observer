import { useEffect } from "react"

export function useTimeout(duration: number, callback: () => void) {
  useEffect(() => {
    setTimeout(() => {
      callback()
    }, duration)
  }, [])
}