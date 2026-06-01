# Tamga Specification

Status: Version 1.0

Purpose: Define a file-independent, structure-independent TypeScript contract for nominal value marking with optional runtime validation.

This specification is not a library layout, package scaffold, build recipe, or repository template. It defines behavior and public TypeScript API shape that can be embedded into an existing application, framework, monorepo package, or standalone library.

## Normative Language

The key words `MUST`, `MUST NOT`, `REQUIRED`, `SHOULD`, `SHOULD NOT`, `RECOMMENDED`, `MAY`, and `OPTIONAL` in this document are to be interpreted as described in RFC 2119.

`Implementation-defined` means the behavior is part of the implementation contract, but this specification does not prescribe one universal policy.

## 1. Problem Statement

TypeScript's structural type system makes values with the same runtime shape interchangeable. Applications often need nominal distinctions, for example `UserId` versus `PostId`, while keeping the runtime value unchanged.

Tamga defines a small nominal marking API. A Tamga implementation creates constructors that return the original runtime value with a distinct compile-time mark. Implementations MAY optionally validate unknown inputs before marking them.

## 2. Goals and Non-Goals

### 2.1 Goals

- Provide nominal typing for arbitrary TypeScript values.
- Preserve original runtime values exactly.
- Preserve literal value types where possible.
- Provide checked and unchecked conversion methods.
- Support synchronous type-guard validators.
- Support synchronous Standard Schema v1 validators structurally.
- Allow implementation inside existing projects without requiring a specific file layout, build system, package manager, test runner, or module bundler.

### 2.2 Non-Goals

- Repository structure.
- Build configuration.
- Package publishing.
- Runtime wrappers around marked values.
- Async validation.
- Dependency on a schema library.
- React, browser, Node.js, or framework-specific integration.

## 3. Public API

An implementation MUST expose a runtime function named `tamga`.

An implementation MUST expose these public types, either from the same module or from a documented project-local module:

- `Tamga`
- `TamgaValue`
- `TamgaOptions`
- `TamgaValidator`
- `Nominal`
- `GenericNominal`
- `StandardSchemaV1`

An implementation MAY expose additional aliases for local ergonomics, but the names above define the conformance surface.

## 4. `tamga<ValueType, TamgaName>(options?)`

`tamga` creates a nominal constructor for a fixed value type and tamga name.

Example:

```ts
const UserId = tamga<string, "UserId">();
const id = UserId("user-123");
```

The returned constructor MUST be callable:

```ts
const id = UserId("user-123");
```

The returned value MUST be the exact runtime input value:

```ts
UserId("user-123") === "user-123";
```

The constructor MUST expose these methods:

- `.as(value)` unchecked cast
- `.is(value)` validation predicate
- `.to(value)` checked conversion

The constructor SHOULD expose a phantom `.type` property at type level for type extraction. It MUST NOT rely on that property existing at runtime.

## 5. Type Model

### 5.1 Tamga Marker

An implementation MUST define the nominal marker equivalently to:

```ts
export type Tamga<TamgaName> = {
  readonly $$tamga: TamgaName;
};
```

The marker property name MAY be implementation-defined if required by local constraints, but different tamga names MUST remain type-incompatible.

### 5.2 Tamga Value

An implementation MUST define:

```ts
export type TamgaValue<ValueType, TamgaName> = ValueType & Tamga<TamgaName>;
```

Consequences:

- `TamgaValue<string, "UserId">` MUST be assignable to `string`.
- `string` MUST NOT be assignable to `TamgaValue<string, "UserId">`.
- `TamgaValue<string, "UserId">` MUST NOT be assignable to `TamgaValue<string, "PostId">`.
- Two values with the same value type and tamga name SHOULD be type-compatible.

### 5.3 Options

An implementation MUST support:

```ts
export type TamgaOptions<ValueType> = {
  validator?: TamgaValidator<ValueType>;
};
```

If options are omitted, construction MUST succeed for values accepted by the constructor's static type.

### 5.4 Validators

An implementation MUST support synchronous type-guard validators:

```ts
(value: unknown) => value is ValueType;
```

An implementation MUST support synchronous Standard Schema v1 validators structurally:

```ts
StandardSchemaV1<unknown, ValueType>;
```

The validator type MUST be equivalent to:

```ts
export type TamgaValidator<ValueType> =
  | ((value: unknown) => value is ValueType)
  | StandardSchemaV1<unknown, ValueType>;
```

### 5.5 Constructor Type

An implementation MUST expose a constructor type equivalent to:

```ts
export type TamgaConstructor<ValueType = never, TamgaName = never> = (
  value: ValueType,
) => TamgaValue<ValueType, TamgaName>;
```

The runtime constructor implementation SHOULD preserve literal types:

```ts
function constructor<const S extends ValueType>(value: S): TamgaValue<S, TamgaName>;
```

### 5.6 Constructor Methods

An implementation MUST expose method types equivalent to:

```ts
export interface TamgaMethods<ValueType, TamgaName> {
  as: (value: unknown) => TamgaValue<ValueType, TamgaName>;
  is: (value: unknown) => value is TamgaValue<ValueType, TamgaName>;
  to: (value: unknown) => TamgaValue<ValueType, TamgaName>;
}
```

