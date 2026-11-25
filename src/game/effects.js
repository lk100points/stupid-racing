import * as THREE from 'three';

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.geometry = new THREE.SphereGeometry(.12, 6, 5);
    this.materials = [
      new THREE.MeshBasicMaterial({ color: '#f7c77b' }),
      new THREE.MeshBasicMaterial({ color: '#ff734d' }),
      new THREE.MeshBasicMaterial({ color: '#c3e9f1' }),
      new THREE.MeshBasicMaterial({ color: '#a78bfa' })
    ];
  }

  burst(position, count = 12, colorIndex = 0, power = 8) {
    const material = this.materials[colorIndex % this.materials.length];
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.position.copy(position);
      const direction = new THREE.Vector3(Math.random() - .5, Math.random() * .8, Math.random() - .5).normalize();
      const velocity = direction.multiplyScalar(power * (.35 + Math.random() * .85));
      this.scene.add(mesh);
      this.items.push({ mesh, velocity, life: .45 + Math.random() * .8, max: 1.25, rotation: Math.random() * 8 });
    }
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 10 * dt;
      p.mesh.rotation.x += dt * p.rotation; p.mesh.rotation.y += dt * p.rotation * .7;
      p.mesh.scale.setScalar(Math.max(.001, p.life / p.max));
      if (p.life <= 0) { this.scene.remove(p.mesh); this.items.splice(i, 1); }
    }
  }

  clear() {
    for (const p of this.items) this.scene.remove(p.mesh);
    this.items.length = 0;
  }
}
