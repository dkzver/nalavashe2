import * as THREE from 'three';

const CHUNK_LENGTH = 30;
const CHUNK_COUNT = 5;

function mat(color, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
}

function box(parent, width, height, depth, color, x, y, z, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    options.material || mat(color),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = Boolean(options.castShadow);
  mesh.receiveShadow = Boolean(options.receiveShadow);
  parent.add(mesh);
  return mesh;
}

function signTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ef2939';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.font = '900 72px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('НА LAVA’ШЕ', 256, 82);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default class World {
  constructor(scene) {
    this.scene = scene;
    this.chunks = [];
    this.sharedSign = new THREE.MeshBasicMaterial({ map: signTexture() });
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      mat('#9a94c8'),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.12;
    this.ground.receiveShadow = true;
    scene.add(this.ground);

    this.road = new THREE.Mesh(
      new THREE.PlaneGeometry(10.4, 240),
      mat('#514d63', 0.95),
    );
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.set(0, 0, -35);
    this.road.receiveShadow = true;
    scene.add(this.road);

    for (let index = 0; index < CHUNK_COUNT; index += 1) {
      const chunk = new THREE.Group();
      chunk.position.z = -index * CHUNK_LENGTH;
      scene.add(chunk);
      this.buildChunk(chunk, index);
      this.chunks.push(chunk);
    }

    const horizon = new THREE.Mesh(
      new THREE.PlaneGeometry(280, 60),
      mat('#8f8ac1'),
    );
    horizon.position.set(0, 18, -98);
    scene.add(horizon);
  }

  buildChunk(chunk, index) {
    box(chunk, 10.4, 0.14, CHUNK_LENGTH, '#514d63', 0, 0.02, -CHUNK_LENGTH / 2, { receiveShadow: true });
    box(chunk, 1.05, 0.2, CHUNK_LENGTH, '#ded3c8', -5.7, 0.12, -CHUNK_LENGTH / 2);
    box(chunk, 1.05, 0.2, CHUNK_LENGTH, '#ded3c8', 5.7, 0.12, -CHUNK_LENGTH / 2);

    // Three clear running lanes, with short road dashes recycled with each chunk.
    for (const x of [-1.72, 1.72]) {
      for (let dash = 0; dash < 4; dash += 1) {
        box(chunk, 0.085, 0.025, 2.4, '#f8e7bf', x, 0.104, -2 - dash * 7.2);
      }
    }

    for (const side of [-1, 1]) {
      const x = side * 11.3;
      const height = 7.5 + ((index * 7 + (side > 0 ? 3 : 1)) % 5) * 1.35;
      const colors = side < 0
        ? ['#b7afe6', '#cbb4d8', '#9e99d0', '#e4b1a9']
        : ['#b6a7d2', '#9eacd6', '#d3a9b3', '#aaa1d6'];
      const facade = colors[(index + (side > 0 ? 1 : 0)) % colors.length];
      box(chunk, 8.8, height, 13.5, facade, x, height / 2 - 0.1, -10.7, { castShadow: true });
      box(chunk, 9.1, 0.5, 13.9, '#746d9d', x, height + 0.08, -10.7);

      const windowMat = mat(index % 2 ? '#ffe2ac' : '#d7e9ff', 0.35);
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          box(
            chunk,
            1.05,
            1.35,
            0.08,
            '#fff2d4',
            x - 2.65 + col * 2.65,
            1.7 + row * 2.15,
            -3.92,
          );
          box(
            chunk,
            0.82,
            1.05,
            0.05,
            '#b6ddf0',
            x - 2.65 + col * 2.65,
            1.7 + row * 2.15,
            -3.99,
            { material: windowMat },
          );
        }
      }

      const shopSign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.45), this.sharedSign);
      shopSign.position.set(x - side * 4.38, 4.1, -4.5);
      shopSign.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      chunk.add(shopSign);

      const postX = side * 6.4;
      const lamp = new THREE.Group();
      lamp.position.set(postX, 0, -17.8);
      chunk.add(lamp);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.12, 5.7, 7), mat('#4c4760'));
      pole.position.y = 2.85;
      pole.castShadow = true;
      lamp.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 0.12), mat('#4c4760'));
      arm.position.set(-side * 0.38, 5.6, 0);
      lamp.add(arm);
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat('#ffe39b', 0.35));
      light.position.set(-side * 0.76, 5.48, 0);
      lamp.add(light);

      const tree = new THREE.Group();
      tree.position.set(side * 7.4, 0, -8);
      chunk.add(tree);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.5, 7), mat('#845536'));
      trunk.position.y = 0.85;
      tree.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 0), mat(index % 2 ? '#83bb73' : '#6dad7b'));
      crown.position.y = 1.9;
      crown.scale.set(1.15, 1.2, 0.9);
      crown.castShadow = true;
      tree.add(crown);
    }
  }

  update(delta, speed) {
    for (const chunk of this.chunks) {
      chunk.position.z += speed * delta;
      if (chunk.position.z >= CHUNK_LENGTH) {
        chunk.position.z -= CHUNK_LENGTH * CHUNK_COUNT;
      }
    }
  }

  dispose() {
    this.sharedSign.map?.dispose();
    this.sharedSign.dispose();
    this.ground.removeFromParent();
    this.road.removeFromParent();
  }
}
