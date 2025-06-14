export type Country = {
  name: string
  regions: string[]
  iso2: string
  iso3: string
  latitude: number
  longitude: number
  zoom: number | undefined
  capital: {
    name: string
    latitude: number
    longitude: number
  }
}
