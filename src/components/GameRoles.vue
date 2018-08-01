<template>
  <div class="hello">
    <h2>choose roles</h2>
    <span v-if="!you.Roles">
      Waiting for other player to choose role
    </span>
    <div class="choose">
      <div class="card character" :class="{chosen: role.Chosen}" v-for="(role, i) of you.Roles" :key="i" @click="$emit('send', {Type: 'choose', Data: i})">
        {{role.Name}}
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'GameRoles',
    props: {
      game: Object,
      you: Object
    },
    data() {
      return {
        flavor: {
          'Assassin': 'Causes a player to miss a turn',
          'Thief': 'Takes a coin from a player',
          'Magician': 'Exchanges hands or redraws 2',
          'King': 'Gets the crown, taxes yellow districts',
          'Bishop': 'Immune to Warlord, taxes blue districts',
          'Merchant': 'Gets additional coin, taxes green districts',
          'Architect': 'Draws 2 extra districts, can build 3 times',
          'Warlord': 'Pays to destroy districts, taxes red districts',
        }
      }
    }
  }
</script>

<style scoped>
  .character {
    background: darkblue;
  }
  .chosen {
    background: #adadad;
  }
  .choose {
    display: flex;
  }
</style>
