import type { CardData } from '../models/types';

export const CARDS: CardData[] = [
  // ==================== 中立随从 ====================
  {
    id: 'C001', name: '村夫', cost: 1, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '普通的农家汉子。', art: '👨‍🌾',
    attack: 1, health: 2, keywords: [],
  },
  {
    id: 'C002', name: '铁卫', cost: 2, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '【嘲讽】', art: '🛡️',
    attack: 1, health: 4, keywords: ['taunt'],
  },
  {
    id: 'C003', name: '悍匪', cost: 2, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '【冲锋】', art: '🔪',
    attack: 3, health: 1, keywords: ['charge'],
  },
  {
    id: 'C004', name: '山贼头目', cost: 3, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '登场时，召唤一个1/1的小喽啰。', art: '🗡️',
    attack: 2, health: 3, keywords: [],
    effect: { type: 'BATTLECRY_SUMMON', extra: { minionId: 'C_TOKEN_GRUNT' } },
  },
  {
    id: 'C005', name: '乡村大夫', cost: 2, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '【圣盾】', art: '👨‍⚕️',
    attack: 2, health: 1, keywords: ['divine_shield'],
  },
  {
    id: 'C006', name: '冰霜元素', cost: 3, type: 'minion', rarity: 'rare', heroClass: 'neutral',
    description: '战吼：冻结一个敌方随从。', art: '❄️',
    attack: 2, health: 3, keywords: [],
    effect: { type: 'BATTLECRY_FREEZE', target: 'enemy_minion' },
  },
  {
    id: 'C007', name: '毒爪蝎', cost: 2, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '【剧毒】消灭任何被其伤害的随从。', art: '🦂',
    attack: 1, health: 2, keywords: ['poisonous'],
  },
  {
    id: 'C008', name: '长老巫师', cost: 4, type: 'minion', rarity: 'rare', heroClass: 'neutral',
    description: '战吼：将你手牌中一张牌的费用降低2点。', art: '🧓',
    attack: 3, health: 4, keywords: [],
    effect: { type: 'BATTLECRY_COST_REDUCE', value: 2 },
  },
  {
    id: 'C009', name: '守护神龙', cost: 6, type: 'minion', rarity: 'epic', heroClass: 'neutral',
    description: '【嘲讽】【圣盾】', art: '🐉',
    attack: 5, health: 6, keywords: ['taunt', 'divine_shield'],
  },
  {
    id: 'C010', name: '不死将军', cost: 5, type: 'minion', rarity: 'rare', heroClass: 'neutral',
    description: '亡语：在你的战场上召唤一个3/3的骷髅卫士。', art: '💀',
    attack: 4, health: 4, keywords: [],
    effect: { type: 'DEATHRATTLE_SUMMON', extra: { minionId: 'C_TOKEN_SKELETON' } },
  },
  {
    id: 'C011', name: '灵力法师', cost: 3, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '【圣盾】战吼：抽一张牌。', art: '🧝',
    attack: 2, health: 2, keywords: ['divine_shield'],
    effect: { type: 'BATTLECRY_DRAW', value: 1 },
  },
  {
    id: 'C012', name: '迅捷猎鹰', cost: 1, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '【冲锋】', art: '🦅',
    attack: 2, health: 1, keywords: ['charge'],
  },
  {
    id: 'C013', name: '战地医师', cost: 4, type: 'minion', rarity: 'rare', heroClass: 'neutral',
    description: '战吼：恢复你的英雄4点生命值。', art: '⚕️',
    attack: 3, health: 3, keywords: [],
    effect: { type: 'BATTLECRY_HEAL_HERO', value: 4, target: 'own_hero' },
  },
  {
    id: 'C014', name: '愤怒战熊', cost: 5, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '【嘲讽】', art: '🐻',
    attack: 5, health: 5, keywords: ['taunt'],
  },
  {
    id: 'C015', name: '汲血鬼', cost: 3, type: 'minion', rarity: 'rare', heroClass: 'neutral',
    description: '【吸血】', art: '🧛',
    attack: 3, health: 3, keywords: ['lifesteal'],
  },
  {
    id: 'C016', name: '复仇幽灵', cost: 4, type: 'minion', rarity: 'rare', heroClass: 'neutral',
    description: '亡语：对所有敌方随从各造成2点伤害。', art: '👻',
    attack: 2, health: 3, keywords: [],
    effect: { type: 'DEATHRATTLE_AOE', value: 2, target: 'all_enemies' },
  },
  {
    id: 'C017', name: '气功大师', cost: 2, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '战吼：使一个友方随从获得+1/+1。', art: '🥋',
    attack: 1, health: 3, keywords: [],
    effect: { type: 'BATTLECRY_BUFF', value: 1, target: 'own_minion' },
  },
  {
    id: 'C018', name: '江湖剑客', cost: 4, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '【风怒】可以在同一回合攻击两次。', art: '⚔️',
    attack: 3, health: 3, keywords: ['windfury'],
  },
  {
    id: 'C019', name: '宫廷太监', cost: 1, type: 'minion', rarity: 'common', heroClass: 'neutral',
    description: '战吼：抽一张牌。', art: '🧑',
    attack: 1, health: 1, keywords: [],
    effect: { type: 'BATTLECRY_DRAW', value: 1 },
  },
  {
    id: 'C020', name: '传说神龟', cost: 7, type: 'minion', rarity: 'legendary', heroClass: 'neutral',
    description: '【嘲讽】【圣盾】战吼：恢复你的英雄8点生命值。', art: '🐢',
    attack: 4, health: 8, keywords: ['taunt', 'divine_shield'],
    effect: { type: 'BATTLECRY_HEAL_HERO', value: 8, target: 'own_hero' },
  },
  {
    id: 'C021', name: '阴影刺客', cost: 3, type: 'minion', rarity: 'rare', heroClass: 'neutral',
    description: '【隐匿】', art: '🥷',
    attack: 3, health: 2, keywords: ['stealth'],
  },
  {
    id: 'C022', name: '岩石巨人', cost: 8, type: 'minion', rarity: 'epic', heroClass: 'neutral',
    description: '每有一个友方随从在场时，费用降低1点。', art: '🗿',
    attack: 8, health: 8, keywords: [],
  },
  {
    id: 'C023', name: '祥瑞凤凰', cost: 5, type: 'minion', rarity: 'epic', heroClass: 'neutral',
    description: '亡语：将自身从牌库中召唤回来。', art: '🦅',
    attack: 4, health: 4, keywords: [],
    effect: { type: 'DEATHRATTLE_SHUFFLE_SELF' },
  },
  {
    id: 'C024', name: '仙鹤道长', cost: 6, type: 'minion', rarity: 'legendary', heroClass: 'neutral',
    description: '【嘲讽】战吼：恢复所有友方角色6点生命值。', art: '🦢',
    attack: 4, health: 7, keywords: ['taunt'],
    effect: { type: 'BATTLECRY_HEAL_ALL', value: 6 },
  },

  // ==================== 学士（诸葛）专属 ====================
  {
    id: 'S001', name: '书生助手', cost: 1, type: 'minion', rarity: 'common', heroClass: 'scholar',
    description: '战吼：窥视你的牌库顶部，可选择放回或留在手中。', art: '📚',
    attack: 1, health: 1, keywords: [],
    effect: { type: 'BATTLECRY_PEEK' },
  },
  {
    id: 'S002', name: '军师门生', cost: 3, type: 'minion', rarity: 'rare', heroClass: 'scholar',
    description: '战吼：复制你手中的一张法术牌。', art: '📖',
    attack: 2, health: 4, keywords: [],
    effect: { type: 'BATTLECRY_COPY_SPELL' },
  },
  {
    id: 'S003', name: '天机阵', cost: 5, type: 'minion', rarity: 'epic', heroClass: 'scholar',
    description: '光环：你的法术造成的伤害+2。', art: '🌀',
    attack: 3, health: 6, keywords: [],
  },
  {
    id: 'S004', name: '木牛流马', cost: 4, type: 'minion', rarity: 'rare', heroClass: 'scholar',
    description: '战吼：从你的牌库中随机抽2张牌。', art: '🐄',
    attack: 2, health: 4, keywords: [],
    effect: { type: 'BATTLECRY_DRAW', value: 2 },
  },

  // ==================== 武将（吕布）专属 ====================
  {
    id: 'W001', name: '亲卫队长', cost: 2, type: 'minion', rarity: 'common', heroClass: 'warrior',
    description: '战吼：你的英雄获得2点护甲值。', art: '🪖',
    attack: 2, health: 3, keywords: [],
    effect: { type: 'BATTLECRY_GAIN_ARMOR', value: 2 },
  },
  {
    id: 'W002', name: '虎豹骑', cost: 3, type: 'minion', rarity: 'rare', heroClass: 'warrior',
    description: '【冲锋】战吼：获得+2攻击力，但下回合结束。', art: '🐅',
    attack: 3, health: 2, keywords: ['charge'],
  },
  {
    id: 'W003', name: '攻城槌', cost: 5, type: 'minion', rarity: 'epic', heroClass: 'warrior',
    description: '【嘲讽】战吼：对敌方英雄造成3点伤害。', art: '🏗️',
    attack: 3, health: 7, keywords: ['taunt'],
    effect: { type: 'BATTLECRY_DEAL_DAMAGE', value: 3, target: 'enemy_minion' },
  },
  {
    id: 'W004', name: '铁血武将', cost: 4, type: 'minion', rarity: 'rare', heroClass: 'warrior',
    description: '每次受到伤害时，获得+1攻击力。', art: '⚔️',
    attack: 2, health: 6, keywords: [],
  },

  // ==================== 刺客（貂蝉）专属 ====================
  {
    id: 'R001', name: '毒手侍女', cost: 2, type: 'minion', rarity: 'common', heroClass: 'rogue',
    description: '【剧毒】', art: '🪡',
    attack: 1, health: 1, keywords: ['poisonous'],
  },
  {
    id: 'R002', name: '夜行刺客', cost: 4, type: 'minion', rarity: 'rare', heroClass: 'rogue',
    description: '【隐匿】【冲锋】', art: '🗡️',
    attack: 4, health: 2, keywords: ['stealth', 'charge'],
  },
  {
    id: 'R003', name: '双刀客', cost: 3, type: 'minion', rarity: 'rare', heroClass: 'rogue',
    description: '【风怒】', art: '🔪',
    attack: 2, health: 3, keywords: ['windfury'],
  },
  {
    id: 'R004', name: '毒药大师', cost: 5, type: 'minion', rarity: 'epic', heroClass: 'rogue',
    description: '战吼：使一个敌方随从获得【剧毒】（下次攻击时被消灭）。', art: '🧪',
    attack: 3, health: 4, keywords: [],
    effect: { type: 'BATTLECRY_POISON', target: 'enemy_minion' },
  },

  // ==================== 猎手（孙尚香）专属 ====================
  {
    id: 'H001', name: '猎鹰驯养者', cost: 2, type: 'minion', rarity: 'common', heroClass: 'hunter',
    description: '战吼：召唤一只1/1的猎鹰（具有【冲锋】）。', art: '🦁',
    attack: 2, health: 2, keywords: [],
    effect: { type: 'BATTLECRY_SUMMON', extra: { minionId: 'C_TOKEN_FALCON' } },
  },
  {
    id: 'H002', name: '追踪者', cost: 3, type: 'minion', rarity: 'rare', heroClass: 'hunter',
    description: '战吼：发现并加入一张野兽牌进你的手牌。', art: '🏹',
    attack: 2, health: 3, keywords: [],
    effect: { type: 'BATTLECRY_DISCOVER' },
  },
  {
    id: 'H003', name: '驯虎人', cost: 4, type: 'minion', rarity: 'rare', heroClass: 'hunter',
    description: '战吼：召唤一只3/2的老虎。', art: '🐯',
    attack: 3, health: 3, keywords: [],
    effect: { type: 'BATTLECRY_SUMMON', extra: { minionId: 'C_TOKEN_TIGER' } },
  },
  {
    id: 'H004', name: '弓箭手精英', cost: 5, type: 'minion', rarity: 'epic', heroClass: 'hunter',
    description: '战吼：对所有敌方随从各造成1点伤害。', art: '🏹',
    attack: 4, health: 4, keywords: [],
    effect: { type: 'BATTLECRY_AOE', value: 1, target: 'all_enemies' },
  },

  // ==================== 法术（中立）====================
  {
    id: 'SP001', name: '火球术', cost: 4, type: 'spell', rarity: 'common', heroClass: 'neutral',
    description: '对一个目标造成6点伤害。', art: '🔥',
    school: 'fire', effect: { type: 'DEAL_DAMAGE', value: 6, target: 'any' },
  },
  {
    id: 'SP002', name: '冰封法术', cost: 2, type: 'spell', rarity: 'common', heroClass: 'neutral',
    description: '冻结一个目标并造成2点伤害。', art: '❄️',
    school: 'frost', effect: { type: 'FREEZE_DAMAGE', value: 2, target: 'any' },
  },
  {
    id: 'SP003', name: '天降神雷', cost: 5, type: 'spell', rarity: 'rare', heroClass: 'neutral',
    description: '对所有敌方随从造成4点伤害。', art: '⚡',
    school: 'arcane', effect: { type: 'AOE_DAMAGE', value: 4, target: 'all_enemies' },
  },
  {
    id: 'SP004', name: '愈合之光', cost: 3, type: 'spell', rarity: 'common', heroClass: 'neutral',
    description: '恢复一个友方角色8点生命值。', art: '✨',
    school: 'holy', effect: { type: 'HEAL', value: 8, target: 'any' },
  },
  {
    id: 'SP005', name: '灵气充盈', cost: 0, type: 'spell', rarity: 'common', heroClass: 'neutral',
    description: '抽2张牌。', art: '💨',
    school: 'arcane', effect: { type: 'DRAW', value: 2 },
  },
  {
    id: 'SP006', name: '铁索连环', cost: 3, type: 'spell', rarity: 'rare', heroClass: 'neutral',
    description: '冻结所有敌方随从。', art: '⛓️',
    school: 'frost', effect: { type: 'FREEZE_ALL', target: 'all_enemies' },
  },
  {
    id: 'SP007', name: '绑定之力', cost: 2, type: 'spell', rarity: 'common', heroClass: 'neutral',
    description: '使一个友方随从获得+2/+2。', art: '💪',
    school: 'nature', effect: { type: 'BUFF', value: 2, target: 'own_minion' },
  },
  {
    id: 'SP008', name: '火焰风暴', cost: 7, type: 'spell', rarity: 'epic', heroClass: 'neutral',
    description: '对所有敌方角色造成5点伤害。', art: '🌋',
    school: 'fire', effect: { type: 'AOE_DAMAGE', value: 5, target: 'all_enemies' },
  },
  {
    id: 'SP009', name: '毒箭', cost: 2, type: 'spell', rarity: 'common', heroClass: 'neutral',
    description: '对一个随从造成3点伤害。', art: '🏹',
    school: 'nature', effect: { type: 'DEAL_DAMAGE', value: 3, target: 'any' },
  },
  {
    id: 'SP010', name: '暗影刺杀', cost: 4, type: 'spell', rarity: 'rare', heroClass: 'neutral',
    description: '消灭一个生命值小于等于3的敌方随从。', art: '🌑',
    school: 'shadow', effect: { type: 'DESTROY_IF_LOW_HEALTH', value: 3, target: 'enemy_minion' },
  },
  {
    id: 'SP011', name: '驱散', cost: 2, type: 'spell', rarity: 'common', heroClass: 'neutral',
    description: '沉默一个随从。', art: '🔇',
    school: 'holy', effect: { type: 'SILENCE', target: 'any' },
  },
  {
    id: 'SP012', name: '圣光闪耀', cost: 5, type: 'spell', rarity: 'epic', heroClass: 'neutral',
    description: '使所有友方随从获得【圣盾】。', art: '🌟',
    school: 'holy', effect: { type: 'GRANT_DIVINE_SHIELD', target: 'own_minion' },
  },

  // ==================== 武器 ====================
  {
    id: 'WP001', name: '方天画戟', cost: 5, type: 'weapon', rarity: 'legendary', heroClass: 'warrior',
    description: '装备此武器后，你的英雄每次攻击对所有敌方随从额外造成1点伤害。', art: '🔱',
    weaponAttack: 5, durability: 3,
  },
  {
    id: 'WP002', name: '龙鳞宝刀', cost: 3, type: 'weapon', rarity: 'rare', heroClass: 'neutral',
    description: '锋利的宝刀。', art: '🗡️',
    weaponAttack: 3, durability: 2,
  },
  {
    id: 'WP003', name: '飞刀', cost: 2, type: 'weapon', rarity: 'common', heroClass: 'rogue',
    description: '装备时：对一个敌方随从造成2点伤害。', art: '🔪',
    weaponAttack: 2, durability: 2,
    effect: { type: 'EQUIP_DEAL_DAMAGE', value: 2, target: 'enemy_minion' },
  },
  {
    id: 'WP004', name: '猎弓', cost: 2, type: 'weapon', rarity: 'common', heroClass: 'hunter',
    description: '轻便的猎弓。', art: '🏹',
    weaponAttack: 2, durability: 3,
  },
];

// Token cards (summoned by effects, not in deck)
export const TOKEN_CARDS: Record<string, CardData> = {
  C_TOKEN_GRUNT: {
    id: 'C_TOKEN_GRUNT', name: '小喽啰', cost: 0, type: 'minion', rarity: 'common',
    heroClass: 'neutral', description: '', art: '😈', attack: 1, health: 1, keywords: [],
  },
  C_TOKEN_SKELETON: {
    id: 'C_TOKEN_SKELETON', name: '骷髅卫士', cost: 0, type: 'minion', rarity: 'common',
    heroClass: 'neutral', description: '', art: '💀', attack: 3, health: 3, keywords: [],
  },
  C_TOKEN_FALCON: {
    id: 'C_TOKEN_FALCON', name: '猎鹰', cost: 0, type: 'minion', rarity: 'common',
    heroClass: 'neutral', description: '', art: '🦅', attack: 1, health: 1, keywords: ['charge'],
  },
  C_TOKEN_TIGER: {
    id: 'C_TOKEN_TIGER', name: '猛虎', cost: 0, type: 'minion', rarity: 'common',
    heroClass: 'neutral', description: '', art: '🐯', attack: 3, health: 2, keywords: [],
  },
};
