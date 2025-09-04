import { io, Socket } from "socket.io-client";

const URL = "http://172.20.10.10:3001";
const socket: Socket = io(URL, {
  withCredentials: true,
});

export default socket;