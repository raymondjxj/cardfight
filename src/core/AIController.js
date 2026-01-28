// src/core/AIController.js
export class AIController {
  constructor(gameState, battleSystem) {
    this.gameState = gameState;
    this.battleSystem = battleSystem;
  }
  
  // 执行AI回合
  async playTurn(renderer) {
    try {
      const player = this.gameState.players['PLAYER2'];
      const opponent = this.gameState.players['PLAYER1'];
      
      // 等待一小段时间，让玩家看到回合切换
      await this.delay(500);
      if (renderer) renderer.render();
      
      // 1. 使用卡牌（优先使用单位，然后使用法术）
      await this.playCards(player);
      if (renderer) renderer.render();
      
      // 等待一下
      await this.delay(300);
      
      // 2. 使用英雄技能（如果法力充足且未使用）
      await this.useHeroSkill(player, renderer);
      if (renderer) renderer.render();
      
      // 等待一下
      await this.delay(300);
      
      // 3. 使用单位攻击
      await this.attackWithUnits(player, opponent, renderer);
      if (renderer) renderer.render();
      
      // 等待一下
      await this.delay(300);
      
      // 4. 使用英雄攻击（如果有武器且未疲惫）
      await this.attackWithHero(player, opponent, renderer);
      if (renderer) renderer.render();
      
      // 等待一下
      await this.delay(300);
      
      // 5. 结束回合
      this.gameState.endTurn();
      if (renderer) renderer.render();
    } catch (error) {
      console.error('AI回合执行出错:', error);
      // 即使出错也结束回合
      this.gameState.endTurn();
      if (renderer) renderer.render();
    }
  }
  
