/**
 * generate-asset.js
 * DALL-E 3로 게임 에셋 단일 이미지를 생성한다.
 *
 * 사용법:
 *   node tools/generate-asset.js --name warrior --style fantasy
 *   node tools/generate-asset.js --name background --style medieval
 *
 * 옵션:
 *   --name    에셋 이름 (warrior, archer, knight, mage, hero,
 *             castle_ally, castle_enemy, background, coin, button_bg)
 *   --style   테마 (fantasy | medieval | future) — 기본값: fantasy
 *   --prompt  직접 프롬프트 입력 (선택, 입력 시 내장 프롬프트 무시)
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 최상위 폴더의 .env 참조
config({ path: path.resolve(__dirname, '../../.env') });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─────────────────────────────────────────────
// 에셋별 내장 프롬프트 (스타일 키워드는 런타임에 삽입)
// ─────────────────────────────────────────────
const PROMPTS = {
  warrior: (style) =>
    `A ${style} cartoon warrior soldier character sprite for a 2D tower defense mobile game. ` +
    `Front-facing, full body, bold cartoon art style, thick outlines, vibrant colors. ` +
    `Transparent background, isolated character, game-ready sprite.`,

  archer: (style) =>
    `A ${style} cartoon archer character sprite for a 2D tower defense mobile game. ` +
    `Holding a bow, front-facing, full body, bold cartoon art style, thick outlines. ` +
    `Transparent background, isolated character, game-ready sprite.`,

  knight: (style) =>
    `A ${style} cartoon heavily armored knight character sprite for a 2D tower defense mobile game. ` +
    `Full plate armor, shield and sword, front-facing, bold cartoon art style, thick outlines. ` +
    `Transparent background, isolated character, game-ready sprite.`,

  mage: (style) =>
    `A ${style} cartoon wizard mage character sprite for a 2D tower defense mobile game. ` +
    `Holding a magic staff with glowing orb, front-facing, bold cartoon art style, thick outlines. ` +
    `Transparent background, isolated character, game-ready sprite.`,

  hero: (style) =>
    `A ${style} cartoon legendary hero champion character sprite for a 2D tower defense mobile game. ` +
    `Powerful and imposing, glowing aura, front-facing, bold cartoon art style, thick outlines, gold trim. ` +
    `Transparent background, isolated character, game-ready sprite.`,

  castle_ally: (style) =>
    `A ${style} cartoon allied castle tower for a 2D tower defense mobile game. ` +
    `Blue and gold color scheme, side view, bold cartoon art style, thick outlines. ` +
    `Transparent background, isolated building, game-ready sprite.`,

  castle_enemy: (style) =>
    `A ${style} cartoon enemy fortress castle for a 2D tower defense mobile game. ` +
    `Red and dark color scheme, menacing, side view, bold cartoon art style, thick outlines. ` +
    `Transparent background, isolated building, game-ready sprite.`,

  background: (style) =>
    `A ${style} cartoon 2D side-scrolling battlefield background for a tower defense mobile game. ` +
    `Wide landscape, grassy ground, dramatic sky, bold cartoon art style. ` +
    `No characters, suitable for a game background, vibrant colors.`,

  coin: (style) =>
    `A ${style} cartoon gold coin icon for a 2D mobile game UI. ` +
    `Shiny, simple, bold cartoon art style, thick outlines. ` +
    `Transparent background, isolated icon, game-ready UI element.`,

  button_bg: (style) =>
    `A ${style} cartoon button background panel for a 2D mobile game UI. ` +
    `Rectangular, ornate border, bold cartoon art style. ` +
    `Suitable for a unit summon button, no text, vibrant colors.`,
};

// 에셋별 저장 경로
const SAVE_PATHS = {
  warrior:      'assets/images/units/warrior.png',
  archer:       'assets/images/units/archer.png',
  knight:       'assets/images/units/knight.png',
  mage:         'assets/images/units/mage.png',
  hero:         'assets/images/units/hero.png',
  castle_ally:  'assets/images/castle_ally.png',
  castle_enemy: 'assets/images/castle_enemy.png',
  background:   'assets/images/background.png',
  coin:         'assets/images/ui/coin.png',
  button_bg:    'assets/images/ui/button_bg.png',
};

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { name: null, style: 'fantasy', prompt: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name')   result.name   = args[++i];
    if (args[i] === '--style')  result.style  = args[++i];
    if (args[i] === '--prompt') result.prompt = args[++i];
  }
  return result;
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const dest = path.resolve(__dirname, '..', destPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// ─────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────
async function main() {
  const { name, style, prompt: customPrompt } = parseArgs();

  if (!name) {
    console.error('사용법: node tools/generate-asset.js --name <에셋명> --style <테마>');
    console.error('에셋명:', Object.keys(PROMPTS).join(', '));
    process.exit(1);
  }

  if (!PROMPTS[name] && !customPrompt) {
    console.error(`알 수 없는 에셋명: "${name}"`);
    console.error('사용 가능:', Object.keys(PROMPTS).join(', '));
    process.exit(1);
  }

  const prompt = customPrompt || PROMPTS[name](style);
  const savePath = SAVE_PATHS[name] || `assets/images/${name}.png`;

  console.log(`\n🎨 생성 중: ${name} (스타일: ${style})`);
  console.log(`📝 프롬프트: ${prompt}\n`);

  try {
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    const imageUrl = response.data[0].url;
    const dest = await downloadImage(imageUrl, savePath);

    console.log(`✅ 저장 완료: ${dest}`);
    console.log(`   수정 제안: ${response.data[0].revised_prompt ?? '없음'}\n`);
  } catch (err) {
    console.error('❌ 생성 실패:', err.message);
    process.exit(1);
  }
}

main();
