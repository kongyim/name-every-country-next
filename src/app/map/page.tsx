'use client'

import { ComposableMap, ZoomableGroup, Geographies, Geography } from 'react-simple-maps'
import type { Country } from '@/types/geography'
import countries from '@/data/countries.json'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import _ from 'lodash'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export default function MapGame() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [found, setFound] = useState<string[]>([])
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  const [regions, setRegions] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([])
  const [showAnswers, setShowAnswers] = useState<boolean>(false)
  const [congratulate, setCongratulate] = useState<boolean>(false)
  const [showError, setShowError] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')
  const [lastCorrect, setLastCorrect] = useState<Country | null>(null)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
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
    setFound([])
    setShowAnswers(false)
    setCongratulate(false)
    setShowError(false)
  }, [regions])

  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/gi, '')

  const handleInputChange = (value: string) => {
    setInputValue(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const normalizedInput = normalize(inputValue)

      const matched = selectedCountries.find(
        (country) => normalize(country.name) === normalizedInput
      )

      if (matched) {
        if (!found.includes(matched.iso2)) {
          setFound((prev) => [...prev, matched.iso2])
        }
        playAudio(`/assets/country-mp3/${matched.iso2}.mp3`)
        setInputValue('')
        setLastCorrect(matched)
        // setTimeout(() => setLastCorrect(null), 3000)

        const allCorrect = selectedCountries.every(
          (c) => found.includes(c.iso2) || c.iso2 === matched.iso2
        )

        if (allCorrect) {
          setCongratulate(true)
          if (timerRef.current) clearInterval(timerRef.current)
          const applause = new Audio('/assets/mp3/applause.mp3')
          applause.play().catch((err) => console.warn('Applause failed:', err))
        }
      } else {
        playAudio('/assets/mp3/error.mp3')
        setShowError(true)
        setLastCorrect(null)

        // Focus and select the input text
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }

        setTimeout(() => setShowError(false), 2000)
      }
    }
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

  const correctCount = found.length
  const totalCount = selectedCountries.length

  return (
    <div className="relative w-full h-screen bg-white">
      {/* Top input bar */}
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
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e)}
            className={showError ? 'border-red-500 ring-2 ring-red-300 focus:outline-none' : ''}
          />

          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          {!showAnswers && !congratulate ? (
            <Button variant="destructive" onClick={() => setShowAnswers(true)}>
              Give Up
            </Button>
          ) : (
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          )}
        </div>
      </motion.div>

      {/* Correct Answer Dialog */}
      <AnimatePresence>
        {lastCorrect && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 bg-green-100 border border-green-300 px-6 py-3 rounded shadow flex items-center gap-4"
          >
            <Image
              src={`/assets/flags/svg/${lastCorrect.iso2}.svg`}
              alt={lastCorrect.name}
              width={40}
              height={30}
              className="object-contain"
            />
            <div className="text-lg font-semibold text-green-800">{lastCorrect.name}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {showError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 text-red-700 border border-red-300 px-6 py-3 rounded shadow">
          ❌ Incorrect! Please try again.
        </div>
      )}

      {/* Map display */}
      <ComposableMap
        projection="geoEqualEarth"
        width={980}
        height={520}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup zoom={1} center={[0, 20]}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any }) =>
              geographies.map((geo: any) => {
                const name = geo.properties.name
                const country: Country = _.find(selectedCountries, { name })
                const isCorrect = country && found.includes(_.toUpper(country.iso2))
                const isLastCorrect = lastCorrect && country && lastCorrect.iso2 === country.iso2
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: isLastCorrect ? '#cccc00' : isCorrect ? '#2ecc71' : '#EEE',
                        stroke: '#FFF',
                        strokeWidth: 0.5,
                        outline: 'none'
                      },
                      hover: {
                        fill: isCorrect ? '#27ae60' : '#DDD',
                        outline: 'none'
                      }
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
