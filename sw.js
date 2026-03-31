const CACHE = 'linebreaker-v3';

const STATIC = [
  '/Line-Breaker/',
  '/Line-Breaker/index.html',
  '/Line-Breaker/manifest.json',
  '/Line-Breaker/icons/icon.svg',
  '/Line-Breaker/src/config.js',
  '/Line-Breaker/src/data/units.js',
  '/Line-Breaker/src/data/stages.js',
  '/Line-Breaker/src/data/upgrades.js',
  '/Line-Breaker/src/systems/SaveSystem.js',
  '/Line-Breaker/src/systems/CurrencySystem.js',
  '/Line-Breaker/src/systems/CostSystem.js',
  '/Line-Breaker/src/systems/WaveSystem.js',
  '/Line-Breaker/src/entities/Unit.js',
  '/Line-Breaker/src/entities/AllyUnit.js',
  '/Line-Breaker/src/entities/Paladin.js',
  '/Line-Breaker/src/entities/EnemyUnit.js',
  '/Line-Breaker/src/entities/Hero.js',
  '/Line-Breaker/src/entities/Castle.js',
  '/Line-Breaker/src/entities/Projectile.js',
  '/Line-Breaker/src/ui/BattleHUD.js',
  '/Line-Breaker/src/ui/LobbyUI.js',
  '/Line-Breaker/src/ui/UpgradeUI.js',
  '/Line-Breaker/src/scenes/BootScene.js',
  '/Line-Breaker/src/scenes/MainMenuScene.js',
  '/Line-Breaker/src/scenes/LobbyScene.js',
  '/Line-Breaker/src/scenes/BattleScene.js',
  '/Line-Breaker/src/scenes/UpgradeScene.js',
  '/Line-Breaker/src/scenes/ResultScene.js',
  '/Line-Breaker/src/main.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // CDN 등 외부 리소스는 네트워크 우선, 실패 시 캐시
  if (!e.request.url.includes('qortmdduf.github.io')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // 게임 파일은 캐시 우선 (오프라인 지원)
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
