// components/animations/JournalAnimation.js
import React, { useEffect, useRef } from 'react';
import './JournalAnimation.css';

const words = [
  // Reflective Words
  'breathe', 'clarity', 'stillness', 'observe', 'recall',
  'imagine', 'create', 'growth', 'express', 'truth',
  'feeling', 'learn', 'focus', 'present', 'ponder',

  // Gibberish / Magical
  '⾡', 'Ϟαε', '⊰⋄⊱', '✀ጀ3', '∞', '✎', '⧉',
  '𝒿', 'ᗏ', '෴', 'flōrē', 'eclæ', '~sylne', 'Ȗhëəra', 'niivə',
  'ruvencë', '༄', '☾', '✶', '༚', '𓆃'
];

function JournalAnimation() {
  const containerRef = useRef();

  useEffect(() => {
    const container = containerRef.current;

    function spawnFloatingWord() {
      const word = document.createElement('span');
      word.className = 'floating-word';
      word.innerText = words[Math.floor(Math.random() * words.length)];

      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = 6 + Math.random() * 4;

      word.style.left = `${x}vw`;
      word.style.top = `${y}vh`;
      word.style.animationDuration = `${duration}s`;
      word.style.fontSize = `${Math.random() * 1.3 + 0.7}rem`;
      word.style.transform = `rotate(${Math.random() * 12 - 6}deg)`;

      container.appendChild(word);

      setTimeout(() => {
        word.remove();
      }, duration * 1000);
    }

    const interval = setInterval(spawnFloatingWord, 850);
    return () => clearInterval(interval);
  }, []);

  return <div className="journal-animation-layer" ref={containerRef}></div>;
}

export default JournalAnimation;
