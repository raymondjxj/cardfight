// src/ui/Renderer.js
export class Renderer {
  constructor(gameState) {
    this.gameState = gameState;
    this.gameOverShown = false;
    this.elements = {
      opponentLife: document.getElementById('opponent-life'),
      opponentMana: document.getElementById('opponent-mana'),
      opponentBoard: document.getElementById('opponent-board'),
      playerLife: document.getElementById('player-life'),
      playerMana: document.getElementById('player-mana'),
      playerBoard: document.getElementById('player-board'),
      playerHand: document.getElementById('player-hand'),
      battleLog: document.getElementById('battle-log'),
      endTurnBtn: document.getElementById('end-turn'),
      gameState: document.getElementById('game-state'),
      turnCounter: document.getElementById('turn-counter'),
      playerAvatar: document.getElementById('player-avatar'),
      opponentAvatar: document.getElementById('opponent-avatar'),
      playerHeroName: document.getElementById('player-hero-name'),
      opponentHeroName: document.getElementById('opponent-hero-name'),
      playerAttack: document.getElementById('player-attack'),
      opponentAttack: document.getElementById('opponent-attack'),
      playerAttackValue: document.getElementById('player-attack-value'),
      opponentAttackValue: document.getElementById('opponent-attack-value'),
      heroSkillBtn: document.getElementById('hero-skill'),
      opponentHeroSkillBtn: document.getElementById('opponent-hero-skill'),
      playerWeaponContent: document.getElementById('player-weapon-content'),
      opponentWeaponContent: document.getElementById('opponent-weapon-content')
    };
    
    // 检查所有必要的元素是否存在
    console.log('🔍 检查UI元素:');
    for (const [key, element] of Object.entries(this.elements)) {
      if (element) {
        console.log(`   ✅ ${key}: 找到`);
      } else {
        console.error(`   ❌ ${key}: 未找到！`);
      }
    }
    
    // 初始化tooltip
    this.tooltip = null;
    this.createTooltip();
  }
  
  // 渲染整个游戏
  render() {
    this.renderPlayer('PLAYER1');
    this.renderPlayer('PLAYER2');
    this.renderLog();
    this.updateUIState();
  }
  
  // 渲染玩家状态
  renderPlayer(playerId) {
    const player = this.gameState.players[playerId];
    const isCurrent = playerId === this.gameState.currentPlayer;
    
    if (playerId === 'PLAYER1') {
      this.elements.playerLife.textContent = player.hero.health;
      this.elements.playerMana.textContent = `${player.mana.current}/${player.mana.total}`;
      if (this.elements.playerHeroName) {
        this.elements.playerHeroName.textContent = player.hero.name;
      }
      // 显示英雄攻击力（如果有武器）
      if (player.hero.weapon && player.hero.attack > 0) {
        if (this.elements.playerAttack) {
          this.elements.playerAttack.style.display = 'block';
          if (this.elements.playerAttackValue) {
            this.elements.playerAttackValue.textContent = player.hero.attack;
          }
        }
      } else {
        if (this.elements.playerAttack) {
          this.elements.playerAttack.style.display = 'none';
        }
      }
      // 渲染武器
      this.renderWeapon(playerId, player);
      // 更新英雄头像和护盾显示
      this.updateHeroAvatar(playerId);
      this.updateHeroShields(playerId);
      this.renderBattlefield(playerId, this.elements.playerBoard, isCurrent);
      this.renderHand(player);
    } else {
      // 确保对手血量正确显示
      const heroHealth = player.hero.health;
      this.elements.opponentLife.textContent = heroHealth;
      if (this.elements.opponentHeroName) {
        this.elements.opponentHeroName.textContent = player.hero.name;
      }
      // 显示英雄攻击力（如果有武器）
      if (player.hero.weapon && player.hero.attack > 0) {
        if (this.elements.opponentAttack) {
          this.elements.opponentAttack.style.display = 'block';
          if (this.elements.opponentAttackValue) {
            this.elements.opponentAttackValue.textContent = player.hero.attack;
          }
        }
      } else {
        if (this.elements.opponentAttack) {
          this.elements.opponentAttack.style.display = 'none';
        }
      }
      console.log('🎨 渲染对手血量:', heroHealth);
      this.elements.opponentMana.textContent = `${player.mana.current}/${player.mana.total}`;
      // 渲染武器
      this.renderWeapon(playerId, player);
      // 更新英雄头像和护盾显示
      this.updateHeroAvatar(playerId);
      this.updateHeroShields(playerId);
      this.renderBattlefield(playerId, this.elements.opponentBoard, false);
    }
  }
  
  // 渲染武器
  renderWeapon(playerId, player) {
    const weaponContent = playerId === 'PLAYER1' ? 
      this.elements.playerWeaponContent : 
      this.elements.opponentWeaponContent;
    
    if (!weaponContent) return;
    
    if (player.hero.weapon) {
      const weapon = player.hero.weapon;
      const durability = player.hero.weaponDurability || weapon.durability || 0;
      const effectIcon = weapon.weaponEffect ? 
        (weapon.weaponEffect.type === 'FREEZE' ? '❄️' :
         weapon.weaponEffect.type === 'FIRE' ? '🔥' :
         weapon.weaponEffect.type === 'THUNDER' ? '⚡' :
         weapon.weaponEffect.type === 'POISON' ? '☠️' : '') : '';
      
      weaponContent.innerHTML = `
        <div class="weapon-card">
          <div class="weapon-name">${effectIcon}${weapon.name}</div>
          <div class="weapon-stats">${weapon.attack || 0}/${durability}</div>
        </div>
      `;
    } else {
      weaponContent.innerHTML = '<div class="weapon-empty">空</div>';
    }
  }
  
  // 渲染战场
  renderBattlefield(playerId, container, isCurrentPlayer) {
    const player = this.gameState.players[playerId];
    container.innerHTML = '';
    
    // 创建6个位置
    for (let i = 0; i < 6; i++) {
      const position = document.createElement('div');
      position.className = 'battlefield-position';
      position.dataset.position = i;
      position.dataset.player = playerId;
      
      const unit = player.battlefield.find(u => u.position === i);
      if (unit) {
        const unitElement = this.createUnitElement(unit, playerId, isCurrentPlayer);
        position.appendChild(unitElement);
      } else {
        // 空位置
        const emptySlot = document.createElement('div');
        emptySlot.className = 'empty-slot';
        emptySlot.textContent = '空';
        position.appendChild(emptySlot);
      }
      
      container.appendChild(position);
    }
  }
  
