import { io, Socket } from "socket.io-client";

const URL = import.meta.env.VITE_SERVER_URL as string;
console.log(URL);

const socket: Socket = io(URL, {
  withCredentials: true,
});

export default socket