const WebSocket = require("ws");

class GAME {
  constructor(id, games) {
    this.id = id;
    this.maxPlayers = 20;
    this.startingStack = 1000;
    this.hasStarted = false;
    this.timer = 30;
    this.players = [];
    this.wss = new WebSocket.WebSocketServer({ noServer: true });
    this.HandleWSS(this.wss, games);

    this.loop;
    this.looparg1;
    this.looparg2;
    this.looparg3;
  }
  IsFull() { return this.players.length >= this.maxPlayers; }

  CreatePrizes(amount, totalPoints) {
    const remainder = 1000 % amount;
    const base = (1000 - remainder) / amount;
    const step = Math.floor(40 / amount);
    let prizes = [];
    for (let i = 0; i <= amount; i++) {
      if (i === amount / 2) { i++; }
      const permil = base + (step * (i - (amount / 2)));
      const prize = totalPoints * permil / 1000;
      prizes.push(prize);
    }
    prizes[0]+= remainder;
    return prizes;
  }

  SelectWinners(prize) {
    const players = this.players.filter((player) => !player.busted);
    const max = players.reduce((a, b) => {
      return a.pointsBid > b.pointsBid ? a : b;
    }).pointsBid;
    const winners = players.filter(player => player.pointsBid === max);
    let winnernames = [];
    winners.forEach((winner) => {
      winner.pointsWon.push(Math.floor(prize / winners.length));
      winnernames.push(winner.nickname);
    });
    return winnernames;
  }

  ResetMainLoop() {
    clearTimeout(this.loop);
    this.MainLoop(this.looparg1, this.looparg2, this.looparg3);
  }

  StartGame() {
    this.hasStarted = true;
    this.players.forEach((player) => {
      player.busted = false;
      player.pointsWon = [this.startingStack];
      player.startingPoints = 0;
      player.pointsBid = 0;
      player.ready = false;
    });
    this.SendToClients(["STARTGAME", this.timer]);

    setTimeout(() => {
      //A
      this.players.forEach((player) => { player.NewRoundReset(); });
      this.UpdatePlayerList();
      const totalPoints = this.players.length * this.startingStack;
      const prizes = this.CreatePrizes(this.players.length * 2, totalPoints);
      this.SendToClients(["PRIZES", prizes]);
      this.players.forEach((player) => { player.pointsBid = 0; });
      this.SendToClients(["STARTBIDDING", 0]);

      this.looparg1 = 0;
      this.looparg2 = prizes;
      this.looparg3 = totalPoints;

      this.loop = setTimeout(() => {
        this.MainLoop(0, prizes, totalPoints);
      }, this.timer * 1000)
    }, 3000);

  }

  MainLoop(bettingRound, prizes, totalPoints) {

    //B
    const winners = this.SelectWinners(prizes[bettingRound]);
    this.SendToClients(["ROUNDWINNER", [winners, Math.floor(prizes[bettingRound] / winners.length), this.players.find(player => player.nickname === winners[0]).pointsBid]]);
    this.UpdatePlayerList();

    this.players.forEach((player) => { player.pointsLeft -= player.pointsBid; });

    if (bettingRound === prizes.length - 1) { bettingRound = 0; }
    else { bettingRound++; }

    if (bettingRound === 0) {
      this.players.forEach((player) => { player.NewRoundReset(); });
      this.UpdatePlayerList();
      if (prizes.length > 2) {
        prizes = this.CreatePrizes(prizes.length - 2, totalPoints);
      } else {
        prizes = [];
      }
    }

    if (this.players.filter(player => !player.busted).length > 1 && prizes.length > 0) {
      //A
      this.SendToClients(["PRIZES", prizes]);
      this.players.forEach((player) => { player.pointsBid = 0; player.ready = false; });
      this.SendToClients(["STARTBIDDING", bettingRound]);

      this.looparg1 = bettingRound;
      this.looparg2 = prizes;
      this.looparg3 = totalPoints;

      this.loop = setTimeout(() => {
        this.MainLoop(bettingRound, prizes, totalPoints); 
      }, this.timer * 1000);
    } else {
      this.hasStarted = false;

      const players = this.players.filter((player) => !player.busted);
      const winner = players.reduce((a, b) => {
        return a.startingPoints > b.startingPoints ? a : b;
      });
      this.SendToClients(["GAMEWINNER", winner.nickname]);
    }
  }

  HandleWSS(wss, games) {
    wss.on("connection", (ws, socket) => {
      if (this.IsFull() || this.hasStarted) {
        console.log("Connection denied. Server is full!");
        socket.destroy();
      } else {
        console.log("Player connected");
        const newPlayer = new PLAYER(ws);
        this.players.push(newPlayer);
        if (this.players.length === 1) { newPlayer.admin = true; }
        this.UpdatePlayerList();

        ws.on("close", () => {
          console.log("Player left the server");
          this.players.splice(this.players.findIndex((player) => player === newPlayer), 1);
          if (this.players.length === 0) {
            wss.close(() => {
              const index = games.findIndex(game => game.id === this.id);
              games.splice(index, 1);
            });
          } else if (newPlayer.admin) {
            this.players[0].admin = true;
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
    switch (type) {
      case "NICKNAME":
        if (data == null || data.replaceAll(/\s/g, "").replaceAll(" ", "").length < 2 || this.players.find((player) => player.nickname === data)) {
          data = "guest_" + (1000 + Math.floor(Math.random() * 8999)).toString();
          ws.send(JSON.stringify(["YOURNAME", data]));
        }
        this.players.find((player) => player.ws === ws).nickname = data;
        this.UpdatePlayerList();
        break;

      case "STARTGAME":
        if (this.players.length > 1) {
          this.StartGame();
        }
        break;

      case "BID":
        const bidder = this.players.find((player) => player.ws === ws);
        bidder.Bid(data);
        if (this.players.every((player) => { return (player.busted || player.ready) && this.hasStarted; })) {
          this.ResetMainLoop();
        } else {
          const totalPlayers = this.players.filter(player => !player.busted).length;
          const playersReady = this.players.filter(player => player.ready).length;
          this.SendToClients(["READYCOUNT", playersReady + "/" + totalPlayers]);
        }
        break;
    }
  }


}
class PLAYER {
  constructor(ws){
    this.nickname = "guest";
    this.ws = ws;
    this.pointsLeft;
    this.pointsBid;
    this.startingPoints = 0;
    this.pointsWon = [];
    this.admin = false;
    this.busted = false;
    this.ready = false;
  }
  PublicInfo() {
    const playerinfo = {
      nickname: this.nickname,
      startingPoints: this.startingPoints,
      pointsWon: this.pointsWon,
      admin: this.admin,
      busted: this.busted
    }
    return playerinfo;
  }
  NewRoundReset() {
    if (this.pointsWon.length === 0) { this.busted = true; }
    if (this.busted) { this.startingPoints = 0; }
    else {
      this.startingPoints = this.pointsWon.reduce((a, b) => { return a+b; }, 0);
      this.pointsLeft = this.startingPoints;
      this.pointsWon = [];
    }
  }
  Bid(amount) {
    if (this.pointsLeft >= amount && amount > 0) {
      this.pointsBid = amount;
    } else {
      this.pointsBid = 0;
    }
    this.ready = true;
  }
}

module.exports = GAME;
