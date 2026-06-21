"use client";

import {useEffect, useState} from "react";
import {getSocket} from "@/lib/realtime/socket";
import {getLocalPlayer} from "./player";
import type {Room} from "./types";

export type RoomResult =
  | {status: "loading"; room: undefined}
  | {status: "ready"; room: Room}
  | {status: "missing"; room: undefined};

export function createRoom(options: {
  name: string;
  visibility: Room["visibility"];
}): Promise<Room> {
  const player = getLocalPlayer();

  return new Promise((resolve, reject) => {
    getSocket().emit(
      "room:create",
      {name: options.name, visibility: options.visibility, player},
      (response) =>
        response.ok
          ? resolve(response.data)
          : reject(new Error(response.error))
    );
  });
}

export function joinRoom(
  code: string,
  options?: {seat?: 1 | 2 | 3}
): Promise<Room> {
  const player = getLocalPlayer();

  return new Promise((resolve, reject) => {
    getSocket().emit(
      "room:join",
      {code: code.toUpperCase(), player, seat: options?.seat},
      (response) =>
        response.ok
          ? resolve(response.data)
          : reject(new Error(response.error))
    );
  });
}

export function startRoom(code: string): Promise<Room> {
  return new Promise((resolve, reject) => {
    getSocket().emit("room:start", {code: code.toUpperCase()}, (response) =>
      response.ok ? resolve(response.data) : reject(new Error(response.error))
    );
  });
}

export function leaveRoom(code: string): void {
  const player = getLocalPlayer();
  getSocket().emit("room:leave", {code: code.toUpperCase(), playerId: player.id});
}

export function useRooms(): Room[] {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = (list: Room[]) => setRooms(list);

    socket.on("rooms:update", handleUpdate);
    socket.emit("lobby:subscribe");

    return () => {
      socket.emit("lobby:unsubscribe");
      socket.off("rooms:update", handleUpdate);
    };
  }, []);

  return rooms;
}

export function useRoom(code: string): RoomResult {
  const [result, setResult] = useState<RoomResult>({
    status: "loading",
    room: undefined,
  });

  useEffect(() => {
    const socket = getSocket();
    const normalized = code.toUpperCase();

    const handleUpdate = (room: Room) => {
      if (room.code === normalized) {
        setResult({status: "ready", room});
      }
    };

    const handleClosed = () => {
      setResult({status: "missing", room: undefined});
    };

    socket.on("room:update", handleUpdate);
    socket.on("room:closed", handleClosed);

    socket.emit("room:subscribe", normalized, (response) => {
      if (response.ok) {
        setResult({status: "ready", room: response.data});
      } else {
        setResult({status: "missing", room: undefined});
      }
    });

    return () => {
      socket.off("room:update", handleUpdate);
      socket.off("room:closed", handleClosed);
    };
  }, [code]);

  return result;
}
