// src/core/GameState.js
import { Player } from '../models/Player.js';

export class GameState {
  constructor() {
    this.turn = 1;
    this.currentPlayer = 'PLAYER1'; // 'PLAYER1' 或 'PLAYER2'
    this.phase = 'START'; // 'START', 'ACTION', 'END'
    this.players = {};
    this.winner = null;
    this.logs = [];
    this.allCards = [];
    this.allHeroes = [];
    this.battleSystem = null; // 将在Game中设置
  }

  createPlayer(id, heroData) {
    return new Player(id, heroData);
  }

  // 构建随机卡组
  buildRandomDeck() {
    // 按类型分类所有卡牌
    const units = this.allCards.filter(c => c.type === 'unit');
    const spells = this.allCards.filter(c => c.type === 'spell');
    const weapons = this.allCards.filter(c => c.type === 'weapon');
    
    // 目标：20随从 + 8法术 + 2武器（允许±2的偏差）
    const targetUnits = 20;
    const targetSpells = 8;
    const targetWeapons = 2;
    
    // 随机选择卡牌
    const deck = [];
    
    // 选择随从（20张，允许18-22张）
    const unitCount = targetUnits + Math.floor(Math.random() * 5) - 2; // 18-22
    const shuffledUnits = [...units].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(unitCount, shuffledUnits.length); i++) {
      deck.push(shuffledUnits[i].id);
    }
    
