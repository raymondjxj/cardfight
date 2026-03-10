import type { PlayerID, CardInstance } from '../models/types';
import type { GameState } from './GameState';
export class CombatSystem {
  constructor(private gs: GameState) {}

  // ---- Play card from hand ----
  playCard(pid: PlayerID, handIndex: number, targetMinionId?: string, targetPid?: PlayerID): boolean {
    const p = this.gs.players[pid];
    const card = p.hand[handIndex];
    if (!card) return false;
    if (card.cost > p.mana) { this.gs.log('法力不足！', 'system'); return false; }

    p.mana -= card.cost;
    p.hand.splice(handIndex, 1);

    if (card.type === 'minion') {
      return this.playMinion(pid, card);
    } else if (card.type === 'spell') {
      return this.playSpell(pid, card, targetMinionId, targetPid);
    } else if (card.type === 'weapon') {
      return this.playWeapon(pid, card);
    }
    return false;
  }

  private playMinion(pid: PlayerID, card: CardInstance): boolean {
    const p = this.gs.players[pid];
    if (p.board.length >= 7) { this.gs.log('战场已满！', 'system'); return false; }

    // First turn setup
    card.onBoardTurns = 0;
    card.exhausted = !card.keywords?.includes('charge');
    card.attacksThisTurn = 0;

    p.board.push(card);
    this.gs.log(`打出随从：${card.name}（${card.currentAttack}/${card.currentHealth}）`, 'action');

    // Battlecry
    this.resolveBattlecry(pid, card);
    return true;
  }

  private resolveBattlecry(pid: PlayerID, card: CardInstance) {
    const eff = card.effect;
    if (!eff) return;
    const enemy = this.gs.enemy(pid);

    switch (eff.type) {
      case 'BATTLECRY_DRAW':
        for (let i = 0; i < (eff.value ?? 1); i++) this.gs.drawCard(pid);
        break;
      case 'BATTLECRY_HEAL_HERO':
        this.gs.healHero(pid, eff.value ?? 0);
        this.gs.log(`战吼：恢复英雄${eff.value}点生命值`, 'heal');
        break;
      case 'BATTLECRY_GAIN_ARMOR':
        this.gs.gainArmor(pid, eff.value ?? 0);
        this.gs.log(`战吼：获得${eff.value}点护甲`, 'action');
        break;
      case 'BATTLECRY_SUMMON': {
        const tokenId = (eff.extra as { minionId: string })?.minionId;
        if (tokenId) this.gs.summonToken(pid, tokenId);
        break;
      }
      case 'BATTLECRY_AOE': {
        const dmg = eff.value ?? 0;
        this.gs.dealAoeToBoard(enemy, dmg);
        this.gs.damageHero(enemy, dmg);
        this.gs.log(`战吼：对所有敌方造成${dmg}点伤害`, 'damage');
        break;
      }
      case 'BATTLECRY_BUFF': {
        // Buff a random own minion (auto-target for battlecry)
        const targets = this.gs.players[pid].board.filter(m => m !== card);
        if (targets.length > 0) {
          const t = targets[Math.floor(Math.random() * targets.length)];
          this.buffMinion(t, eff.value ?? 0, eff.value ?? 0);
          this.gs.log(`战吼：${t.name}获得+${eff.value}/+${eff.value}`, 'action');
        }
        break;
      }
      case 'BATTLECRY_DEAL_DAMAGE': {
        const eHero = this.gs.players[enemy].hero;
        eHero.health -= eff.value ?? 0;
        this.gs.log(`战吼：对敌方英雄造成${eff.value}点伤害`, 'damage');
        this.gs.checkDeath();
        break;
      }
      case 'BATTLECRY_HEAL_ALL': {
        const v = eff.value ?? 0;
        this.gs.healHero(pid, v);
        for (const m of this.gs.players[pid].board) {
          m.currentHealth = Math.min(m.maxHealth, m.currentHealth + v);
        }
        this.gs.log(`战吼：恢复所有友方角色${v}点生命值`, 'heal');
        break;
      }
    }
  }

