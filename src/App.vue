<template lang='pug'>
#app
  HzPlayer(:frequency='frequency', :gain='currentGain', :pan='1')
  // HzPlayer(:frequency='baseFrequency', :gain='baseGain', :pan='0')
  table.freqTable
    tr
      th Frequency
      th Decibel
    tr(v-for='[freq, db] of currentEqPrintable')
      td {{freq}}Hz
      td {{db}}Db
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import HzPlayer from './components/HzPlayer.vue'
import { getEqGainForFrequency, GraphicEQ, getEqDecibelForFrequency } from './eq/eq'
import { generateBandEqFrequencies } from './eq/bandeq'

function expandBands (eq: GraphicEQ, bandn: number) {
  const freqs = generateBandEqFrequencies(bandn)
  for (const f of freqs) {
    eq.set(f, getEqDecibelForFrequency(eq, f))
  }
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

    const { eq, frequency } = this
    const currentDecibel = getEqDecibelForFrequency(eq, frequency)
    switch (event.keyCode) {
      case keyUp:
        eq.set(frequency, currentDecibel + .1)
        this.recomputeCounter++
        break

      case keyDown:
        eq.set(frequency, currentDecibel - .1)
        this.recomputeCounter++
        break

      case keyLeft:
        this.currentBandIndex = Math.max(0, this.currentBandIndex - 1)
        this.recomputeCounter++
        break

      case keyRight:
        this.currentBandIndex = Math.min(this.currentBandNum - 1, this.currentBandIndex + 1)
        this.recomputeCounter++
        break

      case keySpace:
        this.currentBandIndex = Math.floor(Math.random() * this.currentBandNum)
        this.recomputeCounter++
        break

      case keyS:
        const newBandN = (this.currentBandNum - 1) * 2 + 1
        expandBands(eq, newBandN)
        this.currentBandNum = newBandN
        this.currentBandIndex = this.currentBandIndex * 2
        this.recomputeCounter++
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
</style>
