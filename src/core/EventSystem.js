// src/core/EventSystem.js
export class EventSystem {
  constructor() {
    this.listeners = new Map();
  }
  
  // 注册事件监听器
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }
  
  // 移除事件监听器
  off(eventType, callback) {
    if (!this.listeners.has(eventType)) return;
    const callbacks = this.listeners.get(eventType);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
  
  // 触发事件
  emit(eventType, data) {
    if (!this.listeners.has(eventType)) return;
    const callbacks = this.listeners.get(eventType);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`事件 ${eventType} 的监听器执行出错:`, error);
      }
    });
  }
  
  // 清除所有监听器
  clear() {
    this.listeners.clear();
  }
}
