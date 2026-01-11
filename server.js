const WebSocket = require("ws");

const wss = new WebSocket.Server({
  port: process.env.PORT || 3000
});

let players = [];
let gameState = {
  turn: 0,
  scores: [0, 0]
};

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
    playerId,
    gameState
  }));

  broadcast();

  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if (data.type === "match" && gameState.turn === playerId) {
      gameState.scores[playerId]++;
    }

    if (data.type === "turn" && gameState.turn === playerId) {
      gameState.turn = 1 - gameState.turn;
    }

    broadcast();
  });

  ws.on("close", () => {
    players = [];
    gameState = { turn: 0, scores: [0, 0] };
  });
});

function broadcast() {
  players.forEach(p =>
    p.send(JSON.stringify({
      type: "update",
      gameState
    }))
  );
}
