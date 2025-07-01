import { io, Socket } from "socket.io-client";
const URL = "http://localhost:3001";
const socket = io(URL, {
    withCredentials: true,
});
export default socket;
