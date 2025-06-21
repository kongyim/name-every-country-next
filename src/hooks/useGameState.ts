import { useEffect, useState } from 'react'
import countries from '@/data/countries.json'
import _ from 'lodash'
import type { Country } from '@/types/geography'

export function useGameState(regions: string[]) {
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([])

  useEffect(() => {
    const filtered = countries.filter((c) => c.regions.some((r) => regions.includes(r)))
    setSelectedCountries(_.shuffle(filtered))
  }, [regions])

  return selectedCountries
}
