# 玄穹九野 MVP - 卡牌对战游戏

## 项目简介

《玄穹九野》是一个本地回合制卡牌对战游戏 MVP（风格类似简化版炉石）。当前版本支持本地热座对战与 AI 对手。

## 在线体验

- https://xuanyuan-pvp-mvp.netlify.app

## 技术栈

- HTML5
- JavaScript (ES6+)
- Vite (开发服务器)

## 项目结构

```
xuanyuan-pvp-mvp/
├── index.html              # 主入口文件
├── public/
│   └── data/                # 部署用静态数据
│       ├── cards.json
│       └── heroes.json
├── src/
│   ├── main.js             # 主入口
│   ├── style.css           # 样式文件
│   ├── core/               # 核心逻辑
│   │   ├── GameState.js    # 游戏状态管理
│   │   ├── BattleSystem.js # 战斗系统
│   │   ├── CardManager.js  # 卡牌管理
│   │   ├── AuraManager.js  # 光环系统
│   │   ├── KeywordResolver.js # 关键词解析
│   │   └── EventSystem.js  # 事件系统
│   ├── models/             # 数据模型
│   │   ├── Card.js         # 卡牌类
│   │   ├── Unit.js         # 单位类
│   │   ├── Player.js       # 玩家类
│   │   └── Hero.js         # 英雄类
│   ├── ui/                 # 界面相关
│   │   ├── Renderer.js     # 渲染器
│   │   ├── InputHandler.js # 输入处理
│   │   └── UIState.js      # UI状态
│   ├── utils/              # 工具类
│   │   ├── Logger.js       # 日志工具
│   │   ├── Random.js       # 随机数工具
│   │   └── Validator.js    # 验证器
│   └── data/               # 静态数据
│       ├── cards.json      # 卡牌数据
│       ├── heroes.json     # 英雄数据
│       └── keywords.json   # 关键词定义
└── package.json            # 项目配置
```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run preview
```

## 游戏玩法

### 基本规则

1. **回合制对战**：双方轮流进行回合，每回合可以：
   - 使用卡牌（单位或法术）
   - 使用单位攻击
   - 使用英雄技能（消耗 2 点法力，获得 2 点护甲）
   - 使用武器攻击
   - 结束回合

2. **法力系统**：每回合开始时，法力上限+1（最高10），并补满法力

3. **战场限制**：每方最多 6 个单位

4. **手牌限制**：最多10张手牌，超出会被烧掉

### 卡牌类型

- **单位卡**：可以放置在战场上，具有攻击力和生命值
- **法术卡**：直伤、AOE、增益等类型（含冰/火/雷/毒特效）
- **武器卡**：装备后提升英雄攻击力与耐久度

### 关键词系统

- **嘲讽 (TAUNT)**：敌人必须优先攻击此单位
- **冲锋 (CHARGE)**：可以在召唤的当回合立即攻击
- **吸血 (LIFESTEAL)**：攻击时，造成伤害的50%治疗你的英雄
- **远程 (RANGED)**：可以攻击任意位置的敌人，无视嘲讽
- **破甲 (PIERCE)**：攻击时无视目标护甲值
- **护盾 (SHIELD)**：抵挡物理伤害
- **法术护盾 (SPELL_SHIELD)**：抵挡法术伤害
- **圣盾 (DIVINE_SHIELD)**：抵挡一次伤害

### 操作说明

1. **使用单位卡**：点击手牌中的单位卡，然后点击战场上的空位放置
2. **使用法术卡**：按提示选择目标或直接施放
3. **单位攻击**：点击己方单位，然后点击敌方单位或英雄进行攻击
4. **结束回合**：点击"结束回合"按钮

## 部署

### Netlify（推荐）
1. 连接 GitHub 仓库
2. Build command：`npm run build`
3. Publish directory：`dist`
4. 之后每次 `git push` 会自动部署

## 更新日志

- 2026-01-27
  - 完成 AI 对手与英雄技能
  - 新增武器系统与法术特效
  - 优化护盾/法术护盾/圣盾逻辑
  - 增加卡牌悬浮信息与战场提示
  - 修复 Netlify 部署数据路径

## 许可证

MIT
