// src/utils/Validator.js
export class Validator {
  // 验证卡牌数据
  static validateCard(card) {
    if (!card.id || !card.name || !card.type || card.cost === undefined) {
      return { valid: false, error: '卡牌缺少必需字段' };
    }
    
    if (card.type === 'unit' && (card.attack === undefined || card.health === undefined)) {
      return { valid: false, error: '单位卡牌缺少攻击力或生命值' };
    }
    
    if (card.cost < 0 || card.cost > 10) {
      return { valid: false, error: '卡牌费用无效' };
    }
    
    return { valid: true };
  }
  
  // 验证玩家操作
  static validatePlayCard(player, cardIndex) {
    if (!player.hand[cardIndex]) {
      return { valid: false, error: '无效的卡牌索引' };
    }
    
    const card = player.hand[cardIndex];
    if (player.mana.current < card.cost) {
      return { valid: false, error: '法力不足' };
    }
    
    return { valid: true };
  }
  
  // 验证攻击操作
  static validateAttack(attacker, target, attackerPlayer, targetPlayer) {
    if (!attacker || !target) {
      return { valid: false, error: '攻击者或目标不存在' };
    }
    
    if (attacker.exhausted) {
      return { valid: false, error: '攻击者已疲惫' };
    }
    
    return { valid: true };
  }
}
