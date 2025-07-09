// components/animations/JobAnimation.js
import React, { useEffect, useRef } from 'react';
import './JobAnimation.css';

function JobAnimation() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const paths = 8;
    const spacing = width / paths;
    const beams = [];

    for (let i = 0; i < 15; i++) {
      const path = Math.floor(Math.random() * paths);
      beams.push({
        path,
        x: spacing * path + spacing / 2,
        y: height + Math.random() * height,
        speed: 1 + Math.random() * 1.2,
        redirectChance: Math.random() * 0.03
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Draw elevator tracks
      for (let i = 0; i < paths; i++) {
        const x = spacing * i + spacing / 2;
        const gradient = ctx.createLinearGradient(x, height / 2, x, height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)');

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.moveTo(x, height / 2);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw lifts
      beams.forEach(beam => {
        const x = spacing * beam.path + spacing / 2;
        const y = beam.y;
        const length = 60;

        const gradient = ctx.createLinearGradient(x, y, x, y - length);
        gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
        gradient.addColorStop(0.8, 'rgba(255,255,255,0.1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x - 2, y - length, 4, length);

        beam.y -= beam.speed;

        // Reroute beam at intersections
        if (Math.random() < beam.redirectChance) {
          const direction = Math.random() < 0.5 ? -1 : 1;
          beam.path += direction;
          if (beam.path < 0) beam.path = 0;
          if (beam.path >= paths) beam.path = paths - 1;
        }

        if (beam.y < height / 2 - 100) {
          beam.y = height + Math.random() * 100;
        }
      });

      requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="job-canvas" />;
}

export default JobAnimation;
