<template>
  <div class="home">
    <a :href="'http://192.168.1.2:8080/#/' + game.Id" target="_blank">OPEN</a>
    Game: {{game}}
    <p></p>
    You: {{you}}

    <div v-if="game.State === states.lobby">
      <GameLobby :game="game" @send="send"/>
    </div>
    <div v-if="you.Turn === true">
      <div v-if="game.State === states.roles">
        <GameRoles :game="game" :you="you" @send="send"/>
      </div>
      <div v-else-if="game.State === states.goldOrDraw">
        <h3>Beginning of Turn</h3>
        <p>Choose to receive 2 gold <b>or</b> draw 2 districts (and put one back)</p>
        <button @click="send({Type: 'action', Data: 0})">2 Gold</button>
        <button @click="send({Type: 'action', Data: 1})">Draw Districts</button>
      </div>
      <div v-else-if="game.State === states.putCardBack">
        <h3>Put Card Back</h3>
        <p>Choose a district from your hand that you just drew to put back</p>
      </div>
      <div v-else-if="game.State === states.build">
        <h3>Build</h3>
        <p>Select a district to build or press done</p>
        <button @click="send({Type: 'build', Data: -1})">Done building</button>
      </div>
      <div v-else-if="game.State === states.turnEnd">
        <h3>End Turn</h3>
        <p>Use your remaining character abilities or press end turn</p>
        <button @click="send({Type: 'end'})">End Turn</button>
      </div>

      <div v-if="you.Character">
        <h3>{{you.Character.Name}}</h3>
        <div v-if="you.Character.Name === 'Assassin'">
          <p>Choose a character to assassinate</p>
          <div class="choose">
            <div class="card character" v-for="(role, i) of characters" :key="i"
                 @click="send({Type: 'special', Data: i})">
              {{role.Name}}
            </div>
          </div>
        </div>
        <div v-else-if="you.Character.Name === 'Thief'">
          <p>Choose a character to steal all of their gold</p>
          <div class="choose">
            <div class="card character" v-for="(role, i) of characters" :key="i"
                 @click="send({Type: 'special', Data: i})">
              {{role.Name}}
            </div>
          </div>
        </div>
        <div v-else-if="you.Character.Name === 'Magician'">
          <p>Choose to switch hands with another player OR redraw any number of cards</p>
          <div class="choose">
            <div class="card character" v-for="(role, i) of characters" :key="i"
                 @click="send({Type: 'special', Data: {Swap: i}})">
              {{role.Name}}
            </div>
          </div>
          <button @click="send({Type: 'special', Data: selected})">Redraw selected cards</button>
        </div>
        <div v-else-if="you.Character.Name === 'King'">
          <p>You will go first next round</p>
        </div>
        <div v-else-if="you.Character.Name === 'Bishop'">
          <p>You are immune to the warlord</p>
        </div>
        <div v-else-if="you.Character.Name === 'Merchant'">
          <p>You got 2 extra gold this turn</p>
        </div>
        <div v-else-if="you.Character.Name === 'Architect'">
          <p>You drew 2 extra districts and can build 3 districts</p>
        </div>
        <div v-else-if="you.Character.Name === 'Warlord'">
          <p>Choose a district to destroy</p>
        </div>

        <div v-if="you.Character.CanTax < 5">
          <h3>Tax
            <span v-if="you.Character.CanTax === 1">Green</span>
            <span v-if="you.Character.CanTax === 2">Blue</span>
            <span v-if="you.Character.CanTax === 3">Red</span>
            <span v-if="you.Character.CanTax === 4">Yellow</span>
            Districts</h3>
          You may tax your districts once during your turn.
          <button @click="send({Type: 'special', Data: 1})">Tax Districts</button>
        </div>
      </div>
    </div>
    <div v-if="game.State === states.end"></div>

    <h2>districts</h2>
    <div v-for="p of game.Players" :key="p.Id">
      <span v-if="p.Name">{{p.Name}}</span><span v-else>Player {{p.Id}}</span>
      <span class="badge" v-if="!p.IsBot && !p.Connected">☠</span>
      <span class="badge" v-if="p.HasCrown">👑</span>
      {{p.Gold}} 💰
      <GameDistricts :player="p"/>
    </div>

    <h2>hand</h2>
    <div class="districts">
      <div class="card" :class="getClass(card, i)" v-for="(card, i) of you.Hand" :key="i" @click="handCardClick(i)">
        {{card.Name}}<br/>{{card.Value}}
      </div>
    </div>
    <div v-if="game.State === states.putCardBack">
      <button @click="send({Type: 'action', Data: selected})">Put card back</button>
    </div>
    <div v-if="game.State === states.build">
      <button @click="send({Type: 'build', Data: selected})">Build selected</button>
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
  import GameDistricts from "../components/GameDistricts";

  export default {
    name: 'home',
    components: {
      GameDistricts,
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
          turnEnd: 5,
          end: 5
        },

        ws: null,
        game: {Id: '', Players: {}, InGame: false, Version: 0, State: -1},
        you: {},
        characters: [],
        msgs: [],
        revealed: false,
        revealTimeout: null,
        connected: false,
        initial: true,
        redraw: false,
        selected: [],

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
          case "info":
            this.characters = data.Characters;
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
        this.selected = [];
      },
      getClass: function (card, i) {
        const cls = {}
        switch (card.Color) {
          case 0:
            cls.green = 1;
            break;
          case 1:
            cls.blue = 1;
            break;
          case 2:
            cls.red = 1;
            break;
          case 3:
            cls.yellow = 1;
            break;
          case 4:
            cls.purple = 1;
            break;
          default:
            console.error("Weird color:", card.Color)
        }
        if (this.selected.indexOf(i) > -1) {
          cls.selected = 1;
        }
        return cls
      },
      handCardClick: function (location) {
        const index = this.selected.indexOf(location);
        if (index >= 0) {
          this.selected.splice(index, 1);
        } else {
          this.selected.push(location);
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

  .districts {
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

  .selected {
    border: 5px solid red;
  }

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
