const port = process.env.PORT || 5000;
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const router = require("./router/io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({}));

app.get("/message", (req, res) => {
  // Your logic to handle the request and send the message
  res.send("Hello from the backend!");
});

router(io); // Pass the io instance to the router

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
