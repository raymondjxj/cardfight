// src/ui/InputHandler.js
export class InputHandler {
  constructor(gameState, battleSystem, renderer) {
    this.gameState = gameState;
    this.battleSystem = battleSystem;
    this.renderer = renderer;
    this.selectedCard = null;
    this.selectedUnit = null;
    this.selectedHero = null;
    this.init();
  }
  
  init() {
    console.log('🔧 InputHandler 初始化...');
    
    // 检查必要的元素是否存在
    if (!this.renderer.elements.endTurnBtn) {
      console.error('❌ 找不到结束回合按钮！');
    }
    if (!this.renderer.elements.playerHand) {
      console.error('❌ 找不到手牌容器！');
    }
    
    // 结束回合按钮
    this.renderer.elements.endTurnBtn.addEventListener('click', () => {
      console.log('🖱️ 结束回合按钮被点击');
      if (this.gameState.currentPlayer === 'PLAYER1' && this.gameState.phase !== 'ENDED') {
        this.gameState.endTurn();
        this.renderer.render();
        
        // 如果是AI回合，等待AI行动后再次渲染
        if (this.gameState.currentPlayer === 'PLAYER2') {
          // AI会在endTurn中自动触发，这里不需要额外处理
        }
      }
    });
    
    // 重置游戏按钮
    const resetBtn = document.getElementById('reset-game');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (window.game) window.game.resetGame();
      });
    }

    // 英雄技能按钮（只在非被动技能时添加点击事件）
    if (this.renderer.elements.heroSkillBtn) {
      this.renderer.elements.heroSkillBtn.addEventListener('click', (e) => {
        const player = this.gameState.players['PLAYER1'];
        const skill = player.hero.skill;
        
        // 如果是被动技能，阻止事件处理
        if (skill && skill.type === 'PASSIVE') {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        // 如果按钮被禁用，也阻止事件
        if (this.renderer.elements.heroSkillBtn.disabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        this.onHeroSkillClick();
      });
    }
    
    // 手牌点击事件委托
    this.renderer.elements.playerHand.addEventListener('click', (e) => {
      console.log('🖱️ 手牌区域被点击');
      const cardElement = e.target.closest('.card');
      if (!cardElement) return;
      
      const cardIndex = parseInt(cardElement.dataset.cardIndex);
      this.onCardClick(cardIndex);
    });
    
    // 手牌悬浮事件 - 显示卡牌详情tooltip
    this.renderer.elements.playerHand.addEventListener('mouseenter', (e) => {
      const cardElement = e.target.closest('.card');
      if (cardElement) {
        const cardIndex = parseInt(cardElement.dataset.cardIndex);
        const player = this.gameState.players['PLAYER1'];
        const card = player.hand[cardIndex];
        if (card) {
          this.renderer.showCardTooltip(card, e);
        }
      }
    }, true);
    
    this.renderer.elements.playerHand.addEventListener('mouseover', (e) => {
      const cardElement = e.target.closest('.card');
      if (cardElement) {
        const cardIndex = parseInt(cardElement.dataset.cardIndex);
        const player = this.gameState.players['PLAYER1'];
        const card = player.hand[cardIndex];
        if (card) {
          this.renderer.showCardTooltip(card, e);
        }
      }
    });
    
    this.renderer.elements.playerHand.addEventListener('mousemove', (e) => {
      const cardElement = e.target.closest('.card');
      if (cardElement) {
        this.renderer.positionTooltip(e);
      }
    });
    
    this.renderer.elements.playerHand.addEventListener('mouseleave', (e) => {
      this.renderer.hideTooltip();
    }, true);
    
    this.renderer.elements.playerHand.addEventListener('mouseout', (e) => {
      const cardElement = e.target.closest('.card');
      const relatedTarget = e.relatedTarget;
      // 只有当鼠标真正离开卡牌区域时才隐藏tooltip
      if (cardElement && relatedTarget && !cardElement.contains(relatedTarget)) {
        this.renderer.hideTooltip();
      } else if (!relatedTarget || !this.renderer.elements.playerHand.contains(relatedTarget)) {
        this.renderer.hideTooltip();
      }
    });
    
    // 战场单位悬浮事件 - 双方战场都可以显示单位详情
    const setupBoardHoverEvents = (boardElement, playerId) => {
      if (!boardElement) return;
      
      boardElement.addEventListener('mouseover', (e) => {
        const unitElement = e.target.closest('.unit');
        if (unitElement) {
          const unitId = unitElement.dataset.unitId;
          const unitPlayerId = unitElement.dataset.player;
          const player = this.gameState.players[unitPlayerId];
          const unit = player.battlefield.find(u => u.id === unitId);
          if (unit) {
            this.renderer.showUnitTooltip(unit, e);
          }
        }
      });
      
      boardElement.addEventListener('mousemove', (e) => {
        const unitElement = e.target.closest('.unit');
        if (unitElement) {
          this.renderer.positionTooltip(e);
        }
      });
      
      boardElement.addEventListener('mouseout', (e) => {
        const unitElement = e.target.closest('.unit');
        const relatedTarget = e.relatedTarget;
        if (unitElement && (!relatedTarget || !unitElement.contains(relatedTarget))) {
          this.renderer.hideTooltip();
        }
      });
    };
    
    // 为双方战场添加悬浮事件
    setupBoardHoverEvents(this.renderer.elements.playerBoard, 'PLAYER1');
    setupBoardHoverEvents(this.renderer.elements.opponentBoard, 'PLAYER2');
    
    // 战场点击事件委托 - 使用捕获阶段确保能捕获到所有点击
    const clickHandler = (e) => {
      const clickedElement = e.target;
      const unitElement = clickedElement.closest('.unit');
      const positionElement = clickedElement.closest('.battlefield-position');
      const heroElement = clickedElement.closest('#opponent-area, #player-area');
      const heroInfoElement = clickedElement.closest('.hero-info');
      
      // 始终输出点击事件日志（便于调试）
      console.log('🖱️ 页面点击事件:', { 
        clickedTag: clickedElement.tagName,
        clickedClass: clickedElement.className,
        clickedId: clickedElement.id,
        unitElement: !!unitElement, 
        positionElement: !!positionElement,
        heroElement: !!heroElement,
        heroInfoElement: !!heroInfoElement,
        selectedUnit: this.selectedUnit ? '已选择' : '未选择',
        selectedCard: this.selectedCard ? '已选择' : '未选择'
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:75',message:'clickHandler entry',data:{hasSelectedCard:!!this.selectedCard,hasSelectedUnit:!!this.selectedUnit,hasSelectedHero:!!this.selectedHero,clickedId:clickedElement.id,clickedClass:clickedElement.className,hasHeroAvatar:!!clickedElement.closest('.hero-avatar'),hasHeroDetails:!!clickedElement.closest('.hero-details')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (unitElement) {
        const playerId = unitElement.dataset.player;
        const unitId = unitElement.dataset.unitId;
        console.log('✅ 检测到单位元素:', { playerId, unitId, element: unitElement });
        
        // 优先检查是否选择了法术卡牌（需要选择目标）
        if (this.selectedCard && this.selectedCard.card.type === 'spell') {
          const card = this.selectedCard.card;
          const spellType = card.spellEffect?.type;
          const isBuffSpell = spellType && (spellType.startsWith('BUFF_') || spellType === 'ADD_SHIELD' || spellType === 'ADD_DIVINE_SHIELD');
          
          // 增益法术只能选择友方单位，直伤法术可以选择敌方单位
          if ((isBuffSpell && playerId === 'PLAYER1') || (!isBuffSpell && playerId === 'PLAYER2')) {
            const targetPlayerId = playerId;
            const unitIndex = this.gameState.players[targetPlayerId].battlefield.findIndex(u => u.id === unitId);
            if (unitIndex !== -1) {
              console.log(`✅ 使用法术 ${card.name} 对单位，索引: ${unitIndex}`);
              
              // 播放法术飞行特效（直伤法术）
              if (!isBuffSpell && spellType && this.renderer.playSpellProjectileEffect) {
                const targetElement = unitElement;
                this.renderer.playSpellProjectileEffect(spellType, 'PLAYER1', 'PLAYER2', targetElement, false).then(() => {
                  this.battleSystem.playCard('PLAYER1', this.selectedCard.index, unitIndex);
                  this.selectedCard = null;
                  this.clearHighlights();
                  this.renderer.render();
                });
                return;
              }
              
              // 增益法术或不需要特效的直伤法术
              const success = this.battleSystem.playCard('PLAYER1', this.selectedCard.index, unitIndex);
              
              // 如果是护盾法术，显示特效
              if (success && spellType === 'ADD_SHIELD') {
                this.showShieldEffect(targetPlayerId, false, unitId);
              }
              
              this.selectedCard = null;
              this.clearHighlights();
              this.renderer.render();
              return;
            }
          }
        }
        
        if (playerId && unitId) {
          this.onUnitClick(playerId, unitId);
        } else {
          console.warn('⚠️ 单位元素缺少必要属性:', { playerId, unitId });
        }
        return;
      }
      
      if (positionElement && this.selectedCard) {
        // 点击空位置放置单位
        const position = parseInt(positionElement.dataset.position);
        const playerId = positionElement.dataset.player;
        if (playerId === 'PLAYER1') {
          this.onPositionClick(position);
        }
        return;
      }
      
      // 检查是否点击了英雄头像或英雄信息区域
      const heroAvatarElement = clickedElement.closest('.hero-avatar');
      const heroDetailsElement = clickedElement.closest('.hero-details');
      const heroInfoElementNew = clickedElement.closest('.player-hero-info, .opponent-hero-info, .player-hero-stats, .opponent-hero-stats, .player-hero-compact, .opponent-hero-compact');
      const heroNameElement = clickedElement.closest('.hero-name');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:244',message:'hero click detection',data:{hasHeroAvatar:!!heroAvatarElement,hasHeroDetails:!!heroDetailsElement,hasHeroInfoNew:!!heroInfoElementNew,hasHeroName:!!heroNameElement,hasHeroElement:!!heroElement,hasHeroInfoElement:!!heroInfoElement,selectedUnit:!!this.selectedUnit,selectedHero:!!this.selectedHero,selectedCard:!!this.selectedCard,clickedId:clickedElement.id,clickedClass:clickedElement.className},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // 合并所有英雄相关元素检测
      // 注意：如果点击的是hero-avatar，需要向上查找父元素来确定是玩家还是对手
      let heroRelatedElement = heroDetailsElement || heroInfoElementNew || heroNameElement;
      if (!heroRelatedElement) {
        // 如果点击的是hero-avatar，需要向上查找父容器
        if (heroAvatarElement) {
          heroRelatedElement = heroAvatarElement.closest('.player-hero-compact, .opponent-hero-compact, .player-hero-left, .opponent-hero-left') || heroAvatarElement;
        } else {
          heroRelatedElement = clickedElement.closest('.player-hero-compact, .opponent-hero-compact, .player-hero-left, .opponent-hero-left');
        }
      }
      
      if ((heroElement || heroInfoElement || heroRelatedElement) && this.selectedUnit) {
        // 点击英雄区域作为攻击目标（单位攻击英雄）
        const targetElement = heroInfoElement || heroRelatedElement;
        const targetPlayerId = heroElement ? 
          (heroElement.id === 'opponent-area' ? 'PLAYER2' : 'PLAYER1') :
          targetElement ?
          (targetElement.closest('#opponent-area, .opponent-hero-left, .opponent-hero-compact') ? 'PLAYER2' : 
           targetElement.closest('#player-area, .player-hero-left, .player-hero-compact') ? 'PLAYER1' :
           (targetElement.id === 'opponent-avatar' || targetElement.id === 'opponent-hero-name' ? 'PLAYER2' : 'PLAYER1')) :
          'PLAYER1';
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:253',message:'unit attack hero target',data:{targetPlayerId,hasSelectedUnit:!!this.selectedUnit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        if (targetPlayerId === 'PLAYER2') {
          console.log('✅ 点击英雄区域作为攻击目标');
          this.onHeroClick(targetPlayerId);
        }
        return;
      }
      
      // 检查是否点击了玩家自己的英雄（选择英雄作为攻击者）
      if (heroRelatedElement && !this.selectedUnit && !this.selectedHero && !this.selectedCard) {
        const playerAreaCheck = heroRelatedElement.closest('#player-area, .player-hero-left, .player-hero-compact');
        const opponentAreaCheck = heroRelatedElement.closest('#opponent-area, .opponent-hero-left, .opponent-hero-compact');
        let clickedPlayerId = playerAreaCheck ? 'PLAYER1' : opponentAreaCheck ? 'PLAYER2' : null;
        if (clickedPlayerId == null) {
          const avatarOrName = clickedElement && clickedElement.closest && clickedElement.closest('.hero-avatar, .hero-name');
          const id = (heroRelatedElement && heroRelatedElement.id) || (avatarOrName && avatarOrName.id) || (clickedElement && clickedElement.id) || '';
          if (id === 'player-avatar' || id === 'player-hero-name') clickedPlayerId = 'PLAYER1';
          else if (id === 'opponent-avatar' || id === 'opponent-hero-name') clickedPlayerId = 'PLAYER2';
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:269',message:'hero attacker selection',data:{clickedPlayerId,hasHeroRelated:!!heroRelatedElement,heroRelatedElementId:heroRelatedElement?.id,hasPlayerAreaCheck:!!playerAreaCheck,hasOpponentAreaCheck:!!opponentAreaCheck,hasWeapon:!!this.gameState.players['PLAYER1']?.hero?.weapon,heroAttack:this.gameState.players['PLAYER1']?.hero?.attack,heroExhausted:this.gameState.players['PLAYER1']?.hero?.exhausted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (clickedPlayerId === 'PLAYER1') {
          console.log('✅ 点击玩家英雄，尝试选择为攻击者');
          this.onHeroClick('PLAYER1');
        }
        return;
      }
      
      // 检查是否已选择英雄，点击敌方单位或英雄
      if (this.selectedHero && (unitElement || heroElement || heroInfoElement || heroRelatedElement)) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:282',message:'hero attack target selection',data:{hasUnitElement:!!unitElement,hasHeroElement:!!heroElement,hasHeroRelated:!!heroRelatedElement,selectedHeroPlayerId:this.selectedHero?.playerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        if (unitElement && unitElement.dataset.player === 'PLAYER2') {
          // 英雄攻击单位
          const unitId = unitElement.dataset.unitId;
          this.onUnitClickForHero('PLAYER2', unitId);
          return;
        } else if ((heroElement || heroInfoElement || heroRelatedElement)) {
          const targetElement = heroInfoElement || heroRelatedElement;
          let targetPlayerId = heroElement ? 
            (heroElement.id === 'opponent-area' ? 'PLAYER2' : 'PLAYER1') :
            targetElement ?
            (targetElement.closest('#opponent-area, .opponent-hero-left, .opponent-hero-compact') ? 'PLAYER2' : 
             targetElement.closest('#player-area, .player-hero-left, .player-hero-compact') ? 'PLAYER1' :
             (targetElement.id === 'opponent-avatar' || targetElement.id === 'opponent-hero-name' ? 'PLAYER2' : 'PLAYER1')) :
            null;
          if (targetPlayerId == null && clickedElement) {
            const avatarOrName = clickedElement.closest && clickedElement.closest('.hero-avatar, .hero-name');
            const id = (avatarOrName && avatarOrName.id) || clickedElement.id || '';
            if (id === 'opponent-avatar' || id === 'opponent-hero-name') targetPlayerId = 'PLAYER2';
            else if (id === 'player-avatar' || id === 'player-hero-name') targetPlayerId = 'PLAYER1';
          }
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:291',message:'hero attack hero target check',data:{targetPlayerId,targetElementId:targetElement?.id,clickedId:clickedElement?.id,closestOpponentArea:!!targetElement?.closest('#opponent-area, .opponent-hero-left'),closestPlayerArea:!!targetElement?.closest('#player-area, .player-hero-left')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          if (targetPlayerId === 'PLAYER2') {
            // 英雄攻击英雄
            console.log('✅ 英雄攻击英雄，调用onHeroClick');
            this.onHeroClick('PLAYER2');
            return;
          }
        }
      }
      
      // 检查是否已选择法术卡牌，点击单位或英雄作为目标（支持双方）
      // 优先处理法术目标选择，避免被其他逻辑拦截
      if (this.selectedCard && this.selectedCard.card.type === 'spell') {
        const card = this.selectedCard.card;
        const spellType = card.spellEffect?.type;
        const isBuffSpell = spellType && (spellType.startsWith('BUFF_') || spellType === 'ADD_SHIELD' || spellType === 'ADD_DIVINE_SHIELD');
        
        // 检查是否点击了任何可目标元素（单位或英雄区域）
        const heroInfoElementNewForSpell = clickedElement.closest('.player-hero-info, .opponent-hero-info, .player-hero-stats, .opponent-hero-stats, .player-hero-compact, .opponent-hero-compact, .hero-name');
        const hasValidTarget = unitElement || heroElement || heroInfoElement || heroAvatarElement || heroDetailsElement || heroInfoElementNewForSpell;
        
        if (hasValidTarget) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:171',message:'spell target block hit',data:{spellName:card.name,spellType,hasHeroElement:!!heroElement,hasHeroAvatar:!!heroAvatarElement,hasHeroDetails:!!heroDetailsElement,hasUnitElement:!!unitElement},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          // 确定目标玩家ID
          let targetPlayerId = null;
          if (unitElement) {
            targetPlayerId = unitElement.dataset.player;
          } else if (heroElement) {
            targetPlayerId = heroElement.id === 'opponent-area' ? 'PLAYER2' : 'PLAYER1';
          } else if (heroInfoElement || heroAvatarElement || heroDetailsElement || heroInfoElementNewForSpell) {
            const heroTargetElement = heroInfoElement || heroAvatarElement || heroDetailsElement || heroInfoElementNewForSpell;
            const closestArea = heroTargetElement.closest('#opponent-area, #player-area, .opponent-hero-left, .player-hero-left, .opponent-hero-compact, .player-hero-compact');
            if (closestArea) {
              if (closestArea.id === 'opponent-area' || closestArea.classList.contains('opponent-hero-left') || closestArea.classList.contains('opponent-hero-compact')) {
                targetPlayerId = 'PLAYER2';
              } else {
                targetPlayerId = 'PLAYER1';
              }
            }
          }
          
          if (targetPlayerId) {
            // 检查目标是否合法
            if (isBuffSpell && targetPlayerId !== 'PLAYER1') {
              // 增益法术只能对友方使用
              this.gameState.log('增益法术只能对友方单位或英雄使用');
              this.showMessage('增益法术只能对友方单位或英雄使用', 'warning');
              return;
            }
            
            if (unitElement) {
              // 法术目标：单位
              const unitId = unitElement.dataset.unitId;
              const targetPlayer = this.gameState.players[targetPlayerId];
              
              // 检查增益法术只能对己方单位使用
              if (isBuffSpell && targetPlayerId !== 'PLAYER1') {
                this.gameState.log('增益法术只能对友方单位或英雄使用');
                this.showMessage('增益法术只能对友方单位或英雄使用', 'warning');
                return;
              }
              
              // 检查直伤法术只能对敌方单位使用（不能对己方单位）
              const isDirectDamageSpell = spellType && (
                spellType === 'DAMAGE_WITH_FREEZE' ||
                spellType === 'DAMAGE_WITH_THUNDER' ||
                spellType === 'DAMAGE_WITH_FIRE' ||
                spellType === 'DAMAGE_WITH_POISON'
              );
              if (isDirectDamageSpell && targetPlayerId === 'PLAYER1') {
                this.gameState.log('直伤法术只能对敌方单位或英雄使用');
                this.showMessage('直伤法术只能对敌方单位或英雄使用', 'warning');
                return;
              }
              
              const unitIndex = targetPlayer.battlefield.findIndex(u => u.id === unitId);
              if (unitIndex !== -1) {
                // 播放法术飞行特效（直伤法术）
                if (isDirectDamageSpell && this.renderer.playSpellProjectileEffect) {
                  const targetElement = document.querySelector(`[data-unit-id="${unitId}"][data-player="${targetPlayerId}"]`);
                  this.renderer.playSpellProjectileEffect(spellType, 'PLAYER1', targetPlayerId, targetElement, false).then(() => {
                    this.battleSystem.playCard('PLAYER1', this.selectedCard.index, unitIndex);
                    this.selectedCard = null;
                    this.clearHighlights();
                    this.renderer.render();
                  });
                  return;
                }
                
                const success = this.battleSystem.playCard('PLAYER1', this.selectedCard.index, unitIndex);
                
                // 如果是护盾法术，显示特效
                if (success && spellType === 'ADD_SHIELD') {
                  this.showShieldEffect(targetPlayerId, false, unitId);
                }
                
                this.selectedCard = null;
                this.clearHighlights();
                this.renderer.render();
                return;
              }
            } else {
              // 法术目标：英雄（包括双方英雄）
              console.log('🎯 法术目标：英雄', { targetPlayerId, isBuffSpell, spellType });
              
              // 检查增益法术只能对己方英雄使用
              if (isBuffSpell) {
                if (targetPlayerId !== 'PLAYER1') {
                  this.gameState.log('增益法术只能对友方单位或英雄使用');
                  this.showMessage('增益法术只能对友方单位或英雄使用', 'warning');
                  return;
                }
                // 增益法术：对己方英雄
                const success = this.battleSystem.playCard('PLAYER1', this.selectedCard.index, 'hero');
                
                // 如果是护盾法术，显示特效
                if (success && spellType === 'ADD_SHIELD') {
                  this.showShieldEffect('PLAYER1', true);
                }
              } else {
                // 直伤法术：可以攻击双方英雄
                // 传递目标玩家ID（'PLAYER1' 或 'PLAYER2'）
                
                // 播放法术飞行特效
                const targetElement = document.getElementById(targetPlayerId === 'PLAYER1' ? 'player-area' : 'opponent-area');
                if (this.renderer.playSpellProjectileEffect) {
                  this.renderer.playSpellProjectileEffect(spellType, 'PLAYER1', targetPlayerId, targetElement, true).then(() => {
                    const success = this.battleSystem.playCard('PLAYER1', this.selectedCard.index, targetPlayerId);
                    if (!success) {
                      this.showMessage('法术施放失败', 'error');
                    }
                    this.selectedCard = null;
                    this.clearHighlights();
                    this.renderer.render();
                  });
                  return;
                }
                
                const success = this.battleSystem.playCard('PLAYER1', this.selectedCard.index, targetPlayerId);
                if (!success) {
                  this.showMessage('法术施放失败', 'error');
                }
              }
              this.selectedCard = null;
              this.clearHighlights();
              this.renderer.render();
              return;
            }
          }
        }
      }
    };
    
    // 绑定点击事件
    document.addEventListener('click', clickHandler, true); // 使用捕获阶段
    console.log('✅ 点击事件监听器已绑定');
    
    // 测试：点击body也会触发
    document.body.addEventListener('click', () => {
      console.log('🖱️ Body被点击（测试事件是否工作）');
    });
    
    // 设置按钮
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.getElementById('settings-close');
    const customizePlayerAvatar = document.getElementById('customize-player-avatar');
    const customizeOpponentAvatar = document.getElementById('customize-opponent-avatar');
    
    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
      });
    }
    
    if (settingsClose) {
      settingsClose.addEventListener('click', () => {
        settingsModal.style.display = 'none';
      });
    }
    
    // 点击模态框外部关闭
    if (settingsModal) {
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
          settingsModal.style.display = 'none';
        }
      });
    }
    
    // 自定义头像按钮
    if (customizePlayerAvatar) {
      customizePlayerAvatar.addEventListener('click', () => {
        this.renderer.showAvatarCustomizer('PLAYER1');
        settingsModal.style.display = 'none';
      });
    }
    
    if (customizeOpponentAvatar) {
      customizeOpponentAvatar.addEventListener('click', () => {
        this.renderer.showAvatarCustomizer('PLAYER2');
        settingsModal.style.display = 'none';
      });
    }
    
    console.log('✅ InputHandler 初始化完成');
  }
  
  // 卡牌点击
  onCardClick(cardIndex) {
    if (this.gameState.currentPlayer !== 'PLAYER1' || this.gameState.phase === 'ENDED') {
      return;
    }
    
    const player = this.gameState.players['PLAYER1'];
    const card = player.hand[cardIndex];
    
    if (!card) return;
    
    // 检查是否可以出牌
    if (player.mana.current < card.cost) {
      this.gameState.log(`法力不足，无法使用 ${card.name}`);
      return;
    }
    
    if (card.type === 'unit') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:219',message:'unit card clicked',data:{cardName:card.name,cardAura:card.aura,cardCost:card.cost,currentMana:player.mana.current,battlefieldLength:player.battlefield.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // 选择放置位置
      this.gameState.log(`选择放置 ${card.name} 的位置 (点击战场空位)`);
      this.selectedCard = { index: cardIndex, card };
      this.clearSelection();
      
      // 高亮可放置位置
      this.highlightEmptyPositions();
    } else if (card.type === 'weapon') {
      // 武器牌：直接装备
      this.battleSystem.playCard('PLAYER1', cardIndex);
      this.renderer.render();
      
      // 装备武器后，如果英雄未疲惫，可以选择攻击
      const player = this.gameState.players['PLAYER1'];
      if (player.hero.weapon && player.hero.attack > 0 && !player.hero.exhausted) {
        this.showMessage(`装备了 ${card.name}！可以立即攻击`, 'success');
        this.gameState.log(`${player.hero.name} 装备了 ${card.name}，可以立即攻击`);
      }
    } else if (card.type === 'spell') {
      const spellType = card.spellEffect?.type;
      
      // AOE法术：直接使用，不需要选择目标
      const isAoeSpell = spellType === 'AOE_DAMAGE' || 
                         spellType === 'AOE_DAMAGE_WITH_FREEZE' || 
                         spellType === 'AOE_DAMAGE_WITH_THUNDER';
      
      if (isAoeSpell) {
        // AOE法术直接使用
        this.battleSystem.playCard('PLAYER1', cardIndex);
        this.renderer.render();
      } else if (spellType === 'DAMAGE_WITH_FREEZE' ||
                 spellType === 'DAMAGE_WITH_THUNDER' ||
                 spellType === 'DAMAGE_WITH_FIRE' ||
                 spellType === 'DAMAGE_WITH_POISON' ||
                 spellType === 'BUFF_ATTACK' ||
                 spellType === 'BUFF_HEALTH' ||
                 spellType === 'BUFF_STATS' ||
                 spellType === 'ADD_SHIELD' ||
                 spellType === 'ADD_DIVINE_SHIELD' ||
                 (card.spellEffect?.target === 'TARGET')) {
        // 直伤法术、增益法术或其他需要目标的法术：进入目标选择模式
        const isFriendlyOnly = spellType && (spellType.startsWith('BUFF_') || spellType === 'ADD_SHIELD' || spellType === 'ADD_DIVINE_SHIELD');
        const targetHint = isFriendlyOnly ? 
          '点击友方单位或英雄' : '点击单位或英雄（可选中双方）';
        this.gameState.log(`选择 ${card.name} 的目标（${targetHint}）`);
        this.selectedCard = { index: cardIndex, card };
        this.clearSelection();
        this.highlightValidTargets();
      } else {
        // 其他不需要目标的法术：直接使用
        this.battleSystem.playCard('PLAYER1', cardIndex);
        this.renderer.render();
      }
    } else {
      // 其他类型卡牌
      this.battleSystem.playCard('PLAYER1', cardIndex);
      this.renderer.render();
    }
  }
  
  // 位置点击
  onPositionClick(position) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:246',message:'onPositionClick entry',data:{hasSelectedCard:!!this.selectedCard,selectedCardName:this.selectedCard?.card?.name,selectedCardAura:this.selectedCard?.card?.aura,position},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (this.selectedCard) {
      const player = this.gameState.players['PLAYER1'];
      const occupied = player.battlefield.map(u => u.position);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:250',message:'position check',data:{position,occupied,isOccupied:occupied.includes(position)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      if (!occupied.includes(position)) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:252',message:'calling playCard',data:{cardIndex:this.selectedCard.index,cardName:this.selectedCard.card.name,position},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        const result = this.battleSystem.playCard('PLAYER1', this.selectedCard.index, position);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:253',message:'playCard result',data:{result,cardName:this.selectedCard.card.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        this.selectedCard = null;
        this.clearHighlights();
        this.renderer.render();
      }
    }
  }
  
  // 单位点击
  onUnitClick(playerId, unitId) {
    console.log('🎯 单位点击:', { 
      playerId, 
      unitId, 
      selectedUnit: this.selectedUnit ? '已选择' : '未选择', 
      currentPlayer: this.gameState.currentPlayer,
      phase: this.gameState.phase
    });
    
    if (this.gameState.currentPlayer !== 'PLAYER1' || this.gameState.phase === 'ENDED') {
      console.log('不是玩家回合或游戏已结束');
      return;
    }
    
    if (playerId === 'PLAYER1') {
      // 点击己方单位 - 优先检查是否选择了增益法术
      if (this.selectedCard && this.selectedCard.card.type === 'spell') {
        const card = this.selectedCard.card;
        const spellType = card.spellEffect?.type;
        const isBuffSpell = spellType && (spellType.startsWith('BUFF_') || spellType === 'ADD_SHIELD' || spellType === 'ADD_DIVINE_SHIELD');
        
        if (isBuffSpell) {
          // 增益法术：对友方单位使用
          const unitIndex = this.gameState.players['PLAYER1'].battlefield.findIndex(u => u.id === unitId);
          if (unitIndex !== -1) {
            console.log(`✅ 使用增益法术 ${card.name} 对友方单位，索引: ${unitIndex}`);
            const success = this.battleSystem.playCard('PLAYER1', this.selectedCard.index, unitIndex);
            
            // 如果是护盾法术，显示特效
            if (success && spellType === 'ADD_SHIELD') {
              this.showShieldEffect('PLAYER1', false, unitId);
            }
            
            this.selectedCard = null;
            this.clearHighlights();
            this.renderer.render();
            return;
          }
        }
      }
      
      // 点击己方单位 - 选择攻击者
      console.log('⚔️ 选择攻击者');
      this.selectAttacker(playerId, unitId);
    } else if (playerId === 'PLAYER2') {
      // 点击敌方单位 - 选择目标
      console.log('🎯 选择攻击目标');
      
      // 优先检查是否选择了法术卡牌
      if (this.selectedCard && this.selectedCard.card.type === 'spell') {
        // 使用法术卡牌（需要选择目标）
        const card = this.selectedCard.card;
        const unitIndex = this.gameState.players[playerId].battlefield.findIndex(u => u.id === unitId);
        if (unitIndex !== -1) {
          console.log(`✅ 使用法术 ${card.name} 攻击单位，索引: ${unitIndex}`);
          this.battleSystem.playCard('PLAYER1', this.selectedCard.index, unitIndex);
          this.selectedCard = null;
          this.clearHighlights();
          this.renderer.render();
        } else {
          console.warn('⚠️ 未找到目标单位');
        }
      } else if (this.selectedUnit) {
        // 单位攻击单位
        console.log('✅ 已选择攻击者，开始攻击流程');
        this.selectTarget(playerId, unitId);
      } else if (this.selectedHero) {
        // 英雄攻击单位
        this.onUnitClickForHero(playerId, unitId);
      } else {
        const message = '请先选择攻击者（单位或英雄）或法术卡牌，然后再点击敌方单位';
        console.warn('⚠️', message);
        this.gameState.log(message);
        this.showMessage(message, 'warning');
      }
    }
  }
  
  // 英雄点击
  async onHeroClick(playerId) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:682',message:'onHeroClick entry',data:{playerId,currentPlayer:this.gameState.currentPlayer,phase:this.gameState.phase,hasSelectedHero:!!this.selectedHero,hasSelectedUnit:!!this.selectedUnit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (this.gameState.currentPlayer !== 'PLAYER1' || this.gameState.phase === 'ENDED') {
      return;
    }
    
    const player = this.gameState.players['PLAYER1'];
    const hero = player.hero;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:690',message:'hero state check',data:{playerId,hasWeapon:!!hero.weapon,heroAttack:hero.attack,heroExhausted:hero.exhausted,hasSelectedHero:!!this.selectedHero,selectedHeroPlayerId:this.selectedHero?.playerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // 情况1: 如果已选择单位，单位攻击英雄
    if (this.selectedUnit && playerId === 'PLAYER2') {
      const { playerId: attackerPlayerId, unitIndex, unit: attacker } = this.selectedUnit;
      const targetPlayer = this.gameState.players[playerId];
      const target = targetPlayer.hero;
      
      // 显示攻击动画
      await this.playAttackAnimation(attacker, target, true);
      
      // 执行攻击
      const beforeHealth = target.health;
      const success = this.battleSystem.unitAttack(attackerPlayerId, unitIndex, playerId, 'hero');
      
      if (success) {
        const afterHealth = target.health;
        const damage = beforeHealth - afterHealth;
        
        // 显示伤害数字和特效
        this.showHeroDamageEffect(targetPlayer, damage);
        this.showDamageNumber(target, damage, true);
        this.shakeScreen();
        
        // 显示攻击结果消息
        this.showMessage(`${attacker.card.name} 攻击了 ${target.name}，造成 ${damage} 点伤害！`, 'success');
        this.gameState.log(`${attacker.card.name} 攻击了 ${target.name}，造成 ${damage} 点伤害！`);
        
        // 延迟后清除选择并重新渲染
        setTimeout(() => {
          this.selectedUnit = null;
          this.clearHighlights();
          this.renderer.render();
        }, 500);
      } else {
        this.showMessage('攻击失败', 'error');
      }
    }
    // 情况2: 如果点击己方英雄，选择英雄作为攻击者
    else if (playerId === 'PLAYER1' && hero.weapon && hero.attack > 0 && !hero.exhausted) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:727',message:'selecting hero as attacker',data:{heroName:hero.name,heroAttack:hero.attack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      this.selectedHero = { playerId: 'PLAYER1', hero };
      this.showMessage(`已选择 ${hero.name} (${hero.attack}攻击力)，请点击敌方单位或英雄进行攻击`, 'info');
      this.gameState.log(`已选择 ${hero.name}，请点击敌方单位或英雄进行攻击`);
    }
    // 情况3: 如果已选择英雄，英雄攻击目标
    else if (this.selectedHero && playerId === 'PLAYER2') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:733',message:'hero attacking hero',data:{attackerName:hero.name,attackerAttack:hero.attack,targetPlayerId:playerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      const targetPlayer = this.gameState.players[playerId];
      const target = targetPlayer.hero;
      
      // 显示攻击动画
      await this.playHeroAttackAnimation(hero, target, true);
      
      // 执行攻击
      const beforeHealth = target.health;
      const success = this.battleSystem.heroAttack('PLAYER1', playerId, 'hero');
      
      if (success) {
        const afterHealth = target.health;
        const damage = beforeHealth - afterHealth;
        
        // 显示伤害数字和特效
        this.showHeroDamageEffect(targetPlayer, damage);
        this.showDamageNumber(target, damage, true);
        this.shakeScreen();
        
        // 显示攻击结果消息
        this.showMessage(`${hero.name} 攻击了 ${target.name}，造成 ${damage} 点伤害！`, 'success');
        this.gameState.log(`${hero.name} 攻击了 ${target.name}，造成 ${damage} 点伤害！`);
        
        // 延迟后清除选择并重新渲染
        setTimeout(() => {
          this.selectedHero = null;
          this.clearHighlights();
          this.renderer.render();
        }, 500);
      } else {
        this.showMessage('攻击失败', 'error');
      }
    }
  }
  
  // 英雄攻击单位
  async onUnitClickForHero(playerId, unitId) {
    if (this.selectedHero && playerId === 'PLAYER2') {
      const hero = this.selectedHero.hero;
      const targetPlayer = this.gameState.players[playerId];
      const targetIndex = targetPlayer.battlefield.findIndex(u => u.id === unitId);
      
      if (targetIndex === -1) return;
      
      const target = targetPlayer.battlefield[targetIndex];
      
      // 显示攻击动画
      await this.playHeroAttackAnimation(hero, target, false);
      
      // 执行攻击
      const beforeHealth = target.currentHealth;
      const success = this.battleSystem.heroAttack('PLAYER1', playerId, targetIndex);
      
      if (success) {
        const afterHealth = target.currentHealth;
        const damage = Math.max(0, beforeHealth - afterHealth);
        
        // 显示伤害数字
        this.showDamageNumber(target, damage, false);
        this.shakeScreen();
        
        // 显示攻击结果消息
        this.showMessage(`${hero.name} 攻击了 ${target.card.name}，造成 ${damage} 点伤害！`, 'success');
        this.gameState.log(`${hero.name} 攻击了 ${target.card.name}，造成 ${damage} 点伤害！`);
        
        // 延迟后清除选择并重新渲染
        setTimeout(() => {
          this.selectedHero = null;
          this.clearHighlights();
          this.renderer.render();
        }, 500);
      }
    }
  }
  
  // 播放英雄攻击动画（支持双方玩家）
  async playHeroAttackAnimation(hero, target, isHeroTarget, attackerPlayerId = 'PLAYER1', targetPlayerId = 'PLAYER2') {
    const heroElement = document.getElementById(attackerPlayerId === 'PLAYER1' ? 'player-area' : 'opponent-area');
    const targetElement = isHeroTarget ? 
      document.getElementById(targetPlayerId === 'PLAYER1' ? 'player-area' : 'opponent-area') :
      document.querySelector(`[data-unit-id="${target.id}"][data-player="${targetPlayerId}"]`);
    
    if (heroElement) {
      heroElement.classList.add('hero-attacking');
    }
    
    if (targetElement) {
      targetElement.classList.add('being-attacked');
    }
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (heroElement) {
      heroElement.classList.remove('hero-attacking');
    }
    
    if (targetElement) {
      targetElement.classList.remove('being-attacked');
    }
  }
  
  // 显示英雄受伤害特效
  showHeroDamageEffect(targetPlayer, damage) {
    const heroArea = targetPlayer.id === 'PLAYER1' ? 
      document.getElementById('player-area') :
      document.getElementById('opponent-area');
    
    if (heroArea) {
      heroArea.classList.add('hero-take-damage');
      
      // 添加伤害粒子效果
      const particles = document.createElement('div');
      particles.className = 'damage-particles';
      particles.textContent = '💥';
      heroArea.appendChild(particles);
      
      setTimeout(() => {
        heroArea.classList.remove('hero-take-damage');
        if (particles.parentNode) {
          particles.remove();
        }
      }, 1000);
    }
  }
  
  // 显示英雄治疗特效
  showHeroHealEffect(targetPlayer, healAmount) {
    const heroArea = targetPlayer.id === 'PLAYER1' ? 
      document.getElementById('player-area') :
      document.getElementById('opponent-area');
    
    if (heroArea) {
      heroArea.classList.add('hero-heal');
      
      // 添加治疗粒子效果
      const particles = document.createElement('div');
      particles.className = 'heal-particles';
      particles.textContent = '✨';
      heroArea.appendChild(particles);
      
      setTimeout(() => {
        heroArea.classList.remove('hero-heal');
        if (particles.parentNode) {
          particles.remove();
        }
      }, 1000);
    }
  }
  
  // 显示护盾特效（单位或英雄）
  showShieldEffect(targetPlayerId, isHero, unitId = null) {
    let targetElement = null;
    
    if (isHero) {
      // 英雄目标
      targetElement = targetPlayerId === 'PLAYER1' ? 
        document.getElementById('player-area') :
        document.getElementById('opponent-area');
    } else {
      // 单位目标
      targetElement = document.querySelector(`[data-unit-id="${unitId}"][data-player="${targetPlayerId}"]`);
    }
    
    if (targetElement) {
      targetElement.classList.add('shield-effect');
      
      // 添加护盾粒子效果
      const particles = document.createElement('div');
      particles.className = 'shield-particles';
      particles.textContent = '🛡️';
      targetElement.appendChild(particles);
      
      setTimeout(() => {
        targetElement.classList.remove('shield-effect');
        if (particles.parentNode) {
          particles.remove();
        }
      }, 1000);
    }
  }
  
  // 选择攻击者
  selectAttacker(playerId, unitId) {
    console.log('selectAttacker 被调用:', { playerId, unitId });
    const player = this.gameState.players[playerId];
    const unitIndex = player.battlefield.findIndex(u => u.id === unitId);
    
    console.log('单位索引:', unitIndex, '战场单位:', player.battlefield.map(u => ({ id: u.id, name: u.card.name })));
    
    if (unitIndex === -1) {
      console.error('找不到单位:', unitId);
      return;
    }
    
    const unit = player.battlefield[unitIndex];
    
    // 检查单位是否可以攻击（使用统一的 canAttack 方法）
    if (!unit.canAttack()) {
      let reason = '';
      if (unit.exhausted) {
        reason = '已疲惫';
      } else if (unit.frozen) {
        reason = '被冰冻';
      } else if (unit.nextTurnCannotAct) {
        reason = '被时间冻结';
      } else {
        reason = '需要等待一回合';
      }
      this.gameState.log(`${unit.card.name} ${reason}，无法攻击`);
      this.showMessage(`${unit.card.name} ${reason}，无法攻击`, 'warning');
      return;
    }
    
    this.selectedUnit = { playerId, unitIndex, unit };
    console.log('已选择攻击单位:', this.selectedUnit);
    
    // 显示提示消息
    this.showMessage(`已选择 ${unit.card.name} (${unit.attack}攻击力)，请点击敌方单位或英雄进行攻击`, 'info');
    this.gameState.log(`已选择 ${unit.card.name}，请点击敌方单位或英雄进行攻击`);
    
    this.clearSelection();
    
    // 高亮可攻击目标
    this.highlightValidTargets();
    
    // 高亮选中的攻击单位
    const attackerElement = document.querySelector(`[data-unit-id="${unitId}"][data-player="${playerId}"]`);
    if (attackerElement) {
      attackerElement.classList.add('selected-attacker');
    }
  }
  
  // 选择目标
  async selectTarget(targetPlayerId, targetId) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:287',message:'selectTarget entry',data:{targetPlayerId,targetId,hasSelectedUnit:!!this.selectedUnit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.log('🎯 === selectTarget 被调用 ===');
    console.log('📋 参数:', { targetPlayerId, targetId, targetIdType: typeof targetId });
    console.log('👤 selectedUnit:', this.selectedUnit ? {
      playerId: this.selectedUnit.playerId,
      unitIndex: this.selectedUnit.unitIndex,
      unitName: this.selectedUnit.unit.card.name
    } : 'null');
    
    if (!this.selectedUnit) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:296',message:'selectTarget no selectedUnit',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const message = '请先选择攻击单位';
      this.gameState.log(message);
      this.showMessage(message, 'warning');
      console.error('没有选中的单位');
      return;
    }
    
    const { playerId, unitIndex, unit: attacker } = this.selectedUnit;
    const targetPlayer = this.gameState.players[targetPlayerId];
    
    if (!targetPlayer) {
      console.error('目标玩家不存在:', targetPlayerId);
      this.gameState.log('目标玩家不存在');
      return;
    }
    
    console.log('目标玩家单位:', targetPlayer.battlefield.map(u => ({ id: u.id, name: u.card.name })));
    
    let target;
    let targetName;
    let isHeroTarget = false;
    let targetIndex;
    
    // 检查是否是英雄目标（targetId可能是'hero'字符串，或者找不到单位）
    if (targetId === 'hero' || targetPlayer.battlefield.length === 0) {
      // 攻击英雄
      target = targetPlayer.hero;
      targetName = target.name;
      isHeroTarget = true;
      targetIndex = 'hero';
      console.log('攻击英雄');
    } else {
      // 攻击单位
      console.log('查找目标单位，targetId:', targetId);
      targetIndex = targetPlayer.battlefield.findIndex(u => u.id === targetId);
      console.log('目标单位索引:', targetIndex);
      
      if (targetIndex === -1) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:334',message:'target unit not found',data:{targetId,availableUnits:targetPlayer.battlefield.map(u=>u.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const message = `目标单位不存在 (ID: ${targetId})`;
        this.gameState.log(message);
        console.error('找不到目标单位:', targetId);
        console.error('可用单位:', targetPlayer.battlefield.map(u => ({ id: u.id, name: u.card.name })));
        this.showMessage(message, 'error');
        return;
      }
      
      target = targetPlayer.battlefield[targetIndex];
      targetName = target.card.name;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:342',message:'target unit found',data:{targetName,targetIndex,beforeHealth:target.currentHealth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.log('找到目标单位:', { name: targetName, health: target.currentHealth, index: targetIndex });
    }
    
    // 显示攻击动画
    await this.playAttackAnimation(attacker, target, isHeroTarget);
    
    // 执行攻击
    console.log('⚔️ === 准备执行攻击 ===');
    const beforeHealth = isHeroTarget ? target.health : target.currentHealth;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:355',message:'before unitAttack call',data:{playerId,unitIndex,targetPlayerId,targetIndex:isHeroTarget?'hero':targetIndex,isHeroTarget,beforeHealth,attackerAttack:attacker.attack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.log('📋 攻击参数:', { 
      playerId, 
      unitIndex, 
      targetPlayerId, 
      targetIndex, 
      isHeroTarget,
      attackerName: attacker.card.name,
      targetName: targetName
    });
    
    console.log('📊 攻击前血量:', beforeHealth);
    console.log('💢 攻击力:', attacker.attack);
    
    // 修复4: 确保 targetIndex 类型正确
    const finalTargetIndex = isHeroTarget ? 'hero' : targetIndex;
    console.log('🎯 最终目标索引:', finalTargetIndex, '类型:', typeof finalTargetIndex);
    
    console.log('🚀 调用 unitAttack...');
    const success = this.battleSystem.unitAttack(playerId, unitIndex, targetPlayerId, finalTargetIndex);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:368',message:'unitAttack result',data:{success,afterHealth:isHeroTarget?target.health:target.currentHealth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.log('✅ unitAttack 返回结果:', success);
    
    if (!success) {
      console.error('❌ 攻击失败！unitAttack 返回了 false');
      this.showMessage('攻击失败，请查看控制台了解详情', 'error');
      return;
    }
    
    // 攻击成功后，立即重新渲染
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:400',message:'rendering after attack',data:{isHeroTarget},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.log('🔄 立即重新渲染UI...');
    this.renderer.render();
    
    // 重新获取目标（因为可能已经被修改或移除）
    let currentTarget;
    let targetStillExists = false;
    
    if (isHeroTarget) {
      currentTarget = this.gameState.players[targetPlayerId].hero;
      targetStillExists = true;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:409',message:'target is hero',data:{heroHealth:currentTarget.health},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.log('🎯 目标：英雄', { name: currentTarget.name, health: currentTarget.health });
    } else {
      // 检查目标是否还在战场上
      if (targetIndex >= 0 && targetIndex < this.gameState.players[targetPlayerId].battlefield.length) {
        currentTarget = this.gameState.players[targetPlayerId].battlefield[targetIndex];
        targetStillExists = !!currentTarget;
        if (currentTarget) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:418',message:'target is unit',data:{unitName:currentTarget.card.name,unitHealth:currentTarget.currentHealth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          console.log('🎯 目标：单位', { 
            name: currentTarget.card.name, 
            health: currentTarget.currentHealth,
            index: targetIndex
          });
        }
      } else {
        // 单位可能已被击杀
        console.log('💀 目标单位已被移除（可能被击杀）');
        targetStillExists = false;
      }
    }
    
    if (targetStillExists && currentTarget) {
      // 获取攻击后的血量
      const afterHealth = isHeroTarget ? currentTarget.health : (currentTarget.currentHealth || 0);
      const damage = Math.max(0, beforeHealth - afterHealth);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:433',message:'damage calculation',data:{beforeHealth,afterHealth,damage,isHeroTarget},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('📊 伤害计算:', { 
        beforeHealth, 
        afterHealth, 
        damage, 
        isHeroTarget,
        targetName: isHeroTarget ? currentTarget.name : currentTarget.card.name
      });
      
      // 再次强制更新UI（确保更新）
      setTimeout(() => {
        this.renderer.render();
        console.log('🔄 第二次渲染完成');
        
        // 验证UI更新
        if (isHeroTarget) {
          const lifeEl = document.getElementById('opponent-life');
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:451',message:'UI verification hero',data:{uiHealth:lifeEl?lifeEl.textContent:'null',dataHealth:currentTarget.health},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          console.log('✅ UI验证 - 英雄血量元素:', lifeEl ? lifeEl.textContent : 'null');
          console.log('✅ 数据验证 - 实际血量:', currentTarget.health);
          if (lifeEl && lifeEl.textContent != currentTarget.health) {
            console.error('❌ UI和数据不一致！UI:', lifeEl.textContent, '数据:', currentTarget.health);
            lifeEl.textContent = currentTarget.health; // 强制更新
          }
        } else {
          const unitEl = document.querySelector(`[data-unit-id="${currentTarget.id}"]`);
          if (unitEl) {
            const statsEl = unitEl.querySelector('.unit-stats');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputHandler.js:460',message:'UI verification unit',data:{uiStats:statsEl?statsEl.textContent:'null',dataHealth:currentTarget.currentHealth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            console.log('✅ UI验证 - 单位血量显示:', statsEl ? statsEl.textContent : 'null');
            console.log('✅ 数据验证 - 实际血量:', currentTarget.currentHealth);
          } else {
            console.warn('⚠️ 找不到单位元素，可能已被移除');
          }
        }
      }, 50);
      
      if (damage > 0) {
        // 显示伤害数字
        this.showDamageNumber(currentTarget, damage, isHeroTarget);
        
        // 屏幕抖动
        this.shakeScreen();
        
        // 显示攻击结果消息
        this.showMessage(`${attacker.card.name} 攻击了 ${targetName}，造成 ${damage} 点伤害！`, 'success');
        this.gameState.log(`${attacker.card.name} 攻击了 ${targetName}，造成 ${damage} 点伤害！`);
      } else {
        console.warn('⚠️ 伤害为0，可能有问题');
        this.showMessage('攻击完成', 'info');
      }
    } else {
      // 单位被击杀
      console.log('💀 目标已被击杀');
      this.showMessage(`${attacker.card.name} 击杀了 ${targetName}！`, 'success');
      this.shakeScreen();
    }
    
    // 延迟后清除选择并重新渲染
    setTimeout(() => {
      this.selectedUnit = null;
      this.clearHighlights();
      this.renderer.render();
      console.log('🧹 清除选择状态，最终渲染完成');
    }, 500);
  }
  
  // 显示消息提示
  showMessage(message, type = 'info') {
    // 移除旧的消息
    const oldMessage = document.getElementById('game-message');
    if (oldMessage) {
      oldMessage.remove();
    }
    
    // 创建新消息
    const messageEl = document.createElement('div');
    messageEl.id = 'game-message';
    messageEl.className = `game-message game-message-${type}`;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 3000);
  }
  
  // 播放攻击动画（支持双方玩家）
  async playAttackAnimation(attacker, target, isHeroTarget, attackerPlayerId = 'PLAYER1', targetPlayerId = 'PLAYER2') {
    const attackerElement = document.querySelector(`[data-unit-id="${attacker.id}"][data-player="${attackerPlayerId}"]`);
    const targetElement = isHeroTarget ? 
      document.getElementById(targetPlayerId === 'PLAYER1' ? 'player-area' : 'opponent-area') :
      document.querySelector(`[data-unit-id="${target.id}"][data-player="${targetPlayerId}"]`);
    
    if (attackerElement) {
      attackerElement.classList.add('attacking');
    }
    
    if (targetElement) {
      targetElement.classList.add('being-attacked');
    }
    
    // 等待动画完成
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (attackerElement) {
      attackerElement.classList.remove('attacking');
    }
    
    if (targetElement) {
      targetElement.classList.remove('being-attacked');
    }
  }
  
  // 显示伤害数字（支持双方玩家）
  showDamageNumber(target, damage, isHeroTarget, targetPlayerId = 'PLAYER2') {
    const targetElement = isHeroTarget ? 
      document.getElementById(targetPlayerId === 'PLAYER1' ? 'player-area' : 'opponent-area') :
      document.querySelector(`[data-unit-id="${target.id}"][data-player="${targetPlayerId}"]`);
    
    if (!targetElement) return;
    
    const damageEl = document.createElement('div');
    damageEl.className = 'damage-number';
    damageEl.textContent = `-${damage}`;
    
    // 定位到目标元素
    const rect = targetElement.getBoundingClientRect();
    damageEl.style.left = `${rect.left + rect.width / 2}px`;
    damageEl.style.top = `${rect.top + rect.height / 2}px`;
    
    document.body.appendChild(damageEl);
    
    // 动画
    requestAnimationFrame(() => {
      damageEl.style.transform = 'translateY(-50px) scale(1.5)';
      damageEl.style.opacity = '0';
    });
    
    // 移除元素
    setTimeout(() => {
      if (damageEl.parentNode) {
        damageEl.remove();
      }
    }, 1000);
  }
  
  // 屏幕抖动
  shakeScreen() {
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    container.classList.add('shake');
    setTimeout(() => {
      container.classList.remove('shake');
    }, 500);
  }
  
  // 高亮可放置位置
  highlightEmptyPositions() {
    const player = this.gameState.players['PLAYER1'];
    const positions = [0, 1, 2, 3, 4, 5]; // 扩展到6个位置
    const occupied = player.battlefield.map(u => u.position);
    
    positions.forEach(position => {
      if (!occupied.includes(position)) {
        const element = document.querySelector(`[data-position="${position}"][data-player="PLAYER1"]`);
        if (element) {
          element.classList.add('highlight');
        }
      }
    });
  }
  
  // 高亮可攻击目标
  highlightValidTargets() {
    // 如果选择了法术卡牌，高亮所有可攻击目标（包括双方英雄）
    if (this.selectedCard && this.selectedCard.card.type === 'spell') {
      const card = this.selectedCard.card;
      const spellType = card.spellEffect?.type;
      const isBuffSpell = spellType && (spellType.startsWith('BUFF_') || spellType === 'ADD_SHIELD' || spellType === 'ADD_DIVINE_SHIELD');
      
      // 如果是增益法术，高亮友方目标；如果是直伤法术，高亮敌方目标；其他高亮双方
      if (isBuffSpell) {
        // 增益法术：高亮友方单位和英雄
        const player = this.gameState.players['PLAYER1'];
        
        // 高亮友方英雄
        const playerHeroElement = document.getElementById('player-area');
        if (playerHeroElement) {
          playerHeroElement.classList.add('highlight');
          playerHeroElement.style.cursor = 'pointer';
        }
        
        // 高亮所有友方单位
        player.battlefield.forEach((unit) => {
          const unitElement = document.querySelector(`[data-unit-id="${unit.id}"][data-player="PLAYER1"]`);
          if (unitElement) {
            unitElement.classList.add('highlight');
          }
        });
      } else {
        // 直伤法术：高亮敌方单位和双方英雄（不能对己方单位使用）
        const isDirectDamageSpell = spellType && (
          spellType === 'DAMAGE_WITH_FREEZE' ||
          spellType === 'DAMAGE_WITH_THUNDER' ||
          spellType === 'DAMAGE_WITH_FIRE' ||
          spellType === 'DAMAGE_WITH_POISON'
        );
        
        const opponentId = 'PLAYER2';
        const opponent = this.gameState.players[opponentId];
        const player = this.gameState.players['PLAYER1'];
        
        // 高亮敌方英雄
        const opponentHeroElement = document.getElementById('opponent-area');
        if (opponentHeroElement) {
          opponentHeroElement.classList.add('highlight');
          opponentHeroElement.style.cursor = 'pointer';
        }
        
        // 高亮己方英雄（直伤法术可以攻击双方英雄）
        const playerHeroElement = document.getElementById('player-area');
        if (playerHeroElement) {
          playerHeroElement.classList.add('highlight');
          playerHeroElement.style.cursor = 'pointer';
        }
        
        // 高亮所有敌方单位
        opponent.battlefield.forEach((unit) => {
          const unitElement = document.querySelector(`[data-unit-id="${unit.id}"]`);
          if (unitElement) {
            unitElement.classList.add('highlight');
          }
        });
        
        // 直伤法术不能对己方单位使用，所以不高亮己方单位
        // 其他类型法术（如果有）可以高亮己方单位
        if (!isDirectDamageSpell) {
          player.battlefield.forEach((unit) => {
            const unitElement = document.querySelector(`[data-unit-id="${unit.id}"][data-player="PLAYER1"]`);
            if (unitElement) {
              unitElement.classList.add('highlight');
            }
          });
        }
      }
      return;
    }
    
    // 如果选择了单位，高亮可攻击目标
    if (this.selectedUnit) {
      const attacker = this.selectedUnit.unit;
      const opponentId = 'PLAYER2';
      const opponent = this.gameState.players[opponentId];
      
      // 如果没有单位，可以攻击英雄
      const canAttackHero = opponent.battlefield.length === 0;
      
      // 高亮英雄区域
      const heroElement = document.getElementById('opponent-area');
      if (heroElement && canAttackHero) {
        heroElement.classList.add('highlight');
        heroElement.style.cursor = 'pointer';
      }
      
      // 高亮可攻击的单位
      if (opponent.battlefield.length > 0) {
        opponent.battlefield.forEach((unit) => {
          const unitElement = document.querySelector(`[data-unit-id="${unit.id}"]`);
          if (unitElement) {
            unitElement.classList.add('highlight');
          }
        });
      }
    }
  }
  
  // 清除高亮
  clearHighlights() {
    document.querySelectorAll('.highlight').forEach(el => {
      el.classList.remove('highlight');
      el.style.cursor = '';
    });
    document.querySelectorAll('.selected-attacker').forEach(el => {
      el.classList.remove('selected-attacker');
    });
  }
  
  // 清除选择状态
  clearSelection() {
    this.clearHighlights();
  }
  
  // 英雄技能点击
  onHeroSkillClick() {
    if (this.gameState.currentPlayer !== 'PLAYER1' || this.gameState.phase === 'ENDED') {
      return;
    }
    
    const player = this.gameState.players['PLAYER1'];
    const skill = player.hero.skill;
    
    // 检查是否是被动技能（不能主动使用）- 直接返回，不显示任何消息
    if (skill.type === 'PASSIVE') {
      return;
    }
    
    // 检查法力
    if (player.mana.current < skill.cost) {
      this.showMessage(`法力不足，需要 ${skill.cost} 点法力`, 'warning');
      return;
    }
    
    // 检查是否已使用
    if (skill.usedThisTurn) {
      this.showMessage('本回合已使用过英雄技能', 'warning');
      return;
    }
    
    // 检查是否是实体分身技能（觉醒后的技能）
    if (player.hero.awakened && skill.effect && skill.effect.type === 'SUMMON_CLONES') {
      // 消耗法力
      player.mana.current -= skill.cost;
      skill.usedThisTurn = true;
      
      // 使用实体分身技能
      const success = this.battleSystem.useCloneSkill('PLAYER1');
      if (success) {
        this.showMessage(`${player.hero.name} 召唤了实体分身！`, 'success');
      } else {
        this.showMessage('战场已满，无法召唤分身', 'warning');
        // 返还法力
        player.mana.current += skill.cost;
        skill.usedThisTurn = false;
      }
      
      // 重新渲染
      this.renderer.render();
      return;
    }
    
    // 默认技能：增加英雄自身2点护甲值（只增加护甲，不增加生命值）
    player.mana.current -= skill.cost;
    skill.usedThisTurn = true;
    
    player.hero.maxHealth += 2;
    // 不增加当前生命值，护甲和生命值独立计算
    this.showMessage(`${player.hero.name} 获得了2点护甲`, 'success');
    this.gameState.log(`${player.hero.name} 使用技能：获得2点护甲`);
    
    // 显示治疗特效
    this.showHeroHealEffect(player, 2);
    
    // 重新渲染
    this.renderer.render();
  }
}
