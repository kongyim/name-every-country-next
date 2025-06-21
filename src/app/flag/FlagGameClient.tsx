'use client'

import _ from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GameTopBar } from '@/components/GameTopBar'
import { GameSummary } from '@/components/GameSummary'

import { useGameState } from '@/hooks/useGameState'
import { playAudio, normalize } from '@/utils/gameUtils'
import type { Country } from '@/types/geography'

let applauseAudio: HTMLAudioElement | null = null

export default function FlagGameClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [regions, setRegions] = useState<string[]>([])
  const selectedCountries = useGameState(regions)

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, boolean>>({})

  const [startTime, setStartTime] = useState<number>(Date.now())
  const [endTime, setEndTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const [showAnswers, setShowAnswers] = useState(false)
  const [congratulate, setCongratulate] = useState(false)
  const [showError, setShowError] = useState(false)

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const newRegions = searchParams?.getAll('region') || []
    setRegions(newRegions)
  }, [searchParams])

  useEffect(() => {
    if (endTime !== null) return // stop if game is finished

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, endTime])

  useEffect(() => {
    setStartTime(Date.now())
    setEndTime(null)
    setAnswers({})
    setResults({})
    setShowAnswers(false)
    setCongratulate(false)
    setShowError(false)
  }, [selectedCountries])

  const handleInputChange = (iso2: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [iso2]: value }))
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    country: Country,
    index: number
  ) => {
    if (e.key !== 'Enter' && e.key !== 'Tab') return

    const userAnswer = normalize(answers[country.iso2] || '')
    const correctAnswer = normalize(country.name)

    if (!userAnswer) return

    const isCorrect = userAnswer === correctAnswer
    const updatedResults = { ...results, [country.iso2]: isCorrect }
    setResults(updatedResults)

    if (isCorrect) {
      const next = selectedCountries[index + 1]
      if (next && e.key === 'Enter') {
        inputRefs.current[next.iso2]?.focus()
      }
      playAudio(`/assets/country-mp3/${country.iso2}.mp3`)
    } else {
      inputRefs.current[country.iso2]?.select()
      playAudio('/assets/mp3/error.mp3')
      setShowError(true)
      setTimeout(() => setShowError(false), 2000)
    }

    const allCorrect = selectedCountries.every((c) => updatedResults[c.iso2])
    if (allCorrect) {
      setCongratulate(true)
      setEndTime(Date.now()) // ⏱ stop timer
      applauseAudio = new Audio('/assets/mp3/applause.mp3')
      applauseAudio.play().catch((err) => console.warn('Applause failed:', err))
    }
  }

  const handleGiveUp = () => {
    playAudio('/assets/mp3/giveup.mp3')
    if (!confirm('Are you sure you want to give up?')) return

    const newResults: Record<string, boolean> = {}
    selectedCountries.forEach((c) => {
      const userAnswer = normalize(answers[c.iso2] || '')
      newResults[c.iso2] = userAnswer === normalize(c.name)
    })

    setResults(newResults)
    setShowAnswers(true)
  }

  const handleTryAgain = () => {
    if (applauseAudio) {
      applauseAudio.pause()
      applauseAudio.currentTime = 0
    }
    playAudio('/assets/mp3/retry.mp3')
    setEndTime(null)
    setRegions([...regions]) // triggers re-filtering and reshuffling
  }

  const handleBack = () => {
    playAudio('/assets/mp3/back.mp3')
    if (confirm('Are you sure you want to go back? Progress will be lost.')) {
      router.back()
    }
  }

  const correctCount = Object.values(results).filter(Boolean).length
  const totalCount = selectedCountries.length

  return (
    <>
      <GameTopBar
        elapsedTime={elapsedTime}
        correctCount={correctCount}
        totalCount={totalCount}
        onBack={handleBack}
        onGiveUp={handleGiveUp}
        onTryAgain={handleTryAgain}
        showAnswers={showAnswers}
        congratulate={congratulate}
      />

      {showError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 text-red-700 border border-red-300 px-6 py-3 rounded shadow">
          ❌ Incorrect! Please try again.
        </div>
      )}

      {congratulate && (
        <GameSummary elapsedTime={elapsedTime} onTryAgain={handleTryAgain} onExit={handleBack} />
      )}

      <div className="flex flex-wrap gap-4 m-10 mt-24">
        {selectedCountries.map((country, index) => {
          const iso2 = country.iso2
          const isCorrect = results[iso2]

          return (
            <AnimatePresence key={`country-${country.name}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`w-40 flex flex-col items-center p-4 gap-2 ${
                    isCorrect
                      ? 'border-green-500'
                      : showAnswers && isCorrect === false
                        ? 'border-red-500'
                        : ''
                  }`}
                >
                  <Image
                    src={`/assets/flags/svg/${iso2}.svg`}
                    alt={`${country.name} flag`}
                    width={120}
                    height={120}
                    className="object-contain object-center w-30 h-22"
                  />
                  {isCorrect || showAnswers ? (
                    <div
                      className={`h-9 text-center font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}
                    >
                      {country.name}
                    </div>
                  ) : (
                    <Input
                      ref={(el) => {
                        inputRefs.current[iso2] = el
                      }}
                      value={answers[iso2] || ''}
                      onChange={(e) => handleInputChange(iso2, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, country, index)}
                      className={`text-center ${results[iso2] === false ? 'bg-red-100' : ''}`}
                    />
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>
          )
        })}
      </div>
    </>
  )
}
