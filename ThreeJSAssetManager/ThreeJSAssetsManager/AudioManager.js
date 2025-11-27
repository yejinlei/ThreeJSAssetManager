import * as THREE from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

export default class AudioManager {
    constructor() {
        // 直接使用全局实例，避免重复创建
        this.threeJSAssetsManager = window.ThreeJSAssetsManagerInstance;
        this.scene = this.threeJSAssetsManager?.scene;
        this.camera = this.threeJSAssetsManager?.camera;
        this.debug = this.threeJSAssetsManager?.debug;
        this.gui = this.threeJSAssetsManager?.gui;

        this.config = config.Audio || {};
        this.enabled = this.config.enabled !== false;

        this.listener = null;
        this.audioLoader = null;
        this.sounds = new Map();
        this.positionalSounds = [];

        if (this.enabled) {
            this.init();
        }

        if (this.debug) {
            this.setupDebugGUI();
        }
    }

    init() {
        // Create AudioListener and attach to camera
        this.listener = new THREE.AudioListener();
        if (this.camera) {
            this.camera.add(this.listener);
        }

        // Create AudioLoader
        this.audioLoader = new THREE.AudioLoader();

        console.log('AudioManager initialized');
    }

    // Load and create global audio (non-positional)
    loadGlobalAudio(name, url, options = {}) {
        if (!this.listener) return null;

        const sound = new THREE.Audio(this.listener);

        this.audioLoader.load(url, (buffer) => {
            sound.setBuffer(buffer);
            sound.setLoop(options.loop || false);
            sound.setVolume(options.volume || 0.5);

            if (options.autoplay) {
                sound.play();
            }
        }, undefined, (error) => {
            console.error('Error loading audio:', error);
        });

        this.sounds.set(name, sound);
        return sound;
    }

    // Load and create positional audio (3D spatial)
    loadPositionalAudio(name, url, position = { x: 0, y: 0, z: 0 }, options = {}) {
        if (!this.listener) return null;

        const sound = new THREE.PositionalAudio(this.listener);

        this.audioLoader.load(url, (buffer) => {
            sound.setBuffer(buffer);
            sound.setRefDistance(options.refDistance || 1);
            sound.setLoop(options.loop || false);
            sound.setVolume(options.volume || 0.5);
            sound.setDistanceModel(options.distanceModel || 'inverse');
            sound.setMaxDistance(options.maxDistance || 10000);

            if (options.autoplay) {
                sound.play();
            }
        }, undefined, (error) => {
            console.error('Error loading positional audio:', error);
        });

        // Create a visual indicator (optional)
        if (options.showIndicator !== false) {
            const geometry = new THREE.SphereGeometry(0.2, 16, 16);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(position.x, position.y, position.z);
            mesh.add(sound);
            this.scene.add(mesh);

            this.positionalSounds.push({ sound, mesh, name });
        } else {
            const object = new THREE.Object3D();
            object.position.set(position.x, position.y, position.z);
            object.add(sound);
            this.scene.add(object);

            this.positionalSounds.push({ sound, mesh: object, name });
        }

        this.sounds.set(name, sound);
        return sound;
    }

    // Play sound by name
    play(name) {
        const sound = this.sounds.get(name);
        if (sound && !sound.isPlaying) {
            sound.play();
        }
    }

    // Pause sound by name
    pause(name) {
        const sound = this.sounds.get(name);
        if (sound && sound.isPlaying) {
            sound.pause();
        }
    }

    // Stop sound by name
    stop(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.stop();
        }
    }

    // Set volume for specific sound
    setVolume(name, volume) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.setVolume(volume);
        }
    }

    // Set master volume
    setMasterVolume(volume) {
        if (this.listener) {
            this.listener.setMasterVolume(volume);
        }
    }

    setupDebugGUI() {
        if (!this.gui) return;

        const folder = this.gui.audioFolder || this.gui.addFolder('🔊 Audio System (音频系统)');

        const controls = {
            masterVolume: 1.0,
            enabled: this.enabled
        };

        folder.add(controls, 'enabled').name('启用(Enabled)').onChange((value) => {
            this.enabled = value;
            if (!value) {
                this.sounds.forEach(sound => sound.stop());
            }
        });

        folder.add(controls, 'masterVolume', 0, 1, 0.01).name('主音量(Master Volume)').onChange((value) => {
            this.setMasterVolume(value);
        });

        // List all sounds
        const soundsFolder = folder.addFolder('Sounds(声音列表)');

        const stats = {
            soundCount: 0,
            positionalCount: 0
        };

        soundsFolder.add(stats, 'soundCount').name('声音数量(Sound Count)').listen();
        soundsFolder.add(stats, 'positionalCount').name('位置音频数量(Positional Count)').listen();

        setInterval(() => {
            stats.soundCount = this.sounds.size;
            stats.positionalCount = this.positionalSounds.length;
        }, 1000);

        // Example: Create test sound button
        const actions = {
            playTestSound: () => {
                console.log('Test sound feature - load your own audio files');
                // Example: this.loadGlobalAudio('test', 'path/to/sound.mp3', { autoplay: true });
            }
        };

        folder.add(actions, 'playTestSound').name('播放测试音频(Play Test Sound)');
    }
}
