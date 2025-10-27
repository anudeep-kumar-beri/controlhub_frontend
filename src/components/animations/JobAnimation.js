// components/animations/JobTrackerAnimation.js
import React, { useEffect, useRef } from 'react';
import './JobAnimation.css';

function JobTrackerAnimation() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const trackCount = 8;
    const trackSpacing = width / (trackCount + 1);
    const tracks = Array.from({ length: trackCount }, (_, i) => ({
      x: (i + 1) * trackSpacing,
      connections: [],
    }));

    // Generate curved upward diagonal connections between tracks
    for (let i = 0; i < tracks.length - 1; i++) {
      const y = Math.random() * (height * 0.75);
      tracks[i].connections.push({ to: i + 1, y });
      tracks[i + 1].connections.push({ to: i, y: y + 25 }); // slightly offset on the return
    }

    const lifts = Array.from({ length: 10 }, () => ({
      track: Math.floor(Math.random() * trackCount),
      y: Math.random() * height,
      switching: null,
      progress: 0,
      speed: 0.4 + Math.random() * 0.3,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw vertical tracks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      tracks.forEach(track => {
        ctx.beginPath();
        ctx.moveTo(track.x, 0);
        ctx.lineTo(track.x, height);
        ctx.stroke();
      });

      // Draw diagonal connectors (soft up-sloping lines)
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      tracks.forEach((track, i) => {
        track.connections.forEach(conn => {
          const toX = tracks[conn.to].x;
          const cpX = (track.x + toX) / 2;
          const fromY = conn.y;
          const toY = conn.y - 25;

          ctx.beginPath();
          ctx.moveTo(track.x, fromY);
          ctx.quadraticCurveTo(cpX, fromY - 20, toX, toY);
          ctx.stroke();
        });
      });

      // Draw lifts
      lifts.forEach(lift => {
        if (lift.switching) {
          // In transition
          lift.progress += 0.015;
          if (lift.progress >= 1) {
            lift.track = lift.switching.to;
            lift.y -= 25;
            lift.switching = null;
            lift.progress = 0;
          } else {
            const fromX = tracks[lift.track].x;
            const toX = tracks[lift.switching.to].x;
            const cpX = (fromX + toX) / 2;
            const fromY = lift.switching.y;
            const toY = fromY - 25;
            const t = lift.progress;
            const x = (1 - t) ** 2 * fromX + 2 * (1 - t) * t * cpX + t ** 2 * toX;
            const y = (1 - t) ** 2 * fromY + 2 * (1 - t) * t * (fromY - 20) + t ** 2 * toY;

            drawLift(ctx, x, y);
            return;
          }
        }

        const currentTrack = tracks[lift.track];
        const x = currentTrack.x;

        drawLift(ctx, x, lift.y);
        lift.y -= lift.speed;

        // Check if at a valid switching connector
        const connectors = currentTrack.connections.filter(conn => Math.abs(conn.y - lift.y) < 1.5);
        if (connectors.length && Math.random() < 0.1) {
          lift.switching = connectors[0];
          lift.progress = 0;
        }

        if (lift.y < -20) {
          lift.y = height + 20;
          lift.track = Math.floor(Math.random() * trackCount);
        }
      });

      requestAnimationFrame(draw);
    };

    const drawLift = (ctx, x, y) => {
      // Glow ring
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 14);
      gradient.addColorStop(0, 'rgba(255,255,255,0.15)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Capsule lift body
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.roundRect(x - 3, y - 10, 6, 20, 3);
      ctx.fill();
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
