/**
 * 类型安全的 EventEmitter 实现
 * 
 * 提供类型安全的事件发射器，确保事件名称和参数类型的一致性
 */

import { EventEmitter } from 'events';

/**
 * 类型安全的 EventEmitter 接口
 * 
 * @template T - 事件映射类型，键为事件名，值为参数数组类型
 */
export class TypedEventEmitter<T extends Record<keyof T, any[]>> {
    private emitter = new EventEmitter();

    /**
     * 绑定事件监听器
     * 
     * @param event - 事件名称
     * @param listener - 事件监听器函数
     * @returns this 实例，支持链式调用
     */
    bind<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this {
        this.emitter.on(event as string, listener);
        return this;
    }

    /**
     * 解绑事件监听器
     * 
     * @param event - 事件名称
     * @param listener - 要解绑的监听器函数
     * @returns this 实例，支持链式调用
     */
    unbind<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this {
        this.emitter.off(event as string, listener);
        return this;
    }

    /**
     * 广播事件
     * 
     * @param event - 事件名称
     * @param args - 事件参数
     * @returns 是否有监听器处理了该事件
     */
    broadcast<K extends keyof T>(event: K, ...args: T[K]): boolean {
        return this.emitter.emit(event as string, ...args);
    }

    /**
     * 绑定一次性事件监听器
     * 
     * @param event - 事件名称
     * @param listener - 事件监听器函数
     * @returns this 实例，支持链式调用
     */
    bindOnce<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this {
        this.emitter.once(event as string, listener);
        return this;
    }

    /**
     * 移除所有监听器
     * 
     * @param event - 可选的事件名称，如果提供则只移除该事件的监听器
     * @returns this 实例，支持链式调用
     */
    removeAll<K extends keyof T>(event?: K): this {
        this.emitter.removeAllListeners(event as string);
        return this;
    }

    /**
     * 获取监听器数量
     * 
     * @param event - 事件名称
     * @returns 监听器数量
     */
    listenerCount<K extends keyof T>(event: K): number {
        return this.emitter.listenerCount(event as string);
    }

    /**
     * 获取所有事件名称
     * 
     * @returns 事件名称数组
     */
    eventNames(): (keyof T)[] {
        return this.emitter.eventNames() as (keyof T)[];
    }
}