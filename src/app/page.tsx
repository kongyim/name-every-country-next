import MainMenu from '@/components/MainMenu'
import countries from '@/data/countries.json'

export default function Home() {
  const regions = Array.from(new Set(countries.flatMap((country) => country.regions))).sort()
  return <MainMenu countries={countries} regions={regions} />
}