  // 创建单位元素
  createUnitElement(unit, playerId, isCurrentPlayer) {
    const element = document.createElement('div');
    element.className = 'unit';
    element.dataset.unitId = unit.id;
    element.dataset.player = playerId;
    element.style.position = 'relative'; // 为护盾显示定位
    
    // 确保整个单位区域都可以点击
    element.style.pointerEvents = 'auto';
    element.style.cursor = 'pointer';
    
    // 关键词样式
    if (unit.keywords.some(kw => kw.includes('TAUNT'))) {
      element.classList.add('taunt');
    }
    if (unit.exhausted) {
      element.classList.add('exhausted');
    }
    
    // 检查是否可以攻击
    const hasCharge = unit.keywords.some(kw => kw.includes('CHARGE'));
    const canAttack = !unit.exhausted && (hasCharge || unit.onBoardTurns > 0);
    
    if (canAttack && isCurrentPlayer && playerId === 'PLAYER1') {
      element.classList.add('can-attack');
      element.title = '点击此单位进行攻击';
    } else if (!canAttack && isCurrentPlayer && playerId === 'PLAYER1') {
      if (unit.onBoardTurns === 0 && !hasCharge) {
        element.title = '此单位需要等待一回合才能攻击（除非有冲锋）';
      } else if (unit.exhausted) {
        element.title = '此单位已疲惫，本回合无法攻击';
      }
    }
    
    // 如果是敌方单位且已选择攻击者，添加可攻击提示
    if (playerId === 'PLAYER2' && isCurrentPlayer) {
      element.title = '点击此单位作为攻击目标';
      element.style.cursor = 'pointer';
    }
    
    // 计算实际攻击力（包括buff和光环）
    const actualAttack = unit.attack + (unit.auraAttackBonus || 0);
    const actualHealth = Math.max(0, unit.currentHealth || 0);
    
    // 确保血量显示正确（只在调试时输出）
    if (window.DEBUG_RENDER) {
      console.log('🎨 渲染单位:', {
        name: unit.card.name,
        currentHealth: unit.currentHealth,
        actualHealth,
        playerId
      });
    }
    
    // 攻击状态提示
    let attackStatus = '';
    if (canAttack && isCurrentPlayer && playerId === 'PLAYER1') {
      attackStatus = '<div class="attack-ready">⚔️ 可攻击</div>';
    } else if (!unit.exhausted && unit.onBoardTurns === 0 && !hasCharge && isCurrentPlayer && playerId === 'PLAYER1') {
      attackStatus = '<div class="attack-wait">⏳ 等待中</div>';
    }
    
    // 显示护盾信息
    let shieldInfo = '';
    if (unit.shield > 0) {
      shieldInfo += `<div class="unit-shield" style="pointer-events: none;">🛡️${unit.shield}</div>`;
    }
    if (unit.spellShield > 0) {
      shieldInfo += `<div class="unit-spell-shield" style="pointer-events: none;">✨${unit.spellShield}</div>`;
    }
    
    // 单位信息 - 确保所有子元素不阻止点击事件
    element.innerHTML = `
      <div class="unit-name" style="pointer-events: none;">${unit.card.name}</div>
      <div class="unit-stats" style="pointer-events: none;">${actualAttack}/${Math.max(0, actualHealth)}</div>
      ${shieldInfo}
      <div class="unit-keywords" style="pointer-events: none;">${this.formatKeywords(unit.keywords)}</div>
      ${attackStatus}
    `;
    
    return element;
  }
  
  // 格式化关键词显示
  formatKeywords(keywords) {
    const symbols = {
      'TAUNT': '🛡️',
      'TEMP_TAUNT': '🛡️',
      'CHARGE': '⚡',
      'TEMP_CHARGE': '⚡',
      'LIFESTEAL': '🩸',
      'RANGED': '🏹',
      'PIERCE_1': '↯1',
      'PIERCE_2': '↯2',
      'PIERCE_3': '↯3',
      'TEMP_PIERCE_1': '↯1',
      'TEMP_PIERCE_2': '↯2',
      'TEMP_PIERCE_3': '↯3',
      'DIVINE_SHIELD': '✨',
      'SHIELD': '🛡️',
      'SPELL_SHIELD': '🔮'
    };
    
    return keywords
      .filter(kw => !kw.startsWith('TEMP_') || kw === 'TEMP_TAUNT' || kw === 'TEMP_CHARGE')
      .map(kw => {
        const baseKw = kw.replace('TEMP_', '');
        return symbols[baseKw] || baseKw;
      })
      .join(' ');
  }
  
  // 渲染手牌
  renderHand(player) {
    const container = this.elements.playerHand;
    container.innerHTML = '';
    
    player.hand.forEach((card, index) => {
      const cardElement = this.createCardElement(card, index);
      container.appendChild(cardElement);
    });
  }
  
  // 创建卡牌元素
  createCardElement(card, index) {
    const element = document.createElement('div');
    element.className = 'card';
    element.dataset.cardIndex = index;
    
    const player = this.gameState.players[this.gameState.currentPlayer];
    const canPlay = this.gameState.currentPlayer === 'PLAYER1' && 
                    card.cost <= player.mana.current;
    if (!canPlay) {
      element.classList.add('unplayable');
    }
    
    // 获取卡牌图标
    const cardIcon = this.getCardIcon(card);
    const rarityClass = this.getRarityClass(card.rarity);
    
    let content = '';
    if (card.type === 'unit') {
      content = `
        <div class="card-header ${rarityClass}">
          <div class="card-icon">${cardIcon}</div>
          <div class="card-cost">${card.cost}</div>
        </div>
        <div class="card-body">
          <div class="card-name">${card.name}</div>
          <div class="card-stats">⚔️${card.attack} ❤️${card.health}</div>
          <div class="card-keywords">${this.formatKeywords(card.keywords || [])}</div>
          <div class="card-description">${card.description}</div>
        </div>
      `;
    } else if (card.type === 'weapon') {
      const effectIcon = card.weaponEffect ? 
        (card.weaponEffect.type === 'FREEZE' ? '❄️' :
         card.weaponEffect.type === 'FIRE' ? '🔥' :
         card.weaponEffect.type === 'THUNDER' ? '⚡' :
         card.weaponEffect.type === 'POISON' ? '☠️' : '') : '';
      content = `
        <div class="card-header ${rarityClass}">
          <div class="card-icon">${cardIcon}</div>
          <div class="card-cost">${card.cost}</div>
        </div>
        <div class="card-body">
          <div class="card-name">${effectIcon}${card.name}</div>
          <div class="card-stats">⚔️${card.attack} 🛡️${card.durability}</div>
          <div class="card-description">${card.description}</div>
        </div>
      `;
    } else {
      content = `
        <div class="card-header ${rarityClass}">
          <div class="card-icon">${cardIcon}</div>
          <div class="card-cost">${card.cost}</div>
        </div>
        <div class="card-body">
          <div class="card-name">${card.name}</div>
          <div class="card-type">✨ 法术</div>
          <div class="card-description">${card.description}</div>
        </div>
      `;
    }
    
    element.innerHTML = content;
    return element;
  }
  
