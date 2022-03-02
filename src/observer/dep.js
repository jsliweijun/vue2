let id = 0;

class Dep {
    constructor() {
        this.id = id++;
        this.subs = [];
    }
    depend() {
        // Dep.target  dep 里面要存放这个 watcher， watcher要存放dep  多对多的关系
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    }
    addSub(watcher) {
        this.subs.push(watcher);
    }
    notify() {
        console.log('notify');
        this.subs.forEach((watcher) => {
            watcher.update();
        });
    }
}

Dep.target = null;

export function pushTarget(watcher) {
    Dep.target = watcher;
}

export function popTarget() {
    Dep.target = null;
}

export default Dep;
