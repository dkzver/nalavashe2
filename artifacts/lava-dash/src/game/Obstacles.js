import * as THREE from 'three';
import { LANE_X } from './Player.js';

const OBSTACLE_TYPES = ['cone', 'barrier', 'car', 'bin'];

function standard(color, roughness = 0.76) {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
}

function addMesh(group, geometry, color, x, y, z, options = {}) {
  const mesh = new THREE.Mesh(geometry, options.material || standard(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function buildCone() {
  const root = new THREE.Group();
  addMesh(root, new THREE.CylinderGeometry(0.37, 0.48, 0.13, 8), '#403a50', 0, 0.07, 0);
  addMesh(root, new THREE.ConeGeometry(0.39, 1.12, 8), '#f47a3d', 0, 0.65, 0);
  const stripe = addMesh(root, new THREE.CylinderGeometry(0.265, 0.34, 0.18, 8), '#fff0d5', 0, 0.54, 0);
  stripe.position.y = 0.58;
  return root;
}

function buildBarrier() {
  const root = new THREE.Group();
  for (const x of [-0.62, 0.62]) {
    addMesh(root, new THREE.BoxGeometry(0.13, 1.5, 0.15), '#ef624d', x, 0.75, 0);
    addMesh(root, new THREE.BoxGeometry(0.27, 0.1, 0.27), '#393548', x, 0.05, 0);
  }
  const beam = addMesh(root, new THREE.BoxGeometry(1.55, 0.25, 0.27), '#f05a4d', 0, 1.45, 0);
  beam.material = standard('#f05a4d');
  for (let index = -1; index <= 1; index += 1) {
    const stripe = addMesh(root, new THREE.BoxGeometry(0.27, 0.28, 0.29), '#fff0d5', index * 0.48, 1.45, 0);
    stripe.rotation.z = -0.22;
  }
  return root;
}

function buildCar(color) {
  const root = new THREE.Group();
  addMesh(root, new THREE.BoxGeometry(1.72, 0.75, 2.45), color, 0, 0.6, 0);
  addMesh(root, new THREE.BoxGeometry(1.32, 0.6, 1.16), '#a4cce2', 0, 1.22, -0.1);
  addMesh(root, new THREE.BoxGeometry(1.48, 0.13, 0.15), '#ffd166', 0, 0.66, 1.25);
  for (const side of [-1, 1]) {
    for (const z of [-0.78, 0.78]) {
      const wheel = addMesh(root, new THREE.CylinderGeometry(0.24, 0.24, 0.15, 8), '#292636', side * 0.88, 0.28, z);
      wheel.rotation.z = Math.PI / 2;
    }
  }
  return root;
}

function buildBin() {
  const root = new THREE.Group();
  addMesh(root, new THREE.BoxGeometry(1.08, 1.25, 0.96), '#429b78', 0, 0.67, 0);
  addMesh(root, new THREE.BoxGeometry(1.16, 0.12, 1.04), '#32745f', 0, 1.32, 0);
  for (let x = -0.36; x <= 0.36; x += 0.36) {
    addMesh(root, new THREE.BoxGeometry(0.08, 0.79, 0.025), '#68b290', x, 0.7, 0.5);
  }
  return root;
}

export default class Obstacles {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.elapsed = 0;
    this.distance = 0;
    this.spawnTimer = 1.35;
    this.random = Math.random;
  }

  reset() {
    this.items.forEach((item) => this.remove(item));
    this.items = [];
    this.elapsed = 0;
    this.distance = 0;
    this.spawnTimer = 1.15;
  }

  spawn(lane, z, type) {
    const kind = type || OBSTACLE_TYPES[Math.floor(this.random() * OBSTACLE_TYPES.length)];
    const colors = ['#ef5350', '#f5b83d', '#5c91cf', '#ad6b8c'];
    let mesh;
    if (kind === 'cone') mesh = buildCone();
    else if (kind === 'barrier') mesh = buildBarrier();
    else if (kind === 'car') mesh = buildCar(colors[Math.floor(this.random() * colors.length)]);
    else mesh = buildBin();
    mesh.position.set(LANE_X[lane], 0.14, z);
    mesh.traverse((part) => {
      if (part.isMesh) part.castShadow = true;
    });
    this.scene.add(mesh);
    const item = { mesh, lane, type: kind, cleared: false };
    this.items.push(item);
    return item;
  }

  update(delta, speed) {
    this.elapsed += delta;
    this.distance += speed * delta;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      const lane = Math.floor(this.random() * 3);
      const types = OBSTACLE_TYPES;
      const progress = Math.min(1, this.distance / 1350);
      const weighted = this.random();
      const type = weighted < 0.27 ? 'cone'
        : weighted < 0.49 ? 'barrier'
          : weighted < 0.72 ? 'bin'
            : types[2];
      this.spawn(lane, -78 - this.random() * 12, type);
      this.spawnTimer = Math.max(0.95, 1.55 - progress * 0.38) + this.random() * 0.28;
    }

    for (const item of [...this.items]) {
      item.mesh.position.z += speed * delta;
      if (item.mesh.position.z > 8) this.remove(item);
    }
  }

  remove(item) {
    if (!item || !this.items.includes(item)) return;
    item.mesh.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material.dispose();
    });
    item.mesh.removeFromParent();
    this.items = this.items.filter((candidate) => candidate !== item);
  }

  dispose() {
    this.items.forEach((item) => this.remove(item));
  }
}
