// src/core/KeywordResolver.js
export class KeywordResolver {
  constructor() {
    this.keywordDefinitions = {};
  }
  
  // 加载关键词定义
  loadKeywords(keywordsData) {
    this.keywordDefinitions = keywordsData;
  }
  
  // 获取关键词信息
  getKeywordInfo(keyword) {
    return this.keywordDefinitions[keyword] || null;
  }
  
  // 检查单位是否有关键词
  hasKeyword(unit, keyword) {
    return unit.keywords.includes(keyword) || unit.keywords.includes(`TEMP_${keyword}`);
  }
  
  // 解析破甲值
  getPierceValue(keywords) {
    for (const keyword of keywords) {
      if (keyword.startsWith('PIERCE_')) {
        return parseInt(keyword.split('_')[1]);
      }
      if (keyword.startsWith('TEMP_PIERCE_')) {
        return parseInt(keyword.split('_')[2]);
      }
    }
    return 0;
  }
  
  // 检查是否可以攻击（考虑冲锋）- 已废弃，使用 Unit.canAttack() 方法
  canAttack(unit) {
    // 使用 Unit 类的统一 canAttack 方法
    return unit.canAttack ? unit.canAttack() : false;
  }
}