  // 获取卡牌图标
  getCardIcon(card) {
    // 根据卡牌名称和类型返回匹配的图标
    const iconMap = {
      // 单位卡
      '新兵': '⚔️',
      '民兵队长': '🛡️',
      '长枪兵': '🔱',
      '战地医师': '💊',
      '老兵': '⚔️',
      '协同阵线': '👥',
      '破城锤': '🔨',
      '龙骧将军': '🐉',
      '无畏先锋': '⚡',
      // 法术卡
      '箭雨如潮': '🏹',
      '烈焰风暴': '🔥',
      '圣光祝福': '✨',
      '力量强化': '💪',
      '生命强化': '❤️',
      '全面强化': '🌟',
      '英雄护甲': '🛡️',
      '寒冰箭': '❄️',
      '闪电箭': '⚡',
      '火球术': '🔥',
      '剧毒箭': '☠️',
      '寒冰风暴': '❄️',
      '雷暴': '⚡',
      // 武器卡
      '铁剑': '🗡️',
      '精钢战刃': '⚔️',
      '寒冰之刃': '❄️',
      '烈焰之刃': '🔥',
      '龙鳞重剑': '⚡',
      '剧毒匕首': '☠️'
    };
    
    return iconMap[card.name] || (card.type === 'unit' ? '⚔️' : card.type === 'weapon' ? '🗡️' : '✨');
  }
  
  // 获取稀有度样式类
  getRarityClass(rarity) {
    const rarityMap = {
      'C': 'rarity-common',
      'R': 'rarity-rare',
      'E': 'rarity-epic',
      'L': 'rarity-legendary'
    };
    return rarityMap[rarity] || 'rarity-common';
  }
  
  // 渲染日志
  renderLog() {
    const container = this.elements.battleLog;
    const logs = this.gameState.logs.slice(-10); // 只显示最后10条
    container.innerHTML = `<div>游戏日志:</div>` + 
      logs.map(log => `<div>${log}</div>`).join('');
    container.scrollTop = container.scrollHeight;
  }
  
  // 更新UI状态
  updateUIState() {
    const isPlayerTurn = this.gameState.currentPlayer === 'PLAYER1';
    this.elements.endTurnBtn.disabled = !isPlayerTurn || this.gameState.phase === 'ENDED';
    
    // 更新游戏状态显示
    if (this.gameState.winner) {
      this.elements.gameState.textContent = `游戏结束！${this.gameState.winner} 获胜！`;
      // 显示游戏结束特效（只显示一次）
      if (!this.gameOverShown) {
        this.gameOverShown = true;
        setTimeout(() => {
          this.showGameOverEffect(this.gameState.winner);
        }, 500);
      }
    } else {
      this.elements.gameState.textContent = 
        isPlayerTurn ? 
        `你的回合 (回合 ${this.gameState.turn})` : 
        `对手的回合 (回合 ${this.gameState.turn})`;
    }
    
      this.elements.turnCounter.textContent = `回合: ${this.gameState.turn}`;
    
    // 更新玩家英雄技能按钮
    if (this.elements.heroSkillBtn) {
      const player = this.gameState.players['PLAYER1'];
      const skill = player.hero.skill;
      
      this.elements.heroSkillBtn.textContent = `🛡️ (${skill.cost}费)`;
      this.elements.heroSkillBtn.title = skill.description || `消耗${skill.cost}点法力，增加英雄自身2点护甲值`;
      this.elements.heroSkillBtn.disabled = 
        this.gameState.currentPlayer !== 'PLAYER1' || 
        this.gameState.phase === 'ENDED' ||
        player.mana.current < skill.cost ||
        skill.usedThisTurn;
      
      // 添加视觉反馈状态类（和对手按钮保持一致）
      if (skill.usedThisTurn) {
        this.elements.heroSkillBtn.classList.add('skill-used');
      } else {
        this.elements.heroSkillBtn.classList.remove('skill-used');
      }
      if (player.mana.current < skill.cost) {
        this.elements.heroSkillBtn.classList.add('skill-insufficient-mana');
      } else {
        this.elements.heroSkillBtn.classList.remove('skill-insufficient-mana');
      }
    }
    
    // 更新对手英雄技能按钮（显示但不可点击，状态和玩家保持一致）
    if (this.elements.opponentHeroSkillBtn) {
      const opponent = this.gameState.players['PLAYER2'];
      const skill = opponent.hero.skill;
      
      this.elements.opponentHeroSkillBtn.textContent = `🛡️ (${skill.cost}费)`;
      this.elements.opponentHeroSkillBtn.title = `对手的技能：${skill.description || `消耗${skill.cost}点法力，增加英雄自身2点护甲值`}`;
      // 显示技能使用状态（和玩家按钮保持一致的设计）
      this.elements.opponentHeroSkillBtn.disabled = true; // 对手技能不可点击
      // 如果技能已使用，添加视觉反馈（和玩家按钮一致）
      if (skill.usedThisTurn) {
        this.elements.opponentHeroSkillBtn.classList.add('skill-used');
      } else {
        this.elements.opponentHeroSkillBtn.classList.remove('skill-used');
      }
      // 如果法力不足，添加视觉反馈（和玩家按钮一致）
      if (opponent.mana.current < skill.cost) {
        this.elements.opponentHeroSkillBtn.classList.add('skill-insufficient-mana');
      } else {
        this.elements.opponentHeroSkillBtn.classList.remove('skill-insufficient-mana');
      }
    }
    
    // 更新英雄头像（显示骑士形象）
    this.updateHeroAvatar('PLAYER1');
    this.updateHeroAvatar('PLAYER2');
    
    // 更新英雄护甲和护盾显示
    this.updateHeroShields('PLAYER1');
    this.updateHeroShields('PLAYER2');
  }
  
  // 更新英雄头像
  updateHeroAvatar(playerId) {
    const player = this.gameState.players[playerId];
    const avatarElement = playerId === 'PLAYER1' ? 
      this.elements.playerAvatar : 
      this.elements.opponentAvatar;
    
    if (!avatarElement) return;
    
    // 从localStorage读取自定义头像，如果没有则使用默认
    const storageKey = `hero_avatar_${playerId}`;
    const customAvatar = localStorage.getItem(storageKey);
    
    if (customAvatar) {
      avatarElement.textContent = customAvatar;
    } else {
      avatarElement.textContent = '⚔️';
    }
    
    avatarElement.title = player.hero.name;
    
    // 移除点击事件，头像不再可点击（设置功能移到设置菜单）
    avatarElement.style.cursor = 'default';
    avatarElement.onclick = null;
  }
  
