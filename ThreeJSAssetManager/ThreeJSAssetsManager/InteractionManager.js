import * as THREE from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

export default class InteractionManager {
    constructor() {
        // 直接使用全局实例，避免重复创建
        this.threeJSAssetsManager = window.ThreeJSAssetsManagerInstance;
        this.scene = this.threeJSAssetsManager?.scene;
        this.camera = this.threeJSAssetsManager?.camera;
        this.canvas = this.threeJSAssetsManager?.canvas;
        this.debug = this.threeJSAssetsManager?.debug;
        this.gui = this.threeJSAssetsManager?.gui;

        this.config = config.Interaction || {};
        this.enabled = this.config.enabled !== false;

        // Raycaster setup
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Interaction state
        this.hoveredObject = null;
        this.selectedObject = null;
        this.isDragging = false;
        this.isRotating = false;
        this.dragPlane = new THREE.Plane();
        this.dragOffset = new THREE.Vector3();
        this.intersectionPoint = new THREE.Vector3();

        // Interaction parameters
        this.rotateSpeed = 0.01;
        this.scaleSpeed = 0.1;
        this.minScale = 0.1;
        this.maxScale = 5.0;

        // Event callbacks
        this.onHoverCallbacks = [];
        this.onClickCallbacks = [];
        this.onDragStartCallbacks = [];
        this.onDragCallbacks = [];
        this.onDragEndCallbacks = [];

        if (this.enabled) {
            this.init();
        }

        if (this.debug) {
            this.setupDebugGUI();
        }
    }

    init() {
        // Bind event listeners
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('click', this.onClick.bind(this));
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        console.log('InteractionManager initialized');
    }

    onWheel(event) {
        if (!this.enabled || !this.hoveredObject) return;

        event.preventDefault();

        const targetObject = this.findRootInteractiveObject(this.hoveredObject);

        if (targetObject) {
            const scaleFactor = 1 + (event.deltaY < 0 ? this.scaleSpeed : -this.scaleSpeed);

            // Apply scale
            const newScale = targetObject.scale.x * scaleFactor;

            // Clamp scale
            if (newScale >= this.minScale && newScale <= this.maxScale) {
                targetObject.scale.multiplyScalar(scaleFactor);
                // console.log('Scaling:', targetObject.name, targetObject.scale.x);
            }
        }
    }

