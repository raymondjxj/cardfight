# 调试指南

## 如何打开浏览器控制台

### Chrome/Edge 浏览器
1. 按 `F12` 键，或
2. 按 `Ctrl+Shift+I` (Windows) 或 `Cmd+Option+I` (Mac)，或
3. 右键点击页面 → 选择"检查"或"检查元素"

### Firefox 浏览器
1. 按 `F12` 键，或
2. 按 `Ctrl+Shift+K` (Windows) 或 `Cmd+Option+K` (Mac)

### Safari 浏览器
1. 首先需要启用开发者工具：
   - Safari → 偏好设置 → 高级 → 勾选"在菜单栏中显示开发菜单"
2. 然后按 `Cmd+Option+C` 打开控制台

## 查看攻击日志

打开控制台后，你会看到以下标签页：
- **Console（控制台）** - 这里会显示所有的日志信息

### 攻击流程的日志标识

当你点击单位进行攻击时，控制台会显示：

1. **选择攻击者时**：
   ```
   单位点击: { playerId: "PLAYER1", unitId: "...", ... }
   选择攻击者
   selectAttacker 被调用: { playerId: "PLAYER1", unitId: "..." }
   已选择攻击单位: { ... }
   ```

2. **点击敌方单位时**：
   ```
   单位点击: { playerId: "PLAYER2", unitId: "...", ... }
   选择攻击目标
   === selectTarget 被调用 ===
   执行攻击: { playerId: "PLAYER1", unitIndex: 0, ... }
   ```

3. **执行攻击时**：
   ```
   unitAttack 被调用: { playerId: "PLAYER1", ... }
   === 准备执行攻击 ===
   === resolveAttack 开始 ===
   === 单位攻击 ===
   攻击前: { name: "...", health: 2 }
   攻击后: { name: "...", health: 0, killed: true }
   最终血量: 0
   ```

### 如果攻击失败

如果看到以下信息，说明攻击被阻止了：
- `攻击者已疲惫，无法攻击`
- `需要等待一回合才能攻击`
- `目标选择不合法（可能有嘲讽单位）`
- `攻击目标无效`

### 检查血量变化

在控制台中，你可以直接输入以下命令来检查游戏状态：

```javascript
// 查看玩家1的所有单位
game.gameState.players.PLAYER1.battlefield.forEach(u => {
  console.log(u.card.name, '血量:', u.currentHealth);
});

// 查看玩家2的所有单位
game.gameState.players.PLAYER2.battlefield.forEach(u => {
  console.log(u.card.name, '血量:', u.currentHealth);
});

// 查看玩家2的英雄血量
console.log('对手英雄血量:', game.gameState.players.PLAYER2.hero.health);
```

## 常见问题

### 如果控制台没有任何输出
- 确保控制台已打开
- 确保没有过滤掉日志（检查控制台的过滤设置）
- 刷新页面重新开始

### 如果看到错误信息
- 红色文字表示错误
- 黄色文字表示警告
- 点击错误信息可以查看详细的堆栈跟踪
