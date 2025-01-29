// Imports
import React, { useState, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";
import html2canvas from "html2canvas";
import "./App.css";

// 2 options for "backendUrl", hosted server & localhost 
const backendUrl = "https://wrapstar-server.vercel.app";
// const backendUrl = "http://localhost:5000";

// variable to designate which file types are allowed
const ITEM_TYPE = "IMAGE";

// function for drag & drop images
// part 1 includes drag
const DraggableImage = ({ image, index, moveImage, removeImage }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // part 2 includes drop
  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveImage(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  // return for drag & drop function
  return (
    <div
      ref={(node) => drag(drop(node))}
      className="image-wrapper"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="remove-button" onClick={() => removeImage(index)}>
        ✖
      </div>
      <img
        src={
          image.custom
            ? image.src
            : `${backendUrl}/image?url=${encodeURIComponent(image.thumbnail || image.original)}`
        }
        alt={`Gallery Image ${index + 1}`}
        className="image"
      />
    </div>
  );
};

// function container for app functions
const App = () => {
  const [celebrity, setCelebrity] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customImages, setCustomImages] = useState([]);
  const galleryRef = useRef(null); // Ref for capturing the gallery snapshot

  // fucntion to take user input for API search
  const handleSearch = async () => {
    if (!celebrity) return alert("Please enter a celebrity's name!");

    setLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/search?q=${encodeURIComponent(celebrity)}+headshot`
      );
      const imagesResults = response.data.images_results.slice(0, 25);

      // convert image to a Blob URL
      // added because issue with backend not handling direct URL correctly when some URLs were different
      // this makes then all the same formatting
      const processedImages = await Promise.all(
        imagesResults.map(async (img) => {
          try {
            const imgResponse = await fetch(
              `${backendUrl}/image?url=${encodeURIComponent(img.thumbnail || img.original)}`
            );
            const blob = await imgResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            return { custom: true, src: objectUrl };
          } catch (err) {
            console.error("Error processing image:", err);
            return null; // added to skip any images that fail to load
          }
        })
      );

      setImages(processedImages.filter(Boolean)); // added to remove any images that failed to load
    } catch (error) {
      console.error("Error fetching images:", error);
      alert("Failed to fetch images. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // function to handle folder selection process by prompting OS selection and file type filter
  const handleFolderSelection = (event) => {
    const files = Array.from(event.target.files);

    // these are the accepted file types
    const allowedExtensions = ["png", "gif", "tiff", "tif", "jpeg", "jpg", "bmp", "raw"];

    // also check file type by MIME properties for improved accuracy
    // added since some file extentions are capitalized or are the same but just different enough to not count by file extension
    // example .jpg vs .JPG vs .jpeg
    const allowedMimeTypes = ["image/png", "image/gif", "image/tiff", "image/jpeg", "image/bmp"];

    const imageFiles = files.filter((file) => {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      const fileMimeType = file.type;

      console.log(`File: ${file.name}, Extension: ${fileExtension}, MIME Type: ${fileMimeType}`);

      // check if the extension or the MIME type is valid as an additive check
      return allowedExtensions.includes(fileExtension) || allowedMimeTypes.includes(fileMimeType);
    });

    // message if no files found
    if (imageFiles.length === 0) {
      alert(
        "No valid image files selected! Please choose PNG, GIF, TIFF, JPEG, JPG, BMP, or RAW files."
      );
      return;
    }

    // to add the images from files to the useState of the image selection folder
    const imageUrls = imageFiles.map((file) => URL.createObjectURL(file));
    setCustomImages(imageUrls);
  };

  // function to handle populating gallery with custom images form the selection folder
  const handleCustomImageClick = (src) => {
    setImages((prevImages) => {
      if (prevImages.length >= 25) {
        alert("Gallery is full! You can only add up to 25 images.");
        return prevImages;
      }
      return [...prevImages, { custom: true, src }];
    });
  };

  // function to remove images from gallery when their red X is clicked
  const handleRemoveImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // function to update the location of images when one is drag & dropped
  const moveImage = (fromIndex, toIndex) => {
    setImages((prevImages) => {
      const updatedImages = [...prevImages];
      const [movedImage] = updatedImages.splice(fromIndex, 1);
      updatedImages.splice(toIndex, 0, movedImage);
      return updatedImages;
    });
  };

  // function to handle when user clicks on save button
  const handleSaveImage = async () => {
    // to hide the red X before file save
    document.querySelectorAll(".remove-button").forEach((btn) => {
      btn.style.visibility = "hidden";
    });

    // to disable image-placeholder borders
    document.querySelectorAll(".image-placeholder").forEach((placeholder) => {
      placeholder.style.border = "none";
    });

    // to use html2canvas library to capture the image gallery
    const canvas = await html2canvas(galleryRef.current);
    const base64Image = canvas.toDataURL("image/png");

    // to hide the red X before file save
    document.querySelectorAll(".remove-button").forEach((btn) => {
      btn.style.visibility = "visible";
    });

    // to restore image-placeholder borders
    document.querySelectorAll(".image-placeholder").forEach((placeholder) => {
      placeholder.style.border = "2px dashed gray"; // Restore original border
    });

    // to create a new canvas for all 400 images (20x20 grid of the captured gallery)
    const finalCanvas = document.createElement("canvas");
    const ctx = finalCanvas.getContext("2d");
    finalCanvas.width = canvas.width * 4;
    finalCanvas.height = canvas.height * 4;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.drawImage(canvas, col * canvas.width, row * canvas.height);
      }
    }

    // to save the newly created file
    const finalImage = finalCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = finalImage;
    link.download = "WrapStar_Gallery.png";
    link.click();
  };

  // html for the page
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <h1>WrapStar</h1>
        <div className="content-container">
          <div className="custom-images-container">
            <h2>Use your own custom images</h2>
            <p className="folder-text">( png, gif, jpg, bmp, raw )</p>
            <label htmlFor="folderInput" className="select-folder-button">
              Select image folder
            </label>
            <p className="folder-text">click images to add</p>
            <input
              id="folderInput"
              type="file"
              webkitdirectory="true"
              accept="image/*"
              multiple
              onChange={handleFolderSelection}
              style={{ display: "none" }}
            />
            <div className="custom-image-box">
              {customImages.length > 0 ? (
                customImages.map((src, index) => (
                  <img
                    key={index}
                    src={src}
                    alt="Custom"
                    className="custom-image-thumbnail"
                    onClick={() => handleCustomImageClick(src)}
                  />
                ))
              ) : (
                <p className="custom-placeholder-text">No images selected</p>
              )}
            </div>
          </div>

          <div className="main-content">
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
            <p className="gallery-text">drag & drop images to move them</p>

            <div id="gallery-container" ref={galleryRef} className="gallery">
              {Array.from({ length: 25 }).map((_, index) => (
                <div key={index} className="image-placeholder">
                  {images[index] ? (
                    <DraggableImage
                      image={images[index]}
                      index={index}
                      moveImage={moveImage}
                      removeImage={handleRemoveImage}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div>
            <button className="save-button" onClick={handleSaveImage}>
              Save as PNG
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;
