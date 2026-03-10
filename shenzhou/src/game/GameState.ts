import type { PlayerState, PlayerID, TurnPhase, GameConfig, CardInstance, CardData } from '../models/types';
import { createHeroInstance } from './HeroFactory';
import { buildDeck, createCardInstance } from './CardFactory';
import { HEROES } from '../data/heroes';
import { CARDS, TOKEN_CARDS } from '../data/cards';

export interface GameLog {
  id: number;
  text: string;
  type: 'action' | 'damage' | 'heal' | 'death' | 'system' | 'draw';
}

export type GamePhase = 'hero-select' | 'deck-build' | 'game' | 'game-over';

export class GameState {
  phase: GamePhase = 'hero-select';
  turnPhase: TurnPhase = 'action';
  turn: number = 1;
  currentPlayer: PlayerID = 'player';
  players: Record<PlayerID, PlayerState>;
  winner: PlayerID | null = null;
  logs: GameLog[] = [];
  selectedHeroId: string = '';
  playerDeck: string[] = [];
  logIdCounter = 0;

  constructor() {
    this.players = {
      player: this._emptyPlayer('player'),
      opponent: this._emptyPlayer('opponent'),
    };
  }

  private _emptyPlayer(id: PlayerID): PlayerState {
    return {
      id,
      hero: createHeroInstance(HEROES[0]),
      deck: [],
      hand: [],
      board: [],
      graveyard: [],
      mana: 0,
      maxMana: 0,
      fatigueCounter: 0,
      isAI: id === 'opponent',
    };
  }

  initGame(config: GameConfig) {
    const playerHero = HEROES.find(h => h.id === config.playerHeroId) ?? HEROES[0];
    const opponentHero = HEROES.find(h => h.id === config.opponentHeroId) ?? HEROES[1];

    this.players.player = {
      id: 'player',
      hero: createHeroInstance(playerHero),
      deck: buildDeck(config.playerDeck, CARDS),
      hand: [],
      board: [],
      graveyard: [],
      mana: 0,
      maxMana: 0,
      fatigueCounter: 0,
      isAI: false,
    };

    this.players.opponent = {
      id: 'opponent',
      hero: createHeroInstance(opponentHero),
      deck: buildDeck(config.opponentDeck, CARDS),
      hand: [],
      board: [],
      graveyard: [],
      mana: 0,
      maxMana: 0,
      fatigueCounter: 0,
      isAI: true,
    };

    this.turn = 1;
    this.currentPlayer = 'player';
    this.winner = null;
    this.logs = [];
    this.phase = 'game';

    // Draw starting hands: player=3, opponent=4 + coin
    for (let i = 0; i < 3; i++) this.drawCard('player', false);
    for (let i = 0; i < 4; i++) this.drawCard('opponent', false);

    // Coin for opponent (second player)
    const coin: CardInstance = createCardInstance({
      id: 'COIN', name: '幸运币', cost: 0, type: 'spell', rarity: 'common',
      heroClass: 'neutral', description: '本回合获得1点额外法力水晶',
      art: '🪙', effect: { type: 'GAIN_MANA', value: 1 },
    });
    this.players.opponent.hand.push(coin);

    this.startTurn('player');
    this.log('游戏开始！你先手出牌。', 'system');
  }

  startTurn(pid: PlayerID) {
    this.currentPlayer = pid;
    this.turnPhase = 'action';
    const p = this.players[pid];

    // Ramp mana
    p.maxMana = Math.min(10, p.maxMana + 1);
    p.mana = p.maxMana;

    // Reset hero
    p.hero.exhausted = false;
    p.hero.skill.usedThisTurn = false;
    if (p.hero.frozen) { p.hero.frozen = false; p.hero.exhausted = true; }

    // Reset minions
    for (const m of p.board) {
      if (m.frozen) { m.frozen = false; m.exhausted = true; }
      else { m.exhausted = false; }
      m.attacksThisTurn = 0;
      m.onBoardTurns++;
      // Remove temporary buffs
      const permanentBufs = m.buffs.filter(b => !b.temporary);
      const tempAttack = m.buffs.filter(b => b.temporary).reduce((s, b) => s + b.attackBonus, 0);
      const tempHealth = m.buffs.filter(b => b.temporary).reduce((s, b) => s + b.healthBonus, 0);
      m.buffs = permanentBufs;
      m.currentAttack -= tempAttack;
      m.currentHealth = Math.min(m.currentHealth, m.maxHealth - tempHealth);
      m.maxHealth -= tempHealth;
    }

    this.drawCard(pid);
    this.log(`${pid === 'player' ? '你' : '对手'}的回合开始（法力：${p.mana}/${p.maxMana}）`, 'system');
  }

