const express = require("express");
const req = require("express/lib/request");
const http = require("http");
const { default: mongoose } = require("mongoose");
const {playerSchema, Player} = require("./model/player");

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = require("socket.io")(server);

app.use(express.json());

io.on("connection", (socket) => {
    console.log("connected");

    socket.on("login user", async ({username}) => {
        try {
            console.log(username, "join");

            const player = await Player.find({username});
            console.log(player);
    
            if (player.length == 0) {
                console.log("creating new player");
                const newPlayer = new Player({
                    username, 
                    socketID: socket.id, 
                });
                await newPlayer.save();
            } else {
                const onlinePlayer = player[0];
                onlinePlayer.socketID = socket.id;
                await onlinePlayer.save();
            }
    
            const onlinePlayers = await Player.find({
                socketID: {$ne:null}
            })
    
            io.emit("refreshLobby", "error");
        } catch (e) {
            socket.emit("refreshLobby", "error");
        }
       
    })

})

const mongoLink = "mongodb://localhost:27017/Mobile_Chinese_Chess";
mongoose.connect(mongoLink).then(() => {
    console.log("connect to mongoDB!");
});

server.listen(port, () => {
    console.log("running server...");
})