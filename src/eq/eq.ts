export type GraphicEQ = Map<number, number>

export function parseGraphicEQ (str: string): GraphicEQ | null {
  // Example string: GraphicEQ: 20 0; 22 5.6; 23 5.2; 25 4.6; 26 4.3; 28 3.7; 30 3.1; 32 2.7; 35 2; 37 1.7
  if (!str.startsWith('GraphicEQ:')) return null
  str = str.substr('GraphicEQ:'.length)

  const splits = str.split(';').map((x) => x.trim())
  const eq = new Map<number, number>()
  const eqRegex = /(\d+(.\d*)?) +(-?\d+(.\d*)?)/

  for (const split of splits) {
    const matches = split.match(eqRegex)
    if (!matches) continue
    const freq = Number(matches[1])
    const db = Number(matches[3])
    eq.set(freq, db)
  }
  return eq
}

function getGainFromDecibel (decibel: number) {
  const gainRatio = Math.pow(10, decibel / 20)
  return gainRatio * .5
}

export function getEqDecibelForFrequency (eq: GraphicEQ, freq: number): number {
  if (eq.size === 0) return 0

  const frequencies = Array.from(eq.keys())
  frequencies.sort((a, b) => a - b)

  // Search interval for linear interpolation
  const rightIndex = frequencies.findIndex((v) => v >= freq)
  if (rightIndex === -1) {
    // All eq pivot frequency is lower than {freq}
    return eq.get(frequencies[frequencies.length - 1])!
  }
  if (rightIndex === 0) {
    // All eq pivot frequency is higher than {freq}
    return eq.get(frequencies[0])!
  }

  const leftIndex = rightIndex - 1
  const leftDecibel = eq.get(frequencies[leftIndex])!
  const rightDecibel = eq.get(frequencies[rightIndex])!
  const leftFreqLog = Math.log(frequencies[leftIndex])
  const rightFreqLog = Math.log(frequencies[rightIndex])
  const thisFreqLog = Math.log(freq)

  return (
    (rightDecibel * (thisFreqLog - leftFreqLog) + leftDecibel * (rightFreqLog - thisFreqLog))
    / (rightFreqLog - leftFreqLog)
  )
}

export function getEqGainForFrequency (eq: GraphicEQ, freq: number) {
  return getGainFromDecibel(getEqDecibelForFrequency(eq, freq))
}
