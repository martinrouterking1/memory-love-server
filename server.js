const WebSocket = require("ws");

const wss = new WebSocket.Server({
  port: process.env.PORT || 3000
});

let players = [];
let gameState = {
  turn: 0,
  scores: [0, 0]
};

function broadcast(data) {
  players.forEach(p => {
    if (p.readyState === WebSocket.OPEN) {
      p.send(JSON.stringify(data));
    }
  });
}

wss.on("connection", ws => {
  if (players.length >= 2) {
    ws.send(JSON.stringify({ type: "full" }));
    ws.close();
    return;
  }

  const playerId = players.length;
  players.push(ws);

  ws.send(JSON.stringify({
    type: "init",
    playerId
  }));

  // 🔑 QUANDO CI SONO 2 GIOCATORI → PARTI
  if (players.length === 2) {
    broadcast({
      type: "start",
      gameState
    });
  }

  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if (data.type === "match" && gameState.turn === playerId) {
      gameState.scores[playerId]++;
      broadcast({ type: "update", gameState });
    }

    if (data.type === "turn" && gameState.turn === playerId) {
      gameState.turn = 1 - gameState.turn;
      broadcast({ type: "update", gameState });
    }
  });

  ws.on("close", () => {
    players = [];
    gameState = { turn: 0, scores: [0, 0] };
  });
});

