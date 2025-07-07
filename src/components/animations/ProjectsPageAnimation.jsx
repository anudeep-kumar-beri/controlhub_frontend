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

    // Generate nodes in a grid-like pattern
    const nodes = [];
    const spacing = 200;
    for (let x = spacing / 2; x < width; x += spacing) {
      for (let y = spacing / 2; y < height; y += spacing) {
        nodes.push({ x, y });
      }
    }

    // Connect nearby nodes
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < spacing * 1.1) {
          edges.push([i, j]);
        }
      }
    }

    // Multiple particles per edge
    const particles = [];
    edges.forEach(([i, j]) => {
      for (let k = 0; k < 3; k++) {
        particles.push({ i, j, t: Math.random(), speed: 0.001 + Math.random() * 0.002 });
      }
    });

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

      // Draw nodes as filled squares
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 4;
      nodes.forEach((node) => {
        ctx.fillRect(node.x - 3, node.y - 3, 6, 6);
      });
      ctx.shadowBlur = 0;

      // Draw moving "train" particles
      particles.forEach((p) => {
        const a = nodes[p.i];
        const b = nodes[p.j];
        p.t += p.speed;
        if (p.t > 1) p.t = 0;

        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;

        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
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
