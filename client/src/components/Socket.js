import { io, Socket } from "socket.io-client";
const URL = import.meta.env.VITE_SERVER_URL;
console.log(URL);
const socket = io(URL, {
    withCredentials: true,
});
export default socket;
