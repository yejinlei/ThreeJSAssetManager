import * as THREE from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

export default class WebXRManager {
    constructor() {
        // 直接使用全局实例，避免重复创建
        this.threeJSAssetsManager = window.ThreeJSAssetsManagerInstance;
        this.scene = this.threeJSAssetsManager?.scene;
        this.camera = this.threeJSAssetsManager?.camera;
        this.renderer = this.threeJSAssetsManager?.renderManagerInstance?.webGLRenderer;
        this.debug = this.threeJSAssetsManager?.debug;
        this.gui = this.threeJSAssetsManager?.gui;

        this.config = config.WebXR || {};
        this.enabled = this.config.enabled !== false;

        this.controllers = [];
        this.isVRSupported = false;
        this.isARSupported = false;

        if (this.enabled) {
            this.init();
        }

        if (this.debug) {
            this.setupDebugGUI();
        }
    }

    init() {
        // Check WebXR support
        if ('xr' in navigator) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                this.isVRSupported = supported;
                if (supported) {
                    console.log('VR is supported');
                    this.setupVR();
                }
            });

            navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
                this.isARSupported = supported;
                if (supported) {
                    console.log('AR is supported');
                    this.setupAR();
                }
            });
        } else {
            console.warn('WebXR not supported in this browser');
        }
    }

    setupVR() {
        // Enable XR on renderer
        this.renderer.xr.enabled = true;

        // Create VR button
        if (this.config.createVRButton !== false) {
            this.createVRButton();
        }

        // Setup controllers
        this.setupControllers();
    }

    setupAR() {
        // Enable XR on renderer
        this.renderer.xr.enabled = true;

        // Create AR button
        if (this.config.createARButton !== false) {
            this.createARButton();
        }
    }

    createVRButton() {
        const button = document.createElement('button');
        button.id = 'VRButton';
        button.textContent = 'ENTER VR';
        button.style.position = 'absolute';
        button.style.bottom = '20px';
        button.style.left = '50%';
        button.style.transform = 'translateX(-50%)';
        button.style.padding = '12px 24px';
        button.style.border = '1px solid #fff';
        button.style.borderRadius = '4px';
        button.style.background = 'rgba(0,0,0,0.8)';
        button.style.color = '#fff';
        button.style.font = 'normal 13px sans-serif';
        button.style.cursor = 'pointer';
        button.style.zIndex = '999';

        button.onclick = () => {
            if (this.renderer.xr.isPresenting) {
                this.renderer.xr.getSession().end();
            } else {
                navigator.xr.requestSession('immersive-vr', {
                    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
                }).then((session) => {
                    this.renderer.xr.setSession(session);
                });
            }
        };

        document.body.appendChild(button);
    }

    createARButton() {
        const button = document.createElement('button');
        button.id = 'ARButton';
        button.textContent = 'ENTER AR';
        button.style.position = 'absolute';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.padding = '12px 24px';
        button.style.border = '1px solid #fff';
        button.style.borderRadius = '4px';
        button.style.background = 'rgba(0,0,0,0.8)';
        button.style.color = '#fff';
        button.style.font = 'normal 13px sans-serif';
        button.style.cursor = 'pointer';
        button.style.zIndex = '999';

        button.onclick = () => {
            if (this.renderer.xr.isPresenting) {
                this.renderer.xr.getSession().end();
            } else {
                navigator.xr.requestSession('immersive-ar', {
                    requiredFeatures: ['hit-test'],
                    optionalFeatures: ['dom-overlay'],
                    domOverlay: { root: document.body }
                }).then((session) => {
                    this.renderer.xr.setSession(session);
                });
            }
        };

        document.body.appendChild(button);
    }

    setupControllers() {
        // Controller 1
        const controller1 = this.renderer.xr.getController(0);
        controller1.addEventListener('selectstart', this.onSelectStart.bind(this));
        controller1.addEventListener('selectend', this.onSelectEnd.bind(this));
        this.scene.add(controller1);

        // Controller 2
        const controller2 = this.renderer.xr.getController(1);
        controller2.addEventListener('selectstart', this.onSelectStart.bind(this));
        controller2.addEventListener('selectend', this.onSelectEnd.bind(this));
        this.scene.add(controller2);

        // Add visual representation
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });

        const line1 = new THREE.Line(geometry, material);
        controller1.add(line1);

        const line2 = new THREE.Line(geometry, material);
        controller2.add(line2);

        this.controllers.push(controller1, controller2);
    }

    onSelectStart(event) {
        console.log('VR Controller select start', event);
    }

    onSelectEnd(event) {
        console.log('VR Controller select end', event);
    }

    setupDebugGUI() {
        if (!this.gui) return;

        const folder = this.gui.xrFolder || this.gui.addFolder('🔮 WebXR (XR系统)');

        const status = {
            vrSupported: this.isVRSupported,
            arSupported: this.isARSupported,
            xrEnabled: this.enabled
        };

        folder.add(status, 'vrSupported').name('VR支持(VR Supported)').listen();
        folder.add(status, 'arSupported').name('AR支持(AR Supported)').listen();
        folder.add(status, 'xrEnabled').name('XR启用(XR Enabled)').listen();
    }
}
