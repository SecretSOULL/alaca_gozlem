import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Float, Sphere, useTexture, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// High-resolution realistic satellite textures from stable Three.js repository
const TEXTURE_URLS = {
  map: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
  normalMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
  specularMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
  cloudsMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
  sunMap: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lava/lavatile.jpg',
};

const SolarWind = ({ speed, pd, highFidelity }: { speed: number; pd: number; highFidelity: boolean }) => {
  const linesRef = useRef<THREE.LineSegments>(null);
  
  // Scale count by density (pd). Normal pd is around 2-8.
  const baseCount = highFidelity ? 600 : 250;
  const densityFactor = Math.min(2.5, Math.max(0.3, pd / 5));
  const count = Math.floor(baseCount * densityFactor);
  
  const sunPos = useMemo(() => new THREE.Vector3(200, 0, -80), []);
  const earthPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const dir = useMemo(() => new THREE.Vector3().subVectors(earthPos, sunPos).normalize(), [earthPos, sunPos]);
  
  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 2 * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const p = new THREE.Vector3().copy(sunPos).lerp(earthPos, t);
      const spread = 8 + t * 25;
      const offsetX = (Math.random() - 0.5) * spread;
      const offsetY = (Math.random() - 0.5) * spread;
      const offsetZ = (Math.random() - 0.5) * spread;
      
      const streakLength = 1.5 + Math.random() * 2.5;
      
      pos[i * 6] = p.x + offsetX;
      pos[i * 6 + 1] = p.y + offsetY;
      pos[i * 6 + 2] = p.z + offsetZ;
      
      pos[i * 6 + 3] = pos[i * 6] - dir.x * streakLength;
      pos[i * 6 + 4] = pos[i * 6 + 1] - dir.y * streakLength;
      pos[i * 6 + 5] = pos[i * 6 + 2] - dir.z * streakLength;
    }
    return [pos];
  }, [count, dir, sunPos, earthPos]); // Re-memoize if count or sunPos changes

  useFrame((state, delta) => {
    if (!linesRef.current) return;
    const pos = linesRef.current.geometry.attributes.position.array as Float32Array;
    
    // Scale move speed by wind speed. Normal speed is 300-800.
    const speedFactor = Math.min(2, Math.max(0.5, speed / 450));
    const moveSpeed = speedFactor * delta * 25;
    
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < 2; j++) {
        const idx = i * 6 + j * 3;
        pos[idx] += dir.x * moveSpeed;
        pos[idx + 1] += dir.y * moveSpeed;
        pos[idx + 2] += dir.z * moveSpeed;
      }

      const leadX = pos[i * 6];
      const leadY = pos[i * 6 + 1];
      const leadZ = pos[i * 6 + 2];
      const p = new THREE.Vector3(leadX, leadY, leadZ);
      
      if (p.distanceTo(earthPos) > 250 || p.dot(dir) > 12) {
        const streakLength = 1.5 + Math.random() * 2.5;
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        );
        
        pos[i * 6] = sunPos.x + offset.x;
        pos[i * 6 + 1] = sunPos.y + offset.y;
        pos[i * 6 + 2] = sunPos.z + offset.z;
        
        pos[i * 6 + 3] = pos[i * 6] - dir.x * streakLength;
        pos[i * 6 + 4] = pos[i * 6 + 1] - dir.y * streakLength;
        pos[i * 6 + 5] = pos[i * 6 + 2] - dir.z * streakLength;
      }
    }
    linesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
};

