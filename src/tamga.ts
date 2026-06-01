import type { StandardSchemaV1 } from "./standard-schema";
import type { Nominal, TamgaValue, TamgaOptions, TamgaValidator } from "./types";

type ValidationResult<ValueType, TamgaName> =
  | { ok: true; value: TamgaValue<ValueType, TamgaName> }
  | { ok: false };

const normalizeStandardResult = <ValueType, TamgaName>(
  result: StandardSchemaV1.Result<ValueType>,
): ValidationResult<ValueType, TamgaName> => {
  if (result && "issues" in result && result.issues != null) {
    return { ok: false };
  }
  if (result && "value" in result) {
    return {
      ok: true,
      value: result.value as TamgaValue<ValueType, TamgaName>,
    };
  }
  return { ok: false };
};

const invalidError = (value: unknown) =>
  new Error(`Tamga invariant violation: Invalid value for type ${String(value)}`);

const getStandardValidator = <ValueType>(value: StandardSchemaV1<unknown, ValueType>) => {
  const standard = value?.["~standard"];
  if (!standard || typeof standard.validate !== "function") {
    return null;
  }
  return standard.validate.bind(standard);
};

const validateValue = <ValueType, TamgaName>(
  value: unknown,
  validator?: TamgaValidator<ValueType>,
): ValidationResult<ValueType, TamgaName> => {
  if (!validator) {
    return { ok: true, value: value as TamgaValue<ValueType, TamgaName> };
  }
  if (typeof validator === "function") {
    return validator(value)
      ? { ok: true, value: value as TamgaValue<ValueType, TamgaName> }
      : { ok: false };
  }
  const standardValidator = getStandardValidator(validator);
  if (!standardValidator) {
    return { ok: false };
  }
  try {
    const standardResult = standardValidator(value);
    if (
      standardResult &&
      typeof (standardResult as Promise<StandardSchemaV1.Result<ValueType>>).then === "function"
    ) {
      return { ok: false };
    }
    return normalizeStandardResult<ValueType, TamgaName>(
      standardResult as StandardSchemaV1.Result<ValueType>,
    );
  } catch {
    return { ok: false };
  }
};

/**
 * Creates a nominal (branded) type constructor.
 * Useful for creating distinct types from primitive values.
 *
 * @example
 * ```ts
 * const UserId = tamga<string, "UserId">({
 *   validator: (value: unknown): value is string => typeof value === "string",
 * });
 * const userId = UserId("user-123"); // TamgaValue<string, "UserId">
 * ```
 */
export function tamga<ValueType = never, const TamgaName = never>(
  options: TamgaOptions<ValueType> = {},
): Nominal<ValueType, TamgaName> {
  const { validator } = options;

  const is = <ValueType, TamgaName>(value: unknown): value is TamgaValue<ValueType, TamgaName> => {
    return validateValue(value, validator).ok;
  };

  const to = (value: unknown) => {
    const result = validateValue(value, validator);
    if (!result.ok) {
      throw invalidError(value);
    }
    return result.value as TamgaValue<ValueType, TamgaName>;
  };

  function nominal<const S extends ValueType>(value: S): TamgaValue<S, TamgaName> {
    return to(value) as TamgaValue<S, TamgaName>;
  }

  Object.defineProperty(nominal, "as", {
    value: (value: unknown) => value as TamgaValue<ValueType, TamgaName>,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(nominal, "is", {
    value: is,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(nominal, "to", {
    value: to,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return nominal as unknown as Nominal<ValueType, TamgaName>;
}

export namespace tamga {
  /**
   * Creates a generic nominal constructor factory with a fixed tamga name.
   * The value type remains generic at call site.
   *
   * @example
   * ```ts
   * const Id = tamga.generic<"Id">();
   * const stringId = Id("abc");  // TamgaValue<"abc", "Id">
   * const numberId = Id(123);    // TamgaValue<123, "Id">
   * ```
   */
  export function generic<const TamgaName = never>() {
    return <const ValueType = never>(options: TamgaOptions<ValueType> = {}) =>
      tamga<ValueType, TamgaName>(options);
  }

  /**
   * Type-level generic tamga. Creates a nominal type alias.
   *
   * @example
   * ```ts
   * type Id<T> = tamga.Generic<"Id", T>;
   * type StringId = Id<string>;  // TamgaValue<string, "Id">
   * ```
   */
  export type Generic<TamgaName, ValueType> = TamgaValue<ValueType, TamgaName>;
}

export type {
  Tamga,
  TamgaValue,
  Nominal,
  GenericNominal,
  TamgaOptions,
  TamgaValidator,
} from "./types";
export type { StandardSchemaV1 } from "./standard-schema";
