export const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/gi, '')

export const playAudio = (filePath: string) => {
  const audio = new Audio(filePath)
  audio.play().catch((err) => console.warn('Audio failed:', err))
}
