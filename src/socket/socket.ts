import { io, type Socket } from 'socket.io-client'

const SERVER_URL =
  (import.meta.env.VITE_SERVER_URL as string | undefined) ?? 'http://localhost:3001'

// Single shared connection for the app.
export const socket: Socket = io(SERVER_URL, { autoConnect: true })