  // 显示头像自定义器（从设置菜单调用）
  showAvatarCustomizer(playerId) {
    const player = this.gameState.players[playerId];
    const currentAvatar = localStorage.getItem(`hero_avatar_${playerId}`) || '⚔️';
    
    const input = prompt(
      `自定义 ${player.hero.name} 的头像\n\n请输入一个emoji或字符（例如：⚔️ 🛡️ 👑 🗡️ ⚡）\n当前头像：${currentAvatar}`,
      currentAvatar
    );
    
    if (input !== null && input.trim() !== '') {
      const newAvatar = input.trim();
      localStorage.setItem(`hero_avatar_${playerId}`, newAvatar);
      this.updateHeroAvatar(playerId);
      this.gameState.log(`${player.hero.name} 的头像已更新为：${newAvatar}`);
    }
  }
  
  // 显示武器特效
  showWeaponEffect(effectType, target, targetPlayer, isHeroTarget) {
    const targetElement = isHeroTarget ? 
      (targetPlayer.id === 'PLAYER1' ? document.getElementById('player-area') : document.getElementById('opponent-area')) :
      document.querySelector(`[data-unit-id="${target.id}"][data-player="${targetPlayer.id}"]`);
    
    if (!targetElement) return;
    
    const effectContainer = document.createElement('div');
    effectContainer.className = `weapon-effect weapon-effect-${effectType.toLowerCase()}`;
    
    switch (effectType) {
      case 'FREEZE':
        effectContainer.innerHTML = '<div class="effect-particles freeze-particles">❄️❄️❄️</div>';
        break;
      case 'FIRE':
        effectContainer.innerHTML = '<div class="effect-particles fire-particles">🔥🔥🔥</div>';
        break;
      case 'THUNDER':
        effectContainer.innerHTML = '<div class="effect-particles thunder-particles">⚡⚡⚡</div>';
        break;
      case 'POISON':
        effectContainer.innerHTML = '<div class="effect-particles poison-particles">☠️☠️☠️</div>';
        break;
    }
    
    targetElement.appendChild(effectContainer);
    
    // 动画结束后移除
    setTimeout(() => {
      if (effectContainer.parentNode) {
        effectContainer.remove();
      }
    }, 2000);
  }
  
  // 显示AOE特效
  showAoeEffect(effectType, targetPlayerId) {
    const targetArea = targetPlayerId === 'PLAYER1' ? 
      document.getElementById('player-area') : 
      document.getElementById('opponent-area');
    
    if (!targetArea) return;
    
    const effectContainer = document.createElement('div');
    effectContainer.className = `aoe-effect aoe-effect-${effectType.toLowerCase()}`;
    effectContainer.style.position = 'absolute';
    effectContainer.style.top = '0';
    effectContainer.style.left = '0';
    effectContainer.style.width = '100%';
    effectContainer.style.height = '100%';
    effectContainer.style.pointerEvents = 'none';
    effectContainer.style.zIndex = '1000';
    
    switch (effectType) {
      case 'DAMAGE':
        effectContainer.innerHTML = '<div class="aoe-particles damage-particles">💥💥💥</div>';
        break;
      case 'FREEZE':
        effectContainer.innerHTML = '<div class="aoe-particles freeze-particles">❄️❄️❄️</div>';
        break;
      case 'THUNDER':
        effectContainer.innerHTML = '<div class="aoe-particles thunder-particles">⚡⚡⚡</div>';
        break;
    }
    
    targetArea.style.position = 'relative';
    targetArea.appendChild(effectContainer);
    
    // 动画结束后移除
    setTimeout(() => {
      if (effectContainer.parentNode) {
        effectContainer.remove();
      }
    }, 2000);
  }
  
  // 更新英雄护甲和护盾显示（参考炉石传说的设计）
  updateHeroShields(playerId) {
    const player = this.gameState.players[playerId];
    const avatarElement = playerId === 'PLAYER1' ? 
      this.elements.playerAvatar : 
      this.elements.opponentAvatar;
    
    if (!avatarElement) return;
    
    // 移除所有旧的显示
    avatarElement.querySelectorAll('.hero-buff-container, .hero-debuff-container').forEach(el => el.remove());
    
    // 收集所有Buff（好的效果）- 放在右侧
    const buffs = [];
    
    // 护甲
    const initialHealth = player.hero.initialHealth || 30;
    const extraArmor = player.hero.maxHealth - initialHealth;
    if (extraArmor > 0) {
      buffs.push({ icon: '🛡️', value: extraArmor, class: 'buff-armor', title: `护甲：${extraArmor}（抵挡物理伤害）` });
    }
    
    // 护盾
    if (player.hero.shield > 0) {
      buffs.push({ icon: '🛡️', value: player.hero.shield, class: 'buff-shield', title: `护盾：${player.hero.shield}（抵挡物理伤害）` });
    }
    
    // 法术护盾
    if (player.hero.spellShield > 0) {
      buffs.push({ icon: '✨', value: player.hero.spellShield, class: 'buff-spell-shield', title: `法术护盾：${player.hero.spellShield}（抵挡法术伤害）` });
    }
    
    // 圣盾
    if (player.hero.divineShield) {
      buffs.push({ icon: '☀️', value: '', class: 'buff-divine-shield', title: '圣盾（抵挡一次伤害）' });
    }
    
    // 收集所有Debuff（不好的效果）- 放在左侧
    const debuffs = [];
    
    if (player.hero.frozen) {
      debuffs.push({ icon: '❄️', value: '', class: 'debuff-frozen', title: '冰冻（无法攻击）' });
    }
    if (player.hero.fireEffect && player.hero.fireEffect.turns > 0) {
      debuffs.push({ icon: '🔥', value: player.hero.fireEffect.turns, class: 'debuff-fire', title: `燃烧（剩余${player.hero.fireEffect.turns}回合）` });
    }
    if (player.hero.thunderEffect && player.hero.thunderEffect.turns > 0) {
      debuffs.push({ icon: '⚡', value: player.hero.thunderEffect.turns, class: 'debuff-thunder', title: `雷击（受到伤害+1，剩余${player.hero.thunderEffect.turns}回合）` });
    }
    if (player.hero.poisonEffect && player.hero.poisonEffect.turns > 0) {
      debuffs.push({ icon: '☠️', value: player.hero.poisonEffect.turns, class: 'debuff-poison', title: `中毒（剩余${player.hero.poisonEffect.turns}回合）` });
    }
    
    // 计算图标大小（根据数量动态调整）
    // 计算图标大小（根据数量动态调整，整体缩小）
    const calculateIconSize = (count) => {
      if (count <= 2) return 20;
      if (count <= 3) return 18;
      return 16;
    };
    
    // 创建Buff容器（右侧）
    if (buffs.length > 0) {
      const buffContainer = document.createElement('div');
      buffContainer.className = 'hero-buff-container';
      const iconSize = calculateIconSize(buffs.length);
      
      buffs.forEach((buff, index) => {
        const buffElement = document.createElement('div');
        buffElement.className = `hero-buff-item ${buff.class}`;
        buffElement.innerHTML = `<span class="buff-icon">${buff.icon}</span>${buff.value !== '' ? `<span class="buff-value">${buff.value}</span>` : ''}`;
        buffElement.title = buff.title;
        buffElement.style.width = `${iconSize}px`;
        buffElement.style.height = `${iconSize}px`;
        buffElement.style.fontSize = `${iconSize * 0.5}px`;
        buffElement.style.top = `${index * (iconSize + 2)}px`;
        buffContainer.appendChild(buffElement);
      });
      
      avatarElement.appendChild(buffContainer);
    }
    
    // 创建Debuff容器（左侧）
    if (debuffs.length > 0) {
      const debuffContainer = document.createElement('div');
      debuffContainer.className = 'hero-debuff-container';
      const iconSize = calculateIconSize(debuffs.length);
      
      debuffs.forEach((debuff, index) => {
        const debuffElement = document.createElement('div');
        debuffElement.className = `hero-debuff-item ${debuff.class}`;
        debuffElement.innerHTML = `<span class="debuff-icon">${debuff.icon}</span>${debuff.value !== '' ? `<span class="debuff-value">${debuff.value}</span>` : ''}`;
        debuffElement.title = debuff.title;
        debuffElement.style.width = `${iconSize}px`;
        debuffElement.style.height = `${iconSize}px`;
        debuffElement.style.fontSize = `${iconSize * 0.5}px`;
        debuffElement.style.top = `${index * (iconSize + 2)}px`;
        debuffContainer.appendChild(debuffElement);
      });
      
      avatarElement.appendChild(debuffContainer);
    }
  }
  
