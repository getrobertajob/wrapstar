const express = require("express");
const axios = require("axios");
const cors = require("cors");
const sharp = require("sharp");
require("dotenv").config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000; // Allow dynamic port binding

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://wrapstar-eh0kxhamn-robert-lutes-projects.vercel.app", // Replace with your frontend's deployed URL
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.get("/search", async (req, res) => {
  const { q } = req.query;
  const apiKey = process.env.SERP_API_KEY; // Use environment variable for API key

  if (!apiKey) {
    return res.status(500).json({ error: "API key is missing. Check environment variables." });
  }

  try {
    const response = await axios.get(`https://serpapi.com/search`, {
      params: {
        q,
        tbm: "isch",
        api_key: apiKey,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching search results:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy route to serve and preprocess images
app.get("/image", async (req, res) => {
  const { url } = req.query;

  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });

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
  } catch (error) {
    console.error("Error processing image:", error.message);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// Add a route to display "server is running"
app.get("/", (req, res) => {
  res.send("server is running.");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
