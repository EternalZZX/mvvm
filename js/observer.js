class Observer {
    constructor (data) {
        this.data = data;
        for (const key of Object.keys(data)) {
            this.defineReactive(this.data, key, data[key]);
        }
    }

    defineReactive (data, key, val) {
        observerFactory(val);
        const dep = new Dep();
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get () {
                dep.depend();
                return val;
            },
            set (newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                observerFactory(newVal);
                dep.notify();
            }
        });
    }
};

class Dep {
    constructor () {
        this.id = Dep.uid++;
        this.subs = [];
    }

    addSub (sub) {
        this.subs.push(sub);
    }

    depend () {
        Dep.target && Dep.target.addDep(this);
    }

    removeSub (sub) {
        const index = this.subs.indexOf(sub);
        index !== -1 && this.subs.splice(index, 1);
    }

    notify () {
        for (const sub of this.subs) {
            sub.update();
        };
    }
};

Dep.uid = 0;
Dep.target = null;

const observerFactory = value => {
    if (!value || typeof value !== 'object') {
        return;
    }
    return new Observer(value);
};
