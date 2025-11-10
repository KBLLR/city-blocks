import {
  useEffect,
  useRef,
  useState,
  useCallback,
  Component,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useContextBridge } from "@react-three/drei";
import {
  EffectComposer,
  DepthOfField,
  Vignette,
  Bloom,
} from "@react-three/postprocessing";
import { OpenLocationCode } from "open-location-code";
import { KeyRound, MapPin } from "lucide-react";
import BuildingInfoCard from "@/react-app/components/BuildingInfoCard";
import { ErrorBoundary } from "@/react-app/components/ErrorBoundary";
import { ApiKeysContext } from "@/react-app/context/ApiKeysContext";
import { ProceduralPlatform } from "@/react-app/components/ProceduralPlatform";
import { ApiKeyFab } from "@/react-app/components/ApiKeyFab";
import { Gui } from "@/react-app/lib/uil/uil.module.js";

// ------------------------------
// Helpers: geo <-> local meters
// ------------------------------
const DEG2RAD = Math.PI / 180;
function metersPerDegreeLon(latDeg: number) {
  return 111320 * Math.cos(latDeg * DEG2RAD);
}
function metersPerDegreeLat() {
  return 110540; // rough average
}
function llToLocalMeters(lat0: number, lon0: number, lat: number, lon: number) {
  const mx = (lon - lon0) * metersPerDegreeLon(lat0);
  const my = (lat - lat0) * metersPerDegreeLat();
  return [mx, my];
}

type Footprint = {
  pts: THREE.Vector2[];
  height: number;
  tags: Record<string, string>;
  metadata?: {
    centroid: { x: number; y: number };
    hero?: boolean;
    scale?: number;
  };
};

type BuildingControlState = {
  footprintScale: number;
  heightScale: number;
  rotation: number;
  verticalOffset: number;
};

type EnvironmentControlState = {
  cloudSize: number;
  cloudCover: number;
  cloudDensity: number;
  hour: number;
};

type OverpassCoordinate = {
  lat: number;
  lon: number;
};

type OverpassElement = {
  type: string;
  geometry?: OverpassCoordinate[];
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

// ------------------------------
// Overpass fetching for buildings
// ------------------------------
const OVERPASS_ENDPOINTS = [
  { url: "https://overpass-api.de/api/interpreter", label: "de" },
  { url: "https://overpass.kumi.systems/api/interpreter", label: "kumi" },
  { url: "https://overpass.openstreetmap.ru/api/interpreter", label: "ru" },
];

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

async function fetchBuildings({
  lat,
  lon,
  sizeMeters,
}: {
  lat: number;
  lon: number;
  sizeMeters: number;
}): Promise<Footprint[]> {
  const half = sizeMeters / 2;
  const dLat = half / metersPerDegreeLat();
  const dLon = half / metersPerDegreeLon(lat);
  const south = lat - dLat;
  const north = lat + dLat;
  const west = lon - dLon;
  const east = lon + dLon;

  const query = `
    [out:json][timeout:90];
    (
      way["building"](${south},${west},${north},${east});
    );
    out tags geom;`;

  // Try multiple endpoints with retry logic
  let lastError: Error | null = null;

  for (
    let endpointIdx = 0;
    endpointIdx < OVERPASS_ENDPOINTS.length;
    endpointIdx++
  ) {
    const endpoint = OVERPASS_ENDPOINTS[endpointIdx];

    // Try this endpoint up to 2 times
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: "data=" + encodeURIComponent(query),
        });

        if (!res.ok) {
          if (res.status === 504 || res.status === 429 || res.status === 503) {
            // Timeout or rate limit - wait and retry
            await new Promise((resolve) =>
              setTimeout(resolve, 2000 * (attempt + 1)),
            );
            continue;
          }
          throw new Error(`Overpass API returned ${res.status}`);
        }

        const data: OverpassResponse = await res.json();

        const footprints: Footprint[] = [];
        const elements = data.elements ?? [];
        for (const el of elements) {
          if (el.type !== "way" || !el.geometry || el.geometry.length < 3)
            continue;
          const pts = el.geometry.map((coord) => {
            const [x, y] = llToLocalMeters(lat, lon, coord.lat, coord.lon);
            return new THREE.Vector2(x, y);
          });
          if (pts[0].distanceTo(pts[pts.length - 1]) > 0.01)
            pts.push(pts[0].clone());

          const tags = el.tags || {};
          let heightM = undefined;
          if (tags.height) {
            const m = String(tags.height).replace(/m$/i, "");
            const parsed = parseFloat(m);
            if (!Number.isNaN(parsed)) heightM = parsed;
          }
          if (heightM === undefined && tags["building:levels"]) {
            const levels = parseFloat(tags["building:levels"]);
            if (!Number.isNaN(levels))
              heightM = Math.max(3, Math.min(60, levels * 3));
          }
          if (heightM === undefined) {
            const t = (tags.building || "").toLowerCase();
            if (t.includes("house") || t.includes("residential"))
              heightM = 9 + Math.random() * 6; // 3–5 floors
            else if (t.includes("garage")) heightM = 4 + Math.random() * 2;
            else heightM = 12 + Math.random() * 18;
          }

          footprints.push({ pts, height: heightM, tags });
        }
        return footprints;
      } catch (error) {
        const normalizedError = normalizeError(error);
        lastError = normalizedError;
        console.warn(
          `Attempt ${attempt + 1} on ${endpoint.label} endpoint failed:`,
          normalizedError.message,
        );

        // If this isn't the last attempt on this endpoint, wait before retrying
        if (attempt < 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * (attempt + 1)),
          );
        }
      }
    }
  }

  // All endpoints and retries failed
  throw new Error(
    `Building data unavailable (last error: ${lastError?.message || "unknown"}). Try again in a minute or reduce the search area.`,
  );
}

