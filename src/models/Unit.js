// src/models/Unit.js
export class Unit {
  constructor(card, owner) {
    this.card = card;
    this.id = card.instanceId;
    this.attack = card.attack;
    this.health = card.health;
    this.maxHealth = card.health;
    this.currentHealth = card.health;
    this.keywords = card.keywords ? [...card.keywords] : [];
    this.exhausted = true;
    this.position = null;
    this.owner = owner;
    this.buffs = [];
    this.debuffs = [];
    this.onBoardTurns = 0;
    this.shield = 0; // 护盾值（抵挡物理伤害）
    this.spellShield = 0; // 法术护盾（抵挡法术伤害）
    this.divineShield = false; // 圣盾（抵挡一次伤害）
    this.frozen = false; // 冰冻状态
    this.fireEffect = null; // 火焰效果
    this.thunderEffect = null; // 雷特效
    this.poisonEffect = null; // 毒特效
    this.nextTurnCannotAct = false; // 下回合无法行动（由时间冻结者等效果触发）
  }
  
  // 受到伤害（物理伤害）
  takeDamage(amount, isSpell = false) {
    // 检查护盾
    if (isSpell) {
      // 法术伤害，使用法术护盾
      if (this.spellShield > 0) {
        const blocked = Math.min(this.spellShield, amount);
        this.spellShield -= blocked;
        amount -= blocked;
        if (amount <= 0) {
          return false; // 完全被护盾抵挡
        }
      }
    } else {
      // 物理伤害，使用物理护盾
      if (this.shield > 0) {
        const blocked = Math.min(this.shield, amount);
        this.shield -= blocked;
        amount -= blocked;
        if (amount <= 0) {
          return false; // 完全被护盾抵挡
        }
      }
    }
    
    this.currentHealth -= amount;
    return this.currentHealth <= 0;
  }
  
  // 添加护盾
  addShield(amount, isSpell = false) {
    if (isSpell) {
      this.spellShield += amount;
    } else {
      this.shield += amount;
    }
  }
  
  // 治疗
  heal(amount) {
    this.currentHealth = Math.min(this.currentHealth + amount, this.maxHealth);
  }
  
  // 添加关键词
  addKeyword(keyword, temporary = false) {
    if (!this.keywords.includes(keyword)) {
      this.keywords.push(temporary ? `TEMP_${keyword}` : keyword);
    }
  }
  
  // 移除关键词
  removeKeyword(keyword) {
    this.keywords = this.keywords.filter(kw => kw !== keyword && kw !== `TEMP_${keyword}`);
  }
  
  // 添加buff
  addBuff(stats, duration = -1) {
    this.buffs.push({ stats, duration, turnsRemaining: duration });
    this.applyBuffs();
  }
  
  // 应用buff
  applyBuffs() {
    let attackBonus = 0;
    let healthBonus = 0;
    
    this.buffs.forEach(buff => {
      attackBonus += buff.stats.attack || 0;
      healthBonus += buff.stats.health || 0;
    });
    
    this.attack = this.card.attack + attackBonus;
    this.maxHealth = this.card.health + healthBonus;
    if (this.currentHealth > this.maxHealth) {
      this.currentHealth = this.maxHealth;
    }
  }
  
  // 更新buff持续时间
  updateBuffs() {
    this.buffs = this.buffs.filter(buff => {
      if (buff.duration > 0) {
        buff.turnsRemaining--;
        return buff.turnsRemaining > 0;
      }
      return true; // 永久buff
    });
    this.applyBuffs();
  }
  
  // 是否死亡
  isDead() {
    return this.currentHealth <= 0;
  }
  
  // 检查是否可以攻击（统一判断机制）
  canAttack() {
    // 如果已疲惫，无法攻击
    if (this.exhausted) {
      return false;
    }
    
    // 如果被冰冻，无法攻击
    if (this.frozen) {
      return false;
    }
    
    // 如果被时间冻结效果影响，无法攻击
    if (this.nextTurnCannotAct) {
      return false;
    }
    
    // 检查是否满足攻击条件（非冲锋单位需要上场一回合）
    const hasCharge = this.keywords.some(kw => kw.includes('CHARGE'));
    if (!hasCharge && this.onBoardTurns === 0) {
      return false;
    }
    
    return true;
  }
}
