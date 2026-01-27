// src/utils/Random.js
export class Random {
  // 生成随机整数 [min, max]
  static int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // 生成随机浮点数 [min, max)
  static float(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  // 从数组中随机选择一个元素
  static choice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  // 从数组中随机选择多个元素（不重复）
  static sample(array, count) {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  
  // 打乱数组
  static shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  // 随机布尔值
  static bool(probability = 0.5) {
    return Math.random() < probability;
  }
}
