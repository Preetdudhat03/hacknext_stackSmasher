'use client';
import { useRef, useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

/* ———————————————————————————————————————————————
   BODY MATERIAL — uses MeshPhysicalMaterial for
   reliable rendering (MeshTransmissionMaterial
   was silently failing in many environments)
   ——————————————————————————————————————————————— */
function BodyMaterial({ color = '#b8c8ff', fade = false }) {
  const matRef = useRef();

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, fade ? 0.15 : 0.85, 0.05);
    }
  });

  return (
    <meshPhysicalMaterial
      ref={matRef}
      color={color}
      roughness={0.15}
      metalness={0.1}
      transmission={0.85}
      thickness={2.0}
      ior={1.5}
      envMapIntensity={1.5}
      clearcoat={0.8}
      clearcoatRoughness={0.1}
      transparent
      opacity={0.85}
      side={THREE.DoubleSide}
    />
  );
}

/* ——— Component Prop Overloads for Prop-drilling ——— */
function Head({ color, fade }) {
  return (
    <group position={[0, 1.55, 0]}>

      {/* Cranium */}
      <mesh>
        <sphereGeometry args={[0.34, 48, 48]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      {/* Jaw / chin */}
      <mesh position={[0, -0.18, 0.08]} scale={[0.72, 0.42, 0.62]}>
        <sphereGeometry args={[0.34, 32, 32]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 0.28, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      {/* Ears */}
      <mesh position={[0.33, 0, 0]} scale={[0.12, 0.2, 0.08]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      <mesh position={[-0.33, 0, 0]} scale={[0.12, 0.2, 0.08]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
    </group>
  );
}

/* ——— Torso ——— */
function Torso({ color, gender, fade }) {
  const leftShoulderRef = useRef();
  const rightShoulderRef = useRef();
  const chestRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Continuous ambient breathing mechanics
    const breathScale = 1 + Math.sin(t * 1.5) * 0.015;
    if (chestRef.current) {
      chestRef.current.scale.z = breathScale;
      chestRef.current.scale.x = THREE.MathUtils.lerp(chestRef.current.scale.x, (gender === 'male' ? 1.25 : 1.0) * (1 + Math.sin(t * 1.5) * 0.005), 0.05);
    }

    // Gender geometry morphing
    const targetShoulderX = gender === 'male' ? 0.58 : 0.45;
    if (leftShoulderRef.current && rightShoulderRef.current) {
      leftShoulderRef.current.position.x = THREE.MathUtils.lerp(leftShoulderRef.current.position.x, -targetShoulderX, 0.05);
      rightShoulderRef.current.position.x = THREE.MathUtils.lerp(rightShoulderRef.current.position.x, targetShoulderX, 0.05);
    }
  });

  return (
    <group position={[0, 0.2, 0]}>
      {/* Upper torso - chest */}
      <mesh ref={chestRef} position={[0, 0.25, 0]}>
        <capsuleGeometry args={[0.42, 0.5, 12, 24]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      {/* Lower torso - abdomen */}
      <mesh position={[0, -0.35, 0]}>
        <capsuleGeometry args={[0.35, 0.45, 12, 24]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      {/* Shoulders */}
      <mesh ref={rightShoulderRef} position={[0.45, 0.5, 0]} scale={[0.22, 0.16, 0.18]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      <mesh ref={leftShoulderRef} position={[-0.45, 0.5, 0]} scale={[0.22, 0.16, 0.18]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
    </group>
  );
}

/* ——— Arm ——— */
function Arm({ side, color, gender, fade }) {
  const groupRef = useRef();

  useFrame(() => {
    const targetX = gender === 'male' 
      ? (side === 'left' ? -0.73 : 0.73) 
      : (side === 'left' ? -0.58 : 0.58);
    
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
    }
  });

  const initialX = side === 'left' ? -0.58 : 0.58;
  const rotZ = side === 'left' ? 0.12 : -0.12;
  return (
    <group ref={groupRef} position={[initialX, 0.55, 0]} rotation={[0, 0, rotZ]}>
      <mesh position={[0, -0.32, 0]}>
        <capsuleGeometry args={[0.09, 0.48, 8, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      {/* Elbow joint */}
      <mesh position={[0, -0.6, 0]}>
        <sphereGeometry args={[0.095, 16, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      <mesh position={[0, -0.9, 0]}>
        <capsuleGeometry args={[0.075, 0.42, 8, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      {/* Hand */}
      <mesh position={[0, -1.18, 0]} scale={[0.8, 1, 0.5]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
    </group>
  );
}

/* ——— Leg ——— */
function Leg({ side, color, fade }) {
  const x = side === 'left' ? -0.2 : 0.2;
  return (
    <group position={[x, -0.95, 0]}>
      {/* Hip joint */}
      <mesh>
        <sphereGeometry args={[0.13, 16, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      <mesh position={[0, -0.38, 0]}>
        <capsuleGeometry args={[0.12, 0.55, 8, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      {/* Knee */}
      <mesh position={[0, -0.7, 0]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
      <mesh position={[0, -1.05, 0]}>
        <capsuleGeometry args={[0.09, 0.5, 8, 16]} />
        <BodyMaterial color={color} fade={fade} />
      </mesh>
    </group>
  );
}

function InternalOrgans({ activeCondition }) {
  const materials = useMemo(() => ({
    brain: new THREE.MeshStandardMaterial({ color: '#ff1166', emissive: '#ff0033', transparent: true, depthWrite: false, opacity: 0 }),
    heart: new THREE.MeshStandardMaterial({ color: '#ff2255', emissive: '#ff0000', transparent: true, depthWrite: false, opacity: 0 }),
    lungs: new THREE.MeshStandardMaterial({ color: '#ff44aa', emissive: '#ff1155', transparent: true, depthWrite: false, opacity: 0 })
  }), []);

  useFrame((state) => {
    const isBrain = ['neurological', 'post-stroke', 'depression', 'parkinsons'].includes(activeCondition);
    const isHeart = activeCondition === 'cardiovascular';
    const isLungs = activeCondition === 'asthma';

    // Heartbeat pulse intensity (red emissive pulse as requested)
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.8;

    materials.brain.opacity = THREE.MathUtils.lerp(materials.brain.opacity, isBrain ? 0.95 : 0, 0.05);
    materials.brain.emissiveIntensity = isBrain ? pulse : 0;
    
    materials.heart.opacity = THREE.MathUtils.lerp(materials.heart.opacity, isHeart ? 0.95 : 0, 0.05);
    materials.heart.emissiveIntensity = isHeart ? pulse : 0;
    
    materials.lungs.opacity = THREE.MathUtils.lerp(materials.lungs.opacity, isLungs ? 0.9 : 0, 0.05);
    materials.lungs.emissiveIntensity = isLungs ? pulse : 0;
  });

  return (
    <>
      {/* Brain */}
      <mesh material={materials.brain} position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
      </mesh>
      {/* Heart */}
      <mesh material={materials.heart} position={[0.08, 0.5, 0.05]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.08, 0.15, 16]} />
      </mesh>
      <mesh material={materials.heart} position={[0.08, 0.55, 0.05]}>
        <sphereGeometry args={[0.08, 16, 16]} />
      </mesh>
      {/* Lungs */}
      <mesh material={materials.lungs} position={[0.15, 0.45, 0]}>
        <capsuleGeometry args={[0.1, 0.25, 16, 16]} />
      </mesh>
      <mesh material={materials.lungs} position={[-0.15, 0.45, 0]}>
        <capsuleGeometry args={[0.1, 0.25, 16, 16]} />
      </mesh>
    </>
  );
}

/* ——— Floating luminous particles ——— */
function Particles({ count = 80 }) {
  const ref = useRef();
  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      sz[i] = Math.random() * 0.02 + 0.005;
    }
    return { positions: pos, sizes: sz };
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.015;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#a4b8f7"
        transparent
        opacity={0.45}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}


/* ——— Smooth Camera Flight Rig ——— */
function CameraRig({ activeCondition, isExplore }) {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const lookAtTarget = useRef(new THREE.Vector3(0, 0.3, 0));
  const posTarget = useRef(new THREE.Vector3(0, 0.5, 4.2));

  // Dynamic camera views for conditions (adjusted for the body's -0.5 Y world offset)
  const CONDITION_VIEWS = {
    hero: { target: [0, 0.3, 0], pos: [0, 0.4, 4.4] }, // Stable full body
    explore: { target: [0, 0.3, 0], pos: [0, 0.4, 4.4] }, // Stable full body
    asthma: { target: [0, 0.95, 0.1], pos: [0, 0.95, 1.6] }, // Nose/Face area (vocal tract)
    cardiovascular: { target: [0, 0.0, 0.1], pos: [0, 0.0, 1.8] }, // Heart area
    neurological: { target: [0, 1.1, 0], pos: [0, 1.1, 1.4] }, // Brain/head area
    'post-stroke': { target: [0.15, 0.95, 0.1], pos: [0.3, 0.95, 1.5] }, // Side of face/brain
    parkinsons: { target: [0, 1.0, 0.1], pos: [0, 1.0, 1.4] }, // Brain/Voice area
    depression: { target: [0, 1.1, 0], pos: [0, 1.1, 1.5] }, // Head area
  };

  useEffect(() => {
    const handleMouse = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  useFrame(() => {
    // Determine the target view based on exploration vs landing state
    let viewKey = 'hero';
    if (isExplore) {
      viewKey = activeCondition || 'explore';
    }
    const view = CONDITION_VIEWS[viewKey] || CONDITION_VIEWS['explore'];
    
    // Add subtle mouse parallax on top of the target destination
    const targetX = view.pos[0] + mouse.current.x * 0.12;
    const targetY = view.pos[1] - mouse.current.y * 0.12;
    const targetZ = view.pos[2];

    // Smoothly interpolate position
    posTarget.current.set(targetX, targetY, targetZ);
    camera.position.lerp(posTarget.current, 0.04);

    // Smoothly interpolate lookAt target
    lookAtTarget.current.lerp(new THREE.Vector3(...view.target), 0.04);
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}

/* ——— Full Scene ——— */
function HumanBodyScene({ activeCondition, onHotspotClick, gender, isExplore }) {
  const bodyColor = '#c0d0ff';
  const groupRef = useRef();

  // Gentle idle rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} color="#e0e8ff" />
      <directionalLight position={[5, 8, 5]} intensity={1} color="#e8eeff" castShadow />
      <directionalLight position={[-4, 4, 3]} intensity={0.5} color="#d0d8ff" />
      <pointLight position={[0, 2, 4]} intensity={0.6} color="#8ba4f7" distance={10} />
      <pointLight position={[2, -1, 3]} intensity={0.3} color="#c8a4f7" distance={8} />
      <spotLight
        position={[0, 5, 2]}
        angle={0.4}
        penumbra={0.8}
        intensity={0.8}
        color="#b8c8ff"
      />

      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
        <group ref={groupRef} position={[0, -0.5, 0]}>
          <Head color={bodyColor} fade={!!activeCondition} />
          <Torso color={bodyColor} gender={gender} fade={!!activeCondition} />
          <Arm side="left" color={bodyColor} gender={gender} fade={!!activeCondition} />
          <Arm side="right" color={bodyColor} gender={gender} fade={!!activeCondition} />
          <Leg side="left" color={bodyColor} fade={!!activeCondition} />
          <Leg side="right" color={bodyColor} fade={!!activeCondition} />

          <InternalOrgans activeCondition={activeCondition} />
        </group>
      </Float>

      <ContactShadows
        position={[0, -2.4, 0]}
        opacity={0.2}
        scale={6}
        blur={2.5}
        far={4}
        color="#4A6CF7"
      />

      <Particles count={80} />
      <CameraRig activeCondition={activeCondition} isExplore={isExplore} />
      <Environment preset="studio" environmentIntensity={0.8} />
    </>
  );
}

/* ——— Exported Component ——— */
export default function HumanBody3D({ activeCondition, onHotspotClick, style, gender = 'female', isExplore = false }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...style,
      }}
    >
      {/* Radial glow backdrop */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          height: '70%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(74,108,247,0.15) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      {!error ? (
        <Canvas
          camera={{ position: [0, 0.5, 4.2], fov: 38 }}
          onCreated={() => setReady(true)}
          onError={() => setError(true)}
          style={{
            opacity: ready ? 1 : 0,
            transition: 'opacity 1s cubic-bezier(0.4,0,0.2,1)',
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <HumanBodyScene
              activeCondition={activeCondition}
              onHotspotClick={onHotspotClick}
              gender={gender}
              isExplore={isExplore}
            />
          </Suspense>
        </Canvas>
      ) : (
        /* Fallback: animated silhouette if WebGL fails */
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 200,
              height: 380,
              background:
                'linear-gradient(180deg, rgba(74,108,247,0.12) 0%, rgba(139,92,246,0.08) 50%, transparent 100%)',
              borderRadius: '50% 50% 45% 45% / 30% 30% 25% 25%',
              filter: 'blur(2px)',
              animation: 'float 4s ease-in-out infinite, pulse 3s ease-in-out infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
