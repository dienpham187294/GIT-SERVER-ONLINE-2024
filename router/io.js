module.exports = (io) => {
  const rooms = {};
  let connectedUsers = 0;

  io.on("connection", (socket) => {
    console.log("LOCAL CONNECTS MM:", socket.id);

    const emitUpdateRoom = (roomCode, dataChange, mode) => {
      console.log(mode);
      if (rooms[roomCode]) {
        if (!dataChange) {
          console.log("ALLLLLLL");
          io.to(roomCode).emit("updateRoom", {
            users: rooms[roomCode].users,
            allReady: rooms[roomCode].allReady,
            roomInfo: rooms[roomCode].roomInfo,
            numberBegin: rooms[roomCode].numberBegin,
            incrementAllReady: rooms[roomCode].incrementAllReady,
          });
        } else {
          console.log("Apart");
          io.to(roomCode).emit("updateRoom", dataChange);
        }
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
            emitUpdateRoom(
              roomCode,
              { users: rooms[roomCode].users },
              "disconnect"
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
          host: true,
          id: socket.id,
          name: socket.userName || "Unknown",
          isReady: false,
          incrementReady: false,
          score: 0, // Initialize score
          isPause: false,
          logInTime: Date.now(),
        });
        callback(roomCode);
        io.emit("roomListUpdate", getRoomList());
      } catch (error) {
        console.error("Error handling createRoom event:", error);
      }
    });

    socket.on("joinRoom", (roomCode) => {
      try {
        console.log("Join room ");
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
              incrementReady: true,
              score: 0, // Initialize score
              isPause: rooms[roomCode].allReady,
              logInTime: Date.now(),
            });

            emitUpdateRoom(roomCode, false, "Join room");
          } else {
            emitUpdateRoom(roomCode, false, "In room");
          }
        } else {
          io.to(socket.id).emit("roomDoesNotExist", roomCode);
        }
        io.emit("roomListUpdate", getRoomList());
      } catch (error) {
        console.log("Error handling joinRoom event:", error);
      }
    });

    socket.on("updateRoomInfoIndexSets", (roomCode, indexSets) => {
      try {
        if (rooms[roomCode]) {
          rooms[roomCode].indexSets = indexSets;
          emitUpdateRoom(
            roomCode,
            {
              indexSets: rooms[roomCode].indexSets,
            },
            "updateRoomInfoIndexSets"
          );
        }
      } catch (error) {
        console.error("Error handling incrementNumberBegin event:", error);
      }
    });

    socket.on("updateOneELEMENT", (roomCode, userId, ELEMENT, newVALUE) => {
      try {
        const userIndex = rooms[roomCode]?.users.findIndex(
          (user) => user.id === userId
        );
        if (userIndex !== -1) {
          rooms[roomCode].users[userIndex][ELEMENT] = newVALUE;

          if (rooms[roomCode].numberBegin === 0) {
            console.log(0, rooms[roomCode].numberBegin);

            const checkAllReady = rooms[roomCode].users.every(
              (user) => user.isReady
            );
            if (checkAllReady) {
              rooms[roomCode].numberBegin = 1;

              rooms[roomCode].users.forEach((user) => {
                user.incrementReady = false;
              });
              emitUpdateRoom(
                roomCode,
                {
                  users: rooms[roomCode].users,
                  allReady: true,
                  numberBegin: 1,
                },
                "updateOneELEMENT"
              );
            } else {
              emitUpdateRoom(
                roomCode,
                {
                  users: rooms[roomCode].users,
                },
                "updateOneELEMENT"
              );
            }
          } else {
            let checkAllReady = false;

            // Check if all users are paused
            let checkAllPause = rooms[roomCode].users.every(
              (user) => user.isPause
            );

            // Check if all users are either ready to increment or paused
            let checkAllReadyIncrement = rooms[roomCode].users.every(
              (user) => user.incrementReady || user.isPause
            );

            // Update checkAllReady based on the conditions
            checkAllReady = checkAllReadyIncrement && !checkAllPause;

            if (checkAllReady) {
              rooms[roomCode].numberBegin += 1;
              rooms[roomCode].users.forEach((user) => {
                user.incrementReady = false;
              });
              emitUpdateRoom(
                roomCode,
                {
                  users: rooms[roomCode].users,
                  numberBegin: rooms[roomCode].numberBegin,
                },
                "updateOneELEMENT"
              );
            } else {
              emitUpdateRoom(
                roomCode,
                {
                  users: rooms[roomCode].users,
                },
                "updateOneELEMENT"
              );
            }
          }

          // emitUpdateRoom(roomCode, false, "updateOneELEMENT");
        }
        // if (ELEMENT === "isPause") {
        //   console.log("isPause push new update infor to Client");
        //   try {
        //     if (userIndex !== -1) {
        //       const incrementAllReady = rooms[roomCode].users.every(
        //         (user) => user.incrementReady || user.isPause
        //       );

        //       rooms[roomCode].incrementAllReady = incrementAllReady;
        //       emitUpdateRoom(roomCode, false, "updateOneELEMENT");
        //     }
        //   } catch (error) {
        //     console.log("Error handling incrementReadyChange event:", error);
        //   }
        // }
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
            emitUpdateRoom(
              roomCode,
              { users: rooms[roomCode].users },
              "getRoomList"
            );
          }
        }

        io.emit("roomListUpdate", getRoomList());
        io.emit("onlineNumber", connectedUsers);
      } catch (error) {
        console.error("Error handling getRoomList event:", error);
      }
    });

    // socket.on("setUserName", (userName) => {
    //   try {
    //     socket.userName = userName;
    //   } catch (error) {
    //     console.error("Error handling setUserName event:", error);
    //   }
    // });
  });
};
