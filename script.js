// Three.js scene setup
let scene,
  camera,
  renderer,
  submarine,
  canyonWalls = [];
let obstacles = [];
let seaFloor, skyBox;
let gameOver = false;
let score = 0;
let velocity = { x: 0, y: 0, z: -0.2 };
let keys = {};
let difficulty = 1;
let bubbleParticles = [];

function createWallMaterial(shade) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(shade, shade * 0.6, shade * 0.3),
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
  });
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x001b2e);
  scene.fog = new THREE.FogExp2(0x003322, 0.005);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 15, 30);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.getElementById("game-container").appendChild(renderer.domElement);

  console.log("Initializing scene...");
  createSubmarine();
  createLighting();
  createSeaFloor();
  createSkyBox();
  generateCanyonWalls();
  createBubbles();

  document.addEventListener("keydown", (e) => (keys[e.key] = true));
  document.addEventListener("keyup", (e) => (keys[e.key] = false));
  window.addEventListener("resize", onWindowResize);
  document
    .getElementById("restart-button")
    .addEventListener("click", resetGame);

  resetGame();
  animate();
}

function generateNoiseTexture(width, height, baseColor) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  const r = (baseColor >> 16) & 0xff;
  const g = (baseColor >> 8) & 0xff;
  const b = baseColor & 0xff;

  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 0.3 + 0.7;
    data[i] = r * noise;
    data[i + 1] = g * noise;
    data[i + 2] = b * noise;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

