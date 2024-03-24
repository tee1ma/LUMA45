class GAME {
  constructor(lobby, mode) {
    this.lobby = lobby;
    this.mode = mode;
    this.timer = 20;
    this.startingStack = 1000;
    this.loop;
    this.playerToWin = 1;
    this.players = this.lobby.players;
    this.rounds;
    this.roundTotal;
    this.totalPoints;
  }
  StartGame() {
    this.lobby.hasStarted = true;
    this.players.forEach(player => {
      player.busted = false;
      player.pointsWon = this.startingStack;
    });
    this.totalPoints = this.players.length * this.startingStack;
    this.roundTotal = this.players.length * 2 + 2;
    this.rounds = [];
    this.lobby.SendToClients(["NOTIFY", "The game has started!"]);
    
    this.A();
    this.loop = setTimeout(() => { this.MainLoop() }, this.timer * 1000) 

  }
  StopGame() {
    clearTimeout(this.loop);
    this.lobby.hasStarted = false;
    this.rounds = [];
    let winner;
    if (this.PlayersLeft() === 1) {
      winner = this.players.find(player => !player.busted);
    } else {
      winner = this.players.reduce((a, b) => {
        return a.pointsWon > b.pointsWon ? a : b;
      }).nickname;
    }

    this.lobby.SendToClients(["ALERT", `Game has ended! The winner is ${winner}`])
    setTimeout(() => {
      this.players.forEach(player => {
        player.busted = false;
        player.ready = false; 
        player.pointsWon = 0;
        player.pointsLeft = 0;
        player.startingPoints = 0;
        player.SetInputs(false);
        this.lobby.UpdatePlayerList();
      }, 3000);
    });
  }
  MainLoop() {
    this.B();
    this.A();
    if (this.lobby.hasStarted) {
      this.loop = setTimeout(() => { this.MainLoop() }, this.timer * 1000) 
    }
  }
  A() {

    this.players.forEach(player => {
      player.pointsBid = 0;
      player.ready = false;
      player.SetInputs(this.lobby.hasStarted);
    });

    if (this.rounds.length === 0) {
      if (this.roundTotal > 2) {
        this.roundTotal -= 2;
        this.players.forEach(player => {
          player.NewRoundReset(this.lobby.hasStarted); 
        });
        if (this.PlayersLeft() < 2) {
          this.StopGame();
        } else {
          this.rounds = this.CreateRounds(this.roundTotal, this.totalPoints)
          this.lobby.UpdatePlayerList();
          this.lobby.SendToClients(["ROUNDS", this.rounds]);
        }

      } else {
        this.StopGame();
      }
    } else {
      this.lobby.UpdatePlayerList();
      this.lobby.SendToClients(["ROUNDS", this.rounds]);
    }

  }
  B() {
    const winner = this.SelectWinners();
    if (winner) {
      this.lobby.SendToClients(["NOTIFY", `${this.rounds[0][0]} was won by ${winner.nickname} with a bid of ${winner.pointsBid}!`]);
      this.lobby.UpdatePlayerList();
      this.rounds.shift();
    }
  }

  CreateRounds(amount, totalPoints) {
    const remainder = 1000 % amount;
    const base = (1000 - remainder) / amount;
    const step = Math.floor(40 / amount);
    let rounds = [];
    for (let i = 0; i <= amount; i++) {
      if (i === amount / 2) { i++; }
      const permil = base + (step * (i - (amount / 2)));
      const round = totalPoints * permil / 1000;
      rounds.push(round);
    }
    rounds[rounds.length-1] += remainder;
    rounds.forEach((round, index) => {
      let n = 0; 
      if (this.mode === "chaos") {
        n = Math.floor(Math.random() * Math.floor(this.PlayersLeft() / 2));  
      }
      rounds[index] = [round, index, this.roundTotal, n];
    })
    return rounds;
  }

  SelectWinners() {

    const sortedPlayers = Array.from(new Set(this.players.map(player => player["pointsBid"])));
    sortedPlayers.sort((a,b) => b - a);
    const n = this.rounds[0][3];
    const nthLargestBid = sortedPlayers[n];

    const winners = this.players.filter(player => player.pointsBid === nthLargestBid && !player.busted);
    winners.forEach(winner => {
      winner.pointsWon += Math.floor(this.rounds[0][0] / winners.length);
    });

    return winners[0];
  }

  SkipTimer() {
    clearTimeout(this.loop);
    this.MainLoop(this.looparg1, this.looparg2, this.looparg3);
  }

  PlayersLeft() { return this.players.filter(player => !player.busted).length; }

}
module.exports = GAME;
