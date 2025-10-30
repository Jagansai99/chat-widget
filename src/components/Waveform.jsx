import { useEffect, useRef } from "react";

// Define the maximum number of dots we want to show on the screen at any time
const MAX_DOTS = 100;
const dotSpacing = 6;
const scrollSpeed = 0.5; // Controls how fast new dots appear

const Waveform = ({ isListening }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  // History now stores objects: { v: amplitude, isPeak: boolean }
  const historyBufferRef = useRef([]);

  useEffect(() => {
    // --- Cleanup and Initialization ---
    if (!isListening) {
      cancelAnimationFrame(animationRef.current);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx)
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      historyBufferRef.current = []; // Clear history when stopped
      return;
    }

    let audioCtx, analyser, dataArray, source, stream;
    let offset = 0;
    const volumeThreshold = 0.15; // Threshold for triggering a peak line

    // Request microphone access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((mediaStream) => {
        stream = mediaStream;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        analyser.fftSize = 32;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        const dataPointIndex = 0;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // --- Draw Loop ---
        const draw = () => {
          animationRef.current = requestAnimationFrame(draw);
          analyser.getByteTimeDomainData(dataArray);

          const width = canvas.width;
          const height = canvas.height;
          const centerLine = height / 2;
          const AMPLITUDE_MULTIPLIER = 2.5;
          const dotRadius = 1.5;
          const dotColor = "#8b5cf6";

          ctx.clearRect(0, 0, width, height); // Clear the whole canvas every frame

          // 1. --- Update Scroll Offset and History Buffer ---

          const currentV = (dataArray[dataPointIndex] - 128) / 128.0;

          offset += scrollSpeed;

          if (offset >= dotSpacing) {
            offset = 0;

            // Determine if the incoming data point should be marked as a peak
            const newIsPeak = Math.abs(currentV) > volumeThreshold;

            // Store the data point as an object {v, isPeak}
            historyBufferRef.current.unshift({
              v: currentV,
              isPeak: newIsPeak,
            });

            if (historyBufferRef.current.length > MAX_DOTS) {
              historyBufferRef.current.pop();
            }
          }

          // 2. --- Draw Dots AND Persistent Peak Lines from History Buffer ---

          const maxDisplacement = height / 2 - dotRadius;

          for (let i = 0; i < historyBufferRef.current.length; i++) {
            const { v, isPeak } = historyBufferRef.current[i]; // Destructure data

            // Calculate coordinates for both dot and peak line
            const x = width - i * dotSpacing - offset;
            const y = centerLine + v * maxDisplacement * AMPLITUDE_MULTIPLIER;

            // Draw dot
            if (x > 0) {
              ctx.fillStyle = dotColor;
              ctx.beginPath();
              ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
              ctx.fill();
            }

            // **CRITICAL FIX: Draw the Peak Line if the history point was a peak**
            if (isPeak && x > 0) {
              const peakHeight = height * Math.abs(v) * 1.8;

              ctx.beginPath();
              ctx.strokeStyle = dotColor;
              ctx.lineWidth = 2;

              // Draw the vertical line centered on the X position
              ctx.moveTo(x, centerLine - peakHeight / 2);
              ctx.lineTo(x, centerLine + peakHeight / 2);
              ctx.stroke();
            }
          }
        };

        draw();
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
      });

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioCtx) audioCtx.close();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [isListening]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={40}
      style={{
        width: "100%",
        height: "40px",
        backgroundColor: "transparent",
      }}
    />
  );
};

export default Waveform;
