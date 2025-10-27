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

    // Complex network with more nodes
    const nodes = [
      { x: width * 0.1, y: height * 0.2 },
      { x: width * 0.3, y: height * 0.1 },
      { x: width * 0.5, y: height * 0.15, hub: true },
      { x: width * 0.7, y: height * 0.1 },
      { x: width * 0.9, y: height * 0.2 },
      { x: width * 0.2, y: height * 0.4 },
      { x: width * 0.5, y: height * 0.4 },
      { x: width * 0.8, y: height * 0.4 },
      { x: width * 0.1, y: height * 0.6 },
      { x: width * 0.3, y: height * 0.65 },
      { x: width * 0.5, y: height * 0.65, hub: true },
      { x: width * 0.7, y: height * 0.65 },
      { x: width * 0.9, y: height * 0.6 },
      { x: width * 0.4, y: height * 0.85 },
      { x: width * 0.6, y: height * 0.85 },
    ];

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 4],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [8, 9], [10, 13], [13, 14], [14, 11]
    ];

    const trains = edges.map(() => ({ t: Math.random(), speed: 0.002 + Math.random() * 0.002 }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw rails
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1.2;
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
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.shadowColor = 'white';
          ctx.shadowBlur = 10;
          ctx.fillRect(node.x - 6, node.y - 6, 12, 12);
          ctx.shadowBlur = 0;
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fill();
        }
      });

      // Draw trains as glowing floating segments (light food effect)
      edges.forEach(([i, j], idx) => {
        const a = nodes[i];
        const b = nodes[j];
        const train = trains[idx];

        train.t += train.speed;
        if (train.t > 1) train.t = 0;

        const segments = 5;
        for (let s = 0; s < segments; s++) {
          const t = train.t - s * 0.02;
          if (t < 0 || t > 1) continue;
          const x = a.x + (b.x - a.x) * t;
          const y = a.y + (b.y - a.y) * t;

          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.6 - s * 0.1})`;
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