  // 通用攻击动画（支持双方玩家）
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
  
  // AI攻击动画（向后兼容包装函数）
  async playAIAttackAnimation(attacker, target, isHeroTarget) {
    return this.playAttackAnimation(attacker, target, isHeroTarget, 'PLAYER2', 'PLAYER1');
  }
  
  // 通用伤害数字显示（支持双方玩家）
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
  
  // AI伤害数字显示（向后兼容包装函数）
  showAIDamageNumber(target, damage, isHeroTarget) {
    return this.showDamageNumber(target, damage, isHeroTarget, 'PLAYER1');
  }
  
  // 播放英雄攻击动画（通用，支持双方玩家）
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
  
  // 屏幕抖动
  shakeScreen() {
    const container = document.querySelector('.game-container');
    if (container) {
      container.classList.add('shake');
      setTimeout(() => {
        container.classList.remove('shake');
      }, 500);
    }
  }
  
  // 播放直伤法术飞行特效
  async playSpellProjectileEffect(spellType, casterPlayerId, targetPlayerId, targetElement, isHeroTarget) {
    // 确定法术类型和对应的图标
    const spellConfig = {
      'DAMAGE_WITH_FREEZE': { icon: '❄️', class: 'freeze', hitIcon: '💠', isChain: true },
      'DAMAGE_WITH_FIRE': { icon: '🔥', class: 'fire', hitIcon: '💥', isChain: false },
      'DAMAGE_WITH_THUNDER': { icon: '⚡', class: 'thunder', hitIcon: '⚡', isChain: true },
      'DAMAGE_WITH_POISON': { icon: '☠️', class: 'poison', hitIcon: '💀', isChain: false }
    };
    
    const config = spellConfig[spellType];
    if (!config) return;
    
    // 获取起点和终点元素
    const startElement = document.getElementById(casterPlayerId === 'PLAYER1' ? 'player-area' : 'opponent-area');
    const endElement = targetElement || document.getElementById(targetPlayerId === 'PLAYER1' ? 'player-area' : 'opponent-area');
    
    if (!startElement || !endElement) return;
    
    const startRect = startElement.getBoundingClientRect();
    const endRect = endElement.getBoundingClientRect();
    
    // 计算起点和终点位置
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;
    
    // 寒冰和雷电使用链状闪电效果
    if (config.isChain) {
      await this.playChainLightningEffect(startX, startY, endX, endY, config.class, endElement, isHeroTarget);
      return;
    }
    
    // 其他法术使用普通投射物效果
    // 创建法术投射物
    const projectile = document.createElement('div');
    projectile.className = `spell-projectile ${config.class}`;
    projectile.textContent = config.icon;
    projectile.style.left = `${startX}px`;
    projectile.style.top = `${startY}px`;
    projectile.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(projectile);
    
    // 创建轨迹效果
    const trailInterval = setInterval(() => {
      const currentLeft = parseFloat(projectile.style.left);
      const currentTop = parseFloat(projectile.style.top);
      
      const trail = document.createElement('div');
      trail.className = `spell-trail ${config.class}`;
      trail.style.left = `${currentLeft}px`;
      trail.style.top = `${currentTop}px`;
      trail.style.width = '15px';
      trail.style.height = '15px';
      document.body.appendChild(trail);
      
      setTimeout(() => {
        if (trail.parentNode) trail.remove();
      }, 300);
    }, 50);
    
    // 飞行动画
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        projectile.style.left = `${endX}px`;
        projectile.style.top = `${endY}px`;
      });
      
      setTimeout(() => {
        clearInterval(trailInterval);
        resolve();
      }, 500);
    });
    
    // 移除投射物
    if (projectile.parentNode) {
      projectile.remove();
    }
    
    // 命中特效
    const hitEffect = document.createElement('div');
    hitEffect.className = 'spell-hit-effect';
    hitEffect.textContent = config.hitIcon;
    endElement.style.position = 'relative';
    endElement.appendChild(hitEffect);
    
    setTimeout(() => {
      if (hitEffect.parentNode) hitEffect.remove();
    }, 800);
    
    // 应用状态特效到目标
    this.applyStatusEffect(endElement, config.class, isHeroTarget);
  }
  
  // 播放链状闪电效果（用于寒冰和雷电）
  async playChainLightningEffect(startX, startY, endX, endY, effectClass, targetElement, isHeroTarget) {
    // 创建SVG容器
    const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgContainer.style.position = 'fixed';
    svgContainer.style.top = '0';
    svgContainer.style.left = '0';
    svgContainer.style.width = '100vw';
    svgContainer.style.height = '100vh';
    svgContainer.style.pointerEvents = 'none';
    svgContainer.style.zIndex = '10000';
    document.body.appendChild(svgContainer);
    
    // 生成不规则的链状路径
    const generateLightningPath = () => {
      const points = [];
      const segments = 8 + Math.floor(Math.random() * 5); // 8-12个分段
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const baseX = startX + (endX - startX) * t;
        const baseY = startY + (endY - startY) * t;
        
        // 添加随机偏移（两端偏移小，中间偏移大）
        const offsetAmount = Math.sin(t * Math.PI) * 40;
        const offsetX = (Math.random() - 0.5) * offsetAmount;
        const offsetY = (Math.random() - 0.5) * offsetAmount;
        
        if (i === 0 || i === segments) {
          points.push({ x: baseX, y: baseY }); // 两端不偏移
        } else {
          points.push({ x: baseX + offsetX, y: baseY + offsetY });
        }
      }
      
      // 转换为SVG路径
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
      }
      return d;
    };
    
    // 确定颜色
    const colors = {
      'freeze': { main: '#00d4ff', glow: 'rgba(0, 212, 255, 0.8)' },
      'thunder': { main: '#ffeb3b', glow: 'rgba(255, 235, 59, 0.8)' }
    };
    const color = colors[effectClass] || colors.thunder;
    
    // 创建多条闪电路径（增加视觉效果）
    const createLightning = () => {
      // 主闪电
      const mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      mainPath.setAttribute('d', generateLightningPath());
      mainPath.setAttribute('stroke', color.main);
      mainPath.setAttribute('stroke-width', '3');
      mainPath.setAttribute('fill', 'none');
      mainPath.setAttribute('filter', 'url(#lightning-glow)');
      mainPath.style.opacity = '1';
      
      // 辉光闪电
      const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      glowPath.setAttribute('d', generateLightningPath());
      glowPath.setAttribute('stroke', color.glow);
      glowPath.setAttribute('stroke-width', '8');
      glowPath.setAttribute('fill', 'none');
      glowPath.style.opacity = '0.5';
      
      return { mainPath, glowPath };
    };
    
    // 添加SVG滤镜
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <filter id="lightning-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
    svgContainer.appendChild(defs);
    
    // 动画：每100ms更新闪电路径
    let lightnings = [];
    const animateLightning = () => {
      // 移除旧闪电
      lightnings.forEach(({ mainPath, glowPath }) => {
        if (mainPath.parentNode) mainPath.remove();
        if (glowPath.parentNode) glowPath.remove();
      });
      lightnings = [];
      
      // 创建新闪电（2-3条）
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const lightning = createLightning();
        svgContainer.appendChild(lightning.glowPath);
        svgContainer.appendChild(lightning.mainPath);
        lightnings.push(lightning);
      }
    };
    
    // 运行动画0.5秒
    animateLightning();
    const interval = setInterval(animateLightning, 80);
    
    await new Promise(resolve => {
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 500);
    });
    
    // 移除SVG容器
    if (svgContainer.parentNode) {
      svgContainer.remove();
    }
    
    // 命中特效
    const hitIcon = effectClass === 'freeze' ? '💠' : '⚡';
    const hitEffect = document.createElement('div');
    hitEffect.className = 'spell-hit-effect';
    hitEffect.textContent = hitIcon;
    targetElement.style.position = 'relative';
    targetElement.appendChild(hitEffect);
    
    setTimeout(() => {
      if (hitEffect.parentNode) hitEffect.remove();
    }, 800);
    
    // 应用状态特效到目标
    this.applyStatusEffect(targetElement, effectClass, isHeroTarget);
  }
  
  // 应用状态特效
  applyStatusEffect(targetElement, effectType, isHeroTarget) {
    if (!targetElement) return;
    
    // 移除旧的状态特效
    targetElement.classList.remove('frozen-effect', 'burning-effect', 'thunder-effect', 'poison-effect');
    
    // 添加新的状态特效
    switch (effectType) {
      case 'freeze':
        targetElement.classList.add('frozen-effect');
        // 冰冻效果持续显示一段时间
        setTimeout(() => {
          targetElement.classList.remove('frozen-effect');
        }, 3000);
        break;
      case 'fire':
        targetElement.classList.add('burning-effect');
        setTimeout(() => {
          targetElement.classList.remove('burning-effect');
        }, 2000);
        break;
      case 'thunder':
        targetElement.classList.add('thunder-effect');
        setTimeout(() => {
          targetElement.classList.remove('thunder-effect');
        }, 1500);
        break;
      case 'poison':
        targetElement.classList.add('poison-effect');
        setTimeout(() => {
          targetElement.classList.remove('poison-effect');
        }, 2500);
        break;
    }
  }
  
  // 显示游戏结束特效
  showGameOverEffect(winner) {
    const isPlayerWin = winner === 'PLAYER1';
    const loserHeroName = isPlayerWin ? 
      document.querySelector('#opponent-area .hero-name') :
      document.querySelector('#player-area .hero-name');
    
    // 添加碎裂和褪色效果
    if (loserHeroName) {
      loserHeroName.classList.add('hero-name-defeated');
    }
    
    // 创建胜利/失败弹窗
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.innerHTML = `
      <div class="game-over-modal ${isPlayerWin ? 'victory' : 'defeat'}">
        <div class="game-over-title">${isPlayerWin ? '胜利！' : '失败！'}</div>
        <div class="game-over-message">${isPlayerWin ? '你击败了对手！' : '你被击败了...'}</div>
        <button class="game-over-button" onclick="location.reload()">重新开始</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // 添加进入动画
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });
  }
  
  // 创建卡牌悬浮提示tooltip
  createTooltip() {
    if (this.tooltip) return;
    
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'card-tooltip';
    this.tooltip.id = 'card-tooltip';
    document.body.appendChild(this.tooltip);
  }
  
  // 显示卡牌详情tooltip
  showCardTooltip(card, event) {
    if (!this.tooltip) {
      this.createTooltip();
    }
    
    const rarityClass = `card-tooltip-rarity-${card.rarity || 'C'}`;
    this.tooltip.className = `card-tooltip ${rarityClass}`;
    
    let content = '';
    
    // 头部：名称和费用
    content += `
      <div class="card-tooltip-header">
        <span class="card-tooltip-name">${card.name}</span>
        <span class="card-tooltip-cost">${card.cost} 费</span>
      </div>
    `;
    
    // 根据卡牌类型显示不同内容
    if (card.type === 'unit') {
      content += `<div class="card-tooltip-type">单位卡</div>`;
      content += `
        <div class="card-tooltip-stats">
          <span>⚔️ 攻击: ${card.attack}</span>
          <span>❤️ 生命: ${card.health}</span>
        </div>
      `;
      
      // 关键词
      if (card.keywords && card.keywords.length > 0) {
        content += '<div class="card-tooltip-keywords">';
        card.keywords.forEach(kw => {
          const kwName = this.getKeywordDisplayName(kw);
          content += `<span class="card-tooltip-keyword">${kwName}</span>`;
        });
        content += '</div>';
      }
      
      // 描述
      if (card.description) {
        content += `<div class="card-tooltip-description">${card.description}</div>`;
      }
      
      // 战吼效果
      if (card.battlecry) {
        content += `
          <div class="card-tooltip-effect">
            <div class="card-tooltip-effect-title">战吼效果</div>
            <div class="card-tooltip-effect-desc">${this.getBattlecryDescription(card.battlecry)}</div>
          </div>
        `;
      }
      
      // 光环效果
      if (card.aura) {
        content += `
          <div class="card-tooltip-effect">
            <div class="card-tooltip-effect-title">光环效果</div>
            <div class="card-tooltip-effect-desc">${this.getAuraDescription(card.aura)}</div>
          </div>
        `;
      }
      
    } else if (card.type === 'spell') {
      content += `<div class="card-tooltip-type">法术卡</div>`;
      
      // 描述
      if (card.description) {
        content += `<div class="card-tooltip-description">${card.description}</div>`;
      }
      
      // 法术效果详情
      if (card.spellEffect) {
        const effect = card.spellEffect;
        content += `
          <div class="card-tooltip-effect">
            <div class="card-tooltip-effect-title">${this.getSpellEffectTypeName(effect.type)}</div>
            <div class="card-tooltip-effect-desc">
              ${this.getSpellEffectDescription(effect)}
            </div>
          </div>
        `;
      }
      
    } else if (card.type === 'weapon') {
      content += `<div class="card-tooltip-type">武器卡</div>`;
      content += `
        <div class="card-tooltip-stats">
          <span>⚔️ 攻击: ${card.attack}</span>
          <span>🛡️ 耐久: ${card.durability}</span>
        </div>
      `;
      
      // 描述
      if (card.description) {
        content += `<div class="card-tooltip-description">${card.description}</div>`;
      }
      
      // 武器特效
      if (card.weaponEffect) {
        content += `
          <div class="card-tooltip-effect">
            <div class="card-tooltip-effect-title">${this.getWeaponEffectName(card.weaponEffect.type)}</div>
            <div class="card-tooltip-effect-desc">${this.getWeaponEffectDescription(card.weaponEffect)}</div>
          </div>
        `;
      }
    }
    
    this.tooltip.innerHTML = content;
    
    // 定位tooltip
    this.positionTooltip(event);
    
    // 显示tooltip
    this.tooltip.classList.add('visible');
  }
  
  // 定位tooltip
  positionTooltip(event) {
    if (!this.tooltip) return;
    
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const padding = 15;
    
    let left = event.clientX + padding;
    let top = event.clientY + padding;
    
    // 防止超出右边界
    if (left + tooltipRect.width > window.innerWidth) {
      left = event.clientX - tooltipRect.width - padding;
    }
    
    // 防止超出下边界
    if (top + tooltipRect.height > window.innerHeight) {
      top = event.clientY - tooltipRect.height - padding;
    }
    
    // 防止超出左边界
    if (left < 0) {
      left = padding;
    }
    
    // 防止超出上边界
    if (top < 0) {
      top = padding;
    }
    
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }
  
  // 隐藏tooltip
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
  }
  
  // 显示战场单位详情tooltip
  showUnitTooltip(unit, event) {
    if (!this.tooltip) {
      this.createTooltip();
    }
    
    const rarityClass = `card-tooltip-rarity-${unit.rarity || 'C'}`;
    this.tooltip.className = `card-tooltip ${rarityClass}`;
    
    let content = '';
    
    // 头部：名称和费用
    content += `
      <div class="card-tooltip-header">
        <span class="card-tooltip-name">${unit.name}</span>
        <span class="card-tooltip-cost">${unit.cost || 0} 费</span>
      </div>
    `;
    
    content += `<div class="card-tooltip-type">战场单位</div>`;
    content += `
      <div class="card-tooltip-stats">
        <span>⚔️ 攻击: ${unit.attack}</span>
        <span>❤️ 生命: ${unit.currentHealth}/${unit.maxHealth}</span>
      </div>
    `;
    
    // 关键词
    if (unit.keywords && unit.keywords.length > 0) {
      content += '<div class="card-tooltip-keywords">';
      unit.keywords.forEach(kw => {
        const kwName = this.getKeywordDisplayName(kw);
        content += `<span class="card-tooltip-keyword">${kwName}</span>`;
      });
      content += '</div>';
    }
    
    // 描述
    if (unit.description) {
      content += `<div class="card-tooltip-description">${unit.description}</div>`;
    }
    
    // 状态效果
    const statusEffects = [];
    if (unit.frozen) {
      statusEffects.push('❄️ 被冰冻（无法攻击）');
    }
    if (unit.fireEffect && unit.fireEffect.duration > 0) {
      statusEffects.push(`🔥 燃烧中（剩余${unit.fireEffect.duration}回合）`);
    }
    if (unit.thunderEffect && unit.thunderEffect.duration > 0) {
      statusEffects.push(`⚡ 雷击（受到伤害+1，剩余${unit.thunderEffect.duration}回合）`);
    }
    if (unit.poisonEffect && unit.poisonEffect.duration > 0) {
      statusEffects.push(`☠️ 中毒（每回合掉血，剩余${unit.poisonEffect.duration}回合）`);
    }
    if (unit.shield > 0) {
      statusEffects.push(`🛡️ 护盾（${unit.shield}）`);
    }
    if (unit.spellShield > 0) {
      statusEffects.push(`✨ 法术护盾（${unit.spellShield}）`);
    }
    if (unit.divineShield) {
      statusEffects.push(`☀️ 圣盾（抵挡一次伤害）`);
    }
    
    if (statusEffects.length > 0) {
      content += `
        <div class="card-tooltip-effect">
          <div class="card-tooltip-effect-title">当前状态</div>
          <div class="card-tooltip-effect-desc">${statusEffects.join('<br>')}</div>
        </div>
      `;
    }
    
    // 攻击状态
    const canAttack = !unit.exhausted && (unit.keywords.some(kw => kw.includes('CHARGE')) || unit.onBoardTurns > 0);
    content += `
      <div style="margin-top: 8px; font-size: 0.85em; color: ${canAttack ? '#4ade80' : '#94a3b8'};">
        ${canAttack ? '⚔️ 可以攻击' : '⏳ 等待中'}
        ${unit.exhausted ? '（本回合已行动）' : ''}
      </div>
    `;
    
    this.tooltip.innerHTML = content;
    
    // 定位tooltip
    this.positionTooltip(event);
    
    // 显示tooltip
    this.tooltip.classList.add('visible');
  }
  
  // 获取关键词显示名称
  getKeywordDisplayName(keyword) {
    const names = {
      'TAUNT': '嘲讽',
      'CHARGE': '冲锋',
      'LIFESTEAL': '吸血',
      'DIVINE_SHIELD': '圣盾',
      'RANGED': '远程',
      'PIERCE_1': '破甲1',
      'PIERCE_2': '破甲2',
      'TEMP_TAUNT': '临时嘲讽'
    };
    return names[keyword] || keyword;
  }
  
  // 获取战吼效果描述
  getBattlecryDescription(battlecry) {
    if (!battlecry) return '';
    
    switch (battlecry.type) {
      case 'HEAL':
        return `治疗${battlecry.target === 'HERO' ? '英雄' : '友方单位'} ${battlecry.value} 点生命`;
      case 'DRAW_CARD':
        return `抽 ${battlecry.value} 张牌`;
      case 'BUFF':
        const stats = battlecry.stats || {};
        return `使${battlecry.target === 'ALL_UNITS' ? '所有友方单位' : '一个单位'}获得 +${stats.attack || 0}/+${stats.health || 0}`;
      case 'DAMAGE':
        return `对${battlecry.target === 'ENEMY_HERO' ? '敌方英雄' : '敌方单位'}造成 ${battlecry.value} 点伤害`;
      default:
        return battlecry.description || '';
    }
  }
  
  // 获取光环效果描述
  getAuraDescription(aura) {
    if (!aura) return '';
    
    switch (aura.type) {
      case 'ADJACENT_BUFF':
        const stats = aura.stats || {};
        return `相邻单位获得 +${stats.attack || 0}/+${stats.health || 0}`;
      case 'SPELL_POWER':
        return `法术伤害 +${aura.value}`;
      default:
        return aura.description || '';
    }
  }
  
  // 获取法术效果类型名称
  getSpellEffectTypeName(type) {
    const names = {
      'AOE_DAMAGE': 'AOE伤害',
      'AOE_DAMAGE_WITH_FREEZE': 'AOE冰冻伤害',
      'AOE_DAMAGE_WITH_THUNDER': 'AOE雷电伤害',
      'DAMAGE_WITH_FREEZE': '冰冻直伤',
      'DAMAGE_WITH_THUNDER': '雷电直伤',
      'DAMAGE_WITH_FIRE': '火焰直伤',
      'DAMAGE_WITH_POISON': '剧毒直伤',
      'BUFF_ATTACK': '攻击增益',
      'BUFF_HEALTH': '生命增益',
      'BUFF_STATS': '属性增益',
      'BUFF_HERO_ARMOR': '护甲增益',
      'ADD_SHIELD': '添加护盾',
      'ADD_DIVINE_SHIELD': '添加圣盾',
      'DRAW_CARD': '抽牌',
      'GAIN_MANA': '获得法力'
    };
    return names[type] || '法术效果';
  }
  
  // 获取法术效果详细描述
  getSpellEffectDescription(effect) {
    if (!effect) return '';
    
    let desc = '';
    
    // 伤害值
    if (effect.damage) {
      desc += `<span class="card-tooltip-damage">伤害: ${effect.damage}</span> `;
    }
    if (effect.value) {
      if (effect.type.includes('DAMAGE')) {
        desc += `<span class="card-tooltip-damage">伤害: ${effect.value}</span> `;
      } else if (effect.type === 'DRAW_CARD') {
        desc += `抽 ${effect.value} 张牌 `;
      } else if (effect.type === 'GAIN_MANA') {
        desc += `获得 ${effect.value} 点临时法力 `;
      } else if (effect.type === 'ADD_SHIELD') {
        desc += `${effect.isSpell ? '法术护盾' : '护盾'} +${effect.value} `;
      } else {
        desc += `效果值: ${effect.value} `;
      }
    }
    
    // 持续回合
    if (effect.duration) {
      desc += `<div class="card-tooltip-duration">持续 ${effect.duration} 回合</div>`;
    }
    
    // 目标类型
    if (effect.target) {
      const targetNames = {
        'TARGET': '选择目标',
        'ENEMY_UNITS': '所有敌方单位',
        'FRIENDLY_UNIT': '友方单位',
        'HERO': '英雄'
      };
      const targetName = targetNames[effect.target] || effect.target;
      desc += `<div style="color: #6c757d; font-size: 0.8em; margin-top: 4px;">目标: ${targetName}</div>`;
    }
    
    return desc || '无特殊效果';
  }
  
  // 获取武器特效名称
  getWeaponEffectName(type) {
    const names = {
      'FREEZE': '❄️ 冰冻特效',
      'FIRE': '🔥 火焰特效',
      'THUNDER': '⚡ 雷电特效',
      'POISON': '☠️ 剧毒特效'
    };
    return names[type] || '武器特效';
  }
  
  // 获取武器特效描述
  getWeaponEffectDescription(effect) {
    if (!effect) return '';
    
    const descriptions = {
      'FREEZE': '攻击后冰冻目标，使其下回合无法攻击',
      'FIRE': '攻击后对目标造成持续灼烧，每回合减少护甲/生命',
      'THUNDER': '攻击后目标受到的所有伤害+1',
      'POISON': '攻击后目标中毒，持续掉血'
    };
    
    let desc = descriptions[effect.type] || '';
    
    if (effect.duration) {
      desc += `<div class="card-tooltip-duration">持续 ${effect.duration} 回合</div>`;
    }
    
    return desc;
  }
  
  // 显示英雄受伤害特效（供AI调用）
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
  
  // 显示英雄治疗特效（供AI调用）
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
  
  // 显示护盾特效（供AI调用）
  showShieldEffect(targetPlayerId, isHero, unitId = null) {
    let targetElement = null;
    
    if (isHero) {
      targetElement = targetPlayerId === 'PLAYER1' ? 
        document.getElementById('player-area') :
        document.getElementById('opponent-area');
    } else {
      targetElement = document.querySelector(`[data-unit-id="${unitId}"][data-player="${targetPlayerId}"]`);
    }
    
    if (targetElement) {
      targetElement.classList.add('shield-effect');
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
  
  // 屏幕震动特效（供AI调用）
  shakeScreen() {
    document.body.classList.add('screen-shake');
    setTimeout(() => {
      document.body.classList.remove('screen-shake');
    }, 300);
  }
}
