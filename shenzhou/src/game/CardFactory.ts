import type { CardData, CardInstance } from '../models/types';

let instanceCounter = 0;

export function createCardInstance(data: CardData): CardInstance {
  instanceCounter++;
  return {
    ...data,
    instanceId: `${data.id}_${instanceCounter}_${Math.random().toString(36).slice(2, 7)}`,
    currentAttack: data.attack ?? 0,
    currentHealth: data.health ?? 0,
    maxHealth: data.health ?? 0,
    currentDurability: data.durability,
    exhausted: true,
    attacksThisTurn: 0,
    onBoardTurns: 0,
    hasDivineShield: (data.keywords ?? []).includes('divine_shield'),
    frozen: false,
    silenced: false,
    buffs: [],
    keywords: [...(data.keywords ?? [])],
  };
}

export function buildDeck(cardIds: string[], allCards: CardData[]): CardInstance[] {
  const deck: CardInstance[] = [];
  for (const id of cardIds) {
    const data = allCards.find(c => c.id === id);
    if (data) deck.push(createCardInstance(data));
  }
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