// -------------------------------------
// Geometry builder: Shape extrusion mesh
// -------------------------------------
function buildingMeshFromFootprint(
  { pts, height }: { pts: THREE.Vector2[]; height: number },
  material: THREE.Material,
) {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 2,
  });

  // Ensure geometry has an index for better performance and diagnostics compatibility
  if (!geom.index) {
    const indices = [];
    const positionCount = geom.attributes.position.count;
    for (let i = 0; i < positionCount; i += 3) {
      indices.push(i, i + 1, i + 2);
    }
    geom.setIndex(indices);
  }

  geom.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function computeFootprintCentroid(pts: THREE.Vector2[]) {
  let sumX = 0;
  let sumY = 0;
  const count = pts.length;
  for (const pt of pts) {
    sumX += pt.x;
    sumY += pt.y;
  }
  return { x: sumX / count, y: sumY / count };
}

type PrimarySelection = {
  index: number;
  centroid: { x: number; y: number };
};

function selectPrimaryFootprint(
  footprints: Footprint[],
): PrimarySelection | null {
  if (!footprints.length) return null;
  let bestIndex = 0;
  let bestDist = Infinity;
  let bestCentroid = { x: 0, y: 0 };
  footprints.forEach((fp, idx) => {
    const centroid = computeFootprintCentroid(fp.pts);
    const dist = centroid.x * centroid.x + centroid.y * centroid.y;
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = idx;
      bestCentroid = centroid;
    }
  });
  return { index: bestIndex, centroid: bestCentroid };
}

function prepareFootprints(footprints: Footprint[], platformSize: number) {
  const selection = selectPrimaryFootprint(footprints);
  if (!selection) return [];
  const maxRadius = footprints[selection.index].pts.reduce((acc, pt) => {
    const dx = pt.x - selection.centroid.x;
    const dy = pt.y - selection.centroid.y;
    return Math.max(acc, Math.hypot(dx, dy));
  }, 1);
  const margin = platformSize * 0.35;
  const fitScale = maxRadius > 0 ? margin / maxRadius : 1;

  return footprints.map((fp, idx) => {
    const centered = fp.pts.map(
      (pt) =>
        new THREE.Vector2(
          (pt.x - selection.centroid.x) * fitScale,
          (pt.y - selection.centroid.y) * fitScale,
        ),
    );
    return {
      ...fp,
      pts: centered,
      height: fp.height * fitScale,
      metadata: {
        ...fp.metadata,
        centroid:
          idx === selection.index
            ? { x: 0, y: 0 }
            : computeFootprintCentroid(centered),
        hero: idx === selection.index,
        scale: fitScale,
      },
    };
  });
}