  private playSpell(pid: PlayerID, card: CardInstance, targetMinionId?: string, targetPid?: PlayerID): boolean {
    const eff = card.effect;
    if (!eff) return true;
    const enemy = this.gs.enemy(pid);

    this.gs.log(`施放法术：${card.name}`, 'action');

    switch (eff.type) {
      case 'DEAL_DAMAGE':
      case 'FREEZE_DAMAGE': {
        const dmg = eff.value ?? 0;
        if (targetMinionId) {
          const tPid = targetPid ?? enemy;
          const target = this.gs.players[tPid].board.find(m => m.instanceId === targetMinionId);
          if (target) {
            this.gs.damageMinion(target, dmg);
            if (eff.type === 'FREEZE_DAMAGE') target.frozen = true;
            this.gs.log(`${card.name}对${target.name}造成${dmg}点伤害`, 'damage');
            this.checkMinionDeath(tPid);
          }
        } else if (targetPid) {
          this.gs.damageHero(targetPid, dmg);
          this.gs.log(`${card.name}对${targetPid === 'player' ? '你' : '对手'}造成${dmg}点伤害`, 'damage');
        }
        break;
      }
      case 'AOE_DAMAGE': {
        const dmg = eff.value ?? 0;
        this.gs.dealAoeToBoard(enemy, dmg);
        if (eff.target === 'all_enemies') this.gs.damageHero(enemy, dmg);
        this.gs.log(`${card.name}对所有敌方造成${dmg}点伤害`, 'damage');
        break;
      }
      case 'HEAL': {
        const v = eff.value ?? 0;
        if (targetMinionId) {
          const tPid = targetPid ?? pid;
          const target = this.gs.players[tPid].board.find(m => m.instanceId === targetMinionId);
          if (target) {
            target.currentHealth = Math.min(target.maxHealth, target.currentHealth + v);
            this.gs.log(`${card.name}恢复${target.name} ${v}点生命值`, 'heal');
          }
        } else {
          this.gs.healHero(targetPid ?? pid, v);
          this.gs.log(`${card.name}恢复英雄${v}点生命值`, 'heal');
        }
        break;
      }
      case 'DRAW':
        for (let i = 0; i < (eff.value ?? 1); i++) this.gs.drawCard(pid);
        break;
      case 'FREEZE_ALL':
        for (const m of this.gs.players[enemy].board) { m.frozen = true; m.exhausted = true; }
        this.gs.log(`${card.name}冻结了所有敌方随从！`, 'action');
        break;
      case 'BUFF': {
        if (targetMinionId) {
          const tPid = targetPid ?? pid;
          const target = this.gs.players[tPid].board.find(m => m.instanceId === targetMinionId);
          if (target) {
            this.buffMinion(target, eff.value ?? 0, eff.value ?? 0);
            this.gs.log(`${target.name}获得+${eff.value}/+${eff.value}`, 'action');
          }
        }
        break;
      }
      case 'SILENCE': {
        if (targetMinionId) {
          const tPid = targetPid ?? pid;
          const target = this.gs.players[tPid].board.find(m => m.instanceId === targetMinionId);
          if (target) {
            target.silenced = true;
            target.keywords = [];
            target.hasDivineShield = false;
            target.buffs = target.buffs.filter(b => !b.temporary);
            this.gs.log(`${target.name}被沉默了！`, 'action');
          }
        }
        break;
      }
      case 'GRANT_DIVINE_SHIELD':
        for (const m of this.gs.players[pid].board) m.hasDivineShield = true;
        this.gs.log(`所有友方随从获得圣盾！`, 'action');
        break;
      case 'DESTROY_IF_LOW_HEALTH': {
        if (targetMinionId) {
          const tPid = targetPid ?? enemy;
          const target = this.gs.players[tPid].board.find(m => m.instanceId === targetMinionId);
          if (target && target.currentHealth <= (eff.value ?? 3)) {
            this.gs.killMinion(tPid, target);
          } else {
            this.gs.log(`目标生命值过高，无法消灭！`, 'system');
          }
        }
        break;
      }
      case 'GAIN_MANA':
        this.gs.players[pid].mana = Math.min(this.gs.players[pid].maxMana + (eff.value ?? 0), 10);
        this.gs.log(`获得${eff.value}点额外法力水晶`, 'action');
        break;
    }

    // Passive: scholar hero spell bonus mana
    const hero = this.gs.players[pid].hero;
    if (hero.id === 'zhuge' && !this.zhugeBonusUsedThisTurn) {
      this.zhugeBonusUsedThisTurn = true;
      this.gs.players[pid].mana = Math.min(this.gs.players[pid].maxMana, this.gs.players[pid].mana + 1);
      this.gs.log('【博学】被动：获得1点法力水晶', 'action');
    }
    return true;
  }

  private zhugeBonusUsedThisTurn = false;

  resetTurnPassives() {
    this.zhugeBonusUsedThisTurn = false;
  }

  private playWeapon(pid: PlayerID, card: CardInstance): boolean {
    const p = this.gs.players[pid];
    p.hero.weapon = {
      card,
      currentAttack: card.weaponAttack ?? 0,
      currentDurability: card.durability ?? 0,
    };
    p.hero.attack = card.weaponAttack ?? 0;
    this.gs.log(`装备了武器：${card.name}（${card.weaponAttack}攻/${card.durability}耐久）`, 'action');

    // Equip effect
    if (card.effect?.type === 'EQUIP_DEAL_DAMAGE') {
      // Handled by UI targeting
    }
    return true;
  }

