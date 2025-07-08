// components/animations/JournalAnimation.js
import React, { useEffect, useRef } from 'react';
import './JournalAnimation.css';

function JournalAnimation() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const waves = Array.from({ length: 4 }, (_, i) => ({
      offset: i * 100,
      speed: 0.15 + i * 0.03,
      opacity: 0.015 + i * 0.005,
      amplitude: 40 + i * 10,
      frequency: 0.015 + i * 0.003,
    }));

    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      waves.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, wave.offset);
        for (let x = 0; x <= width; x += 10) {
          const y =
            wave.offset +
            Math.sin((x + t * 60) * wave.frequency) * wave.amplitude;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${wave.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      t += 0.5;
      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="journal-canvas" />;
}

export default JournalAnimation;
