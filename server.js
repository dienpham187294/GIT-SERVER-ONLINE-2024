const port = process.env.PORT || 5000;
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const router = require("./router/io");

const app = express();

// Configure CORS
const corsOptions = {
  origin: "*", // Allow all origins, you can restrict this to specific domains
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
};

app.use(cors(corsOptions));

app.get("/message", (req, res) => {
  res.send("Hello from the backend!");
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins, you can restrict this to specific domains
    methods: ["GET", "POST"],
  },
});

router(io); // Pass the io instance to the router

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
