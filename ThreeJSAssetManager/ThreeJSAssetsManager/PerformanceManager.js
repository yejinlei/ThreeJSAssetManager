import * as THREE from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

export default class PerformanceManager {
    constructor() {
        this.threeJSAssetsManager = new ThreeJSAssetsManager();
        this.scene = this.threeJSAssetsManager.scene;
        this.camera = this.threeJSAssetsManager.camera;
        this.debug = this.threeJSAssetsManager.debug;
        this.gui = this.threeJSAssetsManager.gui;

        this.config = config.Performance || {};
        this.instancedMeshes = [];
        this.lodObjects = [];

        if (this.debug) {
            this.setupDebugGUI();
        }
    }

    // Create InstancedMesh for repeated objects
    createInstancedMesh(geometry, material, count, positions = []) {
        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);

        for (let i = 0; i < count; i++) {
            if (positions[i]) {
                position.set(positions[i].x, positions[i].y, positions[i].z);
            } else {
                position.set(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                );
            }

            rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            quaternion.setFromEuler(rotation);

            matrix.compose(position, quaternion, scale);
            instancedMesh.setMatrixAt(i, matrix);
        }

        instancedMesh.instanceMatrix.needsUpdate = true;
        this.scene.add(instancedMesh);
        this.instancedMeshes.push(instancedMesh);

        return instancedMesh;
    }

    // Create LOD (Level of Detail) object
    createLOD(meshes, distances) {
        const lod = new THREE.LOD();

        meshes.forEach((mesh, index) => {
            const distance = distances[index] || index * 10;
            lod.addLevel(mesh, distance);
        });

        this.scene.add(lod);
        this.lodObjects.push(lod);

        return lod;
    }

    // Helper to create simple LOD with box geometry
    createSimpleLOD(position = { x: 0, y: 0, z: 0 }) {
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

        // High detail
        const highDetail = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1, 10, 10, 10),
            material
        );

        // Medium detail
        const mediumDetail = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1, 5, 5, 5),
            material
        );

        // Low detail
        const lowDetail = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1, 1, 1, 1),
            material
        );

        const lod = this.createLOD(
            [highDetail, mediumDetail, lowDetail],
            [0, 10, 20]
        );

        lod.position.set(position.x, position.y, position.z);

        return lod;
    }

    update() {
        // Update LOD based on camera distance
        this.lodObjects.forEach(lod => {
            lod.update(this.camera);
        });
    }

    setupDebugGUI() {
        if (!this.gui) return;

        const folder = this.gui.addFolder('Performance(性能优化)');

        const stats = {
            instancedMeshCount: 0,
            lodCount: 0,
            totalInstances: 0
        };

        folder.add(stats, 'instancedMeshCount').name('实例网格数(Instanced Meshes)').listen();
        folder.add(stats, 'lodCount').name('LOD对象数(LOD Objects)').listen();
        folder.add(stats, 'totalInstances').name('总实例数(Total Instances)').listen();

        // Update stats
        setInterval(() => {
            stats.instancedMeshCount = this.instancedMeshes.length;
            stats.lodCount = this.lodObjects.length;
            stats.totalInstances = this.instancedMeshes.reduce((sum, mesh) => sum + mesh.count, 0);
        }, 1000);

        // Add test buttons
        const actions = {
            createInstancedCubes: () => {
                const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
                this.createInstancedMesh(geometry, material, 100);
            },
            createLODObject: () => {
                this.createSimpleLOD({
                    x: (Math.random() - 0.5) * 10,
                    y: 0,
                    z: (Math.random() - 0.5) * 10
                });
            }
        };

        folder.add(actions, 'createInstancedCubes').name('创建实例立方体(Create Instanced Cubes)');
        folder.add(actions, 'createLODObject').name('创建LOD对象(Create LOD Object)');
    }
}
