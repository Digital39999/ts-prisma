export type AnyType = any; // eslint-disable-line

export type PrismaModels<ModelName extends string, TypeMap extends TypeMapRaw<ModelName>> = {
    [M in ModelName]: TransformPayload<TypeMap['model'][M]['payload']>;
}

export type PrismaModelsClean<ModelName extends string, TypeMap extends TypeMapRaw<ModelName>> = {
    [M in ModelName]: ExtractScalars<TypeMap['model'][M]['payload']>;
}

export type PrismaModelsNonRecursive<ModelName extends string, TypeMap extends TypeMapRaw<ModelName>, ReferenceKey extends boolean = false> = {
    [M in ModelName]: TransformPayloadWithoutRecursive<TypeMap['model'][M]['payload'], ReferenceKey>;
}

export type PrismaEnums<$Enums extends Record<string, Record<string, string>>> = {
    [K in keyof $Enums]: $Enums[K][keyof $Enums[K]];
}

export type TypeMapRaw<ModelName extends string> = {
    model: Record<ModelName, {
        payload: TypeMapPayload;
    }>;
}

export type ExcludeNull<T> = Exclude<T, null>;
export type TypeMapPayload<Name extends string = string, T extends Record<string, AnyType> = Record<string, AnyType>> = {
    name: Name;
    objects: T;
    scalars: T;
}

export type TypeMapFields<FieldType extends Record<string, AnyType>> = {
    readonly [K in keyof FieldType]: AnyType;
}

export type RemoveDBIds<T, P extends keyof AnyType> =
    T extends object
        ? T extends AnyType[]
            ? RemoveDBIds<T[number], P>[]
            : {
                [K in keyof T as K extends P ? never : K]: RemoveDBIds<T[K], P>
            }
        : T;

export type TypeMapObject = Record<string, RealPayload>;
export type ExtractScalars<T extends TypeMapPayload> = T['scalars'];
export type ExtractObjects<T extends TypeMapPayload> = T['objects'];

export type OnePayload = TypeMapPayload | null;
export type ManyPayloads = Array<TypeMapPayload>;
export type RealPayload = OnePayload | ManyPayloads;

export type HasKey<B, A extends string> = A extends keyof B ? true : false;
export type MakeFirstLetterLowercase<S extends string> = S extends `${infer F}${infer R}` ? `${Lowercase<F>}${R}` : S;
export type OmitNameProperty<Name extends string, T extends TypeMapPayload['objects']> = {
    [K in Exclude<keyof T, Name>]: T[K];
}

export type TransformPayloadWithoutRecursive<T extends TypeMapPayload, ReferenceKey extends boolean = false> = ExtractScalars<T> & TransformObjectsWithoutRecursive<ExtractObjects<T>, MakeFirstLetterLowercase<T['name']>, ReferenceKey>;
export type TransformObjectsWithoutRecursive<O extends TypeMapObject, PreviousName extends string, ReferenceKey extends boolean = false> = {
    [K in keyof O]:
        O[K] extends RealPayload
            ? O[K] extends ManyPayloads
                ? HasKey<ExtractObjects<ExcludeNull<O[K][number]>>, PreviousName> extends true
                    ? Array<
                            (ReferenceKey extends true
                                ? OmitNameProperty<`${PreviousName}Id`, ExtractScalars<ExcludeNull<O[K][number]>>>
                                : ExtractScalars<ExcludeNull<O[K][number]>>)
                        > & TransformObjectsWithoutRecursive<OmitNameProperty<PreviousName, ExtractObjects<ExcludeNull<O[K][number]>>>, MakeFirstLetterLowercase<NonNullable<O[K][number]>['name']>>
                    : Array<
                            (ReferenceKey extends true
                                ? OmitNameProperty<`${PreviousName}Id`, ExtractScalars<ExcludeNull<O[K][number]>>>
                                : ExtractScalars<ExcludeNull<O[K][number]>>)
                        & TransformObjectsWithoutRecursive<ExtractObjects<ExcludeNull<O[K][number]>>, MakeFirstLetterLowercase<NonNullable<O[K][number]>['name']>>>
                : O[K] extends OnePayload
                    ? HasKey<ExtractObjects<ExcludeNull<O[K]>>, PreviousName> extends true
                        ? (ReferenceKey extends true
                            ? OmitNameProperty<`${PreviousName}Id`, ExtractScalars<ExcludeNull<O[K]>>>
                            : ExtractScalars<ExcludeNull<O[K]>>)
                        & TransformObjectsWithoutRecursive<OmitNameProperty<PreviousName, ExtractObjects<ExcludeNull<O[K]>>>, MakeFirstLetterLowercase<NonNullable<O[K]>['name']>>
                    : (ReferenceKey extends true
                        ? OmitNameProperty<`${PreviousName}Id`, ExtractScalars<ExcludeNull<O[K]>>>
                        : OmitNameProperty<`${PreviousName}Id`, ExtractScalars<ExcludeNull<O[K]>>>)
                    & TransformObjectsWithoutRecursive<ExtractObjects<ExcludeNull<O[K]>>, MakeFirstLetterLowercase<NonNullable<O[K]>['name']>>
                : unknown
            : O[K];
}

export type TransformPayload<T extends TypeMapPayload> = ExtractScalars<T> & TransformObjects<ExtractObjects<T>>;
export type TransformObjects<O extends TypeMapObject> = {
    [K in keyof O]:
        O[K] extends RealPayload
            ? O[K] extends ManyPayloads
                ? Array<ExtractScalars<O[K][number]> & TransformObjects<ExtractObjects<O[K][number]>>>
                : O[K] extends OnePayload
                    ? ExtractScalars<ExcludeNull<O[K]>> & TransformObjects<ExtractObjects<ExcludeNull<O[K]>>>
                : unknown
            : O[K];
}
