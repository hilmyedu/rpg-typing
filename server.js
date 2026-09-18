const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const spells = [
  "Serangan kilat membelah kegelapan malam dengan kekuatan penuh.",
  "Mantra pelindung kuno mampu menahan gempuran serangan monster dungeon.",
  "Fokuskan pikiran dan gerakkan jemari secara presisi untuk mengalahkan musuh.",
  "Kecepatan dan ketepatan adalah kunci utama seorang pahlawan sejati."
];

let waitingPlayer = null;
let rooms = {};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Matchmaking sederhana
  if (!waitingPlayer) {
    waitingPlayer = socket;
    socket.emit('waiting', 'Mencari lawan...');
  } else {
    const roomId = `room_${waitingPlayer.id}_${socket.id}`;
    const p1 = waitingPlayer;
    const p2 = socket;
    waitingPlayer = null;

    p1.join(roomId);
    p2.join(roomId);

    const randomText = spells[Math.floor(Math.random() * spells.length)];
    rooms[roomId] = { p1: p1.id, p2: p2.id, text: randomText };

    io.to(roomId).emit('game_start', {
      text: randomText,
      p1Id: p1.id,
      p2Id: p2.id
    });
  }

  // Sinkronisasi progress mengetik
  socket.on('typing_progress', (data) => {
    socket.to(data.roomId).emit('opponent_progress', {
      wordIndex: data.wordIndex,
      totalWords: data.totalWords
    });
  });

  socket.on('disconnect', () => {
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

server.listen(3000, () => {
  console.log('Server RPG PVP jalan di http://localhost:3000');
});
