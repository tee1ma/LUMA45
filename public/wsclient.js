let ws;
function ConnectToServer() {
    const host = window.location.hostname;
    const port = window.location.port;
    ws = new WebSocket(`ws://${host}:${port}/${id}`);

    ws.addEventListener("open", (event) => {
        console.log("sfsdf");
    });
    ws.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        HandleMessage(message[0])
        
    });
}

function HandleMessage(eventType) {
    switch (eventType) {
        default:
            break;
    }
}

ConnectToServer();