const express = require("express");
const app = express();
const indexRouter = require("./routes"); // folder me index.js ho to naam likhna zaruri nahi hai...
const path = require("path");

const http = require("http");  // These lines are socket setup...
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server);

let waitingUsers = [];
let rooms = {};

io.on("connection", (socket) => {
    socket.on("joinroom", () => {
        if (waitingUsers.length > 0) {
            let partner = waitingUsers.shift();  // Pehla user nikal ke dedega...
            const roomname = `${socket.id}-${partner.id}`;
            socket.join(roomname);
            partner.join(roomname);

            io.to(roomname).emit("joined", roomname);
        }
        else {
            waitingUsers.push(socket);
        }
    })
    // WebRTC...
    socket.on("signalingMessage", (data) => {
        socket.broadcast.to(data.room).emit("signalingMessage", data.message);
    })

    socket.on("message", (data) => {
        socket.broadcast.to(data.room).emit("message", data.message);
    })

    socket.on("startVideoCall", ({ room }) => {
        socket.broadcast.to(room).emit("incomingCall");
    })

    socket.on("acceptCall", ({ room}) => {
        socket.broadcast.to(room).emit("callAccepted");
    })

    socket.on("rejectCall", ({ room}) => {
        socket.broadcast.to(room).emit("callRejected");
    })

    socket.on("disconnect", () => {
        let index = waitingUsers.findIndex(waitingUser => waitingUser.id === socket.id);
        waitingUsers.splice(index, 1); // Kaha se hatana hai aur kitne hatane hai...
    })
})

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

server.listen(3000);