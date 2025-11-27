import * as THREE from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

export default class InteractionManager {
    constructor(options = {}) {
        // 直接使用全局实例，避免重复创建
        this.threeJSAssetsManager = window.ThreeJSAssetsManagerInstance;
        this.scene = this.threeJSAssetsManager?.scene;
        this.camera = this.threeJSAssetsManager?.camera;
        this.canvas = this.threeJSAssetsManager?.canvas;
        // 支持配置对象格式
        this.debug = options.debug !== undefined ? options.debug : this.threeJSAssetsManager?.debug;
        this.gui = options.gui !== undefined ? options.gui : this.threeJSAssetsManager?.gui;

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
        this.lastPosition = new THREE.Vector3(); // 保存上一位置用于平滑过渡
        this.dragNormal = new THREE.Vector3(); // 拖拽平面的法线
        this.dragOrigin = new THREE.Vector3(); // 拖拽起点
        this.isDraggingInProgress = false; // 标记拖拽是否正在进行
        
        // 轴向约束相关属性
        this.activeAxisConstraint = null; // 当前激活的轴向约束 'x', 'y', 'z' 或 null
        this.axisConstraintActive = false; // 是否有轴向约束激活
        // 轴向约束视觉反馈相关
        this.axisHelpers = {}; // 存储轴向指示线对象
        this.axisHelperLength = 3; // 轴向指示线长度

        // Interaction parameters
        this.rotateSpeed = 0.01;
        this.scaleSpeed = 0.1;
        this.minScale = 0.1;
        this.maxScale = 5.0;
        this.dragSensitivity = 1.0; // 拖拽灵敏度
        this.dragSmoothing = 0.05; // 拖拽平滑度 (0-1)
        
        // 拖拽限制范围
        this.enableDragLimits = false;
        this.dragLimits = {
            x: { min: -10, max: 10 },
            y: { min: -10, max: 10 },
            z: { min: -10, max: 10 }
        };

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
        this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this)); // 添加双击事件监听
        
        // 添加键盘事件监听器 - 轴向约束控制
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        // 双击检测相关变量
        this.clickCount = 0;
        this.lastClickTime = 0;
        this.doubleClickThreshold = 300; // 双击时间阈值(毫秒)

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
            const deltaY = event.movementY;

            // 更自然的旋转，同时支持水平和垂直旋转
            this.selectedObject.rotation.y += deltaX * this.rotateSpeed;
            this.selectedObject.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, 
                this.selectedObject.rotation.x - deltaY * this.rotateSpeed));

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
            
            // 如果有轴向约束激活，更新光标样式
            if (this.axisConstraintActive) {
                if (this.activeAxisConstraint === 'x') {
                    this.canvas.style.cursor = 'ew-resize';
                } else if (this.activeAxisConstraint === 'y') {
                    this.canvas.style.cursor = 'ns-resize';
                } else if (this.activeAxisConstraint === 'z') {
                    this.canvas.style.cursor = 'grab';
                }
            }
        } else {
            if (this.hoveredObject) {
                // Reset hover
                if (this.hoveredObject.userData && this.config.highlightOnHover) {
                    this.resetObjectHighlight(this.hoveredObject);
                }
                this.hoveredObject = null;
                this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'default';
            }
        }

        // Handle dragging - 优化拖拽体验
        if (this.isDragging && this.selectedObject && this.isDraggingInProgress) {
            // 基于相机视角计算拖拽平面，使拖拽更自然
            if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint)) {
                const targetObject = this.findRootInteractiveObject(this.selectedObject);
                if (targetObject) {
                    // 应用拖拽灵敏度
                    const targetPosition = this.intersectionPoint.clone().sub(this.dragOffset);
                    
                    // 应用轴向约束
                    if (this.axisConstraintActive && this.activeAxisConstraint) {
                        // 只保留激活轴方向的移动分量，其他方向置零
                        const constrainedPosition = new THREE.Vector3().copy(this.lastPosition);
                        
                        if (this.activeAxisConstraint === 'x') {
                            constrainedPosition.x = targetPosition.x;
                            // 添加X轴约束的视觉反馈 - 显示红色指示线
                            this.updateAxisVisualFeedback('x', targetObject);
                        } else if (this.activeAxisConstraint === 'y') {
                            constrainedPosition.y = targetPosition.y;
                            // 添加Y轴约束的视觉反馈 - 显示绿色指示线
                            this.updateAxisVisualFeedback('y', targetObject);
                        } else if (this.activeAxisConstraint === 'z') {
                            // Z轴约束需要特殊处理，考虑相机视角
                            // 计算相机坐标系中的Z轴方向
                            const cameraZDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion);
                            
                            // 计算从当前位置到目标位置的向量
                            const moveVector = new THREE.Vector3().subVectors(targetPosition, this.lastPosition);
                            
                            // 计算移动向量在相机Z方向上的投影长度
                            const zMoveAmount = moveVector.dot(cameraZDirection);
                            
                            // 应用Z轴移动
                            constrainedPosition.addScaledVector(cameraZDirection, zMoveAmount);
                            
                            // 添加Z轴约束的视觉反馈 - 显示蓝色指示线
                            this.updateAxisVisualFeedback('z', targetObject);
                        }
                        
                        // 用约束后的向量替换原始拖拽向量
                        targetPosition.copy(constrainedPosition);
                        
                        console.log(`轴向约束拖拽 - 沿${this.activeAxisConstraint.toUpperCase()}轴移动:`, targetPosition);
                    } else {
                        // 没有轴向约束时，清除视觉反馈
                        this.clearAxisVisualFeedback();
                    }
                    
                    // 应用拖拽限制
                    if (this.enableDragLimits) {
                        targetPosition.x = Math.max(this.dragLimits.x.min, Math.min(this.dragLimits.x.max, targetPosition.x));
                        targetPosition.y = Math.max(this.dragLimits.y.min, Math.min(this.dragLimits.y.max, targetPosition.y));
                        targetPosition.z = Math.max(this.dragLimits.z.min, Math.min(this.dragLimits.z.max, targetPosition.z));
                    }
                    
                    // 应用平滑过渡效果
                    if (this.dragSmoothing > 0 && this.dragSmoothing < 1) {
                        targetObject.position.lerp(targetPosition, 1 - this.dragSmoothing);
                    } else {
                        targetObject.position.copy(targetPosition);
                    }
                    
                    // 记录当前位置用于下一次平滑计算
                    this.lastPosition.copy(targetObject.position);
                    
                    this.onDragCallbacks.forEach(cb => cb(targetObject, targetPosition));
                    
                    // 如果有轴向约束，更新视觉反馈
                    if (this.axisConstraintActive && this.activeAxisConstraint) {
                        this.updateAxisVisualFeedback(this.activeAxisConstraint, targetObject);
                    }
                }
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

        // 重置之前选中对象的高亮
        if (this.selectedObject) {
            this.resetObjectHighlight(this.selectedObject);
        }

        // 支持在debug模式下点击任意对象，或非debug模式下点击可交互对象
        const targetIntersects = this.debug 
            ? intersects 
            : intersects.filter(intersect => {
                return intersect.object.userData && intersect.object.userData.interactive;
            });

        if (targetIntersects.length > 0) {
            const clickedMesh = targetIntersects[0].object;
            const rootObject = this.findRootInteractiveObject(clickedMesh);

            if (rootObject) {
                this.selectedObject = rootObject;
                
                // 确保对象被标记为可交互（在debug模式下）
                if (this.debug && !rootObject.userData.interactive) {
                    if (Array.isArray(rootObject.children)) {
                        rootObject.children.forEach(child => {
                            if (child.isMesh) {
                                child.userData.interactive = true;
                            }
                        });
                    }
                    rootObject.userData.interactive = true;
                }
                
                // 高亮选中对象
                this.highlightObject(rootObject);
                
                this.onClickCallbacks.forEach(cb => cb(rootObject, targetIntersects[0]));
                console.log('Clicked and highlighted object:', rootObject.name || rootObject.type);
            }
        }
    }

    // 双击事件处理
    onDoubleClick(event) {
        if (!this.enabled) return;

        // 检查是否处于DebugUI模式
        if (!this.debug) {
            console.log('双击功能仅在DebugUI模式下可用');
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const rootObject = this.findRootInteractiveObject(clickedMesh);

            if (rootObject) {
                console.log('双击选中对象:', rootObject.name || rootObject.type);
                
                // 保存原始材质（如果尚未保存）
                if (Array.isArray(rootObject.children)) {
                    rootObject.children.forEach(child => {
                        if (child.isMesh && !child.userData.originalMaterial) {
                            child.userData.originalMaterial = child.material;
                        }
                    });
                }
                
                // 标记为可交互对象
                if (!rootObject.userData.interactive) {
                    if (Array.isArray(rootObject.children)) {
                        rootObject.children.forEach(child => {
                            if (child.isMesh) {
                                child.userData.interactive = true;
                            }
                        });
                    }
                    rootObject.userData.interactive = true;
                    console.log('对象已设置为可交互');
                }

                // 直接进入拖拽模式，使用优化的拖拽平面计算
                this.selectedObject = rootObject;
                this.isDragging = true;
                this.isDraggingInProgress = true;
                this.canvas.style.cursor = 'grabbing';
                
                // 保存上一位置用于平滑过渡
                this.lastPosition.copy(rootObject.position);
                
                // 保存拖拽起点
                this.dragOrigin.copy(intersects[0].point);
                
                // 改进的拖拽平面计算 - 基于相机视角
                this.dragNormal.subVectors(this.camera.position, rootObject.position).normalize();
                // 如果拖拽平面太陡，使用水平面作为备选
                if (Math.abs(this.dragNormal.y) < 0.3) {
                    this.dragNormal.set(0, 1, 0);
                }
                this.dragPlane.setFromNormalAndCoplanarPoint(this.dragNormal, intersects[0].point);
                
                this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint);
                this.dragOffset.copy(this.intersectionPoint).sub(rootObject.position);
                
                // 触发拖拽开始回调
                this.onDragStartCallbacks.forEach(cb => cb(rootObject, intersects[0]));
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

        // 优先检查是否点击了已选中的高亮物体
        if (this.selectedObject && this.selectedObject.userData && this.selectedObject.userData.highlighted) {
            // 如果点击了已选中的物体，直接进入拖拽模式
            if (event.button === 0 && this.config.enableDrag) {
                this.isDragging = true;
                this.isDraggingInProgress = true;
                this.canvas.style.cursor = 'grabbing';
                
                // 保存上一位置用于平滑过渡
                this.lastPosition.copy(this.selectedObject.position);
                
                // 找到鼠标点击的点
                const targetIntersects = intersects.filter(intersect => {
                    // 检查是否与选中对象或其子对象相交
                    let current = intersect.object;
                    while (current && current !== this.scene) {
                        if (current === this.selectedObject) {
                            return true;
                        }
                        current = current.parent;
                    }
                    return false;
                });
                
                const clickPoint = targetIntersects.length > 0 ? 
                    targetIntersects[0].point : 
                    new THREE.Vector3().copy(this.selectedObject.position);
                
                // 保存拖拽起点
                this.dragOrigin.copy(clickPoint);
                
                // 改进的拖拽平面计算 - 基于相机视角
                this.dragNormal.subVectors(this.camera.position, this.selectedObject.position).normalize();
                // 如果拖拽平面太陡，使用水平面作为备选
                if (Math.abs(this.dragNormal.y) < 0.3) {
                    this.dragNormal.set(0, 1, 0);
                }
                this.dragPlane.setFromNormalAndCoplanarPoint(this.dragNormal, clickPoint);

                this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint);
                this.dragOffset.copy(this.intersectionPoint).sub(this.selectedObject.position);

                this.onDragStartCallbacks.forEach(cb => cb(this.selectedObject, {point: clickPoint}));
                console.log('开始拖动已选中的高亮物体:', this.selectedObject.name || this.selectedObject.type);
            }

            // Right Click (2) -> Rotate
            if (event.button === 2) {
                this.isRotating = true;
                this.canvas.style.cursor = 'grabbing';
            }
            
            return; // 已处理选中物体的拖拽，提前返回
        }

        // 常规点击处理 - 支持在debug模式下点击任意对象，或非debug模式下点击可交互对象
        const targetIntersects = this.debug 
            ? intersects 
            : intersects.filter(intersect => {
                return intersect.object.userData && intersect.object.userData.interactive;
            });

        if (targetIntersects.length > 0) {
            const clickedMesh = targetIntersects[0].object;
            const rootObject = this.findRootInteractiveObject(clickedMesh);

            if (rootObject) {
                this.selectedObject = rootObject;
                
                // 确保对象被标记为可交互（在debug模式下）
                if (this.debug && !rootObject.userData.interactive) {
                    if (Array.isArray(rootObject.children)) {
                        rootObject.children.forEach(child => {
                            if (child.isMesh) {
                                child.userData.interactive = true;
                            }
                        });
                    }
                    rootObject.userData.interactive = true;
                }

                // Left Click (0) -> Drag
                if (event.button === 0 && this.config.enableDrag) {
                    this.isDragging = true;
                    this.isDraggingInProgress = true;
                    this.canvas.style.cursor = 'grabbing';
                    
                    // 保存上一位置用于平滑过渡
                    this.lastPosition.copy(rootObject.position);
                    
                    // 保存拖拽起点
                    this.dragOrigin.copy(targetIntersects[0].point);
                    
                    // 改进的拖拽平面计算 - 基于相机视角
                    this.dragNormal.subVectors(this.camera.position, rootObject.position).normalize();
                    // 如果拖拽平面太陡，使用水平面作为备选
                    if (Math.abs(this.dragNormal.y) < 0.3) {
                        this.dragNormal.set(0, 1, 0);
                    }
                    this.dragPlane.setFromNormalAndCoplanarPoint(this.dragNormal, targetIntersects[0].point);

                    this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint);
                    this.dragOffset.copy(this.intersectionPoint).sub(rootObject.position);

                    this.onDragStartCallbacks.forEach(cb => cb(rootObject, targetIntersects[0]));
                    console.log('开始拖动新选中的物体:', rootObject.name || rootObject.type);
                }

                // Right Click (2) -> Rotate
                if (event.button === 2) {
                    this.isRotating = true;
                    this.canvas.style.cursor = 'grabbing';
                }
            }
        }
    }

    onMouseUp(event) {
        if (!this.enabled) return;

        // 重置拖拽状态和光标样式
        if (this.isDragging) {
            this.isDragging = false;
            this.isDraggingInProgress = false;
            this.canvas.style.cursor = 'default';
            
            if (this.selectedObject) {
                // 检查是否在debug模式或对象已明确可交互
                const canMove = this.debug || (this.selectedObject.userData && this.selectedObject.userData.interactive);
                
                if (canMove) {
                    this.onDragEndCallbacks.forEach(cb => cb(this.selectedObject));
                    console.log('拖拽结束 - 对象已移动:', this.selectedObject.name || this.selectedObject.type);
                    // 如果有轴向约束，显示约束信息
                    if (this.activeAxisConstraint) {
                        console.log('轴向约束拖拽结束 - 沿', this.activeAxisConstraint.toUpperCase(), '轴移动');
                    }
                } else {
                    console.log('无法移动对象 - 不在debug模式下且对象不可交互');
                }
            }
        }

        if (this.isRotating) {
            this.isRotating = false;
            this.canvas.style.cursor = 'default';
        }
    }

    // Helper methods
    highlightObject(object) {
        // 如果是组对象，遍历其子对象进行高亮
        if (object.children && object.children.length > 0) {
            object.userData.highlighted = true;
            
            object.children.forEach(child => {
                if (child.isMesh) {
                    // 保存原始材质（如果尚未保存）
                    if (!child.userData.originalMaterial) {
                        child.userData.originalMaterial = child.material;
                    }
                    
                    if (!child.userData.highlighted) {
                        child.userData.highlighted = true;
                        
                        if (Array.isArray(child.material)) {
                            child.userData.tempMaterials = child.material.map(mat => mat.clone());
                            child.material = child.material.map(mat => {
                                const newMat = mat.clone();
                                newMat.emissive.setHex(0x444444);
                                newMat.emissiveIntensity = 0.7; // 增强高亮效果
                                return newMat;
                            });
                        } else {
                            const newMat = child.userData.originalMaterial.clone();
                            newMat.emissive.setHex(0x444444);
                            newMat.emissiveIntensity = 0.7; // 增强高亮效果
                            child.material = newMat;
                        }
                    }
                }
            });
        } else if (object.isMesh) {
            // 单个网格对象的高亮
            // 保存原始材质（如果尚未保存）
            if (!object.userData.originalMaterial) {
                object.userData.originalMaterial = object.material;
            }

            if (!object.userData.highlighted) {
                object.userData.highlighted = true;
                if (Array.isArray(object.material)) {
                    object.userData.tempMaterials = object.material.map(mat => mat.clone());
                    object.material = object.material.map(mat => {
                        const newMat = mat.clone();
                        newMat.emissive.setHex(0x444444);
                        newMat.emissiveIntensity = 0.7; // 增强高亮效果
                        return newMat;
                    });
                } else {
                    const newMat = object.userData.originalMaterial.clone();
                    newMat.emissive.setHex(0x444444);
                    newMat.emissiveIntensity = 0.7; // 增强高亮效果
                    object.material = newMat;
                }
            }
        }
    }

    resetObjectHighlight(object) {
        // 清除轴向指示线（如果适用）
        this.clearAxisVisualFeedback();
        if (!object.userData || !object.userData.highlighted) return;

        // 如果是组对象，遍历其子对象重置高亮
        if (object.children && object.children.length > 0) {
            object.userData.highlighted = false;
            
            object.children.forEach(child => {
                if (child.isMesh && child.userData && child.userData.highlighted) {
                    child.userData.highlighted = false;

                    if (Array.isArray(child.userData.tempMaterials)) {
                        child.material = child.userData.tempMaterials;
                        delete child.userData.tempMaterials;
                    } else if (child.userData.originalMaterial) {
                        child.material = child.userData.originalMaterial;
                    }
                }
            });
        } else if (object.isMesh) {
            // 单个网格对象的高亮重置
            object.userData.highlighted = false;

            if (Array.isArray(object.userData.tempMaterials)) {
                object.material = object.userData.tempMaterials;
                delete object.userData.tempMaterials;
            } else if (object.userData.originalMaterial) {
                object.material = object.userData.originalMaterial;
            }
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

    // 清理方法，移除事件监听器并释放资源
    dispose() {
        this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.removeEventListener('click', this.onClick.bind(this));
        this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.removeEventListener('wheel', this.onWheel.bind(this));
        this.canvas.removeEventListener('dblclick', this.onDoubleClick.bind(this));
        
        // 移除键盘事件监听器
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
        window.removeEventListener('keyup', this.onKeyUp.bind(this));
        
        // 清除轴向指示线
        this.clearAxisVisualFeedback();
        
        // 清空回调数组
        this.onHoverCallbacks = [];
        this.onClickCallbacks = [];
        this.onDragStartCallbacks = [];
        this.onDragCallbacks = [];
        this.onDragEndCallbacks = [];
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

    // 键盘按下事件处理 - 轴向约束控制
    onKeyDown(event) {
        // 只有在选中物体时才处理轴向约束
        if (!this.selectedObject) return;
        
        // 防止在输入框中按下这些键时触发轴向约束
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            return;
        }
        
        // 清除之前的轴向指示器
        this.clearAxisVisualFeedback();
        
        // 处理x/y/z键，设置轴向约束
        if (event.key === 'x' || event.key === 'X') {
            this.activeAxisConstraint = 'x';
            this.axisConstraintActive = true;
            console.log('X轴约束已激活 - 拖拽将仅沿X轴方向移动');
            this.canvas.style.cursor = 'ew-resize'; // 使用水平调整光标
        } else if (event.key === 'y' || event.key === 'Y') {
            this.activeAxisConstraint = 'y';
            this.axisConstraintActive = true;
            console.log('Y轴约束已激活 - 拖拽将仅沿Y轴方向移动');
            this.canvas.style.cursor = 'ns-resize'; // 使用垂直调整光标
        } else if (event.key === 'z' || event.key === 'Z') {
            this.activeAxisConstraint = 'z';
            this.axisConstraintActive = true;
            console.log('Z轴约束已激活 - 拖拽将仅沿Z轴方向移动');
            this.canvas.style.cursor = 'grab'; // 使用抓取光标
        }
    }
    
    // 更新轴向约束的视觉反馈
    updateAxisVisualFeedback(axis, object) {
        if (!this.scene || !object) return;
        
        // 颜色映射
        const colors = {
            x: 0xff0000, // 红色
            y: 0x00ff00, // 绿色
            z: 0x0000ff  // 蓝色
        };
        
        const directionVectors = {
            x: new THREE.Vector3(1, 0, 0),
            y: new THREE.Vector3(0, 1, 0),
            z: new THREE.Vector3(0, 0, 1)
        };
        
        // 清除之前的指示线
        this.clearAxisVisualFeedback();
        
        // 创建轴向指示线
        const direction = directionVectors[axis];
        const color = colors[axis];
        
        // 创建起点和终点
        const start = new THREE.Vector3().copy(object.position);
        const end = new THREE.Vector3().copy(start).addScaledVector(direction, this.axisHelperLength);
        
        // 创建线几何体
        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // 创建材质
        const material = new THREE.LineBasicMaterial({
            color: color,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        
        // 创建线对象
        const line = new THREE.Line(geometry, material);
        line.name = `axis-${axis}-helper`;
        
        // 存储并添加到场景
        this.axisHelpers[axis] = line;
        this.scene.add(line);
        
        console.log(`轴向约束视觉反馈 - 已显示${axis.toUpperCase()}轴指示线`);
    }
    
    // 清除轴向约束的视觉反馈
    clearAxisVisualFeedback() {
        if (!this.scene) return;
        
        // 移除所有轴向指示线
        for (const axis in this.axisHelpers) {
            if (this.scene.getObjectByName(`axis-${axis}-helper`)) {
                this.scene.remove(this.axisHelpers[axis]);
                // 清理几何体和材质以避免内存泄漏
                this.axisHelpers[axis].geometry.dispose();
                this.axisHelpers[axis].material.dispose();
            }
        }
        
        // 清空存储对象
        this.axisHelpers = {};
    }
    
    // 键盘释放事件处理 - 轴向约束控制
    onKeyUp(event) {
        // 当释放x/y/z键时，取消轴向约束
        if ((event.key === 'x' || event.key === 'X') && this.activeAxisConstraint === 'x') {
            this.activeAxisConstraint = null;
            this.axisConstraintActive = false;
            console.log('X轴约束已取消');
        } else if ((event.key === 'y' || event.key === 'Y') && this.activeAxisConstraint === 'y') {
            this.activeAxisConstraint = null;
            this.axisConstraintActive = false;
            console.log('Y轴约束已取消');
        } else if ((event.key === 'z' || event.key === 'Z') && this.activeAxisConstraint === 'z') {
            this.activeAxisConstraint = null;
            this.axisConstraintActive = false;
            console.log('Z轴约束已取消');
        }
        
        // 清除轴向指示线
        this.clearAxisVisualFeedback();
        
        // 恢复默认光标
        if (!this.isDragging && !this.isRotating) {
            this.canvas.style.cursor = this.hoveredObject ? 'pointer' : 'default';
        } else if (this.isDragging) {
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    // 设置debug模式的方法
    setDebug(debugMode) {
        this.debug = debugMode;
        console.log(`交互管理器debug模式已${debugMode ? '启用' : '禁用'}`);
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
        
        // 拖拽控制选项 - 新增
        const dragFolder = folder.addFolder('拖拽控制(Drag Control)');
        dragFolder.add(this, 'dragSensitivity', 0.1, 3.0, 0.1).name('拖拽灵敏度(Sensitivity)')
            .onChange(value => console.log('拖拽灵敏度已调整为:', value));
        
        dragFolder.add(this, 'dragSmoothing', 0, 0.5, 0.01).name('拖拽平滑度(Smoothing)')
            .onChange(value => console.log('拖拽平滑度已调整为:', value));
        
        // 拖拽范围限制控制
        const limitsController = dragFolder.add(this, 'enableDragLimits').name('启用拖拽范围限制(Enable Limits)');
        
        const limitsFolder = dragFolder.addFolder('拖拽范围限制(Drag Limits)');
        limitsFolder.add(this.dragLimits.x, 'min', -50, 0, 0.5).name('X轴最小(Min X)');
        limitsFolder.add(this.dragLimits.x, 'max', 0, 50, 0.5).name('X轴最大(Max X)');
        limitsFolder.add(this.dragLimits.y, 'min', -50, 0, 0.5).name('Y轴最小(Min Y)');
        limitsFolder.add(this.dragLimits.y, 'max', 0, 50, 0.5).name('Y轴最大(Max Y)');
        limitsFolder.add(this.dragLimits.z, 'min', -50, 0, 0.5).name('Z轴最小(Min Z)');
        limitsFolder.add(this.dragLimits.z, 'max', 0, 50, 0.5).name('Z轴最大(Max Z)');
        
        // 根据启用状态控制限制文件夹的显示
        limitsController.onChange(enabled => {
            if (enabled) {
                limitsFolder.open();
                console.log('拖拽范围限制已启用');
            } else {
                limitsFolder.close();
                console.log('拖拽范围限制已禁用');
            }
        });
        
        // 初始状态下，如果未启用限制则关闭文件夹
        if (!this.enableDragLimits) {
            limitsFolder.close();
        }

        // Debug info
        const debugInfo = {
            hoveredObject: 'None',
            selectedObject: 'None',
            state: 'Idle',
            dragSensitivity: () => this.dragSensitivity,
            dragSmoothing: () => this.dragSmoothing,
            limitsEnabled: () => this.enableDragLimits ? 'Yes' : 'No',
            activeAxisConstraint: () => this.activeAxisConstraint ? this.activeAxisConstraint.toUpperCase() : 'None'
        };

        folder.add(debugInfo, 'hoveredObject').name('悬停对象(Hovered)').listen();
        folder.add(debugInfo, 'selectedObject').name('选中对象(Selected)').listen();
        folder.add(debugInfo, 'state').name('当前状态(State)').listen();
        folder.add(debugInfo, 'dragSensitivity').name('当前灵敏度(Sensitivity)').listen();
        folder.add(debugInfo, 'dragSmoothing').name('当前平滑度(Smoothing)').listen();
        folder.add(debugInfo, 'limitsEnabled').name('范围限制(Limits)').listen();

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
