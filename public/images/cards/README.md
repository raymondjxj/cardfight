# 卡牌插画

将生成的图片命名为 `{卡牌ID}.png`（例如 `C001.png`、`W001.png`）并放在此目录下，游戏内会优先显示插画，无图时显示图标。

批量出图提示词见项目根目录下 `scripts/card-art-prompts.json`，每项包含 `id`、`name`、`prompt`，可用脚本或 DALL·E/Midjourney/SD 等按 prompt 批量生成后重命名为 id.png 放入此目录。
