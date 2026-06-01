import type { StandardSchemaV1 } from "./standard-schema";

/**
 * Tamga symbol marker for nominal typing
 */
export type Tamga<TamgaName> = {
  readonly $$tamga: TamgaName;
};

export interface TypeMarker<Value, Type> {
  readonly type: TamgaValue<Value, Type>;
}

/**
 * A nominal value combining the original value with tamga metadata
 */
export type TamgaValue<ValueType, TamgaName> = ValueType & Tamga<TamgaName>;

export type TamgaValidator<ValueType> =
  | ((value: unknown) => value is ValueType)
  | StandardSchemaV1<unknown, ValueType>;

export type TamgaOptions<ValueType> = {
  validator?: TamgaValidator<ValueType>;
};

export interface TamgaMethods<ValueType, TamgaName> {
  as: (value: unknown) => TamgaValue<ValueType, TamgaName>;
  is: (value: unknown) => value is TamgaValue<ValueType, TamgaName>;
  to: (value: unknown) => TamgaValue<ValueType, TamgaName>;
}

/**
 * Nominal type constructor - creates branded values of a fixed type
 */
export type Nominal<ValueType = never, TamgaName = never> = ValidateTamgaValueType<
  ValueType,
  TamgaConstructor<ValueType, TamgaName> &
    TamgaMethods<ValueType, TamgaName> &
    TypeMarker<ValueType, TamgaName>
>;
/**
 * Generic nominal type - creates branded values with variable value types
 */
export interface GenericNominal<TamgaName> {
  <ValueType>(): Nominal<ValueType, TamgaName>;
}

export type TamgaConstructor<ValueType = never, TamgaName = never> = (
  value: ValueType,
) => TamgaValue<ValueType, TamgaName>;

type ValidateTamgaValueType<ValueType, IfNormalType> = ValueType extends [never]
  ? "Tamga value type cannot be unset, please provide a value type"
  : IfNormalType;
