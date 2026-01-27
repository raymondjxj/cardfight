# 游戏部署指南

## 方案一：最简单 - 构建后直接分享（推荐给朋友本地玩）

### 步骤：

1. **构建项目**
   ```bash
   npm run build
   ```
   这会生成一个 `dist` 文件夹，包含所有可运行的文件。

2. **分享给朋友**
   - 将整个 `dist` 文件夹压缩成 zip 文件
   - 通过微信/QQ/邮件等方式发送给朋友

3. **朋友如何运行**
   - 解压 zip 文件
   - 方法A（推荐）：使用 Python 启动简单服务器
     ```bash
     # 进入 dist 文件夹
     cd dist
     # Python 3
     python3 -m http.server 8000
     # 或 Python 2
     python -m SimpleHTTPServer 8000
     ```
     然后在浏览器打开：`http://localhost:8000`
   
   - 方法B：使用 Node.js 的 http-server
     ```bash
     # 先安装 http-server（如果还没有）
     npm install -g http-server
     # 进入 dist 文件夹
     cd dist
     # 启动服务器
     http-server -p 8000
     ```
     然后在浏览器打开：`http://localhost:8000`
   
   - 方法C：直接双击 `index.html`（可能因为 CORS 限制无法加载资源，不推荐）

---

## 方案二：GitHub Pages（免费在线部署）

### 前提条件：
- 有 GitHub 账号
- 项目已推送到 GitHub 仓库

### 步骤：

1. **安装 gh-pages 包（可选，但推荐）**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **修改 package.json，添加部署脚本**
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview",
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **配置 vite.config.js**（如果还没有）
   创建 `vite.config.js` 文件：
   ```javascript
   export default {
     base: '/xuanyuan-pvp-mvp/', // 改为你的仓库名
   }
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

5. **启用 GitHub Pages**
   - 进入 GitHub 仓库设置
   - 找到 "Pages" 选项
   - Source 选择 "gh-pages" 分支
   - 保存后，几分钟后就可以通过 `https://你的用户名.github.io/xuanyuan-pvp-mvp/` 访问

---

## 方案三：Netlify（最简单，自动部署）

### 步骤：

1. **访问 [Netlify](https://www.netlify.com/)**
   - 使用 GitHub 账号登录

2. **连接仓库**
   - 点击 "New site from Git"
   - 选择你的 GitHub 仓库

3. **配置构建设置**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **部署**
   - 点击 "Deploy site"
   - 几分钟后就会获得一个免费的网址，例如：`https://your-game-name.netlify.app`

5. **自动更新**
   - 以后每次推送到 GitHub，Netlify 会自动重新部署

---

## 方案四：Vercel（类似 Netlify）

### 步骤：

1. **访问 [Vercel](https://vercel.com/)**
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "New Project"
   - 选择你的 GitHub 仓库

3. **配置**
   - Framework Preset: 选择 "Vite"
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **部署**
   - 点击 "Deploy"
   - 几分钟后就会获得一个免费的网址

---

## 方案五：使用本地网络分享（同一局域网）

如果你和朋友在同一个 WiFi 网络下：

1. **构建项目**
   ```bash
   npm run build
   ```

2. **启动开发服务器（监听所有网络接口）**
   ```bash
   npm run preview -- --host
   ```
   或者使用 Python：
   ```bash
   cd dist
   python3 -m http.server 8000 --bind 0.0.0.0
   ```

3. **获取你的 IP 地址**
   - Mac/Linux: `ifconfig` 或 `ip addr`
   - Windows: `ipconfig`
   - 找到你的局域网 IP（通常是 192.168.x.x 或 10.x.x.x）

4. **朋友访问**
   - 在浏览器打开：`http://你的IP地址:8000`

---

## 推荐方案

- **快速分享给1-2个朋友**：方案一（构建后分享）
- **想让更多人玩，且希望自动更新**：方案三（Netlify）或方案四（Vercel）
- **想用 GitHub 管理**：方案二（GitHub Pages）
- **同一局域网**：方案五（本地网络分享）

---

## 注意事项

1. **构建前确保代码没有错误**
   ```bash
   npm run build
   ```
   如果有错误，先修复再构建。

2. **测试构建结果**
   ```bash
   npm run preview
   ```
   在本地测试构建后的版本是否正常。

3. **如果使用 GitHub Pages，记得设置正确的 base 路径**
   在 `vite.config.js` 中设置 `base: '/你的仓库名/'`

4. **分享前测试**
   在分享给朋友前，最好自己先测试一下构建后的版本是否正常运行。
