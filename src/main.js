// src/main.js
import { GameState } from './core/GameState.js';
import { BattleSystem } from './core/BattleSystem.js';
import { Renderer } from './ui/Renderer.js';
import { InputHandler } from './ui/InputHandler.js';
import { AIController } from './core/AIController.js';

class Game {
  constructor() {
    this.gameState = new GameState();
    this.battleSystem = new BattleSystem(this.gameState);
    this.gameState.battleSystem = this.battleSystem; // 设置battleSystem引用
    this.renderer = new Renderer(this.gameState);
    this.inputHandler = null;
    this.aiController = new AIController(this.gameState, this.battleSystem);
    
    // 设置AI回合完成回调
    this.gameState.aiController = this.aiController;
    this.gameState.renderer = this.renderer;
    this.gameState.onAITurnComplete = () => {
      this.renderer.render();
    };
    
    this.init();
  }
  
  async init() {
    try {
      // 加载卡牌数据
      await this.loadCardData();
      
      // 加载英雄数据
      await this.loadHeroData();
      
      // 初始化游戏
      this.gameState.initGame();
      
      // 初始化输入处理器
      console.log('🔧 初始化输入处理器...');
      this.inputHandler = new InputHandler(this.gameState, this.battleSystem, this.renderer);
      
      // 初始渲染
      console.log('🎨 初始渲染...');
      this.renderer.render();
      
      console.log('✅ 游戏初始化完成！');
      console.log('💡 提示：');
      console.log('   1. 点击己方可攻击的单位（有蓝色边框的）');
      console.log('   2. 然后点击敌方单位或英雄进行攻击');
      console.log('   3. 在控制台输入 debugAttack() 可以测试攻击功能');
    } catch (error) {
      console.error('游戏初始化失败:', error);
      alert('游戏初始化失败，请刷新页面重试');
    }
  }
  
