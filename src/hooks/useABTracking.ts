import { useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface TrackEvent {
  event: string
  properties: Record<string, unknown>
  timestamp: string
}

const eventQueue: TrackEvent[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null

function getVariant(): string {
  const stored = localStorage.getItem('ab_variant')
  if (stored) return stored
  const variant = Math.random() < 0.5 ? 'A' : 'B'
  localStorage.setItem('ab_variant', variant)
  return variant
}

function getSessionId(): string {
  let sid = sessionStorage.getItem('session_id')
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    sessionStorage.setItem('session_id', sid)
  }
  return sid
}

function enqueue(event: string, properties: Record<string, unknown> = {}) {
  eventQueue.push({
    event,
    properties: {
      ...properties,
      variant: getVariant(),
      sessionId: getSessionId(),
    },
    timestamp: new Date().toISOString(),
  })
}

function flush() {
  if (eventQueue.length === 0) return
  const events = [...eventQueue]
  eventQueue.length = 0

  try {
    const stored = JSON.parse(localStorage.getItem('ab_events') || '[]')
    const merged = [...stored, ...events].slice(-500)
    localStorage.setItem('ab_events', JSON.stringify(merged))
  } catch {
    // ignore
  }
}

export function useABTracking() {
  const { selectedPersona } = useAppStore()
  const prevPersona = useRef(selectedPersona)
  const sessionStart = useRef(Date.now())

  useEffect(() => {
    if (!flushTimer) {
      flushTimer = setInterval(flush, 5000)
    }
    return () => {
      if (flushTimer) {
        clearInterval(flushTimer)
        flushTimer = null
      }
      flush()
    }
  }, [])

  useEffect(() => {
    if (prevPersona.current !== selectedPersona) {
      trackPersonaSwitch(prevPersona.current, selectedPersona)
      prevPersona.current = selectedPersona
    }
  }, [selectedPersona])

  const trackCardImpression = useCallback((policyId: string, category: string, urgency: string) => {
    enqueue('card_impression', { policyId, personaId: selectedPersona, category, urgency })
  }, [selectedPersona])

  const trackCardClick = useCallback((policyId: string, clickTarget: string, timeToClick?: number) => {
    enqueue('card_click', { policyId, personaId: selectedPersona, clickTarget, timeToClick })
  }, [selectedPersona])

  const trackImpactAreaView = useCallback((policyId: string, urgency: string, viewDuration: number) => {
    enqueue('impact_area_view', { policyId, personaId: selectedPersona, urgency, viewDuration })
  }, [selectedPersona])

  const trackSidebarOpen = useCallback(() => {
    enqueue('sidebar_open', { personaId: selectedPersona })
  }, [selectedPersona])

  const trackOriginalLinkClick = useCallback((policyId: string, source: string) => {
    enqueue('original_link_click', { policyId, personaId: selectedPersona, source })
  }, [selectedPersona])

  const trackGuideAction = useCallback((policyId: string, guideStep: number) => {
    enqueue('guide_action', { policyId, personaId: selectedPersona, guideStep })
  }, [selectedPersona])

  const trackSessionEnd = useCallback((cardsViewed: number) => {
    enqueue('session_end', {
      personaId: selectedPersona,
      sessionDuration: Date.now() - sessionStart.current,
      cardsViewed,
    })
  }, [selectedPersona])

  return {
    variant: getVariant(),
    trackCardImpression,
    trackCardClick,
    trackImpactAreaView,
    trackSidebarOpen,
    trackOriginalLinkClick,
    trackGuideAction,
    trackSessionEnd,
  }
}

function trackPersonaSwitch(from: string, to: string) {
  enqueue('persona_switch', { fromPersona: from, toPersona: to })
}

export function getABEvents(): TrackEvent[] {
  try {
    return JSON.parse(localStorage.getItem('ab_events') || '[]')
  } catch {
    return []
  }
}

export function clearABEvents() {
  localStorage.removeItem('ab_events')
  localStorage.removeItem('ab_variant')
}

export function getABStats() {
  const events = getABEvents()
  const variantA = events.filter(e => e.properties.variant === 'A')
  const variantB = events.filter(e => e.properties.variant === 'B')

  const clicksA = variantA.filter(e => e.event === 'card_click').length
  const impressionsA = variantA.filter(e => e.event === 'card_impression').length
  const clicksB = variantB.filter(e => e.event === 'card_click').length
  const impressionsB = variantB.filter(e => e.event === 'card_impression').length

  return {
    totalEvents: events.length,
    variantA: { events: variantA.length, clicks: clicksA, impressions: impressionsA, ctr: impressionsA > 0 ? (clicksA / impressionsA * 100).toFixed(1) + '%' : 'N/A' },
    variantB: { events: variantB.length, clicks: clicksB, impressions: impressionsB, ctr: impressionsB > 0 ? (clicksB / impressionsB * 100).toFixed(1) + '%' : 'N/A' },
  }
}
