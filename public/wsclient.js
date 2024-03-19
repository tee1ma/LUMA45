let ws;
let playername;
let playerStartingPoints;
let gameStarted = false;
let timer;
const notifyTime = 3000;

function ConnectToServer(playername) {
  const host = window.location.hostname;
  const port = window.location.port;
  ws = new WebSocket(`ws://${host}:${port}/${id}`);

  ws.addEventListener("open", () => {
    console.log("Successfully connected to the server");
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

    case "PLAYERLIST":
      UpdatePlayerList(eventData)
      break;

    case "YOURNAME":
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

      eventData.forEach((prize, index) => {
        const prizeElement = CreatePrize(prize, index, eventData.length, "Largest bet wins!");
        roundsContainer.appendChild(prizeElement);
      });
      document.getElementById("slider").max = playerStartingPoints;
      document.getElementById("bidLabel").max = playerStartingPoints;
      document.getElementById("maxLabel").innerText = playerStartingPoints;
      break;

    case "STARTBIDDING":
      document.getElementById("readyCounter").innerText = "";
      roundsContainer.children[eventData].style.backgroundColor = "gray";
      MovePrize(eventData);
      document.getElementById("bidButton").style.visibility = "visible";
      if (timer) { clearInterval(timer); }
      document.getElementById("timer").value = 0;
      timer = setInterval(() => {
        document.getElementById("timer").value++;
      }, 100);
      break;

    case "ROUNDWINNER":
      Notify(`${eventData[1]} won by ${eventData[0]} with a bid of ${eventData[2]}`);
      break;

    case "GAMEWINNER":
      gameStarted = false;
      if (timer) { clearInterval(timer); }
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

function CreatePrize(prize, index, total, roundDetails) {

  const prizeBox = document.createElement("span");
  prizeBox.className = "prizeBox";
  prizeBox.id = index;

  const roundNumber = document.createElement("h3");
  roundNumber.innerText = index + "/" + total;
  prizeBox.appendChild(roundNumber);

  const prizeAmount = document.createElement("h2");
  prizeAmount.innerText = prize;
  prizeBox.appendChild(prizeAmount);

  const roundInfo = document.createElement("h4");
  roundInfo.innerText = roundDetails;
  prizeBox.appendChild(roundInfo);

  return prizeBox;
}

function MovePrize(index) {
  if (index >= 1) {
    document.getElementById(index - 1).remove();
  }
}

function UpdatePlayerList(players) {
  const playerlist = document.getElementById("playerlist");

  while (playerlist.firstChild) {
    playerlist.removeChild(playerlist.firstChild);
  }

  players.forEach((player) => {
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
    }
    else if (player.busted) { row.style.backgroundColor = "red"; }
    playerlist.appendChild(row);
    row.appendChild(nickname);
    row.appendChild(startingPoints);
    row.appendChild(admin);
    row.appendChild(pointsWon);
  });

}

function RefreshSlider(bidLabel) {
  const slider = document.getElementById("slider");
  slider.value = bidLabel.value;
  slider.max = bidLabel.max;
}

function RefreshBidLabel() {
  const slider = document.getElementById("slider");
  const label = document.getElementById("bidLabel");
  label.value = slider.value;
  label.max = slider.max;
}

document.addEventListener("mouseup", () => { if (mdown) { clearInterval(mdown) }})

function Bid(btn) {
  const slider = document.getElementById("slider");
  const amount = parseInt(slider.value); 
  ws.send(JSON.stringify(["BID", amount]));
  slider.value = 0;
  slider.max = parseInt(slider.max) - amount;
  document.getElementById("maxLabel").innerText = slider.max;
  btn.style.visibility = "hidden";
  RefreshBidLabel();
}

function StartGame() {
  ws.send(JSON.stringify(["STARTGAME"]));
}

function Notify(message) {
  const notification = document.getElementById("notification");
  notification.style.visibility = "visible";
  notification.innerText = message;
  setTimeout(() => {
    notification.style.visibility = "hidden";
  }, notifyTime);
}

playername = window.prompt("Choose a nickname:");
ConnectToServer(playername);
