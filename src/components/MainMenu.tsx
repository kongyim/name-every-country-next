'use client'

import type { Country } from '@/types/geography'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

type Game = {
  id: string
  url: string
  label: string
}

const games: Game[] = [
  { id: 'location', label: 'Name Every Country By Location', url: '/map' },
  { id: 'flag', label: 'Name Every Country By Flag', url: '/flag' },
  { id: 'iso2', label: 'Name Every Country iso2 By Flag', url: '/flag' },
  { id: 'iso3', label: 'Name Every Country iso3 By Flag', url: '/flag' },
  { id: 'capital', label: 'Name Every Capital City By Flag', url: '/flag' },
  { id: 'capitalLocation', label: 'Name Every Capital City By Location', url: '/map' }
]

export default function MainMenuClient({
  countries,
  regions
}: {
  countries: Country[]
  regions: string[]
}) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) => {
      const value = prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
      localStorage.setItem('selectedRegions', JSON.stringify(value))
      return value
    })
  }

  const getCountriesByRegion = (region: string) => {
    return countries.filter((country) => country.regions.includes(region))
  }

  const getSelectedCountries = () => {
    return countries.filter((country) => country.regions.some((r) => selectedRegions.includes(r)))
  }

  const router = useRouter()

  const handleGameClick = (url: string) => {
    const searchParams = new URLSearchParams()
    selectedRegions.forEach((region) => {
      searchParams.append('region', region)
    })

    router.push(`${url}?${searchParams.toString()}`)
  }

  useEffect(() => {
    const saved = localStorage.getItem('selectedRegions')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.every((r) => typeof r === 'string')) {
          setSelectedRegions(parsed)
        }
      } catch {
        setSelectedRegions(regions)
      }
    }
  }, [regions])

  const updateSelectedRegion = (value: string[]) => {
    localStorage.setItem('selectedRegions', JSON.stringify(value))
    setSelectedRegions(value)
  }

  return (
    <div className="flex flex-col items-center">
      {/* Games */}
      <div className="flex w-full max-w-xl mx-auto justify-center my-10 flex-col gap-4">
        {games.map((game) => (
          <Button
            key={`button-${game.id}`}
            disabled={getSelectedCountries().length === 0}
            onClick={() => handleGameClick(game.url)}
            className="text-white bg-gray-400 py-10 text-xl"
          >
            {game.label}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex justify-center text-lg font-medium">
        Total countries selected: {getSelectedCountries().length} / {countries.length}
      </div>
      {/* Regions */}
      <div className="flex item-center justify-center my-4 flex-col gap-4">
        {regions.map((region) => (
          <div key={`checkbox-${region}`} className="flex items-center">
            <Checkbox
              id={region}
              checked={selectedRegions.includes(region)}
              onCheckedChange={() => toggleRegion(region)}
            />
            <label htmlFor={region} className="ml-4 font-medium">
              {region} ({getCountriesByRegion(region).length})
            </label>
          </div>
        ))}
      </div>
      <div className="flex gap-10 mb-50">
        <Button onClick={() => updateSelectedRegion(regions)}>Select All</Button>
        <Button onClick={() => updateSelectedRegion([])}>Clear All</Button>
      </div>
    </div>
  )
}
