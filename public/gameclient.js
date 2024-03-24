let myname;
let ws;
let timer;
let notiTimer;

class PLAYER {
  constructor(playerData) {
    this.admin = playerData[0];
    this.name = playerData[1];
    this.startingPoints = playerData[2];
    this.ready = playerData[3];
    this.pointsWon = playerData[4];
    this.busted = playerData[5];
    this.me = myname === this.name;
    this.AddToPlayerList();
  }
  AddToPlayerList() {
    const table = document.getElementById("PlayerList");
    const tr = table.insertRow(0);
    const td0 = tr.insertCell(0);
    const td1 = tr.insertCell(1);
    const td2 = tr.insertCell(2);
    const td3 = tr.insertCell(3);
    const td4 = tr.insertCell(3);
    if (this.admin) {
      const adminImg = document.getElementById("admin").cloneNode(true);
      adminImg.removeAttribute("hidden");
      td0.appendChild(adminImg);
    }
    td1.innerText = this.name;
    td2.innerText = this.startingPoints.toString();
    if (this.ready) {
      const checkmarkImg = document.getElementById("checkmark").cloneNode(true);
      checkmarkImg.removeAttribute("hidden");
      td3.appendChild(checkmarkImg);
    }
    td4.innerText = this.pointsWon.toString();
    if (this.busted) {
      tr.style.backgroundColor = "#ff003b";
    } else {
      tr.style.backgroundColor = "lightgray";
    }
    if (this.me) {
      td1.style.border = "5px solid black";
    }
  }
}

function CreateRound(value, index, total, n) {

  const roundBox = document.createElement("span");

  const roundNumber = document.createElement("h3");
  roundNumber.innerText = index+1 + "/" + total;
  roundBox.appendChild(roundNumber);

  const roundAmount = document.createElement("h2");
  roundAmount.innerText = value;
  roundBox.appendChild(roundAmount);

  const description = document.createElement("h6");
  let nth;
  if (n === 1) { nth = "L" }
  else if (n === 2) { nth = "2nd l"}
  else if (n === 3) { nth = "3rd l"}
  else { nth = n + "th l"}
  description.innerText = nth + "argest bid wins!";
  roundBox.appendChild(description);

  return roundBox;
}

function SetInputs(playerData) {
  const startButton = document.getElementById("Start");
  const bidButton = document.getElementById("Bid");
  const slider = document.getElementById("Slider");
  const max = document.getElementById("Max");

  if (playerData[0]) {
    startButton.style.visibility = "visible";
  } else {
    startButton.style.visibility = "hidden";
  }

  if (playerData[1]) {
    bidButton.style.visibility = "visible";
    slider.style.visibility = "visible";
  } else {
    bidButton.style.visibility = "hidden";
    slider.style.visibility = "hidden";
  }
  
  slider.max = playerData[2];
  max.innerText = playerData[2].toString();
}

function ResetTimer() {
  if (timer) { clearInterval(timer); }
  const bar = document.getElementsByTagName("progress")[0];
  bar.value = 0;
  return bar;
}

function Notify(message) {
  const notifyTime = 5000;
  const notification = document.getElementById("Notification");
  notification.innerText = message;
  notification.style.visibility = "visible";
  if (notiTimer) { clearTimeout(notiTimer); }
  notiTimer = setTimeout(() => {
    notification.style.visibility = "hidden";
  }, notifyTime);
}

function StartGame() {
  ws.send(JSON.stringify(["STARTGAME"]));
  console.log("STARTGAME sent");
}

function Bid() {
  const amount = parseInt(document.getElementById("Slider").value);
  ws.send(JSON.stringify(["BID", amount]));
  console.log("BID", amount);
}

function ConnectToServer(playername) {
  const host = window.location.hostname;
  const port = window.location.port;
  const id = window.location.pathname.split("/").pop();
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
  switch (eventType) {
    case "PLAYERLIST":
      document.getElementById("PlayerList").innerHTML = "";
      eventData.forEach(player => {
        new PLAYER(player);
      });
      break;
    case "YOURNAME":
      myname = eventData;
      break;
    case "NOTIFY":
      Notify(eventData);
      break;
    case "ALERT":
      ResetTimer();
      document.getElementById("RoundsContainer").innerHTML = "";
      alert(eventData);
    case "INPUTS":
      SetInputs(eventData);
      break;
    case "ROUNDS":

      const bar = ResetTimer();
      timer = setInterval(() => {
        bar.value++;
      }, 100);

      //Reset input
      document.getElementById("Slider").value = 0;
      document.getElementsByTagName("output")[0].innerText = "0";

      //Generate rounds
      const rcontainer = document.getElementById("RoundsContainer");
      rcontainer.innerHTML = "";
      eventData.forEach(round => {
        const r = CreateRound(round[0], round[1], round[2], round[3] + 1);
        rcontainer.appendChild(r);
      });
      rcontainer.firstElementChild.id = "CurrentRound";
  }
}

myname = window.prompt("Choose a nickname:");
ConnectToServer(myname);
