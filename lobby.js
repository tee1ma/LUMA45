const WebSocket = require("ws");
const GAME = require("./game");

class LOBBY {
  constructor(id, mode, games) {
    this.id = id;
    this.maxPlayers = 20;
    this.hasStarted = false;
    this.timer = 20;
    this.players = [];
    this.wss = new WebSocket.WebSocketServer({ noServer: true });
    this.HandleWSS(this.wss, games)
    this.game = new GAME(this, mode);
  }
  IsFull() { return this.maxPlayers <= this.players.length; }

  HandleWSS(wss, games) {
    wss.on("connection", (ws, socket) => {
      if (this.IsFull() || this.hasStarted) {
        socket.destroy();
      } else {
        const newPlayer = new PLAYER(ws);
        this.players.push(newPlayer);
        if (this.players.length === 1) { newPlayer.admin = true; }
        this.UpdatePlayerList();
        newPlayer.SetInputs(this.hasStarted);

        ws.on("close", () => {
          console.log("Player left the server");
          this.players.splice(this.players.findIndex((player) => player === newPlayer), 1);
          if (this.players.length === 0) {
            wss.close(() => {
              const index = games.findIndex(game => game.id === this.id);
              games.splice(index, 1);
              console.log(`(${this.id}) was autodeleted`)
            });
          } else if (newPlayer.admin) {
            this.players[0].admin = true;
            this.players[0].SetInputs(this.hasStarted);
          }
          this.UpdatePlayerList();
        });

        ws.on("message", (message) => {
          console.log(`(${this.id}) recieved: ${message}`);
          const wsmessage = JSON.parse(message);
          this.OnWsMessage(wsmessage[0], wsmessage[1], ws);
        });

      }
    })
  }
  SendToClients(data) {
    console.log(`(${this.id}) sent ${JSON.stringify(data)}`);
    this.players.forEach((player) => {
      player.ws.send(JSON.stringify(data));
    })
  }
  UpdatePlayerList() {
    const playerlist = [];
    this.players.forEach((player) => {
      playerlist.push(player.PublicInfo());
    })
    this.SendToClients(["PLAYERLIST", playerlist]);
  }
  OnWsMessage(type, data, ws) {
    const sender = this.players.find(player => player.ws === ws);
    switch (type) {
      case "NICKNAME":
        if (data) { data = data.replaceAll(/\s/g, "").replaceAll(" ", ""); }
        if (data == null || data.length > 16 || data.length < 2 || this.players.find((player) => player.nickname === data)) { 
          data = "guest_" + (1000 + Math.floor(Math.random() * 8999)).toString();
          ws.send(JSON.stringify(["YOURNAME", data]));
        }
        sender.nickname = data;
        this.UpdatePlayerList();
        break;

      case "STARTGAME":
        if (sender.admin && !this.hasStarted) {
          this.game.StartGame();
        }
        break;

      case "BID":
        if (this.hasStarted) {
          sender.Bid(data, this.hasStarted);
          if (!this.players.some(player => !player.ready && !player.busted)) {
            this.game.SkipTimer();
          };
          this.UpdatePlayerList();
        }
        break;
    }
  }
}

class PLAYER {
  constructor(ws){
    this.ws = ws;
    this.pointsBid;
    this.pointsLeft = 0;

    this.admin = false;
    this.nickname = "guest";
    this.startingPoints = 0;
    this.ready = false;
    this.pointsWon = 0;
    this.busted = false;
  }
  PublicInfo() {
    const info = [this.admin, this.nickname, this.startingPoints, this.ready, this.pointsWon, this.busted];
    return info;
  }
  SetInputs(hasStarted) {
    const startButton = this.admin && !hasStarted;
    const bidButton = !this.ready && hasStarted && !this.busted;
    const data = ["INPUTS", [startButton, bidButton, this.pointsLeft]];
    this.ws.send(JSON.stringify(data));
  }
  NewRoundReset(hasStarted) {
    if (this.pointsWon === 0) { this.busted = true; }
    if (this.busted) { this.startingPoints = 0; }
    else {
      this.startingPoints = this.pointsWon;
      this.pointsLeft = this.startingPoints;
      this.pointsWon = 0;
    }
    this.SetInputs(hasStarted);
  }
  Bid(amount, hasStarted) {
    if (this.pointsLeft >= amount && amount > 0 && !this.ready && hasStarted) {
      this.pointsBid = amount;
      this.pointsLeft -= this.pointsBid;
    } else {
      this.pointsBid = 0;
    }
    this.ready = true;
    this.SetInputs(hasStarted);
  }

}

module.exports = LOBBY;
