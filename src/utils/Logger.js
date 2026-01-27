// src/utils/Logger.js
export class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
  }
  
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message
    };
    
    this.logs.push(logEntry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // 控制台输出
    const consoleMethod = level === 'error' ? console.error : 
                         level === 'warn' ? console.warn : 
                         console.log;
    consoleMethod(`[${level.toUpperCase()}] ${message}`);
  }
  
  error(message) {
    this.log(message, 'error');
  }
  
  warn(message) {
    this.log(message, 'warn');
  }
  
  info(message) {
    this.log(message, 'info');
  }
  
  getLogs(count = 10) {
    return this.logs.slice(-count);
  }
  
  clear() {
    this.logs = [];
  }
}
