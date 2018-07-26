<template>
  <div class="hello">
    <h2>lobby</h2>

    <button @click="$emit('send', {Type: 'start'})">start game</button>

    <p>Game ID: {{game.Id}}</p>

    <div class="flex">
      <input class="flex-1" type="text" maxlength="8" v-model="name" placeholder="enter name">
      <button @click="$emit('send', {Type: 'name', Data: name})">rename</button>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'GameLobby',
    props: {
      game: Object
    },
    data() {
      return {
        name: ''
      }
    }
  }
</script>

<style scoped>

</style>
