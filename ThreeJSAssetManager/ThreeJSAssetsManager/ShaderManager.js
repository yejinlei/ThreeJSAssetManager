import * as THREE from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import config from './config.js';

export default class ShaderManager {
    constructor() {
        // 直接使用全局实例，避免重复创建
        this.threeJSAssetsManager = window.ThreeJSAssetsManagerInstance;
        this.scene = this.threeJSAssetsManager?.scene;
        this.debug = this.threeJSAssetsManager?.debug;
        this.gui = this.threeJSAssetsManager?.gui;

        this.config = config.Shaders || {};
        this.shaderMaterials = new Map();
        this.shaderMeshes = [];

        if (this.debug) {
            this.setupDebugGUI();
        }
    }

    // Create a custom shader material
    createShaderMaterial(name, vertexShader, fragmentShader, uniforms = {}) {
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                ...uniforms
            }
        });

        this.shaderMaterials.set(name, material);
        return material;
    }

    // Create a simple animated shader material
    createAnimatedShader(name) {
        const vertexShader = `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vec3 color = uColor;
                color.r += sin(vPosition.x * 10.0 + uTime) * 0.5;
                color.g += sin(vPosition.y * 10.0 + uTime) * 0.5;
                color.b += sin(vPosition.z * 10.0 + uTime) * 0.5;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        return this.createShaderMaterial(name, vertexShader, fragmentShader, {
            uColor: { value: new THREE.Color(0x00ff00) }
        });
    }

    // Create wave shader
    createWaveShader(name) {
        const vertexShader = `
            uniform float uTime;
            uniform float uAmplitude;
            uniform float uFrequency;
            
            varying vec2 vUv;
            varying float vElevation;
            
            void main() {
                vUv = uv;
                
                vec3 newPosition = position;
                float elevation = sin(position.x * uFrequency + uTime) * uAmplitude;
                elevation += sin(position.z * uFrequency + uTime) * uAmplitude;
                newPosition.y += elevation;
                
                vElevation = elevation;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            
            varying vec2 vUv;
            varying float vElevation;
            
            void main() {
                vec3 color = mix(uColorA, uColorB, vElevation * 2.0 + 0.5);
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        return this.createShaderMaterial(name, vertexShader, fragmentShader, {
            uAmplitude: { value: 0.2 },
            uFrequency: { value: 5.0 },
            uColorA: { value: new THREE.Color(0x0000ff) },
            uColorB: { value: new THREE.Color(0x00ffff) }
        });
    }

    // Apply shader to mesh
    applyShaderToMesh(mesh, shaderName) {
        const material = this.shaderMaterials.get(shaderName);
        if (material) {
            mesh.material = material;
            this.shaderMeshes.push({ mesh, materialName: shaderName });
        }
    }

    // Update all shader uniforms
    update(deltaTime = 0.016) {
        this.shaderMaterials.forEach(material => {
            if (material.uniforms.uTime) {
                material.uniforms.uTime.value += deltaTime;
            }
        });
    }

    // Hot reload shader
    reloadShader(name, vertexShader, fragmentShader) {
        const material = this.shaderMaterials.get(name);
        if (material) {
            material.vertexShader = vertexShader;
            material.fragmentShader = fragmentShader;
            material.needsUpdate = true;
            console.log(`Shader "${name}" reloaded`);
        }
    }

    setupDebugGUI() {
        if (!this.gui) return;

        // 确保shaderFolder存在，如果不存在则创建
        const folder = this.gui.shaderFolder || this.gui.addFolder('Shaders');
        // 保存对folder的引用，避免重复创建
        if (!this.gui.shaderFolder) {
            this.gui.shaderFolder = folder;
        }

        const actions = {
            createAnimatedShader: () => {
                const material = this.createAnimatedShader('animated_' + Date.now());
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5
                );
                this.scene.add(mesh);
                this.shaderMeshes.push({ mesh, materialName: 'animated' });
            },
            createWaveShader: () => {
                const material = this.createWaveShader('wave_' + Date.now());
                const geometry = new THREE.PlaneGeometry(5, 5, 50, 50);
                const mesh = new THREE.Mesh(geometry, material);
                mesh.rotation.x = -Math.PI / 2;
                this.scene.add(mesh);
                this.shaderMeshes.push({ mesh, materialName: 'wave' });
            }
        };

        folder.add(actions, 'createAnimatedShader').name('创建动画着色器(Create Animated Shader)');
        folder.add(actions, 'createWaveShader').name('创建波浪着色器(Create Wave Shader)');

        // Show shader count
        const stats = {
            shaderCount: 0,
            meshCount: 0
        };

        folder.add(stats, 'shaderCount').name('着色器数量(Shader Count)').listen();
        folder.add(stats, 'meshCount').name('网格数量(Mesh Count)').listen();

        setInterval(() => {
            stats.shaderCount = this.shaderMaterials.size;
            stats.meshCount = this.shaderMeshes.length;
        }, 1000);
    }
}
