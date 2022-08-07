const express = require("express");
const req = require("express/lib/request");
const http = require("http");
const { default: mongoose } = require("mongoose");
const {playerSchema, PlayerModel} = require("./model/playerDB");
const Room = require("./model/room");
const Player = require("./model/player");

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = require("socket.io")(server);

app.use(express.json());

onlinePlayers = [];
rooms = [];

io.on("connection", (socket) => {
    console.log("connected");

    socket.on("loginUser", async ({username}) => {
        try {
            console.log(username, "join");

            const player = await PlayerModel.findOne({username});
            console.log(player);
    
            if (player == null) {
                socket.emit("error");
            } else {
                const joinedPlayer = new Player(player.username, socket.id);
                onlinePlayers.push(joinedPlayer);
                console.log(onlinePlayers);
                socket.emit("loginSuccess", {
                    lobbyInfo: rooms, 
                });
                io.emit("refreshLobby", {
                    roomInfo: rooms, 
                })
            }
    
        } catch (e) {
            console.log(e);
            socket.emit("error");
        }
       
    });

    socket.on("createRoom", async () => {
        try {
            console.log("creating room ...");
            const p = onlinePlayers.find((player) => {
                return player.socketID == socket.id;
            });
            console.log(p);
            if (p == null) {
                console.log("create room failed");
                socket.emit("error");
            } else {
                const room = new Room();
                room.joinRoom(p);
                room.owner = p;
                rooms.push(room);

                socket.join(room.roomID.toString());
                console.log("creating room success, sending message");
                socket.emit("createRoomSuccessed", {
                    roomInfo: room, 
                });
                io.emit("refreshLobby", {
                    lobbyInfo: rooms, 
                })
            }

        } catch(e) {
            console.log(e);
            socket.emit("error");
        }
    });

    socket.on("joinRoom", async (roomID) => {
        try {
            const p = onlinePlayers.find((player) => {
                return player.socketID == socket.id;
            });
            const joinRoom = rooms.find((room) => {
                return room.roomID == roomID;
            })
            if (joinRoom == null || p == null) {
                socket.emit("error");
            } else {
                if (joinRoom.joinable()) {
                    console.log("joining room...");
                    joinRoom.joinRoom(p);
                    console.log(joinRoom);
                    socket.join(roomID);
                    io.to(roomID).emit("joinRoomSuccessed", {
                        roomInfo: joinRoom, 
                    })
                }
            }
        } catch(e) {
            console.log(e);
            socket.emit("error");
        }
    });

})

const mongoLink = "mongodb://localhost:27017/Mobile_Chinese_Chess";
mongoose.connect(mongoLink).then(() => {
    console.log("connect to mongoDB!");
});

server.listen(port, () => {
    console.log("running server...");
})