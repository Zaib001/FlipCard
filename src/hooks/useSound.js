import { useEffect, useState } from 'react';
import soundHeads from '../assets/sounds/coin-heads.mp3';
import soundTails from '../assets/sounds/coin-tails.mp3';

const sounds = {
  coinHeads: soundHeads,
  coinTails: soundTails
};

export const useSound = () => {
  const [audio] = useState(new Audio());
  const [enabled, setEnabled] = useState(true);

  const playSound = (soundKey) => {
    if (!enabled || !sounds[soundKey]) return;
    
    audio.src = sounds[soundKey];
    audio.currentTime = 0;
    audio.play().catch(e => console.error('Audio error:', e));
  };

  const toggleSound = () => setEnabled(!enabled);

  return { playSound, toggleSound, soundEnabled: enabled };
};