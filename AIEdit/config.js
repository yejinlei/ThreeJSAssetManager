// Three.js 应用配置文件 - 完整配置
// 所有参数都在此定义，Manager 不使用硬编码默认值
// DebugUI 可视化调整后导出此配置

export default {
    canvas: 'canvas01',

    SceneManager: {
        enabled: true,
        Color: {
            enabled: true,
            value: 0xababab
        },
        fog: {
            enabled: false,
            color: 0xcccccc,
            near: 10,
            far: 50
        },
        environment: {
            enabled: false,
            path: ''
        },
        scenes: {
            enabled: false,
            default: 'main',
            list: ['main', 'secondary']
        }
    },

    CameraManager: {
        enabled: true,
        cameraType: 'perspective',
        cameraOptions: {
            fov: 75,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.1,
            far: 2000
        }
    },

    LightManager: {
        enabled: true,
        ambientLight: {
            enabled: true,
            color: 0xffffff,
            intensity: 0.5
        },
        directionalLight: {
            enabled: true,
            color: 0xffffff,
            intensity: 1.5,
            position: { x: 5, y: 10, z: 5 }
        },
        rectAreaLight: {
            enabled: false,
            color: 0x00ff7b,
            intensity: 1.0,
            width: 5.1,
            height: 12.4,
            position: { x: -7, y: 1.3, z: 0.8 },
            lookAt: { x: 0.8, y: -9.6, z: 0.8 }
        },
        hemiLight: {
            enabled: true,
            color: 0xffffff,
            groundColor: 0xffffff,
            intensity: 1,
            position: { x: 0, y: 5, z: 0 }
        },
        spotLight: {
            enabled: true,
            color: 0x709af3,
            intensity: 2,
            distance: 50,
            angle: 30,
            penumbra: 0.5,
            decay: 1,
            position: { x: 10, y: 15, z: 10 },
            target: [0, 0, 0],
            shadowmap: {
                enabled: true,
                near: 10,
                far: 20,
                mapwidth: 1024,
                mapheight: 1024,
                cameraangle: 35
            }
        },
        pointLight: {
            enabled: true,
            color: 0xffccaa,
            intensity: 0.8,
            position: { x: -5, y: 3, z: -5 },
            distance: 20,
            decay: 1.5,
            castShadow: true,
            shadowMap: {
                enabled: true,
                near: 10,
                far: 20,
                mapwidth: 1024,
                mapheight: 1024,
                cameraangle: 35
            }
        },
        directionalShadow: {
            enabled: true
        }
    },

    RenderManager: {
        enabled: true,
        toneMapping: 'CineonToneMapping', // 可选: NoToneMapping, LinearToneMapping, ReinhardToneMapping, CineonToneMapping, ACESFilmicToneMapping
        toneMappingExposure: 1.75,
        clearColor: '#211d20',
        shadow: {
            enabled: false,
            type: 'PCFSoftShadowMap' // 可选: BasicShadowMap, PCFShadowMap, PCFSoftShadowMap, VSMShadowMap
        }
    },

    PostProcessing: {
        enabled: false,
        bloom: {
            enabled: false,
            strength: 0.59,
            radius: 0,
            threshold: 0.78
        }
    },

    Interaction: {
        enabled: true,
        enableDrag: true,
        highlightOnHover: true
    },

    Particles: {
        systems: [
            {
                enabled: false,
                name: 'Snow',
                count: 1000,
                size: 0.1,
                spread: 20,
                color: 0xffffff,
                endColor: 0xffffff,
                opacity: 0.8,
                animate: true,
                speed: 0.01,
                rotate: false,
                rotateX: false,
                rotateY: true,
                rotateZ: false,
                rotationSpeed: 0.01,
                pulseScale: false,
                emitMode: 'volume',
                direction: { x: 0, y: -1, z: 0 },
                position: { x: 0, y: 0, z: 0 },
                lifetime: 10,
                fadeIn: 0,
                fadeOut: 0,
                fadeAlpha: false,
                colorOverLifetime: false,
                sizeOverLifetime: false,
                startSize: 0.1,
                endSize: 0.05
            }
        ]
    },

    Performance: {
        enabled: true
    },

    Shaders: {
        enabled: true
    },

    Physics: {
        enabled: false,
        gravity: { x: 0, y: -9.82, z: 0 },
        solverIterations: 10,
        createGround: true
    },

    Audio: {
        enabled: false,
        volume: 0.5,
        loop: false,
        refDistance: 1
    },

    WebXR: {
        enabled: false,
        createVRButton: true,
        createARButton: true
    },

    Helpers: {
        grid: {
            enabled: false,
            size: 10,
            divisions: 10,
            colorCenterLine: 0x444444,
            colorGrid: 0x888888
        },
        axes: {
            enabled: false,
            size: 5
        },
        camera: {
            enabled: false
        }
    },

    DebugUI: {
        enabled: true,
        Utilities: {
            enabled: true,
            exportConfig: true
        },
        DragDropGLB: {
            enabled: false
        },
        Effects: {
            enabled: true
        },
        AI: {
            enabled: true,
            Pic2GLB: {
                enabled: true,
                apiToken: '',
                models: {
                    'Hunyuan3D-2': 'Hunyuan3D-2',
                    'Hi3DGen': 'Hi3DGen'
                }
            }
        }
    }
}