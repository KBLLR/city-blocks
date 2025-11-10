import type * as THREE from "three";

declare module "@/react-app/lib/three/extend/SuperSky.js" {
  export interface SuperSkyOptions {
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    size?: number;
    callback?: () => void;
  }

  export class SuperSky extends THREE.Mesh {
    constructor(options: SuperSkyOptions);
    envMap: THREE.Texture;
    sunPosition: THREE.Vector3;
    moonPosition: THREE.Vector3;
    sun: THREE.DirectionalLight;
    moon: THREE.DirectionalLight;
    ambient: THREE.Light;
    day: number;
    needsUpdate: boolean;
    setData(data: Record<string, number>): void;
    render(): void;
  }
}

declare module "@/react-app/lib/three/extend/Landscape.js" {
  export interface LandscapeOptions {
    size?: [number, number, number];
    sample?: [number, number];
    data?: Record<string, unknown>;
    border?: boolean;
    bottom?: boolean;
    uv?: number;
    envMap?: THREE.Texture;
    encoding?: boolean;
    underWater?: number;
    waterColor?: number;
    callback?: () => void;
  }

  export class Landscape extends THREE.Mesh {
    constructor(options?: LandscapeOptions);
    setData(data: Record<string, unknown>): void;
    setHeight(value: number): void;
    setExpo(value: number): void;
    easing(delta: [number, number]): void;
  }
}

declare module "@/react-app/lib/three/extend/Water.js" {
  export interface WaterOptions {
    textureWidth?: number;
    textureHeight?: number;
    clipBias?: number;
    alpha?: number;
    time?: number;
    waterNormals?: THREE.Texture;
    sunDirection?: THREE.Vector3;
    sunColor?: THREE.Color;
    waterColor?: THREE.Color | number;
    eye?: THREE.Vector3;
    distortionScale?: number;
    size?: number;
    depth?: number;
    py?: number;
  }

  export class Water extends THREE.Mesh {
    constructor(geometry: THREE.BufferGeometry, options?: WaterOptions);
    renderTarget: THREE.WebGLRenderTarget;
    textureMatrix: THREE.Matrix4;
    mirrorCamera: THREE.PerspectiveCamera;
    material: THREE.ShaderMaterial & {
      uniforms: Record<string, { value: unknown }>;
    };
  }
}
