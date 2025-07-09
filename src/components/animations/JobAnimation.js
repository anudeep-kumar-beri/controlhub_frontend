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
      connections: [],
    }));

    // Diagonal intersection setup (rail-style)
    for (let i = 0; i < tracks.length - 1; i++) {
      for (let j = 1; j < 5; j++) {
        const y = (height / 5) * j + Math.random() * 30 - 15;
        tracks[i].connections.push({ to: i + 1, y });
        tracks[i + 1].connections.push({ to: i, y: y + 12 });
      }
    }

    const lifts = Array.from({ length: 16 }, () => ({
      track: Math.floor(Math.random() * trackCount),
      y: Math.random() * height,
      speed: 0.8 + Math.random() * 0.6,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw elevator tracks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      tracks.forEach(track => {
        ctx.beginPath();
        ctx.moveTo(track.x, 0);
        ctx.lineTo(track.x, height);
        ctx.stroke();
      });

      // Draw diagonal connectors
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1.2;
      tracks.forEach((track, i) => {
        track.connections.forEach(conn => {
          const fromX = track.x;
          const toX = tracks[conn.to].x;
          const y1 = conn.y;
          const y2 = conn.y + 12;
          ctx.beginPath();
          ctx.moveTo(fromX, y1);
          ctx.lineTo(toX, y2);
          ctx.stroke();
        });
      });

      // Animate lifts
      lifts.forEach(lift => {
        const currentTrack = tracks[lift.track];
        const x = currentTrack.x;

        // Glowing radial pulse
        const gradient = ctx.createRadialGradient(x, lift.y, 0, x, lift.y, 14);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, lift.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Move upward
        lift.y -= lift.speed;

        // Switch tracks at valid intersections
        const connection = currentTrack.connections.find(c =>
          Math.abs(c.y - lift.y) < 1.5
        );
        if (connection && Math.random() < 0.2) {
          lift.track = connection.to;
        }

        // Recycle from bottom
        if (lift.y < -10) {
          lift.y = height + 20;
          lift.track = Math.floor(Math.random() * trackCount);
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
