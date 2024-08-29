# ts-prisma

`ts-prisma` is a TypeScript utility package that simplifies working with Prisma models and enums. It provides type-safe interfaces for your Prisma schema, allowing for easier integration with tools like `zod` or other validation libraries.

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

## Getting Started

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

### Generating Types with `ts-prisma`

Once you have generated the Prisma client, you can use `ts-prisma` to generate type-safe interfaces for your models and enums.

Here’s an example of how to generate types using `ts-prisma`:

```typescript
import { PrismaModels, PrismaEnums } from 'ts-prisma';
import { $Enums, Prisma } from '@prisma/client';
import { z } from 'zod';

// Generate type-safe models
export type Models = PrismaModels<Prisma.ModelName, Prisma.TypeMap>;

// Generate type-safe enums
export type Enums = PrismaEnums<typeof $Enums>;

// Interfaces for specific models
export type User = Models['User'];
export type Profile = Models['Profile'];
export type Post = Models['Post'];
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

const profileSchema = z.object({
  id: z.number(),
  bio: z.string().optional(),
  userId: z.number(),
});

const parsedProfile = profileSchema.parse(user.profile);
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

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any ideas or improvements.

## License

This package is licensed under the MIT License.