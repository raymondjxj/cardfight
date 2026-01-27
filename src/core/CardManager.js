// src/core/CardManager.js
export class CardManager {
  constructor() {
    this.cards = [];
    this.cardsById = new Map();
  }
  
  // 加载卡牌数据
  loadCards(cardsData) {
    this.cards = cardsData;
    this.cardsById.clear();
    cardsData.forEach(card => {
      this.cardsById.set(card.id, card);
    });
  }
  
  // 根据ID获取卡牌
  getCardById(id) {
    return this.cardsById.get(id);
  }
  
  // 创建卡牌实例
  createCardInstance(cardData) {
    return {
      ...cardData,
      instanceId: `${cardData.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
  
  // 创建卡组
  createDeck(cardIds) {
    return cardIds.map(id => {
      const cardData = this.getCardById(id);
      if (!cardData) {
        throw new Error(`卡牌 ${id} 不存在`);
      }
      return this.createCardInstance(cardData);
    });
  }
}