  endTurn() {
    this.turnPhase = 'end';
    const next: PlayerID = this.currentPlayer === 'player' ? 'opponent' : 'player';
    this.turn++;
    this.startTurn(next);
  }

  drawCard(pid: PlayerID, logit = true) {
    const p = this.players[pid];
    if (p.deck.length === 0) {
      p.fatigueCounter++;
      const dmg = p.fatigueCounter;
      this.damageHero(pid, dmg);
      if (logit) this.log(`${pid === 'player' ? '你' : '对手'}牌库耗尽，受到${dmg}点疲劳伤害！`, 'damage');
      return;
    }
    if (p.hand.length >= 10) {
      const burned = p.deck.shift()!;
      if (logit) this.log(`手牌已满，${burned.name}被烧毁！`, 'system');
      return;
    }
    const card = p.deck.shift()!;
    p.hand.push(card);
    if (logit) this.log(`${pid === 'player' ? '你' : '对手'}抽到了${card.name}`, 'draw');
  }

  damageHero(pid: PlayerID, amount: number): number {
    const hero = this.players[pid].hero;
    let remaining = amount;
    if (hero.armor > 0) {
      const absorbed = Math.min(hero.armor, remaining);
      hero.armor -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      hero.health -= remaining;
    }
    this.checkDeath();
    return amount;
  }

  healHero(pid: PlayerID, amount: number) {
    const hero = this.players[pid].hero;
    hero.health = Math.min(hero.maxHealth, hero.health + amount);
  }

  gainArmor(pid: PlayerID, amount: number) {
    this.players[pid].hero.armor += amount;
  }

  damageMinion(minion: CardInstance, amount: number): number {
    if (minion.hasDivineShield) {
      minion.hasDivineShield = false;
      this.log(`${minion.name}的圣盾被破除！`, 'system');
      return 0;
    }
    minion.currentHealth -= amount;
    return amount;
  }

  killMinion(pid: PlayerID, minion: CardInstance) {
    const p = this.players[pid];
    const idx = p.board.indexOf(minion);
    if (idx !== -1) {
      p.board.splice(idx, 1);
      p.graveyard.push(minion);
      this.log(`${minion.name}阵亡！`, 'death');

      // Deathrattle
      if (minion.effect?.type === 'DEATHRATTLE_SUMMON') {
        this.summonToken(pid, (minion.effect.extra as { minionId: string }).minionId);
      } else if (minion.effect?.type === 'DEATHRATTLE_AOE') {
        const dmg = minion.effect.value ?? 0;
        const enemyId: PlayerID = pid === 'player' ? 'opponent' : 'player';
        this.dealAoeToBoard(enemyId, dmg);
        this.log(`${minion.name}的亡语：对所有敌方随从造成${dmg}点伤害！`, 'damage');
      }
    }
  }

  summonToken(pid: PlayerID, tokenId: string) {
    const p = this.players[pid];
    if (p.board.length >= 7) return;
    const tokenData: CardData | undefined = TOKEN_CARDS[tokenId];
    if (!tokenData) return;
    const token = createCardInstance(tokenData);
    token.onBoardTurns = 1;
    token.exhausted = false;
    p.board.push(token);
    this.log(`召唤了${token.name}！`, 'action');
  }

  dealAoeToBoard(pid: PlayerID, damage: number) {
    const p = this.players[pid];
    const dead: CardInstance[] = [];
    for (const m of [...p.board]) {
      this.damageMinion(m, damage);
      if (m.currentHealth <= 0) dead.push(m);
    }
    for (const m of dead) this.killMinion(pid, m);
  }

  checkDeath(): boolean {
    for (const pid of ['player', 'opponent'] as PlayerID[]) {
      if (this.players[pid].hero.health <= 0) {
        this.winner = pid === 'player' ? 'opponent' : 'player';
        this.phase = 'game-over';
        this.log(`${pid === 'player' ? '你' : '对手'}的英雄阵亡！游戏结束！`, 'death');
        return true;
      }
    }
    return false;
  }

  log(text: string, type: GameLog['type'] = 'action') {
    this.logs.push({ id: this.logIdCounter++, text, type });
    if (this.logs.length > 100) this.logs.shift();
  }

  // Utility: get enemy player id
  enemy(pid: PlayerID): PlayerID {
    return pid === 'player' ? 'opponent' : 'player';
  }
}
