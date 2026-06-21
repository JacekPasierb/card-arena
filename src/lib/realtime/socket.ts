"use client";

import {io, type Socket} from "socket.io-client";
import type {ClientToServerEvents, ServerToClientEvents} from "./events";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    const url =
      process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

    socket = io(url, {
      autoConnect: true,
      // websocket jako główny transport, polling jako zapas (proxy Render itp.).
      transports: ["websocket", "polling"],
    });
  }

  return socket;
}
