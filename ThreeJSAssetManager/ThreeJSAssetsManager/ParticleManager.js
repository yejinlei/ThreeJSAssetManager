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
        // 从 config.js 读取所有值，不使用硬编码默认值
        const count = systemConfig.count;
        const geometry = new THREE.BufferGeometry();

        // Create positions
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const spread = systemConfig.spread;
        const color = new THREE.Color(systemConfig.color);

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
            sizes[i] = systemConfig.size;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Material
        const material = new THREE.PointsMaterial({
            size: systemConfig.size,
            sizeAttenuation: systemConfig.sizeAttenuation !== false,
            vertexColors: systemConfig.vertexColors !== false,
            transparent: systemConfig.transparent !== false,
            opacity: systemConfig.opacity,
            blending: systemConfig.blending || THREE.AdditiveBlending,
            depthWrite: false
        });

        if (systemConfig.texture) {
            const textureLoader = new THREE.TextureLoader();
            material.map = textureLoader.load(systemConfig.texture);
        }

        const particles = new THREE.Points(geometry, material);
        particles.name = systemConfig.name || `ParticleSystem_${index}`;

        // 从 config.js 读取位置，不使用默认值
        if (systemConfig.position) {
            particles.position.set(
                systemConfig.position.x,
                systemConfig.position.y,
                systemConfig.position.z
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
        const speed = config.speed;

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
            const spread = system.config.spread;

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

            // 基础控制
            systemFolder.add(system.mesh, 'visible').name('显示(Visible)');
            systemFolder.add(system.config, 'animate').name('动画(Animate)');
            systemFolder.add(system.config, 'rotate').name('旋转(Rotate)');

            // 外观控制
            const appearanceFolder = systemFolder.addFolder('外观(Appearance)');
            appearanceFolder.add(system.mesh.material, 'opacity', 0, 1, 0.01).name('不透明度(Opacity)');
            appearanceFolder.add(system.mesh.material, 'size', 0.01, 1, 0.01).name('大小(Size)');

            // 颜色控制 - 转换为十六进制格式
            const colorControl = {
                color: '#' + system.config.color.toString(16).padStart(6, '0')
            };
            appearanceFolder.addColor(colorControl, 'color').name('颜色(Color)').onChange((value) => {
                const newColor = new THREE.Color(value);
                const colors = system.mesh.geometry.attributes.color.array;
                for (let i = 0; i < colors.length; i += 3) {
                    colors[i] = newColor.r;
                    colors[i + 1] = newColor.g;
                    colors[i + 2] = newColor.b;
                }
                system.mesh.geometry.attributes.color.needsUpdate = true;
                system.config.color = parseInt(value.replace('#', ''), 16);
            });

            // 动画控制
            const animationFolder = systemFolder.addFolder('动画(Animation)');
            animationFolder.add(system.config, 'speed', 0, 0.1, 0.001).name('速度(Speed)').onChange((value) => {
                // 重新生成速度
                const velocities = system.velocities;
                const count = velocities.length / 3;
                for (let i = 0; i < count; i++) {
                    const i3 = i * 3;
                    velocities[i3] = (Math.random() - 0.5) * value;
                    velocities[i3 + 1] = (Math.random() - 0.5) * value;
                    velocities[i3 + 2] = (Math.random() - 0.5) * value;
                }
            });
            animationFolder.add(system.config, 'spread', 1, 100, 1).name('扩散范围(Spread)');

            // 位置控制
            const positionFolder = systemFolder.addFolder('位置(Position)');
            positionFolder.add(system.mesh.position, 'x', -50, 50, 0.1).name('X');
            positionFolder.add(system.mesh.position, 'y', -50, 50, 0.1).name('Y');
            positionFolder.add(system.mesh.position, 'z', -50, 50, 0.1).name('Z');

            // 注意：count 参数需要重新创建粒子系统，这里添加一个信息提示
            const info = {
                particleCount: system.config.count,
                recreate: () => {
                    if (confirm(`确定要重新创建粒子系统吗？当前粒子数: ${system.config.count}`)) {
                        // 移除旧的粒子系统
                        this.scene.remove(system.mesh);
                        system.mesh.geometry.dispose();
                        system.mesh.material.dispose();

                        // 重新创建
                        this.createParticleSystem(system.config, index);
                        console.log('粒子系统已重新创建');
                    }
                }
            };
            systemFolder.add(info, 'particleCount').name('粒子数量(Count)').listen();
            systemFolder.add(info, 'recreate').name('🔄 重新创建(Recreate)');
        });
    }
}
