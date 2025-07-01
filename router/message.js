module.exports = (io) => {
  // Lưu trữ lịch sử tin nhắn theo nhóm
  let messageHistory = {
    all: [],
    group1: [],
    group2: [],
    group3: [],
    group4: [],
    group5: [],
    group6: [],
    group7: [],
    group8: [],
    group9: [],
    group10: [],
  };

  let messageNotifyHistory = [];

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Gửi số người online
    socket.emit("onlineNumber", io.engine.clientsCount);

    // Gửi lịch sử tin nhắn cho client mới kết nối
    // Kết hợp tất cả tin nhắn từ các nhóm và thông báo
    const allMessages = [];
    Object.keys(messageHistory).forEach((group) => {
      messageHistory[group].forEach((msg) => {
        allMessages.push(msg);
      });
    });

    socket.emit(
      "messageHistory",
      allMessages.concat(messageNotifyHistory.slice(-5))
    );

    // Xử lý tin nhắn thường
    socket.on("message", (message) => {
      try {
        // Xác định nhóm (mặc định là 'all' nếu không có)
        const group = message.group || "all";

        // Xử lý lệnh xóa lịch sử
        if (message.text.includes("CMD_clear")) {
          // Xóa tất cả lịch sử tin nhắn và thông báo
          Object.keys(messageHistory).forEach((key) => {
            messageHistory[key] = [];
          });
          messageNotifyHistory = [];

          console.log("Message history cleared");
        } else {
          // Thêm tin nhắn vào nhóm tương ứng
          if (messageHistory[group]) {
            messageHistory[group].push(message);

            // Giới hạn số tin nhắn trong mỗi nhóm (tối đa 50 tin nhắn)
            if (messageHistory[group].length > 50) {
              messageHistory[group].shift(); // Xóa tin nhắn cũ nhất
            }
          }
        }

        // Phát tin nhắn tới tất cả client
        io.emit("message", message);
        console.log(`Message received in ${group}: `, message);
      } catch (error) {
        console.error("Error handling message event:", error);
      }
    });

    // Xử lý tin nhắn đăng ký/thông báo
    socket.on("messageReg", (message) => {
      try {
        // Lọc bỏ các phần tử trùng id
        messageNotifyHistory = messageNotifyHistory.filter(
          (item) => item.id !== message.id
        );

        // Thêm message vào cuối mảng
        messageNotifyHistory.push(message);

        // Giới hạn số thông báo (tối đa 20 thông báo)
        if (messageNotifyHistory.length > 20) {
          messageNotifyHistory.shift();
        }

        io.emit("message", message);
        console.log("Notification message received: ", message);
      } catch (error) {
        console.error("Error handling messageReg event:", error);
      }
    });

    // Xử lý khi client ngắt kết nối
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      // Cập nhật số người online cho tất cả client còn lại
      io.emit("onlineNumber", io.engine.clientsCount);
    });

    // Thêm event để lấy thống kê nhóm chat
    socket.on("getGroupStats", () => {
      const stats = {};
      Object.keys(messageHistory).forEach((group) => {
        stats[group] = messageHistory[group].length;
      });

      socket.emit("groupStats", {
        groups: stats,
        notifications: messageNotifyHistory.length,
        onlineUsers: io.engine.clientsCount,
      });
    });

    // Event để xóa lịch sử một nhóm cụ thể
    socket.on("clearGroupHistory", (groupName) => {
      try {
        if (messageHistory[groupName]) {
          messageHistory[groupName] = [];
          io.emit("message", {
            text: `Lịch sử nhóm ${groupName} đã được xóa`,
            time:
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }) + " System",
            group: groupName,
            type: "system",
          });
          console.log(`Group ${groupName} history cleared`);
        }
      } catch (error) {
        console.error("Error clearing group history:", error);
      }
    });

    // Event để chuyển tin nhắn giữa các nhóm
    socket.on("moveMessage", (data) => {
      try {
        const { fromGroup, toGroup, messageIndex } = data;

        if (
          messageHistory[fromGroup] &&
          messageHistory[toGroup] &&
          messageIndex >= 0 &&
          messageIndex < messageHistory[fromGroup].length
        ) {
          const message = messageHistory[fromGroup].splice(messageIndex, 1)[0];
          message.group = toGroup;
          messageHistory[toGroup].push(message);

          // Thông báo về việc chuyển tin nhắn
          io.emit("message", {
            text: `Tin nhắn đã được chuyển từ ${fromGroup} sang ${toGroup}`,
            time:
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }) + " System",
            group: "all",
            type: "system",
          });

          console.log(`Message moved from ${fromGroup} to ${toGroup}`);
        }
      } catch (error) {
        console.error("Error moving message:", error);
      }
    });
  });

  // Hàm để lấy thống kê tổng quan
  const getOverallStats = () => {
    let totalMessages = 0;
    const groupStats = {};

    Object.keys(messageHistory).forEach((group) => {
      const count = messageHistory[group].length;
      groupStats[group] = count;
      totalMessages += count;
    });

    return {
      totalMessages,
      groupStats,
      notifications: messageNotifyHistory.length,
      groups: Object.keys(messageHistory).length,
    };
  };

  // Log thống kê mỗi 30 phút
  setInterval(() => {
    const stats = getOverallStats();
    console.log("=== CHAT STATISTICS ===");
    console.log(`Total messages: ${stats.totalMessages}`);
    console.log(`Total notifications: ${stats.notifications}`);
    console.log(`Active groups: ${stats.groups}`);
    console.log("Messages per group:", stats.groupStats);
    console.log("=======================");
  }, 30 * 60 * 1000); // 30 phút

  return { getOverallStats, messageHistory, messageNotifyHistory };
};
