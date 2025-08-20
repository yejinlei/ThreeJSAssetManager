import { TextureLoader, CubeTextureLoader, EquirectangularReflectionMapping }from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import ThreeJSAssetsManager from '../ThreeJSAssetsManager.js'

import EventEmitter from './EventEmitter.js';

export default class Resources extends EventEmitter {
  constructor(sources) {
    super();

    // Options
    this.sources = sources;

    // Setup
    this.items = {};
    this.toLoad = this.sources.length;
    this.loaded = 0;

    this.setLoaders();
    this.startLoading();
  }

  setLoaders() {
    this.loaders = {};
    
    // 创建一个共享的 DRACOLoader 实例
    const dracoLoader = new DRACOLoader();
    // 使用 CDN 上的 Draco 解码器
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    // 可选：设置为使用 JS 解码器而不是 WASM (如果 WASM 有问题)
    // dracoLoader.setDecoderConfig({ type: 'js' });
    
    // 为 gltfLoader 设置 DRACOLoader
    this.loaders.gltfLoader = new GLTFLoader();
    this.loaders.gltfLoader.setDRACOLoader(dracoLoader);

    // 为 glbLoader 设置相同的 DRACOLoader 实例
    this.loaders.glbLoader = new GLTFLoader();
    this.loaders.glbLoader.setDRACOLoader(dracoLoader);
    
    this.loaders.textureLoader = new TextureLoader();
    this.loaders.cubeTextureLoader = new CubeTextureLoader();
    this.loaders.rgbeLoader = new RGBELoader();

  }

  startLoading() {
    // Load each source
    for (const source of this.sources) {
      if (source.type === 'gltfModel') {
        console.log('尝试加载 gltf 文件路径:', source.file.path);
        this.loaders.gltfLoader.load(source.file.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === 'glbModel') {
          this.loaders.glbLoader.load(
            source.file.path,
              (file) => { 
                  this.sourceLoaded(source, file);  
              });       
      } else if (source.type === 'texture') {
        console.log('尝试加载纹理文件路径:', source.path);
        this.loaders.textureLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === 'cubeTexture') {
        console.log('尝试加载立方体贴图文件路径:', source.path);
        this.loaders.cubeTextureLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === 'rgbeLoader') {
        console.log('尝试加载环境贴图文件路径:', source.file.path);

        this.loaders.rgbeLoader.load(source.file.path, (texture) => {
          texture.mapping = EquirectangularReflectionMapping;
          this.sourceLoaded(source, texture);
          console.log('environment环境贴图加载完成:', source.name, texture);
        },
          undefined,
          (error) => {
            console.error('环境贴图加载失败:', error);
          }
        );

      }
    }
  }


  sourceLoaded(source, file) {
    this.items[source.name] = file;

    this.loaded++;

    // test if all sources have been loaded, then we know we are ready to start the experience
    if (this.loaded === this.toLoad) {
      console.log('所有的资源加载完成:', this.loaded);
      this.trigger('ready');
    }
  }
}
