import * as ts from "typescript";
import { ClassMetadata } from "../model/class-metadata";
import { Schema, ObjectSchema, SchemaRef } from "../model/openapi";

export class OpenApiSchemaFactory {
    private typeMap = new Map<string, ClassMetadata>();
    schemaMap: { [key: string]: ObjectSchema } = {};

    addClass(sourceFile: ts.SourceFile, c: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        this.typeMap.set(c.name.text, { declaration: c, sourceFile });
    }

    getClassSchema(declaration: ts.ClassDeclaration | ts.InterfaceDeclaration): SchemaRef {
        let schema = this.schemaMap[declaration.name.text];
        if (!schema) {
            schema = this.createObjectSchema(declaration);
            this.schemaMap[declaration.name.text] = schema;
        }
        return { $ref: `#/components/schemas/${declaration.name.text}` };
    }

    getNodeSchema(node: ts.TypeNode | ts.Node): Schema {
        let type: string;
        switch (node.kind) {
            case ts.SyntaxKind.BooleanKeyword:
                type = 'boolean';
                break;
            case ts.SyntaxKind.NumberKeyword:
            case ts.SyntaxKind.BigIntKeyword:
                type = 'number';
                break;
            case ts.SyntaxKind.StringKeyword:
                type = 'string';
                break;
            case ts.SyntaxKind.TypeReference:
                let id: ts.Identifier;
                node.forEachChild(c => {
                    if (c.kind === ts.SyntaxKind.Identifier) {
                        id = <ts.Identifier>c;
                    }
                });
                const result = this.resolveByIdentifier(id);
                if (result) return result;
                break;
            case ts.SyntaxKind.ArrayType:
                let itemType: Schema;
                node.forEachChild(r => {
                    itemType = this.getNodeSchema(r);
                });
                return {
                    type: 'array',
                    items: itemType
                };
        }
        if (type) return { type };

        console.log('unresolved kind', node.kind);
        node.forEachChild(c => {
            if (c.kind === ts.SyntaxKind.Identifier) {
                console.log((<ts.Identifier>c).text, (<ts.Identifier>c).getSourceFile()?.fileName);
            } else {
                console.log(c.kind);
            }
        });
        console.log('-------------------');
    }

    getAll(): { [key: string]: ObjectSchema } {
        return this.schemaMap;
    }

    getClassMetadata(id: ts.Identifier): ClassMetadata {
        return this.typeMap.get(id.text);
    }

    private createObjectSchema(declaration: ts.ClassDeclaration | ts.InterfaceDeclaration): ObjectSchema {
        const properties: {
            [key: string]: Schema
        } = {};
        declaration.forEachChild(c => {
            if (c.kind !== ts.SyntaxKind.PropertyDeclaration) {
                return;
            }
            const property = <ts.PropertyDeclaration>c;
            properties[property.name.getText()] = this.getNodeSchema(property.type);
        });
        return {
            type: 'object',
            properties
        }
    }

    private resolveByIdentifier(id: ts.Identifier): SchemaRef {
        if (!id) {
            return;
        }

        const classMetadata = this.typeMap.get(id.text);
        if (classMetadata) {
            return this.getClassSchema(classMetadata.declaration);
        }
    }
}
