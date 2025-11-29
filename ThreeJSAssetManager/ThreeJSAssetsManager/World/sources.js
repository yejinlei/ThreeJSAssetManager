export default 
[
    {
        name: 'environment',
        type: 'rgbeLoader', 
        file: { 
            name: 'environment', 
            path: 'ThreeJSAssetsManager/textures/envmap.hdr'
        }
    },
    {
        name: 'Horse',
        type: 'glbModel',
        file: 
            {
                name: 'Horse',
                path: 'ThreeJSAssetsManager/World/models/horse.glb',
                // 基础变换属性
                position: {x: 0, y: 1, z: 0},
                scale: 0.01,
                rotation: {x: 0.1, y: 0.01, z: 0.01},
                rotationOrder: "XYZ",
                quaternion: {x: 0, y: 0, z: 0, w: 1},
                
                // 可见性和渲染属性
                visible: true,
                castShadow: true,
                receiveShadow: true,
                frustumCulled: true,
                renderOrder: 0,
                
                // 材质相关属性
                materialOptions: {
                    color: "#ffffff",
                    wireframe: false,
                    transparent: false,
                    opacity: 1,
                    side: 2, // DoubleSide
                    metalness: 0.2,
                    roughness: 0.8,
                    emissive: 0x000000,
                    emissiveIntensity: 1
                },
                
                // 动画相关配置
                animationOptions: {
                    autoPlay: true,
                    defaultAnimation: "",
                    loop: true,
                    timeScale: 1,
                    crossFadeDuration: 1
                },
                
                // 物理属性
                physics: {
                    enabled: false,
                    mass: 1,
                    type: "dynamic",
                    shape: "convexHull"
                },
                
                // LOD (细节层次)配置
                lod: {
                    enabled: false,
                    levels: [
                        { distance: 0, detail: 1 },
                        { distance: 10, detail: 0.5 },
                        { distance: 20, detail: 0.25 }
                    ]
                },
                
                // 交互相关配置
                interaction: {
                    enabled: true,
                    clickable: true,
                    draggable: true,
                    hoverable: true,
                    axisLock: { x: false, y: true, z: false }
                },
                
                // 自定义标签和元数据
                tags: ["animal", "horse"],
                metadata: {
                    description: "马模型",
                    author: "",
                    version: "1.0"
                }
            }
    },
    {
        name: 'Stork',
        type: 'glbModel',
        file: 
            {
                name: 'Stork',
                path: 'models/Stork.glb',
                // 基础变换属性
                position: {x: 0, y: 0.5, z: 0},
                scale: 0.3,
                rotation: {x: 0, y: 0, z: 0},
                rotationOrder: "XYZ",
                quaternion: {x: 0, y: 0, z: 0, w: 1},
                
                // 可见性和渲染属性
                visible: true,
                castShadow: true,
                receiveShadow: true,
                frustumCulled: true,
                renderOrder: 1,
                
                // 材质相关属性
                materialOptions: {
                    color: "#ffffff",
                    wireframe: false,
                    transparent: false,
                    opacity: 1,
                    side: 2, // DoubleSide
                    metalness: 0.1,
                    roughness: 0.9,
                    emissive: 0x000000,
                    emissiveIntensity: 1
                },
                
                // 动画相关配置
                animationOptions: {
                    autoPlay: true,
                    defaultAnimation: "",
                    loop: true,
                    timeScale: 1,
                    crossFadeDuration: 1
                },
                
                // 物理属性
                physics: {
                    enabled: false,
                    mass: 0.5,
                    type: "dynamic",
                    shape: "convexHull"
                },
                
                // LOD (细节层次)配置
                lod: {
                    enabled: false,
                    levels: [
                        { distance: 0, detail: 1 },
                        { distance: 8, detail: 0.5 },
                        { distance: 16, detail: 0.25 }
                    ]
                },
                
                // 交互相关配置
                interaction: {
                    enabled: true,
                    clickable: true,
                    draggable: true,
                    hoverable: true,
                    axisLock: { x: false, y: false, z: false }
                },
                
                // 自定义标签和元数据
                tags: ["animal", "bird"],
                metadata: {
                    description: "鹳模型",
                    author: "",
                    version: "1.0"
                }
            }
    },
    // {
    //     name: 'AnimatedMorphSphere',
    //     type: 'gltfModel',
    //     file: 
    //         {
    //             name: 'AnimatedMorphSphere',
    //             path:'ThreeJSAssetsManager/World/models/AnimatedMorphSphere.gltf',
    //             position: {x: 0, y: 0, z: 0},
    //             scale: 0.14,
    //             rotation: {x: 0, y: 1.14, z: 0}
    //         }
    // }
    // {
    //         name: 'Horse',
    //         type: 'glbModel',     
    //         file:    
    //         {
    //             name: 'Horse',
    //             path: 'ThreeJSAssetsManager/World/models/house.glb',
    //             position: {x: 0, y: 0, z: 0},
    //             scale: 0.14,
    //             rotation: {x: 0, y: 1.14, z: 0}
    //         }
    // }
]