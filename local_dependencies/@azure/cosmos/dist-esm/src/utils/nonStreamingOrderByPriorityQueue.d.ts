export declare class NonStreamingOrderByPriorityQueue<T> {
    private pq;
    private compareFn;
    private pqMaxSize;
    constructor(compareFn: (a: T, b: T) => number, pqMaxSize?: number);
    enqueue(item: T): void;
    dequeue(): T;
    size(): number;
    isEmpty(): boolean;
    peek(): T;
    getTopElements(): T[];
    reverse(): NonStreamingOrderByPriorityQueue<T>;
}
//# sourceMappingURL=nonStreamingOrderByPriorityQueue.d.ts.map