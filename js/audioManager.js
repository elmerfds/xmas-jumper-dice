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
        // No gaps approach - directly concatenate buffers
        const totalLength = buffers.reduce((acc, buffer) => acc + buffer.length, 0);
        
        // Create a combined buffer
        const combinedBuffer = this.audioContext.createBuffer(
            1, // mono
            totalLength,
            this.audioContext.sampleRate
        );
        
        // Copy each buffer into the combined buffer immediately after the previous one
        let offset = 0;
        buffers.forEach(buffer => {
            if (buffer && buffer.getChannelData) {
                const sourceData = buffer.getChannelData(0);
                combinedBuffer.copyToChannel(sourceData, 0, offset);
                offset += buffer.length;
            }
        });
        
        return combinedBuffer;
    }
    
    async playSequence(color, pattern, decoration) {
        if (!this.isEnabled || !this.audioContext) return;
    
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
    
            const colorBuffer = this.audioBuffers.colors[color];
            const patternBuffer = this.audioBuffers.patterns[pattern];
            const decorationBuffer = this.audioBuffers.decorations[decoration];
    
            if (!colorBuffer || !patternBuffer || !decorationBuffer) {
                throw new Error('Missing audio buffer');
            }
    
            // Combine the buffers with no gaps
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
