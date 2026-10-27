import * as THREE from 'three';

// ----------------------------------------------------------------------
// Motor de Renderização Three.js — Cena Gamer Futurista de Inicialização
// ----------------------------------------------------------------------

export interface SceneHandle {
  dispose: () => void;
  resize: () => void;
}

export function createGamerIntroScene(
  container: HTMLElement,
  options: {
    durationMs: number;
    onProgress?: (progress: number) => void;
    onFinished?: () => void;
  }
): SceneHandle {
  const { durationMs, onProgress, onFinished } = options;

  let animationFrameId: number | null = null;
  let isDisposed = false;
  let hasTriggeredFinish = false;

  // 1. Configuração do Cenário e Câmera
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0f19, 0.02);

  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  camera.position.set(0, 0, 32);

  // 2. WebGL Renderer Otimizado (sem consumo excessivo de energia em laptops/desktops)
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0b0f19, 1);
  container.appendChild(renderer.domElement);

  // 3. Campo de Partículas Estelares e Neon (1200 pontos de poeira cósmica)
  const particleCount = 1200;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);

  const brandColors = [
    new THREE.Color(0x00b8d9), // Ciano DevOS
    new THREE.Color(0x0c68e9), // Azul Royal
    new THREE.Color(0x7928ca), // Roxo Cyberpunk
    new THREE.Color(0x22c55e), // Verde Operador
  ];

  for (let i = 0; i < particleCount; i += 1) {
    const radius = 6 + Math.random() * 24;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);

    const chosenColor = brandColors[Math.floor(Math.random() * brandColors.length)];
    particleColors[i * 3] = chosenColor.r;
    particleColors[i * 3 + 1] = chosenColor.g;
    particleColors[i * 3 + 2] = chosenColor.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.22,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  // 4. Núcleo Holográfico DevOS (Icosaedro aramado + Octaedro cristalino interno)
  const coreGroup = new THREE.Group();

  // 4.1 Aramado Externo
  const outerGeo = new THREE.IcosahedronGeometry(4.2, 1);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0x00d2ff,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
  });
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  coreGroup.add(outerMesh);

  // 4.2 Cristal Central
  const innerGeo = new THREE.OctahedronGeometry(2.3, 0);
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x0c68e9,
    roughness: 0.15,
    metalness: 0.85,
    emissive: 0x0033aa,
    emissiveIntensity: 0.6,
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  coreGroup.add(innerMesh);

  // 4.3 Anéis Orbitais de Conexão Criptográfica
  const ringGeo1 = new THREE.TorusGeometry(6.5, 0.04, 16, 100);
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: 0x00b8d9,
    transparent: true,
    opacity: 0.5,
  });
  const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
  ringMesh1.rotation.x = Math.PI / 3;
  coreGroup.add(ringMesh1);

  const ringGeo2 = new THREE.TorusGeometry(7.8, 0.03, 16, 100);
  const ringMat2 = new THREE.MeshBasicMaterial({
    color: 0x7928ca,
    transparent: true,
    opacity: 0.45,
  });
  const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
  ringMesh2.rotation.y = Math.PI / 4;
  coreGroup.add(ringMesh2);

  scene.add(coreGroup);

  // 5. Iluminação Dinâmica
  const ambientLight = new THREE.AmbientLight(0x0f172a, 2.5);
  scene.add(ambientLight);

  const cyanLight = new THREE.PointLight(0x00b8d9, 3.5, 60);
  cyanLight.position.set(12, 10, 15);
  scene.add(cyanLight);

  const violetLight = new THREE.PointLight(0x7928ca, 3.0, 60);
  violetLight.position.set(-12, -10, 15);
  scene.add(violetLight);

  // 6. Loop de Renderização e Animação Temporal
  const startTime = performance.now();

  function animate(currentTime: number) {
    if (isDisposed) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / durationMs, 1.0);

    onProgress?.(progress);

    // Efeito cinematográfico de aproximação suave da câmera (Z: 32 -> 11)
    const targetZ = 32 - 21 * Math.sin((progress * Math.PI) / 2);
    camera.position.z = targetZ;

    // Rotação dinâmica dos elementos da cena
    particleSystem.rotation.y = elapsed * 0.00025;
    particleSystem.rotation.x = elapsed * 0.0001;

    coreGroup.rotation.y = elapsed * 0.0012;
    coreGroup.rotation.x = elapsed * 0.0006;
    outerMesh.rotation.z = -elapsed * 0.0008;

    ringMesh1.rotation.z = elapsed * 0.0015;
    ringMesh2.rotation.x = -elapsed * 0.0012;

    // Pulso do cristal interno
    const pulse = 1 + Math.sin(elapsed * 0.005) * 0.06;
    innerMesh.scale.set(pulse, pulse, pulse);

    renderer.render(scene, camera);

    if (progress >= 1.0 && !hasTriggeredFinish) {
      hasTriggeredFinish = true;
      onFinished?.();
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  animationFrameId = requestAnimationFrame(animate);

  // 7. Redimensionamento Responsivo
  function handleResize() {
    if (isDisposed) return;
    const newWidth = container.clientWidth || window.innerWidth;
    const newHeight = container.clientHeight || window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(newWidth, newHeight);
  }

  window.addEventListener('resize', handleResize);

  // 8. Descarte Seguro de Recursos Gráficos da GPU (Prevenção de Leaks de Memória)
  return {
    resize: handleResize,
    dispose: () => {
      isDisposed = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      window.removeEventListener('resize', handleResize);

      // Descarte de Geometrias e Materiais
      particleGeometry.dispose();
      particleMaterial.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