  resetGame() {
    // 移除游戏结束遮罩
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay) overlay.remove();
    // 清除英雄失败样式
    document.querySelectorAll('.hero-name-defeated').forEach(el => el.classList.remove('hero-name-defeated'));
    // 重置游戏状态并重新初始化
    this.renderer.gameOverShown = false;
    this.gameState.resetGame();
    this.renderer.render();
  }

  async loadCardData() {
    try {
      const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : '/';
      const url = `${baseUrl}data/cards.json`;
      const resolvedUrl = new URL(url, window.location.href).toString();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:61',message:'loadCardData start',data:{url,resolvedUrl,baseUrl,href:window.location.href,pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const response = await fetch(url);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:63',message:'loadCardData response',data:{url,resolvedUrl,responseOk:response.ok,status:response.status,contentType:response.headers.get('content-type'),responseUrl:response.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const data = await response.json();
      this.gameState.allCards = data.cards || data;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:65',message:'loadCardData parsed',data:{count:this.gameState.allCards?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.log(`加载了 ${this.gameState.allCards.length} 张卡牌`);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:68',message:'loadCardData error',data:{message:error?.message,name:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('加载卡牌数据失败:', error);
      // 使用空数组，游戏会报错但不会崩溃
      this.gameState.allCards = [];
    }
  }
  
  async loadHeroData() {
    try {
      const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : '/';
      const url = `${baseUrl}data/heroes.json`;
      const resolvedUrl = new URL(url, window.location.href).toString();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:80',message:'loadHeroData start',data:{url,resolvedUrl,baseUrl,href:window.location.href,pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const response = await fetch(url);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:81',message:'loadHeroData response',data:{url,resolvedUrl,responseOk:response.ok,status:response.status,contentType:response.headers.get('content-type'),responseUrl:response.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const data = await response.json();
      this.gameState.allHeroes = data.heroes || data;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:82',message:'loadHeroData parsed',data:{count:this.gameState.allHeroes?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.log(`加载了 ${this.gameState.allHeroes.length} 个英雄`);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a2c855f5-4fc1-4260-9084-a5922c1862a1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:85',message:'loadHeroData error',data:{message:error?.message,name:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('加载英雄数据失败:', error);
      // 使用默认英雄数据（与 heroes.json 一致，双方均有全反击）
      this.gameState.allHeroes = [{
        id: 'H001',
        name: '铁壁统帅·岳峙',
        health: 30,
        passive: { type: 'FULL_COUNTER', description: '敌方回合，受到的所有伤害翻倍并反弹给攻击者' },
        skill: {
          name: '铁壁',
          cost: 2,
          description: '消耗2点法力，增加英雄自身2点护甲值',
          effect: {}
        }
      }];
    }
  }
}

// 立即输出测试信息
console.log('🚀 脚本开始加载...');

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM加载完成，开始初始化游戏...');
  
  try {
    window.game = new Game();
    window.resetGame = () => window.game.resetGame();
    console.log('✅ 游戏对象创建成功');
    
    // 添加调试辅助函数
    window.debugAttack = function() {
      console.log('=== 调试攻击流程 ===');
      if (!window.game) {
        console.error('❌ 游戏对象不存在！');
        return;
      }
      
      const p1 = window.game.gameState.players.PLAYER1;
      const p2 = window.game.gameState.players.PLAYER2;
      
      if (!p1 || !p2) {
        console.error('❌ 玩家对象不存在！');
        return;
      }
      
      console.log('玩家1单位:', p1.battlefield.map((u, i) => ({
        index: i,
        name: u.card.name,
        attack: u.attack,
        health: u.currentHealth,
        exhausted: u.exhausted,
        onBoardTurns: u.onBoardTurns
      })));
      
      console.log('玩家2单位:', p2.battlefield.map((u, i) => ({
        index: i,
        name: u.card.name,
        health: u.currentHealth,
        maxHealth: u.maxHealth
      })));
      
      console.log('玩家2英雄:', {
        name: p2.hero.name,
        health: p2.hero.health
      });
      
      // 如果有可攻击的单位，尝试攻击
      if (p1.battlefield.length > 0 && p2.battlefield.length > 0) {
        const attacker = p1.battlefield[0];
        const target = p2.battlefield[0];
        if (!attacker.exhausted && attacker.onBoardTurns > 0) {
          console.log('尝试自动攻击:', attacker.card.name, '->', target.card.name);
          const result = window.game.battleSystem.unitAttack('PLAYER1', 0, 'PLAYER2', 0);
          console.log('攻击结果:', result);
          window.game.renderer.render();
        } else {
          console.warn('⚠️ 攻击者无法攻击:', {
            exhausted: attacker.exhausted,
            onBoardTurns: attacker.onBoardTurns
          });
        }
      } else {
        console.warn('⚠️ 没有足够的单位进行攻击');
      }
    };
    
    // 添加测试点击事件的函数
    window.testClick = function() {
      console.log('🧪 测试点击事件...');
      const units = document.querySelectorAll('.unit');
      console.log('找到单位数量:', units.length);
      units.forEach((unit, index) => {
        console.log(`单位 ${index}:`, {
          player: unit.dataset.player,
          unitId: unit.dataset.unitId,
          className: unit.className
        });
      });
      
      // 模拟点击第一个单位
      if (units.length > 0) {
        console.log('模拟点击第一个单位...');
        units[0].click();
      }
    };
    
    console.log('💡 提示：');
    console.log('   - 在控制台输入 debugAttack() 可以测试攻击功能');
    console.log('   - 在控制台输入 testClick() 可以测试点击事件');
    console.log('   - 点击页面任意位置应该会看到 🖱️ 点击事件 的日志');
  } catch (error) {
    console.error('❌ 游戏初始化出错:', error);
    console.error('错误堆栈:', error.stack);
    alert('游戏初始化失败：' + error.message);
  }
});

// 如果DOM已经加载完成
if (document.readyState === 'loading') {
  console.log('⏳ 等待DOM加载...');
} else {
  console.log('✅ DOM已经加载完成');
}
