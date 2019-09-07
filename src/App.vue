<template lang='pug'>
#app
  HzPlayer(:frequency='frequency', :gain='currentGain')
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import HzPlayer from './components/HzPlayer.vue'
import { getEqGainForFrequency } from './eq/eq'

@Component({
  components: {
    HzPlayer
  }
})
export default class App extends Vue {
  private frequency = 440
  private gain = .5
  private eq = new Map<number, number>()

  get currentGain () {
    return getEqGainForFrequency(this.eq, this.frequency)
  }
}

</script>
<style lang="stylus">
#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  text-align center
  color #2c3e50
  margin-top 60px
</style>
