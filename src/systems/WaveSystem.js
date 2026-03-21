// WaveSystem.js — 적 소환 타이머 관리
// BattleScene에서 new WaveSystem(scene, stageData, onSpawn)으로 생성

class WaveSystem {
  constructor(scene, stageData, onSpawn) {
    this.scene = scene;
    this.stageData = stageData;
    this.onSpawn = onSpawn;  // callback(unitId) — BattleScene이 실제 생성
    this._timer = null;
    this._active = false;
  }

  start() {
    if (this._active) return;
    this._active = true;

    // Phaser의 time.addEvent로 반복 소환
    this._timer = this.scene.time.addEvent({
      delay: this.stageData.spawnInterval,
      callback: this._spawnNext,
      callbackScope: this,
      loop: true,
    });
  }

  stop() {
    this._active = false;
    if (this._timer) {
      this._timer.remove(false);
      this._timer = null;
    }
  }

  _spawnNext() {
    if (!this._active) return;
    const pool = this.stageData.enemyUnits;
    // 랜덤으로 하나 선택
    const unitId = pool[Math.floor(Math.random() * pool.length)];
    this.onSpawn(unitId);
  }
}

window.WaveSystem = WaveSystem;
