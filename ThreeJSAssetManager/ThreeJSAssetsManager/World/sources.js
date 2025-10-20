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
                position: {x: 0, y: 1, z: 0},
                scale: 0.01,
                rotation: {x: 0.1, y: 0.01, z: 0.01}
            }
    }
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