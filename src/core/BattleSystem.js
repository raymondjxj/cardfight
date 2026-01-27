// src/core/BattleSystem.js
import { Unit } from '../models/Unit.js';
import { Card } from '../models/Card.js';
import { AuraManager } from '../core/AuraManager.js';

export class BattleSystem {
  constructor(gameState) {
    this.gameState = gameState;
    this.auraManager = new AuraManager(gameState);
  }
  
  // 更新光环效果
  updateAuras() {
    this.auraManager.updateAuras();
  }
  
  // 使用卡牌
  playCard(playerId, cardIndex, targetPosition = null) {
    // #region agent log
    const logData1 = {location:'BattleSystem.js:18',message:'playCard entry',data:{playerId,cardIndex,targetPosition},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E'};
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData1)}).catch(()=>{});
    console.log('🔍 [DEBUG]', logData1);
    // #endregion
    const player = this.gameState.players[playerId];
    const card = player.hand[cardIndex];
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:22',message:'card check',data:{cardExists:!!card,cardName:card?.name,cardType:card?.type,cardAura:card?.aura,handSize:player.hand.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C,G'})}).catch(()=>{});
    // #endregion
    
    if (!card) {
      this.gameState.log('无效的卡牌索引');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:25',message:'playCard failed - no card',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return false;
    }
    
    // 检查法力
    if (player.mana.current < card.cost) {
      this.gameState.log(`法力不足，需要 ${card.cost} 点法力，当前 ${player.mana.current} 点`);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:30',message:'playCard failed - insufficient mana',data:{cardCost:card.cost,currentMana:player.mana.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return false;
    }
    
    // 消耗法力
    player.mana.current -= card.cost;
    
    // 从手牌移除
    player.hand.splice(cardIndex, 1);
    
    // 处理卡牌效果
    if (card.type === 'unit') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:41',message:'calling playUnit',data:{cardName:card.name,cardAura:card.aura,targetPosition},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C'})}).catch(()=>{});
      // #endregion
      const result = this.playUnit(playerId, card, targetPosition);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:43',message:'playUnit result',data:{result,cardName:card.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return result;
    } else if (card.type === 'spell') {
      return this.playSpell(playerId, card, targetPosition);
    } else if (card.type === 'weapon') {
      return this.equipWeapon(playerId, card);
    }
    
    this.gameState.log(`${playerId} 使用了 ${card.name}`);
    return true;
  }
  
  // 放置单位
  playUnit(playerId, card, position) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:53',message:'playUnit entry',data:{playerId,cardName:card.name,cardAura:card.aura,position,battlefieldLength:this.gameState.players[playerId].battlefield.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C,D'})}).catch(()=>{});
    // #endregion
    const player = this.gameState.players[playerId];
    
    // 检查战场是否已满（每方最多3个单位）
    if (!player.canPlayUnit()) {
      this.gameState.log('战场已满，无法放置更多单位');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:59',message:'playUnit failed - battlefield full',data:{battlefieldLength:player.battlefield.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return false;
    }
    
    // 创建单位实例
    const unit = new Unit(card, playerId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:64',message:'unit created',data:{unitId:unit.id,unitCardName:unit.card.name,unitCardAura:unit.card.aura},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    unit.position = position !== null ? position : this.findEmptyPosition(player);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:65',message:'position assigned',data:{position:unit.position,requestedPosition:position},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // 检查冲锋关键词
    if (unit.keywords.some(kw => kw.includes('CHARGE'))) {
      unit.exhausted = false;
    }
    
    // 处理护盾关键词
    unit.keywords.forEach(keyword => {
      if (keyword.startsWith('SHIELD_')) {
        const shieldValue = parseInt(keyword.split('_')[1]) || 0;
        unit.shield = shieldValue;
      } else if (keyword.startsWith('SPELL_SHIELD_')) {
        const spellShieldValue = parseInt(keyword.split('_')[2]) || 0;
        unit.spellShield = spellShieldValue;
      } else if (keyword === 'SHIELD') {
        // 默认护盾值（如果没有指定数值）
        unit.shield = 1;
      } else if (keyword === 'SPELL_SHIELD') {
        // 默认法术护盾值
        unit.spellShield = 1;
      }
    });
    
    // 放置到战场
    player.battlefield.push(unit);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:89',message:'unit pushed to battlefield',data:{battlefieldLength:player.battlefield.length,unitId:unit.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // 触发战吼
    if (card.battlecry) {
      this.resolveBattlecry(card.battlecry, playerId, unit);
    }
    
    // 更新光环效果（确保新上场的单位能正确应用光环）
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:97',message:'calling updateAuras',data:{battlefieldLength:player.battlefield.length,unitCardAura:unit.card.aura},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      this.updateAuras();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:99',message:'updateAuras completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:101',message:'updateAuras error',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      throw error;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:105',message:'playUnit success',data:{unitId:unit.id,battlefieldLength:player.battlefield.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return true;
  }
  
  // 施放法术
  playSpell(playerId, card, target) {
    if (!card.spellEffect) {
      this.gameState.log(`法术 ${card.name} 没有效果`);
      return false;
    }
    
    switch (card.spellEffect.type) {
      case 'DRAW_CARD':
        for (let i = 0; i < card.spellEffect.value; i++) {
          this.gameState.drawCard(playerId);
        }
        break;
        
      case 'BUFF_ADJACENT':
        this.buffAdjacentUnits(playerId, card.spellEffect);
        break;
        
      case 'BUFF_TARGET':
        this.buffTargetUnit(playerId, target, card.spellEffect);
        break;
        
      case 'AOE_DAMAGE':
        this.dealAoeDamage(playerId, card.spellEffect);
        break;
        
      case 'GAIN_MANA':
        this.gainMana(playerId, card.spellEffect.value);
        break;
        
      case 'ADD_SHIELD':
        this.addShieldToTarget(playerId, target, card.spellEffect);
        break;
        
      case 'ADD_DIVINE_SHIELD':
        this.addDivineShieldToTarget(playerId, target);
        break;
        
      case 'DISCOVER':
        this.discoverCard(playerId);
        break;
        
      case 'BUFF_ATTACK':
        if (target === 'hero' || target === 'HERO') {
          // 对英雄增加攻击力（通过武器）
          const player = this.gameState.players[playerId];
          if (player.hero.weapon) {
            player.hero.weapon.attack = (player.hero.weapon.attack || 0) + card.spellEffect.value;
            player.hero.attack = player.hero.weapon.attack;
            this.gameState.log(`${player.hero.name} 的武器攻击力增加了 ${card.spellEffect.value} 点`);
          } else {
            this.gameState.log(`${player.hero.name} 没有武器，无法增加攻击力`);
          }
        } else {
          this.buffUnitAttack(playerId, target, card.spellEffect.value);
        }
        break;
        
      case 'BUFF_HEALTH':
        if (target === 'hero' || target === 'HERO') {
          // 对英雄增加生命值上限
          const player = this.gameState.players[playerId];
          player.hero.maxHealth += card.spellEffect.value;
          player.hero.health += card.spellEffect.value;
          this.gameState.log(`${player.hero.name} 的生命值上限增加了 ${card.spellEffect.value} 点`);
        } else {
          this.buffUnitHealth(playerId, target, card.spellEffect.value);
        }
        break;
        
      case 'BUFF_STATS':
        if (target === 'hero' || target === 'HERO') {
          // 对英雄增加属性
          const player = this.gameState.players[playerId];
          if (card.spellEffect.attack && player.hero.weapon) {
            player.hero.weapon.attack = (player.hero.weapon.attack || 0) + card.spellEffect.attack;
            player.hero.attack = player.hero.weapon.attack;
          }
          if (card.spellEffect.health) {
            player.hero.maxHealth += card.spellEffect.health;
            player.hero.health += card.spellEffect.health;
          }
          this.gameState.log(`${player.hero.name} 获得了+${card.spellEffect.attack || 0}/+${card.spellEffect.health || 0}的增益`);
        } else {
          this.buffUnitStats(playerId, target, card.spellEffect);
        }
        break;
        
      case 'BUFF_HERO_ARMOR':
        this.buffHeroArmor(playerId, card.spellEffect.value, card.spellEffect.drawCard || 0);
        break;
        
      case 'DAMAGE_WITH_FREEZE':
        this.damageWithFreeze(playerId, target, card.spellEffect);
        break;
        
      case 'DAMAGE_WITH_THUNDER':
        this.damageWithThunder(playerId, target, card.spellEffect);
        break;
        
      case 'DAMAGE_WITH_FIRE':
        this.damageWithFire(playerId, target, card.spellEffect);
        break;
        
      case 'DAMAGE_WITH_POISON':
        this.damageWithPoison(playerId, target, card.spellEffect);
        break;
        
      case 'AOE_DAMAGE_WITH_FREEZE':
        this.aoeDamageWithFreeze(playerId, card.spellEffect);
        break;
        
      case 'AOE_DAMAGE_WITH_THUNDER':
        this.aoeDamageWithThunder(playerId, card.spellEffect);
        break;
    }
    
    this.gameState.log(`${playerId} 使用了 ${card.name}`);
    return true;
  }
  
  // 造成伤害并冰冻
  damageWithFreeze(playerId, target, effect) {
    const player = this.gameState.players[playerId];
    
    // 确定目标玩家（支持选择双方英雄）
    let targetPlayer = null;
    if (target === 'hero' || target === 'HERO') {
      // 默认攻击敌方英雄
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      targetPlayer = this.gameState.players[opponentId];
    } else if (target === 'PLAYER1' || target === 'PLAYER2') {
      // 如果target是'PLAYER1'或'PLAYER2'，表示选择该玩家的英雄
      targetPlayer = this.gameState.players[target];
    } else {
      // 默认攻击敌方
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      targetPlayer = this.gameState.players[opponentId];
    }
    
    if (target === 'hero' || target === 'HERO' || target === 'PLAYER1' || target === 'PLAYER2') {
      // 对英雄造成法术伤害并冰冻（法术伤害无视护甲）
      // 先检查法术护盾
      let remainingDamage = effect.damage;
      if (targetPlayer.hero.spellShield > 0) {
        const blocked = Math.min(targetPlayer.hero.spellShield, remainingDamage);
        targetPlayer.hero.spellShield -= blocked;
        remainingDamage -= blocked;
        if (blocked > 0) {
          this.gameState.log(`${targetPlayer.hero.name} 的法术护盾抵挡了 ${blocked} 点伤害`);
        }
      }
      
      // 法术伤害直接减少生命值（无视护甲）
      if (remainingDamage > 0) {
        targetPlayer.hero.health = Math.max(0, targetPlayer.hero.health - remainingDamage);
        targetPlayer.hero.frozen = true;
        this.gameState.log(`寒冰箭对 ${targetPlayer.hero.name} 造成 ${remainingDamage} 点伤害并冰冻`);
        
        // 显示特效
        if (this.gameState.renderer && this.gameState.renderer.showWeaponEffect) {
          this.gameState.renderer.showWeaponEffect('FREEZE', targetPlayer.hero, targetPlayer, true);
        }
      }
    } else {
      // 对单位造成法术伤害并冰冻
      // 确定目标玩家（单位目标）
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      const opponent = this.gameState.players[opponentId];
      
      const unitIndex = typeof target === 'number' ? target : parseInt(target);
      if (unitIndex >= 0 && unitIndex < opponent.battlefield.length) {
        const unit = opponent.battlefield[unitIndex];
        // 应用法术护盾
        let remainingDamage = effect.damage;
        if (unit.spellShield > 0) {
          const blocked = Math.min(unit.spellShield, remainingDamage);
          unit.spellShield -= blocked;
          remainingDamage -= blocked;
          if (blocked > 0) {
            this.gameState.log(`${unit.card.name} 的法术护盾抵挡了 ${blocked} 点伤害`);
          }
        }
        
        // 造成伤害
        if (remainingDamage > 0) {
          unit.currentHealth = Math.max(0, unit.currentHealth - remainingDamage);
          unit.frozen = true;
          this.gameState.log(`寒冰箭对 ${unit.card.name} 造成 ${remainingDamage} 点伤害并冰冻`);
          
          // 显示特效
          if (this.gameState.renderer && this.gameState.renderer.showWeaponEffect) {
            this.gameState.renderer.showWeaponEffect('FREEZE', unit, opponent, false);
          }
          
          if (unit.currentHealth <= 0) {
            this.killUnit(unit, opponent);
          }
        }
      }
    }
  }
  
  // 造成伤害并附加雷特效
  damageWithThunder(playerId, target, effect) {
    const player = this.gameState.players[playerId];
    const duration = effect.duration || 3;
    
    // 确定目标玩家（支持选择双方英雄）
    let targetPlayer = null;
    if (target === 'hero' || target === 'HERO') {
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      targetPlayer = this.gameState.players[opponentId];
    } else if (target === 'PLAYER1' || target === 'PLAYER2') {
      targetPlayer = this.gameState.players[target];
    } else {
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      targetPlayer = this.gameState.players[opponentId];
    }
    
    if (target === 'hero' || target === 'HERO' || target === 'PLAYER1' || target === 'PLAYER2') {
      // 对英雄造成法术伤害并附加雷特效（法术伤害无视护甲）
      // 先检查法术护盾
      let remainingDamage = effect.damage;
      if (targetPlayer.hero.spellShield > 0) {
        const blocked = Math.min(targetPlayer.hero.spellShield, remainingDamage);
        targetPlayer.hero.spellShield -= blocked;
        remainingDamage -= blocked;
        if (blocked > 0) {
          this.gameState.log(`${targetPlayer.hero.name} 的法术护盾抵挡了 ${blocked} 点伤害`);
        }
      }
      
      // 法术伤害直接减少生命值（无视护甲）
      if (remainingDamage > 0) {
        targetPlayer.hero.health = Math.max(0, targetPlayer.hero.health - remainingDamage);
        targetPlayer.hero.thunderEffect = { turns: duration, bonus: 1 };
        this.gameState.log(`闪电箭对 ${targetPlayer.hero.name} 造成 ${remainingDamage} 点伤害并附加雷特效（持续${duration}回合）`);
        
        // 显示特效
        if (this.gameState.renderer && this.gameState.renderer.showWeaponEffect) {
          this.gameState.renderer.showWeaponEffect('THUNDER', targetPlayer.hero, targetPlayer, true);
        }
      }
    } else {
      // 对单位造成法术伤害并附加雷特效
      // 确定目标玩家（单位目标）
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      const opponent = this.gameState.players[opponentId];
      
      const unitIndex = typeof target === 'number' ? target : parseInt(target);
      if (unitIndex >= 0 && unitIndex < opponent.battlefield.length) {
        const unit = opponent.battlefield[unitIndex];
        // 应用法术护盾
        let remainingDamage = effect.damage;
        if (unit.spellShield > 0) {
          const blocked = Math.min(unit.spellShield, remainingDamage);
          unit.spellShield -= blocked;
          remainingDamage -= blocked;
          if (blocked > 0) {
            this.gameState.log(`${unit.card.name} 的法术护盾抵挡了 ${blocked} 点伤害`);
          }
        }
        
        // 造成伤害
        if (remainingDamage > 0) {
          unit.currentHealth = Math.max(0, unit.currentHealth - remainingDamage);
          unit.thunderEffect = { turns: duration, bonus: 1 };
          this.gameState.log(`闪电箭对 ${unit.card.name} 造成 ${remainingDamage} 点伤害并附加雷特效（持续${duration}回合）`);
          
          // 显示特效
          if (this.gameState.renderer && this.gameState.renderer.showWeaponEffect) {
            this.gameState.renderer.showWeaponEffect('THUNDER', unit, opponent, false);
          }
          
          if (unit.currentHealth <= 0) {
            this.killUnit(unit, opponent);
          }
        }
      }
    }
  }
  
  // 造成伤害并附加火焰效果
  damageWithFire(playerId, target, effect) {
    const player = this.gameState.players[playerId];
    const duration = effect.duration || 3;
    
    // 确定目标玩家（支持选择双方英雄）
    let targetPlayer = null;
    if (target === 'hero' || target === 'HERO') {
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      targetPlayer = this.gameState.players[opponentId];
    } else if (target === 'PLAYER1' || target === 'PLAYER2') {
      targetPlayer = this.gameState.players[target];
    } else {
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      targetPlayer = this.gameState.players[opponentId];
    }
    
    if (target === 'hero' || target === 'HERO' || target === 'PLAYER1' || target === 'PLAYER2') {
      // 对英雄造成法术伤害并附加火焰效果（法术伤害无视护甲）
      // 先检查法术护盾
      let remainingDamage = effect.damage;
      if (targetPlayer.hero.spellShield > 0) {
        const blocked = Math.min(targetPlayer.hero.spellShield, remainingDamage);
        targetPlayer.hero.spellShield -= blocked;
        remainingDamage -= blocked;
        if (blocked > 0) {
          this.gameState.log(`${targetPlayer.hero.name} 的法术护盾抵挡了 ${blocked} 点伤害`);
        }
      }
      
      // 法术伤害直接减少生命值（无视护甲）
      if (remainingDamage > 0) {
        targetPlayer.hero.health = Math.max(0, targetPlayer.hero.health - remainingDamage);
        targetPlayer.hero.fireEffect = { turns: duration, damage: 1 };
        this.gameState.log(`火球术对 ${targetPlayer.hero.name} 造成 ${remainingDamage} 点伤害并附加火焰效果（持续${duration}回合）`);
        
        // 显示特效
        if (this.gameState.renderer && this.gameState.renderer.showWeaponEffect) {
          this.gameState.renderer.showWeaponEffect('FIRE', targetPlayer.hero, targetPlayer, true);
        }
      }
    } else {
      // 对单位造成法术伤害并附加火焰效果
      // 确定目标玩家（单位目标）
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      const opponent = this.gameState.players[opponentId];
      
      const unitIndex = typeof target === 'number' ? target : parseInt(target);
      if (unitIndex >= 0 && unitIndex < opponent.battlefield.length) {
        const unit = opponent.battlefield[unitIndex];
        // 应用法术护盾
        let remainingDamage = effect.damage;
        if (unit.spellShield > 0) {
          const blocked = Math.min(unit.spellShield, remainingDamage);
          unit.spellShield -= blocked;
          remainingDamage -= blocked;
          if (blocked > 0) {
            this.gameState.log(`${unit.card.name} 的法术护盾抵挡了 ${blocked} 点伤害`);
          }
        }
        
        // 造成伤害
        if (remainingDamage > 0) {
          unit.currentHealth = Math.max(0, unit.currentHealth - remainingDamage);
          unit.fireEffect = { turns: duration, damage: 1 };
          this.gameState.log(`火球术对 ${unit.card.name} 造成 ${remainingDamage} 点伤害并附加火焰效果（持续${duration}回合）`);
          
          // 显示特效
          if (this.gameState.renderer && this.gameState.renderer.showWeaponEffect) {
            this.gameState.renderer.showWeaponEffect('FIRE', unit, opponent, false);
          }
          
          if (unit.currentHealth <= 0) {
            this.killUnit(unit, opponent);
          }
        }
      }
    }
  }
  
  // 造成伤害并附加剧毒
  damageWithPoison(playerId, target, effect) {
    const player = this.gameState.players[playerId];
    
    // 确定目标玩家（支持选择双方英雄）
    let targetPlayer = null;
    if (target === 'hero' || target === 'HERO') {
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      targetPlayer = this.gameState.players[opponentId];
    } else if (target === 'PLAYER1' || target === 'PLAYER2') {
      targetPlayer = this.gameState.players[target];
    } else {
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      targetPlayer = this.gameState.players[opponentId];
    }
    
    if (target === 'hero' || target === 'HERO' || target === 'PLAYER1' || target === 'PLAYER2') {
      // 对英雄造成法术伤害并附加剧毒（法术伤害无视护甲）
      // 先检查法术护盾
      let remainingDamage = effect.damage;
      if (targetPlayer.hero.spellShield > 0) {
        const blocked = Math.min(targetPlayer.hero.spellShield, remainingDamage);
        targetPlayer.hero.spellShield -= blocked;
        remainingDamage -= blocked;
        if (blocked > 0) {
          this.gameState.log(`${targetPlayer.hero.name} 的法术护盾抵挡了 ${blocked} 点伤害`);
        }
      }
      
      // 法术伤害直接减少生命值（无视护甲）
      if (remainingDamage > 0) {
        targetPlayer.hero.health = Math.max(0, targetPlayer.hero.health - remainingDamage);
        targetPlayer.hero.poisonEffect = { turns: 3 }; // 改为持续3回合
        this.gameState.log(`剧毒箭对 ${targetPlayer.hero.name} 造成 ${remainingDamage} 点伤害并附加剧毒（持续3回合，每回合掉1-2点血）`);
        
        // 显示特效
        if (this.gameState.renderer && this.gameState.renderer.showWeaponEffect) {
          this.gameState.renderer.showWeaponEffect('POISON', targetPlayer.hero, targetPlayer, true);
        }
      }
    } else {
      // 对单位造成法术伤害并附加剧毒
      // 确定目标玩家（单位目标）
      const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
      const opponent = this.gameState.players[opponentId];
      
      const unitIndex = typeof target === 'number' ? target : parseInt(target);
      if (unitIndex >= 0 && unitIndex < opponent.battlefield.length) {
        const unit = opponent.battlefield[unitIndex];
        // 应用法术护盾
        let remainingDamage = effect.damage;
        if (unit.spellShield > 0) {
          const blocked = Math.min(unit.spellShield, remainingDamage);
          unit.spellShield -= blocked;
          remainingDamage -= blocked;
          if (blocked > 0) {
            this.gameState.log(`${unit.card.name} 的法术护盾抵挡了 ${blocked} 点伤害`);
          }
        }
        
        // 造成伤害
        if (remainingDamage > 0) {
          unit.currentHealth = Math.max(0, unit.currentHealth - remainingDamage);
          unit.poisonEffect = { turns: 3 }; // 改为持续3回合
          this.gameState.log(`剧毒箭对 ${unit.card.name} 造成 ${remainingDamage} 点伤害并附加剧毒（持续3回合，每回合掉1-2点血）`);
          
          // 显示特效
          if (this.gameState.renderer && this.gameState.renderer.showWeaponEffect) {
            this.gameState.renderer.showWeaponEffect('POISON', unit, opponent, false);
          }
          
          if (unit.currentHealth <= 0) {
            this.killUnit(unit, opponent);
          }
        }
      }
    }
  }
  
  // AOE伤害并冰冻
  aoeDamageWithFreeze(playerId, effect) {
    const player = this.gameState.players[playerId];
    const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
    const opponent = this.gameState.players[opponentId];
    
    // 显示冰冻AOE特效
    if (this.gameState.renderer && this.gameState.renderer.showAoeEffect) {
      this.gameState.renderer.showAoeEffect('FREEZE', opponentId);
    }
    
    opponent.battlefield.forEach(unit => {
      // 应用法术护盾
      let remainingDamage = effect.damage;
      if (unit.spellShield > 0) {
        const blocked = Math.min(unit.spellShield, remainingDamage);
        unit.spellShield -= blocked;
        remainingDamage -= blocked;
      }
      
      // 造成伤害
      unit.currentHealth = Math.max(0, unit.currentHealth - remainingDamage);
      // 冰冻
      unit.frozen = true;
      
      this.gameState.log(`寒冰风暴对 ${unit.card.name} 造成 ${remainingDamage} 点伤害并冰冻`);
      
      if (unit.currentHealth <= 0) {
        this.killUnit(unit, opponent);
      }
    });
  }
  
  // AOE伤害并附加雷特效
  aoeDamageWithThunder(playerId, effect) {
    const player = this.gameState.players[playerId];
    const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
    const opponent = this.gameState.players[opponentId];
    const duration = effect.duration || 4;
    
    // 显示雷电AOE特效
    if (this.gameState.renderer && this.gameState.renderer.showAoeEffect) {
      this.gameState.renderer.showAoeEffect('THUNDER', opponentId);
    }
    
    opponent.battlefield.forEach(unit => {
      // 应用法术护盾
      let remainingDamage = effect.damage;
      if (unit.spellShield > 0) {
        const blocked = Math.min(unit.spellShield, remainingDamage);
        unit.spellShield -= blocked;
        remainingDamage -= blocked;
      }
      
      // 造成伤害
      unit.currentHealth = Math.max(0, unit.currentHealth - remainingDamage);
      // 附加雷特效
      unit.thunderEffect = { turns: duration, bonus: 1 };
      
      this.gameState.log(`雷暴对 ${unit.card.name} 造成 ${remainingDamage} 点伤害并附加雷特效（持续${duration}回合）`);
      
      if (unit.currentHealth <= 0) {
        this.killUnit(unit, opponent);
      }
    });
  }
  
  // 单位攻击
  unitAttack(playerId, unitIndex, targetPlayerId, targetIndex) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:109',message:'unitAttack entry',data:{playerId,unitIndex,targetPlayerId,targetIndex,targetIndexType:typeof targetIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.log('🔥 unitAttack 被调用:', { playerId, unitIndex, targetPlayerId, targetIndex, targetIndexType: typeof targetIndex });
    
    const attackerPlayer = this.gameState.players[playerId];
    const targetPlayer = this.gameState.players[targetPlayerId];
    
    if (!attackerPlayer || !targetPlayer) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:115',message:'unitAttack player missing',data:{hasAttackerPlayer:!!attackerPlayer,hasTargetPlayer:!!targetPlayer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('❌ 玩家不存在:', { playerId, targetPlayerId });
      this.gameState.log('攻击目标无效：玩家不存在');
      return false;
    }
    
    const attacker = attackerPlayer.battlefield[unitIndex];
    if (!attacker) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:122',message:'unitAttack attacker missing',data:{unitIndex,battlefieldLength:attackerPlayer.battlefield.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('❌ 攻击者不存在，索引:', unitIndex, '战场单位数:', attackerPlayer.battlefield.length);
      this.gameState.log('攻击者不存在');
      return false;
    }
    
    console.log('攻击者:', { name: attacker.card.name, attack: attacker.attack, exhausted: attacker.exhausted });
    
    // 修复1: 确保 targetIndex 类型正确
    const isHeroTarget = targetIndex === 'hero' || targetIndex === 'HERO';
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:688',message:'unitAttack target determination',data:{targetIndex,targetIndexType:typeof targetIndex,isHeroTarget,targetBattlefieldLength:targetPlayer.battlefield.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    let target;
    let targetIdx;
    
    // 确定目标
    if (isHeroTarget) {
      target = targetPlayer.hero;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:695',message:'unitAttack hero target',data:{targetName:target.name,targetHealth:target.health},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.log('目标：英雄', { name: target.name, health: target.health });
    } else {
      // 修复：确保 targetIndex 是数字
      targetIdx = typeof targetIndex === 'string' ? parseInt(targetIndex, 10) : targetIndex;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:701',message:'unitAttack unit target index conversion',data:{targetIndex,targetIdx,targetIdxType:typeof targetIdx,isNaN:isNaN(targetIdx),battlefieldLength:targetPlayer.battlefield.length,battlefieldUnits:targetPlayer.battlefield.map((u,i)=>({index:i,name:u.card.name}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (isNaN(targetIdx) || targetIdx < 0 || targetIdx >= targetPlayer.battlefield.length) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:704',message:'unitAttack invalid targetIndex',data:{targetIndex,targetIdx,battlefieldLength:targetPlayer.battlefield.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('❌ 目标索引无效:', targetIndex, '转换为:', targetIdx, '战场单位数:', targetPlayer.battlefield.length);
        this.gameState.log('目标索引无效');
        return false;
      }
      target = targetPlayer.battlefield[targetIdx];
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:712',message:'unitAttack unit target found',data:{targetName:target.card.name,targetHealth:target.currentHealth,targetIdx,hasCard:!!target.card},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.log('目标：单位', { 
        name: target.card.name, 
        health: target.currentHealth,
        index: targetIdx,
        hasCard: !!target.card
      });
    }
    
    if (!target) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:725',message:'unitAttack target missing',data:{isHeroTarget,targetIdx},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('❌ 目标无效:', { isHeroTarget, targetIdx, target });
      this.gameState.log('攻击目标无效');
      return false;
    }
    
    // 检查攻击者是否可以攻击（使用统一的 canAttack 方法）
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:732',message:'unitAttack attacker state check',data:{attackerName:attacker.card.name,exhausted:attacker.exhausted,frozen:attacker.frozen,nextTurnCannotAct:attacker.nextTurnCannotAct,onBoardTurns:attacker.onBoardTurns,hasCharge:attacker.keywords.some(kw => kw.includes('CHARGE'))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!attacker.canAttack()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:735',message:'unitAttack attacker cannot attack',data:{attackerName:attacker.card.name,exhausted:attacker.exhausted,frozen:attacker.frozen,nextTurnCannotAct:attacker.nextTurnCannotAct},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      let reason = '';
      if (attacker.exhausted) {
        reason = '已疲惫';
      } else if (attacker.frozen) {
        reason = '被冰冻';
      } else if (attacker.nextTurnCannotAct) {
        reason = '被时间冻结';
      } else {
        reason = '需要等待一回合';
      }
      console.warn(`⚠️ 攻击者无法攻击: ${reason}`);
      this.gameState.log(`${attacker.card.name} ${reason}，无法攻击`);
      return false;
    }
    
    // 检查目标是否合法（嘲讽规则）
    const isValid = this.isValidTarget(attacker, target, targetPlayer);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:753',message:'unitAttack target validity check',data:{attackerName:attacker.card.name,targetName:isHeroTarget?target.name:target.card.name,isValid,isHeroTarget},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (!isValid) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:756',message:'unitAttack invalid target',data:{attackerName:attacker.card.name,targetName:isHeroTarget?target.name:target.card.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.warn('⚠️ 目标不合法（可能是嘲讽规则）');
      this.gameState.log('目标选择不合法（可能有嘲讽单位）');
      return false;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:184',message:'unitAttack all checks passed',data:{attackerName:attacker.card.name,targetName:isHeroTarget?target.name:target.card.name,beforeHealth:isHeroTarget?target.health:target.currentHealth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.log('✅ 所有检查通过，开始执行攻击');
    console.log('攻击者状态:', {
      name: attacker.card.name,
      attack: attacker.attack,
      exhausted: attacker.exhausted
    });
    console.log('目标状态:', {
      name: isHeroTarget ? target.name : target.card.name,
      health: isHeroTarget ? target.health : target.currentHealth,
      isHero: isHeroTarget
    });
    
    // 进行攻击
    this.resolveAttack(attacker, target, attackerPlayer, targetPlayer, isHeroTarget);
    
    // 设置攻击者疲惫（在攻击成功后）
    attacker.exhausted = true;
    
    // 验证攻击结果
    const afterHealth = isHeroTarget ? target.health : target.currentHealth;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:203',message:'unitAttack after resolveAttack',data:{afterHealth,isHeroTarget},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.log('✅ 攻击完成验证 - 目标血量:', afterHealth);
    
    return true;
  }
  
  // 解析攻击
  resolveAttack(attacker, target, attackerPlayer, targetPlayer, isHeroTarget) {
    console.log('💥 === resolveAttack 开始 ===');
    
    // 修复2: 使用更可靠的 isHero 判断
    // 单位有 card 属性，英雄没有
    const isHero = isHeroTarget !== undefined ? isHeroTarget : (!target.card && target.hasOwnProperty('name') && !target.hasOwnProperty('currentHealth'));
    
    let damage = attacker.attack + (attacker.auraAttackBonus || 0);
    
    console.log('攻击信息:', {
      attacker: attacker.card.name,
      attackerAttack: attacker.attack,
      auraBonus: attacker.auraAttackBonus || 0,
      totalDamage: damage,
      isHero,
      targetType: target.card ? 'UNIT' : 'HERO',
      target: isHero ? target.name : target.card.name,
      targetBeforeHealth: isHero ? target.health : target.currentHealth,
      targetHasCard: !!target.card
    });
    
    // 计算破甲（直接从关键词数组获取，因为card可能是普通对象而不是Card实例）
    let pierceValue = 0;
    const keywords = attacker.card.keywords || attacker.keywords || [];
    for (const keyword of keywords) {
      if (keyword.startsWith('PIERCE_')) {
        pierceValue = parseInt(keyword.split('_')[1]) || 0;
        break;
      }
      if (keyword.startsWith('TEMP_PIERCE_')) {
        pierceValue = parseInt(keyword.split('_')[2]) || 0;
        break;
      }
    }
    
    // 计算实际伤害（考虑雷特效）
    let actualDamage = damage;
    
    // 应用雷特效（目标受到的所有伤害+1）
    if (isHero) {
      // 目标是英雄，检查目标英雄的雷特效
      if (targetPlayer.hero.thunderEffect && targetPlayer.hero.thunderEffect.turns > 0) {
        const bonus = targetPlayer.hero.thunderEffect.bonus || 0;
        actualDamage += bonus;
        this.gameState.log(`⚡ 雷特效：${target.name} 受到的所有伤害+${bonus}`);
      }
    } else {
      // 目标是单位，检查单位的雷特效
      if (target.thunderEffect && target.thunderEffect.turns > 0) {
        const bonus = target.thunderEffect.bonus || 0;
        actualDamage += bonus;
        this.gameState.log(`⚡ 雷特效：${target.card.name} 受到的所有伤害+${bonus}`);
      }
    }
    
    if (!isHero) {
      // 对单位造成伤害
      const beforeHealth = target.currentHealth;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:237',message:'resolveAttack unit before',data:{targetName:target.card.name,beforeHealth,actualDamage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('⚔️ === 单位攻击 ===');
      console.log('📊 攻击前:', { 
        name: target.card.name, 
        health: beforeHealth,
        maxHealth: target.maxHealth,
        targetObject: target
      });
      console.log('💢 伤害值:', actualDamage);
      
      // 应用护盾和圣盾（物理伤害）
      // 注意：雷特效已经在actualDamage中计算了，所以这里直接使用actualDamage
      let remainingDamage = actualDamage;
      
      // 先检查圣盾（完全抵挡一次伤害）
      const hasDivineShield = target.keywords && target.keywords.some(kw => kw.includes('DIVINE_SHIELD'));
      if (hasDivineShield) {
        target.removeKeyword('DIVINE_SHIELD');
        remainingDamage = 0;
        this.gameState.log(`${target.card.name} 的圣盾完全抵挡了这次伤害`);
      } else if (target.shield > 0) {
        // 然后检查普通护盾
        const blocked = Math.min(target.shield, remainingDamage);
        target.shield -= blocked;
        remainingDamage -= blocked;
        if (blocked > 0) {
          this.gameState.log(`${target.card.name} 的护盾抵挡了 ${blocked} 点伤害`);
        }
      }
      
      // 直接修改血量（确保修改成功）
      // 注意：remainingDamage已经包含了雷特效的加成
      const oldHealth = target.currentHealth;
      target.currentHealth = target.currentHealth - remainingDamage;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:252',message:'resolveAttack unit after damage',data:{targetName:target.card.name,oldHealth,newHealth:target.currentHealth,actualDamage,remainingDamage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('📝 血量修改:', {
        old: oldHealth,
        new: target.currentHealth,
        damage: remainingDamage,
        blocked: actualDamage - remainingDamage
      });
      
      // 确保血量不会为负
      if (target.currentHealth < 0) {
        target.currentHealth = 0;
      }
      
      const targetKilled = target.currentHealth <= 0 || target.isDead();
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:264',message:'resolveAttack unit final',data:{targetName:target.card.name,finalHealth:target.currentHealth,killed:targetKilled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('📊 攻击后:', {
        name: target.card.name,
        health: target.currentHealth,
        killed: targetKilled,
        isDead: target.isDead()
      });
      
      console.log('✅ 最终血量:', target.currentHealth);
      
      this.gameState.log(`${attacker.card.name} 对 ${target.card.name} 造成 ${remainingDamage} 点伤害${actualDamage > remainingDamage ? `（护盾抵挡了 ${actualDamage - remainingDamage} 点）` : ''}`);
      
      // 检查吸血（攻击单位时也能吸血）
      if (attacker.card.keywords.includes('LIFESTEAL')) {
        const healAmount = Math.ceil(remainingDamage * 0.5);
        attackerPlayer.hero.health = Math.min(
          attackerPlayer.hero.health + healAmount,
          attackerPlayer.hero.maxHealth
        );
        this.gameState.log(`${attacker.card.name} 的吸血效果治疗了英雄 ${healAmount} 点生命`);
      }
      
      // 修正反击逻辑：即使目标被一击必杀，也会先反击，然后再移除
      // 反击逻辑：如果攻击者不是远程单位，目标会反击（即使目标已死）
      const attackerHasRanged = keywords.some(kw => kw.includes('RANGED'));
      if (!attackerHasRanged) {
        // 计算反击伤害（使用目标攻击前的攻击力）
        let counterAttackDamage = target.attack + (target.auraAttackBonus || 0);
        
        // 应用攻击者的雷特效（如果攻击者有雷特效，反击伤害也会增加）
        if (attackerPlayer.hero && attackerPlayer.hero.thunderEffect && attackerPlayer.hero.thunderEffect.turns > 0) {
          const bonus = attackerPlayer.hero.thunderEffect.bonus || 0;
          counterAttackDamage += bonus;
          this.gameState.log(`⚡ 雷特效：${attacker.card.name} 的所有伤害+${bonus}（包括反击）`);
        }
        
        // 应用攻击者的护盾
        let remainingCounterDamage = counterAttackDamage;
        if (attacker.shield > 0) {
          const blocked = Math.min(attacker.shield, remainingCounterDamage);
          attacker.shield -= blocked;
          remainingCounterDamage -= blocked;
          if (blocked > 0) {
            this.gameState.log(`${attacker.card.name} 的护盾抵挡了 ${blocked} 点反击伤害`);
          }
        }
        
        const attackerBeforeHealth = attacker.currentHealth;
        attacker.currentHealth = Math.max(0, attacker.currentHealth - remainingCounterDamage);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:345',message:'counterattack damage',data:{attackerName:attacker.card.name,attackerBeforeHealth,attackerAfterHealth:attacker.currentHealth,counterAttackDamage,remainingCounterDamage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'counterattack'})}).catch(()=>{});
        // #endregion
        
        console.log('⚔️ === 反击 ===');
        console.log(`${target.card.name} 反击 ${attacker.card.name}，造成 ${remainingCounterDamage} 点伤害${counterAttackDamage > remainingCounterDamage ? `（护盾抵挡了 ${counterAttackDamage - remainingCounterDamage} 点）` : ''}`);
        console.log('攻击者血量:', {
          before: attackerBeforeHealth,
          after: attacker.currentHealth
        });
        
        this.gameState.log(`${target.card.name} 反击 ${attacker.card.name}，造成 ${remainingCounterDamage} 点伤害${counterAttackDamage > remainingCounterDamage ? `（护盾抵挡了 ${counterAttackDamage - remainingCounterDamage} 点）` : ''}`);
        
        // 检查攻击者是否被击杀（同归于尽）
        const attackerKilled = attacker.currentHealth <= 0 || attacker.isDead();
        if (attackerKilled) {
          console.log('💀 攻击者被反击击杀（同归于尽）');
          this.killUnit(attacker, attackerPlayer);
        }
      } else {
        console.log('🏹 攻击者有远程，不会受到反击');
      }
      
      // 移除被击杀的目标（在反击之后）
      if (targetKilled) {
        console.log('💀 单位被击杀，准备移除单位');
        
        // 检测是否是分身击杀（分身击杀敌方单位时触发）
        if (attacker.card && attacker.card.isClone && attackerPlayer.id !== targetPlayer.id) {
          // 分身击杀了敌方单位
          this.handleCloneKill(attackerPlayer.id);
        }
        
        this.killUnit(target, targetPlayer);
      } else {
        console.log('❤️ 单位存活，当前血量:', target.currentHealth);
      }
    } else {
      // 对英雄造成伤害
      const beforeHealth = target.health;
      console.log('👑 === 英雄攻击 ===');
      console.log('📊 攻击前:', { name: target.name, health: beforeHealth });
      
      // 检查全反击被动（梅利迪奥斯）
      // 全反击：敌方回合，受到的所有伤害翻倍并反弹给攻击者
      const isEnemyTurn = this.gameState.currentPlayer !== targetPlayer.id;
      const hasFullCounter = target.fullCounter && isEnemyTurn;
      
      // 应用英雄护盾和圣盾（物理伤害）
      let remainingDamage = actualDamage;
      
      // 先检查圣盾
      if (target.divineShield) {
        target.divineShield = false;
        remainingDamage = 0;
        this.gameState.log(`${target.name} 的圣盾完全抵挡了这次伤害`);
      } else if (target.shield > 0) {
        // 然后检查普通护盾
        const blocked = Math.min(target.shield, remainingDamage);
        target.shield -= blocked;
        remainingDamage -= blocked;
        if (blocked > 0) {
          this.gameState.log(`${target.name} 的护盾抵挡了 ${blocked} 点伤害`);
        }
      }
      
      // 物理伤害：优先减少护甲，然后减少生命值
      let finalDamage = 0;
      if (remainingDamage > 0) {
        const initialHealth = targetPlayer.hero.initialHealth || 30;
        const currentArmor = target.maxHealth - initialHealth;
        
        if (currentArmor > 0) {
          // 有护甲，先减少护甲
          const armorDamage = Math.min(currentArmor, remainingDamage);
          target.maxHealth -= armorDamage;
          target.health = Math.min(target.health, target.maxHealth); // 如果当前血量超过最大血量，降低到最大血量
          remainingDamage -= armorDamage;
          this.gameState.log(`${target.name} 的护甲减少了 ${armorDamage} 点`);
        }
        
        // 剩余伤害减少生命值
        if (remainingDamage > 0) {
          finalDamage = remainingDamage;
          // 全反击：伤害翻倍
          if (hasFullCounter) {
            finalDamage = remainingDamage * 2;
            this.gameState.log(`🔥 ${target.name} 的全反击：伤害翻倍！实际受到 ${finalDamage} 点伤害（原伤害 ${remainingDamage}）`);
          }
          target.health = Math.max(0, target.health - finalDamage);
        }
      }
      
      const oldHealth = beforeHealth;
      
      console.log('📝 血量修改:', {
        old: oldHealth,
        new: target.health,
        damage: finalDamage || remainingDamage,
        blocked: actualDamage - (finalDamage || remainingDamage)
      });
      
      console.log('📊 攻击后:', { 
        name: target.name, 
        health: target.health, 
        damage: finalDamage || remainingDamage
      });
      
      // 修复3: 不在逻辑层直接操作DOM，由渲染层统一处理
      // UI更新会在 InputHandler 中通过 renderer.render() 统一处理
      
      this.gameState.log(`${attacker.card.name} 对 ${target.name} 造成 ${finalDamage || remainingDamage} 点伤害${actualDamage > (finalDamage || remainingDamage) ? `（护盾抵挡了 ${actualDamage - (finalDamage || remainingDamage)} 点）` : ''}`);
      
      // 全反击：反弹伤害给攻击者
      if (hasFullCounter && finalDamage > 0) {
        const reflectDamage = finalDamage; // 反弹翻倍后的伤害
        const attackerHero = attackerPlayer.hero;
        
        // 应用攻击者英雄的护盾
        let remainingReflectDamage = reflectDamage;
        if (attackerHero.shield > 0) {
          const blocked = Math.min(attackerHero.shield, remainingReflectDamage);
          attackerHero.shield -= blocked;
          remainingReflectDamage -= blocked;
          if (blocked > 0) {
            this.gameState.log(`${attackerHero.name} 的护盾抵挡了 ${blocked} 点反弹伤害`);
          }
        }
        
        // 反弹伤害：优先减少护甲，然后减少生命值
        if (remainingReflectDamage > 0) {
          const attackerInitialHealth = attackerHero.initialHealth || 30;
          const attackerArmor = attackerHero.maxHealth - attackerInitialHealth;
          
          if (attackerArmor > 0) {
            const armorDamage = Math.min(attackerArmor, remainingReflectDamage);
            attackerHero.maxHealth -= armorDamage;
            attackerHero.health = Math.min(attackerHero.health, attackerHero.maxHealth);
            remainingReflectDamage -= armorDamage;
            this.gameState.log(`${attackerHero.name} 的护甲减少了 ${armorDamage} 点（反弹伤害）`);
          }
          
          if (remainingReflectDamage > 0) {
            attackerHero.health = Math.max(0, attackerHero.health - remainingReflectDamage);
            this.gameState.log(`🔥 ${target.name} 的全反击反弹了 ${remainingReflectDamage} 点伤害给 ${attackerHero.name}！`);
          }
        }
      }
      
      // 检查觉醒机制（生命值首次降至15以下）
      if (target.awakenThreshold && !target.awakened && target.health <= target.awakenThreshold) {
        this.triggerAwakening(targetPlayer.id);
      }
      
      // 检查吸血
      if (attacker.card.keywords.includes('LIFESTEAL')) {
        const healAmount = Math.ceil(actualDamage * 0.5);
        attackerPlayer.hero.health = Math.min(
          attackerPlayer.hero.health + healAmount,
          attackerPlayer.hero.maxHealth
        );
        this.gameState.log(`${attacker.card.name} 的吸血效果治疗了英雄 ${healAmount} 点生命`);
      }
    }
    
    // 检查游戏结束
    this.gameState.checkDeath();
    console.log('✅ === resolveAttack 完成 ===');
  }
  
  // 英雄攻击
  heroAttack(playerId, targetPlayerId, targetIndex) {
    const attackerPlayer = this.gameState.players[playerId];
    const targetPlayer = this.gameState.players[targetPlayerId];
    const hero = attackerPlayer.hero;
    
    // 检查英雄是否可以攻击
    if (hero.exhausted) {
      this.gameState.log(`${hero.name} 已疲惫，无法攻击`);
      return false;
    }
    
    // 检查英雄是否有武器（没有武器无法攻击）
    if (!hero.weapon || hero.attack <= 0) {
      this.gameState.log(`${hero.name} 没有武器，无法攻击`);
      return false;
    }
    
    // 确定目标
    const isHeroTarget = targetIndex === 'hero' || targetIndex === 'HERO';
    let target;
    let targetIdx;
    
    if (isHeroTarget) {
      target = targetPlayer.hero;
    } else {
      targetIdx = typeof targetIndex === 'string' ? parseInt(targetIndex, 10) : targetIndex;
      if (isNaN(targetIdx) || targetIdx < 0 || targetIdx >= targetPlayer.battlefield.length) {
        this.gameState.log('目标索引无效');
        return false;
      }
      target = targetPlayer.battlefield[targetIdx];
    }
    
    if (!target) {
      this.gameState.log('攻击目标无效');
      return false;
    }
    
    // 检查目标是否合法（嘲讽规则）
    if (!isHeroTarget && !this.isValidTargetForHero(hero, target, targetPlayer)) {
      this.gameState.log('目标选择不合法（可能有嘲讽单位）');
      return false;
    }
    
    // 检查武器耐久度
    if (hero.weaponDurability <= 0) {
      this.gameState.log('武器耐久度已耗尽，无法攻击');
      return false;
    }
    
    // 注意：被冰冻的目标仍然可以被攻击，冰冻只是阻止目标攻击，不阻止被攻击
    // 移除这个检查，允许攻击被冰冻的目标
    
    // 执行攻击
    let damage = hero.attack;
    const isTargetHero = !target.card;
    
    // 应用雷特效（目标受到的所有伤害+1）
    if (isTargetHero) {
      if (targetPlayer.hero.thunderEffect && targetPlayer.hero.thunderEffect.turns > 0) {
        const bonus = targetPlayer.hero.thunderEffect.bonus || 0;
        damage += bonus;
        this.gameState.log(`雷特效：${target.name} 受到的所有伤害+${bonus}`);
      }
    } else {
      if (target.thunderEffect && target.thunderEffect.turns > 0) {
        const bonus = target.thunderEffect.bonus || 0;
        damage += bonus;
        this.gameState.log(`雷特效：${target.card.name} 受到的所有伤害+${bonus}`);
      }
    }
    
    if (isTargetHero) {
      // 攻击英雄
      // 应用护盾和圣盾
      let remainingDamage = damage;
      
      if (target.divineShield) {
        target.divineShield = false;
        remainingDamage = 0;
        this.gameState.log(`${target.name} 的圣盾完全抵挡了这次伤害`);
      } else if (target.shield > 0) {
        const blocked = Math.min(target.shield, remainingDamage);
        target.shield -= blocked;
        remainingDamage -= blocked;
        if (blocked > 0) {
          this.gameState.log(`${target.name} 的护盾抵挡了 ${blocked} 点伤害`);
        }
      }
      
      // 物理伤害：优先减少护甲，然后减少生命值
      if (remainingDamage > 0) {
        const initialHealth = targetPlayer.hero.initialHealth || 30;
        const currentArmor = target.maxHealth - initialHealth;
        
        if (currentArmor > 0) {
          // 有护甲，先减少护甲
          const armorDamage = Math.min(currentArmor, remainingDamage);
          target.maxHealth -= armorDamage;
          target.health = Math.min(target.health, target.maxHealth); // 如果当前血量超过最大血量，降低到最大血量
          remainingDamage -= armorDamage;
          this.gameState.log(`${target.name} 的护甲减少了 ${armorDamage} 点`);
        }
        
        // 剩余伤害减少生命值
        if (remainingDamage > 0) {
          target.health = Math.max(0, target.health - remainingDamage);
        }
      }
      
      this.gameState.log(`${hero.name} 对 ${target.name} 造成 ${damage} 点伤害${damage > remainingDamage ? `（护盾/护甲抵挡了 ${damage - remainingDamage} 点）` : ''}`);
      
      // 检查游戏结束
      this.gameState.checkDeath();
    } else {
      // 攻击单位
      const beforeHealth = target.currentHealth;
      
      // 应用护盾和圣盾
      let remainingDamage = damage;
      
      const hasDivineShield = target.keywords && target.keywords.some(kw => kw.includes('DIVINE_SHIELD'));
      if (hasDivineShield) {
        target.removeKeyword('DIVINE_SHIELD');
        remainingDamage = 0;
        this.gameState.log(`${target.card.name} 的圣盾完全抵挡了这次伤害`);
      } else if (target.shield > 0) {
        const blocked = Math.min(target.shield, remainingDamage);
        target.shield -= blocked;
        remainingDamage -= blocked;
        if (blocked > 0) {
          this.gameState.log(`${target.card.name} 的护盾抵挡了 ${blocked} 点伤害`);
        }
      }
      
      target.currentHealth = Math.max(0, target.currentHealth - remainingDamage);
      this.gameState.log(`${hero.name} 对 ${target.card.name} 造成 ${remainingDamage} 点伤害`);
      
      // 单位反击英雄（不论是否击杀，只要单位未被冰冻就会反击）
      // 先计算反击伤害
      let counterDamage = 0;
      const targetKilled = target.currentHealth <= 0 || target.isDead();
      
      if (!target.frozen) {
        counterDamage = target.attack + (target.auraAttackBonus || 0);
        
        // 应用英雄的雷特效（如果英雄有雷特效，反击伤害也会增加）
        if (attackerPlayer.hero.thunderEffect && attackerPlayer.hero.thunderEffect.turns > 0) {
          const bonus = attackerPlayer.hero.thunderEffect.bonus || 0;
          counterDamage += bonus;
          this.gameState.log(`⚡ 雷特效：${hero.name} 的所有伤害+${bonus}（包括反击）`);
        }
        
        // 应用英雄护盾和护甲
        let remainingCounterDamage = counterDamage;
        if (hero.divineShield) {
          hero.divineShield = false;
          remainingCounterDamage = 0;
          this.gameState.log(`${hero.name} 的圣盾完全抵挡了反击`);
        } else if (hero.shield > 0) {
          const blocked = Math.min(hero.shield, remainingCounterDamage);
          hero.shield -= blocked;
          remainingCounterDamage -= blocked;
          if (blocked > 0) {
            this.gameState.log(`${hero.name} 的护盾抵挡了 ${blocked} 点反击伤害`);
          }
        }
        
        // 物理伤害：优先减少护甲，然后减少生命值
        if (remainingCounterDamage > 0) {
          const initialHealth = attackerPlayer.hero.initialHealth || 30;
          const currentArmor = hero.maxHealth - initialHealth;
          
          if (currentArmor > 0) {
            // 有护甲，先减少护甲
            const armorDamage = Math.min(currentArmor, remainingCounterDamage);
            hero.maxHealth -= armorDamage;
            hero.health = Math.min(hero.health, hero.maxHealth); // 如果当前血量超过最大血量，降低到最大血量
            remainingCounterDamage -= armorDamage;
            this.gameState.log(`${hero.name} 的护甲减少了 ${armorDamage} 点`);
          }
          
          // 剩余伤害减少生命值
          if (remainingCounterDamage > 0) {
            hero.health = Math.max(0, hero.health - remainingCounterDamage);
          }
        }
        
        this.gameState.log(`${target.card.name} 反击 ${hero.name}，造成 ${counterDamage} 点伤害${counterDamage > remainingCounterDamage ? `（护盾/护甲抵挡了 ${counterDamage - remainingCounterDamage} 点）` : ''}`);
        
        // 检查英雄是否被击杀
        if (hero.health <= 0) {
          this.gameState.checkDeath();
        }
      }
      
      // 移除被击杀的单位（在反击之后）
      if (targetKilled) {
        this.killUnit(target, targetPlayer);
      }
    }
    
    // 应用武器特效（在攻击成功后，但在武器耐久度降低之前）
    // 这样即使武器耐久度耗尽，效果也能正确应用
    const weaponEffect = hero.weapon && hero.weapon.weaponEffect ? hero.weapon.weaponEffect : null;
    const weaponName = hero.weapon ? hero.weapon.name : null;
    
    if (weaponEffect) {
      this.applyWeaponEffect(weaponEffect, target, targetPlayer, targetIndex, isTargetHero);
    }
    
    // 设置英雄疲惫
    hero.exhausted = true;
    
    // 降低武器耐久度
    if (hero.weaponDurability > 0) {
      hero.weaponDurability--;
      this.gameState.log(`${weaponName} 耐久度：${hero.weaponDurability}/${hero.weapon.durability || 0}`);
      
      if (hero.weaponDurability <= 0) {
        this.gameState.log(`${weaponName} 耐久度耗尽，武器已损坏`);
        const oldWeaponName = hero.weapon.name;
        hero.weapon = null;
        hero.attack = 0;
        hero.weaponDurability = 0;
        this.gameState.log(`${hero.name} 失去了 ${oldWeaponName}`);
      }
    }
    
    return true;
  }
  
  // 应用武器特效
  applyWeaponEffect(effect, target, targetPlayer, targetIndex, isHeroTarget) {
    // 获取攻击者的武器稀有度，决定持续时间
    // 需要找到攻击者（使用武器的英雄）
    let attackerPlayer = null;
    for (const [playerId, player] of Object.entries(this.gameState.players)) {
      if (player.hero.weapon && player.hero.weapon.weaponEffect && 
          player.hero.weapon.weaponEffect.type === effect.type) {
        attackerPlayer = player;
        break;
      }
    }
    
    // 如果找不到，尝试从targetPlayer推断（攻击者应该是另一个玩家）
    if (!attackerPlayer) {
      attackerPlayer = targetPlayer.id === 'PLAYER1' ? 
        this.gameState.players['PLAYER2'] : 
        this.gameState.players['PLAYER1'];
    }
    
    const weapon = attackerPlayer ? attackerPlayer.hero.weapon : null;
    let duration = 2; // 默认持续时间
    
    if (weapon) {
      // 根据稀有度设置持续时间
      switch (weapon.rarity) {
        case 'C': // 普通
          duration = 2;
          break;
        case 'R': // 稀有
          duration = 3;
          break;
        case 'E': // 史诗
          duration = 4;
          break;
        case 'L': // 传说
          duration = 5;
          break;
        default:
          duration = 2;
      }
    }
    
    // 触发视觉特效
    if (this.gameState.renderer) {
      this.gameState.renderer.showWeaponEffect(effect.type, target, targetPlayer, isHeroTarget);
    }
    
    switch (effect.type) {
      case 'FREEZE':
        // 冰冻：目标一回合不能攻击
        if (isHeroTarget) {
          targetPlayer.hero.frozen = true;
          this.gameState.log(`${target.name} 被冰冻，下回合无法攻击`);
        } else {
          target.frozen = true;
          this.gameState.log(`${target.card.name} 被冰冻，下回合无法攻击`);
        }
        break;
        
      case 'FIRE':
        // 火焰：持续降低护甲直到掉血
        if (isHeroTarget) {
          targetPlayer.hero.fireEffect = { turns: duration, damage: 1 };
          this.gameState.log(`${target.name} 受到火焰效果，持续 ${duration} 回合，护甲将持续降低`);
        } else {
          target.fireEffect = { turns: duration, damage: 1 };
          this.gameState.log(`${target.card.name} 受到火焰效果，持续 ${duration} 回合，护甲将持续降低`);
        }
        break;
        
      case 'THUNDER':
        // 雷特效：受到的所有伤害+1
        if (isHeroTarget) {
          targetPlayer.hero.thunderEffect = { turns: duration, bonus: 1 };
          this.gameState.log(`${target.name} 受到雷特效，持续 ${duration} 回合，受到的所有伤害+1`);
        } else {
          target.thunderEffect = { turns: duration, bonus: 1 };
          this.gameState.log(`${target.card.name} 受到雷特效，持续 ${duration} 回合，受到的所有伤害+1`);
        }
        break;
        
      case 'POISON':
        // 毒特效：持续3回合，每回合掉1-2点血
        if (isHeroTarget) {
          targetPlayer.hero.poisonEffect = { turns: 3 };
          this.gameState.log(`${target.name} 中毒，持续3回合，每回合掉1-2点血`);
        } else {
          target.poisonEffect = { turns: 3 };
          this.gameState.log(`${target.card.name} 中毒，持续3回合，每回合掉1-2点血`);
        }
        break;
    }
  }
  
  // 检查英雄攻击目标是否合法
  isValidTargetForHero(hero, target, targetPlayer) {
    // 如果是英雄目标，总是合法
    if (!target.card) {
      return true;
    }
    
    // 检查嘲讽规则
    const hasTaunt = targetPlayer.battlefield.some(unit => 
      (unit.card.keywords || unit.keywords || []).some(kw => kw.includes('TAUNT'))
    );
    
    if (hasTaunt) {
      // 有嘲讽单位，必须攻击嘲讽单位
      return (target.card.keywords || target.keywords || []).some(kw => kw.includes('TAUNT'));
    }
    
    return true;
  }
  
  // 发现机制：从牌库中随机选择3张牌，让玩家选择1张
  discoverCard(playerId) {
    const player = this.gameState.players[playerId];
    
    // 从所有卡牌中随机选择3张（排除发现牌本身）
    const availableCards = this.gameState.allCards.filter(c => 
      c.type !== 'spell' || c.spellEffect?.type !== 'DISCOVER'
    );
    
    if (availableCards.length === 0) {
      this.gameState.log('没有可发现的卡牌');
      return false;
    }
    
    // 随机选择3张不同的卡牌
    const discoveredCards = [];
    const usedIndices = new Set();
    
    while (discoveredCards.length < 3 && discoveredCards.length < availableCards.length) {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        const card = availableCards[randomIndex];
        // 创建卡牌实例
        const cardInstance = { 
          ...card, 
          instanceId: `${card.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
        };
        
        // 如果是单位卡牌，随机分配关键词
        if (cardInstance.type === 'unit') {
          cardInstance.keywords = this.gameState.randomizeUnitKeywords();
        }
        
        discoveredCards.push(cardInstance);
      }
    }
    
    // 触发发现UI
    if (this.gameState.renderer && this.gameState.renderer.showDiscoverUI) {
      this.gameState.renderer.showDiscoverUI(playerId, discoveredCards, (selectedCard) => {
        // 将选中的卡牌加入手牌
        if (player.canDrawCard()) {
          player.hand.push(selectedCard);
          this.gameState.log(`${playerId} 发现了 ${selectedCard.name}`);
        } else {
          this.gameState.log(`${playerId} 手牌已满，${selectedCard.name} 被烧掉`);
        }
        if (this.gameState.renderer) {
          this.gameState.renderer.render();
        }
      });
    } else {
      // 如果没有UI，随机选择一张
      const randomCard = discoveredCards[Math.floor(Math.random() * discoveredCards.length)];
      if (player.canDrawCard()) {
        player.hand.push(randomCard);
        this.gameState.log(`${playerId} 发现了 ${randomCard.name}`);
      } else {
        this.gameState.log(`${playerId} 手牌已满，${randomCard.name} 被烧掉`);
      }
    }
    
    return true;
  }
  
  // 装备武器
  equipWeapon(playerId, weaponCard) {
    const player = this.gameState.players[playerId];
    if (weaponCard.type !== 'weapon') {
      this.gameState.log('只能装备武器卡牌');
      return false;
    }
    
    // 如果已有武器，先移除
    if (player.hero.weapon) {
      player.hero.attack = 0;
    }
    
    // 装备新武器
    player.hero.weapon = weaponCard;
    player.hero.attack = weaponCard.attack || 0;
    player.hero.weaponDurability = weaponCard.durability || 0;
    
    // 装备武器后，英雄可以立即攻击（重置疲惫状态）
    player.hero.exhausted = false;
    
    this.gameState.log(`${player.hero.name} 装备了 ${weaponCard.name}，可以立即攻击`);
    return true;
  }
  
  // 检查目标是否合法
  isValidTarget(attacker, target, targetPlayer) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:1438',message:'isValidTarget entry',data:{attackerName:attacker.card.name,attackerKeywords:attacker.card.keywords,targetHasCard:!!target.card,targetName:target.card?target.card.name:target.name,isHeroTarget:!target.card},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // 如果是英雄目标
    if (target.health !== undefined && target.maxHealth !== undefined && !target.card) {
      // 检查是否有嘲讽单位
      const hasTaunt = targetPlayer.battlefield.some(unit => 
        unit.keywords.includes('TAUNT') || unit.keywords.includes('TEMP_TAUNT')
      );
      const attackerHasRanged = attacker.card.keywords.includes('RANGED');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:1447',message:'isValidTarget hero target check',data:{hasTaunt,attackerHasRanged,tauntUnits:targetPlayer.battlefield.filter(u=>u.keywords.includes('TAUNT')||u.keywords.includes('TEMP_TAUNT')).map(u=>u.card.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      if (hasTaunt && !attackerHasRanged) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:1452',message:'isValidTarget hero blocked by taunt',data:{hasTaunt,attackerHasRanged},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        return false; // 有嘲讽单位且攻击者不是远程，不能攻击英雄
      }
      return true;
    }
    
    // 检查嘲讽规则
    const hasTaunt = targetPlayer.battlefield.some(unit => 
      unit.keywords.includes('TAUNT') || unit.keywords.includes('TEMP_TAUNT')
    );
    const attackerHasRanged = attacker.card.keywords.includes('RANGED');
    const targetHasTaunt = target.keywords.includes('TAUNT') || target.keywords.includes('TEMP_TAUNT');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:1462',message:'isValidTarget unit target check',data:{hasTaunt,attackerHasRanged,targetHasTaunt,tauntUnits:targetPlayer.battlefield.filter(u=>u.keywords.includes('TAUNT')||u.keywords.includes('TEMP_TAUNT')).map(u=>u.card.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    if (hasTaunt && !attackerHasRanged) {
      // 有嘲讽单位且攻击者不是远程，必须攻击嘲讽单位
      const result = targetHasTaunt;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattleSystem.js:1468',message:'isValidTarget taunt check result',data:{hasTaunt,attackerHasRanged,targetHasTaunt,result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return result;
    }
    
    return true;
  }
  
  // 击杀单位
  killUnit(unit, player) {
    const index = player.battlefield.indexOf(unit);
    if (index !== -1) {
      player.battlefield.splice(index, 1);
      player.graveyard.push(unit.card);
      this.gameState.log(`${unit.card.name} 被消灭了`);
      
      // 触发亡语
      if (unit.card.deathrattle) {
        this.resolveDeathrattle(unit.card.deathrattle, unit.owner, unit);
      }
    }
  }
  
  // 处理AOE伤害（法术伤害）
  dealAoeDamage(playerId, effect) {
    const player = this.gameState.players[playerId];
    const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
    const opponent = this.gameState.players[opponentId];
    
    // 计算法术伤害加成
    let damage = effect.value;
    const spellPower = this.getSpellPower(player);
    damage += spellPower;
    
    // 显示AOE特效
    if (this.gameState.renderer && this.gameState.renderer.showAoeEffect) {
      this.gameState.renderer.showAoeEffect('DAMAGE', opponentId);
    }
    
    // 对每个敌方单位造成伤害（法术伤害，使用法术护盾）
    const unitsToKill = [];
    opponent.battlefield.forEach(unit => {
      // 应用法术护盾
      let remainingDamage = damage;
      if (unit.spellShield > 0) {
        const blocked = Math.min(unit.spellShield, remainingDamage);
        unit.spellShield -= blocked;
        remainingDamage -= blocked;
        if (blocked > 0) {
          this.gameState.log(`${unit.card.name} 的法术护盾抵挡了 ${blocked} 点伤害`);
        }
      }
      
      // 造成伤害
      const beforeHealth = unit.currentHealth;
      unit.currentHealth = Math.max(0, unit.currentHealth - remainingDamage);
      const killed = unit.currentHealth <= 0 || unit.isDead();
      
      this.gameState.log(`AOE效果对 ${unit.card.name} 造成 ${remainingDamage} 点伤害${damage > remainingDamage ? `（法术护盾抵挡了 ${damage - remainingDamage} 点）` : ''}`);
      
      if (killed) {
        unitsToKill.push(unit);
      }
    });
    
    // 清理死亡单位
    unitsToKill.forEach(unit => {
      this.killUnit(unit, opponent);
    });
  }
  
  // 获取法术伤害加成
  getSpellPower(player) {
    let spellPower = 0;
    player.battlefield.forEach(unit => {
      if (unit.card.aura && unit.card.aura.type === 'SPELL_POWER') {
        spellPower += unit.card.aura.value || 0;
      }
    });
    return spellPower;
  }
  
  // 辅助方法
  findEmptyPosition(player) {
    const positions = [0, 1, 2, 3, 4, 5]; // 扩展到6个位置
    const occupied = player.battlefield.map(u => u.position);
    const empty = positions.find(p => !occupied.includes(p));
    return empty !== undefined ? empty : 0; // 如果没有空位，放在位置0
  }
  
  resolveBattlecry(effect, playerId, source) {
    const player = this.gameState.players[playerId];
    
    switch (effect.type) {
      case 'HEAL':
        // 治疗效果
        if (effect.target === 'ALL_UNITS') {
          // 治疗所有友方单位
          player.battlefield.forEach(unit => {
            unit.heal(effect.value);
          });
          this.gameState.log(`${source.card.name} 的战吼治疗了所有友方单位 ${effect.value} 点生命`);
        } else if (effect.target === 'HERO') {
          // 治疗英雄
          player.hero.health = Math.min(player.hero.health + effect.value, player.hero.maxHealth);
          this.gameState.log(`${source.card.name} 的战吼治疗了 ${player.hero.name} ${effect.value} 点生命`);
        } else {
          // 默认：治疗第一个受伤的友方单位
          const injuredUnit = player.battlefield.find(u => u.currentHealth < u.maxHealth);
          if (injuredUnit) {
            injuredUnit.heal(effect.value);
            this.gameState.log(`${source.card.name} 的战吼治疗了 ${injuredUnit.card.name} ${effect.value} 点生命`);
          }
        }
        break;
        
      case 'DRAW_CARD':
        for (let i = 0; i < effect.value; i++) {
          this.gameState.drawCard(playerId);
        }
        break;
        
      case 'BUFF':
        // 增益效果
        if (effect.target === 'ALL_UNITS') {
          // 给所有友方单位加buff
          player.battlefield.forEach(unit => {
            if (effect.stats && effect.stats.attack) {
              unit.attack += effect.stats.attack;
            }
            if (effect.stats && effect.stats.health) {
              unit.maxHealth += effect.stats.health;
              unit.currentHealth += effect.stats.health;
            }
          });
          this.gameState.log(`${source.card.name} 的战吼给所有友方单位增加了增益`);
        } else if (effect.target === 'SELF') {
          // 给自己加buff
          if (effect.stats && effect.stats.attack) {
            source.attack += effect.stats.attack;
          }
          if (effect.stats && effect.stats.health) {
            source.maxHealth += effect.stats.health;
            source.currentHealth += effect.stats.health;
          }
          this.gameState.log(`${source.card.name} 的战吼给自己增加了增益`);
        }
        break;
        
      case 'DAMAGE':
        // 伤害效果
        if (effect.target === 'ALL_ENEMY_UNITS') {
          // 对所有敌方单位造成伤害
          const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
          const opponent = this.gameState.players[opponentId];
          opponent.battlefield.forEach(unit => {
            unit.currentHealth = Math.max(0, unit.currentHealth - effect.value);
            if (unit.currentHealth <= 0) {
              this.killUnit(unit, opponent);
            }
          });
          this.gameState.log(`${source.card.name} 的战吼对所有敌方单位造成 ${effect.value} 点伤害`);
        } else if (effect.target === 'ENEMY_HERO') {
          // 对敌方英雄造成伤害
          const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
          const opponent = this.gameState.players[opponentId];
          opponent.hero.health = Math.max(0, opponent.hero.health - effect.value);
          this.gameState.log(`${source.card.name} 的战吼对 ${opponent.hero.name} 造成 ${effect.value} 点伤害`);
        }
        break;
        
      case 'FREEZE_ENEMY_UNITS':
        // 冻结敌方单位（下回合无法行动）
        if (effect.target === 'ALL_ENEMY_UNITS') {
          const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
          const opponent = this.gameState.players[opponentId];
          opponent.battlefield.forEach(unit => {
            unit.nextTurnCannotAct = true;
          });
          this.gameState.log(`${source.card.name} 的战吼：对方所有随从下回合无法行动`);
        }
        break;
        
      case 'DISCOVER':
        // 发现（战吼版本，类似法术）
        this.discoverCard(playerId);
        break;
        
      case 'SILENCE':
        // 沉默目标单位（移除所有关键词和buff）
        if (effect.target === 'TARGET' && effect.targetUnit) {
          const targetUnit = effect.targetUnit;
          targetUnit.keywords = [];
          // 移除所有状态效果
          targetUnit.frozen = false;
          targetUnit.fireEffect = null;
          targetUnit.thunderEffect = null;
          targetUnit.poisonEffect = null;
          this.gameState.log(`${source.card.name} 的战吼：沉默 ${targetUnit.card.name}`);
        }
        break;
        
      case 'TRANSFORM':
        // 变形（将目标单位变为另一个单位）
        if (effect.target === 'TARGET' && effect.targetUnit && effect.transformId) {
          const transformCard = this.gameState.allCards.find(c => c.id === effect.transformId);
          if (transformCard && transformCard.type === 'unit') {
            const targetUnit = effect.targetUnit;
            const position = targetUnit.position;
            const player = this.gameState.players[playerId];
            
            // 移除原单位
            const index = player.battlefield.indexOf(targetUnit);
            if (index !== -1) {
              player.battlefield.splice(index, 1);
            }
            
            // 召唤新单位
            this.playUnit(playerId, transformCard, position);
            this.gameState.log(`${source.card.name} 的战吼：将目标变形为 ${transformCard.name}`);
          }
        }
        break;
        
      case 'COPY':
        // 复制（将目标单位复制到手牌）
        if (effect.target === 'TARGET' && effect.targetUnit && player.hand.length < 10) {
          const targetUnit = effect.targetUnit;
          const copyCard = { ...targetUnit.card, instanceId: `${targetUnit.card.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
          player.hand.push(copyCard);
          this.gameState.log(`${source.card.name} 的战吼：复制 ${targetUnit.card.name} 到手牌`);
        }
        break;
    }
  }
  
  resolveDeathrattle(effect, playerId, source) {
    // 实现亡语效果
    this.gameState.log(`${source.card.name} 的亡语效果触发`);
    
    const player = this.gameState.players[playerId];
    const opponentId = playerId === 'PLAYER1' ? 'PLAYER2' : 'PLAYER1';
    const opponent = this.gameState.players[opponentId];
    
    switch (effect.type) {
      case 'DRAW_CARD':
        // 抽牌
        for (let i = 0; i < effect.value; i++) {
          if (player.canDrawCard()) {
            this.gameState.drawCard(playerId);
          }
        }
        this.gameState.log(`${source.card.name} 的亡语：抽 ${effect.value} 张牌`);
        break;
        
      case 'SUMMON':
        // 召唤随从
        if (player.battlefield.length < 6 && effect.summonId) {
          const summonCard = this.gameState.allCards.find(c => c.id === effect.summonId);
          if (summonCard) {
            const position = this.findEmptyPosition(player);
            if (position !== -1) {
              this.playUnit(playerId, summonCard, position);
              this.gameState.log(`${source.card.name} 的亡语：召唤 ${summonCard.name}`);
            }
          }
        }
        break;
        
      case 'DAMAGE':
        // 造成伤害
        if (effect.target === 'ALL_ENEMY_UNITS') {
          opponent.battlefield.forEach(unit => {
            unit.currentHealth = Math.max(0, unit.currentHealth - effect.value);
            if (unit.currentHealth <= 0) {
              this.killUnit(unit, opponent);
            }
          });
          this.gameState.log(`${source.card.name} 的亡语：对所有敌方单位造成 ${effect.value} 点伤害`);
        } else if (effect.target === 'ENEMY_HERO') {
          opponent.hero.health = Math.max(0, opponent.hero.health - effect.value);
          this.gameState.log(`${source.card.name} 的亡语：对 ${opponent.hero.name} 造成 ${effect.value} 点伤害`);
        } else if (effect.target === 'RANDOM_ENEMY') {
          const targets = [...opponent.battlefield];
          if (opponent.hero.health > 0) {
            targets.push({ type: 'hero', hero: opponent.hero });
          }
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            if (target.type === 'hero') {
              target.hero.health = Math.max(0, target.hero.health - effect.value);
              this.gameState.log(`${source.card.name} 的亡语：对 ${target.hero.name} 造成 ${effect.value} 点伤害`);
            } else {
              target.currentHealth = Math.max(0, target.currentHealth - effect.value);
              if (target.currentHealth <= 0) {
                this.killUnit(target, opponent);
              }
              this.gameState.log(`${source.card.name} 的亡语：对 ${target.card.name} 造成 ${effect.value} 点伤害`);
            }
          }
        }
        break;
        
      case 'RETURN_TO_HAND':
        // 回手（如果源单位有card属性，回手该卡牌）
        if (source.card && player.hand.length < 10) {
          const returnCard = { ...source.card, instanceId: `${source.card.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
          player.hand.push(returnCard);
          this.gameState.log(`${source.card.name} 的亡语：返回手牌`);
        }
        break;
        
      case 'BUFF':
        // 增益效果
        if (effect.target === 'ALL_UNITS') {
          player.battlefield.forEach(unit => {
            if (effect.stats && effect.stats.attack) {
              unit.attack += effect.stats.attack;
            }
            if (effect.stats && effect.stats.health) {
              unit.maxHealth += effect.stats.health;
              unit.currentHealth += effect.stats.health;
            }
          });
          this.gameState.log(`${source.card.name} 的亡语：给所有友方单位增加了增益`);
        }
        break;
        
      default:
        this.gameState.log(`${source.card.name} 的亡语效果：${effect.type}`);
        break;
    }
  }
  
  buffAdjacentUnits(playerId, effect) {
    const player = this.gameState.players[playerId];
    
    // 简化处理：给所有友方单位加buff
    player.battlefield.forEach(unit => {
      if (unit.addBuff) {
        unit.addBuff(effect.stats, effect.duration);
        this.gameState.log(`${unit.card.name} 获得了+${effect.stats.attack || 0}/+${effect.stats.health || 0}的增益`);
      }
    });
  }
  
  buffTargetUnit(playerId, targetIndex, effect) {
    const player = this.gameState.players[playerId];
    const target = player.battlefield[targetIndex];
    
    if (!target) {
      this.gameState.log('目标单位不存在');
      return;
    }
    
    if (effect.stats) {
      if (target.addBuff) {
        target.addBuff(effect.stats, effect.duration);
      }
    }
    
    if (effect.keywords) {
      effect.keywords.forEach(keyword => {
        if (target.addKeyword) {
          target.addKeyword(keyword, effect.duration > 0);
        }
      });
    }
    
    this.gameState.log(`${target.card.name} 获得了增益`);
  }
  
  // 增加英雄护甲
  buffHeroArmor(playerId, value, drawCardCount = 0) {
    const player = this.gameState.players[playerId];
    // 只增加护甲（maxHealth），不增加当前生命值
    player.hero.maxHealth += value;
    // 不增加当前生命值，护甲和生命值独立计算
    this.gameState.log(`${player.hero.name} 获得了 ${value} 点护甲`);
    
    // 如果指定了抽牌数量，同时抽牌
    if (drawCardCount > 0) {
      for (let i = 0; i < drawCardCount; i++) {
        if (player.canDrawCard()) {
          this.gameState.drawCard(playerId);
        }
      }
      this.gameState.log(`${player.hero.name} 抽了 ${drawCardCount} 张牌`);
    }
  }
  
  // 增加单位攻击力
  buffUnitAttack(playerId, targetIndex, value) {
    const player = this.gameState.players[playerId];
    const unit = player.battlefield[targetIndex];
    if (unit) {
      unit.attack += value;
      this.gameState.log(`${unit.card.name} 的攻击力增加了 ${value} 点`);
    }
  }
  
  // 增加单位生命值
  buffUnitHealth(playerId, targetIndex, value) {
    const player = this.gameState.players[playerId];
    const unit = player.battlefield[targetIndex];
    if (unit) {
      unit.maxHealth += value;
      unit.currentHealth += value;
      this.gameState.log(`${unit.card.name} 的生命值增加了 ${value} 点`);
    }
  }
  
  // 增加单位属性
  buffUnitStats(playerId, targetIndex, effect) {
    const player = this.gameState.players[playerId];
    const unit = player.battlefield[targetIndex];
    if (unit) {
      if (effect.attack) {
        unit.attack += effect.attack;
      }
      if (effect.health) {
        unit.maxHealth += effect.health;
        unit.currentHealth += effect.health;
      }
      this.gameState.log(`${unit.card.name} 获得了+${effect.attack || 0}/+${effect.health || 0}的增益`);
    }
  }
  
  gainMana(playerId, amount) {
    const player = this.gameState.players[playerId];
    player.mana.current += amount;
    this.gameState.log(`${playerId} 获得了 ${amount} 点临时法力`);
  }
  
  // 添加圣盾到目标
  addDivineShieldToTarget(playerId, target) {
    const player = this.gameState.players[playerId];
    
    if (target === 'hero' || target === 'HERO') {
      // 给英雄添加圣盾
      player.hero.divineShield = true;
      this.gameState.log(`${player.hero.name} 获得了圣盾`);
    } else {
      // 给单位添加圣盾
      const unitIndex = typeof target === 'number' ? target : parseInt(target);
      if (unitIndex >= 0 && unitIndex < player.battlefield.length) {
        const unit = player.battlefield[unitIndex];
        unit.addKeyword('DIVINE_SHIELD');
        this.gameState.log(`${unit.card.name} 获得了圣盾`);
      }
    }
  }
  
  // 添加护盾到目标
  addShieldToTarget(playerId, target, effect) {
    const player = this.gameState.players[playerId];
    const isSpell = effect.isSpell || false;
    const shieldValue = effect.value || 0;
    
    // target可能是单位索引、'hero'或null
    if (effect.target === 'TARGET' && target !== null && target !== undefined) {
      // 需要选择目标的法术
      if (target === 'hero' || target === 'HERO') {
        // 给英雄添加护盾
        if (isSpell) {
          player.hero.spellShield += shieldValue;
        } else {
          player.hero.shield += shieldValue;
        }
        const shieldType = isSpell ? '法术护盾' : '护盾';
        this.gameState.log(`${player.hero.name} 获得了 ${shieldValue} 点${shieldType}`);
      } else {
        // 给单位添加护盾
        const unitIndex = typeof target === 'number' ? target : parseInt(target);
        if (unitIndex >= 0 && unitIndex < player.battlefield.length) {
          const unit = player.battlefield[unitIndex];
          unit.addShield(shieldValue, isSpell);
          const shieldType = isSpell ? '法术护盾' : '护盾';
          this.gameState.log(`${unit.card.name} 获得了 ${shieldValue} 点${shieldType}`);
        }
      }
    } else if (effect.target === 'FRIENDLY_UNIT') {
      // 给生命值最低的友方单位添加护盾
      if (player.battlefield.length > 0) {
        const targetUnit = player.battlefield.reduce((min, u) => 
          u.currentHealth < min.currentHealth ? u : min
        );
        targetUnit.addShield(shieldValue, isSpell);
        const shieldType = isSpell ? '法术护盾' : '护盾';
        this.gameState.log(`${targetUnit.card.name} 获得了 ${shieldValue} 点${shieldType}`);
      }
    } else if (effect.target === 'HERO') {
      // 给英雄添加护盾
      if (isSpell) {
        player.hero.spellShield += shieldValue;
      } else {
        player.hero.shield += shieldValue;
      }
      const shieldType = isSpell ? '法术护盾' : '护盾';
      this.gameState.log(`${player.hero.name} 获得了 ${shieldValue} 点${shieldType}`);
    }
  }
  
  // 触发觉醒机制（梅利迪奥斯）
  triggerAwakening(playerId) {
    const player = this.gameState.players[playerId];
    const hero = player.hero;
    
    if (hero.awakened || !hero.awakenThreshold) {
      return;
    }
    
    hero.awakened = true;
    this.gameState.log(`🔥 ${hero.name} 觉醒！进入歼灭模式！`);
    
    // 替换武器为失落之灾
    const lostvayneCard = this.gameState.allCards.find(c => c.id === 'W022');
    if (lostvayneCard) {
      // 移除旧武器
      hero.weapon = null;
      hero.attack = 0;
      
      // 装备新武器
      this.equipWeapon(playerId, lostvayneCard);
      this.gameState.log(`${hero.name} 的武器替换为 ${lostvayneCard.name}！`);
    }
    
    // 替换英雄技能
    const heroData = this.gameState.allHeroes.find(h => h.id === hero.id);
    if (heroData && heroData.awakenedSkill) {
      hero.skill = {
        name: heroData.awakenedSkill.name,
        cost: heroData.awakenedSkill.cost,
        description: heroData.awakenedSkill.description,
        effect: heroData.awakenedSkill.effect,
        usedThisTurn: false
      };
      this.gameState.log(`${hero.name} 的英雄技能变为：${hero.skill.name}`);
    }
  }
  
  // 使用实体分身技能
  useCloneSkill(playerId) {
    const player = this.gameState.players[playerId];
    const hero = player.hero;
    
    if (!hero.awakened || !hero.skill || hero.skill.effect.type !== 'SUMMON_CLONES') {
      return false;
    }
    
    const effect = hero.skill.effect;
    const count = effect.count || 2;
    
    // 重置本回合击杀数
    hero.cloneKillsThisTurn = 0;
    
    // 召唤分身
    for (let i = 0; i < count && player.battlefield.length < 6; i++) {
      const cloneCard = {
        id: 'CLONE_MELIODAS',
        name: '梅利迪奥斯分身',
        type: 'unit',
        cost: 0,
        attack: effect.cloneStats.attack || 1,
        health: effect.cloneStats.health || 1,
        keywords: [...(effect.keywords || ['CHARGE'])],
        description: '梅利迪奥斯的实体分身',
        rarity: 'L',
        isClone: true // 标记为分身
      };
      
      const position = this.findEmptyPosition(player);
      this.playUnit(playerId, cloneCard, position);
      this.gameState.log(`${hero.name} 召唤了 ${cloneCard.name}！`);
    }
    
    return true;
  }
  
  // 处理分身击杀随从时的效果
  handleCloneKill(playerId) {
    const player = this.gameState.players[playerId];
    const hero = player.hero;
    
    if (hero.awakened) {
      hero.cloneKillsThisTurn++;
      hero.attack += 3;
      this.gameState.log(`🔥 ${hero.name} 的分身消灭了一名随从！英雄获得 +3 攻击力（当前攻击力：${hero.attack}）`);
    }
  }
}
