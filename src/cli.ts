import { generatorHandler } from '@prisma/generator-helper';
import path from 'path';
import fs from 'fs';

export type AllArgs = typeof allArgs[number];

const allArgs = [
	'FindFirst',
	'FindUnique',
	'FindMany',
	'Create',
	'CreateMany',
	'Update',
	'UpdateMany',
	'Upsert',
	'Delete',
	'DeleteMany',
	'Count',
	'Aggregate',
] as const;

export type TypeForModel<T extends string> = `${T}${AllArgs}`;

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
		const nl = '\n';

		const clientGenerator = options.otherGenerators.find((generator) => generator.provider.value === 'prisma-client-js');
		if (!clientGenerator?.output?.value) throw new Error('[TS Prisma] Prisma Client Generator output not found!');

		const indexFile = fs.readFileSync(path.join(clientGenerator.output.value, 'index.d.ts'), 'utf-8');
		const isRef = indexFile.split(nl).filter((line) => line).length === 1;

		const actualIndexFolder = isRef
			? path.join(clientGenerator.output.value, '..', '..', '.prisma', 'client')
			: path.join(clientGenerator.output.value);

		const getArgsName = (model: string, arg: AllArgs) => `Prisma.${model}${arg}Args<T>;`;

		/* Leaving this here for easier debugging in the future..
			import { Prisma, TSPrisma, TSPrismaClients, TSPrismaPayloads } from '@prisma/client';
			import { DefaultArgs, GetResult } from '@prisma/client/runtime/library';
			import { FirstLowercase, FirstUppercase } from 'ts-prisma';

			export type AllModelNames = keyof TSPrisma;
			export type AllModelNamesLowercase = FirstLowercase<AllModelNames>;
			export type AllPrismaMethods = keyof TSPrisma[keyof TSPrisma];
			export type AllPrismaMethodsLowercase = FirstLowercase<AllPrismaMethods>;

			export type Args<T, M extends AllModelNamesLowercase, A extends AllPrismaMethodsLowercase> = Prisma.SelectSubset<T, AllArgs[FirstLowercase<M>][A]>;
			export type Result<T, M extends AllModelNamesLowercase, A extends AllPrismaMethodsLowercase> = TSPrismaClients<GetResult<TSPrismaPayloads<DefaultArgs>[FirstUppercase<M>], T, A> | null, null, DefaultArgs>[FirstUppercase<M>];

			export type AllArgs<A extends DefaultArgs = DefaultArgs> = {
				[T in AllModelNames as FirstLowercase<T>]: {
					[K in AllPrismaMethods as FirstLowercase<K>]: TSPrisma<A>[T][K];
				};
			};
		*/

		let TSPrismaNamespace = '';
		TSPrismaNamespace += 'import { Prisma, TSPrismaClients, TSPrismaPayloads } from \'@prisma/client\';' + nl;
		TSPrismaNamespace += 'import { DefaultArgs, GetResult } from \'@prisma/client/runtime/library\';' + nl;
		TSPrismaNamespace += 'import { FirstLowercase, FirstUppercase } from \'ts-prisma\';' + nl + nl;

		TSPrismaNamespace += 'export type AllModelNames = keyof TSPrismaModels;' + nl;
		TSPrismaNamespace += 'export type AllModelNamesLowercase = FirstLowercase<AllModelNames>;' + nl;
		TSPrismaNamespace += 'export type AllPrismaMethods = keyof TSPrismaModels[keyof TSPrismaModels];' + nl;
		TSPrismaNamespace += 'export type AllPrismaMethodsLowercase = FirstLowercase<AllPrismaMethods>;' + nl + nl;

		TSPrismaNamespace += 'export type Args<T, M extends AllModelNamesLowercase, A extends AllPrismaMethodsLowercase> = Prisma.SelectSubset<T, AllArgs[FirstLowercase<M>][A]>;' + nl;
		TSPrismaNamespace += 'export type Result<T, M extends AllModelNamesLowercase, A extends AllPrismaMethodsLowercase> = TSPrismaClients<GetResult<TSPrismaPayloads<DefaultArgs>[FirstUppercase<M>], T, A> | null, null, DefaultArgs>[FirstUppercase<M>];' + nl + nl;

		TSPrismaNamespace += 'export type AllArgs<A extends DefaultArgs = DefaultArgs> = {' + nl;
		TSPrismaNamespace += '  [T in AllModelNames as FirstLowercase<T>]: {' + nl;
		TSPrismaNamespace += '    [K in AllPrismaMethods as FirstLowercase<K>]: TSPrismaModels<A>[T][K];' + nl;
		TSPrismaNamespace += '  };' + nl;
		TSPrismaNamespace += '};' + nl + nl;

		TSPrismaNamespace += 'export type TSPrismaModels<T extends DefaultArgs = DefaultArgs> = {\n';
		TSPrismaNamespace += models.map((model) => `  ${model}: {\n${allArgs.map((arg) => `    ${arg}: ${getArgsName(model, arg)}`).join(nl)}\n  };`).join(nl) + nl;
		TSPrismaNamespace += '};' + nl + nl;

		const getClientName = (model: string) => `Prisma.Prisma__${model}Client<T, Null, ExtArgs>;`;

		TSPrismaNamespace += 'export type TSPrismaClients<T, Null = never, ExtArgs extends DefaultArgs = DefaultArgs> = {' + nl;
		TSPrismaNamespace += models.map((model) => `  ${model}: ${getClientName(model)}`).join(nl) + nl;
		TSPrismaNamespace += '};\n\n';

		const getPayloadName = (model: string) => `Prisma.$${model}Payload<T>;`;

		TSPrismaNamespace += 'export type TSPrismaPayloads<T extends DefaultArgs = DefaultArgs> = {\n';
		TSPrismaNamespace += models.map((model) => `  ${model}: ${getPayloadName(model)}`).join(nl) + nl;
		TSPrismaNamespace += '};\n';

		const defaultExport = fs.readFileSync(path.join(actualIndexFolder, 'default.d.ts'), 'utf-8').trim();
		fs.writeFileSync(path.join(actualIndexFolder, 'default.d.ts'), defaultExport + nl + 'export * from \'./ts-prisma.d.ts\'');

		fs.writeFileSync(path.join(actualIndexFolder, 'ts-prisma.d.ts'), wrapAndIndentInNamespace('TSPrisma', TSPrismaNamespace));
		console.log('TS Prisma types generated!');
	},
});

export function wrapAndIndentInNamespace(namespace: string, content: string) {
	return `export namespace ${namespace} {\n${content.split('\n').map((line) => `  ${line}`).join('\n')}\n}\n`;
}