function createSubmarine() {
  const body = new THREE.Group();

  // Main hull - elongated and tapered
  const hullGeometry = new THREE.CylinderGeometry(2, 1.2, 16, 32);
  const hullMaterial = new THREE.MeshPhongMaterial({
    color: 0x3a4245,
    metalness: 0.7,
    roughness: 0.5,
    emissive: 0x111111,
  });
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  hull.rotation.x = Math.PI / 2; // Align with Z-axis (lengthwise)
  hull.castShadow = true;
  hull.receiveShadow = true;
  body.add(hull);

  // Pointed ram/spike at front (negative Z, facing forward)
  const ramGeometry = new THREE.ConeGeometry(1.2, 5, 12);
  const ramMaterial = new THREE.MeshPhongMaterial({
    color: 0x4a5459,
    metalness: 0.8,
    roughness: 0.3,
  });
  const ram = new THREE.Mesh(ramGeometry, ramMaterial);
  ram.position.set(0, 0, -10); // Moved to front (negative Z)
  ram.rotation.x = 30;
  ram.castShadow = true;
  body.add(ram);

  // Rounded end cap for the tail (positive Z, rear)
  const tailCapGeometry = new THREE.SphereGeometry(1.2, 24, 24);
  const tailCap = new THREE.Mesh(tailCapGeometry, hullMaterial);
  tailCap.position.set(0, 0, 7); // Moved to rear
  tailCap.castShadow = true;
  body.add(tailCap);

  // Conning tower/wheelhouse
  const towerGeometry = new THREE.CylinderGeometry(1.5, 1.8, 2.5, 16);
  const towerMaterial = new THREE.MeshPhongMaterial({
    color: 0x4d5d60,
    metalness: 0.6,
    roughness: 0.4,
  });
  const tower = new THREE.Mesh(towerGeometry, towerMaterial);
  tower.position.set(0, 2.5, 0);
  tower.castShadow = true;
  body.add(tower);

  // Tower dome/observation deck
  const towerDomeGeometry = new THREE.SphereGeometry(
    1.4,
    24,
    24,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  const towerDome = new THREE.Mesh(towerDomeGeometry, towerMaterial);
  towerDome.position.set(0, 3.8, 0);
  towerDome.castShadow = true;
  body.add(towerDome);

  // Porthole windows along the hull
  const portholeGeometry = new THREE.RingGeometry(0.3, 0.4, 16);
  const portholeBorderMaterial = new THREE.MeshPhongMaterial({
    color: 0xaa8866,
  });
  const portholeGlassGeometry = new THREE.CircleGeometry(0.3, 16);
  const portholeGlassMaterial = new THREE.MeshPhongMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.7,
    emissive: 0x4488aa,
    emissiveIntensity: 0.5,
  });

  for (let z = -6; z <= 6; z += 3) {
    [-1, 1].forEach((side) => {
      const portholeBorder = new THREE.Mesh(
        portholeGeometry,
        portholeBorderMaterial
      );
      portholeBorder.position.set(side * 2, 1, z);
      portholeBorder.rotation.y = (side * Math.PI) / 2;
      body.add(portholeBorder);

      const portholeGlass = new THREE.Mesh(
        portholeGlassGeometry,
        portholeGlassMaterial
      );
      portholeGlass.position.set(side * 2.01, 1, z);
      portholeGlass.rotation.y = (side * Math.PI) / 2;
      body.add(portholeGlass);
    });
  }

  // Large observation window at the front (negative Z)
  const mainWindowGeometry = new THREE.CircleGeometry(0.8, 24);
  const mainWindowBorderGeometry = new THREE.RingGeometry(0.8, 1, 24);
  const mainWindow = new THREE.Mesh(mainWindowGeometry, portholeGlassMaterial);
  const mainWindowBorder = new THREE.Mesh(
    mainWindowBorderGeometry,
    portholeBorderMaterial
  );
  mainWindow.position.set(0, 0, -6.1); // Adjusted to front
  mainWindowBorder.position.set(0, 0, -6.05);
  body.add(mainWindow);
  body.add(mainWindowBorder);

  // Dorsal fin
  const dorsalFinGeometry = new THREE.BoxGeometry(0.3, 1.2, 6);
  const finMaterial = new THREE.MeshPhongMaterial({ color: 0x3a4245 });
  const dorsalFin = new THREE.Mesh(dorsalFinGeometry, finMaterial);
  dorsalFin.position.set(0, 2, -4);
  dorsalFin.castShadow = true;
  body.add(dorsalFin);

  // Dive planes
  const finGeometry = new THREE.BoxGeometry(4, 0.3, 1.8);
  const leftFin = new THREE.Mesh(finGeometry, finMaterial);
  leftFin.position.set(-2.2, 0, -3);
  leftFin.rotation.y = Math.PI / 8;
  leftFin.castShadow = true;
  body.add(leftFin);

  const rightFin = new THREE.Mesh(finGeometry, finMaterial);
  rightFin.position.set(2.2, 0, -3);
  rightFin.rotation.y = -Math.PI / 8;
  rightFin.castShadow = true;
  body.add(rightFin);

  // Propeller at the back (positive Z, rear)
  const propHub = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 16);
  const propMaterial = new THREE.MeshPhongMaterial({
    color: 0x885522,
    metalness: 0.9,
    roughness: 0.3,
  });
  const propHubMesh = new THREE.Mesh(propHub, propMaterial);
  propHubMesh.position.set(0, 0, 9); // Moved to rear
  propHubMesh.rotation.x = Math.PI / 2;
  body.add(propHubMesh);

  const propBlade = new THREE.BoxGeometry(0.3, 2.5, 0.6);
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(propBlade, propMaterial);
    blade.position.set(0, 0, 9); // Moved to rear
    blade.rotation.x = Math.PI / 2;
    blade.rotation.z = (i * Math.PI * 2) / 3;
    blade.translateY(1.25);
    body.add(blade);
  }

  // Decorative rivets
  const rivetGeometry = new THREE.SphereGeometry(0.1, 2, 2);
  const rivetMaterial = new THREE.MeshPhongMaterial({
    color: 0xaa8866,
    metalness: 0.8,
  });
  for (let z = -7; z <= 7; z += 1.5) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const radius = 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const rivet = new THREE.Mesh(rivetGeometry, rivetMaterial);
      rivet.position.set(x, y, z);
      rivet.castShadow = true;
      body.add(rivet);
    }
  }

  // Submarine ambient light
  const submarineLight = new THREE.PointLight(0x88ccff, 3.5, 8);
  submarineLight.position.set(0, 0, 0);
  body.add(submarineLight);

  submarine = body;
  submarine.position.set(0, 10, 0);
  submarine.castShadow = true;
  submarine.receiveShadow = true;
  scene.add(submarine);
  console.log("Nautilus submarine created and added to scene");
}

function createLighting() {
  const ambientLight = new THREE.AmbientLight(0x006644, 3.0); // Brighter green
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xaabbff, 8.2); // Brighter blue-white
  directionalLight.position.set(50, 200, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 10;
  directionalLight.shadow.camera.far = 400;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  scene.add(directionalLight);

  const submarineLight = new THREE.PointLight(0xffff99, 20.0, 100); // Brighter yellow, longer range
  submarineLight.position.set(0, 0, -5); // Adjusted to front
  submarine.add(submarineLight);
  console.log("Lighting added");
}

