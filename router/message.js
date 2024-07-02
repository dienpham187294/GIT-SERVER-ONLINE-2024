module.exports = (io) => {
  const messageHistory = [];

  io.on("connection", (socket) => {
    socket.emit("onlineNumber", io.engine.clientsCount);

    socket.emit("messageHistory", messageHistory);

    socket.on("message", (message) => {
      try {
        console.log("Message received: ", message);
        messageHistory.push(message);
        io.emit("message", message);
      } catch (error) {
        console.error("Error handling message event:", error);
      }
    });

    socket.on("disconnect", () => {
      io.emit("onlineNumber", io.engine.clientsCount);
    });
  });
};
