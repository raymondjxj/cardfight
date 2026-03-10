// ===================== 枚举 =====================

export type CardType = 'minion' | 'spell' | 'weapon';
export type MinionKeyword = 'charge' | 'taunt' | 'divine_shield' | 'lifesteal' | 'poisonous' | 'stealth' | 'windfury';
export type SpellSchool = 'fire' | 'frost' | 'nature' | 'holy' | 'shadow' | 'arcane';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type PlayerID = 'player' | 'opponent';
export type Phase = 'hero-select' | 'deck-build' | 'game' | 'game-over';
export type TurnPhase = 'start' | 'action' | 'end';
export type TargetType = 'minion' | 'hero' | 'any' | 'own_minion' | 'enemy_minion' | 'own_hero' | 'all_minions' | 'all_enemies' | 'none';

// ===================== 卡牌 =====================

export interface CardEffect {
  type: string;
  value?: number;
  target?: TargetType;
  extra?: Record<string, unknown>;
}

export interface CardData {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  rarity: Rarity;
  heroClass: string | 'neutral'; // 'neutral' or hero id
  description: string;
  art: string; // emoji art

  // Minion only
  attack?: number;
  health?: number;
  keywords?: MinionKeyword[];

  // Spell only
  school?: SpellSchool;
  effect?: CardEffect;

  // Weapon only
  weaponAttack?: number;
  durability?: number;
}

export interface CardInstance extends CardData {
  instanceId: string;
  // Runtime overrides
  currentAttack: number;
  currentHealth: number;
  maxHealth: number;
  currentDurability?: number;
  exhausted: boolean;
  attacksThisTurn: number;
  onBoardTurns: number;
  hasDivineShield: boolean;
  frozen: boolean;
  silenced: boolean;
  buffs: Buff[];
}

export interface Buff {
  source: string;
  attackBonus: number;
  healthBonus: number;
  temporary: boolean; // removed at end of turn
}

// ===================== 武器 =====================

export interface WeaponInstance {
  card: CardData;
  currentAttack: number;
  currentDurability: number;
}

// ===================== 英雄 =====================

export interface HeroSkill {
  name: string;
  cost: number;
  description: string;
  art: string;
  effect: CardEffect;
  usedThisTurn: boolean;
}

export interface HeroData {
  id: string;
  name: string;
  title: string;
  art: string;       // emoji avatar
  description: string;
  heroClass: string;
  maxHealth: number;
  skill: Omit<HeroSkill, 'usedThisTurn'>;
  passiveDescription: string;
  themeColor: string;
}

export interface HeroInstance extends HeroData {
  health: number;
  armor: number;
  attack: number;    // from weapon
  weapon: WeaponInstance | null;
  exhausted: boolean;
  frozen: boolean;
  skill: HeroSkill;
  keywords: MinionKeyword[];
  buffs: Buff[];
}

// ===================== 玩家 =====================

export interface PlayerState {
  id: PlayerID;
  hero: HeroInstance;
  deck: CardInstance[];
  hand: CardInstance[];
  board: CardInstance[];
  graveyard: CardInstance[];
  mana: number;
  maxMana: number;
  fatigueCounter: number;
  isAI: boolean;
}

// ===================== 游戏状态 =====================

export interface GameConfig {
  playerHeroId: string;
  playerDeck: string[]; // card IDs
  opponentHeroId: string;
  opponentDeck: string[];
}
