<p align="center">
  <img src="./assets/tamga-seal.png" alt="Tamga seal mark" width="256" />
</p>

<h1 align="center">Tamga</h1>

Type-safe nominal branding utilities for TypeScript.

`tamga` is named after a historical ownership mark: a seal, stamp, or brand used to identify property and origin. The library uses that idea for TypeScript values: a value keeps its runtime shape, but gets a distinct nominal type mark.

## Recommended Path

The recommended path is to implement Tamga directly in your own project, language, or package structure from the specification:

> Implement Tamga according to the following spec:
> https://github.com/MrFlashAccount/tamga/blob/main/SPEC.md

## Reference Implementation

This repository is the TypeScript reference implementation of the Tamga specification. Use it to validate expected API shape, runtime behavior, tests, build output, and packaging, but treat `SPEC.md` as the source of truth.

## Usage

### Create a nominal type

Use `tamga<Value, Name>()` to create a constructor for a distinct type.

```ts
const UserId = tamga<string, "UserId">();
const PostId = tamga<string, "PostId">();

const userId = UserId("user-123");
const postId = PostId("post-456");
```

Both values are strings at runtime, but TypeScript treats them as different types. This helps prevent mixing IDs, tokens, slugs, amounts, or other values that share the same shape but mean different things.

### Keep runtime values plain

Tamga does not wrap values. The returned value is the original value.

```ts
const UserId = tamga<string, "UserId">();

UserId("user-123") === "user-123"; // true
```

### Add runtime validation

Pass a validator when values should satisfy an invariant before being marked.

```ts
const PositiveNumber = tamga<number, "PositiveNumber">({
  validator: (value): value is number => typeof value === "number" && value > 0,
});

const count = PositiveNumber(42);
PositiveNumber.to(-1); // throws
```

Validators are useful at boundaries: API responses, route params, form values, storage reads, and anywhere `unknown` data enters typed code.

### Use Standard Schema libraries

Tamga accepts schemas that implement Standard Schema, including Zod and Valibot. No adapter is needed.

```ts
const NonEmptyString = tamga<string, "NonEmptyString">({
  validator: z.string().min(1),
});

NonEmptyString.to("ok"); // "ok"
NonEmptyString.to(""); // throws
```

```ts
const Slug = tamga<string, "Slug">({
  validator: v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/)),
});

Slug.is("hello-world"); // true
Slug.is("Hello World"); // false
```

When a schema transforms or normalizes input, `.to()` returns the schema output.

```ts
const TrimmedString = tamga<string, "TrimmedString">({
  validator: z.string().trim().min(1),
});

TrimmedString.to("  ok  "); // "ok"
```

Use `.to()` when you need the parsed or transformed value. Use `.is()` only for acceptance checks and narrowing the original value.

### Use `.to`, `.is`, and `.as`

Each constructor has three helpers.

```ts
const UserId = tamga<string, "UserId">({
  validator: (value): value is string => typeof value === "string" && value.length > 0,
});

UserId.to("user-123"); // checked conversion, throws when invalid
UserId.is("user-123"); // validation predicate
UserId.as("cached-id"); // unchecked cast
```

Use `.to` when data is untrusted, `.is` for narrowing, and `.as` only when another layer already proved the invariant.

### Create a generic factory

Use `tamga.generic<Name>()` when the same marker should apply to multiple value types.

```ts
const EntityId = tamga.generic<"EntityId">();

const StringEntityId = EntityId<string>();
const NumberEntityId = EntityId<number>();

const stringId = StringEntityId("abc");
const numberId = NumberEntityId(123);
```

This is useful for reusable markers such as IDs, cache keys, opaque handles, or domain tags.

### Extract the marked type

When a constructor is the source of truth, extract its marked type through the phantom `.type` property.

```ts
const UserId = tamga<string, "UserId">();

type UserId = typeof UserId.type;
```

`.type` is type-only. Do not read it at runtime.

You can also use `ReturnType` when you prefer standard TypeScript utilities.

```ts
const UserId = tamga<string, "UserId">();

type UserId = ReturnType<typeof UserId>;
```

### Use type-only aliases

Use `tamga.Generic<Name, Value>` when you only need the type.

```ts
type UserId = tamga.Generic<"UserId", string>;
type OrderId = tamga.Generic<"OrderId", string>;
```

This keeps domain model declarations compact while preserving nominal separation.
