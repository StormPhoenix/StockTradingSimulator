/**
 * Worker 线程执行器
 * 
 * 设置 Worker 线程环境，接收消息并派发到具体的处理逻辑
 */

import { parentPort } from 'worker_threads';
import {
  WorkerMessage,
  TemplateRequestMessage
} from '../types/workerMessages';
import { handleMarketTemplateRequest } from './marketTemplateInstantiation';

/**
 * 派发请求到具体的处理器
 */
async function dispatchRequest(message: WorkerMessage): Promise<void> {
  try {
    switch (message.type) {
      case 'TEMPLATE_REQUEST':
        // 派发到市场模板处理器
        await handleMarketTemplateRequest(message as TemplateRequestMessage);
        break;
      
      // 未来可以添加其他类型的请求处理
      // case 'OTHER_REQUEST_TYPE':
      //   await handleOtherRequest(message);
      //   break;
      
      default:
        console.warn(`Unknown message type: ${message.type}`);
        break;
    }
  } catch (error) {
    console.error('Error dispatching request:', error);
    
    // 注意：错误处理现在由具体的处理器负责
    // 这里只记录调度层面的错误
  }
}

/**
 * Worker Thread 主入口
 */
if (parentPort) {
  // 监听来自主线程的消息
  parentPort.on('message', async (message: WorkerMessage) => {
    console.log(`Worker received message: ${message.type}`);
    await dispatchRequest(message);
  });

  // 发送 Worker 就绪信号
  parentPort.postMessage({
    type: 'READY',
    timestamp: new Date()
  });
  
  console.log('Worker thread initialized and ready');
} else {
  console.error('Worker thread: parentPort is not available');
  process.exit(1);
}