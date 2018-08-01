<template>
  <div class="hello">
    <h4 @click="show = !show">Districts</h4>
    <div class="districts" v-if="show">
      <div class="card" :class="getClass(card)" v-for="(card, i) of player.Districts" :key="i">
        {{card.Name}}<br/>{{card.Value}}
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'GameDistricts',
    props: {
      player: Object
    },
    data() {
      return {
        show: false
      }
    }
  }
</script>

<style scoped>

</style>
