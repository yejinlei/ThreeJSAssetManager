import * as THREE from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

// Import cannon-es as ES module
// Note: This requires cannon-es to be available via importmap
// Import map: "cannon-es": "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js"

export default class PhysicsManager {
    constructor() {
        // 直接使用全局实例，避免重复创建
        this.threeJSAssetsManager = window.ThreeJSAssetsManagerInstance;
        this.scene = this.threeJSAssetsManager?.scene;
        this.debug = this.threeJSAssetsManager?.debug;
        this.gui = this.threeJSAssetsManager?.gui;

        this.config = config.Physics || {};
        this.enabled = this.config.enabled !== false;

        this.world = null;
        this.bodies = [];
        this.meshes = [];

        if (this.enabled) {
            this.init();
        }

        if (this.debug) {
            this.setupDebugGUI();
        }
    }

    async init() {
        // Check if CANNON is available via importmap
        try {
            // Dynamically import cannon-es
            const CANNON = await import('cannon-es');
            
            // Create physics world
        this.world = new CANNON.World();
        this.world.gravity.set(
            this.config.gravity?.x || 0,
            this.config.gravity?.y || -9.82,
            this.config.gravity?.z || 0
        );

        // Set solver iterations for better stability
        this.world.solver.iterations = this.config.solverIterations || 10;

        // Broadphase for collision detection optimization
        this.world.broadphase = new CANNON.NaiveBroadphase();

        // Create ground plane
        if (this.config.createGround !== false) {
            this.createGroundPlane();
        }

        console.log('PhysicsManager initialized');
        
        // Store CANNON reference for later use
        this.CANNON = CANNON;
        } catch (error) {
            console.warn('PhysicsManager: cannon-es not loaded. Physics disabled.', error);
            console.warn('Make sure cannon-es is available via importmap');
            this.enabled = false;
            return;
        }
    }

    createGroundPlane() {
        if (!this.world || !this.CANNON) return;

        // Physics body
        const groundBody = new this.CANNON.Body({
            mass: 0, // Static body
            shape: new this.CANNON.Plane()
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);

        // Visual mesh
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            side: THREE.DoubleSide
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);
    }

    // Create physics body for existing mesh
    addPhysicsToMesh(mesh, options = {}) {
        if (!this.world || !this.enabled || !this.CANNON) return null;

        const shape = this.createShapeFromGeometry(mesh.geometry, options.shape);
        const body = new this.CANNON.Body({
            mass: options.mass || 1,
            shape: shape,
            position: new this.CANNON.Vec3(
                mesh.position.x,
                mesh.position.y,
                mesh.position.z
            )
        });

        this.world.addBody(body);
        this.bodies.push(body);
        this.meshes.push(mesh);

        return body;
    }

    createShapeFromGeometry(geometry, shapeType = 'box') {
        if (!this.CANNON) return null;
        
        if (!geometry.boundingBox) {
            geometry.computeBoundingBox();
        }

        const bbox = geometry.boundingBox;
        const size = new THREE.Vector3();
        bbox.getSize(size);

        switch (shapeType) {
            case 'sphere':
                const radius = Math.max(size.x, size.y, size.z) / 2;
                return new this.CANNON.Sphere(radius);
            case 'box':
            default:
                return new this.CANNON.Box(new this.CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        }
    }

    // Create a physics-enabled box
    createPhysicsBox(position = { x: 0, y: 5, z: 0 }, size = 1) {
        if (!this.world || !this.enabled || !this.CANNON) return null;

        // Visual mesh
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // Physics body
        const shape = new this.CANNON.Box(new this.CANNON.Vec3(size / 2, size / 2, size / 2));
        const body = new this.CANNON.Body({
            mass: 1,
            shape: shape,
            position: new this.CANNON.Vec3(position.x, position.y, position.z)
        });
        this.world.addBody(body);

        this.bodies.push(body);
        this.meshes.push(mesh);

        return { mesh, body };
    }

    update(deltaTime = 0.016) {
        if (!this.world || !this.enabled) return;

        // Step physics simulation
        this.world.step(1 / 60, deltaTime, 3);

        // Sync visual meshes with physics bodies
        for (let i = 0; i < this.bodies.length; i++) {
            if (this.meshes[i]) {
                this.meshes[i].position.copy(this.bodies[i].position);
                this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
            }
        }
    }

    setupDebugGUI() {
        if (!this.gui) return;

        // 安全地创建物理系统文件夹，避免interactionFolder不存在时出错
        const folder = this.gui.physicsFolder || this.gui.addFolder('⚡ Physics (物理系统)');
        // 保存folder引用以便后续使用
        this.gui.physicsFolder = folder;

        folder.add(this, 'enabled').name('启用(Enabled)');

        if (this.world) {
            const gravityFolder = folder.addFolder('Gravity(重力)');
            gravityFolder.add(this.world.gravity, 'x', -20, 20, 0.1).name('X');
            gravityFolder.add(this.world.gravity, 'y', -20, 20, 0.1).name('Y');
            gravityFolder.add(this.world.gravity, 'z', -20, 20, 0.1).name('Z');

            const actions = {
                createBox: () => {
                    this.createPhysicsBox({
                        x: (Math.random() - 0.5) * 5,
                        y: 5 + Math.random() * 5,
                        z: (Math.random() - 0.5) * 5
                    }, 0.5 + Math.random() * 0.5);
                }
            };

            folder.add(actions, 'createBox').name('创建物理盒子(Create Physics Box)');
        }

        const stats = {
            bodyCount: 0
        };

        folder.add(stats, 'bodyCount').name('物理体数量(Body Count)').listen();

        setInterval(() => {
            stats.bodyCount = this.bodies.length;
        }, 1000);
    }
}
