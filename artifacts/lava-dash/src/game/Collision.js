const HIT_DISTANCE = 1.15;

export default class Collision {
  static check(player, obstacles, collectibles) {
    const hitZ = player.root.position.z;
    const pickups = [];
    for (const obstacle of obstacles.items) {
      if (Math.abs(obstacle.mesh.position.z - hitZ) > HIT_DISTANCE) continue;
      if (Math.abs(obstacle.mesh.position.x - player.root.position.x) > 0.78) continue;
      if (obstacle.type === 'barrier') {
        if (!player.isSliding) return { obstacle, pickups };
      } else if (obstacle.type === 'car') {
        return { obstacle, pickups };
      } else if (!player.isJumping) {
        return { obstacle, pickups };
      }
    }
    for (const item of collectibles.items) {
      if (Math.abs(item.mesh.position.z - hitZ) <= HIT_DISTANCE
        && Math.abs(item.mesh.position.x - player.root.position.x) <= 0.9) {
        pickups.push(item);
      }
    }
    return { obstacle: null, pickups };
  }
}
