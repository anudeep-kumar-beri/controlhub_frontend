import React, { useState, useEffect, useRef } from 'react';
import './PerformanceMonitor.css';

export default function PerformanceMonitor({ enabled = false }) {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    let animationFrameId;

    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const delta = currentTime - lastTimeRef.current;

      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  const fpsColor = fps >= 55 ? '#22c55e' : fps >= 30 ? '#fbbf24' : '#ef4444';

  return (
    <div className="performance-monitor">
      <div className="perf-item">
        <span className="perf-label">FPS:</span>
        <span className="perf-value" style={{ color: fpsColor }}>
          {fps}
        </span>
      </div>
      <div className="perf-item">
        <span className="perf-label">Target:</span>
        <span className="perf-value" style={{ color: '#3b82f6' }}>60</span>
      </div>
    </div>
  );
}
