import { TraversedSchema, RuntimeSchema, IncludeStructure } from './types';
import traverse, { NodePath } from '@babel/traverse';
import * as babelParser from '@babel/parser';
import * as t from '@babel/types';

const resolvedTypes: { [name: string]: t.TSTypeLiteral } = {};

export function resolveTypeReference(typeName: t.Identifier, parentKeys: string[] = [], iteration: number = 0): TraversedSchema<RuntimeSchema> {
	const typeLiteral = resolvedTypes[typeName.name];
	if (typeLiteral) return buildSchemaFromType(typeLiteral, parentKeys, iteration);
	else return {};
}

export function getTypeLiteralMemberNames(typeNode: t.TSTypeLiteral): string[] {
	const memberNames: string[] = [];

	for (const member of typeNode.members || []) {
		if (t.isTSPropertySignature(member) && t.isIdentifier(member.key)) {
			memberNames.push(member.key.name);
		}
	}

	return memberNames;
}

export function buildSchemaFromType(typeNode: t.TSTypeLiteral, parentKeys: string[] = [], iteration: number): TraversedSchema<RuntimeSchema> {
	const schema: TraversedSchema<RuntimeSchema> = {};

	const isIncludeObject = getTypeLiteralMemberNames(typeNode).includes('include');
	if (iteration > 1 && !isIncludeObject && iteration % 2 !== 1) return schema;

	for (const member of typeNode.members || []) {
		if (t.isTSPropertySignature(member) && t.isIdentifier(member.key) && member.typeAnnotation) {
			const key = member.key.name;
			const lowerKey = key.toLowerCase();
			const valueType: t.TSType = member.typeAnnotation.typeAnnotation;

			if (lowerKey === 'include') {
				const newParentKeys = parentKeys;

				if (t.isTSTypeLiteral(valueType)) {
					schema[key] = buildSchemaFromType(valueType, newParentKeys, iteration + 1);
				} else if (t.isTSUnionType(valueType)) {
					const nonNullTypes = valueType.types.filter((k) => !t.isTSBooleanKeyword(k) && !t.isTSNullKeyword(k));

					if (nonNullTypes.length === 1 && t.isTSTypeLiteral(nonNullTypes[0])) {
						schema[key] = buildSchemaFromType(nonNullTypes[0] as t.TSTypeLiteral, newParentKeys, iteration + 1);
					} else if (nonNullTypes.length === 1 && t.isTSTypeReference(nonNullTypes[0])) {
						const typeRef = nonNullTypes[0] as t.TSTypeReference;
						if (t.isIdentifier(typeRef.typeName)) {
							schema[key] = resolveTypeReference(typeRef.typeName, newParentKeys, iteration + 1);
						} else if (t.isTSQualifiedName(typeRef.typeName) && t.isIdentifier(typeRef.typeName.left)) {
							schema[key] = resolveTypeReference(typeRef.typeName.right, newParentKeys, iteration + 1);
						}
					}
				} else if (t.isTSTypeReference(valueType)) {
					if (t.isIdentifier(valueType.typeName)) {
						schema[key] = resolveTypeReference(valueType.typeName, newParentKeys, iteration + 1);
					} else if (t.isTSQualifiedName(valueType.typeName) && t.isIdentifier(valueType.typeName.left)) {
						schema[key] = resolveTypeReference(valueType.typeName.right, newParentKeys, iteration + 1);
					} else if (t.isTSQualifiedName(valueType.typeName) && t.isTSQualifiedName(valueType.typeName.left)) {
						schema[key] = resolveTypeReference(valueType.typeName.right, newParentKeys, iteration + 1);
					} else if (t.isTSQualifiedName(valueType.typeName) && t.isTSQualifiedName(valueType.typeName.right)) {
						schema[key] = resolveTypeReference(valueType.typeName.right, newParentKeys, iteration + 1);
					}
				} else if (t.isTSArrayType(valueType)) {
					if (t.isTSTypeLiteral(valueType.elementType)) {
						schema[key] = buildSchemaFromType(valueType.elementType, newParentKeys, iteration + 1);
					}
				}

				break;
			}

			if (parentKeys.includes(lowerKey)) continue;

			const newParentKeys = [...parentKeys, lowerKey];

			if (t.isTSTypeLiteral(valueType)) {
				schema[key] = buildSchemaFromType(valueType, newParentKeys, iteration + 1);
			} else if (t.isTSUnionType(valueType)) {
				const nonNullTypes = valueType.types.filter((k) => !t.isTSBooleanKeyword(k) && !t.isTSNullKeyword(k));

				if (nonNullTypes.length === 1 && t.isTSTypeLiteral(nonNullTypes[0])) {
					schema[key] = buildSchemaFromType(nonNullTypes[0] as t.TSTypeLiteral, newParentKeys, iteration + 1);
				} else if (nonNullTypes.length === 1 && t.isTSTypeReference(nonNullTypes[0])) {
					const typeRef = nonNullTypes[0] as t.TSTypeReference;
					if (t.isIdentifier(typeRef.typeName)) {
						schema[key] = resolveTypeReference(typeRef.typeName, newParentKeys, iteration + 1);
					} else if (t.isTSQualifiedName(typeRef.typeName) && t.isIdentifier(typeRef.typeName.left)) {
						schema[key] = resolveTypeReference(typeRef.typeName.right, newParentKeys, iteration + 1);
					}
				}
			} else if (t.isTSTypeReference(valueType)) {
				if (t.isIdentifier(valueType.typeName)) {
					schema[key] = resolveTypeReference(valueType.typeName, newParentKeys, iteration + 1);
				} else if (t.isTSQualifiedName(valueType.typeName) && t.isIdentifier(valueType.typeName.left)) {
					schema[key] = resolveTypeReference(valueType.typeName.right, newParentKeys, iteration + 1);
				} else if (t.isTSQualifiedName(valueType.typeName) && t.isTSQualifiedName(valueType.typeName.left)) {
					schema[key] = resolveTypeReference(valueType.typeName.right, newParentKeys, iteration + 1);
				} else if (t.isTSQualifiedName(valueType.typeName) && t.isTSQualifiedName(valueType.typeName.right)) {
					schema[key] = resolveTypeReference(valueType.typeName.right, newParentKeys, iteration + 1);
				}
			} else if (t.isTSArrayType(valueType)) {
				if (t.isTSTypeLiteral(valueType.elementType)) {
					schema[key] = buildSchemaFromType(valueType.elementType, newParentKeys, iteration + 1);
				}
			}
		}
	}

	return schema;
}

