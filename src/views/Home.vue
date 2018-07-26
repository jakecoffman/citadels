<template>
  <div class="home">
    <h2>players</h2>
    <ul v-for="p of game.Players" :key="p.Id">
      <li>
        <span v-if="p.Name">{{p.Name}}</span><span v-else>Player {{p.Id}}</span>
        <span class="badge" v-if="!p.IsBot && !p.Connected">☠</span>
        <span class="badge" v-if="p.HasCrown">👑</span>
        {{p.Gold}} 💰
      </li>
    </ul>

    Game: {{game}}
    <p></p>
    You: {{you}}

    <div v-if="game.State === states.lobby">
      <GameLobby :game="game" @send="send"/>
    </div>
    <div v-else-if="game.State === states.roles">
      <GameRoles :game="game" :you="you" @send="send"/>
    </div>
    <div v-else-if="game.State === states.goldOrDraw"></div>
    <div v-else-if="game.State === states.putCardBack"></div>
    <div v-else-if="game.State === states.build"></div>
    <div v-else-if="game.State === states.end"></div>
    <div v-else></div>

    <h2>districts</h2>

    <h2>hand</h2>
    <div id="hand">
      <div class="card" :class="getClass(card)" v-for="(card, i) of you.Hand" :key="i">
        {{card.Name}}<br/>{{card.Value}}
      </div>
    </div>

    <div class="flex">
      <input class="flex-1" type="number" maxlength="8" v-model="joinGame" placeholder="join game">
      <button @click="send({Type: 'join', Data: joinGame})">join</button>
    </div>

    <button @click="send({Type: 'join', Data: ''})">leave game</button>

    <div id="connection" v-if="!initial && !connected">
      You have been disconnected. Refresh to reconnect.
    </div>

    <div id="msgs" v-if="msgs.length > 0" @click="msgs = []">
      <p v-for="(m, i) in msgs" :key="i">{{m}}</p>
    </div>
  </div>
</template>

<script>
import GameLobby from "../components/GameLobby";
import GameRoles from "../components/GameRoles";

export default {
  name: 'home',
  components: {
    GameRoles,
    GameLobby
  },
  data() {
    return {
      states: {
        lobby: 0,
        roles: 1,
        goldOrDraw: 2,
        putCardBack: 3,
        build: 4,
        end: 5
      },

      ws: null,
      game: {Id: '', Players: {}, InGame: false, Version: 0, State: -1},
      you: {},
      msgs: [],
      revealed: false,
      revealTimeout: null,
      connected: false,
      initial: true,

      joinGame: ''
    }
  },
  created: function () {
    let url;
    if (location.protocol === 'https:') {
      url = 'wss://';
    } else {
      url = 'ws://';
    }
    url += location.host + location.pathname + (location.pathname.endsWith('/') ? 'ws' : '/ws');

    this.ws = new WebSocket(url);
    this.ws.onopen = this.onopen;
    this.ws.onmessage = this.onmessage;
    this.ws.onerror = this.onerror;
    this.ws.onclose = this.onclose;
  },
  methods: {
    onopen: function () {
      this.connected = true;
      this.initial = false;
      if (this.$route.params.id) {
        this.ws.send(JSON.stringify({Type: "join", Data: this.$route.params.id}));
      } else {
        this.ws.send(JSON.stringify({Type: "join", Data: ''}));
      }
    },
    onerror: function (e) {
      console.log('error', e);
    },
    onclose: function (e) {
      this.connected = false;
    },
    onmessage: function (e) {
      const data = JSON.parse(e.data);
      switch (data.Type) {
        case "msg":
          this.msgs.push(data.Msg);
          break;
        case "all":
          location.hash = data.Update.Id;
          this.game = data.Update;
          this.you = data.You;
          break;
        case "cookie":
          document.cookie = data.Cookie;
          break;
        default:
          console.log("I don't even", data);
      }
    },
    send: function (msg) {
      msg.Version = this.game.Version;
      this.ws.send(JSON.stringify(msg));
    },
    getClass: function(card) {
      switch (card.Color) {
        case 0:
          return {green: 1}
        case 1:
          return {blue: 1}
        case 2:
          return {red: 1}
        case 3:
          return {yellow: 1}
        case 4:
          return {purple: 1}
        default:
          console.error("Weird color:", card.Color)
      }
    }
  }
}
</script>

<style lang="scss">
  $text: #cacaca;
  $outline: #787878;
  $info: #334;
  $accent: #223c21;
  $accent-light: #4f8a4c;

  #players {
    display: flex;
    align-items: center;
    justify-content: space-around;
    flex-direction: row;
    flex-wrap: wrap;
    font-size: 14px;
  }

  .player {
    color: white;
    background: #5d595a;
    border: 1px solid white;
    border-radius: 50%;
    padding: 5px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100px;
    min-height: 100px;
  }

  #msgs {
    position: fixed;
    right: 10px;
    bottom: 10px;
    background: $info;
    color: $text;
    padding: 10px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    border-radius: 6px;
  }

  #connection {
    border-radius: 6px;
    display: block;
    position: fixed;
    bottom: 10px;
    left: 10px;
    right: 10px;
    background: #ff342e;
    color: $text;
    padding: 10px 40px 10px 20px;
    z-index: 1000;
  }

  .red {
    background: red;
  }
  .green {
    background: green;
  }
  .blue {
    background: blue;
  }
  .purple {
    background: purple;
  }
  .yellow {
    background: #a8a800;
  }

  #hand {
    display: flex;
  }

  .card {
    color: white;
    text-align: center;
    padding-top: 30px;
    border: 1px solid black;
    border-radius: 5px;
    margin: 16px;
    height: 60px;
    width: 100px;
  }
</style>
