// components/animations/JobTrackerAnimation.js
import React, { useEffect, useRef } from 'react';
import './JobTrackerAnimation.css';

function JobTrackerAnimation() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const trackCount = 7;
    const trackSpacing = width / (trackCount + 1);
    const tracks = Array.from({ length: trackCount }, (_, i) => ({
      x: (i + 1) * trackSpacing,
      connections: [],
    }));

    // Generate rail-style diagonal connections
    for (let i = 0; i < tracks.length - 1; i++) {
      const connectY = Math.random() * height * 0.8;
      tracks[i].connections.push({ to: i + 1, y: connectY });
      tracks[i + 1].connections.push({ to: i, y: connectY + 20 });
    }

    const lifts = Array.from({ length: 12 }, () => ({
      track: Math.floor(Math.random() * trackCount),
      y: Math.random() * height,
      speed: 0.6 + Math.random() * 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw tracks
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      tracks.forEach(track => {
        ctx.beginPath();
        ctx.moveTo(track.x, 0);
        ctx.lineTo(track.x, height);
        ctx.stroke();
      });

      // Draw visible diagonal intersections
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      tracks.forEach((track, i) => {
        track.connections.forEach(conn => {
          const fromX = track.x;
          const toX = tracks[conn.to].x;
          const y = conn.y;
          ctx.beginPath();
          ctx.moveTo(fromX, y);
          ctx.lineTo(toX, y + 20);
          ctx.stroke();
        });
      });

      // Draw lifts
      lifts.forEach(lift => {
        const currentTrack = tracks[lift.track];
        const x = currentTrack.x;

        // glowing pulse
        const gradient = ctx.createRadialGradient(x, lift.y, 0, x, lift.y, 12);
        gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, lift.y, 8, 0, Math.PI * 2);
        ctx.fill();

        lift.y -= lift.speed;

        // route switch if at connector
        const possibleConnections = currentTrack.connections.filter(c =>
          Math.abs(c.y - lift.y) < 1.5
        );
        if (possibleConnections.length && Math.random() < 0.2) {
          lift.track = possibleConnections[0].to;
        }

        if (lift.y < -10) {
          lift.y = height + 10;
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
