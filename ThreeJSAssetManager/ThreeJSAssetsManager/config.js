// Three.js 应用配置文件 - 恢复为官方默认参数
// 参考: Three.js官方构造函数默认值及核心组件规范

export default {
    'canvas': 'canvas01',
    'SceneManager': {
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
    'CameraManager': {
        enabled: true,
        cameraType: 'perspective',
        cameraOptions: {
            fov: 75,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.1,
            far: 2000
        }
    },
    'LightManager': {
        enabled: true,
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
                enabled: true,
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
            enabled: false
        }
    },
    'RenderManager': {
        enabled: true,
        clearColor: '#211d20',
        shadow: {
            enabled: false,
            type: 'PCFSoftShadowMap',
            resolution: 2048
        }
    },
    'PostProcessing': {
        enabled: false,
        bloom: {
            enabled: false,
            strength: 1.5,
            radius: 0.4,
            threshold: 0.85
        }
    },
    'Interaction': {
        enabled: true,
        enableDrag: true,
        highlightOnHover: true
    },
    'Particles': {
        systems: [
            {
                enabled: true,
                name: 'Snow',
                count: 1000,
                size: 0.1,
                spread: 20,
                color: 0xffffff,
                animate: true,
                speed: 0.01,
                rotate: false
            }
        ]
    },
    'Performance': {
        enabled: true
    },
    'Shaders': {
        enabled: true
    },
    'Physics': {
        enabled: false,
        gravity: { x: 0, y: -9.82, z: 0 },
        solverIterations: 10,
        createGround: true
    },
    'Audio': {
        enabled: false
    },
    'WebXR': {
        enabled: false,
        createVRButton: true,
        createARButton: true
    },
    'Helpers': {
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
    'DebugUI': {
        enabled: false
    }
}