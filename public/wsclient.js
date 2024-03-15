let ws;
let playername;
let gameStarted = false;
let playerStartingPoints;
let timer;
const notifyTime = 3000;

function ConnectToServer(playername) {
  const host = window.location.hostname;
  const port = window.location.port;
  ws = new WebSocket(`ws://${host}:${port}/${id}`);

  ws.addEventListener("open", () => {
    console.log("sfsdf");
    ws.send(JSON.stringify(["NICKNAME", playername]));
  });
  ws.addEventListener("message", (event) => {
    console.log(event.data);
    const message = JSON.parse(event.data);
    HandleMessage(message[0], message[1]);
  });
  ws.addEventListener("close", () => {
    window.location.replace(`http://${host}:${port}/home`);
  })
}

function HandleMessage(eventType, eventData) {
  const roundsContainer = document.getElementById("roundsContainer");
  switch (eventType) {

    case "PLAYERLIST": //Update playerlist
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
        const pointsWon = document.createElement("td");
        pointsWon.innerText = JSON.stringify(player.pointsWon);
        if (player.admin) {
          admin.innerText = "admin";
        }
        if (player.nickname === playername) {
          row.style.backgroundColor = "gray";
          playerStartingPoints = player.startingPoints;
          if (!gameStarted) {
            if (player.admin) {
              SetInputs("admin");
            } else {
              SetInputs("hidden");
            }
          }
        }
        else if (player.busted) { row.style.backgroundColor = "red"; }
        playerlist.appendChild(row);
        row.appendChild(nickname);
        row.appendChild(startingPoints);
        row.appendChild(admin);
        row.appendChild(pointsWon);
      });
      break;

    case "YOURNAME": //For player to be identify himself
      playername = eventData;
      break;

    case "STARTGAME":
      gameStarted = true;
      Notify("Game has started");
      document.getElementById("timer").max = eventData * 10;
      break;

    case "PRIZES":
      while (roundsContainer.firstChild) {
        roundsContainer.removeChild(roundsContainer.firstChild);
      }

      eventData.forEach((prize) => {
        const prizeElement = document.createElement("div");
        prizeElement.innerText = prize;
        roundsContainer.appendChild(prizeElement);
      });

      const slider = document.getElementById("slider");
      slider.max = playerStartingPoints;
      slider.value = "0";
      break;

    case "STARTBIDDING":
      SetInputs("enabled");
      document.getElementById("readyCounter").innerText = "";
      roundsContainer.children[eventData].style.backgroundColor = "gray";
      document.getElementById("timer").value = 0;
      if (timer) { clearInterval(timer); }
      timer = setInterval(() => {
        document.getElementById("timer").value++;
      }, 100);
      break;

    case "ROUNDWINNER":
      Notify(`${eventData[1]} won by ${eventData[0]} with a bid of ${eventData[2]}`);
      break;

    case "GAMEWINNER":
      gameStarted = false;
      document.getElementById("timer").value = 0;
      while (roundsContainer.firstChild) {
        roundsContainer.removeChild(roundsContainer.firstChild);
      }
      alert("Game has ended. Winner is: " + eventData);
      break;

    case "READYCOUNT":
      document.getElementById("readyCounter").innerText = eventData;
      break;
  }
}

function SendWs() {
  if (gameStarted) {
    const bidAmount = parseInt(document.getElementById("inputBox").value);
    ws.send(JSON.stringify(["BID", bidAmount]));

    const slider = document.getElementById("slider");
    slider.max = (parseInt(slider.max) - bidAmount);
    slider.value = "0";
    const inputBox = document.getElementById("inputBox");
    inputBox.max = (parseInt(inputBox.max) - bidAmount);
    inputBox.value = "0";

    SetInputs("disabled");
  } else {
    ws.send(JSON.stringify(["STARTGAME"]));
  }
}

function MatchInput(changedElement, correspondingElement) {
  correspondingElement.value = changedElement.value;
  correspondingElement.max = changedElement.max;
}

function SetInputs(state) {

  const slider = document.getElementById("slider");
  const bidButton = document.getElementById("bidButton");
  const inputBox = document.getElementById("inputBox");

  switch (state) {
    case "hidden":
      slider.style.visibility = "hidden";
      bidButton.style.visibility = "hidden";
      inputBox.style.visibility = "hidden";
      break;
    case "disabled":
      slider.style.visibility = "visible";
      bidButton.style.visibility = "hidden";
      inputBox.style.visibility = "visible";
      break;
    case "admin":
      inputBox.style.visibility = "hidden";
      slider.style.visibility = "hidden";
      bidButton.style.visibility = "visible";
      bidButton.innerText = "start game";
      break;
    case "enabled":
      inputBox.style.visibility = "visible";
      slider.style.visibility = "visible";
      bidButton.style.visibility = "visible";
      bidButton.innerText = "bid";
      break;
  }
}

function Notify(message) {
  const notification = document.getElementById("notification");
  notification.classList.remove("hidden");
  notification.classList.add("visible");
  notification.innerText = message;
  setTimeout(() => {
    notification.classList.remove("visible");
    notification.classList.add("hidden");
  }, notifyTime);
}

playername = window.prompt("Choose a nickname:");
ConnectToServer(playername);
