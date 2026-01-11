import { useCallback, useRef, useEffect } from 'react';
import turnSoundUrl from '../assets/005506_rubik39s-cube-3x3-51131.mp3';

export function useCubeSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Fetch and decode the MP3 file
      fetch(turnSoundUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          bufferRef.current = audioBuffer;
        })
        .catch(err => console.error("Error loading cube sound:", err));
    }
  }, []);

  const playSound = useCallback((move?: string) => {
    const ctx = audioCtxRef.current;
    const buffer = bufferRef.current;
    if (!ctx || !buffer) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Filter - Open up the frequency to get the "scratch"
    // Rubik's cubes have high frequency clicks
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; // Remove deep thuds
    filter.frequency.value = 100; 

    // Deterministic sound based on move
    // We want the same sound for 'U', but maybe slight variation for 'U2' or "U'"?
    // Let's stick to the base face for consistency requested.
    let startTime = 0;
    const base = move ? move[0].toUpperCase() : 'X';
    
    // Pick distinct spots in the 4-minute file
    switch (base) {
        case 'U': startTime = 2.5; break;
        case 'D': startTime = 7.2; break;
        case 'L': startTime = 12.8; break;
        case 'R': startTime = 18.4; break;
        case 'F': startTime = 24.1; break;
        case 'B': startTime = 29.6; break;
        case 'M': startTime = 35.2; break;
        case 'E': startTime = 40.8; break;
        case 'S': startTime = 46.4; break;
        default: startTime = Math.random() * 60; // Fallback or random for unknown
    }
    
    // Add tiny jitter so it's not *robotic* but still clearly the "U sound"
    // 0.05s jitter is barely noticeable pitch-wise but affects the waveform start
    // Actually, kept deterministic for now per request "same sound"
    
    // Pitch: varies slightly per face to help distinguish them
    const baseRate = 1.0;
    let rateOffset = 0;
    switch (base) {
        case 'U': rateOffset = 0.05; break;
        case 'D': rateOffset = -0.05; break;
        case 'R': rateOffset = 0.02; break;
        case 'L': rateOffset = -0.02; break;
    }
    source.playbackRate.value = baseRate + rateOffset;

    // Create an envelope to smooth the cut
    const gainNode = ctx.createGain();
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sharper attack and LOUDER (increased from 0.8 to 1.2)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1.2, ctx.currentTime + 0.02);
    // Quick decay
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    // Play slice
    source.start(0, startTime, 0.25);
  }, []);

  return playSound;
}