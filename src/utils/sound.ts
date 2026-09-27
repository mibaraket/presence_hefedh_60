// Silent SoundManager - audio feedback completely disabled upon user request
class SoundManager {
  playSuccess() {
    // Disabled
  }

  playWarning() {
    // Disabled
  }

  playError() {
    // Disabled
  }
}

export const soundManager = new SoundManager();

