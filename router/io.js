module.exports = (io) => {
  const rooms = {};
  let connectedUsers = 0;

  io.on("connection", (socket) => {
    console.log("New client connected LOCAL:", socket.id);

    const emitUpdateRoom = (roomCode) => {
      if (rooms[roomCode]) {
        io.to(roomCode).emit(
          "updateRoom",
          rooms[roomCode].users,
          rooms[roomCode].allReady,
          rooms[roomCode].roomInfo,
          rooms[roomCode].numberBegin,
          rooms[roomCode].incrementAllReady
        );
      }
    };

    const getRoomList = () => {
      return Object.keys(rooms).map((roomCode) => ({
        roomCode,
        allReady: rooms[roomCode].allReady,
        roomInfo: rooms[roomCode].roomInfo,
        numberOfUsers: rooms[roomCode].users.length,
      }));
    };

    connectedUsers++;
    io.emit("onlineNumber", connectedUsers);

    socket.on("disconnect", () => {
      try {
        console.log("Client disconnected:", socket.id);
        connectedUsers--;
        io.emit("onlineNumber", connectedUsers);

        for (const roomCode in rooms) {
          rooms[roomCode].users = rooms[roomCode].users.filter(
            (user) => user.id !== socket.id
          );

          if (rooms[roomCode].users.length === 0) {
            delete rooms[roomCode];
          } else {
            emitUpdateRoom(roomCode);
          }
        }
        io.emit("roomListUpdate", getRoomList());
      } catch (error) {
        console.error("Error handling disconnect event:", error);
      }
    });

    socket.on("createRoom", (objInformationOfGame, callback) => {
      try {
        const roomCode = Math.random().toString(36).substring(2, 7);
        rooms[roomCode] = {
          users: [],
          allReady: false,
          roomInfo: objInformationOfGame,
          numberBegin: 0,
          incrementAllReady: false,
        };
        socket.join(roomCode);
        rooms[roomCode].users.push({
          id: socket.id,
          name: socket.userName || "Unknown",
          isReady: false,
          incrementReady: false,
          score: 0, // Initialize score
        });

        console.log(JSON.stringify(rooms[roomCode].users));
        callback(roomCode);
        io.emit("roomListUpdate", getRoomList());
      } catch (error) {
        console.error("Error handling createRoom event:", error);
      }
    });

    socket.on("joinRoom", (roomCode) => {
      try {
        // && !rooms[roomCode].allReady
        if (rooms[roomCode]) {
          const existingUser = rooms[roomCode].users.find(
            (user) => user.id === socket.id
          );

          if (!existingUser) {
            socket.join(roomCode);
            rooms[roomCode].users.push({
              id: socket.id,
              name: socket.userName || "Unknown",
              isReady: false,
              incrementReady: false,
              score: 0, // Initialize score
            });
            emitUpdateRoom(roomCode);
          } else {
            socket.emit("alreadyInRoom", roomCode);
            emitUpdateRoom(roomCode);
          }
        } else {
          io.to(socket.id).emit("roomDoesNotExist", roomCode);
        }
        io.emit("roomListUpdate", getRoomList());
      } catch (error) {
        console.log("Error handling joinRoom event:", error);
      }
    });

    socket.on("userReadyChange", (roomCode, isReady) => {
      try {
        const userIndex = rooms[roomCode]?.users.findIndex(
          (user) => user.id === socket.id
        );
        if (userIndex !== -1) {
          rooms[roomCode].users[userIndex].isReady = isReady;
          const allReady = rooms[roomCode].users.every((user) => user.isReady);
          rooms[roomCode].allReady = allReady;
          emitUpdateRoom(roomCode);
        }
      } catch (error) {
        console.log("Error handling userReadyChange event:", error);
      }
    });

    socket.on("incrementReadyChange", (roomCode, incrementReady) => {
      try {
        const userIndex = rooms[roomCode]?.users.findIndex(
          (user) => user.id === socket.id
        );
        if (userIndex !== -1) {
          rooms[roomCode].users[userIndex].incrementReady = incrementReady;
          const incrementAllReady = rooms[roomCode].users.every(
            (user) => user.incrementReady
          );
          rooms[roomCode].incrementAllReady = incrementAllReady;
          emitUpdateRoom(roomCode);
        }
      } catch (error) {
        console.log("Error handling incrementReadyChange event:", error);
      }
    });

    socket.on("updateUserName", (roomCode, userId, newUserName) => {
      try {
        const userIndex = rooms[roomCode]?.users.findIndex(
          (user) => user.id === userId
        );
        if (userIndex !== -1) {
          rooms[roomCode].users[userIndex].name = newUserName;
          emitUpdateRoom(roomCode);
        }
      } catch (error) {
        console.error("Error handling updateUserName event:", error);
      }
    });

    socket.on("incrementNumberBegin", (roomCode) => {
      try {
        if (rooms[roomCode] && rooms[roomCode].incrementAllReady) {
          rooms[roomCode].numberBegin += 1;
          rooms[roomCode].users.forEach(
            (user) => (user.incrementReady = false)
          );
          rooms[roomCode].incrementAllReady = false;
          emitUpdateRoom(roomCode);
        }
      } catch (error) {
        console.error("Error handling incrementNumberBegin event:", error);
      }
    });

    // socket.on("updateScore", (roomCode, userId, newScore) => {
    //   try {
    //     console.log("GETNEWSCORE", newScore);
    //     const userIndex = rooms[roomCode]?.users.findIndex(
    //       (user) => user.id === userId
    //     );
    //     if (userIndex !== -1) {
    //       rooms[roomCode].users[userIndex].score = newScore;
    //       emitUpdateRoom(roomCode);
    //     }
    //   } catch (error) {
    //     console.error("Error handling updateScore event:", error);
    //   }
    // });

    socket.on("updateOneELEMENT", (roomCode, userId, ELEMENT, newVALUE) => {
      try {
        console.log("GETNEWVALUE", newVALUE);
        const userIndex = rooms[roomCode]?.users.findIndex(
          (user) => user.id === userId
        );
        if (userIndex !== -1) {
          rooms[roomCode].users[userIndex][ELEMENT] = newVALUE;
          emitUpdateRoom(roomCode);
        }
      } catch (error) {
        console.error("Error handling updateScore event:", error);
      }
    });

    socket.on("getRoomList", () => {
      try {
        for (const roomCode in rooms) {
          rooms[roomCode].users = rooms[roomCode].users.filter(
            (user) => user.id !== socket.id
          );

          if (rooms[roomCode].users.length === 0) {
            delete rooms[roomCode];
          } else {
            emitUpdateRoom(roomCode);
          }
        }

        io.emit("roomListUpdate", getRoomList());
        io.emit("onlineNumber", connectedUsers);
      } catch (error) {
        console.error("Error handling getRoomList event:", error);
      }
    });

    socket.on("setUserName", (userName) => {
      try {
        socket.userName = userName;
      } catch (error) {
        console.error("Error handling setUserName event:", error);
      }
    });
  });
};
