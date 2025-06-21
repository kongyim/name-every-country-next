'use client'

import { ComposableMap, ZoomableGroup, Geographies, Geography, Marker } from 'react-simple-maps'
import type { Feature } from 'geojson'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import _ from 'lodash'

import { Input } from '@/components/ui/input'
import { GameTopBar } from '@/components/GameTopBar'
import { GameSummary } from '@/components/GameSummary'

import { useGameState } from '@/hooks/useGameState'
import { playAudio, normalize } from '@/utils/gameUtils'
import type { Country } from '@/types/geography'
import countries from '@/data/countries.json'

const geoUrl = '/data/countries-50m.json'

export default function MapGameClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [regions, setRegions] = useState<string[]>([])
  const selectedCountries = useGameState(regions)

  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20])
  const [mapZoom, setMapZoom] = useState<number>(1)
  const [found, setFound] = useState<string[]>([])

  const [startTime, setStartTime] = useState<number>(Date.now())
  const [endTime, setEndTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const [showAnswers, setShowAnswers] = useState<boolean>(false)
  const [congratulate, setCongratulate] = useState<boolean>(false)
  const [showError, setShowError] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')
  const [lastCorrect, setLastCorrect] = useState<Country | null>(null)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const animationRef = useRef<number | null>(null)

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
    setFound([])
    setShowAnswers(false)
    setCongratulate(false)
    setShowError(false)
  }, [selectedCountries])

  const animatePanZoom = (
    fromCenter: [number, number],
    toCenter: [number, number],
    fromZoom: number,
    toZoom: number,
    duration = 400
  ) => {
    const start = performance.now()

    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1)
      const interpolate = (start: number, end: number) => start + (end - start) * progress

      setMapCenter([
        interpolate(fromCenter[0], toCenter[0]),
        interpolate(fromCenter[1], toCenter[1])
      ])
      setMapZoom(interpolate(fromZoom, toZoom))

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step)
      }
    }

    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(step)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== 'Tab') return

    e.preventDefault()
    const normalizedInput = normalize(inputValue)
    const matched = selectedCountries.find((country) => normalize(country.name) === normalizedInput)

    if (matched) {
      if (_.isNumber(matched.latitude) && _.isNumber(matched.longitude)) {
        animatePanZoom(mapCenter, [matched.longitude, matched.latitude], mapZoom, matched.zoom || 6)
      }

      if (!found.includes(matched.iso2)) {
        setFound((prev) => [...prev, matched.iso2])
      }

      playAudio(`/assets/country-mp3/${matched.iso2}.mp3`)
      setInputValue('')
      setLastCorrect(matched)

      const allCorrect = selectedCountries.every(
        (c) => found.includes(c.iso2) || c.iso2 === matched.iso2
      )

      if (allCorrect) {
        setCongratulate(true)
        setEndTime(Date.now()) // ⏱ Stop timer
        const applause = new Audio('/assets/mp3/applause.mp3')
        applause.play().catch((err) => console.warn('Applause failed:', err))
      }
    } else {
      playAudio('/assets/mp3/error.mp3')
      setShowError(true)
      setLastCorrect(null)
      inputRef.current?.focus()
      inputRef.current?.select()
      setTimeout(() => setShowError(false), 2000)
    }
  }

  const handleBack = () => {
    playAudio('/assets/mp3/back.mp3')
    if (confirm('Are you sure you want to go back? Progress will be lost.')) {
      router.back()
    }
  }

  const handleGiveUp = () => {
    playAudio('/assets/mp3/giveup.mp3')
    setShowAnswers(true)
  }

  const handleTryAgain = () => {
    playAudio('/assets/mp3/retry.mp3')
    setEndTime(null)
    setRegions([...regions])
  }

  const onClickGeography = (country: Country) => {
    console.log(country)
  }

  const correctCount = found.length
  const totalCount = selectedCountries.length

  return (
    <div className="relative w-full h-screen bg-white">
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

      <div className="flex justify-center absolute top-20 w-full z-40">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-96 text-center bg-white ${showError ? 'border-red-500 ring-2 ring-red-300' : ''}`}
        />
      </div>

      <AnimatePresence>
        {lastCorrect && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-32 left-1/2 transform -translate-x-1/2 z-40 bg-green-100 border border-green-300 px-6 py-3 rounded shadow flex items-center gap-4"
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
        <div className="fixed top-44 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 text-red-700 border border-red-300 px-6 py-3 rounded shadow">
          ❌ Incorrect! Please try again.
        </div>
      )}

      {congratulate && (
        <GameSummary elapsedTime={elapsedTime} onTryAgain={handleTryAgain} onExit={handleBack} />
      )}

      <ComposableMap
        projection="geoEqualEarth"
        width={980}
        height={420}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          center={mapCenter}
          zoom={mapZoom}
          onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => {
            setMapCenter(coordinates)
            setMapZoom(zoom)
          }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: Feature[] }) =>
              geographies.map((geo, index) => {
                const id = geo.id
                const country = _.find(countries, (c) => _.includes(c.mapIds, id)) as
                  | Country
                  | undefined

                if (!country) {
                  return (
                    <Geography
                      onClick={() => onClickGeography(country)}
                      key={`geoNotFind-${geo.id}-${index}`}
                      geography={geo}
                      style={{
                        default: {
                          fill: '#000',
                          stroke: '#FFF',
                          strokeWidth: 0.2,
                          outline: 'none'
                        },
                        hover: { fill: '#222', outline: 'none' }
                      }}
                    />
                  )
                }

                const isInGame = selectedCountries.find((item) => item.iso2 === country.iso2)
                const isCorrect = found.includes(_.toUpper(country.iso2))
                const isLastCorrect = lastCorrect?.iso2 === country.iso2

                return (
                  <Geography
                    onClick={() => onClickGeography(country)}
                    key={`geoFind-${country.iso2}-${index}`}
                    geography={geo}
                    style={{
                      default: {
                        fill: isInGame
                          ? isLastCorrect
                            ? '#cccc00'
                            : isCorrect
                              ? '#2ecc71'
                              : '#aaa'
                          : '#000000',
                        stroke: '#FFF',
                        strokeWidth: 0.2,
                        outline: 'none'
                      },
                      hover: { fill: isCorrect ? '#27ae60' : '#DDD', outline: 'none' }
                    }}
                  />
                )
              })
            }
          </Geographies>

          {countries
            .filter((c) => _.isEmpty(c.mapIds))
            .map((c) => {
              const isCorrect = found.includes(_.toUpper(c.iso2))
              const isLastCorrect = lastCorrect?.iso2 === c.iso2
              return (
                <Marker
                  key={c.name}
                  coordinates={[c.longitude, c.latitude]}
                  onClick={() => onClickGeography(c)}
                >
                  <circle
                    r={1}
                    fill={isLastCorrect ? '#cccc00' : isCorrect ? '#2ecc71' : '#aaa'}
                    stroke="#fff"
                    strokeWidth={0.1}
                  />
                  <title>{c.name}</title>
                </Marker>
              )
            })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
