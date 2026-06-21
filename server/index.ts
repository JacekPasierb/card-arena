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
      ack({ok: true, data: room});
      io.to(roomChannel(room.code)).emit("room:update", room);
      broadcastLobby();
    } catch (error) {
      ack({ok: false, error: errorMessage(error)});
    }
  });

  socket.on("room:leave", ({code, playerId}) => {
    const room = leaveRoom(code, playerId);
    socket.leave(roomChannel(code));

    if (room) {
      io.to(roomChannel(code)).emit("room:update", room);
    } else {
      io.to(roomChannel(code)).emit("room:closed");
    }

    broadcastLobby();
  });

  socket.on("disconnect", () => {
    const playerId = socket.data.playerId;
    if (!playerId) return;

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
