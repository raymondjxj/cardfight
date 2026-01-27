// src/core/AuraManager.js
export class AuraManager {
  constructor(gameState) {
    this.gameState = gameState;
  }
  
  // 更新所有光环效果
  updateAuras() {
    for (const player of Object.values(this.gameState.players)) {
      this.updatePlayerAuras(player);
    }
  }
  
  // 更新玩家的光环效果
  updatePlayerAuras(player) {
    // 重置所有受光环影响的单位
    player.battlefield.forEach(unit => {
      // 清除临时光环效果
      unit.auraAttackBonus = 0;
      unit.auraHealthBonus = 0;
    });
    
    // 应用所有光环
    player.battlefield.forEach(unit => {
      if (unit.card.aura) {
        this.applyAura(unit, player);
      }
    });
  }
  
  // 应用单个光环
  applyAura(auraUnit, player) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuraManager.js:32',message:'applyAura entry',data:{auraUnitName:auraUnit.card.name,auraUnitId:auraUnit.id,hasAura:!!auraUnit.card.aura,auraType:auraUnit.card.aura?.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F,G'})}).catch(()=>{});
    // #endregion
    const aura = auraUnit.card.aura;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuraManager.js:35',message:'aura check',data:{hasAura:!!aura,auraType:aura?.type,auraStats:aura?.stats},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    if (!aura) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuraManager.js:38',message:'no aura found',data:{auraUnitName:auraUnit.card.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    switch (aura.type) {
      case 'SPELL_POWER':
        // 法术伤害加成在BattleSystem中处理
        break;
        
      case 'ADJACENT_BUFF':
        // 相邻单位增益
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuraManager.js:45',message:'ADJACENT_BUFF processing',data:{auraUnitPosition:auraUnit.position,auraStats:aura.stats},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        const adjacentUnits = this.getAdjacentUnits(auraUnit, player);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuraManager.js:47',message:'adjacent units found',data:{adjacentCount:adjacentUnits.length,adjacentNames:adjacentUnits.map(u=>u.card.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        adjacentUnits.forEach(unit => {
          if (aura.stats.attack) {
            unit.auraAttackBonus = (unit.auraAttackBonus || 0) + aura.stats.attack;
          }
          if (aura.stats.health) {
            unit.auraHealthBonus = (unit.auraHealthBonus || 0) + aura.stats.health;
          }
        });
        break;
    }
  }
  
  // 获取相邻单位
  getAdjacentUnits(unit, player) {
    const adjacent = [];
    const pos = unit.position;
    
    // 左侧单位
    if (pos > 0) {
      const leftUnit = player.battlefield.find(u => u.position === pos - 1);
      if (leftUnit) adjacent.push(leftUnit);
    }
    
    // 右侧单位
    if (pos < 2) {
      const rightUnit = player.battlefield.find(u => u.position === pos + 1);
      if (rightUnit) adjacent.push(rightUnit);
    }
    
    return adjacent;
  }
}