// ------------------------------
// Scene Components
// ------------------------------
function SoftLight() {
  const dir = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    if (dir.current) dir.current.target.position.set(0, 0, 0);
  }, []);
  return (
    <>
      <hemisphereLight args={[0xffffff, 0xbcc0c4, 0.8]} />
      <directionalLight
        ref={dir}
        position={[80, 120, 60]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </>
  );
}

// Texture and material creation utilities
function createBrickTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Base brick color
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(0, 0, 256, 256);

  // Draw brick pattern
  const brickWidth = 64;
  const brickHeight = 32;
  const mortarWidth = 2;

  ctx.fillStyle = "#A0A0A0";
  for (let y = 0; y < 256; y += brickHeight) {
    ctx.fillRect(0, y, 256, mortarWidth);
    for (let x = 0; x < 256; x += brickWidth) {
      const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
      ctx.fillRect((x + offset) % 256, y, mortarWidth, brickHeight);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.5, 1);
  return texture;
}

function createConcreteTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Base concrete color
  ctx.fillStyle = "#C0C0C0";
  ctx.fillRect(0, 0, 256, 256);

  // Add some noise and variation
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = Math.random() * 3 + 1;
    const alpha = Math.random() * 0.3;
    ctx.fillStyle = `rgba(${Math.random() * 50}, ${Math.random() * 50}, ${Math.random() * 50}, ${alpha})`;
    ctx.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.3, 0.8);
  return texture;
}

function createGlassTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Base glass color
  ctx.fillStyle = "#E6F3FF";
  ctx.fillRect(0, 0, 256, 256);

  // Window grid pattern
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 2;
  const gridSize = 32;

  for (let x = 0; x < 256; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  for (let y = 0; y < 256; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.2, 0.8);
  return texture;
}

function createWoodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Base wood color
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, "#8B4513");
  gradient.addColorStop(0.5, "#A0522D");
  gradient.addColorStop(1, "#8B4513");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  // Wood grain lines
  ctx.strokeStyle = "rgba(139, 69, 19, 0.3)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y + Math.sin(y * 0.1) * 10);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.8, 0.4);
  return texture;
}

function getBuildingMaterial(
  buildingType: string,
  isHighlighted: boolean = false,
) {
  if (isHighlighted) {
    return new THREE.MeshStandardMaterial({
      color: "#ff6b35",
      emissive: "#ff6b35",
      emissiveIntensity: 0.3,
      roughness: 0.7,
      metalness: 0.1,
    });
  }

  const type = buildingType.toLowerCase();

  // Residential buildings
  if (
    type.includes("house") ||
    type.includes("residential") ||
    type.includes("apartments") ||
    type.includes("detached")
  ) {
    return new THREE.MeshStandardMaterial({
      map: createBrickTexture(),
      color: "#F5DEB3",
      roughness: 0.9,
      metalness: 0.0,
    });
  }

  // Commercial/office buildings
  if (
    type.includes("commercial") ||
    type.includes("office") ||
    type.includes("retail") ||
    type.includes("shop")
  ) {
    return new THREE.MeshStandardMaterial({
      map: createGlassTexture(),
      color: "#E6F3FF",
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.9,
    });
  }

  // Industrial buildings
  if (
    type.includes("industrial") ||
    type.includes("warehouse") ||
    type.includes("factory")
  ) {
    return new THREE.MeshStandardMaterial({
      map: createConcreteTexture(),
      color: "#696969",
      roughness: 0.8,
      metalness: 0.3,
    });
  }

  // Schools, hospitals, public buildings
  if (
    type.includes("school") ||
    type.includes("hospital") ||
    type.includes("public") ||
    type.includes("civic")
  ) {
    return new THREE.MeshStandardMaterial({
      map: createBrickTexture(),
      color: "#DEB887",
      roughness: 0.7,
      metalness: 0.1,
    });
  }

  // Garages
  if (type.includes("garage") || type.includes("carport")) {
    return new THREE.MeshStandardMaterial({
      map: createConcreteTexture(),
      color: "#808080",
      roughness: 0.9,
      metalness: 0.2,
    });
  }

  // Religious buildings
  if (
    type.includes("church") ||
    type.includes("cathedral") ||
    type.includes("mosque") ||
    type.includes("temple")
  ) {
    return new THREE.MeshStandardMaterial({
      color: "#F5F5DC",
      roughness: 0.6,
      metalness: 0.1,
    });
  }

  // Hotels and service buildings
  if (
    type.includes("hotel") ||
    type.includes("service") ||
    type.includes("restaurant")
  ) {
    return new THREE.MeshStandardMaterial({
      map: createWoodTexture(),
      color: "#DEB887",
      roughness: 0.6,
      metalness: 0.1,
    });
  }

  // Default for unknown building types
  return new THREE.MeshStandardMaterial({
    map: createConcreteTexture(),
    color: "#D3D3D3",
    roughness: 0.8,
    metalness: 0.2,
  });
}

