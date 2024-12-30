// audioManager.js
class AudioManager {
    constructor() {
        this.isEnabled = true;
        this.audioContext = null;
        this.audioBuffers = {
            diceRoll: null,
            colors: {},
            patterns: {},
            decorations: {}
        };
        
        this.audioFiles = {
            diceRoll: './audio/diceroll.wav',
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

        // Bind methods
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handlePageShow = this.handlePageShow.bind(this);
        this.resumeAudioContext = this.resumeAudioContext.bind(this);
        
        // Add last interaction tracking
        this.lastInteractionTime = Date.now();
        
        // Initialize audio context immediately
        this.initAudioContext();
        this.preloadAudio();
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    async handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            await this.resumeAudioContext();
        }
    }

    async handlePageShow(event) {
        if (event.persisted) {
            await this.resumeAudioContext();
        }
    }

    async resumeAudioContext() {
        try {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (error) {
            console.error('Error resuming audio context:', error);
        }
    }

    async preloadAudio() {
        try {
            // Load dice roll sound
            this.audioBuffers.diceRoll = await this.loadAudioBuffer(this.audioFiles.diceRoll);

            // Load other audio files
            for (const [color, path] of Object.entries(this.audioFiles.colors)) {
                this.audioBuffers.colors[color] = await this.loadAudioBuffer(path);
            }

            for (const [pattern, path] of Object.entries(this.audioFiles.patterns)) {
                this.audioBuffers.patterns[pattern] = await this.loadAudioBuffer(path);
            }

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

        for (let i = 0; i < channelData.length; i++) {
            if (Math.abs(channelData[i]) > threshold) {
                start = Math.max(0, i - 100);
                break;
            }
        }

        for (let i = channelData.length - 1; i > 0; i--) {
            if (Math.abs(channelData[i]) > threshold) {
                end = Math.min(channelData.length, i + 100);
                break;
            }
        }

        const trimmedBuffer = this.audioContext.createBuffer(
            1,
            end - start,
            audioBuffer.sampleRate
        );

        const newChannelData = trimmedBuffer.getChannelData(0);
        for (let i = 0; i < end - start; i++) {
            newChannelData[i] = channelData[i + start];
        }

        return trimmedBuffer;
    }

    combineAudioBuffers(buffers) {
        const trimmedBuffers = buffers.map(buffer => this.trimSilence(buffer));
        const totalLength = trimmedBuffers.reduce((acc, buffer) => acc + buffer.length, 0);
        
        const combinedBuffer = this.audioContext.createBuffer(
            1,
            totalLength,
            this.audioContext.sampleRate
        );
        
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

    async playDiceRoll() {
        if (!this.isEnabled) return;

        try {
            await this.resumeAudioContext();

            const rollBuffer = this.audioBuffers.diceRoll;
            if (!rollBuffer) {
                throw new Error('Missing dice roll audio buffer');
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = rollBuffer;
            source.connect(this.audioContext.destination);
            source.start();

            // Return a promise that resolves when the sound is finished
            return new Promise((resolve) => {
                source.onended = resolve;
            });

        } catch (error) {
            console.error('Dice roll audio playback failed:', error);
            if (this.audioContext.state !== 'running') {
                this.initAudioContext();
                await this.preloadAudio();
            }
        }
    }

    async playSequence(color, pattern, decoration) {
        if (!this.isEnabled) return;

        try {
            await this.resumeAudioContext();

            const colorBuffer = this.audioBuffers.colors[color];
            const patternBuffer = this.audioBuffers.patterns[pattern];
            const decorationBuffer = this.audioBuffers.decorations[decoration];

            if (!colorBuffer || !patternBuffer || !decorationBuffer) {
                throw new Error('Missing audio buffer');
            }

            const combinedBuffer = this.combineAudioBuffers([
                colorBuffer,
                patternBuffer,
                decorationBuffer
            ]);
            
            const source = this.audioContext.createBufferSource();
            source.buffer = combinedBuffer;
            source.connect(this.audioContext.destination);
            source.start();

        } catch (error) {
            console.error('Audio playback failed:', error);
            // Reset audio context if needed
            if (this.audioContext.state !== 'running') {
                this.initAudioContext();
                await this.preloadAudio();
            }
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
