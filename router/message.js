module.exports = (io) => {
  let messageHistory = [];
  let messageNotifyHistory = [];
  io.on("connection", (socket) => {
    socket.emit("onlineNumber", io.engine.clientsCount);

    socket.emit(
      "messageHistory",
      messageHistory.concat(messageNotifyHistory.slice(-5))
    );

    socket.on("message", (message) => {
      try {
        // Adds the new message to the history
        if (message.text.includes("CMD_clear")) {
          messageHistory = []; // Clears the message history
          messageNotifyHistory = [];
        } else {
          messageHistory.push(message);
          if (messageHistory.length > 5) {
            messageHistory.shift(); // Xóa phần tử đầu tiên (cũ nhất)
          }
        }
        io.emit("message", message); // Emits the new message to all connected clients
        console.log("Message receivedA: ", message);
      } catch (error) {
        console.error("Error handling message event:", error);
      }
    });

    socket.on("messageReg", (message) => {
      try {
        // Lọc bỏ các phần tử trùng id
        messageNotifyHistory = messageNotifyHistory.filter(
          (item) => item.id !== message.id
        );
        // Thêm message vào cuối mảng
        messageNotifyHistory.push(message);
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
