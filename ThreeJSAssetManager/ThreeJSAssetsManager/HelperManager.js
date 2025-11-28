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
                this.config.grid.size,
                this.config.grid.divisions,
                this.config.grid.colorCenterLine,
                this.config.grid.colorGrid
            );
            this.scene.add(this.helpers.grid);
        }

        // Axes Helper
        if (this.config.axes && this.config.axes.enabled) {
            this.helpers.axes = new THREE.AxesHelper(this.config.axes.size);
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

        // 归类到 Utilities 文件夹下
        const folder = this.gui.helperFolder || (this.gui.utilitiesFolder || this.gui.addFolder('🛠️ Utilities (辅助工具)')).addFolder('🧰 Helpers (辅助对象)');

        // Grid Helper Controls
        if (this.config.grid) {
            const gridFolder = folder.addFolder('Grid(网格)');
            const gridConfig = {
                visible: this.config.grid.enabled,
                size: this.config.grid.size,
                divisions: this.config.grid.divisions,
                colorCenterLine: '#' + this.config.grid.colorCenterLine.toString(16).padStart(6, '0'),
                colorGrid: '#' + this.config.grid.colorGrid.toString(16).padStart(6, '0'),
                recreate: () => {
                    if (this.helpers.grid) {
                        this.scene.remove(this.helpers.grid);
                        this.helpers.grid.dispose();
                    }
                    this.helpers.grid = new THREE.GridHelper(
                        gridConfig.size,
                        gridConfig.divisions,
                        new THREE.Color(gridConfig.colorCenterLine),
                        new THREE.Color(gridConfig.colorGrid)
                    );
                    this.helpers.grid.visible = gridConfig.visible;
                    this.scene.add(this.helpers.grid);

                    // 更新 config
                    this.config.grid.size = gridConfig.size;
                    this.config.grid.divisions = gridConfig.divisions;
                    this.config.grid.colorCenterLine = parseInt(gridConfig.colorCenterLine.replace('#', ''), 16);
                    this.config.grid.colorGrid = parseInt(gridConfig.colorGrid.replace('#', ''), 16);
                }
            };

            gridFolder.add(gridConfig, 'visible').name('显示(Visible)').onChange((value) => {
                if (this.helpers.grid) {
                    this.helpers.grid.visible = value;
                } else if (value) {
                    gridConfig.recreate();
                }
                this.config.grid.enabled = value;
            });

            gridFolder.add(gridConfig, 'size', 1, 100, 1).name('大小(Size)');
            gridFolder.add(gridConfig, 'divisions', 1, 100, 1).name('分割数(Divisions)');
            gridFolder.addColor(gridConfig, 'colorCenterLine').name('中心线颜色(Center Color)');
            gridFolder.addColor(gridConfig, 'colorGrid').name('网格颜色(Grid Color)');
            gridFolder.add(gridConfig, 'recreate').name('🔄 应用更改(Apply Changes)');
        }

        // Axes Helper Controls
        if (this.config.axes) {
            const axesFolder = folder.addFolder('Axes(坐标轴)');
            const axesConfig = {
                visible: this.config.axes.enabled,
                size: this.config.axes.size,
                recreate: () => {
                    if (this.helpers.axes) {
                        this.scene.remove(this.helpers.axes);
                        // AxesHelper 没有 dispose 方法
                    }
                    this.helpers.axes = new THREE.AxesHelper(axesConfig.size);
                    this.helpers.axes.visible = axesConfig.visible;
                    this.scene.add(this.helpers.axes);

                    // 更新 config
                    this.config.axes.size = axesConfig.size;
                }
            };

            axesFolder.add(axesConfig, 'visible').name('显示(Visible)').onChange((value) => {
                if (this.helpers.axes) {
                    this.helpers.axes.visible = value;
                } else if (value) {
                    axesConfig.recreate();
                }
                this.config.axes.enabled = value;
            });

            axesFolder.add(axesConfig, 'size', 0.1, 50, 0.1).name('大小(Size)');
            axesFolder.add(axesConfig, 'recreate').name('🔄 应用更改(Apply Changes)');
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
                this.config.camera.enabled = value;
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
