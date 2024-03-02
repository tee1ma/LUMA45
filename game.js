const WebSocket = require("ws");

class GAME {
    constructor(id) {
        this.id = id;
        this.maxPlayers = 20;
        this.startingStack = 100;
        this.hasStarted = false;
        this.timer = 10;
        this.players = [];
        this.wss = new WebSocket.WebSocketServer({ noServer: true });
        this.HandleWSS(this.wss);
    }
    IsFull() { return this.players.length >= this.maxPlayers; }

    CreatePrizes(amount, totalPoints) {
        const remainder = 1000 % amount;
        const base = (1000 - remainder) / amount;
        const step = Math.floor(40 / amount);
        let prizes = [];
        for (let i = amount; i >= 0; i--) {
            if (i === amount / 2) { i--; }
            const permil = base + (step * (i - (amount / 2)));
            const prize = totalPoints * permil / 1000;
            prizes.push(prize);
        }
        prizes[0]+= remainder;
        return prizes;
    }

    SelectWinner() {
        const winner = this.players.filter((player) => !player.busted).reduce((a, b) => {
            return a.pointsBid > b.pointsBid ? a : b;
        });
        return winner;
    }

    StartGame() {
        this.hasStarted = true;
        this.players.forEach((player) => {
            player.busted = false;
            player.pointsWon = [this.startingStack];
            player.startingPoints = 0;
        });
        this.SendToClients(["STARTGAME"]);
        let prizeAmount = this.players.length * 2;
        const totalPoints = this.players.length * this.startingStack;
        setTimeout(() => {
            while(this.players.filter((player) => !player.busted).length > 1 && prizeAmount > 0) {
                this.MainLoop(this.CreatePrizes(prizeAmount, totalPoints));
                prizeAmount -= 2;
            }
        }, 3000);
    }
    MainLoop(prizes) {

        this.players.forEach((player) => { player.NewRoundReset(); });
        this.UpdatePlayerList();
        this.SendToClients(["PRIZES", prizes]);

        prizes.forEach(function(prize, index) { 

            this.players.forEach((player) => { player.pointsBid = 0; });
            this.SendToClients(["STARTBIDDING", index]);

            //Wait 10 seconds

            const winner = this.SelectWinner();
            winner.pointsWon.push(prize);
            this.SendToClients(["WINNER", [winner.nickname, prize, winner.pointsBid]]);
            this.players.forEach((player) => {
                player.pointsLeft -= player.pointsBid;
                player.pointsBid = 0;
            });

        });
        console.log("mainloop completed");
    }

    HandleWSS(wss) {
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
                        //Close the server here
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
    CloseWSS(wss){

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
                const bidder = this.players.find((player) => player.ws = ws);
                bidder.Bid(data);
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
        if (this.pointsLeft > amount && amount > 0) {
            this.pointsBid = amount;
        } else {
            this.pointsBid = 0;
        }
    }
}

module.exports = GAME;