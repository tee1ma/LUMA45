let ws;
let playername;
let gameStarted = false;

function ConnectToServer(playername) {
    const host = window.location.hostname;
    const port = window.location.port;
    ws = new WebSocket(`ws://${host}:${port}/${id}`);

    ws.addEventListener("open", (event) => {
        console.log("sfsdf");
        ws.send(JSON.stringify(["NICKNAME", playername]));
    });
    ws.addEventListener("message", (event) => {
        console.log(event.data);
        const message = JSON.parse(event.data);
        HandleMessage(message[0], message[1]);
    });
}

function HandleMessage(eventType, eventData) {
    switch (eventType) {

        case "PLAYERLIST":
            const playerlist = document.getElementById("playerlist");

            while (playerlist.firstChild) {
                playerlist.removeChild(playerlist.firstChild);
            }

            eventData.forEach((player) => {
                const row = document.createElement("tr");
                const nickname = document.createElement("td");
                nickname.innerText = player.nickname;
                const startingPoints = document.createElement("td");
                startingPoints.innerText = player.startingPoints;
                const admin = document.createElement("td");
                if (player.admin) {
                    admin.innerText = "admin";
                }
                if (player.nickname === playername) {
                    row.style.backgroundColor = "gray";
                    if (!gameStarted) {
                        if (player.admin) {
                            SetInputs("admin");
                        } else {
                            SetInputs("hidden");
                        }
                    }
                }
                playerlist.appendChild(row);
                row.appendChild(nickname);
                row.appendChild(startingPoints);
                row.appendChild(admin);
            });
            break;

        case "YOURNAME":
            playername = eventData;
            break;

        case "STARTGAME":
            gameStarted = true;
            SetInputs("enabled");
            break;

    }
}

function SendWs() {
    if (gameStarted) {
        const bidAmount = document.getElementById("slider").value;
        ws.send(JSON.stringify(["BID", bidAmount]));
    } else {
        ws.send(JSON.stringify(["STARTGAME"]));
    }
}

function SetInputs(state) {

    const slider = document.getElementById("slider");
    const bidButton = document.getElementById("bidButton");

    switch (state) {
        case "hidden":
            slider.style.visibility = "hidden";
            bidButton.style.visibility = "hidden";
            break;
        case "disabled":
            break;
        case "admin":
            slider.style.visibility = "hidden";
            bidButton.style.visibility = "visible";
            bidButton.innerText = "start game";
            break;
        case "enabled":
            slider.style.visibility = "visible";
            bidButton.style.visibility = "visible";
            bidButton.innerText = "bid";
            break;
    }
}

playername = window.prompt("Choose a nickname:");
ConnectToServer(playername);