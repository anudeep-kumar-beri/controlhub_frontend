// src/components/animations/ProjectAnimation.js
import React, { useEffect, useRef } from 'react';
import './ProjectAnimation.css';

export default function ProjectAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Define realistic station layout
    const nodes = [
      { x: width * 0.2, y: height * 0.2, hub: true },
      { x: width * 0.5, y: height * 0.15 },
      { x: width * 0.8, y: height * 0.2, hub: true },
      { x: width * 0.25, y: height * 0.5 },
      { x: width * 0.5, y: height * 0.5 },
      { x: width * 0.75, y: height * 0.5 },
      { x: width * 0.2, y: height * 0.8 },
      { x: width * 0.5, y: height * 0.85 },
      { x: width * 0.8, y: height * 0.8, hub: true },
      { x: width * 0.5, y: height * 0.65 }
    ];

    const edges = [
      [0, 1], [1, 2],
      [0, 3], [3, 4], [4, 5], [5, 2],
      [3, 6], [6, 7], [7, 8],
      [4, 9], [9, 7]
    ];

    const trains = edges.map(() => ({
      t: Math.random(),
      speed: 0.002 + Math.random() * 0.0015,
      delay: Math.random() * 1000
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw edges
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      edges.forEach(([i, j]) => {
        const a = nodes[i];
        const b = nodes[j];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((node) => {
        if (node.hub) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowColor = 'white';
          ctx.shadowBlur = 8;
          ctx.fillRect(node.x - 5, node.y - 5, 10, 10);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(node.x - 3, node.y - 3, 6, 6);
        }
      });

      // Draw trains
      edges.forEach(([i, j], idx) => {
        const train = trains[idx];
        train.t += train.speed;
        if (train.t > 1) train.t = 0;

        const a = nodes[i];
        const b = nodes[j];
        const trailLength = 3;

        for (let k = 0; k < trailLength; k++) {
          const t = train.t - k * 0.02;
          if (t < 0 || t > 1) continue;
          const x = a.x + (b.x - a.x) * t;
          const y = a.y + (b.y - a.y) * t;

          ctx.beginPath();
          ctx.arc(x, y, 2.5 - k * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.5 - k * 0.15})`;
          ctx.fill();
        }
      });

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="project-canvas-animation" />;
}
