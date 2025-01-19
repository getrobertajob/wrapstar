const express = require("express");
const axios = require("axios");
const cors = require("cors");
const sharp = require("sharp");
require("dotenv").config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000; // Allow dynamic port binding


// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://wrapstar-robert-lutes-projects.vercel.app",
  // origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Log server startup
console.log(`Starting the server on port ${PORT}...`);

app.get("/search", async (req, res) => {
  const { q } = req.query;
  const apiKey = process.env.SERP_API_KEY; // Use environment variable for API key

  // Log incoming request for search
  console.log(`Search request received for: ${q}`);

  if (!apiKey) {
    console.error("API key is missing. Check environment variables.");
    return res.status(500).json({ error: "API key is missing. Check environment variables." });
  }

  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q,
        tbm: "isch",
        api_key: apiKey,
      },
    });

    console.log(`Search results returned for query: ${q}`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching search results:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy route to serve and preprocess images
app.get("/image", async (req, res) => {
  const { url } = req.query;
  console.log(`Image proxy request received for URL: ${url}`);

  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // Set CORS header specifically for image requests
    res.set("Access-Control-Allow-Origin", "*");  // Allow any origin (or specify a specific one if needed)

    // Crop the image to a square
    const imageBuffer = await sharp(response.data)
      .resize({
        width: 150, // Set square dimensions
        height: 150,
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy,
      })
      .toBuffer();

    res.set("Content-Type", "image/png"); // Convert all to PNG for consistency
    res.send(imageBuffer);
    console.log("Image processed and sent successfully.");
  } catch (error) {
    console.error("Error processing image:", error.message);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// Handle OPTIONS requests for CORS preflight
app.options("/image", (req, res) => {
  console.log("CORS preflight request received.");
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.status(200).end();
});

// Add a route to display "server is running"
app.get("/", (req, res) => {
  console.log("Root route hit: server is running.");
  res.send("server is running.");
});

// Log uncaught exceptions and unhandled promise rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Optionally, you can exit the process to prevent the server from running in an unstable state
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  // Optionally, exit on unhandled rejections
  process.exit(1);
});

// Start the server and log the event
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
