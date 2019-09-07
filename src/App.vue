<template lang='pug'>
#app
  HzPlayer(:frequency='frequency', :gain='currentGain', :pan='1')

  ul.usage
    li ←/→ : Lower/Raise decibel by .1db
    li ↑/↓ : Go 1 band up/down
    li S : Double band count
    li [Space] : Select random band
    li L: Set lower audible frequency limit
    li H: Set higher audible frequency limit
  // HzPlayer(:frequency='baseFrequency', :gain='baseGain', :pan='0')
  table.freqTable
    tr
      th Frequency
      th Decibel
    tr(
      v-for='([freq, db], index) of currentEqPrintable'
      :class='{nonAudible: index < currentLowerFreqIndex || index > currentHigherFreqIndex, selected: index == currentBandIndex}'
    )
      td {{freq}}Hz
      td {{db}}Db

  p
    | EqualizerAPO string:
    input(v-model='eqString')
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import HzPlayer from './components/HzPlayer.vue'
import { getEqGainForFrequency, GraphicEQ, getEqDecibelForFrequency, parseGraphicEQ } from './eq/eq'
import { generateBandEqFrequencies } from './eq/bandeq'

function expandBands (eq: GraphicEQ, bandn: number) {
  const freqs = generateBandEqFrequencies(bandn)
  for (const f of freqs) {
    eq.set(f, roundTo01(getEqDecibelForFrequency(eq, f)))
  }
}

function roundTo01 (n: number): number {
  n = Math.floor(n * 10 + .5) / 10
  if (n > 20) return 20
  if (n < -20) return -20
  return n
}


@Component({
  components: {
    HzPlayer
  }
})
export default class App extends Vue {
  private eq = new Map<number, number>()

  private recomputeCounter = 0
  private currentBandNum = 5
  private currentBandIndex = 2
  private currentLowerFreqIndex = 0
  private currentHigherFreqIndex = this.currentBandNum - 1

  get frequency () {
    // tslint:disable-next-line:no-unused-expression
    this.recomputeCounter
    return generateBandEqFrequencies(this.currentBandNum)[this.currentBandIndex]
  }

  get currentGain () {
    // tslint:disable-next-line:no-unused-expression
    this.recomputeCounter
    return getEqGainForFrequency(this.eq, this.frequency)
  }

  get currentEqPrintable () {
    // tslint:disable-next-line:no-unused-expression
    this.recomputeCounter

    const ret: Array<[number, string]> = []
    for (const f of this.eq.keys()) {
      const db = this.eq.get(f)!
      ret.push([Math.floor(f), db.toFixed(1)])
    }
    ret.sort((a, b) => (a[0] - b[0]))
    return ret
  }

  get eqString () {
    // GraphicEQ: 20 0; 22 5.6; 23 5.2; 25 4.6; 26 4.3; 28 3.7; 30 3.1; 32 2.7; 35 2; 37 1.7
    return 'GraphicEQ: ' + this.currentEqPrintable.map(([freq, db]) => `${freq} ${db}`).join('; ')
  }

  set eqString (s: string) {
    const newEq = parseGraphicEQ(s)
    if (newEq) {
      const newBandNum = newEq.size
      this.eq.clear()
      for (const freq of generateBandEqFrequencies(newBandNum)) {
        this.eq.set(freq, getEqDecibelForFrequency(newEq, freq))
      }
      this.currentBandNum = newBandNum
      this.currentBandIndex = Math.floor(newBandNum / 2)
      this.currentLowerFreqIndex = 0
      this.currentHigherFreqIndex = newBandNum - 1
      this.recomputeCounter++
    }
  }

  // Lifecycles
  public created () {
    window.addEventListener('keydown', this.onKey)
  }

  public beforeDestroy () {
    window.removeEventListener('keydown', this.onKey)
  }

  public mounted () {
    expandBands(this.eq, this.currentBandNum)
    this.recomputeCounter++
  }

  // EQ
  public onKey (event: KeyboardEvent) {
    const keyUp = 38
    const keyDown = 40
    const keyLeft = 37
    const keyRight = 39
    const keySpace = 32
    const keyS = 83
    const keyL = 76
    const keyH = 72

    const { eq, frequency } = this
    const currentDecibel = getEqDecibelForFrequency(eq, frequency)
    switch (event.keyCode) {
      case keyRight:
        eq.set(frequency, roundTo01(currentDecibel + .1))
        this.recomputeCounter++
        break

      case keyLeft:
        eq.set(frequency, roundTo01(currentDecibel - .1))
        this.recomputeCounter++
        break

      case keyUp:
        this.currentBandIndex = Math.max(0, this.currentBandIndex - 1)
        this.recomputeCounter++
        break

      case keyDown:
        this.currentBandIndex = Math.min(this.currentBandNum - 1, this.currentBandIndex + 1)
        this.recomputeCounter++
        break

      case keySpace:
        this.currentBandIndex = (
          Math.floor(Math.random() * (this.currentHigherFreqIndex - this.currentLowerFreqIndex + 1))
          + this.currentLowerFreqIndex
        )
        this.recomputeCounter++
        break

      case keyS:
        const newBandN = (this.currentBandNum - 1) * 2 + 1
        expandBands(eq, newBandN)
        this.currentBandNum = newBandN
        this.currentBandIndex *= 2
        this.currentLowerFreqIndex *= 2
        this.currentHigherFreqIndex *= 2
        this.recomputeCounter++
        break

      case keyL:
        this.currentLowerFreqIndex = this.currentBandIndex
        break

      case keyH:
        this.currentHigherFreqIndex = this.currentBandIndex
        break
    }

  }
}
</script>
<style lang="stylus">
#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  color #2c3e50
  margin .5em

.freqTable
  border-collapse: collapse
  td, th
    border 1px solid black
    padding .5em

  tr.nonAudible {
    td {
      background-color: #ccc
    }
  }

  tr.selected {
    font-weight bold
    color #f00
  }
</style>
