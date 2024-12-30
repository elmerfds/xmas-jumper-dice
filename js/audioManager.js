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

    trimSilence(audioBuffer, threshold = 0.01) {
        const channelData = audioBuffer.getChannelData(0);
        let start = 0;
        let end = channelData.length;

        // Find start (trim silence from beginning)
        for (let i = 0; i < channelData.length; i++) {
            if (Math.abs(channelData[i]) > threshold) {
                start = Math.max(0, i - 100); // Keep a tiny bit of lead-in
                break;
            }
        }

        // Find end (trim silence from end)
        for (let i = channelData.length - 1; i > 0; i--) {
            if (Math.abs(channelData[i]) > threshold) {
                end = Math.min(channelData.length, i + 100); // Keep a tiny bit of trail
                break;
            }
        }

        // Create new buffer with trimmed data
        const trimmedBuffer = this.audioContext.createBuffer(
            1,
            end - start,
            audioBuffer.sampleRate
        );

        // Copy the trimmed portion
        const newChannelData = trimmedBuffer.getChannelData(0);
        for (let i = 0; i < end - start; i++) {
            newChannelData[i] = channelData[i + start];
        }

        return trimmedBuffer;
    }

    combineAudioBuffers(buffers) {
        // Trim silence from each buffer
        const trimmedBuffers = buffers.map(buffer => this.trimSilence(buffer));
        
        // Calculate total length of trimmed buffers
        const totalLength = trimmedBuffers.reduce((acc, buffer) => acc + buffer.length, 0);
        
        // Create combined buffer
        const combinedBuffer = this.audioContext.createBuffer(
            1, // mono
            totalLength,
            this.audioContext.sampleRate
        );
        
        // Copy each trimmed buffer into the combined buffer
        let offset = 0;
        trimmedBuffers.forEach(buffer => {
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

            // Combine the trimmed buffers
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
