module.exports = (io) => {
  let messageHistory = [];
  io.on("connection", (socket) => {
    socket.emit("onlineNumber", io.engine.clientsCount);

    socket.emit("messageHistory", messageHistory);

    socket.on("message", (message) => {
      try {
        // Adds the new message to the history
        if (message.text.includes("CMD_clear")) {
          messageHistory = []; // Clears the message history
        } else {
          messageHistory.push(message);
        }
        io.emit("message", message); // Emits the new message to all connected clients
        console.log("Message receivedA: ", message);
      } catch (error) {
        console.error("Error handling message event:", error);
      }
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
