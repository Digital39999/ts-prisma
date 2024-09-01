import { TSPrisma, PrismaClient } from '@prisma/client';

/* eslint-disable */

type ItWorks = TSPrisma.TSPrismaModels['User']['FindFirst'];

// const UserIncludes = TSPrisma.Includes['User'];
const yes = JSON.stringify(TSPrisma.Includes['User']['FindFirst'], null, 2);

const prisma = new PrismaClient();
(async () => {
	const user = await prisma.user.findFirst({
		...TSPrisma.Functions.getIncludes('User', 'FindFirst'),
	});
})();

console.log(yes);