function createSeaFloor() {
  const floorGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);
  for (let i = 0; i < floorGeometry.attributes.position.count; i++) {
    const x = floorGeometry.attributes.position.getX(i);
    const z = floorGeometry.attributes.position.getZ(i);
    const height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5;
    floorGeometry.attributes.position.setY(i, height - 10);
  }
  floorGeometry.computeVertexNormals();

  const noiseTexture = generateNoiseTexture(256, 256, 0x1a3f4f);
  noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
  noiseTexture.repeat.set(10, 10);

  const floorMaterial = new THREE.MeshBasicMaterial({ map: noiseTexture });
  seaFloor = new THREE.Mesh(floorGeometry, floorMaterial);
  seaFloor.rotation.x = -Math.PI / 2;
  scene.add(seaFloor);
  console.log("Sea floor added");
}

function createSkyBox() {
  const skyGeometry = new THREE.BoxGeometry(400, 200, 400);
  const noiseTexture = generateNoiseTexture(256, 256, 0x004455);
  noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
  noiseTexture.repeat.set(5, 5);

  const skyMaterials = [
    new THREE.MeshBasicMaterial({ color: 0x001b2e, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: 0x001b2e, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ map: noiseTexture, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: 0x000c18, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: 0x001b2e, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ color: 0x001b2e, side: THREE.BackSide }),
  ];

  skyBox = new THREE.Mesh(skyGeometry, skyMaterials);
  skyBox.position.y = 80;
  scene.add(skyBox);
  console.log("Skybox added");
}

function createBubbles() {
  for (let i = 0; i < 100; i++) {
    const bubbleGeometry = new THREE.SphereGeometry(
      0.1 + Math.random() * 0.2,
      8,
      8
    );
    const bubbleMaterial = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.5,
    });
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    resetBubble(bubble, true);
    bubbleParticles.push(bubble);
    scene.add(bubble);
  }
  console.log("Bubbles added");
}

function resetBubble(bubble, initial = false) {
  bubble.position.x = Math.random() * 60 - 30;
  bubble.position.y = Math.random() * 30;
  bubble.position.z = initial
    ? Math.random() * 200 - 100
    : submarine.position.z - 100;
  bubble.userData = {
    speed: 0.05 + Math.random() * 0.1,
    wobble: Math.random() * 0.02,
  };
}