const Sun = () => {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.ShaderMaterial>(null);
  const textures = useTexture(TEXTURE_URLS);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sunRef.current) {
      sunRef.current.rotation.y = t * 0.05;
      sunRef.current.rotation.x = t * 0.02;
    }
    if (coronaRef.current) {
      coronaRef.current.uniforms.uTime.value = t;
    }
  });

  const coronaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color("#ff2200") }, // Deeper red for outer edge
    uCoreColor: { value: new THREE.Color("#ffaa00") } // Warm orange for inner glow
  }), []);

  return (
    <group position={[200, 0, -80]}>
      {/* Core - Fiery Textured Surface */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[10, 64, 64]} />
        <meshStandardMaterial 
          emissive="#ff2200" 
          emissiveIntensity={35} 
          emissiveMap={textures.sunMap}
          map={textures.sunMap}
          color="#ffff00"
          roughness={1}
          metalness={0}
        />
      </mesh>
      
      {/* Volumetric Corona - Dispersed Atmospheric Glow */}
      <mesh scale={[1.6, 1.6, 1.6]}>
        <sphereGeometry args={[10, 64, 64]} />
        <shaderMaterial
          ref={coronaRef}
          uniforms={coronaUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 uColor;
            uniform vec3 uCoreColor;
            uniform float uTime;
            
            void main() {
              // Extremely soft exponential falloff for "dispersed" look
              float fresnel = pow(1.0 - dot(vNormal, vec3(0, 0, 1.0)), 1.2);
              float falloff = exp(-1.8 * (1.0 - fresnel));
              
              // Dynamic turbulence to break the "mold" look
              float noise = sin(vPosition.x * 0.2 + uTime * 0.1) * cos(vPosition.y * 0.2 - uTime * 0.08) * 0.4;
              float intensity = (falloff + noise * falloff) * 2.0;
              
              // Subtle rays that blend into the dispersion
              float angle = atan(vPosition.y, vPosition.x);
              float rays = pow(abs(sin(angle * 3.0 + uTime * 0.005)), 6.0) * 0.2;
              intensity += rays * falloff;
              
              // Deep red to orange gradient
              vec3 finalColor = mix(uColor, uCoreColor, falloff * 0.6);
              
              gl_FragColor = vec4(finalColor, intensity * 0.3);
            }
          `}
        />
      </mesh>
      
      {/* Outer Atmospheric Haze - Large, Very Soft Dispersion */}
      <mesh scale={[4.5, 4.5, 4.5]}>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial 
          color="#ff4400" 
          transparent 
          opacity={0.01} 
          side={THREE.BackSide} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Extreme Outer Glow - Maximum Dispersion */}
      <mesh scale={[8.0, 8.0, 8.0]}>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial 
          color="#ff6600" 
          transparent 
          opacity={0.004} 
          side={THREE.BackSide} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Main Solar Light Source */}
      <pointLight intensity={15000} distance={2000} color="#ffcc00" decay={1.5} />
    </group>
  );
};

const MagneticField = ({ bz, highFidelity }: { bz: number; highFidelity: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lineCount = highFidelity ? 24 : 12;
  
  const lines = useMemo(() => {
    const curves = [];
    
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      // Vary radius slightly for a more natural look
      const baseRadius = 1.8 + (i % 3) * 0.4;
      
      // Symmetric dipole field lines emerging vertically from poles
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 1.0, 0), // North Pole (Surface)
        new THREE.Vector3(
          Math.cos(angle) * baseRadius, 
          2.5, // High vertical CP for "emerging" look
          Math.sin(angle) * baseRadius
        ),
        new THREE.Vector3(
          Math.cos(angle) * baseRadius, 
          -2.5, // High vertical CP for "emerging" look
          Math.sin(angle) * baseRadius
        ),
        new THREE.Vector3(0, -1.0, 0) // South Pole (Surface)
      );
      curves.push(curve.getPoints(highFidelity ? 60 : 30));
    }
    return curves;
  }, [lineCount, highFidelity]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.y = t * 0.1;
      const scale = 1 + Math.sin(t * 2) * 0.02;
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  const color = bz < -10 ? "#ff2244" : bz < -5 ? "#ffcc00" : "#00ff88";

  return (
    <group ref={groupRef}>
      {lines.map((points, i) => (
        <line key={i}>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              count={points.length}
              array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial attach="material" color={color} transparent opacity={0.25} linewidth={1} />
        </line>
      ))}
    </group>
  );
};

const Earth = ({ bz, highFidelity }: { bz: number; highFidelity: boolean }) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  const textures = useTexture(TEXTURE_URLS);

  const atmosphereColor = useMemo(() => {
    if (bz < -10) return "#ff2244"; // Red
    if (bz < -5) return "#ffcc00";  // Yellow
    return "#00ff88";               // Green
  }, [bz]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (earthRef.current) earthRef.current.rotation.y = t * 0.02;
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.025;
    
    if (atmosphereRef.current) {
      const scale = 1.06 + Math.abs(bz) * 0.006;
      atmosphereRef.current.scale.set(scale, scale, scale);
    }
  });

  const segments = highFidelity ? 64 : 32;

  return (
    <group>
      {/* Dynamic Atmosphere Ring */}
      <Sphere ref={atmosphereRef} args={[1, segments, segments]}>
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* High-Vibrancy Earth Surface */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, highFidelity ? 128 : 64, highFidelity ? 128 : 64]} />
        <meshPhongMaterial
          map={textures.map}
          normalMap={textures.normalMap}
          normalScale={new THREE.Vector2(0.015, 0.015)}
          specularMap={textures.specularMap}
          specular={new THREE.Color('#444444')}
          shininess={35}
        />
      </mesh>

      {/* Dense Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.012, highFidelity ? 128 : 64, highFidelity ? 128 : 64]} />
        <meshStandardMaterial
          map={textures.cloudsMap}
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      {/* Magnetosphere Ring */}
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh position={[0, 0, 0]} scale={[1.52, 1.52, 1.52]}>
          <torusGeometry args={[1.1, 0.001, 16, highFidelity ? 100 : 50]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.06} />
        </mesh>
      </Float>
    </group>
  );
};

const GlobeFallback = ({ error = false }: { error?: boolean }) => (
  <mesh>
    <sphereGeometry args={[1, 64, 64]} />
    <meshStandardMaterial 
      color={error ? "#2a0a0a" : "#0d2040"} 
      roughness={0.5}
      metalness={0.5}
    />
  </mesh>
);

class TextureErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <GlobeFallback error />;
    return this.props.children;
  }
}

export default function Globe({ 
  bz, 
  speed, 
  pd,
  showMagneticField = true, 
  showSolarWind = true,
  highFidelity = true
}: { 
  bz: number; 
  speed: number;
  pd: number;
  showMagneticField?: boolean;
  showSolarWind?: boolean;
  highFidelity?: boolean;
}) {
  return (
    <div className="w-full h-full bg-[#010409]">
      <Canvas shadows gl={{ antialias: highFidelity, powerPreference: "high-performance" }}>
        <PerspectiveCamera makeDefault position={[0, 0, 2.8]} />
        <OrbitControls
          enablePan={false}
          minDistance={1.4}
          maxDistance={8}
          autoRotate={false}
          enableDamping={true}
          dampingFactor={0.05}
        />
        
        {/* High-Contrast Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[-5, 5, 5]} intensity={1.2} color="#ffffff" castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.2} color="#4466ff" />
        <hemisphereLight intensity={0.3} color="#ffffff" groundColor="#000000" />

        <TextureErrorBoundary>
          <Suspense fallback={<GlobeFallback />}>
            <Earth bz={bz} highFidelity={highFidelity} />
            {showMagneticField && <MagneticField bz={bz} highFidelity={highFidelity} />}
            {showSolarWind && <SolarWind speed={speed} pd={pd} highFidelity={highFidelity} />}
            <Sun />
          </Suspense>
        </TextureErrorBoundary>

        <Stars
          radius={500}
          depth={0}
          count={highFidelity ? 10000 : 4000}
          factor={4}
          saturation={0}
          fade
          speed={0}
        />
      </Canvas>
    </div>
  );
}
