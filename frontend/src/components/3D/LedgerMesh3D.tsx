import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  Building2,
  TrendingUp
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface CustomerNodeData {
  id: string;
  name: string;
  segment: string;
  balance: number;
  overdue: number;
  dso: number;
  risk: string;
  position: [number, number, number];
  color: number;
}

const NODES_DATA: CustomerNodeData[] = [
  {
    id: 'CUST-001',
    name: 'Reliance Retail Ventures',
    segment: 'Modern Trade Hypermarkets',
    balance: 480000,
    overdue: 480000,
    dso: 38,
    risk: 'Low Risk',
    position: [2.8, 1.2, 0.8],
    color: 0x0ea5e9, // Sky Blue
  },
  {
    id: 'CUST-002',
    name: 'Avenue Supermarts (DMart)',
    segment: 'Organized Supermarkets',
    balance: 265000,
    overdue: 0,
    dso: 24,
    risk: 'Low Risk',
    position: [-2.5, 1.8, -0.6],
    color: 0x10b981, // Emerald Green
  },
  {
    id: 'CUST-003',
    name: 'Metro Cash & Carry Hub',
    segment: 'B2B Wholesale Club',
    balance: 310000,
    overdue: 310000,
    dso: 42,
    risk: 'Medium Risk',
    position: [1.9, -1.9, 1.4],
    color: 0xf59e0b, // Amber
  },
  {
    id: 'CUST-004',
    name: 'Apollo Pharmacy Network',
    segment: 'Retail Pharmacy Network',
    balance: 195000,
    overdue: 60000,
    dso: 29,
    risk: 'Low Risk',
    position: [-2.1, -1.5, 1.6],
    color: 0x06b6d4, // Cyan
  },
  {
    id: 'CUST-005',
    name: 'Balaji Super Stockists',
    segment: 'Regional APMC Wholesale',
    balance: 215000,
    overdue: 120000,
    dso: 48,
    risk: 'Medium Risk',
    position: [0.2, 2.7, -1.8],
    color: 0x8b5cf6, // Violet
  },
];

