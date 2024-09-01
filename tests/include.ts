import { generateIncludes } from '../src/schema';

const prismaSchema = `
	export namespace TSPrisma {
		export type Key1Args = {
			include?: {
				nestedObject: {
					include?: {
						levelDeeper: boolean | {
							include?: {
								levelDeeperArray: boolean | {
									select: {
										test: boolean;
									};
								};
							};
							select: {
								test: boolean;
							};
						};
					};
					select: {
						test: boolean;
					};
				};
			} | null;
			select?: {
				test: boolean;
			};
		};

		export type TSPrismaModels = {
			Name: {
				Key1: Key1Args;
			};
		};
	};
`;

const prismaSchemaInfinite = `
	export namespace TSPrisma {
		export type UserDefaultArgs = {
			include?: UserInclude | null;
			select?: { id?: boolean; } | null; // this should be ignore always
		};

		export type UserInclude = {
			nestedObject?: boolean | NestedObjectArgs;
		};

		export type NestedObjectArgs = {
			include?: NestedObjectInclude | null;
		};

		export type NestedObjectInclude = {
			levelDeeper?: boolean | LevelDeeperArgs;
			user?: boolean | UserDefaultArgs;
		};

		export type LevelDeeperArgs = {
			select?: { test?: boolean; } | null;
		};

		export type TSPrismaModels = {
			Name: {
				User: UserDefaultArgs;
			};
		};
	};
`;

// console.log(JSON.stringify(generateIncludes(prismaSchema), null, 2));
console.log(JSON.stringify(generateIncludes(prismaSchemaInfinite), null, 2));

/* expected output:
{
	"Name": {
		"User": {
			include: {
				nestedObject: {
					include: {
						levelDeeper: true,
					},
				},
			},
  	},
}
*/
