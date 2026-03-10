import type { HeroData, HeroInstance } from '../models/types';

export function createHeroInstance(data: HeroData): HeroInstance {
  return {
    ...data,
    health: data.maxHealth,
    armor: 0,
    attack: 0,
    weapon: null,
    exhausted: false,
    frozen: false,
    keywords: [],
    buffs: [],
    skill: {
      ...data.skill,
      usedThisTurn: false,
    },
  };
}
