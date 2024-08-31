export declare class NonStreamingOrderByMap<T> {
    private map;
    private compareFn;
    constructor(compareFn: (a: T, b: T) => number);
    set(key: string, value: T): void;
    get(key: string): T | undefined;
    getAllValues(): T[];
    private replaceResults;
    size(): number;
}
//# sourceMappingURL=nonStreamingOrderByMap.d.ts.map