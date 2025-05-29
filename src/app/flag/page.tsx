'use client'

import _ from 'lodash'
import type { Country } from '@/types/geography'
import countries from '@/data/countries.json'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

let applauseAudio: HTMLAudioElement | null = null
let timerInterval: NodeJS.Timeout | null = null

export default function FlagPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [regions, setRegions] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [showAnswers, setShowAnswers] = useState<boolean>(false)
  const [congratulate, setCongratulate] = useState<boolean>(false)
  const [showError, setShowError] = useState<boolean>(false)

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [startTime])

  useEffect(() => {
    const newRegions = searchParams?.getAll('region') || []
    setRegions(newRegions)
  }, [searchParams])

  useEffect(() => {
    let newCountries = countries.filter((c) => c.regions.some((r) => regions.includes(r)))
    newCountries = _.shuffle(newCountries)
    setSelectedCountries(newCountries)
    setStartTime(Date.now())
    setAnswers({})
    setResults({})
    setShowAnswers(false)
    setCongratulate(false)
    setShowError(false)
  }, [regions])

  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/gi, '')

  const handleInputChange = (iso2: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [iso2]: value }))
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    country: Country,
    index: number
  ) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      const userAnswer = normalize(answers[country.iso2] || '')
      const correctAnswer = normalize(country.name)
      if (_.isEmpty(userAnswer)) return

      const isCorrect = userAnswer === correctAnswer
      const updatedResults = { ...results, [country.iso2]: isCorrect }
      setResults(updatedResults)

      if (isCorrect) {
        const next = selectedCountries[index + 1]
        if (next) {
          if (e.key === 'Enter') {
            inputRefs.current[next.iso2]?.focus()
          }
          playAudio(`/assets/country-mp3/${country.iso2}.mp3`)
        }
      } else {
        inputRefs.current[country.iso2]?.select()
        playAudio('/assets/mp3/error.mp3')
        setShowError(true)
        setTimeout(() => setShowError(false), 2000)
      }

      const allCorrect = selectedCountries.every((c) => updatedResults[c.iso2])
      if (allCorrect) {
        setCongratulate(true)
        if (timerInterval) clearInterval(timerInterval)
        applauseAudio = new Audio('/assets/mp3/applause.mp3')
        applauseAudio.play().catch((err) => console.warn('Applause failed:', err))
      }
    }
  }

  const handleGiveUp = () => {
    playAudio('/assets/mp3/giveup.mp3')
    if (!confirm('Are you sure you want to give up?')) return
    const newResults: Record<string, boolean> = {}
    selectedCountries.forEach((c) => {
      const userAnswer = normalize(answers[c.iso2] || '')
      const correctAnswer = normalize(c.name)
      newResults[c.iso2] = userAnswer === correctAnswer
    })
    setResults(newResults)
    setShowAnswers(true)
    if (timerInterval) clearInterval(timerInterval)
  }

  const handleTryAgain = () => {
    if (applauseAudio) {
      applauseAudio.pause()
      applauseAudio.currentTime = 0
    }
    playAudio('/assets/mp3/retry.mp3')
    setRegions([...regions])
  }

  const handleBack = () => {
    playAudio('/assets/mp3/back.mp3')
    if (confirm('Are you sure you want to go back? Progress will be lost.')) {
      router.back()
    }
  }

  const playAudio = (filePath: string) => {
    const audio = new Audio(filePath)
    audio.play().catch((err) => console.warn('Audio failed:', err))
  }

  const correctCount = Object.values(results).filter(Boolean).length
  const totalCount = selectedCountries.length

  return (
    <>
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
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          {!showAnswers && !congratulate ? (
            <Button variant="destructive" onClick={handleGiveUp}>
              Give Up
            </Button>
          ) : (
            <Button onClick={handleTryAgain}>Try Again</Button>
          )}
        </div>
      </motion.div>

      {showError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 text-red-700 border border-red-300 px-6 py-3 rounded shadow">
          ❌ Incorrect! Please try again.
        </div>
      )}

      {congratulate && (
        <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 text-green-800 border border-green-300 px-8 py-6 rounded shadow-xl text-center">
          <h1 className="text-2xl font-bold mb-2">🎉 Congratulations! 🎉</h1>
          <p className="mb-4">You have correctly named all countries in {elapsedTime} seconds!</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleTryAgain}>Try Again</Button>
            <Button onClick={handleBack}>Exit</Button>
          </div>
        </div>
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
                      ref={(el) => (inputRefs.current[iso2] = el)}
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
