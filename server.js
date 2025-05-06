const port = process.env.PORT || 5000;
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const routerIO = require("./router/io");
const message = require("./router/message");
// const getData_for_practicing = require("./router/data_practicing_post");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
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

// Add body parser middleware - THIS IS CRUCIAL
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the server!");
});

app.get("/message", (req, res) => {
  res.send("Hello from the backend!");
});

// Add GET route for /test
app.get("/test", (req, res) => {
  console.log("GET test success", req.query);
  res.json({ message: "Success from GET /test" });
});

// Keep the existing POST route for /test
app.post("/test", jsonParser, (req, res) => {
  console.log("POST test success", req.body);
  res.json({ message: "Success from POST /test" });
});

// Create the server
const server = http.createServer(app);

// Setup Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Pass the io instance to the router modules
routerIO(io);
message(io);
// getData_for_practicing();

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Available routes:`);
  console.log(`- GET / - Welcome message`);
  console.log(`- GET /message - Backend message`);
  console.log(`- GET /test - Test endpoint (GET)`);
  console.log(`- POST /test - Test endpoint (POST)`);
});
