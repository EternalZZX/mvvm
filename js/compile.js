class Compile {
    constructor (el, vm) {
        this.$vm = vm;
        this.$el = Compile.isElementNode(el) ? el : document.querySelector(el);
        if (this.$el) {
            this.$fragment = this.node2Fragment(this.$el);
            this.compileElement(this.$fragment);
            this.$el.appendChild(this.$fragment);
        }
    }

    node2Fragment (el) {
        let fragment = document.createDocumentFragment(),
            child;
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    }

    compileElement (el) {
        for (const node of [].slice.call(el.childNodes)) {
            if (Compile.isElementNode(node)) {
                this.compile(node);
            } else if (Compile.isTextNode(node) && /\{\{(.*)\}\}/.test(node.textContent)) {
                this.compileText(node, RegExp.$1);
            }
            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node);
            }
        }
    }

    compile (node) {
        var nodeAttrs = node.attributes,
            me = this;

        [].slice.call(nodeAttrs).forEach(function(attr) {
            var attrName = attr.name;
            if (Compile.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2);
                // 事件指令
                if (Compile.isEventDirective(dir)) {
                    CompileUtil.eventHandler(node, me.$vm, exp, dir);
                    // 普通指令
                } else {
                    CompileUtil[dir] && CompileUtil[dir](node, me.$vm, exp);
                }

                node.removeAttribute(attrName);
            }
        });
    }

    compileText (node, exp) {
        CompileUtil.text(node, this.$vm, exp);
    }

    static isDirective (attr) {
        return attr.indexOf('v-') == 0;
    }

    static isEventDirective (dir) {
        return dir.indexOf('on') === 0;
    }

    static isElementNode (node) {
        return node.nodeType == 1;
    }

    static isTextNode (node) {
        return node.nodeType == 3;
    }
};

// 指令处理集合
class CompileUtil {
    static text (node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    }

    static html (node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    }

    static model (node, vm, exp) {
        this.bind(node, vm, exp, 'model');

        var me = this,
            val = this._getVMVal(vm, exp);
        node.addEventListener('input', function(e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }

            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    }

    static class (node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    }

    static bind (node, vm, exp, dir) {
        var updaterFn = Updater[dir + 'Updater'];

        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        new Watcher(vm, exp, function(value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    }

    // 事件处理
    static eventHandler (node, vm, exp, dir) {
        var eventType = dir.split(':')[1],
            fn = vm.$options.methods && vm.$options.methods[exp];

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    }

    static _getVMVal (vm, exp) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function(k) {
            val = val[k];
        });
        return val;
    }

    static _setVMVal (vm, exp, value) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function(k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};

class Updater {
    static textUpdater (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    }

    static htmlUpdater (node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    }

    static classUpdater (node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    }

    static modelUpdater (node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};
