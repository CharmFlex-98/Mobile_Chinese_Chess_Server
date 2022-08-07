function findPlayer(onlinePlayers, socket) {
    return onlinePlayers.find((player) => {
        return player.socketID == socket.id;
    });
}

function findRoom(rooms, roomID) {
    return rooms.find((room) => {
        return room.roomID == roomID;
    })
}

module.exports = {findPlayer, findRoom};