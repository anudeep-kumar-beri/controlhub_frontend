import React, { useEffect, useRef, useState } from 'react';
import './LockScreen.css';

function nowParts() {
  const d = new Date();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  return { time, date };
}

export default function LockScreen({ onUnlock }) {
  const [awake, setAwake] = useState(false);
  const [clock, setClock] = useState(nowParts());
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const storedPin = (typeof localStorage !== 'undefined' ? localStorage.getItem('ch_lock_pin') : '') || '';

  useEffect(() => {
    const t = setInterval(() => setClock(nowParts()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (awake && inputRef.current) {
      inputRef.current.focus();
    }
  }, [awake]);

  function wake() {
    setAwake(true);
  }

  function tryUnlock(e) {
    e?.preventDefault();
    setError('');
    if (!storedPin) {
      onUnlock?.();
      return;
    }
    if (pin === storedPin) {
      onUnlock?.();
    } else {
      setError('Incorrect passcode');
    }
  }

  return (
    <div className="lockscreen" onClick={!awake ? wake : undefined} onKeyDown={!awake ? wake : undefined} tabIndex={-1}>
      <div className="lockscreen-bg" />
      {!awake ? (
        <div className="lockscreen-center">
          <div className="lockscreen-time">{clock.time}</div>
          <div className="lockscreen-date">{clock.date}</div>
          <div className="lockscreen-hint">Press any key or click to unlock</div>
        </div>
      ) : (
        <div className="lockscreen-panel" role="dialog" aria-label="Unlock">
          <div className="lockscreen-avatar" aria-hidden="true">🔒</div>
          <div className="lockscreen-title">Welcome back</div>
          {storedPin ? (
            <form className="lockscreen-form" onSubmit={tryUnlock}>
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Enter passcode"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <button type="submit" className="btn primary">Unlock</button>
            </form>
          ) : (
            <button className="btn primary" onClick={tryUnlock}>Unlock</button>
          )}
          {error ? <div className="lockscreen-error" role="alert">{error}</div> : null}
        </div>
      )}
    </div>
  );
}
