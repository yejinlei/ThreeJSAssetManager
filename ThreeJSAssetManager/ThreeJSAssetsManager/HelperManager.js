import * as THREE from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

export default class HelperManager {
    constructor() {
        // 直接使用全局实例，避免重复创建
        this.threeJSAssetsManager = window.ThreeJSAssetsManagerInstance;
        this.scene = this.threeJSAssetsManager?.scene;
        this.camera = this.threeJSAssetsManager?.camera;
        this.debug = this.threeJSAssetsManager?.debug;
        this.gui = this.threeJSAssetsManager?.gui;

        this.config = config.Helpers || {};
        this.helpers = {};

        this.init();

        if (this.debug) {
            this.setupDebugGUI();
        }
    }

    init() {
        // Grid Helper
        if (this.config.grid && this.config.grid.enabled) {
            this.helpers.grid = new THREE.GridHelper(
                this.config.grid.size || 10,
                this.config.grid.divisions || 10,
                this.config.grid.colorCenterLine || 0x444444,
                this.config.grid.colorGrid || 0x888888
            );
            this.scene.add(this.helpers.grid);
        }

        // Axes Helper
        if (this.config.axes && this.config.axes.enabled) {
            this.helpers.axes = new THREE.AxesHelper(this.config.axes.size || 5);
            this.scene.add(this.helpers.axes);
        }

        // Camera Helper
        if (this.config.camera && this.config.camera.enabled && this.camera) {
            this.helpers.camera = new THREE.CameraHelper(this.camera);
            this.scene.add(this.helpers.camera);
        }
    }

    setupDebugGUI() {
        if (!this.gui) return;

        const folder = this.gui.helperFolder || (this.gui.utilitiesFolder || this.gui.addFolder('🛠️ Utilities (辅助工具)')).addFolder('🧰 Helpers (辅助对象)');

        // Grid Helper Controls
        if (this.config.grid) {
            const gridFolder = folder.addFolder('Grid(网格)');
            const gridConfig = {
                visible: this.config.grid.enabled
            };

            gridFolder.add(gridConfig, 'visible').name('显示(Visible)').onChange((value) => {
                if (this.helpers.grid) {
                    this.helpers.grid.visible = value;
                } else if (value) {
                    this.helpers.grid = new THREE.GridHelper(
                        this.config.grid.size || 10,
                        this.config.grid.divisions || 10
                    );
                    this.scene.add(this.helpers.grid);
                }
            });
        }

        // Axes Helper Controls
        if (this.config.axes) {
            const axesFolder = folder.addFolder('Axes(坐标轴)');
            const axesConfig = {
                visible: this.config.axes.enabled
            };

            axesFolder.add(axesConfig, 'visible').name('显示(Visible)').onChange((value) => {
                if (this.helpers.axes) {
                    this.helpers.axes.visible = value;
                } else if (value) {
                    this.helpers.axes = new THREE.AxesHelper(this.config.axes.size || 5);
                    this.scene.add(this.helpers.axes);
                }
            });
        }

        // Camera Helper Controls
        if (this.config.camera) {
            const cameraFolder = folder.addFolder('Camera(相机)');
            const cameraConfig = {
                visible: this.config.camera.enabled
            };

            cameraFolder.add(cameraConfig, 'visible').name('显示(Visible)').onChange((value) => {
                if (this.helpers.camera) {
                    this.helpers.camera.visible = value;
                } else if (value && this.camera) {
                    this.helpers.camera = new THREE.CameraHelper(this.camera);
                    this.scene.add(this.helpers.camera);
                }
            });
        }
    }

    update() {
        // Update camera helper if it exists
        if (this.helpers.camera) {
            this.helpers.camera.update();
        }
    }
}
