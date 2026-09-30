// Web Audio API for simple synthesized sound effects
let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Synth beep for hover/interactions
export const playHoverSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

// Synth beep for selection/click
export const playClickSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
};

// Scanner sound for data load/metric change
export const playScanSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  // Create a rapid sweeping sound
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.2);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export const playGachaSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'square';
  // Rapid frequency changes
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(300, now);
  for (let i = 1; i <= 10; i++) {
    osc.frequency.setValueAtTime(300 + Math.random() * 500, now + i * 0.05);
  }
  
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.6);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(now + 0.6);
};

export const playGachaWinSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc1.type = 'sine';
  osc2.type = 'triangle';
  
  // C major chord arpeggio
  const now = ctx.currentTime;
  osc1.frequency.setValueAtTime(523.25, now); // C5
  osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
  osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
  osc1.frequency.setValueAtTime(1046.50, now + 0.3); // C6
  
  osc2.frequency.setValueAtTime(261.63, now); // C4
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 1.0);
  osc2.stop(now + 1.0);
};

export const playBattleStartSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.8);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(now + 0.8);
};

export const playHitSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'square';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
  
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(now + 0.15);
};

export const playKOSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 1.5);
  
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.linearRampToValueAtTime(0, now + 1.5);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(now + 1.5);
};

export const playRetroUnlockSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'square';
  const now = ctx.currentTime;
  
  // Retro 1-up style jingle
  const notes = [
    { freq: 329.63, time: 0 },    // E4
    { freq: 392.00, time: 0.1 },  // G4
    { freq: 659.25, time: 0.2 },  // E5
    { freq: 523.25, time: 0.3 },  // C5
    { freq: 587.33, time: 0.4 },  // D5
    { freq: 783.99, time: 0.5 },  // G5
  ];
  
  notes.forEach(note => {
    osc.frequency.setValueAtTime(note.freq, now + note.time);
  });
  
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.setValueAtTime(0.1, now + 0.6);
  gain.gain.linearRampToValueAtTime(0, now + 0.8);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.8);
};

export const playRetroAttack = () => {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
};

export const playRetroDamage = () => {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
};

export const playRetroVictory = () => {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  const now = ctx.currentTime;
  const notes = [
    { freq: 440, time: 0 },
    { freq: 440, time: 0.1 },
    { freq: 440, time: 0.2 },
    { freq: 523.25, time: 0.35 },
    { freq: 659.25, time: 0.5 },
  ];
  notes.forEach(note => {
    osc.frequency.setValueAtTime(note.freq, now + note.time);
  });
  gain.gain.setValueAtTime(0, now);
  gain.gain.setValueAtTime(0.1, now + 0.05);
  gain.gain.setValueAtTime(0.1, now + 0.6);
  gain.gain.linearRampToValueAtTime(0, now + 1.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 1.2);
};

// Global variables for Retro BGM
let bgmOsc: OscillatorNode | null = null;
let bgmGain: GainNode | null = null;
let bgmInterval: number | null = null;

export const startRetroBGM = () => {
  const ctx = getContext();
  if (!ctx || bgmOsc) return;

  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.03;
  bgmGain.connect(ctx.destination);

  const playNote = () => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    
    // Random arpeggio for 8-bit feel
    const scale = [261.63, 329.63, 392.00, 523.25]; // C E G C
    const freq = scale[Math.floor(Math.random() * scale.length)];
    
    osc.frequency.value = freq;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(bgmGain!);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  };

  playNote();
  bgmInterval = window.setInterval(playNote, 200);
};

export const stopRetroBGM = () => {
  if (bgmInterval !== null) {
    window.clearInterval(bgmInterval);
    bgmInterval = null;
  }
  if (bgmGain) {
    const ctx = getContext();
    if (ctx) {
      bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }
    bgmGain = null;
  }
  bgmOsc = null;
};