function generateCanyonWalls() {
  for (let z = -200; z <= 200; z += 8) {
    const canyonWidth = 40 + Math.sin(z * 0.01) * 10;

    const leftWallShade = 0.3 + Math.random() * 0.2;
    const leftWallGeometry = new THREE.BoxGeometry(
      10 + Math.random() * 5,
      30 + Math.random() * 40,
      8
    );
    for (let i = 0; i < leftWallGeometry.attributes.position.count; i++) {
      if (leftWallGeometry.attributes.position.getX(i) > 0) {
        leftWallGeometry.attributes.position.setX(
          i,
          leftWallGeometry.attributes.position.getX(i) +
            (Math.random() - 0.5) * 3
        );
      }
    }
    leftWallGeometry.computeVertexNormals();
    const leftWall = new THREE.Mesh(
      leftWallGeometry,
      createWallMaterial(leftWallShade)
    );
    leftWall.position.set(
      -canyonWidth - 5,
      leftWallGeometry.parameters.height / 2,
      z
    );
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    canyonWalls.push(leftWall);

    const rightWallShade = 0.3 + Math.random() * 0.2;
    const rightWallGeometry = new THREE.BoxGeometry(
      10 + Math.random() * 5,
      25 + Math.random() * 45,
      8
    );
    for (let i = 0; i < rightWallGeometry.attributes.position.count; i++) {
      if (rightWallGeometry.attributes.position.getX(i) < 0) {
        rightWallGeometry.attributes.position.setX(
          i,
          rightWallGeometry.attributes.position.getX(i) +
            (Math.random() - 0.5) * 3
        );
      }
    }
    rightWallGeometry.computeVertexNormals();
    const rightWall = new THREE.Mesh(
      rightWallGeometry,
      createWallMaterial(rightWallShade)
    );
    rightWall.position.set(
      canyonWidth + 5,
      rightWallGeometry.parameters.height / 2,
      z
    );
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    canyonWalls.push(rightWall);

    if (Math.random() < 0.1 && z > -50) {
      const rockGeometry = new THREE.DodecahedronGeometry(
        1 + Math.random() * 2,
        0
      );
      const rock = new THREE.Mesh(
        rockGeometry,
        createWallMaterial(0.2 + Math.random() * 0.2)
      );
      rock.position.set(
        Math.random() * (canyonWidth * 1.5) - canyonWidth * 0.75,
        5 + Math.random() * 20,
        z
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      obstacles.push(rock);
    }
  }
  console.log("Canyon walls generated");
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function resetGame() {
  gameOver = false;
  score = 0;
  difficulty = 1;
  velocity = { x: 0, y: 0, z: -0.2 };
  document.getElementById("score").textContent = Math.floor(score);
  document.getElementById("game-over").classList.add("hidden");

  submarine.position.set(0, 10, 0);
  submarine.rotation.set(0, 0, 0);
  submarine.visible = true;
  camera.position.set(0, 15, 30);
  camera.lookAt(submarine.position);

  canyonWalls.forEach((wall) => scene.remove(wall));
  obstacles.forEach((obstacle) => scene.remove(obstacle));
  canyonWalls = [];
  obstacles = [];
  generateCanyonWalls();

  bubbleParticles.forEach((bubble) => resetBubble(bubble, true));

  if (!gameOver) animate();
}

function updateSubmarine() {
  const acceleration = 0.01;
  const maxSpeed = 1;
  const damping = 0.95;

  if (keys["ArrowLeft"] || keys["a"]) velocity.x -= acceleration;
  if (keys["ArrowRight"] || keys["d"]) velocity.x += acceleration;
  if (keys["ArrowUp"] || keys["w"]) velocity.y += acceleration;
  if (keys["ArrowDown"] || keys["s"]) velocity.y -= acceleration;
  if (keys[" "]) velocity.z -= acceleration * 2;

  velocity.x *= damping;
  velocity.y *= damping;
  velocity.z = Math.min(
    velocity.z - 0.0001 * difficulty,
    -0.2 - difficulty * 0.1
  );
  velocity.x = Math.max(Math.min(velocity.x, maxSpeed), -maxSpeed);
  velocity.y = Math.max(Math.min(velocity.y, maxSpeed), -maxSpeed);
  velocity.z = Math.max(Math.min(velocity.z, -0.1), -4);

  submarine.position.x += velocity.x;
  submarine.position.y += velocity.y;
  submarine.position.z += velocity.z;

  submarine.rotation.z = -velocity.x * 0.5;
  submarine.rotation.x = velocity.y * 0.5;

  const bounds = { x: 25, y: { min: 2, max: 30 } };
  submarine.position.x = Math.max(
    -bounds.x,
    Math.min(bounds.x, submarine.position.x)
  );
  submarine.position.y = Math.max(
    bounds.y.min,
    Math.min(bounds.y.max, submarine.position.y)
  );
}

function updateBubbles() {
  bubbleParticles.forEach((bubble) => {
    bubble.position.y += bubble.userData.speed;
    bubble.position.x +=
      Math.sin(bubble.position.y * 0.1) * bubble.userData.wobble;
    if (
      bubble.position.y > 40 ||
      bubble.position.z > submarine.position.z + 100
    ) {
      resetBubble(bubble);
    }
  });
}

function checkCollisions() {
  const subBoundingBox = new THREE.Box3().setFromObject(submarine);
  for (let wall of canyonWalls) {
    if (Math.abs(submarine.position.z - wall.position.z) < 15) {
      const wallBoundingBox = new THREE.Box3().setFromObject(wall);
      if (subBoundingBox.intersectsBox(wallBoundingBox)) {
        endGame();
        return;
      }
    }
  }
  for (let obstacle of obstacles) {
    if (Math.abs(submarine.position.z - obstacle.position.z) < 15) {
      const obstacleBoundingBox = new THREE.Box3().setFromObject(obstacle);
      if (subBoundingBox.intersectsBox(obstacleBoundingBox)) {
        endGame();
        return;
      }
    }
  }
}

function updateEnvironment() {
  skyBox.position.z = submarine.position.z;
  seaFloor.position.z = submarine.position.z;

  if (
    canyonWalls.length > 0 &&
    canyonWalls[canyonWalls.length - 1].position.z > submarine.position.z - 150
  ) {
    const lastZ = canyonWalls[canyonWalls.length - 1].position.z;
    for (let z = lastZ - 8; z >= lastZ - 80; z -= 8) {
      const canyonWidth = 40 + Math.sin(z * 0.01) * 10;

      const leftWallShade = 0.3 + Math.random() * 0.2;
      const leftWallGeometry = new THREE.BoxGeometry(
        10 + Math.random() * 5,
        30 + Math.random() * 40,
        8
      );
      const leftWall = new THREE.Mesh(
        leftWallGeometry,
        createWallMaterial(leftWallShade)
      );
      leftWall.position.set(
        -canyonWidth - 5,
        leftWallGeometry.parameters.height / 2,
        z
      );
      leftWall.castShadow = true;
      leftWall.receiveShadow = true;
      scene.add(leftWall);
      canyonWalls.push(leftWall);

      const rightWallShade = 0.3 + Math.random() * 0.2;
      const rightWallGeometry = new THREE.BoxGeometry(
        10 + Math.random() * 5,
        25 + Math.random() * 45,
        8
      );
      const rightWall = new THREE.Mesh(
        rightWallGeometry,
        createWallMaterial(rightWallShade)
      );
      rightWall.position.set(
        canyonWidth + 5,
        rightWallGeometry.parameters.height / 2,
        z
      );
      rightWall.castShadow = true;
      rightWall.receiveShadow = true;
      scene.add(rightWall);
      canyonWalls.push(rightWall);

      if (Math.random() < 0.1) {
        const rockGeometry = new THREE.DodecahedronGeometry(
          1 + Math.random() * 2,
          0
        );
        const rock = new THREE.Mesh(
          rockGeometry,
          createWallMaterial(0.2 + Math.random() * 0.2)
        );
        rock.position.set(
          Math.random() * (canyonWidth * 1.5) - canyonWidth * 0.75,
          5 + Math.random() * 20,
          z
        );
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
        obstacles.push(rock);
      }
    }
  }

  const cullDistance = 150;
  canyonWalls = canyonWalls.filter((wall) => {
    if (wall.position.z > submarine.position.z + cullDistance) {
      scene.remove(wall);
      return false;
    }
    return true;
  });
  obstacles = obstacles.filter((obstacle) => {
    if (obstacle.position.z > submarine.position.z + cullDistance) {
      scene.remove(obstacle);
      return false;
    }
    return true;
  });
}

function animate() {
  if (!gameOver) {
    requestAnimationFrame(animate);

    updateSubmarine();
    updateBubbles();
    score -= velocity.z * 0.5;
    document.getElementById("score").textContent = Math.floor(score);
    difficulty = 1 + score / 500;
    updateEnvironment();
    checkCollisions();

    const cameraOffset = new THREE.Vector3(0, 15, submarine.position.z + 30);
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(submarine.position);

    renderer.render(scene, camera);
  }
}

function endGame() {
  gameOver = true;
  document.getElementById("final-score").textContent = Math.floor(score);
  document.getElementById("game-over").classList.remove("hidden");
  createExplosion();
}

function createExplosion() {
  const particleCount = 50;
  const explosionGeometry = new THREE.SphereGeometry(0.5, 4, 4);
  const explosionMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8800,
    transparent: true,
    opacity: 0.8,
  });

  for (let i = 0; i < particleCount; i++) {
    const particle = new THREE.Mesh(explosionGeometry, explosionMaterial);
    particle.position.copy(submarine.position);
    const velocity = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).multiplyScalar(0.5);
    particle.userData = { velocity: velocity, lifespan: 60 };
    scene.add(particle);

    const animateExplosion = function () {
      particle.position.add(particle.userData.velocity);
      particle.userData.lifespan--;
      particle.material.opacity = particle.userData.lifespan / 60;
      particle.scale.multiplyScalar(0.98);
      if (particle.userData.lifespan <= 0) {
        scene.remove(particle);
        return;
      }
      requestAnimationFrame(animateExplosion);
    };
    animateExplosion();
  }
  submarine.visible = false;
}

function initGame() {
  if (typeof THREE === "undefined") {
    console.error("Three.js failed to load. Please check the CDN link.");
    return;
  }
  init();
}

window.onload = initGame;
