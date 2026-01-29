#!/usr/bin/env node
/**
 * 为每张卡牌生成炉石风格的插画提示词，用于 DALL·E / Midjourney / Stable Diffusion 等批量出图。
 * 用法：node scripts/generate-card-art-prompts.js
 * 输出：scripts/card-art-prompts.json 和 public/images/cards/ 目录下的说明。
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const cardsPath = join(root, 'src/data/cards.json');
const outJsonPath = join(root, 'scripts/card-art-prompts.json');
const cardsDir = join(root, 'public/images/cards');

function buildPrompt(card) {
  const name = card.name;
  const type = card.type; // unit | spell | weapon
  const desc = card.description || '';
  const rarity = card.rarity;

  const styleSuffix = 'Epic fantasy card game illustration, Hearthstone-style art, dramatic lighting, detailed design, vertical card art format, no text, high quality digital painting';

  if (type === 'unit') {
    return `A fantasy card game illustration for "${name}" (${desc}). Single character or creature, clear focal point, ${styleSuffix}`;
  }
  if (type === 'spell') {
    return `A fantasy card game illustration for spell "${name}" (${desc}). Magical effect or symbolic scene, ${styleSuffix}`;
  }
  if (type === 'weapon') {
    return `A fantasy card game illustration for weapon "${name}" (${desc}). Weapon or item focus, ${styleSuffix}`;
  }
  return `Fantasy card game illustration: ${name}. ${styleSuffix}`;
}

function main() {
  const raw = readFileSync(cardsPath, 'utf8');
  const { cards } = JSON.parse(raw);
  const prompts = cards.map((card) => ({
    id: card.id,
    name: card.name,
    type: card.type,
    prompt: buildPrompt(card),
  }));

  mkdirSync(cardsDir, { recursive: true });
  writeFileSync(outJsonPath, JSON.stringify(prompts, null, 2), 'utf8');

  const readme = `# 卡牌插画

将生成的图片命名为 \`{卡牌ID}.png\`（例如 \`C001.png\`、\`W001.png\`）并放在此目录下，游戏内会优先显示插画，无图时显示图标。

批量出图提示词见项目根目录下 \`scripts/card-art-prompts.json\`，每项包含 \`id\`、\`name\`、\`prompt\`，可用脚本或 DALL·E/Midjourney/SD 等按 prompt 批量生成后重命名为 id.png 放入此目录。
`;
  writeFileSync(join(cardsDir, 'README.md'), readme, 'utf8');

  console.log(`Generated ${prompts.length} prompts -> ${outJsonPath}`);
  console.log(`Cards directory: ${cardsDir}`);
}

main();
