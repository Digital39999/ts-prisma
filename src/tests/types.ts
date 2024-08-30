import { PrismaEnums, PrismaModels, PrismaModelsClean, PrismaModelsNonRecursive } from '../index';
import { Prisma, $Enums } from '@prisma/client';

/* eslint-disable */

type Enums = PrismaEnums<typeof $Enums>;
type Models = PrismaModels<Prisma.ModelName, Prisma.TypeMap>;
type ModelsClean = PrismaModelsClean<Prisma.ModelName, Prisma.TypeMap>;
type ModelsNonRecursive = PrismaModelsNonRecursive<Prisma.ModelName, Prisma.TypeMap, true>;

// valid
type TestEnums = Enums['Test'];

type UserM1 = Models['User']['id'];
type UserM2 = Models['User']['nestedObject'];
type UserM3 = Models['User']['someArray'];
type UserM4 = Models['User']['nestedObject']['levelDeeper']['nestedObject'];
type UserM5 = Models['User']['someArray'][number]['user'];
type UserM6 = Models['User']['someArray'][number]['id'];
type UserM7 = Models['User']['someArray'][number]['evenDeeper'];

type UserM1C = ModelsClean['User']['id'];

type UserM2NR = ModelsNonRecursive['User']['nestedObject'];
type UserM3NR = ModelsNonRecursive['User']['someArray'];
type UserM4NR = ModelsNonRecursive['User']['nestedObject']['levelDeeper'];
type UserM5NR = ModelsNonRecursive['User']['someArray'][number];
type UserM6NR = ModelsNonRecursive['User']['nestedObject']['levelDeeper']['evenDeeper'];
type UserM7NR = ModelsNonRecursive['User']['someArray'][number]['id'];
type UserM8NR = ModelsNonRecursive['User']['nestedObject']['levelDeeper']['evenDeeper']['id'];
type UserM9NR = ModelsNonRecursive['User']['someArray'][number]['evenDeeper'];

// invalid
// @ts-expect-error
type TestEnumsInvalid = Enums['User'];

// @ts-expect-error
type UserM1Invalid = Models['User']['asd'];
// @ts-expect-error
type UserM2Invalid = Models['User']['nestedObject']['asd'];

// @ts-expect-error
type UserM1CInvalid = ModelsClean['User']['asd'];

// @ts-expect-error
type UserM1NRInvalid = ModelsNonRecursive['User']['nestedObject']['user'];
// @ts-expect-error
type UserM2NRInvalid = ModelsNonRecursive['User']['nestedObject']['userId'];
// @ts-expect-error
type UserM3NRInvalid = ModelsNonRecursive['User']['nestedObject']['levelDeeper']['nestedObject'];
// @ts-expect-error
type UserM4NRInvalid = ModelsNonRecursive['User']['nestedObject']['levelDeeperArray'][number]['nestedObjectId'];
// @ts-expect-error
type UserM5NRInvalid = ModelsNonRecursive['User']['nestedObject']['levelDeeperArray'][number]['nestedObject'];
// @ts-expect-error
type UserM6NRInvalid = ModelsNonRecursive['User']['nestedObject']['levelDeeper']['evenDeeper']['levelDeeperId'];
