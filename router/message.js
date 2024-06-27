module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("message", (message) => {
      try {
        console.log("Message received: ", message);
        io.emit("message", message);
      } catch (error) {
        console.error("Error handling message event:", error);
      }
    });
  });
};
