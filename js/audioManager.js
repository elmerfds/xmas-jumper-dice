// audioManager.js
class AudioManager {
    constructor() {
        this.isEnabled = true;
        this.audioContext = null;
        this.audioBuffers = {
            colors: {},
            patterns: {},
            decorations: {}
        };
        
        this.audioFiles = {
            colors: {
                'Red': './audio/red.wav',
                'Green': './audio/green.wav',
                'Yellow': './audio/yellow.wav'
            },
            patterns: {
                'Stripy': './audio/stripy.wav',
                'Spotty': './audio/spotty.wav',
                'Plain': './audio/plain.wav'
            },
            decorations: {
                'Snowman': './audio/snowman.wav',
                'Reindeer': './audio/reindeer.wav',
                'Tree': './audio/tree.wav',
                'Snowflake': './audio/snowflake.wav'
            }
        };
        
        this.initAudioContext();
        this.preloadAudio();
    }

    initAudioContext() {
        // Initialize audio context on first user interaction
        const initializeAudioContext = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('click', initializeAudioContext);
        };
        document.addEventListener('click', initializeAudioContext);
    }

    async preloadAudio() {
        try {
            // Initialize audio context if not already done
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Preload color audio files
            for (const [color, path] of Object.entries(this.audioFiles.colors)) {
                this.audioBuffers.colors[color] = await this.loadAudioBuffer(path);
            }

            // Preload pattern audio files
            for (const [pattern, path] of Object.entries(this.audioFiles.patterns)) {
                this.audioBuffers.patterns[pattern] = await this.loadAudioBuffer(path);
            }

            // Preload decoration audio files
            for (const [decoration, path] of Object.entries(this.audioFiles.decorations)) {
                this.audioBuffers.decorations[decoration] = await this.loadAudioBuffer(path);
            }
        } catch (error) {
            console.error('Error preloading audio:', error);
        }
    }

    async loadAudioBuffer(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Error loading audio buffer:', error);
            return null;
        }
    }

    combineAudioBuffers(buffers) {
        // Playback speed (1 is normal, 1.2 is 20% faster, etc.)
        const PLAYBACK_SPEED = 1.2;
        
        // Gap between words in seconds (0.01 = 10ms)
        const GAP_BETWEEN_WORDS = 0.01;
        
        // Calculate gap samples
        const gapSamples = Math.floor(this.audioContext.sampleRate * GAP_BETWEEN_WORDS);
        
        // Calculate total length including gaps
        const totalLength = buffers.reduce((acc, buffer) => {
            return acc + Math.floor(buffer.length / PLAYBACK_SPEED);
        }, gapSamples * (buffers.length - 1)); // Add gaps between words
        
        // Create a combined buffer
        const combinedBuffer = this.audioContext.createBuffer(
            1, // mono
            totalLength,
            this.audioContext.sampleRate
        );
        
        // Copy each buffer into the combined buffer with speed adjustment
        let offset = 0;
        buffers.forEach((buffer, index) => {
            if (buffer && buffer.getChannelData) {
                const sourceData = buffer.getChannelData(0);
                const targetData = combinedBuffer.getChannelData(0);
                
                // Copy samples at adjusted speed
                for (let i = 0; i < buffer.length; i += PLAYBACK_SPEED) {
                    if (offset < totalLength) {
                        targetData[offset] = sourceData[Math.floor(i)];
                        offset++;
                    }
                }
                
                // Add gap after each word except the last
                if (index < buffers.length - 1) {
                    offset += gapSamples;
                }
            }
        });
        
        return combinedBuffer;
    }

    async playSequence(color, pattern, decoration) {
        if (!this.isEnabled || !this.audioContext) return;

        try {
            // Resume audio context if it's suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Get the buffers
            const colorBuffer = this.audioBuffers.colors[color];
            const patternBuffer = this.audioBuffers.patterns[pattern];
            const decorationBuffer = this.audioBuffers.decorations[decoration];

            if (!colorBuffer || !patternBuffer || !decorationBuffer) {
                throw new Error('Missing audio buffer');
            }

            // Combine the buffers
            const combinedBuffer = this.combineAudioBuffers([
                colorBuffer,
                patternBuffer,
                decorationBuffer
            ]);
            
            // Create and play the combined sound
            const source = this.audioContext.createBufferSource();
            source.buffer = combinedBuffer;
            source.connect(this.audioContext.destination);
            source.start();

        } catch (error) {
            console.error('Audio playback failed:', error);
        }
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
