// Projectile.js — 직선 이동 투사체
// 타겟에 도달하면 데미지 적용 후 자기 파괴

class Projectile {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x 발사 위치 x
   * @param {number} y 발사 위치 y
   * @param {Unit} target 타겟 유닛
   * @param {number} damage
   * @param {number} speed px/s
   */
  constructor(scene, x, y, target, damage, speed) {
    this.scene = scene;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.alive = true;

    const cfg = window.GameConfig;

    // 화살: 작은 노란색 사각형 (6×3)
    this._gfx = scene.add.graphics();
    this._gfx.fillStyle(cfg.COLOR.PROJECTILE);
    this._gfx.fillRect(-3, -1.5, 6, 3);
    this._gfx.x = x;
    this._gfx.y = y;

    this._x = x;
    this._y = y;
  }

  update(delta) {
    if (!this.alive) return;

    // 타겟이 죽었으면 투사체 제거
    if (!this.target || !this.target.alive) {
      this._destroy();
      return;
    }

    const tx = this.target.x;
    const ty = this.target.y;
    const dx = tx - this._x;
    const dy = ty - this._y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.speed * (delta / 1000);

    if (dist <= step) {
      // 도착 — 데미지 적용
      this.target.takeDamage(this.damage);
      this._destroy();
    } else {
      // 이동
      this._x += (dx / dist) * step;
      this._y += (dy / dist) * step;
      this._gfx.x = this._x;
      this._gfx.y = this._y;
    }
  }

  _destroy() {
    this.alive = false;
    this._gfx.destroy();
  }
}

window.Projectile = Projectile;
