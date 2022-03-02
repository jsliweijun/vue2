import { nextTick } from '../utils';

let queue = [];
let has = {}; //  做列表的， 列表为何存放了哪些 watcher

function flushSchedulerQueue() {
    for (let i = 0; i < queue.length; i++) {
        queue[i].run();
    }
    queue = [];
    has = {};
    pending = false;
}

let pending = false;

// 这里开启异步操作，要等待同步代码执行完才进行执行异步逻辑 update ，虚拟变真实dom
export function queueWatcher(watcher) {
    const id = watcher.id;
    if (has[id] == null) {
        queue.push(watcher);
        has[id] = true;

        // 开启一次更新操作， 批处理（防抖）
        if (!pending) {
            // 当前执行栈中代码执行完毕后，会先清空微任务，再清空宏任务，希望尽早更新页面，就不要用setTimeout ，它是宏任务 。 vue 中自己 封装了一个 nextTick
            // 异步操作
            // setTimeout(flushSchedulerQueue, 0);
            nextTick(flushSchedulerQueue, 0);

            pending = true;
        }
    }
}
