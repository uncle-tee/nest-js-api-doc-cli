export interface RouteSegment {
    value: string,
    pattern: string,
    parts: (string | PathVariable)[]

    match(segment: string): Map<string, string | string[]>
}

export interface PathVariable {
    name: string,
    pattern: string
}
