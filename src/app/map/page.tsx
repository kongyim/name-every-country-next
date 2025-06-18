// src/app/map/page.tsx
import { Suspense } from 'react'
import MapGameClient from './MapGameClient'

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading map game...</div>}>
      <MapGameClient />
    </Suspense>
  )
}
