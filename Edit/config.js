// Three.js 应用配置文件 - Editor 编辑器配置
// 参考: Three.js官方构造函数默认值及核心组件规范

export default {
    // 【核心配置】画布ID，必须与HTML中的canvas元素ID一致
    canvas: 'canvas01',

    SceneManager: {
        // 【建议开启】场景管理是基础，通常需要开启
        enabled: false, // 编辑器模式下，为了保持干净背景，这里禁用了默认场景设置
        Color: {
            enabled: false,
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
        // 【核心配置-必须开启】没有相机无法渲染场景，请勿关闭！
        enabled: true,
        cameraType: 'perspective',
        cameraOptions: {
            fov: 75,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.1,
            far: 2000
        },
        // 编辑器默认相机位置
        position: { x: 6, y: 4, z: 8 }
    },

    LightManager: {
        // 【建议开启】除非是纯2D或自发光场景，否则通常需要灯光
        enabled: true, // 编辑器需要灯光来查看模型
        ambientLight: {
            enabled: true,
            color: 0xffffff,
            intensity: 0.5
        },
        directionalLight: {
            enabled: false,
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
            enabled: false,
            color: 0xffffff,
            groundColor: 0xffffff,
            intensity: 1,
            position: { x: 0, y: 5, z: 0 }
        },
        spotLight: {
            enabled: false,
            color: 0x709af3,
            intensity: 2,
            distance: 50,
            angle: 30,
            penumbra: 0.5,
            decay: 1,
            position: { x: 10, y: 15, z: 10 },
            target: [0, 0, 0],
            shadowmap: {
                enabled: false,
                near: 10,
                far: 20,
                mapwidth: 1024,
                mapheight: 1024,
                cameraangle: 35
            }
        },
        pointLight: {
            enabled: false,
            color: 0xffccaa,
            intensity: 0.8,
            position: { x: -5, y: 3, z: -5 },
            distance: 20,
            decay: 1.5,
            castShadow: false,
            shadowMap: {
                enabled: false,
                near: 10,
                far: 20,
                mapwidth: 1024,
                mapheight: 1024,
                cameraangle: 35
            }
        },
        directionalShadow: {
            enabled: false
        }
    },

    RenderManager: {
        // 【核心配置-必须开启】渲染器是核心组件，关闭将导致黑屏，请勿关闭！
        enabled: true,
        clearColor: '#211d20',
        shadow: {
            enabled: false,
            type: 'PCFSoftShadowMap',
            resolution: 2048
        }
    },

    PostProcessing: {
        // 可选：后期处理，编辑器模式默认关闭以提高性能
        enabled: false,
        bloom: {
            enabled: false,
            strength: 1.5,
            radius: 0.4,
            threshold: 0.85
        }
    },

    Interaction: {
        // 可选：交互系统，编辑器需要交互功能
        enabled: true,
        enableDrag: true,
        highlightOnHover: true
    },

    Particles: {
        // 可选：粒子系统，编辑器模式默认关闭
        systems: [
            {
                enabled: false,
                name: 'Snow',
                count: 1000,
                size: 0.1,
                spread: 20,
                color: 0xffffff,
                animate: false,
                speed: 0.01,
                rotate: false
            }
        ]
    },

    Performance: {
        // 可选：性能监控，编辑器模式开启以便查看性能
        enabled: true
    },

    Shaders: {
        // 可选：自定义着色器，编辑器模式默认关闭
        enabled: false
    },

    Physics: {
        // 可选：物理引擎，编辑器模式默认关闭
        enabled: false,
        gravity: { x: 0, y: -9.82, z: 0 },
        solverIterations: 10,
        createGround: false
    },

    Audio: {
        // 可选：音频系统，编辑器模式默认关闭
        enabled: false
    },

    WebXR: {
        // 可选：VR/AR支持，编辑器模式默认关闭
        enabled: false,
        createVRButton: false,
        createARButton: false
    },

    Helpers: {
        // 可选：调试辅助工具，编辑器模式开启网格和坐标轴
        grid: {
            enabled: true,
            size: 10,
            divisions: 10,
            colorCenterLine: 0x444444,
            colorGrid: 0x888888
        },
        axes: {
            enabled: true,
            size: 5
        },
        camera: {
            enabled: false
        }
    },

    DebugUI: {
        // 可选：调试面板，编辑器模式必须开启
        enabled: true,
        Utilities: {
            enabled: true,
            exportConfig: true
        },
        DragDropGLB: {
            enabled: true
        },
        Effects: {
            enabled: true
        }
    }
}