import type { Socket } from "node:net";

export interface Lobby {
  clients: Client[];
}

export interface Client {
  id: string;
  name: string;
  socket: Socket;
}
