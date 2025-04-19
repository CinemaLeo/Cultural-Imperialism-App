import React, { useState, useEffect } from "react";

const FullscreenToggle: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check fullscreen state on initial load
  useEffect(() => {
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // Listen for fullscreenchange event
    document.addEventListener("fullscreenchange", checkFullscreen);

    // Initial check in case the page is already in fullscreen
    checkFullscreen();

    return () => {
      document.removeEventListener("fullscreenchange", checkFullscreen);
    };
  }, []);

  const toggleFullscreen = () => {
    const doc = document.documentElement as HTMLElement;

    if (!document.fullscreenElement) {
      // Request fullscreen
      if (doc.requestFullscreen) {
        doc.requestFullscreen();
      } else if ((doc as any).webkitRequestFullscreen) {
        // Type assertion for WebKit browsers
        (doc as any).webkitRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Don't render the button if already in fullscreen
  if (isFullscreen) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "40px",
        left: "-11.5px",
        opacity: 0.6,
      }}
    >
      <button onClick={toggleFullscreen}>⛶</button>
    </div>
  );
};

export default FullscreenToggle;
