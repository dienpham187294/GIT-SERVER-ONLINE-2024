module.exports = (io) => {
  const rooms = {};
  let connectedUsers = 0;

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("message", (message) => {
      try {
        console.log("Message received: ", message);
        io.emit("message", message);
      } catch (error) {
        console.error("Error handling message event:", error);
      }
    });

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
            io.to(roomCode).emit(
              "updateRoom",
              rooms[roomCode].users,
              rooms[roomCode].allReady,
              rooms[roomCode].roomInfo,
              rooms[roomCode].numberBegin,
              rooms[roomCode].incrementAllReady
            );
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
        callback(roomCode);
        io.emit("roomListUpdate", getRoomList());
      } catch (error) {
        console.error("Error handling createRoom event:", error);
      }
    });

    socket.on("joinRoom", (roomCode) => {
      try {
        if (rooms[roomCode] && !rooms[roomCode].allReady) {
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
            io.to(roomCode).emit(
              "updateRoom",
              rooms[roomCode].users,
              rooms[roomCode].allReady,
              rooms[roomCode].roomInfo,
              rooms[roomCode].numberBegin,
              rooms[roomCode].incrementAllReady
            );
          } else {
            socket.emit("alreadyInRoom", roomCode);
            io.to(roomCode).emit(
              "updateRoom",
              rooms[roomCode].users,
              rooms[roomCode].allReady,
              rooms[roomCode].roomInfo,
              rooms[roomCode].numberBegin,
              rooms[roomCode].incrementAllReady
            );
          }
        } else {
          io.to(socket.id).emit("roomDoesNotExist", roomCode);
        }
        io.emit("roomListUpdate", getRoomList());
      } catch (error) {
        console.error("Error handling joinRoom event:", error);
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
          io.to(roomCode).emit(
            "updateRoom",
            rooms[roomCode].users,
            allReady,
            rooms[roomCode].roomInfo,
            rooms[roomCode].numberBegin,
            rooms[roomCode].incrementAllReady
          );
        }
      } catch (error) {
        console.error("Error handling userReadyChange event:", error);
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
          io.to(roomCode).emit(
            "updateRoom",
            rooms[roomCode].users,
            rooms[roomCode].allReady,
            rooms[roomCode].roomInfo,
            rooms[roomCode].numberBegin,
            incrementAllReady
          );
        }
      } catch (error) {
        console.error("Error handling incrementReadyChange event:", error);
      }
    });

    socket.on("updateUserName", (roomCode, userId, newUserName) => {
      try {
        const userIndex = rooms[roomCode]?.users.findIndex(
          (user) => user.id === userId
        );
        if (userIndex !== -1) {
          rooms[roomCode].users[userIndex].name = newUserName;
          io.to(roomCode).emit(
            "updateRoom",
            rooms[roomCode].users,
            rooms[roomCode].allReady,
            rooms[roomCode].roomInfo,
            rooms[roomCode].numberBegin,
            rooms[roomCode].incrementAllReady
          );
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
          io.to(roomCode).emit(
            "updateRoom",
            rooms[roomCode].users,
            rooms[roomCode].allReady,
            rooms[roomCode].roomInfo,
            rooms[roomCode].numberBegin,
            rooms[roomCode].incrementAllReady
          );
        }
      } catch (error) {
        console.error("Error handling incrementNumberBegin event:", error);
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
            io.to(roomCode).emit(
              "updateRoom",
              rooms[roomCode].users,
              rooms[roomCode].allReady,
              rooms[roomCode].roomInfo,
              rooms[roomCode].numberBegin,
              rooms[roomCode].incrementAllReady
            );
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

    const getRoomList = () => {
      return Object.keys(rooms).map((roomCode) => ({
        roomCode,
        allReady: rooms[roomCode].allReady,
        roomInfo: rooms[roomCode].roomInfo,
        numberOfUsers: rooms[roomCode].users.length,
      }));
    };
  });
};