  // 使用卡牌
  async playCards(player) {
    let maxIterations = 20; // 防止无限循环
    let iterations = 0;
    let lastHandSize = player.hand.length;
    let noProgressCount = 0;
    
    while (iterations < maxIterations) {
      iterations++;
      
      // 获取可用的卡牌（每次重新查找，因为手牌会变化）
      const playableCards = player.hand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => card.cost <= player.mana.current)
        .sort((a, b) => a.card.cost - b.card.cost);
      
      if (playableCards.length === 0) {
        break; // 没有可用的卡牌了
      }
      
      let cardPlayed = false;
      
      // 优先使用单位卡（如果战场未满）
      if (player.canPlayUnit()) {
        const unitCard = playableCards.find(({ card }) => card.type === 'unit');
        if (unitCard) {
          const position = this.findEmptyPosition(player);
          if (position !== null) {
            // 重新查找当前索引（因为手牌可能已经变化）
            const currentIndex = player.hand.findIndex(c => 
              c.id === unitCard.card.id && 
              c.cost === unitCard.card.cost &&
              c.type === unitCard.card.type
            );
            if (currentIndex !== -1 && 
                player.mana.current >= unitCard.card.cost) {
              const success = this.battleSystem.playCard('PLAYER2', currentIndex, position);
              if (success) {
                await this.delay(400);
                cardPlayed = true;
                continue; // 继续下一轮
              }
            }
          }
        }
      }
      
      // 使用武器卡（优先装备武器）
      if (!cardPlayed && !player.hero.weapon) {
        const weaponCard = playableCards.find(({ card }) => card.type === 'weapon');
        if (weaponCard) {
          const currentIndex = player.hand.findIndex(c => 
            c.id === weaponCard.card.id && 
            c.cost === weaponCard.card.cost &&
            c.type === weaponCard.card.type
          );
          if (currentIndex !== -1 && 
              player.mana.current >= weaponCard.card.cost) {
            const success = this.battleSystem.playCard('PLAYER2', currentIndex);
            if (success) {
              await this.delay(400);
              cardPlayed = true;
              continue;
            }
          }
        }
      }
      
      // 使用增益法术（优先给单位或英雄加buff）
      if (!cardPlayed) {
        const buffSpell = playableCards.find(({ card }) => 
          card.type === 'spell' && 
          card.spellEffect && 
          (card.spellEffect.type === 'BUFF_ATTACK' ||
           card.spellEffect.type === 'BUFF_HEALTH' ||
           card.spellEffect.type === 'BUFF_STATS' ||
           card.spellEffect.type === 'BUFF_HERO_ARMOR' ||
           card.spellEffect.type === 'ADD_DIVINE_SHIELD')
        );
        
        if (buffSpell) {
          // 智能选择目标
          let target = null;
          if (buffSpell.card.spellEffect.type === 'BUFF_HERO_ARMOR') {
            target = 'hero';
          } else if (player.battlefield.length > 0) {
            // 选择攻击力最高的单位（优先强化主力）
            target = player.battlefield.reduce((max, u, idx) => 
              u.attack > max.attack ? { unit: u, index: idx, attack: u.attack } : max,
              { unit: player.battlefield[0], index: 0, attack: player.battlefield[0].attack }
            ).index;
          }
          
          if (target !== null) {
            const currentIndex = player.hand.findIndex(c => 
              c.id === buffSpell.card.id && 
              c.cost === buffSpell.card.cost &&
              c.type === buffSpell.card.type
            );
            if (currentIndex !== -1 && 
                player.mana.current >= buffSpell.card.cost) {
              const success = this.battleSystem.playCard('PLAYER2', currentIndex, target);
              if (success) {
                await this.delay(400);
                cardPlayed = true;
                continue;
              }
            }
          }
        }
      }
      
      // 使用法术卡
      if (!cardPlayed) {
        // 优先使用AOE伤害法术
        const aoeSpell = playableCards.find(({ card }) => 
          card.type === 'spell' && 
          card.spellEffect && 
          card.spellEffect.type === 'AOE_DAMAGE'
        );
        
        if (aoeSpell) {
          const currentIndex = player.hand.findIndex(c => 
            c.id === aoeSpell.card.id && 
            c.cost === aoeSpell.card.cost &&
            c.type === aoeSpell.card.type
          );
          if (currentIndex !== -1 && 
              player.mana.current >= aoeSpell.card.cost) {
            const success = this.battleSystem.playCard('PLAYER2', currentIndex);
            if (success) {
              await this.delay(400);
              cardPlayed = true;
              continue;
            }
          }
        }
        
        // 使用抽牌法术（手牌少于5张时）
        if (!cardPlayed && player.hand.length < 5) {
          const drawSpell = playableCards.find(({ card }) => 
            card.type === 'spell' && 
            card.spellEffect && 
            card.spellEffect.type === 'DRAW_CARD'
          );
          
          if (drawSpell) {
            const currentIndex = player.hand.findIndex(c => 
              c.id === drawSpell.card.id && 
              c.cost === drawSpell.card.cost &&
              c.type === drawSpell.card.type
            );
            if (currentIndex !== -1 && 
                player.mana.current >= drawSpell.card.cost) {
              const success = this.battleSystem.playCard('PLAYER2', currentIndex);
              if (success) {
                await this.delay(400);
                cardPlayed = true;
                continue;
              }
            }
          }
        }
        
        // 使用发现牌（优先使用）
        if (!cardPlayed) {
          const discoverSpell = playableCards.find(({ card }) => 
            card.type === 'spell' && 
            card.spellEffect && 
            card.spellEffect.type === 'DISCOVER'
          );
          
          if (discoverSpell) {
            const currentIndex = player.hand.findIndex(c => 
              c.id === discoverSpell.card.id && 
              c.cost === discoverSpell.card.cost &&
              c.type === discoverSpell.card.type
            );
            if (currentIndex !== -1 && 
                player.mana.current >= discoverSpell.card.cost) {
              // AI使用发现牌时随机选择一张
              const success = this.battleSystem.playCard('PLAYER2', currentIndex);
              if (success) {
                await this.delay(1000); // 等待发现UI完成
                cardPlayed = true;
                continue;
              }
            }
          }
        }
        
        // 使用直伤法术（优先使用）
        if (!cardPlayed) {
          const damageSpell = playableCards.find(({ card }) => 
            card.type === 'spell' && 
            card.spellEffect && 
            (card.spellEffect.type === 'DAMAGE_WITH_FREEZE' ||
             card.spellEffect.type === 'DAMAGE_WITH_THUNDER' ||
             card.spellEffect.type === 'DAMAGE_WITH_FIRE' ||
             card.spellEffect.type === 'DAMAGE_WITH_POISON')
          );
          
          if (damageSpell) {
            // 智能选择目标：优先攻击生命值最低的敌方单位，如果没有单位则攻击英雄
            const opponent = this.gameState.players['PLAYER1'];
            let target = null;
            
            if (opponent.battlefield.length > 0) {
              // 选择生命值最低的单位
              const lowestUnit = opponent.battlefield.reduce((min, u) => 
                u.currentHealth < min.currentHealth ? u : min
              );
              const unitIndex = opponent.battlefield.findIndex(u => u.id === lowestUnit.id);
              target = unitIndex;
            } else {
              // 没有单位，攻击英雄（传递玩家ID）
              target = 'PLAYER1';
            }
            
            if (target !== null) {
              const currentIndex = player.hand.findIndex(c => 
                c.id === damageSpell.card.id && 
                c.cost === damageSpell.card.cost &&
                c.type === damageSpell.card.type
              );
              if (currentIndex !== -1 && 
                  player.mana.current >= damageSpell.card.cost) {
                
                // 播放法术飞行特效
                const renderer = this.gameState.renderer;
                const spellType = damageSpell.card.spellEffect?.type;
                const isHeroTarget = target === 'PLAYER1';
                
                if (renderer && renderer.playSpellProjectileEffect && spellType) {
                  let targetElement = null;
                  if (isHeroTarget) {
                    targetElement = document.getElementById('player-area');
                  } else {
                    const opponent = this.gameState.players['PLAYER1'];
                    const targetUnit = opponent.battlefield[target];
                    if (targetUnit) {
                      targetElement = document.querySelector(`[data-unit-id="${targetUnit.id}"][data-player="PLAYER1"]`);
                    }
                  }
                  
                  await renderer.playSpellProjectileEffect(spellType, 'PLAYER2', 'PLAYER1', targetElement, isHeroTarget);
                }
                
                const success = this.battleSystem.playCard('PLAYER2', currentIndex, target);
                if (success) {
                  await this.delay(400);
                  cardPlayed = true;
                  continue;
                }
              }
            }
          }
        }
        
        // 使用其他法术
        if (!cardPlayed) {
          const spellCard = playableCards.find(({ card }) => card.type === 'spell');
          if (spellCard) {
            const currentIndex = player.hand.findIndex(c => 
              c.id === spellCard.card.id && 
              c.cost === spellCard.card.cost &&
              c.type === spellCard.card.type
            );
            if (currentIndex !== -1 && 
                player.mana.current >= spellCard.card.cost) {
              const success = this.battleSystem.playCard('PLAYER2', currentIndex);
              if (success) {
                await this.delay(400);
                cardPlayed = true;
                continue;
              }
            }
          }
        }
      }
      
      // 检查是否有进展（手牌数量或法力变化）
      if (player.hand.length === lastHandSize && !cardPlayed) {
        noProgressCount++;
        if (noProgressCount >= 2) {
          // 连续两次没有进展，退出循环
          break;
        }
      } else {
        noProgressCount = 0;
        lastHandSize = player.hand.length;
      }
      
      // 如果没有使用任何卡牌，退出循环
      if (!cardPlayed) {
        break;
      }
    }
  }
  
  // 使用单位攻击
  async attackWithUnits(player, opponent, renderer) {
    // 获取所有可以攻击的单位（使用统一的 canAttack 方法）
    const attackableUnits = player.battlefield
      .map((unit, index) => ({ unit, index }))
      .filter(({ unit }) => unit.canAttack());
    
    // 检查是否有冲锋单位
    const chargeUnits = attackableUnits.filter(({ unit }) => 
      unit.keywords.some(kw => kw.includes('CHARGE'))
    );
    
    // 先使用冲锋单位攻击
    for (const { unit, index } of chargeUnits) {
      if (!unit.exhausted) {
        await this.attackWithUnit(unit, index, player, opponent, renderer);
        await this.delay(300);
      }
    }
    
    // 然后使用其他单位攻击
    for (const { unit, index } of attackableUnits) {
      if (!unit.exhausted && !chargeUnits.find(cu => cu.unit === unit)) {
        await this.attackWithUnit(unit, index, player, opponent, renderer);
        await this.delay(300);
      }
    }
  }
  
  // 使用单个单位攻击
  async attackWithUnit(unit, unitIndex, player, opponent, renderer) {
    // 检查是否有嘲讽单位
    const tauntUnits = opponent.battlefield.filter(u => 
      u.keywords.some(kw => kw.includes('TAUNT'))
    );
    
    // 检查单位是否有远程
    const hasRanged = unit.card.keywords.includes('RANGED');
    
    let target;
    let targetIndex;
    let isHeroTarget = false;
    
    if (tauntUnits.length > 0 && !hasRanged) {
      // 有嘲讽单位且没有远程，必须攻击嘲讽单位
      // 选择生命值最低的嘲讽单位
      target = tauntUnits.reduce((min, u) => 
        u.currentHealth < min.currentHealth ? u : min
      );
      targetIndex = opponent.battlefield.indexOf(target);
    } else {
      // 智能选择目标：优先攻击能击杀的单位，否则攻击生命值最低的
      if (opponent.battlefield.length > 0) {
        const killableTargets = opponent.battlefield.filter(u => 
          u.currentHealth <= unit.attack + (unit.auraAttackBonus || 0)
        );
        
        if (killableTargets.length > 0) {
          // 优先击杀能击杀的单位（选择攻击力最高的，避免浪费伤害）
          target = killableTargets.reduce((max, u) => 
            u.attack > max.attack ? u : max
          );
        } else {
          // 不能击杀，选择生命值最低的
          target = opponent.battlefield.reduce((min, u) => 
            u.currentHealth < min.currentHealth ? u : min
          );
        }
        targetIndex = opponent.battlefield.indexOf(target);
      } else {
        // 没有单位，直接攻击英雄
        target = opponent.hero;
        targetIndex = 'hero';
        isHeroTarget = true;
      }
    }
    
    if (target) {
      // 播放攻击动画
      if (renderer && renderer.playAIAttackAnimation) {
        await renderer.playAIAttackAnimation(unit, target, isHeroTarget);
      }
      
      // 执行攻击
      const beforeHealth = isHeroTarget ? target.health : target.currentHealth;
      this.battleSystem.unitAttack('PLAYER2', unitIndex, 'PLAYER1', targetIndex);
      
      // 显示伤害数字和特效
      if (renderer && renderer.showAIDamageNumber) {
        const afterHealth = isHeroTarget ? target.health : target.currentHealth;
        const damage = Math.max(0, beforeHealth - afterHealth);
        if (damage > 0) {
          renderer.showAIDamageNumber(target, damage, isHeroTarget);
          renderer.shakeScreen();
        }
      }
      
      // 重新渲染
      if (renderer) {
        renderer.render();
      }
      
      // 等待动画完成
      await this.delay(400);
    }
  }
  
  // 查找空位置
  findEmptyPosition(player) {
    const positions = [0, 1, 2];
    const occupied = player.battlefield.map(u => u.position);
    const empty = positions.find(p => !occupied.includes(p));
    return empty !== undefined ? empty : null;
  }
  
  // 使用英雄攻击
  async attackWithHero(player, opponent, renderer) {
    const hero = player.hero;
    
    // 检查英雄是否可以攻击（有武器且未疲惫）
    if (!hero.weapon || hero.attack <= 0 || hero.exhausted) {
      return;
    }
    
    // 检查是否有嘲讽单位
    const tauntUnits = opponent.battlefield.filter(u => 
      u.keywords.some(kw => kw.includes('TAUNT'))
    );
    
    let target;
    let targetIndex;
    let isHeroTarget = false;
    
    if (tauntUnits.length > 0) {
      // 有嘲讽单位，必须攻击嘲讽单位
      // 优先击杀能击杀的嘲讽单位
      const killableTaunts = tauntUnits.filter(u => 
        u.currentHealth <= hero.attack
      );
      
      if (killableTaunts.length > 0) {
        target = killableTaunts.reduce((min, u) => 
          u.currentHealth < min.currentHealth ? u : min
        );
      } else {
        // 不能击杀，选择生命值最低的
        target = tauntUnits.reduce((min, u) => 
          u.currentHealth < min.currentHealth ? u : min
        );
      }
      targetIndex = opponent.battlefield.indexOf(target);
    } else {
      // 没有嘲讽单位，优先攻击敌方单位
      if (opponent.battlefield.length > 0) {
        // 优先击杀能击杀的单位
        const killableTargets = opponent.battlefield.filter(u => 
          u.currentHealth <= hero.attack
        );
        
        if (killableTargets.length > 0) {
          target = killableTargets.reduce((min, u) => 
            u.currentHealth < min.currentHealth ? u : min
          );
        } else {
          // 不能击杀，选择生命值最低的
          target = opponent.battlefield.reduce((min, u) => 
            u.currentHealth < min.currentHealth ? u : min
          );
        }
        targetIndex = opponent.battlefield.indexOf(target);
      } else {
        // 没有单位，直接攻击英雄
        target = opponent.hero;
        targetIndex = 'hero';
        isHeroTarget = true;
      }
    }
    
    if (target) {
      // 播放攻击动画（使用统一的方法，对称设计）
      if (renderer && renderer.playHeroAttackAnimation) {
        await renderer.playHeroAttackAnimation(player.hero, target, isHeroTarget, 'PLAYER2', 'PLAYER1');
      }
      
      // 执行攻击
      const beforeHealth = isHeroTarget ? target.health : target.currentHealth;
      this.battleSystem.heroAttack('PLAYER2', 'PLAYER1', isHeroTarget ? 'hero' : targetIndex);
      
      // 显示伤害数字和特效（对称设计）
      if (renderer) {
        const afterHealth = isHeroTarget ? target.health : target.currentHealth;
        const damage = Math.max(0, beforeHealth - afterHealth);
        if (damage > 0) {
          // 显示伤害特效
          if (renderer.showHeroDamageEffect) {
            renderer.showHeroDamageEffect(opponent, damage);
          }
          // 显示伤害数字
          if (renderer.showAIDamageNumber) {
            renderer.showAIDamageNumber(isHeroTarget ? opponent.hero : target, damage, isHeroTarget);
          }
          // 屏幕抖动
          if (renderer.shakeScreen) {
            renderer.shakeScreen();
          }
        }
      }
      
      // 重新渲染
      if (renderer) {
        renderer.render();
      }
      
      // 等待动画完成
      await this.delay(400);
    }
  }
  
  // 使用英雄技能
  async useHeroSkill(player, renderer) {
    const hero = player.hero;
    const skill = hero.skill;
    
    // 检查是否是被动技能（不能主动使用）
    if (skill.type === 'PASSIVE') {
      return; // 被动技能无法使用
    }
    
    // 检查是否可以使用技能
    if (skill.usedThisTurn) {
      return; // 本回合已使用
    }
    
    if (player.mana.current < skill.cost) {
      return; // 法力不足
    }
    
    // 检查是否是实体分身技能（觉醒后的技能）
    if (hero.awakened && skill.effect && skill.effect.type === 'SUMMON_CLONES') {
      // 使用实体分身技能
      player.mana.current -= skill.cost;
      skill.usedThisTurn = true;
      
      const success = this.battleSystem.useCloneSkill(player.id);
      if (success) {
        this.gameState.log(`${hero.name} 使用技能：召唤了实体分身！`);
      }
      
      // 重新渲染
      if (renderer) {
        renderer.render();
      }
      
      await this.delay(400);
      return;
    }
    
    // 默认技能：增加2点护甲（只增加护甲，不增加生命值）
    // AI决策：如果英雄血量低于15或对手有强力单位，使用技能增加护甲
    const opponent = this.gameState.players['PLAYER1'];
    const hasStrongEnemy = opponent.battlefield.some(u => u.attack >= 4);
    const lowHealth = hero.health <= 15;
    
    if (lowHealth || hasStrongEnemy) {
      // 使用技能
      player.mana.current -= skill.cost;
      skill.usedThisTurn = true;
      
      hero.maxHealth += 2;
      // 不增加当前生命值，护甲和生命值独立计算
      this.gameState.log(`${hero.name} 使用技能：获得2点护甲`);
      
      // 显示特效（对称设计，和玩家一样）
      if (renderer) {
        // 显示治疗特效（和玩家使用技能时一样）
        if (renderer.showHeroHealEffect) {
          renderer.showHeroHealEffect(player, 2);
        }
      }
      
      // 重新渲染以更新UI状态（包括技能按钮状态）
      if (renderer) {
        renderer.render();
      }
      
      await this.delay(400);
    }
  }
  
  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
