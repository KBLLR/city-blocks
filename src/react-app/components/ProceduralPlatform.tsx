import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { SuperSky } from "@/react-app/lib/three/extend/SuperSky.js";

const DEFAULT_SKY_SETTINGS = {
  t: 0,
  fog: 0,
  cloud_size: 0.45,
  cloud_covr: 0.3,
  cloud_dens: 40,
  inclination: 45,
  azimuth: 90,
  hour: 12,
};

type EnvironmentControls = {
  cloudSize: number;
  cloudCover: number;
  cloudDensity: number;
  hour: number;
};

const DEFAULT_ENVIRONMENT_CONTROLS: EnvironmentControls = {
  cloudSize: DEFAULT_SKY_SETTINGS.cloud_size,
  cloudCover: DEFAULT_SKY_SETTINGS.cloud_covr,
  cloudDensity: DEFAULT_SKY_SETTINGS.cloud_dens,
  hour: DEFAULT_SKY_SETTINGS.hour,
};

type ProceduralPlatformProps = {
  size?: number;
  environmentControls?: EnvironmentControls;
};

export function ProceduralPlatform({ size = 60, environmentControls = DEFAULT_ENVIRONMENT_CONTROLS }: ProceduralPlatformProps) {
  const { scene, gl } = useThree();
  const platformGroup = useMemo(() => new Group(), []);
  const skyRef = useRef<SuperSky | null>(null);
  const baseRef = useRef<Mesh | null>(null);
  const skySettingsRef = useRef({ ...DEFAULT_SKY_SETTINGS });
  const pendingEnvRef = useRef<EnvironmentControls>(environmentControls);

  useEffect(() => {
    scene.add(platformGroup);
    platformGroup.position.set(0, 0, 0);
    return () => {
      scene.remove(platformGroup);
    };
  }, [scene, platformGroup]);

  useEffect(() => {
    const baseGeometry = new BoxGeometry(size, 1.5, size);
    const baseMaterial = new MeshStandardMaterial({
      color: "#dcd7c9",
      metalness: 0.15,
      roughness: 0.75,
    });
    const base = new Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    base.position.set(0, -0.75, 0);
    platformGroup.add(base);
    baseRef.current = base;

    return () => {
      platformGroup.remove(base);
      baseGeometry.dispose();
      baseMaterial.dispose();
      baseRef.current = null;
    };
  }, [platformGroup, size]);

  useEffect(() => {
    skySettingsRef.current = { ...DEFAULT_SKY_SETTINGS };

    let skyInstance: SuperSky | null = null;

    const applyEnvironment = (controls: EnvironmentControls) => {
      const sky = skyRef.current;
      if (!sky || !(sky as { materialSky?: unknown }).materialSky) return;
      sky.setData({
        ...skySettingsRef.current,
        cloud_size: controls.cloudSize,
        cloud_covr: controls.cloudCover,
        cloud_dens: controls.cloudDensity,
        hour: controls.hour,
      });
    };

    const handleSkyReady = () => {
      const sky = skyInstance;
      if (!sky) return;
      applyEnvironment(pendingEnvRef.current);
    };

    const sky = new SuperSky({
      scene,
      renderer: gl,
      size: Math.max(1000, size * 10),
      callback: handleSkyReady,
    });

    platformGroup.add(sky);
    skyInstance = sky;
    skyRef.current = sky;

    return () => {
      if (skyInstance) {
        platformGroup.remove(skyInstance);
        if (skyInstance.sun) scene.remove(skyInstance.sun);
        if (skyInstance.moon) scene.remove(skyInstance.moon);
        if (skyInstance.ambient) scene.remove(skyInstance.ambient);
        skyInstance = null;
        skyRef.current = null;
      }
    };
  }, [gl, scene, size, platformGroup]);

  useEffect(() => {
    pendingEnvRef.current = environmentControls;
    const sky = skyRef.current;
    if (!sky || !(sky as { materialSky?: unknown }).materialSky) return;
    sky.setData({
      ...skySettingsRef.current,
      cloud_size: environmentControls.cloudSize,
      cloud_covr: environmentControls.cloudCover,
      cloud_dens: environmentControls.cloudDensity,
      hour: environmentControls.hour,
    });
  }, [environmentControls]);

  useFrame(() => {
    const sky = skyRef.current;
    if (sky && sky.needsUpdate) {
      sky.render();
    }
  });

  return null;
}
