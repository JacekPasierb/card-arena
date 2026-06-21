import {createServer} from "node:http";
import {Server} from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../src/lib/realtime/events";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  listPublicRooms,
  removePlayerEverywhere,
  startRoom,
} from "./roomManager";
import {
  botBid,
  botGive,
  botPlay,
  buildView,
  convertPlayerToBot,
  finalizeTrick,
  getGame,
  giveCard,
  isBotBidTurn,
  isBotMusikTurn,
  isBotPlayTurn,
  placeBid,
  playCard,
  removeGame,
  startGame,
  startNewRound,
} from "./gameManager";
import type {Seat} from "../src/games/tysiac/types/game";

const TRICK_PAUSE_MS = 1600;
const BOT_DELAY_MS = 850;

type SocketData = {
  playerId?: string;
};

const PORT = Number(process.env.SOCKET_PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

const httpServer = createServer((_req, res) => {
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end("Card Arena socket server\n");
});

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(httpServer, {
  cors: {origin: CLIENT_ORIGIN, methods: ["GET", "POST"]},
});

function roomChannel(code: string) {
  return `room:${code}`;
}

function broadcastLobby() {
  io.to("lobby").emit("rooms:update", listPublicRooms());
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Wystąpił błąd.";
}

async function broadcastGame(code: string) {
  const sockets = await io.in(roomChannel(code)).fetchSockets();

  for (const remote of sockets) {
    const view = buildView(code, remote.data.playerId);
    if (view) remote.emit("game:state", view);
  }
}

/**
 * Posuwa gr\u0119 do przodu: rozsy\u0142a stan, finalizuje uko\u0144czone lewy po pauzie
 * i wykonuje ruchy bot\u00f3w. Wywo\u0142uje si\u0119 rekurencyjnie a\u017c do tury cz\u0142owieka.
 */
async function advance(code: string) {
  await broadcastGame(code);

  const game = getGame(code);
  if (!game) return;

  if (game.phase === "trickComplete") {
    setTimeout(() => {
      finalizeTrick(code);
      void advance(code);
    }, TRICK_PAUSE_MS);
    return;
  }

  if (isBotBidTurn(game)) {
    setTimeout(() => {
      botBid(code);
      void advance(code);
    }, BOT_DELAY_MS);
    return;
  }

  if (isBotMusikTurn(game)) {
    setTimeout(() => {
      botGive(code);
      void advance(code);
    }, BOT_DELAY_MS);
    return;
  }

  if (isBotPlayTurn(game)) {
    setTimeout(() => {
      botPlay(code);
      void advance(code);
    }, BOT_DELAY_MS);
  }
}

io.on("connection", (socket) => {
  socket.on("lobby:subscribe", () => {
    socket.join("lobby");
    socket.emit("rooms:update", listPublicRooms());
  });

  socket.on("lobby:unsubscribe", () => {
    socket.leave("lobby");
  });

  socket.on("room:create", (payload, ack) => {
    try {
      const room = createRoom(payload);
      socket.data.playerId = payload.player.id;
      socket.join(roomChannel(room.code));
      ack({ok: true, data: room});
      broadcastLobby();
    } catch (error) {
      ack({ok: false, error: errorMessage(error)});
    }
  });

  socket.on("room:join", (payload, ack) => {
    try {
      const room = joinRoom(payload);
      socket.data.playerId = payload.player.id;
      socket.join(roomChannel(room.code));
      ack({ok: true, data: room});
      io.to(roomChannel(room.code)).emit("room:update", room);
      broadcastLobby();
    } catch (error) {
      ack({ok: false, error: errorMessage(error)});
    }
  });

  socket.on("room:subscribe", (code, ack) => {
    const room = getRoom(code);

    if (!room) {
      ack({ok: false, error: "Nie znaleziono stołu."});
      return;
    }

    socket.join(roomChannel(room.code));
    ack({ok: true, data: room});
  });

  socket.on("room:start", (payload, ack) => {
    try {
      const room = startRoom(payload.code);
      startGame(room);
      ack({ok: true, data: room});
      io.to(roomChannel(room.code)).emit("room:update", room);
      broadcastLobby();
      void advance(room.code);
    } catch (error) {
      ack({ok: false, error: errorMessage(error)});
    }
  });

  socket.on("game:subscribe", ({code}, ack) => {
    if (socket.data.playerId) {
      socket.join(roomChannel(code.toUpperCase()));
    }

    const view = buildView(code.toUpperCase(), socket.data.playerId);

    if (!view) {
      ack({ok: false, error: "Gra nie istnieje."});
      return;
    }

    ack({ok: true, data: view});
  });

  socket.on("game:play", ({code, cardId}, ack) => {
    const normalized = code.toUpperCase();
    const game = getGame(normalized);

    if (!game) {
      ack({ok: false, error: "Gra nie istnieje."});
      return;
    }

    const player = game.players.find(
      (current) => current.id === socket.data.playerId
    );

    if (!player) {
      ack({ok: false, error: "Nie jesteś graczem przy tym stole."});
      return;
    }

    const moved = playCard(normalized, player.seat as Seat, cardId);

    if (!moved) {
      ack({ok: false, error: "Nieprawidłowe zagranie."});
      return;
    }

    ack({ok: true, data: true});
    void advance(normalized);
  });

  socket.on("game:bid", ({code, action}, ack) => {
    const normalized = code.toUpperCase();
    const game = getGame(normalized);

    const player = game?.players.find(
      (current) => current.id === socket.data.playerId
    );

    if (!game || !player) {
      ack({ok: false, error: "Nie jesteś graczem przy tym stole."});
      return;
    }

    if (!placeBid(normalized, player.seat as Seat, action)) {
      ack({ok: false, error: "Nieprawidłowa licytacja."});
      return;
    }

    ack({ok: true, data: true});
    void advance(normalized);
  });

  socket.on("game:give", ({code, cardId, targetSeat}, ack) => {
    const normalized = code.toUpperCase();
    const game = getGame(normalized);

    const player = game?.players.find(
      (current) => current.id === socket.data.playerId
    );

    if (!game || !player) {
      ack({ok: false, error: "Nie jesteś graczem przy tym stole."});
      return;
    }

    if (!giveCard(normalized, player.seat as Seat, cardId, targetSeat as Seat)) {
      ack({ok: false, error: "Nie można oddać tej karty."});
      return;
    }

    ack({ok: true, data: true});
    void advance(normalized);
  });

  socket.on("game:newRound", ({code}, ack) => {
    const normalized = code.toUpperCase();

    if (!startNewRound(normalized)) {
      ack({ok: false, error: "Gra nie istnieje."});
      return;
    }

    ack({ok: true, data: true});
    void advance(normalized);
  });

  socket.on("room:leave", ({code, playerId}) => {
    const room = leaveRoom(code, playerId);
    socket.leave(roomChannel(code));

    if (room) {
      io.to(roomChannel(code)).emit("room:update", room);

      if (getGame(code)) {
        convertPlayerToBot(playerId);
        void advance(code);
      }
    } else {
      io.to(roomChannel(code)).emit("room:closed");
      removeGame(code);
    }

    broadcastLobby();
  });

  socket.on("disconnect", () => {
    const playerId = socket.data.playerId;
    if (!playerId) return;

    // Je\u015bli gracz jest w trakcie gry \u2014 przejmuje go bot, by gra si\u0119 toczy\u0142a.
    const gameCodes = convertPlayerToBot(playerId);
    for (const code of gameCodes) {
      void advance(code);
    }

    const affected = removePlayerEverywhere(playerId);

    for (const code of affected) {
      const room = getRoom(code);

      if (room) {
        io.to(roomChannel(code)).emit("room:update", room);
      } else {
        io.to(roomChannel(code)).emit("room:closed");
      }
    }

    if (affected.length > 0) {
      broadcastLobby();
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`> Socket.IO nasłuchuje na http://localhost:${PORT}`);
  console.log(`> Dozwolony origin klienta: ${CLIENT_ORIGIN}`);
});
