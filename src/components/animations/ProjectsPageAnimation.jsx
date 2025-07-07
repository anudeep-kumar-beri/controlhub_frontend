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

    // Define static node positions
    const nodes = [
      { x: 200, y: 100 },
      { x: 500, y: 150 },
      { x: 800, y: 300 },
      { x: 400, y: 400 },
      { x: 150, y: 300 },
      { x: 700, y: 550 },
    ];

    // Define edges (paths between nodes)
    const edges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [3, 5],
    ];

    // Moving particles (train blips)
    const particles = edges.map(() => ({ t: Math.random(), speed: 0.002 + Math.random() * 0.003 }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw edges
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      edges.forEach(([i, j]) => {
        const a = nodes[i];
        const b = nodes[j];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      // Draw nodes as filled squares
      nodes.forEach((node) => {
        const size = 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 4;
        ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
        ctx.shadowBlur = 0;
      });

      // Move and draw particles
      edges.forEach(([i, j], idx) => {
        const a = nodes[i];
        const b = nodes[j];
        const p = particles[idx];

        // Move t forward
        p.t += p.speed;
        if (p.t > 1) p.t = 0;

        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;

        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
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
