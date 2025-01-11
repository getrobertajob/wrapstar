const express = require("express");
const axios = require("axios");
const cors = require("cors");
const sharp = require("sharp");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/search", async (req, res) => {
  const { q } = req.query; // Get the query parameter (celebrity name)
  const apiKey = "bbd0fbadedfed472275f5149d0eddb03cbc9a18c238b573b2dcf1c96599590c7";

  try {
    const response = await axios.get(`https://serpapi.com/search`, {
      params: {
        q,
        tbm: "isch",
        api_key: apiKey,
      },
    });

    // Return the search results
    res.json(response.data);
  } catch (error) {
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
        width: 150, // Set square dimensions (adjust as needed)
        height: 150,
        fit: sharp.fit.cover, // Ensures the image is cropped to fit a square
        position: sharp.strategy.entropy, // Focuses on the most "interesting" part
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
app.get('/', (req, res) => {
  res.send("server is running.");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
