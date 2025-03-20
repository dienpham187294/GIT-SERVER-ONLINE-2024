module.exports = (io) => {
  const messageHistory = [];
  io.on("connection", (socket) => {
    socket.emit("onlineNumber", io.engine.clientsCount);

    socket.emit("messageHistory", messageHistory);

    socket.on("message", (message) => {
      try {
        messageHistory.push(message); // Adds the new message to the history
        io.emit("message", message); // Emits the new message to all connected clients
        console.log("Message received: ", message);
      } catch (error) {
        console.error("Error handling message event:", error);
      }
      try {
        if (message.includes("CMD_clear")) {
          messageHistory = []; // Clears the message history
        }
      } catch (error) {}
    });

    socket.on("messageReg", (message) => {
      try {
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
