// src/ui/UIState.js
export class UIState {
  constructor() {
    this.selectedCard = null;
    this.selectedUnit = null;
    this.hoveredCard = null;
    this.hoveredUnit = null;
    this.isAnimating = false;
  }
  
  // 选择卡牌
  selectCard(card, index) {
    this.selectedCard = { card, index };
    this.clearUnitSelection();
  }
  
  // 选择单位
  selectUnit(unit, playerId, unitIndex) {
    this.selectedUnit = { unit, playerId, unitIndex };
    this.clearCardSelection();
  }
  
  // 清除卡牌选择
  clearCardSelection() {
    this.selectedCard = null;
  }
  
  // 清除单位选择
  clearUnitSelection() {
    this.selectedUnit = null;
  }
  
  // 清除所有选择
  clearAll() {
    this.clearCardSelection();
    this.clearUnitSelection();
  }
  
  // 设置悬停卡牌
  setHoveredCard(card) {
    this.hoveredCard = card;
  }
  
  // 设置悬停单位
  setHoveredUnit(unit) {
    this.hoveredUnit = unit;
  }
  
  // 清除悬停状态
  clearHover() {
    this.hoveredCard = null;
    this.hoveredUnit = null;
  }
}
