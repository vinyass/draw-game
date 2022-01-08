const words = require("./words.json");

const io = require("socket.io")({
  cors: {
    origin: "*",
  },
});
const clientRooms = {};

io.on("connection", (client) => {
  client.on("newGame", handleNewGame);
  client.on("joinGame", handleJoinGame);
  client.on("drawStart", handleDrawStart);
  client.on("draw", handleDraw);
  client.on("drawStop", handleDrawStop);
  client.on("clearDrawing", handleClearDrawing);
  client.on("guessedWord", handleGuessedWord);

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms.get(roomName);

    let numClients = 0;
    if (room) {
      numClients = room.size;
    }

    if (numClients === 0) {
      client.emit("unknownCode");
      return;
    } else if (numClients > 1) {
      client.emit("tooManyPlayers");
      return;
    }

    clientRooms[client.id] = roomName;

    client.join(roomName);
    client.number = 2;
    client.emit("init", 2);
    io.sockets
      .in(roomName)
      .emit("startGame", JSON.stringify({ words: generateRandomWords(5) }));
  }

  function handleNewGame() {
    let roomName = makeid();
    clientRooms[client.id] = roomName;
    client.emit("gameCode", roomName);

    client.join(roomName);
    client.number = 1;
    client.emit("init", 1);
  }

  function handleDrawStart(data) {
    const roomName = clientRooms[client.id];
    io.sockets.in(roomName).emit("paintStart", data);
  }

  function handleDraw(data) {
    const roomName = clientRooms[client.id];
    io.sockets.in(roomName).emit("paint", data);
  }

  function handleDrawStop() {
    const roomName = clientRooms[client.id];
    io.sockets.in(roomName).emit("paintStop");
  }

  function handleClearDrawing() {
    const roomName = clientRooms[client.id];
    io.sockets.in(roomName).emit("clearDrawing");
  }

  function handleGuessedWord(word) {
    const roomName = clientRooms[client.id];
    io.sockets.in(roomName).emit("renderGuessedWord", word);
  }
});

const PORT = process.env.PORT || 4000;

io.listen(PORT);

function makeid() {
  return `${Math.floor(Math.random() * 90000) + 10000}`;
}

function generateRandomWords(n) {
  return [...words].sort(() => Math.random() - Math.random()).slice(0, n);
}
