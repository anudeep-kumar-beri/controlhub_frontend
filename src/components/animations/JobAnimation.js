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
    const beams = [];

    const paths = 8;
    const spacing = width / paths;

    for (let i = 0; i < 30; i++) {
      const path = Math.floor(Math.random() * paths);
      beams.push({
        x: spacing * path + spacing / 2,
        y: height + Math.random() * height,
        speed: 1 + Math.random() * 1.5,
        redirectChance: Math.random() * 0.05
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      beams.forEach(beam => {
        // Draw beam
        const gradient = ctx.createLinearGradient(beam.x, beam.y, beam.x, beam.y - 50);
        gradient.addColorStop(0, 'rgba(255,255,255,0.08)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(beam.x - 1, beam.y - 50, 2, 50);

        // Move beam upward
        beam.y -= beam.speed;

        // Random reroute at "intersections"
        if (Math.random() < beam.redirectChance) {
          const shift = Math.random() < 0.5 ? -1 : 1;
          beam.x += spacing * shift;
          beam.x = Math.max(spacing / 2, Math.min(width - spacing / 2, beam.x));
        }

        // Reset
        if (beam.y < -60) {
          beam.y = height + Math.random() * 50;
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
