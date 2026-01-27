// src/models/Hero.js
export class Hero {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.health = data.health;
    this.maxHealth = data.health;
    this.skill = {
      name: data.skill.name,
      cost: data.skill.cost,
      description: data.skill.description,
      effect: data.skill.effect,
      usedThisTurn: false
    };
    this.flavorText = data.flavorText;
  }
  
  // 受到伤害
  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }
  
  // 治疗
  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }
  
  // 使用技能
  useSkill() {
    if (this.skill.usedThisTurn) {
      return false;
    }
    this.skill.usedThisTurn = true;
    return true;
  }
  
  // 重置技能使用状态
  resetSkill() {
    this.skill.usedThisTurn = false;
  }
  
  // 是否死亡
  isDead() {
    return this.health <= 0;
  }
}
