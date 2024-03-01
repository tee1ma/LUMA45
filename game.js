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

    CreateRounds(amount) {
        const remainder = 1000 % amount;
        const base = (1000 - remainder) / amount;
        const step = Math.floor(40 / amount);
        let rounds = [];
        for (let i = amount; i >= 0; i--) {
            if (i === amount / 2) { i--; }
            const permil = base + (step * (i - (amount / 2)));
            rounds.push(permil);
        }
        rounds[0]+= remainder;
        return rounds;
    }

    StartGame() {
        this.hasStarted = true;
        this.players.forEach((player) => {
            player.busted = false;
        });
        this.SendToClients(["STARTGAME", rounds]);
    }
    MainLoop() {

    }
    RoundLoop() {
        
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
                    console.log(`(${this.id}) new message recieved: ${message}`);
                    const wsmessage = JSON.parse(message);
                    this.OnWsMessage(wsmessage[0], wsmessage[1], ws);
                });

            }
        })
    }
    SendToClients(data) {
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
                this.StartGame();
                break;

            case "BID":
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
        this.startingPoints;
        this.pointsWon = [];
        this.admin = false;
        this.busted = false;
    }
    PublicInfo() {
        const playerinfo = {
            nickname: this.nickname,
            startingPoints: this.startingPoints,
            pointsWon: this.pointsWon,
            admin: this.admin
        }
        return playerinfo;
    }
}

module.exports = GAME;