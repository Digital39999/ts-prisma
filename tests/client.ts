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
		...TSPrisma.Functions.getIncludes('User', 'FindFirst'),
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
})();
