import { useStore } from './store'
import type { DrawingMeta } from './store'
import type { Link } from '../modules/types'
import { useEffect, useState } from 'react'

type Snapshot = {
  links: Link[]
  drawing: DrawingMeta
  conveyorWidth: number
}

const MAX_HISTORY = 100

const past: Snapshot[] = []
const future: Snapshot[] = []
let suspendHistory = false

const subscribers = new Set<() => void>()
function notify() {
  for (const fn of subscribers) fn()
}

function snapshot(): Snapshot {
  const s = useStore.getState()
  return { links: s.links, drawing: s.drawing, conveyorWidth: s.conveyorWidth }
}

function equalSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.links === b.links &&
    a.drawing === b.drawing &&
    a.conveyorWidth === b.conveyorWidth
  )
}

let initialized = false

export function installHistory() {
  if (initialized) return
  initialized = true
  let last = snapshot()
  useStore.subscribe((state) => {
    if (suspendHistory) {
      last = {
        links: state.links,
        drawing: state.drawing,
        conveyorWidth: state.conveyorWidth,
      }
      return
    }
    const current: Snapshot = {
      links: state.links,
      drawing: state.drawing,
      conveyorWidth: state.conveyorWidth,
    }
    if (equalSnapshot(current, last)) return
    past.push(last)
    if (past.length > MAX_HISTORY) past.shift()
    future.length = 0
    last = current
    notify()
  })
}

function applySnapshot(s: Snapshot) {
  suspendHistory = true
  useStore.getState().replaceState(s)
  // Microtask to clear the flag once Zustand has propagated
  queueMicrotask(() => {
    suspendHistory = false
  })
}

export function undo(): boolean {
  if (past.length === 0) return false
  const prev = past.pop()!
  future.push(snapshot())
  applySnapshot(prev)
  notify()
  return true
}

export function redo(): boolean {
  if (future.length === 0) return false
  const next = future.pop()!
  past.push(snapshot())
  applySnapshot(next)
  notify()
  return true
}

export function canUndo(): boolean {
  return past.length > 0
}
export function canRedo(): boolean {
  return future.length > 0
}

export function useHistoryStatus(): { canUndo: boolean; canRedo: boolean } {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force((n) => n + 1)
    subscribers.add(fn)
    return () => {
      subscribers.delete(fn)
    }
  }, [])
  return { canUndo: canUndo(), canRedo: canRedo() }
}