type GeometryObject = THREE.Mesh | THREE.LineSegments | THREE.Line;

function isGeometryObject(obj: THREE.Object3D): obj is GeometryObject {
  return (
    obj instanceof THREE.Mesh ||
    obj instanceof THREE.LineSegments ||
    obj instanceof THREE.Line
  );
}

type BuildingGroupUserData = {
  materials?: THREE.Material[];
  edgeMat?: THREE.LineBasicMaterial;
};

function Buildings({
  footprints,
  controls,
  lat,
  lon,
}: {
  footprints: Footprint[];
  controls: BuildingControlState;
  lat: number;
  lon: number;
}) {
  const group = useRef<THREE.Group>(null);
  const [targetBuilding, setTargetBuilding] = useState<{
    position: [number, number, number];
    height: number;
    tags: Record<string, string>;
  } | null>(null);
  const [showCard, setShowCard] = useState(true);

  useEffect(() => {
    const g = group.current;
    if (!g) return;
    const userData = g.userData as BuildingGroupUserData;

    // Cleanup previous meshes
    while (g.children.length > 0) {
      const child = g.children[0];
      g.remove(child);
      if (isGeometryObject(child)) {
        child.geometry.dispose();
      }
    }

    // Dispose of old materials from the previous render
    const oldMats = userData.materials || [];
    oldMats.forEach((mat: THREE.Material) => mat.dispose());
    userData.edgeMat?.dispose();

    if (footprints.length === 0) {
      setTargetBuilding(null);
      return;
    }

    // Create edge material
    const edgeMat = new THREE.LineBasicMaterial({ color: "#666" });

    // Store materials array for cleanup
    const materials: THREE.Material[] = [];
    userData.materials = materials;
    userData.edgeMat = edgeMat;

    let targetBuildingData: {
      position: [number, number, number];
      height: number;
      tags: Record<string, string>;
    } | null = null;

    // Create new meshes
    footprints.forEach((fp) => {
      try {
        const isHero = Boolean(fp.metadata?.hero);
        const buildingType = fp.tags.building || "yes";
        const mat = getBuildingMaterial(buildingType, isHero);
        materials.push(mat); // Store for cleanup
        const m = buildingMeshFromFootprint(fp, mat);
        const footprintScale = isHero ? controls.footprintScale : 1;
        const heightScale = isHero ? controls.heightScale : 1;
        const rotation = isHero ? controls.rotation : 0;
        const verticalOffset = isHero ? controls.verticalOffset : 0;
        m.position.set(0, verticalOffset, 0);
        m.rotation.y = THREE.MathUtils.degToRad(rotation);
        m.scale.set(footprintScale, heightScale, footprintScale);

        const edges = new THREE.EdgesGeometry(m.geometry);
        const line = new THREE.LineSegments(edges, edgeMat);
        m.add(line);
        g.add(m);

        if (isHero) {
          targetBuildingData = {
            position: [
              0,
              fp.height * controls.heightScale + 10 + verticalOffset,
              0,
            ] as [number, number, number],
            height: fp.height,
            tags: fp.tags,
          };
        }
      } catch (e) {
        console.warn("Skipping footprint due to geometry error", e);
      }
    });

    setTargetBuilding(targetBuildingData);

    // Cleanup function
    return () => {
      materials.forEach((mat) => {
        if ((mat as THREE.MeshStandardMaterial).map) {
          (mat as THREE.MeshStandardMaterial).map?.dispose();
        }
        mat.dispose();
      });
      edgeMat.dispose();
    };
  }, [footprints, controls]);

  return (
    <>
      <group ref={group} />
      {targetBuilding && showCard && (
        <Html position={targetBuilding.position} transform occlude>
          <ErrorBoundary
            fallback={(error) => (
              <div className="w-80 rounded-2xl border border-red-200 bg-white/95 p-4 text-sm text-red-700 shadow-xl">
                <p className="font-semibold text-red-800">
                  Building details unavailable.
                </p>
                <p className="mt-2 text-xs text-red-600">{error.message}</p>
                <button
                  type="button"
                  className="mt-4 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white"
                  onClick={() => setShowCard(false)}
                >
                  Dismiss
                </button>
              </div>
            )}
          >
            <BuildingInfoCard
              height={targetBuilding.height}
              tags={targetBuilding.tags}
              lat={lat}
              lon={lon}
              onClose={() => setShowCard(false)}
            />
          </ErrorBoundary>
        </Html>
      )}
    </>
  );
}

