// JobTrackerAnimation.js
import React, { useEffect, useRef } from 'react';
import './JobAnimation.css';

function JobTrackerAnimation() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const trackCount = 9;
    const trackSpacing = width / (trackCount + 1);
    const tracks = Array.from({ length: trackCount }, (_, i) => ({
      x: (i + 1) * trackSpacing,
    }));

    const connectors = [];
    for (let i = 0; i < trackCount - 1; i++) {
      const y = height * 0.2 + (Math.random() * height * 0.6);
      connectors.push({ from: i, to: i + 1, y });
    }

    const createPath = () => {
      const path = [];
      let currentTrack = Math.floor(Math.random() * trackCount);
      let y = height + Math.random() * height * 0.2;

      while (y > -100) {
        path.push({ x: tracks[currentTrack].x, y });
        const conn = connectors.find(c => (c.from === currentTrack || c.to === currentTrack) && Math.abs(c.y - y) < 10);
        if (conn) {
          const nextTrack = conn.from === currentTrack ? conn.to : conn.from;
          path.push({ x: tracks[nextTrack].x, y: conn.y + 20 });
          currentTrack = nextTrack;
          y -= 60;
        } else {
          y -= 60 + Math.random() * 80;
        }
      }

      return path;
    };

    const lifts = Array.from({ length: 10 }, () => ({
      path: createPath(),
      index: 0,
      speed: 1 + Math.random() * 0.4,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw tracks
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      tracks.forEach(track => {
        ctx.beginPath();
        ctx.moveTo(track.x, 0);
        ctx.lineTo(track.x, height);
        ctx.stroke();
      });

      // Draw connectors
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      connectors.forEach(conn => {
        const x1 = tracks[conn.from].x;
        const x2 = tracks[conn.to].x;
        ctx.beginPath();
        ctx.moveTo(x1, conn.y);
        ctx.lineTo(x2, conn.y + 20);
        ctx.stroke();
      });

      // Move and draw lifts
      lifts.forEach(lift => {
        const path = lift.path;
        if (lift.index >= path.length - 1) {
          lift.path = createPath();
          lift.index = 0;
          return;
        }

        const p1 = path[lift.index];
        const p2 = path[lift.index + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        lift.progress = (lift.progress || 0) + lift.speed;

        if (lift.progress >= dist) {
          lift.index++;
          lift.progress = 0;
        } else {
          const ratio = lift.progress / dist;
          const x = p1.x + dx * ratio;
          const y = p1.y + dy * ratio;

          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
          gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

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

  return <canvas ref={canvasRef} className="job-tracker-canvas" />;
}

export default JobTrackerAnimation;