    // 选择法术（8张，允许6-10张）
    const spellCount = targetSpells + Math.floor(Math.random() * 5) - 2; // 6-10
    const shuffledSpells = [...spells].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(spellCount, shuffledSpells.length); i++) {
      deck.push(shuffledSpells[i].id);
    }
    
    // 选择武器（2张，允许1-3张）
    const weaponCount = targetWeapons + Math.floor(Math.random() * 3) - 1; // 1-3
    const shuffledWeapons = [...weapons].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(weaponCount, shuffledWeapons.length); i++) {
      deck.push(shuffledWeapons[i].id);
    }
    
    // 如果总数不足30，用随机卡牌填充
    while (deck.length < 30) {
      const allCards = [...units, ...spells, ...weapons];
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      if (randomCard) {
        deck.push(randomCard.id);
      } else {
        break;
      }
    }
    
    // 如果超过30，随机移除
    while (deck.length > 30) {
      deck.splice(Math.floor(Math.random() * deck.length), 1);
    }
    
    return deck;
  }

  // 初始化游戏
  initGame() {
    // 获取英雄数据（双方使用同一英雄配置，均带全反击）
    const heroData = this.allHeroes.find(h => h.id === 'H002') || this.allHeroes[0] || {
      id: 'H001',
      name: '铁壁统帅·岳峙',
      health: 30,
      passive: { type: 'FULL_COUNTER', description: '敌方回合，受到的所有伤害翻倍并反弹给攻击者' },
      skill: {
        name: '铁壁',
        cost: 2,
        description: '消耗2点法力，增加英雄自身2点护甲值',
        effect: {}
      }
    };
    
    // 初始化两个玩家
    this.players.PLAYER1 = this.createPlayer('PLAYER1', heroData);
    this.players.PLAYER2 = this.createPlayer('PLAYER2', heroData);
    
    // 修改对方英雄名称
    this.players.PLAYER2.hero.name = '我是大魔王';
    
    // 处理梅利迪奥斯的初始设置
    for (const playerId of ['PLAYER1', 'PLAYER2']) {
      const player = this.players[playerId];
      const hero = player.hero;
      
      // 如果英雄有护甲，初始化护甲
      if (heroData.armor) {
        hero.maxHealth += heroData.armor;
        hero.health += heroData.armor;
        hero.initialHealth = heroData.health; // 记录基础血量
      }
      
      // 处理战吼：装备武器
      if (heroData.battlecry && heroData.battlecry.type === 'EQUIP_WEAPON') {
        const weaponCard = this.allCards.find(c => c.id === heroData.battlecry.weaponId);
        if (weaponCard) {
          this.battleSystem.equipWeapon(playerId, weaponCard);
          this.log(`${hero.name} 的战吼：装备了 ${weaponCard.name}`);
        }
      }
    }
    
    // 初始化两个玩家的牌库（使用随机卡组）
    for (const playerId of ['PLAYER1', 'PLAYER2']) {
      const player = this.players[playerId];
      const deckCardIds = this.buildRandomDeck();
      
      player.deck = deckCardIds.map(cardId => {
        const cardData = this.allCards.find(c => c.id === cardId);
        if (!cardData) {
          throw new Error(`卡牌 ${cardId} 不存在`);
        }
        const card = { ...cardData, instanceId: `${cardId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
        
        // 如果是单位卡牌，随机分配1-2个关键词
        if (card.type === 'unit') {
          card.keywords = this.randomizeUnitKeywords();
        }
        
        return card;
      });
      
      // 洗牌
      this.shuffleArray(player.deck);
      
      // 抽起始手牌（增加起手牌数）
      const drawCount = playerId === 'PLAYER1' ? 5 : 6;
      for (let i = 0; i < drawCount; i++) {
        if (player.canDrawCard()) {
          this.drawCard(playerId);
        }
      }
      
      // 后手玩家获得幸运币
      if (playerId === 'PLAYER2') {
        player.hand.push({
          id: 'COIN',
          name: '幸运币',
          type: 'spell',
          cost: 0,
          description: '本回合获得1个临时法力水晶',
          spellEffect: {
            type: 'GAIN_MANA',
            value: 1
          },
          instanceId: `COIN_${Date.now()}`
        });
      }
    }
    
    // PLAYER1先手
    this.startTurn('PLAYER1');
    
    this.log('游戏初始化完成！');
  }

  // 开始回合
  startTurn(playerId) {
    this.currentPlayer = playerId;
    this.phase = 'START';
    const player = this.players[playerId];
    
    // 增加法力上限（最高10）
    if (player.mana.total < 10) {
      player.mana.total++;
    }
    
    // 补满法力
    player.mana.current = player.mana.total;
    
    // 重置英雄技能使用状态
    player.hero.skill.usedThisTurn = false;
    
    // 重置分身击杀计数（梅利迪奥斯）
    if (player.hero.cloneKillsThisTurn !== undefined) {
      player.hero.cloneKillsThisTurn = 0;
    }
    
    // 重置单位疲惫状态并增加上场回合数
    player.battlefield.forEach(unit => {
      // 处理下回合无法行动的效果（时间冻结/恐惧效果）
      if (unit.nextTurnCannotAct) {
        unit.exhausted = true; // 设置为疲惫，无法攻击
        unit.nextTurnCannotAct = false; // 清除标记（只持续一回合）
        this.log(`${unit.card.name} 本回合无法行动（时间冻结效果）`);
      } else if (unit.frozen) {
        // 处理冰冻效果（冰冻状态在回合开始时解除，但会阻止本回合攻击）
        unit.exhausted = true; // 冰冻单位本回合无法攻击
        unit.frozen = false; // 解除冰冻状态
        this.log(`${unit.card.name} 解除了冰冻`);
      } else {
        // 只有在没有被时间冻结效果标记且没有被冰冻时，才重置疲惫状态
        unit.exhausted = false;
      }
      
      // 处理火焰效果
      if (unit.fireEffect) {
        // 减少持续时间
        unit.fireEffect.turns--;
        
        if (unit.shield > 0) {
          unit.shield = Math.max(0, unit.shield - unit.fireEffect.damage);
          this.log(`${unit.card.name} 的护盾被火焰烧毁 ${unit.fireEffect.damage} 点`);
        } else if (unit.maxHealth > unit.card.health) {
          // 降低额外护甲
          const armorLoss = Math.min(unit.maxHealth - unit.card.health, unit.fireEffect.damage);
          unit.maxHealth -= armorLoss;
          unit.currentHealth = Math.min(unit.currentHealth, unit.maxHealth);
          this.log(`${unit.card.name} 的护甲被火焰烧毁 ${armorLoss} 点`);
        } else {
          // 没有护甲，直接掉血
          unit.currentHealth = Math.max(0, unit.currentHealth - unit.fireEffect.damage);
          this.log(`${unit.card.name} 受到火焰伤害 ${unit.fireEffect.damage} 点`);
        }
        
        // 如果持续时间结束，移除效果
        if (unit.fireEffect.turns <= 0) {
          this.log(`${unit.card.name} 的火焰效果结束`);
          unit.fireEffect = null;
        }
      }
      
      // 处理雷特效（减少持续时间）
      if (unit.thunderEffect) {
        unit.thunderEffect.turns--;
        if (unit.thunderEffect.turns <= 0) {
          this.log(`${unit.card.name} 的雷特效结束`);
          unit.thunderEffect = null;
        }
      }
      
      // 处理毒特效（法术伤害，使用法术护盾抵挡）
      if (unit.poisonEffect) {
        // 毒伤：每回合掉1-2点随机伤害
        let poisonDamage = Math.floor(Math.random() * 2) + 1; // 1-2点随机伤害
        
        // 法术护盾可以抵挡毒伤
        if (unit.spellShield > 0) {
          const blocked = Math.min(unit.spellShield, poisonDamage);
          unit.spellShield -= blocked;
          poisonDamage -= blocked;
          if (blocked > 0) {
            this.log(`${unit.card.name} 的法术护盾抵挡了 ${blocked} 点毒伤`);
          }
        }
        
        if (poisonDamage > 0) {
          unit.currentHealth = Math.max(0, unit.currentHealth - poisonDamage);
          this.log(`${unit.card.name} 受到毒伤 ${poisonDamage} 点`);
        }
        
        unit.poisonEffect.turns--;
        if (unit.poisonEffect.turns <= 0) {
          this.log(`${unit.card.name} 的毒效果结束`);
          unit.poisonEffect = null;
        } else {
          this.log(`${unit.card.name} 中毒，剩余 ${unit.poisonEffect.turns} 回合`);
        }
        
        // 检查是否死亡
        if (unit.currentHealth <= 0) {
          this.log(`${unit.card.name} 被毒死`);
          this.battleSystem.killUnit(unit, player);
        }
        }
      
      unit.onBoardTurns++;
    });
    
    // 重置英雄攻击状态（除非被冰冻）
    if (player.hero.frozen) {
      player.hero.exhausted = true; // 冰冻英雄本回合无法攻击
      player.hero.frozen = false; // 解除冰冻状态
      this.log(`${player.hero.name} 解除了冰冻`);
    } else {
      player.hero.exhausted = false;
    }
    
    // 处理英雄的持续效果
    if (player.hero.frozen) {
      player.hero.frozen = false;
      this.log(`${player.hero.name} 解除了冰冻`);
    }
    
    if (player.hero.fireEffect) {
      // 减少持续时间
      player.hero.fireEffect.turns--;
      
      // 火焰是法术伤害，使用法术护盾抵挡，无视普通护盾和护甲
      let remainingDamage = player.hero.fireEffect.damage;
      
      if (player.hero.spellShield > 0) {
        const blocked = Math.min(player.hero.spellShield, remainingDamage);
        player.hero.spellShield -= blocked;
        remainingDamage -= blocked;
        if (blocked > 0) {
          this.log(`${player.hero.name} 的法术护盾抵挡了 ${blocked} 点火焰伤害`);
        }
      }
      
      // 法术伤害直接减少生命值（无视护甲）
      if (remainingDamage > 0) {
        player.hero.health = Math.max(0, player.hero.health - remainingDamage);
        this.log(`${player.hero.name} 受到火焰伤害 ${remainingDamage} 点`);
      }
      
      // 如果持续时间结束，移除效果
      if (player.hero.fireEffect.turns <= 0) {
        this.log(`${player.hero.name} 的火焰效果结束`);
        player.hero.fireEffect = null;
      }
    }
    
    // 处理雷特效（减少持续时间）
    if (player.hero.thunderEffect) {
      player.hero.thunderEffect.turns--;
      if (player.hero.thunderEffect.turns <= 0) {
        this.log(`${player.hero.name} 的雷特效结束`);
        player.hero.thunderEffect = null;
      }
    }
    
    if (player.hero.poisonEffect) {
      // 毒伤：每回合掉1-2点随机伤害（法术伤害，使用法术护盾抵挡）
      let poisonDamage = Math.floor(Math.random() * 2) + 1; // 1-2点随机伤害
      
      // 法术护盾可以抵挡毒伤
      if (player.hero.spellShield > 0) {
        const blocked = Math.min(player.hero.spellShield, poisonDamage);
        player.hero.spellShield -= blocked;
        poisonDamage -= blocked;
        if (blocked > 0) {
          this.log(`${player.hero.name} 的法术护盾抵挡了 ${blocked} 点毒伤`);
        }
      }
      
      // 法术伤害直接减少生命值（无视护甲）
      if (poisonDamage > 0) {
        player.hero.health = Math.max(0, player.hero.health - poisonDamage);
        this.log(`${player.hero.name} 受到毒伤 ${poisonDamage} 点`);
      }
      
      player.hero.poisonEffect.turns--;
      if (player.hero.poisonEffect.turns <= 0) {
        this.log(`${player.hero.name} 的毒效果结束`);
        player.hero.poisonEffect = null;
      } else {
        this.log(`${player.hero.name} 中毒，剩余 ${player.hero.poisonEffect.turns} 回合`);
      }
      
      // 检查是否死亡
      if (player.hero.health <= 0) {
        this.log(`${player.hero.name} 死亡`);
        this.checkDeath();
      }
    }
    
    // 更新单位buff
    player.battlefield.forEach(unit => {
      if (unit.updateBuffs) {
        unit.updateBuffs();
      }
    });
    
    // 更新光环效果
    if (this.battleSystem && this.battleSystem.updateAuras) {
      this.battleSystem.updateAuras();
    }
    
    // 抽牌
    if (player.canDrawCard()) {
      // 随机卡组不再需要强制抽特定卡牌
      this.drawCard(playerId);
    }
    
    // 更新英雄技能状态（循环切换）
    this.updateHeroSkillState(playerId);
    
    this.phase = 'ACTION';
    this.log(`${playerId} 的回合开始，获得 ${player.mana.total} 点法力`);
  }

  // 结束回合
  endTurn() {
    this.phase = 'END';
    
    // 移除临时效果
    this.clearTemporaryEffects();
    
    // 切换玩家
    const nextPlayer = this.currentPlayer === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
    this.turn++;
    this.startTurn(nextPlayer);
    
    // 如果是AI回合，触发AI行动
    if (nextPlayer === 'PLAYER2' && this.aiController) {
      const renderer = this.renderer;
      this.aiController.playTurn(renderer).then(() => {
        // AI回合结束后重新渲染
        if (this.onAITurnComplete) {
          this.onAITurnComplete();
        }
      });
    }
  }

  // 抽牌
  drawCard(playerId) {
    const player = this.players[playerId];
    if (player.deck.length === 0) {
      // 疲劳伤害
      const fatigueDamage = player.fatigueDamage || 1;
      player.hero.health -= fatigueDamage;
      player.fatigueDamage = fatigueDamage + 1;
      this.log(`${playerId} 牌库已空，受到 ${fatigueDamage} 点疲劳伤害！`);
      this.checkDeath();
      return null;
    }
    
    const card = player.deck.shift();
    if (player.canDrawCard()) {
      player.hand.push(card);
      this.log(`${playerId} 抽到了 ${card.name}`);
      return card;
    } else {
      // 手牌已满，卡牌被烧掉
      this.log(`${playerId} 手牌已满，${card.name} 被烧掉`);
      return null;
    }
  }

  // 随机分配单位关键词（1-2个）
  randomizeUnitKeywords() {
    const allKeywords = ['CHARGE', 'PIERCE_1'];
    const numKeywords = Math.floor(Math.random() * 2) + 1; // 1-2个关键词
    const shuffled = [...allKeywords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numKeywords);
  }

  // 检查游戏结束
  checkDeath() {
    for (const [playerId, player] of Object.entries(this.players)) {
      if (player.hero.health <= 0) {
        this.winner = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
        this.log(`游戏结束！${this.winner} 获胜！`);
        this.phase = 'ENDED';
        return true;
      }
    }
    return false;
  }

  // 更新英雄技能状态（简化：不再循环切换）
  updateHeroSkillState(playerId) {
    const player = this.players[playerId];
    if (!player || !player.hero || !player.hero.skill) return;
    
    // 简化技能：固定为增加2点护甲
    player.hero.skill.description = '消耗2点法力，增加英雄自身2点护甲值';
    player.hero.skill.skillState = 0; // 固定状态
  }
  
  // 工具方法
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  log(message) {
    const logMessage = `[回合${this.turn}] ${message}`;
    this.logs.push(logMessage);
    console.log(logMessage);
  }

  clearTemporaryEffects() {
    // 清除所有玩家的临时效果
    for (const player of Object.values(this.players)) {
      for (const unit of player.battlefield) {
        // 移除临时关键词
        unit.keywords = unit.keywords.filter(kw => !kw.startsWith('TEMP_'));
      }
    }
  }
}
