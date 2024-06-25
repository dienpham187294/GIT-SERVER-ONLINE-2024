module.exports = (io) => {
  const rooms = {};
  let connectedUsers = 0;

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    connectedUsers++;
    io.emit("onlineNumber", connectedUsers);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      connectedUsers--;
      io.emit("onlineNumber", connectedUsers);

      // Duyệt qua các phòng và cập nhật lại danh sách phòng
      for (const roomCode in rooms) {
        // Loại bỏ người dùng ngắt kết nối khỏi phòng
        rooms[roomCode].users = rooms[roomCode].users.filter(
          (user) => user.id !== socket.id
        );

        // Nếu phòng không còn người dùng, xóa phòng
        if (rooms[roomCode].users.length === 0) {
          delete rooms[roomCode];
        } else {
          // Nếu phòng vẫn còn người dùng, cập nhật thông tin phòng
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

      // Cập nhật và phát danh sách phòng hiện tại
      io.emit("roomListUpdate", getRoomList());
    });

    socket.on("createRoom", (objInformationOfGame, callback) => {
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
        isReady: false,
        incrementReady: false,
      });
      callback(roomCode);
      io.emit("roomListUpdate", getRoomList());
    });

    socket.on("joinRoom", (roomCode) => {
      if (rooms[roomCode]) {
        const existingUser = rooms[roomCode].users.find(
          (user) => user.id === socket.id
        );

        if (!existingUser) {
          socket.join(roomCode);
          rooms[roomCode].users.push({
            id: socket.id,
            isReady: false,
            incrementReady: false,
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
    });

    socket.on("userReadyChange", (roomCode, isReady) => {
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
    });

    socket.on("incrementReadyChange", (roomCode, incrementReady) => {
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
    });

    socket.on("incrementNumberBegin", (roomCode) => {
      if (rooms[roomCode] && rooms[roomCode].incrementAllReady) {
        rooms[roomCode].numberBegin += 1;
        rooms[roomCode].users.forEach((user) => (user.incrementReady = false));
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
    });

    socket.on("getRoomList", () => {
      io.emit("roomListUpdate", getRoomList());
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
