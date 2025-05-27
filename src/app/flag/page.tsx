'use client'

import _ from 'lodash'
import type { Country } from '@/types/geography'
import countries from '@/data/countries.json'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

export default function FlagPage() {
  const searchParams = useSearchParams()

  const [regions, setRegions] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, boolean>>({})
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const newRegions = searchParams?.getAll('region') || []
    console.log(111, newRegions)
    setRegions(newRegions)
  }, [])

  useEffect(() => {
    let newCountries: Country[] = countries.filter((country) =>
      country.regions.some((r) => regions.includes(r))
    )
    newCountries = _.shuffle(newCountries)
    setSelectedCountries(newCountries)
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
      if (_.isEmpty(userAnswer)) {
        return
      }
      const isCorrect = userAnswer === correctAnswer

      setResults((prev) => ({ ...prev, [country.iso2]: isCorrect }))

      if (isCorrect) {
        // Focus next input (if exists)
        const next = selectedCountries[index + 1]
        if (next) {
          inputRefs.current[next.iso2]?.focus()
          playAudio(`/assets/mp3/${country.iso2}.mp3`)
        }
      } else {
        inputRefs.current[country.iso2]?.select()
        playAudio('/assets/mp3/error.mp3')
      }
    }
  }

  // Add above component
  const playAudio = (filePath: string) => {
    const audio = new Audio(filePath)
    audio.play().catch((err) => {
      console.warn('Audio play failed:', err)
    })
  }

  return (
    <div className="flex flex-wrap gap-4 m-10">
      {selectedCountries.map((country, index) => {
        const iso2 = country.iso2
        const isCorrect = results[iso2]

        return (
          <Card
            key={`country-${country.name}`}
            className={`w-40 flex flex-col items-center p-4 gap-2 ${
              isCorrect ? 'border-green-500' : results[iso2] === false ? 'border-red-500' : ''
            }`}
          >
            <Image
              src={`/assets/flags/svg/${iso2}.svg`}
              alt={`${country.name} flag`}
              width={120}
              height={120}
              className="object-contain object-center w-30 h-22"
            />
            {isCorrect ? (
              <div className="flex items-center h-9 text-center font-semibold text-green-700">
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
        )
      })}
    </div>
  )
}
