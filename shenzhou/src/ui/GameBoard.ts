import type { GameState } from '../game/GameState';
import type { CombatSystem } from '../game/CombatSystem';
import type { CardInstance, PlayerID } from '../models/types';

type SelectionMode = 'none' | 'card' | 'attacker';

interface Selection {
  mode: SelectionMode;
  pid?: PlayerID;
  cardHandIndex?: number;
  attackerInstanceId?: string;
  requiresTarget?: boolean;
}

export class GameBoard {
  private sel: Selection = { mode: 'none' };
  private onEndTurn: () => void;
  private onReset: () => void;
  private aiLock = false;

  constructor(
    private gs: GameState,
    private combat: CombatSystem,
    onEndTurn: () => void,
    onReset: () => void,
  ) {
    this.onEndTurn = onEndTurn;
    this.onReset = onReset;
  }

  setAILock(v: boolean) { this.aiLock = v; }

  mount(container: HTMLElement) {
    container.innerHTML = this.render();
    this.bindEvents(container);
  }

  render(): string {
    const p = this.gs.players.player;
    const o = this.gs.players.opponent;
    const isPlayerTurn = this.gs.currentPlayer === 'player' && !this.aiLock;
    const gameEnded = this.gs.phase === 'game-over';

    return `
      <div class="game-board">
        <!-- Opponent area -->
        <div class="opponent-area">
          ${this.renderHero('opponent')}
          <div class="opponent-hand">
            ${o.hand.map(() => `<div class="card-back"></div>`).join('')}
          </div>
        </div>

        <!-- Battlefield -->
        <div class="battlefield">
          <div class="board opponent-board" id="opponent-board">
            ${o.board.map(m => this.renderMinion(m, 'opponent')).join('')}
          </div>
          <div class="board-divider">
            <div class="turn-info">
              ${isPlayerTurn ? '✨ 你的回合' : '⏳ 对手回合'}
              · 第${this.gs.turn}回合
            </div>
          </div>
          <div class="board player-board" id="player-board">
            ${p.board.map(m => this.renderMinion(m, 'player')).join('')}
          </div>
        </div>

        <!-- Player area -->
        <div class="player-area">
          <div class="player-hand" id="player-hand">
            ${p.hand.map((c, i) => this.renderHandCard(c, i, isPlayerTurn)).join('')}
          </div>
          ${this.renderHero('player')}
        </div>

        <!-- Right panel: end turn + log -->
        <div class="right-panel">
          <button class="btn-end-turn ${isPlayerTurn && !gameEnded ? '' : 'disabled'}" id="end-turn-btn"
            ${!isPlayerTurn || gameEnded ? 'disabled' : ''}>
            ${isPlayerTurn ? '结束回合' : '对手回合...'}
          </button>
          <button class="btn-reset" id="reset-btn">重置游戏</button>
          <div class="battle-log" id="battle-log">
            ${[...this.gs.logs].reverse().slice(0, 30).map(l =>
              `<div class="log-entry log-${l.type}">${l.text}</div>`
            ).join('')}
          </div>
        </div>

        ${this.sel.mode !== 'none' ? `<div class="selection-hint">${this.getSelectionHint()}</div>` : ''}
        ${gameEnded ? this.renderGameOver() : ''}
      </div>
    `;
  }

