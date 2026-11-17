import * as THREE from 'three';

export const LANE_X = [-2.65, 0, 2.65];

function material(color, roughness = 0.78) {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
}

function capsule(radius, length, color, segments = 7) {
  return new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, length, 3, segments),
    material(color),
  );
}

export default class Player {
  constructor(scene) {
    this.lane = 1;
    this.targetX = LANE_X[this.lane];
    this.jumpTimer = 0;
    this.slideTimer = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.time = 0;
    this.root = new THREE.Group();
    this.root.position.z = 1.2;
    scene.add(this.root);

    this.body = new THREE.Group();
    this.root.add(this.body);

    const bread = material('#e9ae54');
    const toasted = material('#bf7135');
    const dark = material('#241620', 0.38);
    const white = new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: 0.35 });
    const green = material('#54b85c');
    const tomato = material('#ef4a48');
    const cheese = material('#ffd35f');

    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.52, 1.55, 10, 1), bread);
    wrap.position.y = 1.05;
    wrap.castShadow = true;
    this.body.add(wrap);

    const bottomFold = new THREE.Mesh(new THREE.ConeGeometry(0.39, 0.44, 10), bread);
    bottomFold.rotation.x = Math.PI;
    bottomFold.position.y = 0.29;
    bottomFold.castShadow = true;
    this.body.add(bottomFold);

    const topFillings = new THREE.Group();
    topFillings.position.y = 1.76;
    this.body.add(topFillings);
    [
      [-0.18, '#5a9e48', 0.13], [-0.02, '#ed6043', 0.11],
      [0.16, '#75b84d', 0.13], [0.31, '#f3cf68', 0.09],
    ].forEach(([x, color, radius], index) => {
      const bit = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 7, 5),
        color === '#5a9e48' || color === '#75b84d' ? green : color === '#ed6043' ? tomato : cheese,
      );
      bit.scale.set(1.05, 0.58, 0.95);
      bit.position.set(x, index % 2 ? 0.02 : 0, 0);
      bit.castShadow = true;
      topFillings.add(bit);
    });

    // Light toasted creases make the wrap read as folded bread instead of a plain cylinder.
    for (let side = -1; side <= 1; side += 2) {
      const crease = new THREE.Mesh(
        new THREE.TorusGeometry(0.39, 0.035, 5, 10, Math.PI * 0.82),
        toasted,
      );
      crease.rotation.x = Math.PI / 2;
      crease.rotation.z = side * 0.14;
      crease.position.set(side * 0.015, 1.47, 0.05);
      this.body.add(crease);
    }

    this.face = new THREE.Group();
    this.face.position.set(0, 1.28, 0.425);
    this.body.add(this.face);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 9), white);
      eye.scale.set(0.83, 1.05, 0.48);
      eye.position.set(side * 0.18, 0.05, 0.035);
      this.face.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), dark);
      pupil.position.set(side * 0.16 + 0.025, 0.035, 0.12);
      this.face.add(pupil);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), white);
      shine.position.set(side * 0.16 + 0.048, 0.085, 0.187);
      this.face.add(shine);
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), tomato);
      cheek.scale.set(1.25, 0.45, 0.4);
      cheek.position.set(side * 0.34, -0.18, 0.055);
      this.face.add(cheek);
    }

    const smileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.19, -0.2, 0.105),
      new THREE.Vector3(-0.12, -0.28, 0.13),
      new THREE.Vector3(0, -0.31, 0.15),
      new THREE.Vector3(0.12, -0.28, 0.13),
      new THREE.Vector3(0.19, -0.2, 0.105),
    ]);
    this.face.add(new THREE.Mesh(
      new THREE.TubeGeometry(smileCurve, 16, 0.035, 6, false),
      dark,
    ));
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.035), white);
    tooth.position.set(0, -0.255, 0.15);
    this.face.add(tooth);

    this.arms = [];
    this.legs = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * 0.47, 1.04, 0.02);
      const armPart = capsule(0.085, 0.37, '#ed8b63');
      armPart.rotation.z = side * -0.22;
      armPart.position.y = -0.2;
      arm.add(armPart);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), white);
      hand.position.set(side * -0.045, -0.41, 0.04);
      arm.add(hand);
      this.body.add(arm);
      this.arms.push({ group: arm, side });

      const leg = new THREE.Group();
      leg.position.set(side * 0.2, 0.23, 0.02);
      const legPart = capsule(0.12, 0.32, '#59416e');
      legPart.position.y = -0.12;
      leg.add(legPart);
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.17, 9, 6), dark);
      shoe.scale.set(1.25, 0.7, 1.25);
      shoe.position.set(0, -0.31, 0.06);
      leg.add(shoe);
      this.body.add(leg);
      this.legs.push({ group: leg, side });
    }
  }

  moveLane(direction) {
    this.lane = THREE.MathUtils.clamp(this.lane + direction, 0, 2);
    this.targetX = LANE_X[this.lane];
  }

  jump() {
    if (this.isJumping || this.isSliding) return false;
    this.isJumping = true;
    this.jumpTimer = 0;
    return true;
  }

  slide() {
    if (this.isSliding || this.isJumping) return false;
    this.isSliding = true;
    this.slideTimer = 0;
    return true;
  }

  update(delta) {
    this.time += delta;
    const blend = 1 - Math.exp(-16 * delta);
    this.root.position.x += (this.targetX - this.root.position.x) * blend;
    let lift = 0;

    if (this.isJumping) {
      this.jumpTimer += delta;
      const progress = this.jumpTimer / 0.82;
      lift = Math.sin(Math.min(progress, 1) * Math.PI) * 1.78;
      if (progress >= 1) this.isJumping = false;
    }
    if (this.isSliding) {
      this.slideTimer += delta;
      if (this.slideTimer >= 0.72) this.isSliding = false;
    }

    this.root.position.y = lift;
    const run = Math.sin(this.time * 13);
    const targetScaleY = this.isSliding ? 0.5 : 1;
    this.body.scale.y += (targetScaleY - this.body.scale.y) * (1 - Math.exp(-20 * delta));
    this.body.position.y = this.isSliding ? 0.55 : 0;
    this.body.rotation.z = THREE.MathUtils.lerp(this.body.rotation.z, -run * 0.025, 0.12);

    this.legs.forEach(({ group, side }) => {
      group.rotation.x = this.isJumping ? -0.65 : this.isSliding ? 0.15 : run * 0.55 * side;
    });
    this.arms.forEach(({ group, side }) => {
      group.rotation.x = this.isJumping ? side * -0.5 : this.isSliding ? 0.65 : -run * 0.48 * side;
      group.rotation.z = side * (this.isJumping ? 0.35 : 0.05);
    });
    this.face.rotation.z = -run * 0.025;
  }

  async replaceWithGltf(url) {
    if (!url) throw new Error('A GLB/GLTF model URL is required');
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const gltf = await new Promise((resolve, reject) => {
      new GLTFLoader().load(url, resolve, undefined, reject);
    });
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 1.72 / Math.max(size.y, 0.001);
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);

    for (const child of [...this.body.children]) {
      child.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        for (const item of Array.isArray(object.material) ? object.material : [object.material]) item.dispose();
      });
      child.removeFromParent();
    }
    this.body.add(model);
    this.gltfModel = model;
    return model;
  }

  dispose() {
    this.root.removeFromParent();
  }
}
