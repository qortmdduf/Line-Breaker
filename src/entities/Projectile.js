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

// ── ArcProjectile ─────────────────────────────────────────
// 각도 기반 포물선 발사체 (아군 성 화살용)
// 중력의 영향을 받아 날아가며, 경로 상의 적 유닛에 데미지
class ArcProjectile {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x 발사 위치 x (월드 좌표)
   * @param {number} y 발사 위치 y
   * @param {number} angleDeg 발사 각도 (도, 양수=위쪽)
   * @param {number} speed 초속 (px/s)
   * @param {number} gravity 중력 가속도 (px/s²)
   * @param {number} damage
   */
  constructor(scene, x, y, angleDeg, speed, gravity, damage, isFireArrow = false) {
    this.scene = scene;
    this.damage = damage;
    this.isFireArrow = isFireArrow;
    this.alive = true;

    const angleRad = angleDeg * Math.PI / 180;
    this._vx = speed * Math.cos(angleRad);
    this._vy = -speed * Math.sin(angleRad);
    this._gravity = gravity;

    this._x = x;
    this._y = y;

    // 불화살: 주황-빨강, 일반: 노랑
    const color = isFireArrow ? 0xff4400 : 0xffee44;
    this._gfx = scene.add.graphics();
    this._gfx.fillStyle(color);
    this._gfx.fillRect(-5, -2, 10, 4);
    this._gfx.x = x;
    this._gfx.y = y;
    this._gfx.setDepth(5);
  }

  /**
   * @param {number} delta ms
   * @param {Unit[]} enemyUnits 적 유닛 (충돌 체크)
   * @param {Unit[]} allyUnits  아군 유닛 (아군 피해 포함)
   */
  update(delta, enemyUnits, allyUnits) {
    if (!this.alive) return;

    const dt = delta / 1000;
    this._vy += this._gravity * dt;  // 중력 누적
    this._x += this._vx * dt;
    this._y += this._vy * dt;

    this._gfx.x = this._x;
    this._gfx.y = this._y;

    // 화살 방향으로 회전
    this._gfx.setRotation(Math.atan2(this._vy, this._vx));

    const cfg = window.GameConfig;

    // 지면 도달 시 소멸
    if (this._y >= cfg.BATTLE_Y) {
      this._destroy();
      return;
    }

    // 월드 범위 밖
    if (this._x > cfg.WORLD_WIDTH || this._x < 0) {
      this._destroy();
      return;
    }

    // 충돌 체크 — 적군 + 아군 모두 (오사 포함)
    const targets = [...(enemyUnits || []), ...(allyUnits || [])];
    for (const e of targets) {
      if (!e.alive) continue;
      const dx = this._x - e.x;
      const dy = this._y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= e.stats.radius + 6) {
        e.takeDamage(this.damage);
        // 불화살: 화상 DoT 적용 (중첩 없음, 지속시간 갱신)
        if (this.isFireArrow && e.applyBurn) {
          e.applyBurn(Math.max(1, Math.ceil(this.damage * 0.2)), 3000);
        }
        this._destroy();
        return;
      }
    }
  }

  _destroy() {
    this.alive = false;
    this._gfx.destroy();
  }
}

window.ArcProjectile = ArcProjectile;