### 5.7 Nominal Constructor

An implementation MUST expose `Nominal` as the public type of a tamga constructor:

```ts
export type Nominal<ValueType = never, TamgaName = never> = TamgaConstructor<ValueType, TamgaName> &
  TamgaMethods<ValueType, TamgaName> &
  TypeMarker<ValueType, TamgaName>;
```

`TypeMarker` MUST be type-only and equivalent to:

```ts
export interface TypeMarker<Value, Type> {
  readonly type: TamgaValue<Value, Type>;
}
```

An implementation SHOULD produce an actionable type-level error if `ValueType` is omitted.

### 5.8 Generic Factory

`tamga.generic<TamgaName>()` MUST return a factory that fixes the tamga name while allowing the value type to be selected later:

```ts
const Id = tamga.generic<"Id">();
const StringId = Id<string>();
const NumberId = Id<number>();
```

The factory type SHOULD be equivalent to:

```ts
export interface GenericNominal<TamgaName> {
  <ValueType>(): Nominal<ValueType, TamgaName>;
}
```

### 5.9 Generic Type Alias

`tamga.Generic<TamgaName, ValueType>` MUST be a type-only alias equivalent to:

```ts
TamgaValue<ValueType, TamgaName>;
```

Example:

```ts
type UserId = tamga.Generic<"UserId", string>;
```

## 6. Runtime Semantics

### 6.1 No Validator

If no validator is provided:

- constructor call MUST return the input value
- `.to(value)` MUST return the input value
- `.is(value)` MUST return `true`
- `.as(value)` MUST return the input value without checking

All returned values are compile-time marked as `TamgaValue`.

### 6.2 Type-Guard Validator

If a type-guard validator is provided:

- constructor call MUST validate using the validator
- `.to(value)` MUST validate using the validator
- `.is(value)` MUST return `true` only when the validator returns `true`
- `.as(value)` MUST NOT call the validator

If validation fails, constructor call and `.to(value)` MUST throw.

### 6.3 Standard Schema Validator

If a Standard Schema v1 validator is provided:

- implementation MUST read `validator["~standard"]`
- implementation MUST require `validate` to be a function
- implementation MUST call `validate(value)`
- result with non-null `issues` MUST fail
- result with `value` and no non-null `issues` MUST pass
- thrown validation errors MUST fail validation
- Promise results MUST fail validation

Async validation is intentionally unsupported.

### 6.4 Error

On validation failure, constructor call and `.to(value)` MUST throw an `Error`.

The error message SHOULD be:

```txt
Tamga invariant violation: Invalid value for type ${String(value)}
```

Implementations MAY customize the message if embedded project conventions require it, but tests SHOULD assert that invalid conversion throws.

### 6.5 Method Properties

Implementations SHOULD define `.as`, `.is`, and `.to` as non-enumerable, non-writable, non-configurable properties when JavaScript property descriptors are available.

## 7. Standard Schema Surface

An implementation MUST support this minimal Standard Schema v1 shape structurally:

```ts
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}
```

The namespace MUST include compatible definitions for:

- `Props<Input, Output>`
- `Result<Output>`
- `SuccessResult<Output>`
- `FailureResult`
- `Issue`
- `PathSegment`
- `Options`
- `Types<Input, Output>`
- `InferInput<Schema>`
- `InferOutput<Schema>`

No runtime dependency on a Standard Schema package is required.

## 8. Conformance Tests

Implementations SHOULD verify the behavior below using their local test runner.

Runtime tests:

- `tamga()` returns a function
- constructor returns original string value
- constructor returns original number value
- constructor preserves object identity/value
- `.as`, `.is`, `.to` exist
- `.as` returns input without validation
- no validator allows values
- type-guard validator accepts valid input
- type-guard validator rejects invalid input
- `.to` throws on invalid input
- Standard Schema validator accepts valid input
- Standard Schema validator rejects invalid input
- Standard Schema validator works through `.is`
- Standard Schema validator works through `.to`
- `tamga.generic()` returns a factory
- generic factory creates constructors for multiple value types
- literal values remain literal at type level where possible

Type tests:

- marked value extends base type
- marked value can be passed where base type is expected
- base type does not extend marked type
- constructor is callable
- constructor has `.as`, `.is`, `.to`
- constructor return extends `TamgaValue`
- `tamga.generic<TamgaName>()` supports multiple value types
- `tamga.Generic<TamgaName, ValueType>` creates a marked alias
- `typeof Constructor.type` extracts marked type
- `ReturnType<typeof Constructor>` extracts marked type
- different tamga names are incompatible
- same tamga name/value type are compatible

## 9. Embedding Guidance

Implementations SHOULD fit the host project instead of imposing a new project structure.

Acceptable implementations include:

- one file in an existing app
- a shared internal package in a monorepo
- a published package
- a framework utility module
- a language-specific port that preserves the same semantics where possible

The specification is the source of truth. A reference implementation may demonstrate one packaging choice, but conformance is about API and behavior, not files, scripts, CI, or build output.
