export const speakText = (text: string, onEnd?: () => void, onStart?: () => void) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a Japanese voice
  const voices = window.speechSynthesis.getVoices();
  const jaVoices = voices.filter(v => v.lang.includes('ja') || v.lang.includes('JP'));
  
  if (jaVoices.length > 0) {
    // Optionally prefer specific known good voices (e.g., Google or OS default)
    utterance.voice = jaVoices.find(v => v.name.includes('Google')) || jaVoices[0];
  }

  // AI Mayor personality tuning
  utterance.pitch = 0.8; // Slightly lower pitch for a "mayor" feel
  utterance.rate = 1.1; // Slightly faster for comical, brisk talking
  utterance.volume = 1.0;

  if (onStart) {
    utterance.onstart = () => onStart();
  }

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd(); // ensure cleanup on error
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// Some browsers require voices to be loaded asynchronously
export const initSpeechVoices = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }
};
