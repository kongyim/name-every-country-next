export type Country = {
  name: string
  regions: string[]
  iso2: string
  iso3: string
  latitude: number
  longitude: number
  zoom?: number | undefined
  speak?: string
  mapId?: string[]
  capital: {
    name: string
    latitude: number
    longitude: number
  }
}
