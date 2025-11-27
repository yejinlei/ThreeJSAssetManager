import * as THREE from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

export default class ParticleManager {
    constructor() {
        // 直接使用全局实例，避免重复创建
        this.threeJSAssetsManager = window.ThreeJSAssetsManagerInstance;
        this.scene = this.threeJSAssetsManager?.scene;
        this.debug = this.threeJSAssetsManager?.debug;
        this.gui = this.threeJSAssetsManager?.gui;

        this.config = config.Particles || {};
        this.particleSystems = [];

        if (this.config.systems && this.config.systems.length > 0) {
            this.init();
        }

        if (this.debug) {
            this.setupDebugGUI();
        }
    }

    init() {
        this.config.systems.forEach((systemConfig, index) => {
            if (systemConfig.enabled !== false) {
                this.createParticleSystem(systemConfig, index);
            }
        });
    }

    createParticleSystem(systemConfig, index) {
        const count = systemConfig.count || 1000;
        const geometry = new THREE.BufferGeometry();

        // Create positions
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const spread = systemConfig.spread || 10;
        const color = new THREE.Color(systemConfig.color || 0xffffff);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Position
            positions[i3] = (Math.random() - 0.5) * spread;
            positions[i3 + 1] = (Math.random() - 0.5) * spread;
            positions[i3 + 2] = (Math.random() - 0.5) * spread;

            // Color
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            // Size
            sizes[i] = systemConfig.size || 0.1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Material
        const material = new THREE.PointsMaterial({
            size: systemConfig.size || 0.1,
            sizeAttenuation: systemConfig.sizeAttenuation !== false,
            vertexColors: systemConfig.vertexColors !== false,
            transparent: systemConfig.transparent !== false,
            opacity: systemConfig.opacity || 0.8,
            blending: systemConfig.blending || THREE.AdditiveBlending,
            depthWrite: false
        });

        if (systemConfig.texture) {
            const textureLoader = new THREE.TextureLoader();
            material.map = textureLoader.load(systemConfig.texture);
        }

        const particles = new THREE.Points(geometry, material);
        particles.name = systemConfig.name || `ParticleSystem_${index}`;

        if (systemConfig.position) {
            particles.position.set(
                systemConfig.position.x || 0,
                systemConfig.position.y || 0,
                systemConfig.position.z || 0
            );
        }

        this.scene.add(particles);

        this.particleSystems.push({
            mesh: particles,
            config: systemConfig,
            velocities: this.generateVelocities(count, systemConfig),
            time: 0
        });
    }

    generateVelocities(count, config) {
        const velocities = new Float32Array(count * 3);
        const speed = config.speed || 0.01;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            velocities[i3] = (Math.random() - 0.5) * speed;
            velocities[i3 + 1] = (Math.random() - 0.5) * speed;
            velocities[i3 + 2] = (Math.random() - 0.5) * speed;
        }

        return velocities;
    }

    update(deltaTime = 0.016) {
        this.particleSystems.forEach(system => {
            if (!system.config.animate) return;

            const positions = system.mesh.geometry.attributes.position.array;
            const velocities = system.velocities;
            const spread = system.config.spread || 10;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];

                // Boundary check and wrap
                if (Math.abs(positions[i]) > spread / 2) {
                    positions[i] = (Math.random() - 0.5) * spread;
                }
                if (Math.abs(positions[i + 1]) > spread / 2) {
                    positions[i + 1] = (Math.random() - 0.5) * spread;
                }
                if (Math.abs(positions[i + 2]) > spread / 2) {
                    positions[i + 2] = (Math.random() - 0.5) * spread;
                }
            }

            system.mesh.geometry.attributes.position.needsUpdate = true;

            // Rotation
            if (system.config.rotate) {
                system.mesh.rotation.y += 0.001;
            }
        });
    }

    setupDebugGUI() {
        if (!this.gui) return;

        // 确保effectsFolder存在
        if (!this.gui.effectsFolder) {
            console.warn('effectsFolder不存在，请检查DebugUI初始化顺序');
            return;
        }
        
        // 使用effectsFolder创建粒子系统子目录并保存引用
        const folder = this.gui.effectsFolder.addFolder('🎆 Particles (粒子系统)');
        // 保存particleFolder引用到gui对象，便于其他地方使用
        this.gui.particleFolder = folder;

        this.particleSystems.forEach((system, index) => {
            const systemFolder = folder.addFolder(system.mesh.name);

            systemFolder.add(system.mesh, 'visible').name('显示(Visible)');
            systemFolder.add(system.config, 'animate').name('动画(Animate)');
            systemFolder.add(system.config, 'rotate').name('旋转(Rotate)');
            systemFolder.add(system.mesh.material, 'opacity', 0, 1, 0.01).name('不透明度(Opacity)');
            systemFolder.add(system.mesh.material, 'size', 0.01, 1, 0.01).name('大小(Size)');
        });
    }
}
