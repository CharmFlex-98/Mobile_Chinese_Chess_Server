const express = require("express");
const req = require("express/lib/request");
const http = require("http");
const { default: mongoose } = require("mongoose");
const {playerSchema, PlayerModel} = require("./model/playerDB");
const Room = require("./model/room");
const Player = require("./model/player");
const {findPlayer, findRoom} = require("./functions");

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
                socket.join("lobby");
                socket.emit("loginSuccessed", {
                    username: joinedPlayer.username, 
                    lobbyInfo: rooms, 
                });
                socket.to("lobby").emit("playerJoinedLobby", {
                    "message": joinedPlayer.username + " joined!!"
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
            const p = findPlayer(onlinePlayers, socket);
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
            const p = findPlayer(onlinePlayers, socket);
            const joinRoom = findRoom(rooms, roomID);
            if (joinRoom == null || p == null) {
                socket.emit("error");
            } else {
                if (joinRoom.joinable()) {
                    console.log("joining room...");
                    joinRoom.joinRoom(p);
                    console.log(joinRoom);
                    socket.join(roomID);
                    await socket.emit("joinRoomSuccessed", {
                        roomInfo: joinRoom, 
                    })
                    socket.to(roomID).emit("roomStatusChanged", {
                        roomInfo: joinRoom, 
                    })
                }
            }
        } catch(e) {
            console.log(e);
            socket.emit("error");
        }
    });

    socket.on("leaveRoom", async (roomID) => {
        try {
           const p = findPlayer(onlinePlayers, socket);
           const joinedRoom = findRoom(rooms, roomID);
           console.log("=====");
           console.log(p);
           console.log(joinedRoom);

           if (p == null || joinedRoom == null) {
               socket.emit("leaveRoomError");
           } else {
               socket.leave(roomID);
               joinedRoom.leaveRoom(p);
               console.log(joinedRoom);
               socket.to(roomID).emit("roomStatusChanged", {
                   "roomInfo": joinedRoom, 
               })
               await socket.emit("leaveRoomSuccessed");

               // if there is no more people in room, destroy it
               if (joinedRoom.playerCount() == 0) {
                   rooms = rooms.filter((room) => {
                       return room.roomID != joinedRoom.roomID;
                   });

                   io.emit("refreshLobby", {
                       "lobbyInfo": rooms
                   });
               }
           }
           
        } catch(e) {
            console.log(e);
            socket.emit("leaveRoomError");
        }
    });



    socket.on("ready", async (roomID) => {
        try {
            const room = findRoom(rooms, roomID);
            if (room == null) {
                socket.emit("error");
            } else {
                const room = findRoom(rooms, roomID);
                const isRed = room.isRedTeam(socket);
                
                room.isReady(isRed);

                io.to(roomID).emit("roomStatusChanged", {
                    "roomInfo": room, 
                })

                // if (room.allowEnterGame()) {
                //     const redPlayer = room.redPlayer();
                //     const blackPlayer = room.blackPlayer();

                //     console.log(redPlayer["username"]);

                //     io.to(roomID).emit("enterGame", {
                //         "redTeam": redPlayer.username, 
                //         "blackTeam": blackPlayer.username, 
                //     })
                // } else {
                //     const readyPlayer = isRed ? room.redPlayer() : room.blackPlayer();
                //     io.to(roomID).emit("onePlayerReady", {
                //         "readyPlayer": readyPlayer.username,
                //     })
                // }
            }
        } catch(e) {
            console.log(e);
            socket.emit("error");
        }
    })

    socket.on("move", async (data) => {
        try {
            const roomID = data["roomID"];
            const room = findRoom(rooms, roomID); 
            const moveData = data["moveData"]

            if (room != null) {
                room.changeTurn();
                console.log("get move");
                socket.to(roomID).emit("playerMove", {
                    "moveInfo": {
                        "prevX": moveData["prevX"],
                        "currX": moveData["currX"],
                        "prevY": moveData["prevY"], 
                        "currY": moveData["currY"], 
                    }
                })
            }
           
        } catch(e) {
            console.log(e);
            socket.emit("moveError");
        }
    })

    socket.on("endGame", async (data) => {
        try {
            const isWinner = data["isWinner"];
            roomID = data["roomID"];

            if (isWinner) {
                socket.emit("gameStatusChanged", {
                    "isWinner": true
                })
                socket.to(roomID).emit("gameStatusChanged", {
                    "isWinner": false, 
                })
            } else {
                socket.emit("gameStatusChanged", {
                    "isWinner": false
                })
                socket.to(roomID).emit("gameStatusChanged", {
                    "isWinner": true, 
                })
            }

            console.log("status changed sent")
           
        } catch(e) {
            console.log(e);
            socket.emit("endGameError");
        }
    })

    socket.on("restartRequested", async (data) => {
        const roomID = data["roomID"];
        socket.to(roomID).emit("gameStatusChanged", {
            "restartInvited": true
        })
    })

    socket.on("requestCancelled", async (data) => {
        const roomID = data["roomID"];
        socket.to(roomID).emit("gameStatusChanged", {
            "requestCancelled": true
        })
    })

    socket.on("restartRefused", async (data) => {
        const roomID = data["roomID"];
        socket.to(roomID).emit("gameStatusChanged", {
            "restartRefused": true
        })
    })

    socket.on("restartAccepted", async (data) => {
        const roomID = data["roomID"];
        io.to(roomID).emit("gameStatusChanged", {
            restartGame: true
        });
    })

    socket.on("leaveGame", async (data) => {
        const roomID = data["roomID"];
        const room = findRoom(rooms, roomID);

        socket.to(roomID).emit("opponentLeftGame");
        room.resetRoomStatus();
    })
})

const mongoLink = "mongodb://localhost:27017/Mobile_Chinese_Chess";
mongoose.connect(mongoLink).then(() => {
    console.log("connect to mongoDB!");
});

server.listen(port, () => {
    console.log("running server...");
})