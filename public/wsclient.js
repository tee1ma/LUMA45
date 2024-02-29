let ws;
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
                const nickname = document.createElement("td");
                nickname.innerText = player.nickname;
                const startingPoints = document.createElement("td");
                startingPoints.innerText = player.startingPoints;
                const admin = document.createElement("td");
                if (player.admin === true) {
                    admin.innerText = "admin";
                }

                const row = document.createElement("tr");
                playerlist.appendChild(row);
                row.appendChild(nickname);
                row.appendChild(startingPoints);
                row.appendChild(admin);
            });
            break;
    }
}

const playername = window.prompt("Choose a nickname: ", "guest_" + (1000 + Math.floor(Math.random() * 8999)).toString());
ConnectToServer(playername);