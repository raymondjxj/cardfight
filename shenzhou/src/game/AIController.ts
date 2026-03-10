import type { PlayerState, CardInstance } from '../models/types';
import type { GameState } from './GameState';
import type { CombatSystem } from './CombatSystem';

export class AIController {
  constructor(private gs: GameState, private combat: CombatSystem) {}

  async playTurn(onUpdate: () => void): Promise<void> {
    const pid = 'opponent';
    const p = this.gs.players[pid];

    await this.delay(600);

    // Phase 1: Play cards
    let played = true;
    while (played) {
      played = false;
      const hand = [...p.hand];
      // Sort by cost descending (play most expensive affordable card)
      hand.sort((a, b) => b.cost - a.cost);
      for (const card of hand) {
        if (card.cost <= p.mana && p.board.length < 7) {
          const idx = p.hand.indexOf(card);
          if (idx === -1) continue;
          const targetInfo = this.pickTarget(pid, card);
          this.combat.playCard(pid, idx, targetInfo?.minionId, targetInfo?.pid);
          onUpdate();
          await this.delay(700);
          played = true;
          break;
        }
      }
    }

    // Phase 2: Use hero skill if beneficial
    const hero = p.hero;
    if (!hero.skill.usedThisTurn && hero.skill.cost <= p.mana) {
      const skillEff = hero.skill.effect;
      if (skillEff.type === 'GAIN_ARMOR') {
        this.combat.useHeroSkill(pid);
        onUpdate();
        await this.delay(600);
      } else if (skillEff.type === 'DEAL_DAMAGE') {
        // Target lowest-health enemy minion or hero
        const enemy = this.gs.players['player'];
        const lowest = this.lowestHealthMinion(enemy);
        if (lowest && (skillEff.value ?? 0) >= lowest.currentHealth) {
          this.combat.useHeroSkill(pid, lowest.instanceId, 'player');
        } else {
          this.combat.useHeroSkill(pid, undefined, 'player');
        }
        onUpdate();
        await this.delay(600);
      } else if (skillEff.type === 'DRAW_SPELL' || skillEff.type === 'HERO_ATTACK_BUFF') {
        this.combat.useHeroSkill(pid);
        onUpdate();
        await this.delay(600);
      }
    }

    // Phase 3: Attack with minions
    for (let iter = 0; iter < 20; iter++) {
      const attacker = p.board.find(m => !m.exhausted && !m.frozen && m.currentAttack > 0);
      if (!attacker) break;
      const target = this.pickAttackTarget(pid, attacker);
      if (target === null) break;

      if (target === 'hero') {
        this.combat.minionAttack(pid, attacker.instanceId, 'player');
      } else {
        this.combat.minionAttack(pid, attacker.instanceId, 'player', target.instanceId);
      }
      onUpdate();
      await this.delay(600);
    }

    // Phase 4: Hero attack
    if (hero.attack > 0 && !hero.exhausted) {
      const enemy = this.gs.players['player'];
      const taunts = enemy.board.filter(m => m.keywords?.includes('taunt'));
      if (taunts.length > 0) {
        this.combat.heroAttack(pid, 'player', taunts[0].instanceId);
      } else if (enemy.board.length > 0 && Math.random() > 0.4) {
        const t = this.lowestHealthMinion(enemy);
        if (t && hero.attack >= t.currentHealth) {
          this.combat.heroAttack(pid, 'player', t.instanceId);
        } else {
          this.combat.heroAttack(pid, 'player');
        }
      } else {
        this.combat.heroAttack(pid, 'player');
      }
      onUpdate();
      await this.delay(600);
    }
  }

  private pickTarget(_pid: 'opponent', card: CardInstance): { minionId?: string; pid?: 'player' | 'opponent' } | null {
    const eff = card.effect;
    if (!eff) return null;

    const enemy = this.gs.players['player'];
    const self = this.gs.players['opponent'];

    switch (eff.type) {
      case 'BATTLECRY_FREEZE':
      case 'BATTLECRY_POISON': {
        const t = this.highestAttackMinion(enemy);
        return t ? { minionId: t.instanceId, pid: 'player' } : null;
      }
      case 'BATTLECRY_BUFF': {
        const t = this.highestAttackMinion(self);
        return t ? { minionId: t.instanceId, pid: 'opponent' } : null;
      }
      default:
        return null;
    }
  }

  private pickAttackTarget(_pid: 'opponent', attacker: CardInstance): CardInstance | 'hero' | null {
    if (attacker.currentAttack === 0) return null;
    const enemy = this.gs.players['player'];
    const taunts = enemy.board.filter(m => m.keywords?.includes('taunt'));
    if (taunts.length > 0) return taunts[0];

    // Lethal check: can we kill a minion?
    const killable = enemy.board.filter(m =>
      !m.keywords?.includes('stealth') && m.currentHealth <= attacker.currentAttack
    );
    if (killable.length > 0) return killable[0];

    // Otherwise attack hero directly
    return 'hero';
  }

  private lowestHealthMinion(p: PlayerState): CardInstance | null {
    const alive = p.board.filter(m => !m.keywords?.includes('stealth'));
    if (alive.length === 0) return null;
    return alive.reduce((a, b) => a.currentHealth < b.currentHealth ? a : b);
  }

  private highestAttackMinion(p: PlayerState): CardInstance | null {
    if (p.board.length === 0) return null;
    return p.board.reduce((a, b) => a.currentAttack > b.currentAttack ? a : b);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }
}