  private renderHero(pid: PlayerID): string {
    const p = this.gs.players[pid];
    const hero = p.hero;
    const isPlayer = pid === 'player';
    const isCurrentTurn = this.gs.currentPlayer === pid && !this.aiLock;
    const canAttack = isPlayer && isCurrentTurn && hero.attack > 0 && !hero.exhausted && !hero.frozen;
    const isAttacker = this.sel.mode === 'attacker' && this.sel.pid === pid && !this.sel.attackerInstanceId;
    const isTarget = this.sel.mode === 'attacker' && this.sel.pid !== pid;

    return `
      <div class="hero-area ${isAttacker ? 'selected-attacker' : ''} ${isTarget ? 'targetable' : ''}"
           data-pid="${pid}" data-type="hero">
        <div class="hero-portrait ${canAttack ? 'can-attack' : ''}" data-pid="${pid}" data-type="hero">
          <div class="hero-art">${hero.art}</div>
          ${hero.armor > 0 ? `<div class="hero-armor">🛡️${hero.armor}</div>` : ''}
          ${hero.attack > 0 ? `<div class="hero-atk-badge">⚔️${hero.attack}</div>` : ''}
        </div>
        <div class="hero-stats">
          <div class="hero-name-sm">${hero.name}</div>
          <div class="hero-hp ${hero.health <= 10 ? 'low-hp' : ''}">❤️ ${hero.health}/${hero.maxHealth}</div>
          <div class="hero-mana">💧 ${p.mana}/${p.maxMana}</div>
          ${hero.weapon ? `<div class="hero-weapon">${hero.weapon.card.art} ${hero.weapon.currentAttack}/${hero.weapon.currentDurability}</div>` : ''}
        </div>
        ${isPlayer ? `
          <div class="hero-skill-area">
            <button class="btn-hero-skill ${isCurrentTurn && !hero.skill.usedThisTurn && hero.skill.cost <= p.mana ? '' : 'disabled'}"
              data-pid="${pid}" data-type="skill"
              ${!isCurrentTurn || hero.skill.usedThisTurn || hero.skill.cost > p.mana ? 'disabled' : ''}>
              ${hero.skill.art}<br><small>${hero.skill.cost}💧</small>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderMinion(m: CardInstance, pid: PlayerID): string {
    const isPlayer = pid === 'player';
    const isCurrentTurn = this.gs.currentPlayer === pid && !this.aiLock;
    const canAttack = isPlayer && isCurrentTurn && !m.exhausted && !m.frozen && m.currentAttack > 0 && m.onBoardTurns > 0;
    const isAttacker = this.sel.mode === 'attacker' && this.sel.attackerInstanceId === m.instanceId;
    const isTargetable = this.sel.mode === 'attacker' && pid !== this.sel.pid;
    const kws = m.keywords ?? [];
    const hasTaunt = kws.includes('taunt');
    const hasStealth = kws.includes('stealth');
    const hasCharge = kws.includes('charge');
    const hasWindfury = kws.includes('windfury');
    const hasDivineShield = m.hasDivineShield;
    const hasLifesteal = kws.includes('lifesteal');
    const hasPoisonous = kws.includes('poisonous');

    const keywordIcons = [
      hasTaunt ? '🛡️' : '',
      hasCharge ? '⚡' : '',
      hasWindfury ? '🌀' : '',
      hasDivineShield ? '✨' : '',
      hasLifesteal ? '🩸' : '',
      hasPoisonous ? '☠️' : '',
      hasStealth ? '🥷' : '',
      m.frozen ? '❄️' : '',
    ].filter(Boolean).join('');

    return `
      <div class="minion ${canAttack ? 'can-attack' : ''} ${m.exhausted ? 'exhausted' : ''}
                        ${isAttacker ? 'selected-attacker' : ''} ${isTargetable ? 'targetable' : ''}
                        ${hasTaunt ? 'has-taunt' : ''} ${hasDivineShield ? 'has-divine' : ''}
                        ${m.frozen ? 'is-frozen' : ''}"
           data-id="${m.instanceId}" data-pid="${pid}"
           title="${m.name}：${m.description}">
        <div class="minion-art">${m.art}</div>
        <div class="minion-name">${m.name}</div>
        <div class="minion-stats">
          <span class="minion-atk">${m.currentAttack}</span>
          <span class="minion-hp ${m.currentHealth < m.maxHealth ? 'damaged' : ''}">${m.currentHealth}</span>
        </div>
        ${keywordIcons ? `<div class="minion-keywords">${keywordIcons}</div>` : ''}
      </div>
    `;
  }

  private renderHandCard(c: CardInstance, idx: number, isPlayerTurn: boolean): string {
    const p = this.gs.players.player;
    const canPlay = isPlayerTurn && c.cost <= p.mana;
    const isSelected = this.sel.mode === 'card' && this.sel.cardHandIndex === idx;

    return `
      <div class="hand-card ${canPlay ? 'playable' : 'unplayable'} ${isSelected ? 'selected-card' : ''}"
           data-hand-index="${idx}">
        <div class="card-cost cost-gem">${c.cost}</div>
        <div class="card-art">${c.art}</div>
        <div class="card-name">${c.name}</div>
        ${c.type === 'minion' ? `
          <div class="card-stats">
            <span class="card-atk">${c.currentAttack}</span>
            <span class="card-hp">${c.currentHealth}</span>
          </div>
        ` : ''}
        <div class="card-desc">${c.description}</div>
        <div class="card-type-badge">${c.type === 'minion' ? '随从' : c.type === 'spell' ? '法术' : '武器'}</div>
      </div>
    `;
  }

  private renderGameOver(): string {
    const won = this.gs.winner === 'player';
    return `
      <div class="game-over-overlay">
        <div class="game-over-modal ${won ? 'victory' : 'defeat'}">
          <div class="game-over-art">${won ? '🏆' : '💀'}</div>
          <div class="game-over-title">${won ? '胜利！' : '失败！'}</div>
          <div class="game-over-sub">${won ? '你击败了对手！' : '英雄阵亡，再接再厉！'}</div>
          <button class="btn-play-again">再来一局</button>
        </div>
      </div>
    `;
  }

  private getSelectionHint(): string {
    if (this.sel.mode === 'card') return '选择一个目标，或点击其他地方取消';
    if (this.sel.mode === 'attacker') return '选择攻击目标，或再次点击取消';
    return '';
  }

  private bindEvents(container: HTMLElement) {
    // End turn
    container.querySelector('#end-turn-btn')?.addEventListener('click', () => {
      if (this.gs.currentPlayer === 'player' && !this.aiLock && this.gs.phase === 'game') {
        this.sel = { mode: 'none' };
        this.onEndTurn();
      }
    });

    // Reset
    container.querySelector('#reset-btn')?.addEventListener('click', () => {
      this.onReset();
    });

    // Play again
    container.querySelector('.btn-play-again')?.addEventListener('click', () => {
      this.onReset();
    });

    // Hand card clicks
    container.querySelectorAll('[data-hand-index]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt((el as HTMLElement).dataset.handIndex!);
        this.onHandCardClick(idx, container);
      });
    });

    // Minion clicks
    container.querySelectorAll('.minion[data-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (el as HTMLElement).dataset.id!;
        const pid = (el as HTMLElement).dataset.pid as PlayerID;
        this.onMinionClick(id, pid, container);
      });
    });

    // Hero clicks
    container.querySelectorAll('[data-type="hero"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = (el as HTMLElement).dataset.pid as PlayerID;
        this.onHeroClick(pid, container);
      });
    });

    // Hero skill
    container.querySelectorAll('[data-type="skill"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = (el as HTMLElement).dataset.pid as PlayerID;
        this.onHeroSkillClick(pid, container);
      });
    });

    // Click anywhere to deselect
    container.addEventListener('click', () => {
      if (this.sel.mode !== 'none') {
        this.sel = { mode: 'none' };
        this.rerender(container);
      }
    });
  }

  private onHandCardClick(idx: number, container: HTMLElement) {
    if (this.gs.currentPlayer !== 'player' || this.aiLock) return;
    const p = this.gs.players.player;
    const card = p.hand[idx];
    if (!card) return;
    if (card.cost > p.mana) { this.gs.log('法力不足！', 'system'); this.rerender(container); return; }

    if (this.sel.mode === 'card' && this.sel.cardHandIndex === idx) {
      // Deselect
      this.sel = { mode: 'none' };
    } else if (card.type === 'minion' || (card.type === 'spell' && !card.effect?.target) || card.type === 'weapon') {
      // No target needed - play immediately
      this.combat.playCard('player', idx);
      this.sel = { mode: 'none' };
    } else {
      // Needs target
      this.sel = { mode: 'card', pid: 'player', cardHandIndex: idx, requiresTarget: true };
    }
    this.rerender(container);
  }

  private onMinionClick(instanceId: string, pid: PlayerID, container: HTMLElement) {
    if (this.gs.currentPlayer !== 'player' || this.aiLock) return;

    // If we have a spell selected that needs a target
    if (this.sel.mode === 'card' && this.sel.requiresTarget) {
      const idx = this.sel.cardHandIndex!;
      this.combat.playCard('player', idx, instanceId, pid);
      this.sel = { mode: 'none' };
      this.rerender(container);
      return;
    }

    // If we have an attacker selected
    if (this.sel.mode === 'attacker') {
      if (pid === 'opponent') {
        // Attack this minion
        this.combat.minionAttack('player', this.sel.attackerInstanceId!, 'opponent', instanceId);
        this.sel = { mode: 'none' };
        this.rerender(container);
        return;
      } else {
        // Clicked own minion - switch attacker
        this.sel = { mode: 'none' };
      }
    }

    // Select own minion as attacker
    if (pid === 'player') {
      const m = this.gs.players.player.board.find(m => m.instanceId === instanceId);
      if (m && !m.exhausted && !m.frozen && m.currentAttack > 0 && m.onBoardTurns > 0) {
        this.sel = { mode: 'attacker', pid: 'player', attackerInstanceId: instanceId };
      }
    }
    this.rerender(container);
  }

  private onHeroClick(pid: PlayerID, container: HTMLElement) {
    if (this.gs.currentPlayer !== 'player' || this.aiLock) return;

    // Spell targeting hero
    if (this.sel.mode === 'card' && this.sel.requiresTarget) {
      const idx = this.sel.cardHandIndex!;
      this.combat.playCard('player', idx, undefined, pid);
      this.sel = { mode: 'none' };
      this.rerender(container);
      return;
    }

    // Attacker targeting enemy hero
    if (this.sel.mode === 'attacker' && pid === 'opponent') {
      if (this.sel.attackerInstanceId) {
        this.combat.minionAttack('player', this.sel.attackerInstanceId, 'opponent');
      } else {
        this.combat.heroAttack('player', 'opponent');
      }
      this.sel = { mode: 'none' };
      this.rerender(container);
      return;
    }

    // Select own hero as attacker
    if (pid === 'player') {
      const hero = this.gs.players.player.hero;
      if (hero.attack > 0 && !hero.exhausted && !hero.frozen) {
        this.sel = { mode: 'attacker', pid: 'player' };
        this.rerender(container);
      }
    }
  }

  private onHeroSkillClick(pid: PlayerID, container: HTMLElement) {
    if (this.gs.currentPlayer !== 'player' || this.aiLock || pid !== 'player') return;
    const hero = this.gs.players.player.hero;
    const skillEff = hero.skill.effect;

    // Skills that need a target
    if (skillEff.type === 'DEAL_DAMAGE') {
      this.gs.log('请选择一个目标使用技能', 'system');
      this.sel = { mode: 'card', pid: 'player', cardHandIndex: -1, requiresTarget: true };
      this.rerender(container);
      return;
    }

    this.combat.useHeroSkill('player');
    this.sel = { mode: 'none' };
    this.rerender(container);
  }

  rerender(container: HTMLElement) {
    const scrollTop = container.querySelector('.battle-log')?.scrollTop ?? 0;
    container.innerHTML = this.render();
    this.bindEvents(container);
    const log = container.querySelector('.battle-log');
    if (log) log.scrollTop = scrollTop;
  }
}
