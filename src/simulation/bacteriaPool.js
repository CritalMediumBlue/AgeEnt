export class BacteriaPool {
    constructor(createFn, resetFn, maxSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
        this.available = [];
        this.active = new Set();
    }

    acquire(...args) {
        let obj;
        if (this.available.length > 0) {
            obj = this.available.pop();
            this.resetFn(obj, ...args);
        } else {
            obj = this.createFn(...args);
        }
        this.active.add(obj);
        return obj;
    }

    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            if (this.available.length < this.maxSize) {
                this.available.push(obj);
            }
        }
    }

    clear() {
        this.available.length = 0;
        this.active.clear();
    }
}