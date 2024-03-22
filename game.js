class GAME {
  constructor(lobby) {
    this.lobby = lobby;
    this.timer = 20;
    this.startingStack = 1000;
    this.loop;
    this.playerToWin = 1;
    this.players;
    this.rounds;
    this.roundTotal;
    this.totalPoints;
  }
  StartGame() {
    this.lobby.hasStarted = true;
    this.players = this.lobby.players;
    this.players.forEach((player) => {
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
    if (this.players.length === 1) {
      winner = this.players[0].nickname; 
    } else {
      winner = this.players.reduce((a, b) => {
        return a.pointsWon > b.pointsWon ? a : b;
      }).nickname;
    }

    this.lobby.SendToClients(["NOTIFY", `Game has ended! The winner is ${winner}`])
    this.lobby.players.forEach(player => {
      player.busted = false;
      player.ready = false; 
      player.pointsWon = 0;
      player.pointsLeft = 0;
      player.startingPoints = 0;
      player.SetInputs(false);
    });
    this.lobby.UpdatePlayerList();
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
        this.rounds = this.CreateRounds(this.roundTotal, this.totalPoints)
        this.players.forEach(player => {
          player.NewRoundReset(this.lobby.hasStarted); 
          if (player.busted) {
            const index = this.players.indexOf(player);
            this.players.splice(index, 1);
          }
        });
        if (this.players.length < 2) {
          this.StopGame();
        } else {
          this.lobby.UpdatePlayerList();
          this.lobby.SendToClients(["ROUNDS", this.rounds])
        }

      } else {
        this.StopGame();
      }
    }

  }
  B() {
    const winners = this.SelectWinners();
    this.lobby.SendToClients(["NOTIFY", `${this.rounds[0][0]} was won by ${winners[0]} with a bid of ${this.players.find(player => player.nickname === winners[0]).pointsBid}!`]);
    this.lobby.UpdatePlayerList();
    this.rounds.shift();
    this.rounds.shift();
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
      rounds[index] = [round, index, this.roundTotal];
    })
    return rounds;
  }

  SelectWinners() {
    const max = this.players.reduce((a, b) => {
      return a.pointsBid > b.pointsBid ? a : b;
    }).pointsBid;
    const winners = this.players.filter(player => player.pointsBid === max);
    let winnernames = [];
    winners.forEach((winner) => {
      winner.pointsWon += Math.floor(this.rounds[0][0] / winners.length);
      winnernames.push(winner.nickname);
    });
    return winnernames;
  }

  SkipTimer() {
    clearTimeout(this.loop);
    this.MainLoop(this.looparg1, this.looparg2, this.looparg3);
  }

}
module.exports = GAME;