function CameraRig({ size }: { size: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(-size * 0.8, size * 1.2, size * 1.1);
    camera.near = 0.1;
    camera.far = 10000;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

// ------------------------------
// Safe Postprocessing Wrapper
// ------------------------------
function MiniatureFX({
  enabled = true,
  bokehScale = 2.2,
}: {
  enabled?: boolean;
  bokehScale?: number;
}) {
  const { gl } = useThree();
  if (!enabled) return null;

  const isWebGL2 = gl.capabilities.isWebGL2;
  const supportsHalfFloat =
    isWebGL2 && gl.getContext().getExtension("EXT_color_buffer_float");

  const frameBufferType = supportsHalfFloat
    ? THREE.HalfFloatType
    : THREE.UnsignedByteType;
  const multisampling = isWebGL2 ? 4 : 0;

  return (
    <EffectComposer
      multisampling={multisampling}
      frameBufferType={frameBufferType}
      autoClear={false}
    >
      <Bloom
        intensity={0.2}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.2}
      />
      <DepthOfField
        focusDistance={0.02}
        focalLength={0.025}
        bokehScale={bokehScale}
        height={480}
      />
      <Vignette eskil={false} offset={0.25} darkness={0.6} />
    </EffectComposer>
  );
}

class FXBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("Postprocessing disabled:", err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// ------------------------------
// Geocoding utilities (Plus Codes + Nominatim)
// ------------------------------
const LATLON_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

function extractPlusCode(str: string) {
  if (!str) return null;
  const token = str.split(/\s+/).find((t) => t.includes("+"));
  if (!token) return null;
  const cleaned = token.toUpperCase().replace(/[^2-9CFGHJMPQRVWX+]/g, "");
  if (!cleaned.includes("+")) return null;
  const [a, b] = cleaned.split("+");
  if (a.length >= 2 && b.length >= 2) return `${a}+${b}`;
  return null;
}

async function geocodeNominatim(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  const js = await res.json();
  if (!Array.isArray(js) || js.length === 0)
    throw new Error("No results from Nominatim");
  return { lat: parseFloat(js[0].lat), lon: parseFloat(js[0].lon) };
}

function decodePlusCode(code: string, refLat: number, refLon: number) {
  // If the code is a short code (6 or 8 characters), we need to recover it with reference coordinates
  if (code.length <= 8 || (code.includes("+") && code.indexOf("+") <= 4)) {
    const fullCode = OpenLocationCode.recoverNearest(code, refLat, refLon);
    const decoded = OpenLocationCode.decode(fullCode);
    return { lat: decoded.latitudeCenter, lon: decoded.longitudeCenter };
  }

  // Otherwise, decode the full code directly
  if (!OpenLocationCode.isValid(code)) {
    throw new Error(`Invalid Plus Code: ${code}`);
  }
  const decoded = OpenLocationCode.decode(code);
  return { lat: decoded.latitudeCenter, lon: decoded.longitudeCenter };
}

async function resolveLocationString(
  input: string,
  fallbackLat: number,
  fallbackLon: number,
) {
  if (!input || !input.trim()) throw new Error("Empty location query");

  // 1) lat,lon
  const m = input.match(LATLON_RE);
  if (m) return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };

  // 2) Plus Code pathway
  const code = extractPlusCode(input);
  if (code) {
    const locality = input.replace(code, "").trim();
    let ref = { lat: fallbackLat, lon: fallbackLon };
    if (locality.length > 0) {
      try {
        ref = await geocodeNominatim(locality);
      } catch (_) {
        /* keep fallback */
      }
    }
    return decodePlusCode(code, ref.lat, ref.lon);
  }

  // 3) Plain address → Nominatim
  return await geocodeNominatim(input);
}

// ------------------------------
// Diagnostics
// ------------------------------
function runSelfTests() {
  const results = [];
  const approx = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

  const lat0 = 52.5,
    lon0 = 13.4;
  const [x1, y1] = llToLocalMeters(lat0, lon0, lat0 + 0.001, lon0 + 0.001);
  results.push({
    name: "metersPerDegree sanity",
    ok: x1 > 0 && y1 > 0 && x1 !== y1,
  });

  const size = 200;
  const half = size / 2;
  const dLat = half / metersPerDegreeLat();
  const dLon = half / metersPerDegreeLon(lat0);
  const [mx, my] = llToLocalMeters(lat0, lon0, lat0 + dLat, lon0 + dLon);
  results.push({
    name: "bbox half-size ≈ meters",
    ok: approx(mx, half, 2) && approx(my, half, 2),
  });

  const tri = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(10, 0),
    new THREE.Vector2(0, 10),
    new THREE.Vector2(0, 0),
  ];
  const mesh = buildingMeshFromFootprint(
    { pts: tri, height: 5 },
    new THREE.MeshStandardMaterial(),
  );
  results.push({
    name: "extrude has index",
    ok: !!mesh.geometry.index && mesh.geometry.index.count > 0,
  });
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();

  results.push({
    name: "extractPlusCode simple",
    ok: extractPlusCode("FCHQ+XQ Berlin") === "FCHQ+XQ",
  });
  results.push({
    name: "extractPlusCode none",
    ok: extractPlusCode("Alexanderplatz Berlin") === null,
  });

  const mm = "52.5, 13.4".match(LATLON_RE);
  results.push({
    name: "latlon parse",
    ok: !!mm && parseFloat(mm[1]) === 52.5 && parseFloat(mm[2]) === 13.4,
  });

  return results;
}