    onMouseMove(event) {
        if (!this.enabled) return;

        // Calculate mouse position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Handle Rotation
        if (this.isRotating && this.selectedObject) {
            const deltaX = event.movementX;
            // const deltaY = event.movementY;

            // Rotate around Y axis (horizontal mouse movement)
            this.selectedObject.rotation.y += deltaX * this.rotateSpeed;

            return; // Skip other checks while rotating
        }

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check for intersections
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // Filter interactive objects
        const interactiveIntersects = intersects.filter(intersect => {
            return intersect.object.userData && intersect.object.userData.interactive;
        });

        // Handle hover
        if (interactiveIntersects.length > 0) {
            const object = interactiveIntersects[0].object;
            if (this.hoveredObject !== object) {
                // Reset previous hover
                if (this.hoveredObject && this.hoveredObject.userData && this.config.highlightOnHover) {
                    this.resetObjectHighlight(this.hoveredObject);
                }

                this.hoveredObject = object;
                this.onHoverCallbacks.forEach(cb => cb(object, interactiveIntersects[0]));

                if (this.config.highlightOnHover) {
                    this.canvas.style.cursor = 'pointer';
                    this.highlightObject(object);
                }
            }
        } else {
            if (this.hoveredObject) {
                // Reset hover
                if (this.hoveredObject.userData && this.config.highlightOnHover) {
                    this.resetObjectHighlight(this.hoveredObject);
                }
                this.hoveredObject = null;
                this.canvas.style.cursor = 'default';
            }
        }

        // Handle dragging
        if (this.isDragging && this.selectedObject) {
            this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint);

            const targetObject = this.findRootInteractiveObject(this.selectedObject);
            if (targetObject) {
                targetObject.position.copy(this.intersectionPoint).sub(this.dragOffset);
                this.onDragCallbacks.forEach(cb => cb(targetObject, this.intersectionPoint));
            }
        }
    }

    onClick(event) {
        if (!this.enabled) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        const interactiveIntersects = intersects.filter(intersect => {
            return intersect.object.userData && intersect.object.userData.interactive;
        });

        if (interactiveIntersects.length > 0) {
            const clickedMesh = interactiveIntersects[0].object;
            const rootObject = this.findRootInteractiveObject(clickedMesh);

            if (rootObject) {
                this.selectedObject = rootObject;
                this.onClickCallbacks.forEach(cb => cb(rootObject, interactiveIntersects[0]));
                // console.log('Clicked object:', rootObject.name || rootObject.type);
            }
        }
    }

    onMouseDown(event) {
        if (!this.enabled) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        const interactiveIntersects = intersects.filter(intersect => {
            return intersect.object.userData && intersect.object.userData.interactive;
        });

        if (interactiveIntersects.length > 0) {
            const clickedMesh = interactiveIntersects[0].object;
            const rootObject = this.findRootInteractiveObject(clickedMesh);

            if (rootObject) {
                this.selectedObject = rootObject;

                // Left Click (0) -> Drag
                if (event.button === 0 && this.config.enableDrag) {
                    this.isDragging = true;

                    const normal = new THREE.Vector3(0, 1, 0); // Horizontal plane
                    this.dragPlane.setFromNormalAndCoplanarPoint(normal, interactiveIntersects[0].point);

                    this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint);
                    this.dragOffset.copy(this.intersectionPoint).sub(rootObject.position);

                    this.onDragStartCallbacks.forEach(cb => cb(rootObject, interactiveIntersects[0]));
                }

                // Right Click (2) -> Rotate
                if (event.button === 2) {
                    this.isRotating = true;
                }
            }
        }
    }

    onMouseUp(event) {
        if (!this.enabled) return;

        if (this.isDragging) {
            this.isDragging = false;
            if (this.selectedObject) {
                this.onDragEndCallbacks.forEach(cb => cb(this.selectedObject));
            }
        }

        if (this.isRotating) {
            this.isRotating = false;
        }
    }

    // Helper methods
    highlightObject(object) {
        if (!object.userData || !object.userData.originalMaterial) return;

        if (!object.userData.highlighted) {
            object.userData.highlighted = true;
            if (Array.isArray(object.material)) {
                object.userData.tempMaterials = object.material.map(mat => mat.clone());
                object.material = object.material.map(mat => {
                    const newMat = mat.clone();
                    newMat.emissive.setHex(0x444444);
                    newMat.emissiveIntensity = 0.5;
                    return newMat;
                });
            } else {
                const newMat = object.userData.originalMaterial.clone();
                newMat.emissive.setHex(0x444444);
                newMat.emissiveIntensity = 0.5;
                object.material = newMat;
            }
        }
    }

    resetObjectHighlight(object) {
        if (!object.userData || !object.userData.highlighted) return;

        object.userData.highlighted = false;

        if (Array.isArray(object.userData.tempMaterials)) {
            object.material = object.userData.tempMaterials;
            delete object.userData.tempMaterials;
        } else if (object.userData.originalMaterial) {
            object.material = object.userData.originalMaterial;
        }
    }

    findRootInteractiveObject(object) {
        let current = object;
        let parent = object.parent;

        while (parent && parent.name !== 'GLBMainGroup' && parent.type !== 'Scene') {
            if (parent.name && parent.name.includes('Horse')) {
                return parent;
            }
            current = parent;
            parent = parent.parent;
        }

        return current;
    }

    update() {
        // Update loop
    }

    // Public API for registering callbacks
    onHover(callback) {
        this.onHoverCallbacks.push(callback);
    }

    onClickEvent(callback) {
        this.onClickCallbacks.push(callback);
    }

    onDragStart(callback) {
        this.onDragStartCallbacks.push(callback);
    }

    onDrag(callback) {
        this.onDragCallbacks.push(callback);
    }

    onDragEnd(callback) {
        this.onDragEndCallbacks.push(callback);
    }

    setupDebugGUI() {
        if (!this.gui) return;

        // 添加到交互与事件分类下
        const interactionFolder = this.gui.interactionFolder || this.gui.addFolder('🖱️ Interaction (交互系统)');
        const folder = interactionFolder.addFolder('Interaction(交互系统)');

        folder.add(this, 'enabled').name('启用(Enabled)');

        if (this.config.enableDrag !== undefined) {
            folder.add(this.config, 'enableDrag').name('启用拖拽(Enable Drag)');
        }

        if (this.config.highlightOnHover !== undefined) {
            folder.add(this.config, 'highlightOnHover').name('悬停高亮(Highlight on Hover)');
        }

        folder.add(this, 'rotateSpeed', 0.001, 0.1).name('旋转速度(Rotate Speed)');
        folder.add(this, 'scaleSpeed', 0.01, 0.5).name('缩放速度(Scale Speed)');

        // Debug info
        const debugInfo = {
            hoveredObject: 'None',
            selectedObject: 'None',
            state: 'Idle'
        };

        folder.add(debugInfo, 'hoveredObject').name('悬停对象(Hovered)').listen();
        folder.add(debugInfo, 'selectedObject').name('选中对象(Selected)').listen();
        folder.add(debugInfo, 'state').name('当前状态(State)').listen();

        // Update debug info
        setInterval(() => {
            debugInfo.hoveredObject = this.hoveredObject ? (this.hoveredObject.name || this.hoveredObject.type) : 'None';
            debugInfo.selectedObject = this.selectedObject ? (this.selectedObject.name || this.selectedObject.type) : 'None';

            if (this.isDragging) debugInfo.state = 'Dragging';
            else if (this.isRotating) debugInfo.state = 'Rotating';
            else debugInfo.state = 'Idle';
        }, 100);
    }
}
