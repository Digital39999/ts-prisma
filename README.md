# ts-prisma

`ts-prisma` is a TypeScript utility package that simplifies working with Prisma models and enums. It provides type-safe interfaces for your Prisma schema, allowing for easier integration with tools like `zod` or other validation libraries. `ts-prisma` also provides a function abstraction for Prisma queries, making it easier to define and execute queries in a type-safe way and many more utilities to make your life easier when working with Prisma.

## Installation

To install `ts-prisma`, use the following command:

```bash
npm install ts-prisma
```

You'll also need to have `@prisma/client` and `prisma` installed in your project. You can install them using the following commands:

```bash
npm install -D prisma
npm install @prisma/client
```

# Usage

## Generator

`ts-prisma` provides a generator that will generate the necessary types for your Prisma schema. To use the generator, add the following to your `schema.prisma` file:

```prisma
generator tsPrisma {
  provider = "ts-prisma-generator"
}
```

Then run the following command to generate the types:

```bash
npx prisma generate
```

## Basic Usage

<details>
<summary>Function Abstraction</summary>

## Function Abstraction

`ts-prisma` also provides a function abstraction for Prisma queries. This abstraction allows you to define your queries in a type-safe way and use them throughout your application if you need or want to have a simple way to define your queries, for example, when you have to execute it in a different context.

### Using the Function Abstraction