function Diagnostics({ onClose }: { onClose: () => void }) {
  const [results] = useState(() => runSelfTests());
  const allOk = results.every((r) => r.ok);
  return (
    <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur rounded-2xl shadow-xl p-4 w-[340px] text-sm">
      <div className="font-medium text-gray-800 mb-2">Diagnostics</div>
      <ul className="space-y-1">
        {results.map((r, i) => (
          <li key={i} className={r.ok ? "text-green-700" : "text-red-700"}>
            {r.ok ? "✅" : "❌"} {r.name}
          </li>
        ))}
      </ul>
      <div className="mt-3 text-xs text-gray-600">
        {allOk
          ? "All core checks passed."
          : "Some checks failed; rendering still may work."}
      </div>
      <button
        onClick={onClose}
        className="mt-3 px-3 py-1.5 rounded-lg bg-black text-white"
      >
        Close
      </button>
    </div>
  );
}

// ---------------------------------
// UI Panel
// ---------------------------------
interface PanelProps {
  locQuery: string;
  setLocQuery: (query: string) => void;
  onLocate: () => void;
  lat: number;
  lon: number;
  size: number;
  setLat: (lat: number) => void;
  setLon: (lon: number) => void;
  setSize: (size: number) => void;
  loading: boolean;
  onRender: () => void;
  footprints: Footprint[];
}

// ---------------------------------
// Main App Component (Placeholder)
// ---------------------------------
// The original file was truncated. A placeholder App component
// has been added to provide a complete, runnable file.

const DEFAULT_LAT = 52.52; // Berlin
const DEFAULT_LON = 13.405;
const DEFAULT_SIZE = 250;

