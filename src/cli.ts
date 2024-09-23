import { generatorHandler } from '@prisma/generator-helper';
import { generateIncludes } from './schema';
import { SourceObject } from './types';
import path from 'path';
import fs from 'fs';

export type AllFunctionsType = typeof AllFunctions[number];
export type TypeForModel<T extends string> = `${T}${AllFunctionsType}`;

export const firstLowercase = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);
export const replaceSpace = (str: string) => str.replace(/ {6,}\{/g, ' {');
export const nl = (amount: number = 1) => '\n'.repeat(amount);

const AllFunctions = [
	'Default',
	'FindFirst',
	'FindFirstOrThrow',
	'FindUnique',
	'FindUniqueOrThrow',
	'FindMany',
	'Create',
	'CreateMany',
	'CreateManyAndReturn',
	'Update',
	'UpdateMany',
	'Upsert',
	'Delete',
	'DeleteMany',
	'Count',
	'Aggregate',
] as const;

generatorHandler({
	onManifest() {
		return {
			requiresGenerators: ['prisma-client-js'],
			defaultOutput: './ts-prisma.d.ts',
			prettyName: 'TS Prisma',
		};
	},
	async onGenerate(options) {
		const models = options.dmmf.datamodel.models.map((model) => model.name);

		const clientGenerator = options.otherGenerators.find((generator) => generator.provider.value === 'prisma-client-js');
		if (!clientGenerator?.output?.value) throw new Error('[TS Prisma] Prisma Client Generator output not found!');

		const actualIndexFolder = clientGenerator.isCustomOutput
			? path.join(clientGenerator.output.value)
			: path.join(clientGenerator.output.value, '..', '..', '.prisma', 'client');


		const outputDir = path.dirname(clientGenerator.sourceFilePath.replace(/\.prisma$/, ''));
		const outputValue = path.relative(outputDir, actualIndexFolder);

		const importName = outputValue.endsWith(path.join('.prisma', 'client')) ? '@prisma/client' : (outputValue.startsWith('.') ? outputValue : `./${outputValue}`);

		const fileDirs = {
			indexFile: path.join(actualIndexFolder, 'index.d.ts'),
			defaultFile: path.join(actualIndexFolder, 'default.d.ts'),
			tsPrismaFile: path.join(actualIndexFolder, 'ts-prisma.d.ts'),

			prismaFile: path.join(actualIndexFolder, 'index.js'),
			prismaBrowserFile: path.join(actualIndexFolder, 'index-browser.js'),
		};

		const defaultExport = fs.readFileSync(fileDirs.defaultFile, 'utf-8').trim();
		fs.writeFileSync(fileDirs.defaultFile, defaultExport + nl(1) + 'export * from \'./ts-prisma.d.ts\'');

		const { TSPrismaImports, TSPrismaNamespace, TSPrismaImportsWithoutPrisma } = generateDeclarations(models, importName);
		const TempNamespace = wrapAndIndentInNamespace('TSPrisma', TSPrismaNamespace);

		const indexFileContent = fs.readFileSync(fileDirs.indexFile, 'utf-8');
		const newIndexContent = TSPrismaImportsWithoutPrisma + nl(1) + TempNamespace + indexFileContent;

		const { TSPrismaFile, TSPrismaTypes } = generateFile(newIndexContent);

		const FinalNamespace = wrapAndIndentInNamespace('TSPrisma', TSPrismaNamespace + TSPrismaTypes);
		fs.writeFileSync(fileDirs.tsPrismaFile, TSPrismaImports + FinalNamespace);

		modifyPrismaFile(fileDirs.prismaFile, TSPrismaFile);
		modifyPrismaFile(fileDirs.prismaBrowserFile, TSPrismaFile);
	},
});

export function modifyPrismaFile(file: string, content: string) {
	const prismaFileContent = fs.readFileSync(file, 'utf-8').split('\n');

	const prismaLine = prismaFileContent.findIndex((line) => line.includes('const Prisma = {}'));
	const newPrismaContent = prismaFileContent.reduce((acc, line, index) => {
		if (index === prismaLine) acc += content;
		acc += line + nl();
		return acc;
	}, '');

	fs.writeFileSync(file, newPrismaContent);
}

export function wrapAndIndentInNamespace(namespace: string, content: string) {
	return `export namespace ${namespace} {\n${content.split('\n').map((line) => `  ${line}`).join('\n')}\n}\n`;
}

export function generateDeclarations(models: string[], prismaImport: string) {
	const getArgsName = (model: string, arg: AllFunctionsType) => `Prisma.${model}${arg}Args<T>;`;

	let TSPrismaImports = '';
	TSPrismaImports += 'import { DefaultArgs, GetResult, Narrowable } from \'' + prismaImport + '/runtime/library\';' + nl(1);

	const TSPrismaImportsWithoutPrisma = TSPrismaImports;

	TSPrismaImports += 'import { Prisma } from \'' + prismaImport + '\';' + nl(2);

	let TSPrismaNamespace = '';
	TSPrismaNamespace += 'export type AllModelNames = keyof TSPrismaModels;' + nl(1);
	TSPrismaNamespace += 'export type AllModelNamesLowercase = FirstLowercase<AllModelNames>;' + nl(2);

	TSPrismaNamespace += 'export type AllPrismaMethods = RemoveDefault<keyof TSPrismaModels[keyof TSPrismaModels]>;' + nl(1);
	TSPrismaNamespace += 'export type AllPrismaMethodsLowercase = RemoveDefault<FirstLowercase<AllPrismaMethods>>;' + nl(2);

	TSPrismaNamespace += 'export type Callable = <T>(...args: T[]) => unknown;' + nl(1);
	TSPrismaNamespace += 'export type RemoveDefault<T> = Exclude<T, \'Default\' | \'default\'>;' + nl(2);

	TSPrismaNamespace += 'export type FirstLowercase<S extends string> = S extends `${infer F}${infer R}` ? `${Lowercase<F>}${R}` : S;' + nl(1);
	TSPrismaNamespace += 'export type FirstUppercase<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;' + nl(2);

	TSPrismaNamespace += 'export type Args<N extends AllModelNamesLowercase, M extends AllPrismaMethodsLowercase, T> = Prisma.SelectSubset<T, AllArgs[FirstLowercase<N>][M]>;' + nl(1);
	TSPrismaNamespace += 'export type Result<N extends AllModelNamesLowercase, M extends AllPrismaMethodsLowercase, T> = TSPrismaClients<GetResult<TSPrismaPayloads<DefaultArgs>[FirstUppercase<N>], T, M> | null, null, DefaultArgs>[FirstUppercase<N>];' + nl(2);

	TSPrismaNamespace += 'export type AllArgs<A extends DefaultArgs = DefaultArgs> = {' + nl(1);
	TSPrismaNamespace += '  [T in AllModelNames as FirstLowercase<T>]: {' + nl(1);
	TSPrismaNamespace += '    [K in AllPrismaMethods as FirstLowercase<K>]: TSPrismaModels<A>[T][K];' + nl(1);
	TSPrismaNamespace += '  };' + nl(1);
	TSPrismaNamespace += '};' + nl(2);

	TSPrismaNamespace += 'export type IsNever<T> = T extends never ? true : false;' + nl(1);
	TSPrismaNamespace += 'export type Exact<A, W> = (A extends unknown ? (W extends A ? { [K in keyof A]: Exact<A[K], W[K]>; } : W) : never) | (A extends Narrowable ? A : never);' + nl(1);
	TSPrismaNamespace += 'export type ValidateSimple<V, S> = IsNever<S extends Exact<S, V> ? S : never> extends true ? \'Validation failed: Types do not match.\' : S;' + nl(2);

	TSPrismaNamespace += 'export type TSPrismaModelsFull = {' + nl(1);
	TSPrismaNamespace += models.map((model) => `  ${model}: Prisma.${model}GetPayload<ValidateSimple<Prisma.${model}DefaultArgs, IncludesType['${firstLowercase(model)}']['default']>>;`).join(nl(1)) + nl(1);
	TSPrismaNamespace += '};' + nl(2);

	TSPrismaNamespace += 'export type TSPrismaModels<T extends DefaultArgs = DefaultArgs> = {\n';
	TSPrismaNamespace += models.map((model) => `  ${model}: {\n${AllFunctions.map((arg) => `    ${arg}: ${getArgsName(model, arg)}`).join(nl(1))}\n  };`).join(nl(1)) + nl(1);
	TSPrismaNamespace += '};' + nl(2);

	const getClientName = (model: string) => `Prisma.Prisma__${model}Client<T, Null, ExtArgs>;`;

	TSPrismaNamespace += 'export type TSPrismaClients<T, Null = never, ExtArgs extends DefaultArgs = DefaultArgs> = {' + nl(1);
	TSPrismaNamespace += models.map((model) => `  ${model}: ${getClientName(model)}`).join(nl(1)) + nl(1);
	TSPrismaNamespace += '};' + nl(2);

	const getPayloadName = (model: string) => `Prisma.$${model}Payload<T>;`;

	TSPrismaNamespace += 'export type TSPrismaPayloads<T extends DefaultArgs = DefaultArgs> = {\n';
	TSPrismaNamespace += models.map((model) => `  ${model}: ${getPayloadName(model)}`).join(nl(1)) + nl(1);
	TSPrismaNamespace += '};' + nl(2);

	return {
		TSPrismaImports: removeEmptyLines(TSPrismaImports),
		TSPrismaNamespace: removeEmptyLines(TSPrismaNamespace),
		TSPrismaImportsWithoutPrisma: removeEmptyLines(TSPrismaImportsWithoutPrisma),
	};
}

export function generateFile(rawFile: string) {
	let TSPrismaFile = '';
	let TSPrismaTypes = '';

	const TSPrisma: SourceObject = {
		Includes: {},
		IncludesLowercase: {},
	};

	TSPrisma.Includes = generateIncludes(rawFile);

	const splitIncludes = Object.entries(TSPrisma.Includes);
	TSPrisma.IncludesLowercase = {};

	for (const [key, value] of splitIncludes) {
		const keyLowercase = firstLowercase(key);
		const valueSplit = Object.entries(value);

		TSPrisma.IncludesLowercase[keyLowercase] = {};

		for (const [vKey, vValue] of valueSplit) {
			const vKeyLowercase = firstLowercase(vKey);
			TSPrisma.IncludesLowercase[keyLowercase][vKeyLowercase] = vValue;
		}
	}

	TSPrismaFile += 'const TSPrisma = {' + nl(1);
	TSPrismaFile += '  Includes: ' + stringifyWithoutQuotes(TSPrisma.IncludesLowercase, 2) + ',' + nl(1);
	TSPrismaFile += '}' + nl(2);

	TSPrismaFile += 'TSPrisma.Functions = {' + nl(1);
	TSPrismaFile += '  getIncludes: (modelName, method) => TSPrisma.Includes?.[modelName]?.[method] || {},' + nl(1);
	TSPrismaFile += '  computeArgs: (modelName, operation, args) => {' + nl(1);
	TSPrismaFile += '    return {' + nl(1);
	TSPrismaFile += '      ...TSPrisma.Functions.getIncludes(modelName, operation),' + nl(1);
	TSPrismaFile += '      ...args,' + nl(1);
	TSPrismaFile += '    };' + nl(1);
	TSPrismaFile += '  },' + nl(1);
	TSPrismaFile += '}' + nl(2);

	TSPrismaFile += 'exports.TSPrisma = TSPrisma;' + nl(2);

	TSPrismaTypes += 'export type IncludesArgs<N extends AllModelNamesLowercase, M extends AllPrismaMethodsLowercase, T> = T & (typeof Includes)[N][M];' + nl(1);
	TSPrismaTypes += 'export type IncludesResult<N extends AllModelNamesLowercase, M extends AllPrismaMethodsLowercase, T> = TSPrismaClients<GetResult<TSPrismaPayloads<DefaultArgs>[FirstUppercase<N>], T extends { include: unknown; } ? T : IncludesArgs<N, M, T>, M> | null, null, DefaultArgs>[FirstUppercase<N>];' + nl(2);

	TSPrismaTypes += 'export const Includes: ' + stringifyWithoutQuotes(TSPrisma.IncludesLowercase) + ';' + nl(2);

	TSPrismaTypes += 'export type IncludesType = typeof Includes;' + nl(2);

	TSPrismaTypes += 'export const Functions: {' + nl(1);
	TSPrismaTypes += '  getIncludes: <' + nl(1);
	TSPrismaTypes += '    N extends keyof IncludesType,' + nl(1);
	TSPrismaTypes += '    M extends keyof IncludesType[N]' + nl(1);
	TSPrismaTypes += '  >(modelName: N, method: M) => IncludesType[N][M] extends boolean ? {} : IncludesType[N][M],' + nl(1);
	TSPrismaTypes += '  computeArgs: <' + nl(1);
	TSPrismaTypes += '    N extends AllModelNamesLowercase,' + nl(1);
	TSPrismaTypes += '    M extends AllPrismaMethodsLowercase,' + nl(1);
	TSPrismaTypes += '    T extends AllArgs[N][M]' + nl(1);
	TSPrismaTypes += '  >(modelName: N, operation: M, args: Args<N, M, T>) => IncludesArgs<N, M, T>;' + nl(1);
	TSPrismaTypes += '}';

	return {
		TSPrismaFile: removeEmptyLines(TSPrismaFile),
		TSPrismaTypes: removeEmptyLines(TSPrismaTypes),
	};
}

export function stringifyWithoutQuotes<T>(value: T, indentAmount?: number): string {
	const data = JSON.stringify(value, null, 2).replace(/"/g, '');
	return indentAmount ? indent(data, indentAmount) : data;
}

export function indent(str: string, amount: number) {
	return str.split('\n').map((line) => ' '.repeat(amount) + line).join('\n');
}

export function removeEmptyLines(str: string) {
	return str.replace(/^\s*[\r\n]/gm, '');
}
