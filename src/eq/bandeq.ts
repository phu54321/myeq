export function generateBandEqFrequencies (bandNum: number): number[] {
  if (bandNum === 1) return [1000]

  const ret = []
  for (let i = 0 ; i < bandNum ; i++) {
    ret.push(Math.floor(20 * Math.pow(1000, i / (bandNum - 1)) + .5))
  }
  return ret
}