  // ---- Attack ----
  minionAttack(attackerPid: PlayerID, attackerInstanceId: string, defenderPid: PlayerID, defenderInstanceId?: string): boolean {
    const attacker = this.gs.players[attackerPid].board.find(m => m.instanceId === attackerInstanceId);
    if (!attacker) return false;
    if (attacker.exhausted) { this.gs.log('该随从本回合无法攻击！', 'system'); return false; }
    if (attacker.frozen) { this.gs.log('该随从被冻结，无法攻击！', 'system'); return false; }
    if (attacker.keywords?.includes('stealth')) { attacker.keywords = attacker.keywords?.filter(k => k !== 'stealth'); }

    // Check taunt
    const defBoard = this.gs.players[defenderPid].board;
    const taunts = defBoard.filter(m => m.keywords?.includes('taunt'));
    if (taunts.length > 0 && defenderInstanceId && !taunts.find(m => m.instanceId === defenderInstanceId)) {
      this.gs.log('必须先攻击有嘲讽的随从！', 'system');
      return false;
    }

    if (defenderInstanceId) {
      // Minion vs minion
      const defender = defBoard.find(m => m.instanceId === defenderInstanceId);
      if (!defender) return false;
      if (defender.keywords?.includes('stealth')) { this.gs.log('无法攻击隐匿的随从！', 'system'); return false; }

      this.resolveCombat(attackerPid, attacker, defenderPid, defender);
    } else {
      // Minion vs hero
      if (taunts.length > 0) { this.gs.log('必须先攻击有嘲讽的随从！', 'system'); return false; }
      const defHero = this.gs.players[defenderPid].hero;
      const atk = attacker.currentAttack;
      this.gs.damageHero(defenderPid, atk);
      this.gs.log(`${attacker.name}攻击对手英雄，造成${atk}点伤害！`, 'damage');

      if (attacker.keywords?.includes('lifesteal') && atk > 0) {
        this.gs.healHero(attackerPid, atk);
      }

      // Counter from hero armor (no counter by default for hero without weapon)
      if (defHero.attack > 0) {
        // Hero has weapon: no counter attack (hero attacks separately)
      }
    }

    attacker.attacksThisTurn++;
    attacker.exhausted = !attacker.keywords?.includes('windfury') || attacker.attacksThisTurn >= 2;
    return true;
  }

  private resolveCombat(aPid: PlayerID, a: CardInstance, dPid: PlayerID, d: CardInstance) {
    const atkA = a.currentAttack;
    const atkD = d.currentAttack;

    this.gs.log(`${a.name}(${a.currentAttack}/${a.currentHealth}) 攻击 ${d.name}(${d.currentAttack}/${d.currentHealth})`, 'action');

    const damageToD = this.gs.damageMinion(d, atkA);
    const damageToA = this.gs.damageMinion(a, atkD);

    // Lifesteal
    if (a.keywords?.includes('lifesteal') && damageToD > 0) this.gs.healHero(aPid, damageToD);
    if (d.keywords?.includes('lifesteal') && damageToA > 0) this.gs.healHero(dPid, damageToA);

    // Poisonous
    if (a.keywords?.includes('poisonous') && damageToD > 0) d.currentHealth = 0;
    if (d.keywords?.includes('poisonous') && damageToA > 0) a.currentHealth = 0;

    this.checkMinionDeath(aPid);
    this.checkMinionDeath(dPid);
  }

