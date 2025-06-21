'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface Props {
  elapsedTime: number
  correctCount: number
  totalCount: number
  showAnswers: boolean
  congratulate: boolean
  onBack: () => void
  onGiveUp: () => void
  onTryAgain: () => void
}

export function GameTopBar({
  elapsedTime,
  correctCount,
  totalCount,
  showAnswers,
  congratulate,
  onBack,
  onGiveUp,
  onTryAgain
}: Props) {
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 bg-white shadow z-50 p-4 flex justify-between items-center text-sm font-medium"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <div>⏱ Time: {elapsedTime}s</div>
      <div>
        ✅ Correct: {correctCount}/{totalCount}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        {!showAnswers && !congratulate ? (
          <Button variant="destructive" onClick={onGiveUp}>
            Give Up
          </Button>
        ) : (
          <Button onClick={onTryAgain}>Try Again</Button>
        )}
      </div>
    </motion.div>
  )
}
