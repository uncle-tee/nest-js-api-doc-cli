import {RouteSegment} from "./route-segment";
import {SimpleRouteSegment} from "./impl/simple-route-segment";

const pathVariablePattern = /^(\S+) *:([^:].*)/;
type Part = {
    variable: boolean;
    value: string;
};

export function parseUrl(url: string): RouteSegment[] {
    const segments: string[] = [];
    url?.split('/')
        .forEach(segment => {
            segment = segment.trim();
            if (!segment) {
                return;
            }
            segments.push(segment);
        });
    return segments.map(segment => getPathTemplate(segment));
}

function getPathTemplate(pathSegment: string): RouteSegment {
    const regexMatch = pathSegment.match(/^:([^:].*)/);
    if (!regexMatch) {
        const parts = toParts(pathSegment);
        return new SimpleRouteSegment(pathSegment, parts.map(part => {
            if (!part.variable) {
                return part.value
            }
            return toPathVariable(part.value);
        }));
    }
    const paramName = regexMatch[1];
    return new SimpleRouteSegment(pathSegment, [toPathVariable(paramName)]);
}

export function toParts(segment: string, escape = '\\'): Part[] {
    const parts: Part[] = [];
    let part: Part = { variable: false, value: '' };

    for (let i = 0; i < segment.length; i++) {
        const ch = segment[i];
        if (ch === escape) {
            if (i < segment.length - 1) {
                if (segment[i + 1] === '{' || segment[i + 1] === '}' || segment[i + 1] === escape) {
                    part.value += segment[++i];
                    continue;
                }
            }
            part.value += ch;
            continue;
        }
        if (ch === '{') {
            if (part.value) {
                parts.push(part);
                part = { variable: true, value: '' };
            } else {
                part.variable = true;
            }
        } else if (ch === '}') {
            if (!part.value) {
                throw new Error(`Empty path variable declaration: {${part.value}`);
            }
            parts.push(part);
            part = { variable: false, value: '' };
        } else {
            part.value += segment[i];
        }
    }
    if (part.variable) {
        throw new Error(`Invalid path variable declaration: {${part.value}`);
    }
    if (part.value) {
        parts.push(part);
    }
    return parts;
}

function toPathVariable(value: string) {
    const regexMatch = value.match(pathVariablePattern);
    if (regexMatch) {
        return {
            name: regexMatch[1],
            pattern: regexMatch[2]
        }
    }
    return {
        name: value,
        pattern: '.*'
    }
}