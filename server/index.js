const express = require("express");
const axios = require("axios");
const cors = require("cors");
const sharp = require("sharp");
require("dotenv").config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;



// 2 options for "allowedOrigins", hosted server & localhost 
const allowedOrigins = [
  // "http://localhost:3000"
  "https://wrapstar.vercel.app", 
  "https://wrapstar-server.vercel.app",
  "https://wrapstar-robert-lutes-projects.vercel.app"
];

// CORS config
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// to log that the server has started and which port
console.log(`Starting the server on port ${PORT}...`);

// call to get search results
app.get("/search", async (req, res) => {
  const { q } = req.query;
  const apiKey = process.env.SERP_API_KEY; // Use environment variable for API key

  // to log request for search
  console.log(`Search request received for: ${q}`);

  if (!apiKey) {
    console.error("API key is missing. Check environment variables."); // just to validate if the host has the apiKey locally instead of stored in code
    return res.status(500).json({ error: "API key is missing. Check environment variables." });
  }

  // initialize API connection
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q,
        tbm: "isch",
        api_key: apiKey,
      },
    });

    // to log the search query
    console.log(`Search results returned for query: ${q}`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching search results:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// proxy route to serve and preprocess images
app.get("/image", async (req, res) => {
  const { url } = req.query;
  console.log(`Image proxy request received for URL: ${url}`);

  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // to set CORS header for image requests
    res.set("Access-Control-Allow-Origin", "*");  // to set origin (or specify a specific one if needed)

    // to force image to a square by cropping the long edge
    // partially only works because the key word appended to the query "headshot" typically centers the face anyways
    const imageBuffer = await sharp(response.data)
      .resize({
        width: 150,
        height: 150,
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy,
      })
      .toBuffer();

    res.set("Content-Type", "image/png"); // to convert all to PNG for consistency during handleing
    res.send(imageBuffer);
    console.log("Image processed and sent successfully.");
  } catch (error) {
    console.error("Error processing image:", error.message);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// CORS call options
app.options("/image", (req, res) => {
  console.log("CORS preflight request received.");
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.status(200).end();
});

// route to display confirmaiton that the server is running
app.get("/", (req, res) => {
  console.log("Root route hit: server is running.");
  res.send("server is running.");
});

// to log uncaught exceptions and unhandled promise rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Optionally, you can exit the process to prevent the server from running in an unstable state
  process.exit(1);
});

// to exit on unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

// to initialize the server and log confirmation with port number 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