To make use of the function abstraction easier as possible, we have made it export TSPrisma namespace, which contains all the necessary types and functions to define your queries. Type assertion is needed because of [this issue](https://github.com/microsoft/TypeScript/issues/33014). Here's an example of how to define a query function using the function abstraction:

```typescript
import { TSPrisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function db<
  N extends TSPrisma.AllModelNamesLowercase,
  M extends TSPrisma.AllPrismaMethodsLowercase,
  T extends TSPrisma.AllArgs[N][M],
>(
  modelName: N,
  operation: M,
  args: TSPrisma.Args<N, M, T>,
): Promise<TSPrisma.Result<N, M, T>> {
  return await (prisma[modelName][operation] as TSPrisma.Callable)(args) as never; // yes this Callable is needed because https://github.com/microsoft/TypeScript/issues/33014
}
```

It's really that simple! Now you can use the `db` function to execute your queries.
</details>

<details>
<summary>Automatic Include Objects</summary>

## Automatic Include Objects

`ts-prisma` also provides a utility function to automatically include all your model's relationships. This function is useful when you want to include all relationships in your query without having to manually specify them each time, [really](https://github.com/prisma/prisma/issues/23088) Prisma? 😒

### Using the Automatic Include Function

To use the automatic include function, you can use the `TSPrisma` namespace. Here's an example of how to use the automatic include function:

```typescript
import { TSPrisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  const user = await prisma.user.findUnique({
    ...TSPrisma.Functions.getIncludesLowercase('user', 'findUnique'),
    where: { id: 1 },
  });

  console.log(user);
})();
```

The `getIncludesLowercase` function will automatically include all relationships for the specified model and method. You can then pass the result to the `findUnique` function to execute the query.

### Using the Automatic Include with Function Abstraction

You can also use the automatic include function with the function abstraction. Type assertion is needed because of [this issue](https://github.com/microsoft/TypeScript/issues/33014). Here's an example of how to use the automatic include function with the `db` function:

```typescript
import { TSPrisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function db<
  N extends TSPrisma.AllModelNamesLowercase,
  M extends TSPrisma.AllPrismaMethodsLowercase,
  T extends TSPrisma.AllArgs[T][M],
>(
  modelName: N,
  operation: M,
  args: TSPrisma.Args<N, M, T>,
): Promise<TSPrisma.IncludesResult<N, M, T>> { // Result is now IncludesResult
  const newArgs = TSPrisma.Functions.computeArgs(args);
  return await (prisma[modelName][operation] as TSPrisma.Callable)(newArgs) as never; // yes this Callable is needed
}

(async () => {
  const user = await db('user', 'findUnique', {
    where: { id: 1 },
  });

  console.log(user.someObject);
```
</details>

<details>
<summary>Type Maps</summary>

## Type Maps!!

`ts-prisma` also provides a utility types for various use cases. Check the examples below to see how to use them.

### List of all Models

```typescript
import { TSPrisma } from '@prisma/client';

// List of all models and enums
type AllModels = TSPrisma.AllModelNames;

// even better, you can use the AllModelNamesLowercase to get the models in lowercase
type AllModelsLowercase = TSPrisma.AllModelNamesLowercase;
```

### Advanced Usage

For more advanced users, we've also provided some more complex types as well.

```typescript
import { TSPrisma } from '@prisma/client';

// List of all models and their methods
type AllModelsAndMethods = TSPrisma.TSPrismaModels;
/* 
{
  User: {
    FindUnique: {
      select: {
        ...
      }
    },
    ...
  },
  ...
}
*/

// All Prisma Clients of each model, useful for generating your own input types
type AllPrismaClients = TSPrisma.TSPrismaClients;

// And lastly, all payloads of each method of each model
type AllPayloads = TSPrisma.TSPrismaPayloads;
```
</details>

<details>
<summary>Raw Models and Enums</summary>

## Raw Models and Enums

### Defining a Prisma Schema

Before you can use `ts-prisma`, you'll need to define your Prisma schema. Below is an example schema using `User`, `Profile`, and `Post` models:

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator tsPrisma {
  provider = "ts-prisma-generator"
}

model User {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  name     String?

  profile  Profile?
  posts    Post[]
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?

  userId Int     @unique
  user   User    @relation(fields: [userId], references: [id])
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?

  authorId  Int
  author    User      @relation(fields: [authorId], references: [id])
}
```

### Generating the Prisma Client

After defining your Prisma schema, you can generate the Prisma client using the `prisma generate` command:

```bash
npx prisma generate
```

### Retrieving Type-Safe Interfaces

Once you have generated the Prisma client, you can use `ts-prisma` to generate type-safe interfaces for your models with relationships and enums. Here’s an example of how to generate types using `ts-prisma`:

```typescript
import { PrismaModels, PrismaEnums } from 'ts-prisma';
import { $Enums, Prisma } from '@prisma/client';

// Generate type-safe models and enums
export type Models = PrismaModels<Prisma.ModelName, Prisma.TypeMap>;
export type Enums = PrismaEnums<typeof $Enums>;

// Interfaces for specific models
export type User = Models['User'];
export type Profile = Models['Profile'];
export type Post = Models['Post'];
```

This will 99% satisfy your needs, however, if you use this alongside with our automatic includes, you will have to use the example below to get full model types with all relationships. This is because the models from Prisma's type map don't exactly match the result of the automatic include function (which is a good thing, because it's more specific). Anyway, here's how you can get the full model types:

```typescript
import { TSPrisma, PrismaClient } from '@prisma/client';

type UserFull = TSPrisma.TSPrismaModelsFull['User'];

const prisma = new PrismaClient();

(async () => {
  const user = await prisma.user.findUnique({
    ...TSPrisma.Functions.getIncludesLowercase('user', 'findUnique'),
    where: { id: 1 },
  });

  function doSomething(user: UserFull) {
    console.log(user.profile.bio);
  }

  doSomething(user); // this will work
})();
```

### Using the Generated Types

Once you have generated the types, you can use them throughout your application for type safety.

```typescript
const user: User = {
  id: 1,
  email: "user@example.com",
  name: "John Doe",
  profile: {
    id: 1,
    bio: "Software Developer",
    userId: 1,
  },
  posts: [
    {
      id: 1,
      title: "My first post",
      content: "This is the content of the first post",
      authorId: 1,
    },
  ],
};
```

## Clean Models

By default, `ts-prisma` generates models with all relationships included. If you want to generate models without relationships, you can use the `PrismaModelsClean` type.

```typescript
import { PrismaModelsClean } from 'ts-prisma';
import { Prisma } from '@prisma/client';

export type Models = PrismaModelsClean<Prisma.ModelName, Prisma.TypeMap>;

export type User = Models['User'];
export type Profile = Models['Profile'];

// now user and profile models do not have relationships
export type Test = User['profile'] // will throw an error
```

## Remove Model ID Fields

When generating models, you may want to remove the @id fields from the generated models. You can do this by using the `RemoveDBIds` utility type as shown below:

```prisma
model User {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  name     String?

  profile  Profile?
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?

  userId Int     @unique
  user   User    @relation(fields: [userId], references: [id])
}
```

And then in your TypeScript code:

```typescript
import { PrismaModels, RemoveDBIds } from 'ts-prisma';
import { Prisma } from '@prisma/client';

export type Models = PrismaModels<Prisma.ModelName, Prisma.TypeMap>;

// Remove the id fields from the generated models
export type WithoutIdModels = RemoveDBIds<Models, 'id'>;
export type User = WithoutIdModels['User']; // User model without id field

// or

export type User = Models['User'];
export type UserWithoutId = RemoveDBIds<User, 'id'>; // User model without id field
```

## Circular References

When using relationships in your Prisma schema, you may encounter circular references between models. To handle this, your reference from a child model to a parent model should be named per the parent model's name, with the first letter in lowercase, and similarly named id field.

For example, in the schema below, the `Profile` model has a reference to the `User` model named `exampleUser` with its id `exampleUserId`.

This naming convention allows `ts-prisma` to generate the correct types for circular references.

```prisma
model ExampleUser {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  name     String?

  profile  Profile?
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?

  exampleUserId Int     @unique // Reference id field named 'exampleUserId'
  exampleUser   User    @relation(fields: [exampleUserId], references: [id]) // Reference named 'exampleUser'
}
```

And then in your TypeScript code:

```typescript
import { PrismaModelsNonRecursive } from 'ts-prisma';
import { Prisma } from '@prisma/client';

export type Models = PrismaModelsNonRecursive<Prisma.ModelName, Prisma.TypeMap>;

export type ExampleUser = Models['ExampleUser'];

// now you cannot access the circular reference
export type Test = ExampleUser['profile']['exampleUser'] // will throw an error
```

### Remove relation id fields

Additionally, you can remove the relation id fields from the generated models by using the `PrismaModelsNonRecursive` type. Which just like the previous example, it will remove the relation fields from the generated models, but it will also remove the id fields from the relations.

```typescript
import { PrismaModelsNonRecursive } from 'ts-prisma';
import { Prisma } from '@prisma/client';

export type Models = PrismaModelsNonRecursive<Prisma.ModelName, Prisma.TypeMap, true>;

export type ExampleUser = Models['ExampleUser'];

// now you cannot access the circular reference nor its id
export type Test = ExampleUser['profile']['exampleUser'] // will throw an error
export type Test2 = ExampleUser['profile']['exampleUserId'] // will throw an error as well
```
</details>

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any ideas or improvements.

## License

This package is licensed under the Apache License 2.0 License.