function Panel(props: PanelProps) {
  const { locQuery, setLocQuery, onLocate, size, setSize, onRender, loading } =
    props;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-4xl rounded-[14px] border border-[#35383f] bg-[#22252b] p-5 text-[#e3e3e3] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_18px_30px_rgba(0,0,0,0.5)]">
        <div className="mb-4 flex flex-col gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#a6aab3] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">Location</div>
          <div className="flex items-center gap-3">
            <span className="opacity-80">Mode: Fun</span>
            <ApiKeyFab
              renderTrigger={({ onOpen }) => (
                <button
                  type="button"
                  onClick={onOpen}
                  className="inline-flex items-center gap-2 rounded-full border border-[#3d4149] bg-[#262930] px-3 py-1 text-[0.65rem] tracking-[0.16em] text-[#d4d7dc] transition hover:border-[#5b5f69] hover:bg-[#30333b]"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  API KEY
                </button>
              )}
            />
          </div>
        </div>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-[10px] border border-[#3a3d45] bg-[#2a2d34] px-4 py-2 shadow-inner">
            <MapPin className="h-4 w-4 text-[#8a8f99]" />
            <input
              type="text"
              value={locQuery}
              onChange={(e) => setLocQuery(e.target.value)}
              placeholder="52.5162, 13.3777 · Brandenburg Gate"
              className="w-full bg-transparent text-sm text-[#f1f1f1] placeholder:text-[#b6bac2] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={onLocate}
              disabled={loading}
              className="rounded-lg border border-[#454950] bg-[#2c2f36] px-4 py-2 text-[0.72rem] font-semibold tracking-[0.08em] text-[#d4d7dc] transition hover:border-[#5a5f6a] hover:bg-[#3d414a] disabled:opacity-60"
            >
              {loading ? "…" : "Center"}
            </button>
            <button
              onClick={onRender}
              disabled={loading}
              className="rounded-lg border border-[#454950] bg-[#2c2f36] px-4 py-2 text-[0.72rem] font-semibold tracking-[0.08em] text-[#d4d7dc] transition hover:border-[#5a5f6a] hover:bg-[#3d414a] disabled:opacity-60"
            >
              {loading ? "Loading…" : "Fetch"}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label
            className="text-[0.72rem] font-semibold tracking-[0.12em] text-[#a1a4ab]"
            htmlFor="area-size"
          >
            Area Size
          </label>
          <input
            id="area-size"
            type="range"
            min="100"
            max="1000"
            step="50"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-white"
          />
          <span className="rounded-lg border border-[#3d4149] bg-[#262930] px-3 py-1 text-xs tracking-[0.08em] text-[#d4d7dc]">
            {Math.round(size)}m
          </span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [locQuery, setLocQuery] = useState("Brandenburg Gate");
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lon, setLon] = useState(DEFAULT_LON);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // To force re-render

  const [buildingControls, setBuildingControls] =
    useState<BuildingControlState>({
      footprintScale: 1,
      heightScale: 1,
      rotation: 0,
      verticalOffset: 0,
    });

  const [envControls, setEnvControls] = useState<EnvironmentControlState>({
    cloudSize: 150,
    cloudCover: 0.3,
    cloudDensity: 0.1,
    hour: 10,
  });

  const ContextBridge = useContextBridge(ApiKeysContext);

  const handleLocate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { lat: newLat, lon: newLon } = await resolveLocationString(
        locQuery,
        lat,
        lon,
      );
      setLat(newLat);
      setLon(newLon);
      setLocQuery(`${newLat.toFixed(6)}, ${newLon.toFixed(6)}`);
    } catch (error) {
      const normalizedError = normalizeError(error);
      setError(normalizedError.message || "Failed to geocode location.");
    }
    setLoading(false);
  }, [locQuery, lat, lon]);

  const handleRender = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { lat: currentLat, lon: currentLon } = await resolveLocationString(
        locQuery,
        lat,
        lon,
      );
      setLat(currentLat);
      setLon(currentLon);
      const fetchedFootprints = await fetchBuildings({
        lat: currentLat,
        lon: currentLon,
        sizeMeters: size,
      });
      const preparedFootprints = prepareFootprints(
        fetchedFootprints,
        size * 0.4,
      );
      setFootprints(preparedFootprints);
      setRenderKey((k) => k + 1); // Force canvas re-render
    } catch (error) {
      const normalizedError = normalizeError(error);
      setError(normalizedError.message || "Failed to fetch building data.");
    }
    setLoading(false);
  }, [locQuery, lat, lon, size]);

  // UI Panel Controls (uil)
  useEffect(() => {
    const gui = new Gui({
      title: "Controls",
      size: 260,
      css: `position:absolute; top:10px; right:10px; z-index: 20;`,
    });

    gui.add("title", "Building");
    gui
      .add("number", { name: "Height", value: 1, min: 0.1, max: 3, step: 0.05 })
      .onChange((v: number) =>
        setBuildingControls((c) => ({ ...c, heightScale: v })),
      );
    gui
      .add("number", { name: "Scale", value: 1, min: 0.1, max: 3, step: 0.05 })
      .onChange((v: number) =>
        setBuildingControls((c) => ({ ...c, footprintScale: v })),
      );
    gui
      .add("number", {
        name: "Rotation",
        value: 0,
        min: -180,
        max: 180,
        step: 5,
      })
      .onChange((v: number) =>
        setBuildingControls((c) => ({ ...c, rotation: v })),
      );
    gui
      .add("number", { name: "Offset Y", value: 0, min: -50, max: 50, step: 1 })
      .onChange((v: number) =>
        setBuildingControls((c) => ({ ...c, verticalOffset: v })),
      );

    gui.add("title", "Environment");
    gui
      .add("number", {
        name: "Time (H)",
        value: 10,
        min: 0,
        max: 24,
        step: 0.5,
      })
      .onChange((v: number) => setEnvControls((c) => ({ ...c, hour: v })));
    gui
      .add("number", {
        name: "Cloud Size",
        value: 150,
        min: 50,
        max: 500,
        step: 10,
      })
      .onChange((v: number) => setEnvControls((c) => ({ ...c, cloudSize: v })));
    gui
      .add("number", {
        name: "Cloud Cover",
        value: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
      })
      .onChange((v: number) =>
        setEnvControls((c) => ({ ...c, cloudCover: v })),
      );

    gui
      .add("button", { name: "Diagnostics" })
      .onChange(() => setShowDiagnostics((s) => !s));

    type GuiInternals = {
      dispose?: () => void;
      uis?: unknown[];
    };
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      const container = (gui as { content?: HTMLElement }).content;
      if (typeof gui.dispose === "function") {
        const internal = gui as GuiInternals;
        if (Array.isArray(internal.uis)) {
          internal.uis.length = 0;
        }
        try {
          gui.dispose();
          return;
        } catch (error) {
          console.warn("Failed to dispose UIL gui", error);
        }
      }
      container?.remove();
    };
  }, []);

  return (
    <div className="w-full h-screen relative">
      <Panel
        locQuery={locQuery}
        setLocQuery={setLocQuery}
        onLocate={handleLocate}
        lat={lat}
        lon={lon}
        size={size}
        setLat={setLat}
        setLon={setLon}
        setSize={setSize}
        loading={loading}
        onRender={handleRender}
        footprints={footprints}
      />
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-lg bg-red-100 p-3 text-sm text-red-700 shadow-lg">
          <strong>Error:</strong> {error}
        </div>
      )}
      {showDiagnostics && (
        <Diagnostics onClose={() => setShowDiagnostics(false)} />
      )}

      <Canvas
        key={renderKey}
        shadows
        gl={{ antialias: true, alpha: true }}
        className="bg-gradient-to-br from-blue-300 to-sky-500"
      >
        <ContextBridge>
          <CameraRig size={size} />
          <SoftLight />
          <ProceduralPlatform size={size * 0.4} envControls={envControls} />
          <Buildings
            footprints={footprints}
            controls={buildingControls}
            lat={lat}
            lon={lon}
          />
          <OrbitControls
            makeDefault
            minDistance={10}
            maxDistance={size * 2}
            maxPolarAngle={Math.PI / 2.1}
          />
          <FXBoundary>
            <MiniatureFX />
          </FXBoundary>
        </ContextBridge>
      </Canvas>
    </div>
  );
}
