<template lang='pug'>
.invisible
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class HzPlayer extends Vue {
  @Prop({ default:  440 }) public frequency!: number
  @Prop({ default:  1 }) public gain!: number

  private audioCtx = new AudioContext()
  private oscillatorNode?: OscillatorNode
  private gainNode?: GainNode

  public mounted () {
    const { audioCtx } = this
    const oscillatorNode = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillatorNode.type = 'sine'
    oscillatorNode.frequency.setValueAtTime(this.frequency, audioCtx.currentTime)
    oscillatorNode.connect(gainNode)
    gainNode.gain.setValueAtTime(this.gain, audioCtx.currentTime)
    gainNode.connect(audioCtx.destination)

    oscillatorNode.start()
    this.oscillatorNode = oscillatorNode
    this.gainNode = gainNode
  }

  public beforeDestroy () {
    if (this.oscillatorNode) {
      this.oscillatorNode.stop()
      this.oscillatorNode.disconnect()
      this.gainNode!.disconnect()
      this.oscillatorNode = undefined
      this.gainNode = undefined
    }
  }

  @Watch('frequency')
  private onFreqChange (val: number) {
    if (!this.oscillatorNode) return
    this.oscillatorNode.frequency.setValueAtTime(val, this.audioCtx.currentTime)
  }

  @Watch('gain')
  private onGainChange (val: number) {
    if (!this.gainNode) return
    this.gainNode.gain.setValueAtTime(val, this.audioCtx.currentTime)
  }
}
</script>

<style scoped>
.invisible {
  display: none;
}
</style>