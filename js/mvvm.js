class MVVM {
    constructor (options) {
        this.$options = options || {};
        let data = this._data = this.$options.data;
        for (const key of Object.keys(data)) {
            this._proxyData(key);
        };
        this._initComputed();
        observerFactory(data);

        this.$compile = new Compile(options.el || document.body, this)
    }

    $watch (key, cb, options) {
        new Watcher(this, key, cb);
    }

    _proxyData (key) {
        Object.defineProperty(this, key, {
            configurable: false,
            enumerable: true,
            get () {
                return this._data[key];
            },
            set (newVal) {
                this._data[key] = newVal;
            }
        });
    }

    _initComputed () {
        const computed = this.$options.computed;
        if (typeof computed !== 'object') {
            return;
        }
        for (const key of Object.keys(computed)) {
            Object.defineProperty(this, key, {
                get: typeof computed[key] === 'function' ?
                    computed[key] : computed[key].get,
                set: () => {}
            });
        }
    }
};
