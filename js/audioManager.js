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

        // Bind methods
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handlePageShow = this.handlePageShow.bind(this);
        this.resumeAudioContext = this.resumeAudioContext.bind(this);
        
        // Add last interaction tracking
        this.lastInteractionTime = Date.now();
        
        // Add tracking for active playback
        this.currentSource = null;
        this.isPlaying = false;
        this.playbackQueue = [];
        
        this.initAudioContext();
        this.preloadAudio();
        this.setupPageListeners();
    }

    setupPageListeners() {
        // Page visibility events
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Page show/hide events
        window.addEventListener('pageshow', this.handlePageShow);
        window.addEventListener('pagehide', this.handlePageHide.bind(this));
        
        // Focus events
        window.addEventListener('focus', this.resumeAudioContext);
        window.addEventListener('blur', this.handleBlur.bind(this));
        
        // iOS specific events
        window.addEventListener('resume', this.resumeAudioContext);
        
        // Touch events for iOS
        document.addEventListener('touchstart', this.handleInteraction.bind(this));
        document.addEventListener('touchend', this.handleInteraction.bind(this));
    }

    handleInteraction() {
        this.lastInteractionTime = Date.now();
        this.resumeAudioContext();
    }

    async handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            await this.forceAudioContextResume();
        }
    }

    async handlePageShow(event) {
        if (event.persisted || document.visibilityState === 'visible') {
            await this.forceAudioContextResume();
        }
    }

    handlePageHide() {
        if (this.audioContext) {
            this.lastHideTime = Date.now();
        }
    }

    handleBlur() {
        if (this.audioContext) {
            this.lastBlurTime = Date.now();
        }
    }

    initAudioContext() {
        const initializeAudioContext = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('click', initializeAudioContext);
        };
        document.addEventListener('click', initializeAudioContext);
    }

    async forceAudioContextResume() {
        try {
            // Stop any current playback before resuming context
            if (this.currentSource) {
                try {
                    this.currentSource.stop();
                } catch (e) {
                    // Ignore errors from already stopped sources
                }
                this.currentSource = null;
            }
            this.isPlaying = false;

            const timeSinceLastInteraction = Date.now() - this.lastInteractionTime;
            if (timeSinceLastInteraction > 1000) {
                await this.recreateAudioContext();
            } else {
                await this.resumeAudioContext();
            }
        } catch (error) {
            console.error('Error resuming audio:', error);
            await this.recreateAudioContext();
        }
    }

    async recreateAudioContext() {
        try {
            if (this.audioContext) {
                await this.audioContext.close();
            }
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.preloadAudio();
        } catch (error) {
            console.error('Error recreating audio context:', error);
        }
    }

    async resumeAudioContext() {
        if (!this.audioContext) {
            await this.recreateAudioContext();
            return;
        }

        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            if (this.audioContext.state !== 'running') {
                await this.recreateAudioContext();
            }
        } catch (error) {
            console.error('Error resuming audio context:', error);
            await this.recreateAudioContext();
        }
    }

    async preloadAudio() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

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

    async playSequence(color, pattern, decoration) {
        if (!this.isEnabled) return;

        // Add to queue if currently playing
        if (this.isPlaying) {
            console.log('Already playing, skipping...');
            return;
        }

        try {
            this.isPlaying = true;

            // Force audio context resume before playing
            await this.forceAudioContextResume();

            if (!this.audioContext || this.audioContext.state !== 'running') {
                await this.recreateAudioContext();
            }

            const colorBuffer = this.audioBuffers.colors[color];
            const patternBuffer = this.audioBuffers.patterns[pattern];
            const decorationBuffer = this.audioBuffers.decorations[decoration];

            if (!colorBuffer || !patternBuffer || !decorationBuffer) {
                throw new Error('Missing audio buffer');
            }

            // Stop any current playback
            if (this.currentSource) {
                try {
                    this.currentSource.stop();
                } catch (e) {
                    // Ignore errors from already stopped sources
                }
            }

            const combinedBuffer = this.combineAudioBuffers([
                colorBuffer,
                patternBuffer,
                decorationBuffer
            ]);
            
            const source = this.audioContext.createBufferSource();
            this.currentSource = source;
            source.buffer = combinedBuffer;
            source.connect(this.audioContext.destination);

            // Handle playback completion
            source.onended = () => {
                this.isPlaying = false;
                this.currentSource = null;
            };

            source.start();

        } catch (error) {
            console.error('Audio playback failed:', error);
            this.isPlaying = false;
            this.currentSource = null;
            await this.recreateAudioContext();
        }
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }

    isAudioEnabled() {
        return this.isEnabled;
    }

    cleanup() {
        // Stop any current playback
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Ignore errors from already stopped sources
            }
            this.currentSource = null;
        }
        this.isPlaying = false;

        // Remove all event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('pageshow', this.handlePageShow);
        window.removeEventListener('pagehide', this.handlePageHide);
        window.removeEventListener('focus', this.resumeAudioContext);
        window.removeEventListener('blur', this.handleBlur);
        window.removeEventListener('resume', this.resumeAudioContext);
        document.removeEventListener('touchstart', this.handleInteraction);
        document.removeEventListener('touchend', this.handleInteraction);
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

export default AudioManager;

