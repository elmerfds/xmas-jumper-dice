// audioManager.js
class AudioManager {
    constructor() {
        this.isEnabled = true;
        this.audioFiles = {
            colors: {
                'Red': new Audio('./audio/red.wav'),      // Changed from ../audio to ./audio
                'Green': new Audio('./audio/green.wav'),
                'Yellow': new Audio('./audio/yellow.wav')
            },
            patterns: {
                'Stripy': new Audio('./audio/stripy.wav'),
                'Spotty': new Audio('./audio/spotty.wav'),
                'Plain': new Audio('./audio/plain.wav')
            },
            decorations: {
                'Snowman': new Audio('./audio/snowman.wav'),
                'Reindeer': new Audio('./audio/reindeer.wav'),
                'Tree': new Audio('./audio/tree.wav'),
                'Snowflake': new Audio('./audio/snowflake.wav')
            }
        };
        
        this.preloadAudio();
    }

    preloadAudio() {
        try {
            Object.values(this.audioFiles.colors).forEach(audio => {
                audio.load();
            });
            Object.values(this.audioFiles.patterns).forEach(audio => {
                audio.load();
            });
            Object.values(this.audioFiles.decorations).forEach(audio => {
                audio.load();
            });
        } catch (error) {
            console.error('Error preloading audio:', error);
        }
    }

    async playSequence(color, pattern, decoration) {
        if (!this.isEnabled) return;

        try {
            const colorAudio = this.audioFiles.colors[color];
            const patternAudio = this.audioFiles.patterns[pattern];
            const decorationAudio = this.audioFiles.decorations[decoration];

            if (!colorAudio || !patternAudio || !decorationAudio) {
                throw new Error('Missing audio file');
            }

            // Reset all audio to start
            colorAudio.currentTime = 0;
            patternAudio.currentTime = 0;
            decorationAudio.currentTime = 0;

            // Adjust these values to control the timing between words
            const GAP_BETWEEN_WORDS = 100; // milliseconds

            // Play color immediately
            await this.playAudio(colorAudio);
            
            // Wait a short moment then play pattern
            await new Promise(resolve => setTimeout(resolve, GAP_BETWEEN_WORDS));
            await this.playAudio(patternAudio);
            
            // Wait a short moment then play decoration
            await new Promise(resolve => setTimeout(resolve, GAP_BETWEEN_WORDS));
            await this.playAudio(decorationAudio);

        } catch (error) {
            console.error('Audio playback failed:', error);
        }
    }

    playAudio(audioElement) {
        return new Promise((resolve) => {
            // Set up ended event listener before playing
            audioElement.addEventListener('ended', () => {
                resolve();
            }, { once: true });

            // Start playing
            audioElement.play().catch(error => {
                console.error('Playback failed:', error);
                resolve(); // Resolve anyway to continue sequence
            });
        });
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }

    isAudioEnabled() {
        return this.isEnabled;
    }
}

export default AudioManager;
