import { Suspense } from 'react'
import FlagGameClient from './FlagGameClient'

export default function FlagPage() {
  return (
    <Suspense fallback={<div>Loading map game...</div>}>
      <FlagGameClient />
    </Suspense>
  )
}
