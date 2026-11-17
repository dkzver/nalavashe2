import * as THREE from 'three';
import { LANE_X } from './Player.js';

const ITEM_TYPES = [
  { type: 'shawarma', points: 100, color: '#e6a54b' },
  { type: 'burger', points: 150, color: '#ef6c45' },
  { type: 'fries', points: 100, color: '#f5c341' },
  { type: 'drink', points: 50, color: '#51a6d8' },
  { type: 'bonus', points: 500, color: '#a369ef' },
];

function material(color, roughness = 0.64) {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
}

function piece(group, geometry, color, x, y, z, rotation = 0) {
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotation;
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function model(type) {
  const root = new THREE.Group();
  if (type === 'shawarma') {
    piece(root, new THREE.CylinderGeometry(0.27, 0.34, 0.92, 7), '#efbb62', 0, 0.46, 0, -0.12);
    piece(root, new THREE.ConeGeometry(0.25, 0.32, 7), '#ead198', -0.03, 0.98, 0, Math.PI);
    piece(root, new THREE.BoxGeometry(0.08, 0.05, 0.04), '#4b9d55', 0.05, 0.77, 0.31);
  } else if (type === 'burger') {
    piece(root, new THREE.CylinderGeometry(0.38, 0.38, 0.16, 9), '#e5a044', 0, 0.2, 0);
    piece(root, new THREE.CylinderGeometry(0.35, 0.33, 0.16, 9), '#62a651', 0, 0.37, 0);
    piece(root, new THREE.CylinderGeometry(0.33, 0.33, 0.2, 9), '#8d4b31', 0, 0.55, 0);
    piece(root, new THREE.CylinderGeometry(0.38, 0.34, 0.22, 9), '#f5c05d', 0, 0.75, 0);
    piece(root, new THREE.SphereGeometry(0.02, 5, 4), '#fff3ce', -0.15, 0.9, 0.15);
  } else if (type === 'fries') {
    piece(root, new THREE.CylinderGeometry(0.3, 0.37, 0.62, 6), '#ef584c', 0, 0.36, 0);
    for (let index = -2; index <= 2; index += 1) {
      piece(root, new THREE.BoxGeometry(0.095, 0.52 + (index % 2 ? 0.02 : 0.13), 0.095), '#ffd452', index * 0.115, 0.82, 0.02);
    }
  } else if (type === 'drink') {
    piece(root, new THREE.CylinderGeometry(0.28, 0.34, 0.86, 9), '#57aee4', 0, 0.45, 0);
    piece(root, new THREE.CylinderGeometry(0.29, 0.29, 0.07, 9), '#ecf5ff', 0, 0.9, 0);
    const straw = piece(root, new THREE.CylinderGeometry(0.035, 0.035, 0.38, 6), '#f7e0a1', 0.12, 1.1, 0);
    straw.rotation.z = -0.18;
  } else {
    piece(root, new THREE.IcosahedronGeometry(0.55, 0), '#b06bf2', 0, 0.58, 0);
    piece(root, new THREE.IcosahedronGeometry(0.24, 0), '#fff0a0', 0, 0.58, 0.3);
  }
  return root;
}

export default class Collectibles {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.effects = [];
    this.elapsed = 0;
    this.distance = 0;
    this.spawnTimer = 0.4;
    this.random = Math.random;
  }

  reset() {
    this.items.forEach((item) => this.remove(item));
    this.effects.forEach((effect) => this.removeEffect(effect));
    this.elapsed = 0;
    this.distance = 0;
    this.spawnTimer = 0.35;
  }

  spawn(lane, z, kind) {
    const definition = ITEM_TYPES.find((entry) => entry.type === kind) || ITEM_TYPES[0];
    const mesh = model(definition.type);
    mesh.position.set(LANE_X[lane], 0.22, z);
    this.scene.add(mesh);
    const item = { mesh, lane, type: definition.type, points: definition.points, baseY: 0.22 };
    this.items.push(item);
    return item;
  }

  update(delta, speed) {
    this.elapsed += delta;
    this.distance += speed * delta;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      const lane = Math.floor(this.random() * 3);
      const roll = this.random();
      const type = roll < 0.42 ? 'shawarma'
        : roll < 0.66 ? 'burger'
          : roll < 0.86 ? 'drink'
            : roll < 0.96 ? 'fries' : 'bonus';
      this.spawn(lane, -75 - this.random() * 16, type);
      this.spawnTimer = 0.6 + this.random() * 0.36;
    }

    for (const item of [...this.items]) {
      item.mesh.position.z += speed * delta;
      item.mesh.position.y = item.baseY + 0.16 + Math.sin(this.elapsed * 4 + item.mesh.position.z) * 0.09;
      item.mesh.rotation.y += delta * 2.35;
      item.mesh.rotation.z = Math.sin(this.elapsed * 2 + item.lane) * 0.08;
      if (item.mesh.position.z > 8) this.remove(item);
    }
    for (const effect of [...this.effects]) {
      effect.age += delta;
      effect.meshes.forEach((mesh, index) => {
        mesh.position.addScaledVector(effect.velocities[index], delta);
        mesh.material.opacity = Math.max(0, 1 - effect.age / effect.duration);
        mesh.scale.multiplyScalar(1 - delta * 0.6);
      });
      if (effect.age >= effect.duration) this.removeEffect(effect);
    }
  }

  burst(position, color = '#ffe263') {
    const meshes = [];
    const velocities = [];
    for (let index = 0; index < 9; index += 1) {
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.085, 0),
        new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }),
      );
      mesh.position.copy(position);
      mesh.position.y += 0.45;
      this.scene.add(mesh);
      meshes.push(mesh);
      velocities.push(new THREE.Vector3(
        (this.random() - 0.5) * 5,
        1.1 + this.random() * 2.8,
        (this.random() - 0.5) * 2.4,
      ));
    }
    const effect = { meshes, velocities, age: 0, duration: 0.42 };
    this.effects.push(effect);
    return effect;
  }

  remove(item) {
    if (!item || !this.items.includes(item)) return;
    item.mesh.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      object.material.dispose();
    });
    item.mesh.removeFromParent();
    this.items = this.items.filter((candidate) => candidate !== item);
  }

  removeEffect(effect) {
    if (!effect || !this.effects.includes(effect)) return;
    effect.meshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh.removeFromParent();
    });
    this.effects = this.effects.filter((candidate) => candidate !== effect);
  }

  dispose() {
    this.items.forEach((item) => this.remove(item));
    this.effects.forEach((effect) => this.removeEffect(effect));
  }
}
