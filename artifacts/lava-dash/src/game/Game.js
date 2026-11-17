import * as THREE from 'three';
import AudioManager from './Audio.js';
import Collectibles from './Collectibles.js';
import Collision from './Collision.js';
import Controls from './Controls.js';
import Obstacles from './Obstacles.js';
import Player from './Player.js';
import { loadBestScore, saveBestScore } from './UI.js';
import World from './World.js';

function initialState() {
  return {
    mode: 'loading',
    score: 0,
    distance: 0,
    collected: 0,
    best: loadBestScore(),
  };
}

export default class Game {
  constructor(mount, { onState, onAction, mascotModelUrl } = {}) {
    this.mount = mount;
    this.onState = onState || (() => {});
    this.onAction = onAction || (() => {});
    this.state = initialState();
    this.soundEnabled = true;
    this.lastFrame = 0;
    this.elapsed = 0;
    this.distanceRemainder = 0;
    this.uiUpdateTimer = 0;
    this.disposed = false;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.55));
    this.renderer.setSize(mount.clientWidth || window.innerWidth, mount.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    mount.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#c9c8f3');
    this.scene.fog = new THREE.Fog('#c9c8f3', 58, 128);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    this.camera.position.set(0, 5.5, 10.7);
    this.camera.lookAt(0, 1.4, -6);
    this.scene.add(new THREE.HemisphereLight('#fff6f2', '#665f91', 2.35));
    const sun = new THREE.DirectionalLight('#fff1d4', 3.2);
    sun.position.set(-4, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -8;
    this.scene.add(sun);

    this.world = new World(this.scene);
    this.player = new Player(this.scene);
    if (mascotModelUrl) {
      this.player.replaceWithGltf(mascotModelUrl).catch((error) => {
        console.error('Unable to load the configured LAVA DASH mascot model.', error);
      });
    }
    this.obstacles = new Obstacles(this.scene);
    this.collectibles = new Collectibles(this.scene);
    this.audio = new AudioManager();
    this.controls = new Controls((action) => this.act(action));

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.readyTimer = window.setTimeout(() => {
      if (this.state.mode !== 'loading') return;
      this.state = { ...this.state, mode: 'menu' };
      this.emit();
    }, 420);
    this.visibilityChange = () => {
      if (document.hidden && this.state.mode === 'playing') this.pause();
    };
    document.addEventListener('visibilitychange', this.visibilityChange);
    this.resize();
    this.renderFrame = this.renderFrame.bind(this);
    this.frame = requestAnimationFrame(this.renderFrame);
    this.emit();
  }

  emit() {
    this.onState({ ...this.state });
  }

  resize() {
    if (!this.renderer || !this.camera || this.disposed) return;
    const width = this.mount.clientWidth || window.innerWidth;
    const height = this.mount.clientHeight || window.innerHeight;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  renderFrame(now = performance.now()) {
    if (this.disposed) return;
    const delta = this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 0.05) : 0;
    this.lastFrame = now;
    if (this.state.mode === 'playing' && delta > 0) this.update(delta);
    else this.player.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.renderFrame);
  }

  update(delta) {
    this.elapsed += delta;
    this.uiUpdateTimer += delta;
    const speed = Math.min(23, 12.5 + this.state.distance / 145);
    this.world.update(delta, speed);
    this.player.update(delta);
    this.obstacles.update(delta, speed);
    this.collectibles.update(delta, speed);

    const meters = speed * delta;
    this.distanceRemainder += meters;
    const earnedByDistance = Math.floor(this.distanceRemainder);
    if (earnedByDistance > 0) {
      this.distanceRemainder -= earnedByDistance;
      this.state.distance += meters;
      this.state.score += earnedByDistance;
    } else {
      this.state.distance += meters;
    }
    this.state.best = Math.max(this.state.best, this.state.score);

    const result = Collision.check(this.player, this.obstacles, this.collectibles);
    const collectedAny = result.pickups.length > 0;
    for (const item of result.pickups) {
      this.collectibles.burst(item.mesh.position, item.type === 'bonus' ? '#f9cc52' : '#ff735e');
      this.audio.play('collect');
      this.state.score += item.points;
      this.state.collected += 1;
      this.collectibles.remove(item);
    }

    if (result.obstacle) {
      this.endRun();
      return;
    }
    if (this.uiUpdateTimer >= 0.1 || collectedAny) {
      this.uiUpdateTimer = 0;
      this.emit();
    }
  }

  start() {
    this.obstacles.reset();
    this.collectibles.reset();
    this.player.lane = 1;
    this.player.targetX = 0;
    this.player.root.position.x = 0;
    this.player.root.position.y = 0;
    this.player.isJumping = false;
    this.player.isSliding = false;
    this.player.jumpTimer = 0;
    this.player.slideTimer = 0;
    this.elapsed = 0;
    this.distanceRemainder = 0;
    this.uiUpdateTimer = 0;
    this.lastFrame = performance.now();
    this.state = { ...initialState(), mode: 'playing' };
    this.audio.startMusic();
    this.emit();
  }

  restart() {
    this.start();
  }

  pause() {
    if (this.state.mode !== 'playing') return;
    this.state = { ...this.state, mode: 'paused' };
    this.emit();
  }

  resume() {
    if (this.state.mode !== 'paused') return;
    this.state = { ...this.state, mode: 'playing' };
    this.lastFrame = performance.now();
    this.audio.startMusic();
    this.emit();
  }

  act(action) {
    if (this.state.mode !== 'playing') return;
    this.onAction(action);
    if (action === 'left') this.player.moveLane(-1);
    else if (action === 'right') this.player.moveLane(1);
    else if (action === 'jump' && this.player.jump()) this.audio.play('jump');
    else if (action === 'slide') this.player.slide();
  }

  endRun() {
    this.collectibles.burst(this.player.root.position, '#f14d4d');
    this.audio.play('crash');
    this.state.best = Math.max(this.state.best, this.state.score);
    saveBestScore(this.state.best);
    this.state.mode = 'gameover';
    this.emit();
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    this.audio.setEnabled(enabled);
    if (enabled && this.state.mode === 'playing') this.audio.startMusic();
  }

  playButtonSound() {
    this.audio.play('click');
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    window.clearTimeout(this.readyTimer);
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.visibilityChange);
    this.controls.dispose();
    this.obstacles.dispose();
    this.collectibles.dispose();
    this.player.dispose();
    this.world.dispose();
    this.scene.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
    });
    this.audio.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
