import React, { useState } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import "./App.css";

const App = () => {
  const [celebrity, setCelebrity] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!celebrity) return alert("Please enter a celebrity's name!");

    setLoading(true);
    try {
      const searchQuery = `${celebrity} headshot`;
      const response = await axios.get("https://wrapstar-server.vercel.app/search", {
        params: { q: searchQuery },
      });

      const imagesResults = response.data.images_results.slice(0, 25);
      setImages(imagesResults);
    } catch (error) {
      console.error("Error fetching images:", error);
      alert("Failed to fetch images. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveGridAsImage = () => {
    if (images.length === 0) {
      alert("No images to save!");
      return;
    }

    const galleryElement = document.querySelector(".gallery");

    html2canvas(galleryElement, {
      useCORS: true,
      allowTaint: true,
    }).then((canvas) => {
      const gridCanvas = canvas;
      const gridWidth = gridCanvas.width;
      const gridHeight = gridCanvas.height;

      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");

      const finalGridSize = 4;
      finalCanvas.width = gridWidth * finalGridSize;
      finalCanvas.height = gridHeight * finalGridSize;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      for (let row = 0; row < finalGridSize; row++) {
        for (let col = 0; col < finalGridSize; col++) {
          const x = col * gridWidth;
          const y = row * gridHeight;
          ctx.drawImage(gridCanvas, x, y);
        }
      }

      const link = document.createElement("a");
      link.download = `${celebrity}_headshots_4x4_grid.png`;
      link.href = finalCanvas.toDataURL("image/png");
      link.click();
    });
  };

  return (
    <div className="App">
      <h1>WrapStar</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Enter celebrity name"
          value={celebrity}
          onChange={(e) => setCelebrity(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      <div className="gallery">
        {images.length > 0 ? (
          images.map((image, index) => (
            <img
              key={index}
              src={`https://wrapstar-robert-lutes-projects.vercel.app/image?url=${encodeURIComponent(image.thumbnail || image.original)}`}
              alt={`Headshot ${index + 1}`}
              className="image"
            />
          ))
        ) : (
          !loading && <p>No images found</p>
        )}
      </div>

      {images.length > 0 && (
        <button className="save-button" onClick={saveGridAsImage}>
          Save as wrapping paper
        </button>
      )}
    </div>
  );
};

export default App;
