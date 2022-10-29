import {PathVariable, RouteSegment} from "../route-segment";


export class SimpleRouteSegment implements RouteSegment {

    readonly pattern: string;

    constructor(readonly value: string, readonly parts: (string | PathVariable)[]) {
        this.pattern = parts.map(it => {
            if (typeof it === 'string') return it;
            return `(${it.pattern})`;
        }).join();
    }

    match(segment: string): Map<string, string | string[]> {
        const matchResult = segment.match(this.pattern);
        if (!matchResult || matchResult[0].length !== matchResult.input.length) return;
        const result = new Map<string, string | string[]>();
        this.parts.forEach((val, index) => {
            if (typeof val === 'string') {
                return;
            }
            result.set(val.name, decodeURIComponent(matchResult[index + 1]));
        });
        return result;
    }
}
