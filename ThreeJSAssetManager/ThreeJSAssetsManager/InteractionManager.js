import * as THREE from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

export default class InteractionManager {
    constructor() {
        this.threeJSAssetsManager = new ThreeJSAssetsManager();
        this.scene = this.threeJSAssetsManager.scene;
        this.camera = this.threeJSAssetsManager.camera;
        this.canvas = this.threeJSAssetsManager.canvas;
        this.debug = this.threeJSAssetsManager.debug;
        this.gui = this.threeJSAssetsManager.gui;

        this.config = config.Interaction || {};
        this.enabled = this.config.enabled !== false;

        // Raycaster setup
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Interaction state
        this.hoveredObject = null;
        this.selectedObject = null;
        this.isDragging = false;
        this.dragPlane = new THREE.Plane();
        this.dragOffset = new THREE.Vector3();
        this.intersectionPoint = new THREE.Vector3();

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

        console.log('InteractionManager initialized');
        // Bind event listeners
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        if (!this.enabled) return;
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false }); // Add wheel listener
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent context menu

        console.log('InteractionManager initialized');

        // Handle hover
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (this.hoveredObject !== object) {
                this.hoveredObject = object;
                this.onHoverCallbacks.forEach(cb => cb(object, intersects[0]));

                if (this.config.highlightOnHover) {
                    this.canvas.style.cursor = 'pointer';
                }
            }
        } else {
            if (this.hoveredObject) {
                this.hoveredObject = null;
                this.canvas.style.cursor = 'default';
            }
        }

        // Handle dragging
        if (this.isDragging && this.selectedObject) {
            this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint);
            this.selectedObject.position.copy(this.intersectionPoint).sub(this.dragOffset);
    onMouseMove(event) {
        }
    }
        // Calculate mouse position in normalized device coordinates

    onClick(event) {
        if (!this.enabled) return;

        // Handle Rotation
        if (this.isRotating && this.selectedObject) {
            const deltaX = event.movementX;
            const deltaY = event.movementY;

            // Rotate around Y axis (horizontal mouse movement)
            this.selectedObject.rotation.y += deltaX * this.rotateSpeed;

            // Optional: Rotate around X axis (vertical mouse movement)
            // this.selectedObject.rotation.x += deltaY * this.rotateSpeed;

            return; // Skip other checks while rotating
        }

        // Update raycaster
        const rect = this.canvas.getBoundingClientRect();

        // Check for intersections - 确保深入遍历所有子对象
        // 特别针对GLB模型，需要正确检测到其中的网格
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // 过滤出可交互的对象
        const interactiveIntersects = intersects.filter(intersect => {
            return intersect.object.userData && intersect.object.userData.interactive;
        });

        // Handle hover
        if (interactiveIntersects.length > 0) {
            const object = interactiveIntersects[0].object;
            if (this.hoveredObject !== object) {
                // 重置之前悬停的对象
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
                // 重置悬停对象的高亮效果
                if (this.hoveredObject.userData && this.config.highlightOnHover) {
                    this.resetObjectHighlight(this.hoveredObject);
                }
                this.hoveredObject = null;
                this.canvas.style.cursor = 'default';
            }
        }

        // Handle dragging
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

            // 拖动时找到对象的根节点（模型组）
            const targetObject = this.findRootInteractiveObject(this.selectedObject);
            if (targetObject) {
                targetObject.position.copy(this.intersectionPoint).sub(this.dragOffset);
                this.onDragCallbacks.forEach(cb => cb(targetObject, this.intersectionPoint));
            }

            console.log('Clicked object:', object.name || object.type);
        }
    }

    onMouseDown(event) {
        if (!this.enabled || !this.config.enableDrag) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            this.selectedObject = object;
            this.isDragging = true;

            // Set up drag plane
            const normal = new THREE.Vector3(0, 1, 0); // Horizontal plane
            this.dragPlane.setFromNormalAndCoplanarPoint(normal, intersects[0].point);

            this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint);
            this.dragOffset.copy(this.intersectionPoint).sub(object.position);

            this.onDragStartCallbacks.forEach(cb => cb(object, intersects[0]));
        }
    }

    onMouseUp(event) {
        if (!this.enabled || !this.isDragging) return;

        this.isDragging = false;
        if (this.selectedObject) {
            this.onDragEndCallbacks.forEach(cb => cb(this.selectedObject));
        }
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

        const folder = this.gui.addFolder('Interaction(交互系统)');

        folder.add(this, 'enabled').name('启用(Enabled)');

        if (this.config.enableDrag !== undefined) {
            folder.add(this.config, 'enableDrag').name('启用拖拽(Enable Drag)');
        }

        if (this.config.highlightOnHover !== undefined) {
            folder.add(this.config, 'highlightOnHover').name('悬停高亮(Highlight on Hover)');
        }

        // Debug info
        const debugInfo = {
            hoveredObject: 'None',
            selectedObject: 'None'
        };

        folder.add(debugInfo, 'hoveredObject').name('悬停对象(Hovered)').listen();
        folder.add(debugInfo, 'selectedObject').name('选中对象(Selected)').listen();

        // Update debug info
        setInterval(() => {
            debugInfo.hoveredObject = this.hoveredObject ? (this.hoveredObject.name || this.hoveredObject.type) : 'None';
            debugInfo.selectedObject = this.selectedObject ? (this.selectedObject.name || this.selectedObject.type) : 'None';
        }, 100);
    }
}