  heroAttack(attackerPid: PlayerID, defenderPid: PlayerID, defenderMinionId?: string): boolean {
    const hero = this.gs.players[attackerPid].hero;
    if (hero.exhausted || hero.attack <= 0) { this.gs.log('英雄无法攻击！', 'system'); return false; }
    if (hero.frozen) { this.gs.log('英雄被冻结，无法攻击！', 'system'); return false; }

    const atk = hero.attack;

    // Check taunt
    const defBoard = this.gs.players[defenderPid].board;
    const taunts = defBoard.filter(m => m.keywords?.includes('taunt'));
    if (taunts.length > 0 && !defenderMinionId) { this.gs.log('必须先攻击有嘲讽的随从！', 'system'); return false; }
    if (taunts.length > 0 && defenderMinionId && !taunts.find(m => m.instanceId === defenderMinionId)) {
      this.gs.log('必须先攻击有嘲讽的随从！', 'system'); return false;
    }

    if (defenderMinionId) {
      const def = defBoard.find(m => m.instanceId === defenderMinionId);
      if (!def) return false;
      if (def.keywords?.includes('stealth')) { this.gs.log('无法攻击隐匿的随从！', 'system'); return false; }

      const dmgToMinion = this.gs.damageMinion(def, atk);
      const dmgToHero = def.currentAttack;
      this.gs.damageHero(attackerPid, dmgToHero);
      if (hero.keywords?.includes('lifesteal') && dmgToMinion > 0) this.gs.healHero(attackerPid, dmgToMinion);
      this.gs.log(`英雄攻击${def.name}，造成${atk}点伤害，受到${dmgToHero}点反击！`, 'damage');
      this.checkMinionDeath(defenderPid);
    } else {
      this.gs.damageHero(defenderPid, atk);
      this.gs.log(`英雄攻击对方英雄，造成${atk}点伤害！`, 'damage');
    }

    // Consume weapon durability
    if (hero.weapon) {
      hero.weapon.currentDurability--;
      if (hero.weapon.currentDurability <= 0) {
        hero.weapon = null;
        hero.attack = 0;
        this.gs.log('武器耐久耗尽！', 'system');
      }
    }
    hero.exhausted = true;
    return true;
  }

  useHeroSkill(pid: PlayerID, targetMinionId?: string, targetPid?: PlayerID): boolean {
    const p = this.gs.players[pid];
    const hero = p.hero;
    if (hero.skill.usedThisTurn) { this.gs.log('英雄技能本回合已使用！', 'system'); return false; }
    if (hero.skill.cost > p.mana) { this.gs.log('法力不足！', 'system'); return false; }

    p.mana -= hero.skill.cost;
    hero.skill.usedThisTurn = true;

    const eff = hero.skill.effect;
    const enemy = this.gs.enemy(pid);
    this.gs.log(`使用英雄技能：${hero.skill.name}`, 'action');

    switch (eff.type) {
      case 'GAIN_ARMOR':
        this.gs.gainArmor(pid, eff.value ?? 0);
        this.gs.log(`获得${eff.value}点护甲`, 'action');
        break;
      case 'DEAL_DAMAGE': {
        const dmg = eff.value ?? 0;
        if (targetMinionId) {
          const tPid = targetPid ?? enemy;
          const target = this.gs.players[tPid].board.find(m => m.instanceId === targetMinionId);
          if (target) {
            this.gs.damageMinion(target, dmg);
            this.gs.log(`英雄技能对${target.name}造成${dmg}点伤害`, 'damage');
            this.checkMinionDeath(tPid);
          }
        } else if (targetPid) {
          this.gs.damageHero(targetPid, dmg);
          this.gs.log(`英雄技能对${targetPid === 'player' ? '你' : '对手'}造成${dmg}点伤害`, 'damage');
        }
        break;
      }
      case 'DRAW_SPELL': {
        const spells = p.deck.filter(c => c.type === 'spell');
        if (spells.length > 0) {
          const idx = p.deck.indexOf(spells[Math.floor(Math.random() * spells.length)]);
          const drawn = p.deck.splice(idx, 1)[0];
          p.hand.push(drawn);
          this.gs.log(`从牌库抽到了法术：${drawn.name}`, 'draw');
        } else {
          this.gs.drawCard(pid);
        }
        break;
      }
      case 'HERO_ATTACK_BUFF':
        hero.attack = (hero.attack ?? 0) + (eff.value ?? 0);
        hero.exhausted = false;
        // hero.buffs already initialized
        this.gs.log(`英雄本回合获得${eff.value}点攻击力`, 'action');
        break;
    }
    return true;
  }

  checkMinionDeath(pid: PlayerID) {
    const dead = this.gs.players[pid].board.filter(m => m.currentHealth <= 0);
    for (const m of dead) this.gs.killMinion(pid, m);
  }

  buffMinion(minion: CardInstance, atk: number, hp: number, temporary = false) {
    minion.currentAttack += atk;
    minion.currentHealth += hp;
    minion.maxHealth += hp;
    minion.buffs.push({ source: 'effect', attackBonus: atk, healthBonus: hp, temporary });
  }

  // Passive end-of-turn effects
  applyEndOfTurnPassives(pid: PlayerID) {
    const hero = this.gs.players[pid].hero;
    // Hunter passive: deal 1 damage to enemy hero
    if (hero.id === 'sunshangxiang') {
      const enemy = this.gs.enemy(pid);
      this.gs.damageHero(enemy, 1);
      this.gs.log('【猎手】被动：对敌方英雄造成1点伤害', 'damage');
    }
    // Rogue: remove temp attack buff
    if (hero.id === 'diaochan' && hero.attack > 0 && !hero.weapon) {
      hero.attack = 0;
    }
  }
}
