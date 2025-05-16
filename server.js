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
const { RegAnalyze } = require("./ulti/reg_analyze");
const { RegAnalyzeInPrac } = require("./ulti/reg_analyze_inprac");
const { GetDataPracInCustom } = require("./ulti/get_data_prac_in_custom");
const { sendmailDK } = require("./ulti/get_homework_and_email");
// Configure CORS

const googleTTS = require("google-tts-api");

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

/**
 * Route handler for analyzing transcript text against command lists
 * Expects JSON body with transcript, CMDlist, and numberTry fields
 */
app.post("/reg-Analyze", jsonParser, (req, res) => {
  try {
    // Validate required request parameters
    const { transcript, CMDlist } = req.body;

    if (!transcript || !CMDlist) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: transcript and CMDlist are required",
      });
    }

    // Process the request with RegAnalyze
    const analysisResults = RegAnalyze(transcript, CMDlist);

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Analysis completed successfully",
      data: analysisResults,
    });
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error in /reg-Analyze:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error processing request",
      error: error.message,
    });
  }
});

app.post("/reg-Analyze-in-prac", jsonParser, (req, res) => {
  try {
    // Validate required request parameters
    const { RegInput, CMDlist, regRate_01 } = req.body;

    if (!RegInput || !CMDlist) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: transcript and CMDlist are required",
      });
    }

    // Process the request with RegAnalyze
    const analysisResults = RegAnalyzeInPrac(RegInput, CMDlist, regRate_01);

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Analysis completed successfully",
      data: analysisResults,
    });
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error in /reg-Analyze:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error processing request",
      error: error.message,
    });
  }
});
app.post(
  "/reg-Analyze-get_data_prac_in_custom-prac",
  jsonParser,
  (req, res) => {
    try {
      // Validate required request parameters
      const {
        data_all,
        index_sets_t_get_pracData,
        filerSets,
        upCode,
        random,
        fsp,
      } = req.body;

      // Process the request with RegAnalyze
      const analysisResults = GetDataPracInCustom(
        data_all,
        index_sets_t_get_pracData,
        filerSets,
        upCode,
        random,
        fsp
      );

      // Return successful response
      return res.status(200).json({
        success: true,
        message: "Analysis completed successfully",
        data: analysisResults,
      });
    } catch (error) {
      // Handle any unexpected errors
      console.error("Error in /reg-Analyze:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error processing request",
        error: error.message,
      });
    }
  }
);

app.post("/mail-homework", jsonParser, (req, res) => {
  try {
    const { subjectText, contentText, toEmail } = req.body;

    if (!subjectText || !contentText) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: subjectText or contentText",
      });
    }

    // Use default email if toEmail is not provided
    const recipientEmail = toEmail || "dienpham187294@gmail.com";

    sendmailDK(subjectText, contentText, recipientEmail);

    return res.status(200).json({
      success: true,
      message: "Mail sent successfully",
    });
  } catch (error) {
    console.error("Error in /mail-homework:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error processing request",
      error: error.message,
    });
  }
});

// Server-side code - fixed version
app.post("/tts", async (req, res) => {
  const text = req.body.text;
  if (!text) return res.status(400).send("Missing text");
  console.log("tts request:", text);

  try {
    // getAudioUrl returns a Promise, so we need to await it
    const url = await googleTTS.getAudioUrl(text, {
      lang: "en",
      slow: false,
      host: "https://translate.google.com",
    });

    console.log("Generated TTS URL:", url);

    // Option 1: Fetch the audio data and proxy it through your server
    // This can help bypass any CORS or referer restrictions
    /* 
    const audioResponse = await fetch(url, {
      headers: {
        'Referer': 'https://translate.google.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
    }
    
    const audioBuffer = await audioResponse.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
    */

    // Option 2: Just return the URL (current approach)
    res.json({
      success: true,
      audioUrl: url,
      // For compatibility with code expecting audioUrls
      audioUrls: [
        {
          url: url,
          text: text,
        },
      ],
    });
  } catch (err) {
    console.error("TTS Error:", err);
    res.status(500).json({
      success: false,
      error: "TTS failed: " + err.message,
    });
  }
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
