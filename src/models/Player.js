// src/models/Player.js
export class Player {
  constructor(id, heroData) {
    this.id = id;
    // 修复：添加 type 标识，方便判断是否为英雄
    this.hero = {
      id: heroData.id,
      name: heroData.name,
      type: 'HERO', // 添加类型标识
      health: heroData.health,
      maxHealth: heroData.health,
      initialHealth: heroData.health, // 记录初始血量（用于计算额外护甲）
      attack: 0, // 英雄基础攻击力（通过武器增加）
      exhausted: false, // 英雄是否已攻击
      weapon: null, // 装备的武器
      shield: 0, // 护盾值（抵挡物理伤害）
      spellShield: 0, // 法术护盾（抵挡法术伤害）
      divineShield: false, // 圣盾（抵挡一次伤害）
      skill: {
        name: heroData.skill.name,
        cost: heroData.skill.cost,
        description: heroData.skill.description,
        effect: heroData.skill.effect,
        usedThisTurn: false,
        skillState: 0 // 0: 护盾, 1: 圣盾, 2: 护甲
      },
      // 梅利迪奥斯相关属性
      awakened: false, // 是否已觉醒
      awakenThreshold: heroData.awakenThreshold || null, // 觉醒阈值
      fullCounter: heroData.passive && heroData.passive.type === 'FULL_COUNTER', // 全反击被动
      awakenedSkill: heroData.awakenedSkill || null, // 觉醒后的技能
      cloneKillsThisTurn: 0 // 本回合分身击杀数
    };
    this.mana = {
      current: 0,
      total: 0
    };
    this.hand = [];
    this.deck = [];
    this.graveyard = [];
    this.battlefield = []; // 战场上的单位
    this.secrets = [];
    this.fatigueDamage = 1;
  }
  
  // 抽牌
  drawCard() {
    if (this.deck.length === 0) {
      // 疲劳伤害
      this.hero.health -= this.fatigueDamage;
      this.fatigueDamage++;
      return null;
    }
    const card = this.deck.shift();
    this.hand.push(card);
    return card;
  }
  
  // 检查手牌是否已满（最多10张）
  canDrawCard() {
    return this.hand.length < 10;
  }
  
  // 检查战场是否已满（最多6个单位）
  canPlayUnit() {
    return this.battlefield.length < 6;
  }
}
