/**
 * generate-all.js
 * 게임에 필요한 모든 에셋을 DALL-E 3로 일괄 생성한다.
 *
 * 사용법:
 *   node tools/generate-all.js --style fantasy
 *   node tools/generate-all.js --style medieval
 *   node tools/generate-all.js --style future
 *
 * API 요금 주의: 에셋 1개당 약 $0.04 (standard 1024x1024)
 * 전체 10개 생성 시 약 $0.40 소요
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ASSETS = [
  'background',
  'castle_ally',
  'castle_enemy',
  'warrior',
  'archer',
  'knight',
  'mage',
  'hero',
  'coin',
  'button_bg',
];

function parseArgs() {
  const args = process.argv.slice(2);
  let style = 'fantasy';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--style') style = args[++i];
  }
  return { style };
}

async function main() {
  const { style } = parseArgs();

  console.log(`\n🚀 전체 에셋 생성 시작 (스타일: ${style})`);
  console.log(`📦 총 ${ASSETS.length}개 에셋 생성 예정`);
  console.log(`💰 예상 비용: 약 $${(ASSETS.length * 0.04).toFixed(2)}\n`);
  console.log('계속하려면 Enter, 취소하려면 Ctrl+C...');

  // 3초 대기 (취소 기회 제공)
  await new Promise((r) => setTimeout(r, 3000));

  let success = 0;
  let fail = 0;

  for (const name of ASSETS) {
    try {
      console.log(`\n[${success + fail + 1}/${ASSETS.length}] ${name} 생성 중...`);
      execSync(
        `node "${path.join(__dirname, 'generate-asset.js')}" --name ${name} --style ${style}`,
        { stdio: 'inherit' }
      );
      success++;
      // API 레이트 리밋 방지 (1초 대기)
      await new Promise((r) => setTimeout(r, 1000));
    } catch {
      console.error(`❌ ${name} 생성 실패, 다음 에셋으로 진행합니다.`);
      fail++;
    }
  }

  console.log(`\n✅ 완료: ${success}개 성공 / ${fail}개 실패`);
}

main();
