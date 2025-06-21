'use client'

import { Button } from '@/components/ui/button'

interface GameSummaryProps {
  elapsedTime: number
  onTryAgain: () => void
  onExit: () => void
}

export function GameSummary({ elapsedTime, onTryAgain, onExit }: GameSummaryProps) {
  return (
    <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 text-green-800 border border-green-300 px-8 py-6 rounded shadow-xl text-center">
      <h1 className="text-2xl font-bold mb-2">🎉 Congratulations! 🎉</h1>
      <p className="mb-4">
        You correctly identified all countries in <strong>{elapsedTime}</strong> seconds!
      </p>
      <div className="flex gap-4 justify-center">
        <Button onClick={onTryAgain}>Try Again</Button>
        <Button variant="outline" onClick={onExit}>
          Exit
        </Button>
      </div>
    </div>
  )
}