export const LedgerMesh3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [activeNode, setActiveNode] = useState<CustomerNodeData | null>(NODES_DATA[0]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 340;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    containerRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x0ea5e9, 2.5);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x14b8a6, 2.0);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x38bdf8, 3, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // 3. Central Vault Core (Apex Ledger Vault)
    const vaultGroup = new THREE.Group();
    scene.add(vaultGroup);

    // Inner Glowing Polyhedron
    const coreGeom = new THREE.IcosahedronGeometry(0.75, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f766e,
      emissive: 0x042f2e,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: false,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    vaultGroup.add(coreMesh);

    // Outer Wireframe Cage
    const cageGeom = new THREE.IcosahedronGeometry(0.95, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const cageMesh = new THREE.Mesh(cageGeom, cageMat);
    vaultGroup.add(cageMesh);

    // Latitudinal Equatorial Ring
    const ringGeom = new THREE.TorusGeometry(1.3, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    vaultGroup.add(ringMesh);

    // 4. Orbital Segment Nodes & Connection Arcs
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    const nodeMeshes: { mesh: THREE.Mesh; data: CustomerNodeData }[] = [];
    const streamParticles: { particle: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; t: number; speed: number }[] = [];

    NODES_DATA.forEach((node) => {
      // Node Sphere
      const nGeom = new THREE.SphereGeometry(0.28, 24, 24);
      const nMat = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.8,
      });
      const nMesh = new THREE.Mesh(nGeom, nMat);
      nMesh.position.set(...node.position);
      nodesGroup.add(nMesh);
      nodeMeshes.push({ mesh: nMesh, data: node });

      // Outer Halo Ring for each node
      const haloGeom = new THREE.RingGeometry(0.35, 0.4, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: node.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const haloMesh = new THREE.Mesh(haloGeom, haloMat);
      haloMesh.position.set(...node.position);
      haloMesh.lookAt(0, 0, 0);
      nodesGroup.add(haloMesh);

      // Connection Curve Arc to Central Vault (0, 0, 0)
      const start = new THREE.Vector3(...node.position);
      const end = new THREE.Vector3(0, 0, 0);
      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.6, (Math.random() - 0.5) * 0.8));

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(40);
      const curveGeom = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.35,
      });
      const curveLine = new THREE.Line(curveGeom, curveMat);
      nodesGroup.add(curveLine);

      // Flowing Cash Remittance Particles along the curve
      const pGeom = new THREE.SphereGeometry(0.06, 12, 12);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pMesh = new THREE.Mesh(pGeom, pMat);
      nodesGroup.add(pMesh);

      streamParticles.push({
        particle: pMesh,
        curve,
        t: Math.random(),
        speed: 0.004 + Math.random() * 0.003,
      });
    });

    // 5. Starfield / Ambient Financial Dust
    const starsGeom = new THREE.BufferGeometry();
    const starCount = 200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 15;
      starPositions[i + 1] = (Math.random() - 0.5) * 15;
      starPositions[i + 2] = (Math.random() - 0.5) * 15;
    }
    starsGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.4,
    });
    const starField = new THREE.Points(starsGeom, starsMat);
    scene.add(starField);

    // 6. Interactive Mouse Orbit & Raycasting
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouseVector.x = mouseX;
      mouseVector.y = mouseY;

      if (isMouseDown) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }

      // Check node hover
      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));
      if (intersects.length > 0) {
        const hit = nodeMeshes.find((n) => n.mesh === intersects[0].object);
        if (hit) {
          setActiveNode(hit.data);
          containerRef.current.style.cursor = 'pointer';
        }
      } else {
        containerRef.current.style.cursor = isMouseDown ? 'grabbing' : 'default';
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const domEl = containerRef.current;
    domEl.addEventListener('mousemove', handleMouseMove);
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate Vault Core
      coreMesh.rotation.y += 0.008;
      coreMesh.rotation.x += 0.004;
      cageMesh.rotation.y -= 0.006;
      ringMesh.rotation.z += 0.003;

      // Pulse Vault scale subtly
      const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.03;
      coreMesh.scale.set(pulse, pulse, pulse);

      // Auto rotation of node constellation
      if (isRotating && !isMouseDown) {
        targetRotationY += 0.002;
      }

      // Smooth damping
      nodesGroup.rotation.y += (targetRotationY - nodesGroup.rotation.y) * 0.05;
      nodesGroup.rotation.x += (targetRotationX - nodesGroup.rotation.x) * 0.05;

      // Animate flowing cash particles
      streamParticles.forEach((sp) => {
        sp.t += sp.speed;
        if (sp.t > 1) sp.t = 0;
        const pt = sp.curve.getPoint(sp.t);
        sp.particle.position.copy(pt);
      });

      // Camera parallax
      if (!isMouseDown) {
        camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.03;
        camera.position.y += (1.5 + mouseY * 0.4 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('mousemove', handleMouseMove);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating]);

  return (
    <div
      className={`relative w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 text-white shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 h-[92vh]' : 'h-80 sm:h-96'
      }`}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Overlay with 3D Depth Title */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded shadow-lg">
          <Layers className="w-4 h-4 text-teal-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-100">
            3D Spatial Receivables Mesh
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-teal-950/80 text-teal-300 border border-teal-800/80 rounded">
            WEBGL LIVE
          </span>
        </div>
      </div>

      {/* Controls Overlay (Top Right) */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 p-1 rounded shadow-lg">
        <button
          type="button"
          onClick={() => setIsRotating(!isRotating)}
          title={isRotating ? 'Pause Orbit' : 'Resume Orbit'}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
        >
          {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-teal-400" />}
        </button>
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand 3D View'}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Holographic 3D Node Telemetry HUD (Bottom Left) */}
      {activeNode && (
        <div className="absolute bottom-3 left-4 z-20 max-w-sm p-3.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-md shadow-2xl space-y-2 pointer-events-auto transition-all">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `#${activeNode.color.toString(16).padStart(6, '0')}` }} />
              <h4 className="text-xs font-bold text-white tracking-tight">{activeNode.name}</h4>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
              {activeNode.risk}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Total Owed</span>
              <span className="font-mono font-bold text-white tabular-nums">{formatINR(activeNode.balance)}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Overdue</span>
              <span className={`font-mono font-bold tabular-nums ${activeNode.overdue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {activeNode.overdue > 0 ? formatINR(activeNode.overdue) : 'Current'}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">DSO Cycle</span>
              <span className="font-mono font-bold text-teal-300">{activeNode.dso} days</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-snug pt-1 border-t border-slate-800/80">
            Node connected to Apex Central Vault via real-time RTGS settlement streams. Drag to rotate 3D camera.
          </p>
        </div>
      )}

      {/* Instructions Overlay (Bottom Right) */}
      <div className="absolute bottom-3 right-4 z-20 hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/70 backdrop-blur-sm px-2 py-1 rounded border border-slate-800 pointer-events-none">
        <Sparkles className="w-3 h-3 text-teal-400" />
        <span>Click &amp; Drag to tilt 3D perspective • Hover nodes for telemetry</span>
      </div>
    </div>
  );
};
