import { TSPrisma, PrismaClient } from '@prisma/client';

/* eslint-disable */

type ItWorks = TSPrisma.TSPrismaModels['User']['FindFirst'];
// const UserIncludes = TSPrisma.Includes['User'];

const prisma = new PrismaClient();
(async () => {
	await prisma.$connect();

	await prisma.user.deleteMany({
		where: {
			email: 'contact@crni.xyz',
		},
	})

	await prisma.user.create({
		data: {
			email: 'contact@crni.xyz',
			test: 'A',
			nestedObject: {
				create: {
					name: 'Digital',
				},
			},
		},
	});

	const user = await prisma.user.findFirst({
		...TSPrisma.Functions.getIncludes('user', 'findFirst'),
		where: {
			email: 'contact@crni.xyz',
		},
	});
	if (!user) return console.error('User not found');

	type User = typeof user;
	type UserFull = TSPrisma.TSPrismaModelsFull['User'];

	type DoesMatch<F, S> = F extends S ? S extends F ? true : false : false;
	type UserMatches = DoesMatch<User, UserFull>;
	//    ^ = type UserMatches = true	

	function test(user: UserFull) {
		console.log(user);
	}

	test(user);

	console.log(user);

	const userWithIncludes = await db('user', 'findFirst', {
		where: {
			email: 'contact@crni.xyz',
		},
		include: {
			
		},
	});

	// @ts-expect-error
	console.log(userWithIncludes?.nestedObject);
})();

export async function db<
	N extends TSPrisma.AllModelNamesLowercase,
	M extends TSPrisma.AllPrismaMethodsLowercase,
	T extends TSPrisma.AllArgs[N][M],
>(
	modelName: N,
	operation: M,
	args: TSPrisma.Args<N, M, T>,
): Promise<TSPrisma.IncludesResult<N, M, T> | null> {
	const prisma = new PrismaClient();
	const newArgs = TSPrisma.Functions.computeArgs(modelName, operation, args);
	return await (prisma[modelName][operation] as TSPrisma.Callable)(newArgs) as never;
}