export function filterSchema(schema: RuntimeSchema): IncludeStructure {
	const result: IncludeStructure = {};

	for (const key in schema) {
		const value = schema[key];

		if (value && typeof value === 'object') {
			const keys = Object.keys(value);

			if (keys.includes('include') && value.include) {
				const includedSchema = filterSchema(value.include);
				if (Object.keys(includedSchema).length) {
					result[key] = { include: includedSchema };
				} else {
					result[key] = true;
				}
			} else {
				result[key] = true;
			}
		} else {
			result[key] = true;
		}
	}

	return result;
}

export function generateIncludes(fileContent: string): TraversedSchema<IncludeStructure> {
	const ast = babelParser.parse(fileContent, {
		sourceType: 'module',
		plugins: ['typescript'],
		errorRecovery: true,
	});

	traverse(ast, {
		TSModuleDeclaration(path) {
			if (t.isIdentifier(path.node.id, { name: 'TSPrisma' }) || t.isIdentifier(path.node.id, { name: 'Prisma' })) {
				path.traverse({
					TSTypeAliasDeclaration(aliasPath: NodePath<t.TSTypeAliasDeclaration>) {
						const aliasName = aliasPath.node.id.name;
						if (aliasName in resolvedTypes) return;

						const typeLiteral = aliasPath.node.typeAnnotation as t.TSTypeLiteral;
						resolvedTypes[aliasName] = typeLiteral;
					},
				});
			}
		},
	});

	const runtimeSchema = resolveTypeReference(t.identifier('TSPrismaModels'));
	if (!runtimeSchema) throw new Error('Failed to generate runtime schema!');

	const filterStructure: TraversedSchema<IncludeStructure> = {};

	for (const [key, value] of Object.entries(runtimeSchema)) {
		filterStructure[key] = filterSchema(value) as TraversedSchema<IncludeStructure>;
	}

	return filterStructure;
}
