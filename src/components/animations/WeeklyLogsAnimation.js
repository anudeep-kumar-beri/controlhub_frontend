import React, { useEffect, useRef } from 'react';
import './WeeklyLogsAnimation.css';

function WeeklyLogsAnimation() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const tickGap = 60;
    let t = 0;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;

      const baseY = height * 0.75;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(width, baseY);
      ctx.stroke();

      for (let i = 0; i < width; i += tickGap) {
        const offset = (t * 100) % tickGap;
        ctx.beginPath();
        ctx.moveTo(i - offset, baseY - 10);
        ctx.lineTo(i - offset, baseY + 10);
        ctx.stroke();
      }

      t += 0.003;
      requestAnimationFrame(draw);
    }

    draw();
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    return () => window.removeEventListener('resize', () => {});
  }, []);

  return <canvas ref={canvasRef} className="weekly-canvas" />;
}

export default WeeklyLogsAnimation;
