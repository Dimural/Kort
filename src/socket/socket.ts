import { io, type Socket } from 'socket.io-client'

// In dev, Vite (5173) and the game server (3001) run side by side; a built
// bundle is served by the game server itself, so same-origin is correct.
const SERVER_URL =
  (import.meta.env.VITE_SERVER_URL as string | undefined) ??
  (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin)

// Single shared connection for the app.
export const socket: Socket = io(SERVER_URL, { autoConnect: true })
