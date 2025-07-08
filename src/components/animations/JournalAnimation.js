// components/animations/JournalAnimation.js
import React, { useEffect, useRef } from 'react';
import './JournalAnimation.css';

const words = [
  // Reflective Keywords
  'breathe', 'focus', 'clarity', 'present', 'stillness',
  'ponder', 'remember', 'learn', 'observe', 'recall',
  'imagine', 'create', 'explore', 'express', 'sketch',
  'truth', 'growth', 'self', 'feeling', 'insight',

  // Gibberish & Symbols
  '⾡', 'Ϟαε', '⊰⋄⊱', '✀ጀ3', '∞', '✎',
  '⧉', '𝒿', 'ᗏ', '෴', 'ᓚᗏᖢ',
  'flōrē', 'myria', 'eclæ', '~sylne', 'Ȗhëəra', 'niivə', 'ruvencë',
  '༄', '☾', '✶', '༚', '𝤔', '𓆃'
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
      const duration = 6 + Math.random() * 6;

      word.style.left = `${x}vw`;
      word.style.top = `${y}vh`;
      word.style.animationDuration = `${duration}s`;
      word.style.fontSize = `${Math.random() * 1.2 + 0.8}rem`;
      word.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;

      container.appendChild(word);

      setTimeout(() => {
        word.remove();
      }, duration * 1000);
    }

    const interval = setInterval(spawnFloatingWord, 900);
    return () => clearInterval(interval);
  }, []);

  return <div className="journal-animation-layer" ref={containerRef}></div>;
}

export default JournalAnimation;
