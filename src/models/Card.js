// src/models/Card.js
export class Card {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type; // 'unit' 或 'spell'
    this.cost = data.cost;
    this.attack = data.attack || 0;
    this.health = data.health || 0;
    this.keywords = data.keywords || [];
    this.description = data.description;
    this.rarity = data.rarity;
    
    // 效果
    this.battlecry = data.battlecry;
    this.deathrattle = data.deathrattle;
    this.aura = data.aura;
    this.spellEffect = data.spellEffect;
    
    // 实例属性
    this.instanceId = `${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.owner = null;
    this.position = null;
  }
  
  // 创建单位实例
  createUnit() {
    if (this.type !== 'unit') {
      throw new Error('只有单位卡牌可以创建单位实例');
    }
    
    return {
      card: this,
      id: this.instanceId,
      attack: this.attack,
      health: this.health,
      maxHealth: this.health,
      currentHealth: this.health,
      keywords: [...this.keywords],
      exhausted: true, // 新上场的单位疲惫
      position: null,
      buffs: [],
      debuffs: [],
      owner: this.owner,
      onBoardTurns: 0
    };
  }
  
  // 是否可以攻击
  canAttack(unit) {
    if (unit.exhausted) return false;
    if (unit.keywords.includes('CHARGE')) return true;
    return unit.onBoardTurns > 0; // 实际上场回合数
  }
  
  // 获取破甲值
  getPierceValue() {
    for (const keyword of this.keywords) {
      if (keyword.startsWith('PIERCE_')) {
        return parseInt(keyword.split('_')[1]);
      }
    }
    return 0;
  }
}
