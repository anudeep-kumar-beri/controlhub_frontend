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

    // Define nodes (stations)
    const nodes = [
      { x: 100, y: 120 },
      { x: 300, y: 100 },
      { x: 600, y: 180 },
      { x: 850, y: 300 },
      { x: 400, y: 400 },
      { x: 180, y: 350 },
      { x: 700, y: 500 },
      { x: 1200, y: 200 },
    ];

    // Define connections (route curves)
    const paths = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [4, 6],
      [6, 7]
    ];

    // Train particles: one per path
    const trains = paths.map(() => ({
      t: Math.random(), // progress along path
      speed: 0.001 + Math.random() * 0.002
    }));

    function getControlPoint(a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const offset = 0.2;
      return {
        x: mx - dy * offset,
        y: my + dx * offset
      };
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Edges (curves)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      paths.forEach(([i, j]) => {
        const a = nodes[i];
        const b = nodes[j];
        const cp = getControlPoint(a, b);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cp.x, cp.y, b.x, b.y);
        ctx.stroke();
      });

      // Stations (nodes)
      nodes.forEach((node, index) => {
        const size = index % 2 === 0 ? 8 : 5; // hubs bigger
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 4;
        ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
        ctx.shadowBlur = 0;
      });

      // Trains
      paths.forEach(([i, j], idx) => {
        const a = nodes[i];
        const b = nodes[j];
        const cp = getControlPoint(a, b);
        const train = trains[idx];

        train.t += train.speed;
        if (train.t > 1) train.t = 0;

        const t = train.t;
        const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * cp.x + t ** 2 * b.x;
        const y = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * cp.y + t ** 2 * b.y;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
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
