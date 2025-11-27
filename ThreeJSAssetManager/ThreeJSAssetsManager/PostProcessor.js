import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

export default class PostProcessor {
    constructor() {
        this.threeJSAssetsManager = new ThreeJSAssetsManager();
        this.scene = this.threeJSAssetsManager.scene;
        this.camera = this.threeJSAssetsManager.camera;
        this.renderer = this.threeJSAssetsManager.renderManagerInstance.webGLRenderer;
        this.sizes = this.threeJSAssetsManager.sizes;
        this.debug = this.threeJSAssetsManager.debug;
        this.gui = this.threeJSAssetsManager.gui;

        this.config = config.PostProcessing || {};
        this.enabled = this.config.enabled === true;

        this.instance = null;

        if (this.enabled) {
            this.init();
        }

        if (this.debug) {
            this.setupDebugGUI();
        }
    }

    init() {
        this.instance = new EffectComposer(this.renderer);
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(this.sizes.pixelRatio);

        // Render Pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.instance.addPass(renderPass);

        // Bloom Pass
        if (this.config.bloom && this.config.bloom.enabled) {
            this.bloomPass = new UnrealBloomPass(
                new THREE.Vector2(this.sizes.width, this.sizes.height),
                this.config.bloom.strength,
                this.config.bloom.radius,
                this.config.bloom.threshold
            );
            this.instance.addPass(this.bloomPass);
        }

        // Output Pass (Gamma Correction, Tone Mapping)
        const outputPass = new OutputPass();
        this.instance.addPass(outputPass);
    }

    resize() {
        if (this.instance) {
            this.instance.setSize(this.sizes.width, this.sizes.height);
            this.instance.setPixelRatio(this.sizes.pixelRatio);
        }
    }

    update() {
        if (this.enabled && this.instance) {
            this.instance.render();
        }
        import * as THREE from 'three';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
        import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
        import config from './config.js';

        export default class PostProcessor {
            constructor() {
                this.threeJSAssetsManager = new ThreeJSAssetsManager();
                this.scene = this.threeJSAssetsManager.scene;
                this.camera = this.threeJSAssetsManager.camera;
                this.renderer = this.threeJSAssetsManager.renderManagerInstance.webGLRenderer;
                this.sizes = this.threeJSAssetsManager.sizes;
                this.debug = this.threeJSAssetsManager.debug;
                this.gui = this.threeJSAssetsManager.gui;

                this.config = config.PostProcessing || {};
                this.enabled = this.config.enabled === true;

                this.instance = null;

                if (this.enabled) {
                    this.init();
                }

                if (this.debug) {
                    this.setupDebugGUI();
                }
            }

            init() {
                this.instance = new EffectComposer(this.renderer);
                this.instance.setSize(this.sizes.width, this.sizes.height);
                this.instance.setPixelRatio(this.sizes.pixelRatio);

                // Render Pass
                const renderPass = new RenderPass(this.scene, this.camera);
                this.instance.addPass(renderPass);

                // Bloom Pass
                if (this.config.bloom && this.config.bloom.enabled) {
                    this.bloomPass = new UnrealBloomPass(
                        new THREE.Vector2(this.sizes.width, this.sizes.height),
                        this.config.bloom.strength,
                        this.config.bloom.radius,
                        this.config.bloom.threshold
                    );
                    this.instance.addPass(this.bloomPass);
                }

                // Output Pass (Gamma Correction, Tone Mapping)
                const outputPass = new OutputPass();
                this.instance.addPass(outputPass);
            }

            resize() {
                if (this.instance) {
                    this.instance.setSize(this.sizes.width, this.sizes.height);
                    this.instance.setPixelRatio(this.sizes.pixelRatio);
                }
            }

            update() {
                if (this.enabled && this.instance) {
                    this.instance.render();
                }
            }

            setupDebugGUI() {
                if (!this.gui) return;

                const folder = this.gui.addFolder('PostProcessing(后期处理)');

                folder.add(this, 'enabled').name('启用(Enabled)').onChange((value) => {
                    if (value && !this.instance) {
                        this.init();
                    }
                });

                if (this.config.bloom) {
                    const bloomFolder = folder.addFolder('Bloom(辉光)');
                    const bloomConfig = {
                        enabled: this.config.bloom.enabled,
                        strength: this.config.bloom.strength,
                        radius: this.config.bloom.radius,
                        threshold: this.config.bloom.threshold
                    };

                    bloomFolder.add(bloomConfig, 'enabled').name('启用(Enabled)').onChange((value) => {
                        this.config.bloom.enabled = value;
                        if (value && !this.bloomPass) {
                            // Re-initialize to add bloom pass
                            this.enabled = true;
                            this.init();
                        } else if (this.bloomPass) {
                            this.bloomPass.enabled = value;
                        }
                    });

                    bloomFolder.add(bloomConfig, 'strength', 0, 3, 0.01).name('强度(Strength)').onChange((value) => {
                        this.config.bloom.strength = value;
                        if (this.bloomPass) this.bloomPass.strength = value;
                    });
                    bloomFolder.add(bloomConfig, 'radius', 0, 1, 0.01).name('半径(Radius)').onChange((value) => {
                        this.config.bloom.radius = value;
                        if (this.bloomPass) this.bloomPass.radius = value;
                    });
                    bloomFolder.add(bloomConfig, 'threshold', 0, 1, 0.01).name('阈值(Threshold)').onChange((value) => {
                        this.config.bloom.threshold = value;
                        if (this.bloomPass) this.bloomPass.threshold = value;
                    });
                }
            }
        }
