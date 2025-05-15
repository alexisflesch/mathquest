
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Teacher
 * 
 */
export type Teacher = $Result.DefaultSelection<Prisma.$TeacherPayload>
/**
 * Model Player
 * 
 */
export type Player = $Result.DefaultSelection<Prisma.$PlayerPayload>
/**
 * Model Question
 * 
 */
export type Question = $Result.DefaultSelection<Prisma.$QuestionPayload>
/**
 * Model QuizTemplate
 * 
 */
export type QuizTemplate = $Result.DefaultSelection<Prisma.$QuizTemplatePayload>
/**
 * Model QuestionsInQuizTemplate
 * 
 */
export type QuestionsInQuizTemplate = $Result.DefaultSelection<Prisma.$QuestionsInQuizTemplatePayload>
/**
 * Model GameInstance
 * 
 */
export type GameInstance = $Result.DefaultSelection<Prisma.$GameInstancePayload>
/**
 * Model GameParticipant
 * 
 */
export type GameParticipant = $Result.DefaultSelection<Prisma.$GameParticipantPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const PlayMode: {
  class: 'class',
  tournament: 'tournament',
  practice: 'practice'
};

export type PlayMode = (typeof PlayMode)[keyof typeof PlayMode]

}

export type PlayMode = $Enums.PlayMode

export const PlayMode: typeof $Enums.PlayMode

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Teachers
 * const teachers = await prisma.teacher.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Teachers
   * const teachers = await prisma.teacher.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.teacher`: Exposes CRUD operations for the **Teacher** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Teachers
    * const teachers = await prisma.teacher.findMany()
    * ```
    */
  get teacher(): Prisma.TeacherDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.player`: Exposes CRUD operations for the **Player** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Players
    * const players = await prisma.player.findMany()
    * ```
    */
  get player(): Prisma.PlayerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.question`: Exposes CRUD operations for the **Question** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Questions
    * const questions = await prisma.question.findMany()
    * ```
    */
  get question(): Prisma.QuestionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.quizTemplate`: Exposes CRUD operations for the **QuizTemplate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuizTemplates
    * const quizTemplates = await prisma.quizTemplate.findMany()
    * ```
    */
  get quizTemplate(): Prisma.QuizTemplateDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.questionsInQuizTemplate`: Exposes CRUD operations for the **QuestionsInQuizTemplate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuestionsInQuizTemplates
    * const questionsInQuizTemplates = await prisma.questionsInQuizTemplate.findMany()
    * ```
    */
  get questionsInQuizTemplate(): Prisma.QuestionsInQuizTemplateDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.gameInstance`: Exposes CRUD operations for the **GameInstance** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GameInstances
    * const gameInstances = await prisma.gameInstance.findMany()
    * ```
    */
  get gameInstance(): Prisma.GameInstanceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.gameParticipant`: Exposes CRUD operations for the **GameParticipant** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GameParticipants
    * const gameParticipants = await prisma.gameParticipant.findMany()
    * ```
    */
  get gameParticipant(): Prisma.GameParticipantDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.7.0
   * Query Engine version: 3cff47a7f5d65c3ea74883f1d736e41d68ce91ed
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Teacher: 'Teacher',
    Player: 'Player',
    Question: 'Question',
    QuizTemplate: 'QuizTemplate',
    QuestionsInQuizTemplate: 'QuestionsInQuizTemplate',
    GameInstance: 'GameInstance',
    GameParticipant: 'GameParticipant'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "teacher" | "player" | "question" | "quizTemplate" | "questionsInQuizTemplate" | "gameInstance" | "gameParticipant"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Teacher: {
        payload: Prisma.$TeacherPayload<ExtArgs>
        fields: Prisma.TeacherFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TeacherFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TeacherFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload>
          }
          findFirst: {
            args: Prisma.TeacherFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TeacherFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload>
          }
          findMany: {
            args: Prisma.TeacherFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload>[]
          }
          create: {
            args: Prisma.TeacherCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload>
          }
          createMany: {
            args: Prisma.TeacherCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TeacherCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload>[]
          }
          delete: {
            args: Prisma.TeacherDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload>
          }
          update: {
            args: Prisma.TeacherUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload>
          }
          deleteMany: {
            args: Prisma.TeacherDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TeacherUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TeacherUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload>[]
          }
          upsert: {
            args: Prisma.TeacherUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherPayload>
          }
          aggregate: {
            args: Prisma.TeacherAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTeacher>
          }
          groupBy: {
            args: Prisma.TeacherGroupByArgs<ExtArgs>
            result: $Utils.Optional<TeacherGroupByOutputType>[]
          }
          count: {
            args: Prisma.TeacherCountArgs<ExtArgs>
            result: $Utils.Optional<TeacherCountAggregateOutputType> | number
          }
        }
      }
      Player: {
        payload: Prisma.$PlayerPayload<ExtArgs>
        fields: Prisma.PlayerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PlayerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PlayerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          findFirst: {
            args: Prisma.PlayerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PlayerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          findMany: {
            args: Prisma.PlayerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>[]
          }
          create: {
            args: Prisma.PlayerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          createMany: {
            args: Prisma.PlayerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PlayerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>[]
          }
          delete: {
            args: Prisma.PlayerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          update: {
            args: Prisma.PlayerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          deleteMany: {
            args: Prisma.PlayerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PlayerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PlayerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>[]
          }
          upsert: {
            args: Prisma.PlayerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          aggregate: {
            args: Prisma.PlayerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePlayer>
          }
          groupBy: {
            args: Prisma.PlayerGroupByArgs<ExtArgs>
            result: $Utils.Optional<PlayerGroupByOutputType>[]
          }
          count: {
            args: Prisma.PlayerCountArgs<ExtArgs>
            result: $Utils.Optional<PlayerCountAggregateOutputType> | number
          }
        }
      }
      Question: {
        payload: Prisma.$QuestionPayload<ExtArgs>
        fields: Prisma.QuestionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuestionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuestionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          findFirst: {
            args: Prisma.QuestionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuestionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          findMany: {
            args: Prisma.QuestionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>[]
          }
          create: {
            args: Prisma.QuestionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          createMany: {
            args: Prisma.QuestionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuestionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>[]
          }
          delete: {
            args: Prisma.QuestionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          update: {
            args: Prisma.QuestionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          deleteMany: {
            args: Prisma.QuestionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuestionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QuestionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>[]
          }
          upsert: {
            args: Prisma.QuestionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPayload>
          }
          aggregate: {
            args: Prisma.QuestionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuestion>
          }
          groupBy: {
            args: Prisma.QuestionGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuestionGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuestionCountArgs<ExtArgs>
            result: $Utils.Optional<QuestionCountAggregateOutputType> | number
          }
        }
      }
      QuizTemplate: {
        payload: Prisma.$QuizTemplatePayload<ExtArgs>
        fields: Prisma.QuizTemplateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuizTemplateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuizTemplateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload>
          }
          findFirst: {
            args: Prisma.QuizTemplateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuizTemplateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload>
          }
          findMany: {
            args: Prisma.QuizTemplateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload>[]
          }
          create: {
            args: Prisma.QuizTemplateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload>
          }
          createMany: {
            args: Prisma.QuizTemplateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuizTemplateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload>[]
          }
          delete: {
            args: Prisma.QuizTemplateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload>
          }
          update: {
            args: Prisma.QuizTemplateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload>
          }
          deleteMany: {
            args: Prisma.QuizTemplateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuizTemplateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QuizTemplateUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload>[]
          }
          upsert: {
            args: Prisma.QuizTemplateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuizTemplatePayload>
          }
          aggregate: {
            args: Prisma.QuizTemplateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuizTemplate>
          }
          groupBy: {
            args: Prisma.QuizTemplateGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuizTemplateGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuizTemplateCountArgs<ExtArgs>
            result: $Utils.Optional<QuizTemplateCountAggregateOutputType> | number
          }
        }
      }
      QuestionsInQuizTemplate: {
        payload: Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>
        fields: Prisma.QuestionsInQuizTemplateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuestionsInQuizTemplateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuestionsInQuizTemplateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload>
          }
          findFirst: {
            args: Prisma.QuestionsInQuizTemplateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuestionsInQuizTemplateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload>
          }
          findMany: {
            args: Prisma.QuestionsInQuizTemplateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload>[]
          }
          create: {
            args: Prisma.QuestionsInQuizTemplateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload>
          }
          createMany: {
            args: Prisma.QuestionsInQuizTemplateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuestionsInQuizTemplateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload>[]
          }
          delete: {
            args: Prisma.QuestionsInQuizTemplateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload>
          }
          update: {
            args: Prisma.QuestionsInQuizTemplateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload>
          }
          deleteMany: {
            args: Prisma.QuestionsInQuizTemplateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuestionsInQuizTemplateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QuestionsInQuizTemplateUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload>[]
          }
          upsert: {
            args: Prisma.QuestionsInQuizTemplateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInQuizTemplatePayload>
          }
          aggregate: {
            args: Prisma.QuestionsInQuizTemplateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuestionsInQuizTemplate>
          }
          groupBy: {
            args: Prisma.QuestionsInQuizTemplateGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuestionsInQuizTemplateGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuestionsInQuizTemplateCountArgs<ExtArgs>
            result: $Utils.Optional<QuestionsInQuizTemplateCountAggregateOutputType> | number
          }
        }
      }
      GameInstance: {
        payload: Prisma.$GameInstancePayload<ExtArgs>
        fields: Prisma.GameInstanceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GameInstanceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GameInstanceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload>
          }
          findFirst: {
            args: Prisma.GameInstanceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GameInstanceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload>
          }
          findMany: {
            args: Prisma.GameInstanceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload>[]
          }
          create: {
            args: Prisma.GameInstanceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload>
          }
          createMany: {
            args: Prisma.GameInstanceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GameInstanceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload>[]
          }
          delete: {
            args: Prisma.GameInstanceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload>
          }
          update: {
            args: Prisma.GameInstanceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload>
          }
          deleteMany: {
            args: Prisma.GameInstanceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GameInstanceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GameInstanceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload>[]
          }
          upsert: {
            args: Prisma.GameInstanceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameInstancePayload>
          }
          aggregate: {
            args: Prisma.GameInstanceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGameInstance>
          }
          groupBy: {
            args: Prisma.GameInstanceGroupByArgs<ExtArgs>
            result: $Utils.Optional<GameInstanceGroupByOutputType>[]
          }
          count: {
            args: Prisma.GameInstanceCountArgs<ExtArgs>
            result: $Utils.Optional<GameInstanceCountAggregateOutputType> | number
          }
        }
      }
      GameParticipant: {
        payload: Prisma.$GameParticipantPayload<ExtArgs>
        fields: Prisma.GameParticipantFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GameParticipantFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GameParticipantFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload>
          }
          findFirst: {
            args: Prisma.GameParticipantFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GameParticipantFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload>
          }
          findMany: {
            args: Prisma.GameParticipantFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload>[]
          }
          create: {
            args: Prisma.GameParticipantCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload>
          }
          createMany: {
            args: Prisma.GameParticipantCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GameParticipantCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload>[]
          }
          delete: {
            args: Prisma.GameParticipantDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload>
          }
          update: {
            args: Prisma.GameParticipantUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload>
          }
          deleteMany: {
            args: Prisma.GameParticipantDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GameParticipantUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GameParticipantUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload>[]
          }
          upsert: {
            args: Prisma.GameParticipantUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameParticipantPayload>
          }
          aggregate: {
            args: Prisma.GameParticipantAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGameParticipant>
          }
          groupBy: {
            args: Prisma.GameParticipantGroupByArgs<ExtArgs>
            result: $Utils.Optional<GameParticipantGroupByOutputType>[]
          }
          count: {
            args: Prisma.GameParticipantCountArgs<ExtArgs>
            result: $Utils.Optional<GameParticipantCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    teacher?: TeacherOmit
    player?: PlayerOmit
    question?: QuestionOmit
    quizTemplate?: QuizTemplateOmit
    questionsInQuizTemplate?: QuestionsInQuizTemplateOmit
    gameInstance?: GameInstanceOmit
    gameParticipant?: GameParticipantOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type TeacherCountOutputType
   */

  export type TeacherCountOutputType = {
    quizTemplates: number
    gameInstances: number
  }

  export type TeacherCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quizTemplates?: boolean | TeacherCountOutputTypeCountQuizTemplatesArgs
    gameInstances?: boolean | TeacherCountOutputTypeCountGameInstancesArgs
  }

  // Custom InputTypes
  /**
   * TeacherCountOutputType without action
   */
  export type TeacherCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherCountOutputType
     */
    select?: TeacherCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TeacherCountOutputType without action
   */
  export type TeacherCountOutputTypeCountQuizTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuizTemplateWhereInput
  }

  /**
   * TeacherCountOutputType without action
   */
  export type TeacherCountOutputTypeCountGameInstancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameInstanceWhereInput
  }


  /**
   * Count Type PlayerCountOutputType
   */

  export type PlayerCountOutputType = {
    gameParticipations: number
  }

  export type PlayerCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameParticipations?: boolean | PlayerCountOutputTypeCountGameParticipationsArgs
  }

  // Custom InputTypes
  /**
   * PlayerCountOutputType without action
   */
  export type PlayerCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerCountOutputType
     */
    select?: PlayerCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PlayerCountOutputType without action
   */
  export type PlayerCountOutputTypeCountGameParticipationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameParticipantWhereInput
  }


  /**
   * Count Type QuestionCountOutputType
   */

  export type QuestionCountOutputType = {
    quizTemplates: number
  }

  export type QuestionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quizTemplates?: boolean | QuestionCountOutputTypeCountQuizTemplatesArgs
  }

  // Custom InputTypes
  /**
   * QuestionCountOutputType without action
   */
  export type QuestionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionCountOutputType
     */
    select?: QuestionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * QuestionCountOutputType without action
   */
  export type QuestionCountOutputTypeCountQuizTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionsInQuizTemplateWhereInput
  }


  /**
   * Count Type QuizTemplateCountOutputType
   */

  export type QuizTemplateCountOutputType = {
    questions: number
    gameInstances: number
  }

  export type QuizTemplateCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    questions?: boolean | QuizTemplateCountOutputTypeCountQuestionsArgs
    gameInstances?: boolean | QuizTemplateCountOutputTypeCountGameInstancesArgs
  }

  // Custom InputTypes
  /**
   * QuizTemplateCountOutputType without action
   */
  export type QuizTemplateCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplateCountOutputType
     */
    select?: QuizTemplateCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * QuizTemplateCountOutputType without action
   */
  export type QuizTemplateCountOutputTypeCountQuestionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionsInQuizTemplateWhereInput
  }

  /**
   * QuizTemplateCountOutputType without action
   */
  export type QuizTemplateCountOutputTypeCountGameInstancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameInstanceWhereInput
  }


  /**
   * Count Type GameInstanceCountOutputType
   */

  export type GameInstanceCountOutputType = {
    participants: number
  }

  export type GameInstanceCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    participants?: boolean | GameInstanceCountOutputTypeCountParticipantsArgs
  }

  // Custom InputTypes
  /**
   * GameInstanceCountOutputType without action
   */
  export type GameInstanceCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstanceCountOutputType
     */
    select?: GameInstanceCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * GameInstanceCountOutputType without action
   */
  export type GameInstanceCountOutputTypeCountParticipantsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameParticipantWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Teacher
   */

  export type AggregateTeacher = {
    _count: TeacherCountAggregateOutputType | null
    _min: TeacherMinAggregateOutputType | null
    _max: TeacherMaxAggregateOutputType | null
  }

  export type TeacherMinAggregateOutputType = {
    id: string | null
    username: string | null
    passwordHash: string | null
    email: string | null
    createdAt: Date | null
    avatarUrl: string | null
    resetToken: string | null
    resetTokenExpiresAt: Date | null
  }

  export type TeacherMaxAggregateOutputType = {
    id: string | null
    username: string | null
    passwordHash: string | null
    email: string | null
    createdAt: Date | null
    avatarUrl: string | null
    resetToken: string | null
    resetTokenExpiresAt: Date | null
  }

  export type TeacherCountAggregateOutputType = {
    id: number
    username: number
    passwordHash: number
    email: number
    createdAt: number
    avatarUrl: number
    resetToken: number
    resetTokenExpiresAt: number
    _all: number
  }


  export type TeacherMinAggregateInputType = {
    id?: true
    username?: true
    passwordHash?: true
    email?: true
    createdAt?: true
    avatarUrl?: true
    resetToken?: true
    resetTokenExpiresAt?: true
  }

  export type TeacherMaxAggregateInputType = {
    id?: true
    username?: true
    passwordHash?: true
    email?: true
    createdAt?: true
    avatarUrl?: true
    resetToken?: true
    resetTokenExpiresAt?: true
  }

  export type TeacherCountAggregateInputType = {
    id?: true
    username?: true
    passwordHash?: true
    email?: true
    createdAt?: true
    avatarUrl?: true
    resetToken?: true
    resetTokenExpiresAt?: true
    _all?: true
  }

  export type TeacherAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Teacher to aggregate.
     */
    where?: TeacherWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teachers to fetch.
     */
    orderBy?: TeacherOrderByWithRelationInput | TeacherOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TeacherWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teachers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teachers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Teachers
    **/
    _count?: true | TeacherCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TeacherMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TeacherMaxAggregateInputType
  }

  export type GetTeacherAggregateType<T extends TeacherAggregateArgs> = {
        [P in keyof T & keyof AggregateTeacher]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTeacher[P]>
      : GetScalarType<T[P], AggregateTeacher[P]>
  }




  export type TeacherGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeacherWhereInput
    orderBy?: TeacherOrderByWithAggregationInput | TeacherOrderByWithAggregationInput[]
    by: TeacherScalarFieldEnum[] | TeacherScalarFieldEnum
    having?: TeacherScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TeacherCountAggregateInputType | true
    _min?: TeacherMinAggregateInputType
    _max?: TeacherMaxAggregateInputType
  }

  export type TeacherGroupByOutputType = {
    id: string
    username: string
    passwordHash: string
    email: string | null
    createdAt: Date
    avatarUrl: string | null
    resetToken: string | null
    resetTokenExpiresAt: Date | null
    _count: TeacherCountAggregateOutputType | null
    _min: TeacherMinAggregateOutputType | null
    _max: TeacherMaxAggregateOutputType | null
  }

  type GetTeacherGroupByPayload<T extends TeacherGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TeacherGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TeacherGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TeacherGroupByOutputType[P]>
            : GetScalarType<T[P], TeacherGroupByOutputType[P]>
        }
      >
    >


  export type TeacherSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    passwordHash?: boolean
    email?: boolean
    createdAt?: boolean
    avatarUrl?: boolean
    resetToken?: boolean
    resetTokenExpiresAt?: boolean
    quizTemplates?: boolean | Teacher$quizTemplatesArgs<ExtArgs>
    gameInstances?: boolean | Teacher$gameInstancesArgs<ExtArgs>
    _count?: boolean | TeacherCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["teacher"]>

  export type TeacherSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    passwordHash?: boolean
    email?: boolean
    createdAt?: boolean
    avatarUrl?: boolean
    resetToken?: boolean
    resetTokenExpiresAt?: boolean
  }, ExtArgs["result"]["teacher"]>

  export type TeacherSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    passwordHash?: boolean
    email?: boolean
    createdAt?: boolean
    avatarUrl?: boolean
    resetToken?: boolean
    resetTokenExpiresAt?: boolean
  }, ExtArgs["result"]["teacher"]>

  export type TeacherSelectScalar = {
    id?: boolean
    username?: boolean
    passwordHash?: boolean
    email?: boolean
    createdAt?: boolean
    avatarUrl?: boolean
    resetToken?: boolean
    resetTokenExpiresAt?: boolean
  }

  export type TeacherOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "username" | "passwordHash" | "email" | "createdAt" | "avatarUrl" | "resetToken" | "resetTokenExpiresAt", ExtArgs["result"]["teacher"]>
  export type TeacherInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quizTemplates?: boolean | Teacher$quizTemplatesArgs<ExtArgs>
    gameInstances?: boolean | Teacher$gameInstancesArgs<ExtArgs>
    _count?: boolean | TeacherCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TeacherIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type TeacherIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $TeacherPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Teacher"
    objects: {
      quizTemplates: Prisma.$QuizTemplatePayload<ExtArgs>[]
      gameInstances: Prisma.$GameInstancePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      username: string
      passwordHash: string
      email: string | null
      createdAt: Date
      avatarUrl: string | null
      resetToken: string | null
      resetTokenExpiresAt: Date | null
    }, ExtArgs["result"]["teacher"]>
    composites: {}
  }

  type TeacherGetPayload<S extends boolean | null | undefined | TeacherDefaultArgs> = $Result.GetResult<Prisma.$TeacherPayload, S>

  type TeacherCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TeacherFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TeacherCountAggregateInputType | true
    }

  export interface TeacherDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Teacher'], meta: { name: 'Teacher' } }
    /**
     * Find zero or one Teacher that matches the filter.
     * @param {TeacherFindUniqueArgs} args - Arguments to find a Teacher
     * @example
     * // Get one Teacher
     * const teacher = await prisma.teacher.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TeacherFindUniqueArgs>(args: SelectSubset<T, TeacherFindUniqueArgs<ExtArgs>>): Prisma__TeacherClient<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Teacher that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TeacherFindUniqueOrThrowArgs} args - Arguments to find a Teacher
     * @example
     * // Get one Teacher
     * const teacher = await prisma.teacher.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TeacherFindUniqueOrThrowArgs>(args: SelectSubset<T, TeacherFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TeacherClient<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Teacher that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherFindFirstArgs} args - Arguments to find a Teacher
     * @example
     * // Get one Teacher
     * const teacher = await prisma.teacher.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TeacherFindFirstArgs>(args?: SelectSubset<T, TeacherFindFirstArgs<ExtArgs>>): Prisma__TeacherClient<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Teacher that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherFindFirstOrThrowArgs} args - Arguments to find a Teacher
     * @example
     * // Get one Teacher
     * const teacher = await prisma.teacher.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TeacherFindFirstOrThrowArgs>(args?: SelectSubset<T, TeacherFindFirstOrThrowArgs<ExtArgs>>): Prisma__TeacherClient<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Teachers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Teachers
     * const teachers = await prisma.teacher.findMany()
     * 
     * // Get first 10 Teachers
     * const teachers = await prisma.teacher.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const teacherWithIdOnly = await prisma.teacher.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TeacherFindManyArgs>(args?: SelectSubset<T, TeacherFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Teacher.
     * @param {TeacherCreateArgs} args - Arguments to create a Teacher.
     * @example
     * // Create one Teacher
     * const Teacher = await prisma.teacher.create({
     *   data: {
     *     // ... data to create a Teacher
     *   }
     * })
     * 
     */
    create<T extends TeacherCreateArgs>(args: SelectSubset<T, TeacherCreateArgs<ExtArgs>>): Prisma__TeacherClient<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Teachers.
     * @param {TeacherCreateManyArgs} args - Arguments to create many Teachers.
     * @example
     * // Create many Teachers
     * const teacher = await prisma.teacher.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TeacherCreateManyArgs>(args?: SelectSubset<T, TeacherCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Teachers and returns the data saved in the database.
     * @param {TeacherCreateManyAndReturnArgs} args - Arguments to create many Teachers.
     * @example
     * // Create many Teachers
     * const teacher = await prisma.teacher.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Teachers and only return the `id`
     * const teacherWithIdOnly = await prisma.teacher.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TeacherCreateManyAndReturnArgs>(args?: SelectSubset<T, TeacherCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Teacher.
     * @param {TeacherDeleteArgs} args - Arguments to delete one Teacher.
     * @example
     * // Delete one Teacher
     * const Teacher = await prisma.teacher.delete({
     *   where: {
     *     // ... filter to delete one Teacher
     *   }
     * })
     * 
     */
    delete<T extends TeacherDeleteArgs>(args: SelectSubset<T, TeacherDeleteArgs<ExtArgs>>): Prisma__TeacherClient<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Teacher.
     * @param {TeacherUpdateArgs} args - Arguments to update one Teacher.
     * @example
     * // Update one Teacher
     * const teacher = await prisma.teacher.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TeacherUpdateArgs>(args: SelectSubset<T, TeacherUpdateArgs<ExtArgs>>): Prisma__TeacherClient<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Teachers.
     * @param {TeacherDeleteManyArgs} args - Arguments to filter Teachers to delete.
     * @example
     * // Delete a few Teachers
     * const { count } = await prisma.teacher.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TeacherDeleteManyArgs>(args?: SelectSubset<T, TeacherDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Teachers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Teachers
     * const teacher = await prisma.teacher.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TeacherUpdateManyArgs>(args: SelectSubset<T, TeacherUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Teachers and returns the data updated in the database.
     * @param {TeacherUpdateManyAndReturnArgs} args - Arguments to update many Teachers.
     * @example
     * // Update many Teachers
     * const teacher = await prisma.teacher.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Teachers and only return the `id`
     * const teacherWithIdOnly = await prisma.teacher.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TeacherUpdateManyAndReturnArgs>(args: SelectSubset<T, TeacherUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Teacher.
     * @param {TeacherUpsertArgs} args - Arguments to update or create a Teacher.
     * @example
     * // Update or create a Teacher
     * const teacher = await prisma.teacher.upsert({
     *   create: {
     *     // ... data to create a Teacher
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Teacher we want to update
     *   }
     * })
     */
    upsert<T extends TeacherUpsertArgs>(args: SelectSubset<T, TeacherUpsertArgs<ExtArgs>>): Prisma__TeacherClient<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Teachers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherCountArgs} args - Arguments to filter Teachers to count.
     * @example
     * // Count the number of Teachers
     * const count = await prisma.teacher.count({
     *   where: {
     *     // ... the filter for the Teachers we want to count
     *   }
     * })
    **/
    count<T extends TeacherCountArgs>(
      args?: Subset<T, TeacherCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TeacherCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Teacher.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TeacherAggregateArgs>(args: Subset<T, TeacherAggregateArgs>): Prisma.PrismaPromise<GetTeacherAggregateType<T>>

    /**
     * Group by Teacher.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TeacherGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TeacherGroupByArgs['orderBy'] }
        : { orderBy?: TeacherGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TeacherGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTeacherGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Teacher model
   */
  readonly fields: TeacherFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Teacher.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TeacherClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quizTemplates<T extends Teacher$quizTemplatesArgs<ExtArgs> = {}>(args?: Subset<T, Teacher$quizTemplatesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    gameInstances<T extends Teacher$gameInstancesArgs<ExtArgs> = {}>(args?: Subset<T, Teacher$gameInstancesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Teacher model
   */
  interface TeacherFieldRefs {
    readonly id: FieldRef<"Teacher", 'String'>
    readonly username: FieldRef<"Teacher", 'String'>
    readonly passwordHash: FieldRef<"Teacher", 'String'>
    readonly email: FieldRef<"Teacher", 'String'>
    readonly createdAt: FieldRef<"Teacher", 'DateTime'>
    readonly avatarUrl: FieldRef<"Teacher", 'String'>
    readonly resetToken: FieldRef<"Teacher", 'String'>
    readonly resetTokenExpiresAt: FieldRef<"Teacher", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Teacher findUnique
   */
  export type TeacherFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
    /**
     * Filter, which Teacher to fetch.
     */
    where: TeacherWhereUniqueInput
  }

  /**
   * Teacher findUniqueOrThrow
   */
  export type TeacherFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
    /**
     * Filter, which Teacher to fetch.
     */
    where: TeacherWhereUniqueInput
  }

  /**
   * Teacher findFirst
   */
  export type TeacherFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
    /**
     * Filter, which Teacher to fetch.
     */
    where?: TeacherWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teachers to fetch.
     */
    orderBy?: TeacherOrderByWithRelationInput | TeacherOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Teachers.
     */
    cursor?: TeacherWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teachers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teachers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Teachers.
     */
    distinct?: TeacherScalarFieldEnum | TeacherScalarFieldEnum[]
  }

  /**
   * Teacher findFirstOrThrow
   */
  export type TeacherFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
    /**
     * Filter, which Teacher to fetch.
     */
    where?: TeacherWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teachers to fetch.
     */
    orderBy?: TeacherOrderByWithRelationInput | TeacherOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Teachers.
     */
    cursor?: TeacherWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teachers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teachers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Teachers.
     */
    distinct?: TeacherScalarFieldEnum | TeacherScalarFieldEnum[]
  }

  /**
   * Teacher findMany
   */
  export type TeacherFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
    /**
     * Filter, which Teachers to fetch.
     */
    where?: TeacherWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teachers to fetch.
     */
    orderBy?: TeacherOrderByWithRelationInput | TeacherOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Teachers.
     */
    cursor?: TeacherWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teachers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teachers.
     */
    skip?: number
    distinct?: TeacherScalarFieldEnum | TeacherScalarFieldEnum[]
  }

  /**
   * Teacher create
   */
  export type TeacherCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
    /**
     * The data needed to create a Teacher.
     */
    data: XOR<TeacherCreateInput, TeacherUncheckedCreateInput>
  }

  /**
   * Teacher createMany
   */
  export type TeacherCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Teachers.
     */
    data: TeacherCreateManyInput | TeacherCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Teacher createManyAndReturn
   */
  export type TeacherCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * The data used to create many Teachers.
     */
    data: TeacherCreateManyInput | TeacherCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Teacher update
   */
  export type TeacherUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
    /**
     * The data needed to update a Teacher.
     */
    data: XOR<TeacherUpdateInput, TeacherUncheckedUpdateInput>
    /**
     * Choose, which Teacher to update.
     */
    where: TeacherWhereUniqueInput
  }

  /**
   * Teacher updateMany
   */
  export type TeacherUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Teachers.
     */
    data: XOR<TeacherUpdateManyMutationInput, TeacherUncheckedUpdateManyInput>
    /**
     * Filter which Teachers to update
     */
    where?: TeacherWhereInput
    /**
     * Limit how many Teachers to update.
     */
    limit?: number
  }

  /**
   * Teacher updateManyAndReturn
   */
  export type TeacherUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * The data used to update Teachers.
     */
    data: XOR<TeacherUpdateManyMutationInput, TeacherUncheckedUpdateManyInput>
    /**
     * Filter which Teachers to update
     */
    where?: TeacherWhereInput
    /**
     * Limit how many Teachers to update.
     */
    limit?: number
  }

  /**
   * Teacher upsert
   */
  export type TeacherUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
    /**
     * The filter to search for the Teacher to update in case it exists.
     */
    where: TeacherWhereUniqueInput
    /**
     * In case the Teacher found by the `where` argument doesn't exist, create a new Teacher with this data.
     */
    create: XOR<TeacherCreateInput, TeacherUncheckedCreateInput>
    /**
     * In case the Teacher was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TeacherUpdateInput, TeacherUncheckedUpdateInput>
  }

  /**
   * Teacher delete
   */
  export type TeacherDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
    /**
     * Filter which Teacher to delete.
     */
    where: TeacherWhereUniqueInput
  }

  /**
   * Teacher deleteMany
   */
  export type TeacherDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Teachers to delete
     */
    where?: TeacherWhereInput
    /**
     * Limit how many Teachers to delete.
     */
    limit?: number
  }

  /**
   * Teacher.quizTemplates
   */
  export type Teacher$quizTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
    where?: QuizTemplateWhereInput
    orderBy?: QuizTemplateOrderByWithRelationInput | QuizTemplateOrderByWithRelationInput[]
    cursor?: QuizTemplateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuizTemplateScalarFieldEnum | QuizTemplateScalarFieldEnum[]
  }

  /**
   * Teacher.gameInstances
   */
  export type Teacher$gameInstancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    where?: GameInstanceWhereInput
    orderBy?: GameInstanceOrderByWithRelationInput | GameInstanceOrderByWithRelationInput[]
    cursor?: GameInstanceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GameInstanceScalarFieldEnum | GameInstanceScalarFieldEnum[]
  }

  /**
   * Teacher without action
   */
  export type TeacherDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
  }


  /**
   * Model Player
   */

  export type AggregatePlayer = {
    _count: PlayerCountAggregateOutputType | null
    _min: PlayerMinAggregateOutputType | null
    _max: PlayerMaxAggregateOutputType | null
  }

  export type PlayerMinAggregateOutputType = {
    id: string | null
    username: string | null
    cookieId: string | null
    email: string | null
    passwordHash: string | null
    createdAt: Date | null
    avatarUrl: string | null
  }

  export type PlayerMaxAggregateOutputType = {
    id: string | null
    username: string | null
    cookieId: string | null
    email: string | null
    passwordHash: string | null
    createdAt: Date | null
    avatarUrl: string | null
  }

  export type PlayerCountAggregateOutputType = {
    id: number
    username: number
    cookieId: number
    email: number
    passwordHash: number
    createdAt: number
    avatarUrl: number
    _all: number
  }


  export type PlayerMinAggregateInputType = {
    id?: true
    username?: true
    cookieId?: true
    email?: true
    passwordHash?: true
    createdAt?: true
    avatarUrl?: true
  }

  export type PlayerMaxAggregateInputType = {
    id?: true
    username?: true
    cookieId?: true
    email?: true
    passwordHash?: true
    createdAt?: true
    avatarUrl?: true
  }

  export type PlayerCountAggregateInputType = {
    id?: true
    username?: true
    cookieId?: true
    email?: true
    passwordHash?: true
    createdAt?: true
    avatarUrl?: true
    _all?: true
  }

  export type PlayerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Player to aggregate.
     */
    where?: PlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Players from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Players.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Players
    **/
    _count?: true | PlayerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PlayerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PlayerMaxAggregateInputType
  }

  export type GetPlayerAggregateType<T extends PlayerAggregateArgs> = {
        [P in keyof T & keyof AggregatePlayer]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePlayer[P]>
      : GetScalarType<T[P], AggregatePlayer[P]>
  }




  export type PlayerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlayerWhereInput
    orderBy?: PlayerOrderByWithAggregationInput | PlayerOrderByWithAggregationInput[]
    by: PlayerScalarFieldEnum[] | PlayerScalarFieldEnum
    having?: PlayerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PlayerCountAggregateInputType | true
    _min?: PlayerMinAggregateInputType
    _max?: PlayerMaxAggregateInputType
  }

  export type PlayerGroupByOutputType = {
    id: string
    username: string
    cookieId: string
    email: string | null
    passwordHash: string | null
    createdAt: Date
    avatarUrl: string | null
    _count: PlayerCountAggregateOutputType | null
    _min: PlayerMinAggregateOutputType | null
    _max: PlayerMaxAggregateOutputType | null
  }

  type GetPlayerGroupByPayload<T extends PlayerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PlayerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PlayerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PlayerGroupByOutputType[P]>
            : GetScalarType<T[P], PlayerGroupByOutputType[P]>
        }
      >
    >


  export type PlayerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    cookieId?: boolean
    email?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    avatarUrl?: boolean
    gameParticipations?: boolean | Player$gameParticipationsArgs<ExtArgs>
    _count?: boolean | PlayerCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["player"]>

  export type PlayerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    cookieId?: boolean
    email?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    avatarUrl?: boolean
  }, ExtArgs["result"]["player"]>

  export type PlayerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    cookieId?: boolean
    email?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    avatarUrl?: boolean
  }, ExtArgs["result"]["player"]>

  export type PlayerSelectScalar = {
    id?: boolean
    username?: boolean
    cookieId?: boolean
    email?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    avatarUrl?: boolean
  }

  export type PlayerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "username" | "cookieId" | "email" | "passwordHash" | "createdAt" | "avatarUrl", ExtArgs["result"]["player"]>
  export type PlayerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameParticipations?: boolean | Player$gameParticipationsArgs<ExtArgs>
    _count?: boolean | PlayerCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PlayerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type PlayerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PlayerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Player"
    objects: {
      gameParticipations: Prisma.$GameParticipantPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      username: string
      cookieId: string
      email: string | null
      passwordHash: string | null
      createdAt: Date
      avatarUrl: string | null
    }, ExtArgs["result"]["player"]>
    composites: {}
  }

  type PlayerGetPayload<S extends boolean | null | undefined | PlayerDefaultArgs> = $Result.GetResult<Prisma.$PlayerPayload, S>

  type PlayerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PlayerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PlayerCountAggregateInputType | true
    }

  export interface PlayerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Player'], meta: { name: 'Player' } }
    /**
     * Find zero or one Player that matches the filter.
     * @param {PlayerFindUniqueArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PlayerFindUniqueArgs>(args: SelectSubset<T, PlayerFindUniqueArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Player that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PlayerFindUniqueOrThrowArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PlayerFindUniqueOrThrowArgs>(args: SelectSubset<T, PlayerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Player that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerFindFirstArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PlayerFindFirstArgs>(args?: SelectSubset<T, PlayerFindFirstArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Player that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerFindFirstOrThrowArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PlayerFindFirstOrThrowArgs>(args?: SelectSubset<T, PlayerFindFirstOrThrowArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Players that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Players
     * const players = await prisma.player.findMany()
     * 
     * // Get first 10 Players
     * const players = await prisma.player.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const playerWithIdOnly = await prisma.player.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PlayerFindManyArgs>(args?: SelectSubset<T, PlayerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Player.
     * @param {PlayerCreateArgs} args - Arguments to create a Player.
     * @example
     * // Create one Player
     * const Player = await prisma.player.create({
     *   data: {
     *     // ... data to create a Player
     *   }
     * })
     * 
     */
    create<T extends PlayerCreateArgs>(args: SelectSubset<T, PlayerCreateArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Players.
     * @param {PlayerCreateManyArgs} args - Arguments to create many Players.
     * @example
     * // Create many Players
     * const player = await prisma.player.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PlayerCreateManyArgs>(args?: SelectSubset<T, PlayerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Players and returns the data saved in the database.
     * @param {PlayerCreateManyAndReturnArgs} args - Arguments to create many Players.
     * @example
     * // Create many Players
     * const player = await prisma.player.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Players and only return the `id`
     * const playerWithIdOnly = await prisma.player.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PlayerCreateManyAndReturnArgs>(args?: SelectSubset<T, PlayerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Player.
     * @param {PlayerDeleteArgs} args - Arguments to delete one Player.
     * @example
     * // Delete one Player
     * const Player = await prisma.player.delete({
     *   where: {
     *     // ... filter to delete one Player
     *   }
     * })
     * 
     */
    delete<T extends PlayerDeleteArgs>(args: SelectSubset<T, PlayerDeleteArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Player.
     * @param {PlayerUpdateArgs} args - Arguments to update one Player.
     * @example
     * // Update one Player
     * const player = await prisma.player.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PlayerUpdateArgs>(args: SelectSubset<T, PlayerUpdateArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Players.
     * @param {PlayerDeleteManyArgs} args - Arguments to filter Players to delete.
     * @example
     * // Delete a few Players
     * const { count } = await prisma.player.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PlayerDeleteManyArgs>(args?: SelectSubset<T, PlayerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Players.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Players
     * const player = await prisma.player.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PlayerUpdateManyArgs>(args: SelectSubset<T, PlayerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Players and returns the data updated in the database.
     * @param {PlayerUpdateManyAndReturnArgs} args - Arguments to update many Players.
     * @example
     * // Update many Players
     * const player = await prisma.player.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Players and only return the `id`
     * const playerWithIdOnly = await prisma.player.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PlayerUpdateManyAndReturnArgs>(args: SelectSubset<T, PlayerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Player.
     * @param {PlayerUpsertArgs} args - Arguments to update or create a Player.
     * @example
     * // Update or create a Player
     * const player = await prisma.player.upsert({
     *   create: {
     *     // ... data to create a Player
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Player we want to update
     *   }
     * })
     */
    upsert<T extends PlayerUpsertArgs>(args: SelectSubset<T, PlayerUpsertArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Players.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerCountArgs} args - Arguments to filter Players to count.
     * @example
     * // Count the number of Players
     * const count = await prisma.player.count({
     *   where: {
     *     // ... the filter for the Players we want to count
     *   }
     * })
    **/
    count<T extends PlayerCountArgs>(
      args?: Subset<T, PlayerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PlayerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Player.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PlayerAggregateArgs>(args: Subset<T, PlayerAggregateArgs>): Prisma.PrismaPromise<GetPlayerAggregateType<T>>

    /**
     * Group by Player.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PlayerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PlayerGroupByArgs['orderBy'] }
        : { orderBy?: PlayerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PlayerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPlayerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Player model
   */
  readonly fields: PlayerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Player.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PlayerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    gameParticipations<T extends Player$gameParticipationsArgs<ExtArgs> = {}>(args?: Subset<T, Player$gameParticipationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Player model
   */
  interface PlayerFieldRefs {
    readonly id: FieldRef<"Player", 'String'>
    readonly username: FieldRef<"Player", 'String'>
    readonly cookieId: FieldRef<"Player", 'String'>
    readonly email: FieldRef<"Player", 'String'>
    readonly passwordHash: FieldRef<"Player", 'String'>
    readonly createdAt: FieldRef<"Player", 'DateTime'>
    readonly avatarUrl: FieldRef<"Player", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Player findUnique
   */
  export type PlayerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter, which Player to fetch.
     */
    where: PlayerWhereUniqueInput
  }

  /**
   * Player findUniqueOrThrow
   */
  export type PlayerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter, which Player to fetch.
     */
    where: PlayerWhereUniqueInput
  }

  /**
   * Player findFirst
   */
  export type PlayerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter, which Player to fetch.
     */
    where?: PlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Players.
     */
    cursor?: PlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Players from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Players.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Players.
     */
    distinct?: PlayerScalarFieldEnum | PlayerScalarFieldEnum[]
  }

  /**
   * Player findFirstOrThrow
   */
  export type PlayerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter, which Player to fetch.
     */
    where?: PlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Players.
     */
    cursor?: PlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Players from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Players.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Players.
     */
    distinct?: PlayerScalarFieldEnum | PlayerScalarFieldEnum[]
  }

  /**
   * Player findMany
   */
  export type PlayerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter, which Players to fetch.
     */
    where?: PlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Players.
     */
    cursor?: PlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Players from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Players.
     */
    skip?: number
    distinct?: PlayerScalarFieldEnum | PlayerScalarFieldEnum[]
  }

  /**
   * Player create
   */
  export type PlayerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * The data needed to create a Player.
     */
    data: XOR<PlayerCreateInput, PlayerUncheckedCreateInput>
  }

  /**
   * Player createMany
   */
  export type PlayerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Players.
     */
    data: PlayerCreateManyInput | PlayerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Player createManyAndReturn
   */
  export type PlayerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * The data used to create many Players.
     */
    data: PlayerCreateManyInput | PlayerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Player update
   */
  export type PlayerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * The data needed to update a Player.
     */
    data: XOR<PlayerUpdateInput, PlayerUncheckedUpdateInput>
    /**
     * Choose, which Player to update.
     */
    where: PlayerWhereUniqueInput
  }

  /**
   * Player updateMany
   */
  export type PlayerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Players.
     */
    data: XOR<PlayerUpdateManyMutationInput, PlayerUncheckedUpdateManyInput>
    /**
     * Filter which Players to update
     */
    where?: PlayerWhereInput
    /**
     * Limit how many Players to update.
     */
    limit?: number
  }

  /**
   * Player updateManyAndReturn
   */
  export type PlayerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * The data used to update Players.
     */
    data: XOR<PlayerUpdateManyMutationInput, PlayerUncheckedUpdateManyInput>
    /**
     * Filter which Players to update
     */
    where?: PlayerWhereInput
    /**
     * Limit how many Players to update.
     */
    limit?: number
  }

  /**
   * Player upsert
   */
  export type PlayerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * The filter to search for the Player to update in case it exists.
     */
    where: PlayerWhereUniqueInput
    /**
     * In case the Player found by the `where` argument doesn't exist, create a new Player with this data.
     */
    create: XOR<PlayerCreateInput, PlayerUncheckedCreateInput>
    /**
     * In case the Player was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PlayerUpdateInput, PlayerUncheckedUpdateInput>
  }

  /**
   * Player delete
   */
  export type PlayerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter which Player to delete.
     */
    where: PlayerWhereUniqueInput
  }

  /**
   * Player deleteMany
   */
  export type PlayerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Players to delete
     */
    where?: PlayerWhereInput
    /**
     * Limit how many Players to delete.
     */
    limit?: number
  }

  /**
   * Player.gameParticipations
   */
  export type Player$gameParticipationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    where?: GameParticipantWhereInput
    orderBy?: GameParticipantOrderByWithRelationInput | GameParticipantOrderByWithRelationInput[]
    cursor?: GameParticipantWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GameParticipantScalarFieldEnum | GameParticipantScalarFieldEnum[]
  }

  /**
   * Player without action
   */
  export type PlayerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
  }


  /**
   * Model Question
   */

  export type AggregateQuestion = {
    _count: QuestionCountAggregateOutputType | null
    _avg: QuestionAvgAggregateOutputType | null
    _sum: QuestionSumAggregateOutputType | null
    _min: QuestionMinAggregateOutputType | null
    _max: QuestionMaxAggregateOutputType | null
  }

  export type QuestionAvgAggregateOutputType = {
    difficulty: number | null
    timeLimit: number | null
  }

  export type QuestionSumAggregateOutputType = {
    difficulty: number | null
    timeLimit: number | null
  }

  export type QuestionMinAggregateOutputType = {
    uid: string | null
    title: string | null
    text: string | null
    questionType: string | null
    discipline: string | null
    difficulty: number | null
    gradeLevel: string | null
    author: string | null
    explanation: string | null
    timeLimit: number | null
    isHidden: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuestionMaxAggregateOutputType = {
    uid: string | null
    title: string | null
    text: string | null
    questionType: string | null
    discipline: string | null
    difficulty: number | null
    gradeLevel: string | null
    author: string | null
    explanation: string | null
    timeLimit: number | null
    isHidden: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuestionCountAggregateOutputType = {
    uid: number
    title: number
    text: number
    responses: number
    questionType: number
    discipline: number
    themes: number
    difficulty: number
    gradeLevel: number
    author: number
    explanation: number
    tags: number
    timeLimit: number
    isHidden: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type QuestionAvgAggregateInputType = {
    difficulty?: true
    timeLimit?: true
  }

  export type QuestionSumAggregateInputType = {
    difficulty?: true
    timeLimit?: true
  }

  export type QuestionMinAggregateInputType = {
    uid?: true
    title?: true
    text?: true
    questionType?: true
    discipline?: true
    difficulty?: true
    gradeLevel?: true
    author?: true
    explanation?: true
    timeLimit?: true
    isHidden?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuestionMaxAggregateInputType = {
    uid?: true
    title?: true
    text?: true
    questionType?: true
    discipline?: true
    difficulty?: true
    gradeLevel?: true
    author?: true
    explanation?: true
    timeLimit?: true
    isHidden?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuestionCountAggregateInputType = {
    uid?: true
    title?: true
    text?: true
    responses?: true
    questionType?: true
    discipline?: true
    themes?: true
    difficulty?: true
    gradeLevel?: true
    author?: true
    explanation?: true
    tags?: true
    timeLimit?: true
    isHidden?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type QuestionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Question to aggregate.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Questions
    **/
    _count?: true | QuestionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuestionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuestionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuestionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuestionMaxAggregateInputType
  }

  export type GetQuestionAggregateType<T extends QuestionAggregateArgs> = {
        [P in keyof T & keyof AggregateQuestion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuestion[P]>
      : GetScalarType<T[P], AggregateQuestion[P]>
  }




  export type QuestionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionWhereInput
    orderBy?: QuestionOrderByWithAggregationInput | QuestionOrderByWithAggregationInput[]
    by: QuestionScalarFieldEnum[] | QuestionScalarFieldEnum
    having?: QuestionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuestionCountAggregateInputType | true
    _avg?: QuestionAvgAggregateInputType
    _sum?: QuestionSumAggregateInputType
    _min?: QuestionMinAggregateInputType
    _max?: QuestionMaxAggregateInputType
  }

  export type QuestionGroupByOutputType = {
    uid: string
    title: string | null
    text: string
    responses: JsonValue
    questionType: string
    discipline: string
    themes: string[]
    difficulty: number | null
    gradeLevel: string | null
    author: string | null
    explanation: string | null
    tags: string[]
    timeLimit: number | null
    isHidden: boolean | null
    createdAt: Date
    updatedAt: Date
    _count: QuestionCountAggregateOutputType | null
    _avg: QuestionAvgAggregateOutputType | null
    _sum: QuestionSumAggregateOutputType | null
    _min: QuestionMinAggregateOutputType | null
    _max: QuestionMaxAggregateOutputType | null
  }

  type GetQuestionGroupByPayload<T extends QuestionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuestionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuestionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuestionGroupByOutputType[P]>
            : GetScalarType<T[P], QuestionGroupByOutputType[P]>
        }
      >
    >


  export type QuestionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    uid?: boolean
    title?: boolean
    text?: boolean
    responses?: boolean
    questionType?: boolean
    discipline?: boolean
    themes?: boolean
    difficulty?: boolean
    gradeLevel?: boolean
    author?: boolean
    explanation?: boolean
    tags?: boolean
    timeLimit?: boolean
    isHidden?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quizTemplates?: boolean | Question$quizTemplatesArgs<ExtArgs>
    _count?: boolean | QuestionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["question"]>

  export type QuestionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    uid?: boolean
    title?: boolean
    text?: boolean
    responses?: boolean
    questionType?: boolean
    discipline?: boolean
    themes?: boolean
    difficulty?: boolean
    gradeLevel?: boolean
    author?: boolean
    explanation?: boolean
    tags?: boolean
    timeLimit?: boolean
    isHidden?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["question"]>

  export type QuestionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    uid?: boolean
    title?: boolean
    text?: boolean
    responses?: boolean
    questionType?: boolean
    discipline?: boolean
    themes?: boolean
    difficulty?: boolean
    gradeLevel?: boolean
    author?: boolean
    explanation?: boolean
    tags?: boolean
    timeLimit?: boolean
    isHidden?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["question"]>

  export type QuestionSelectScalar = {
    uid?: boolean
    title?: boolean
    text?: boolean
    responses?: boolean
    questionType?: boolean
    discipline?: boolean
    themes?: boolean
    difficulty?: boolean
    gradeLevel?: boolean
    author?: boolean
    explanation?: boolean
    tags?: boolean
    timeLimit?: boolean
    isHidden?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type QuestionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"uid" | "title" | "text" | "responses" | "questionType" | "discipline" | "themes" | "difficulty" | "gradeLevel" | "author" | "explanation" | "tags" | "timeLimit" | "isHidden" | "createdAt" | "updatedAt", ExtArgs["result"]["question"]>
  export type QuestionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quizTemplates?: boolean | Question$quizTemplatesArgs<ExtArgs>
    _count?: boolean | QuestionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type QuestionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type QuestionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $QuestionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Question"
    objects: {
      quizTemplates: Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      uid: string
      title: string | null
      text: string
      responses: Prisma.JsonValue
      questionType: string
      discipline: string
      themes: string[]
      difficulty: number | null
      gradeLevel: string | null
      author: string | null
      explanation: string | null
      tags: string[]
      timeLimit: number | null
      isHidden: boolean | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["question"]>
    composites: {}
  }

  type QuestionGetPayload<S extends boolean | null | undefined | QuestionDefaultArgs> = $Result.GetResult<Prisma.$QuestionPayload, S>

  type QuestionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QuestionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QuestionCountAggregateInputType | true
    }

  export interface QuestionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Question'], meta: { name: 'Question' } }
    /**
     * Find zero or one Question that matches the filter.
     * @param {QuestionFindUniqueArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuestionFindUniqueArgs>(args: SelectSubset<T, QuestionFindUniqueArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Question that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QuestionFindUniqueOrThrowArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuestionFindUniqueOrThrowArgs>(args: SelectSubset<T, QuestionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Question that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionFindFirstArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuestionFindFirstArgs>(args?: SelectSubset<T, QuestionFindFirstArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Question that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionFindFirstOrThrowArgs} args - Arguments to find a Question
     * @example
     * // Get one Question
     * const question = await prisma.question.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuestionFindFirstOrThrowArgs>(args?: SelectSubset<T, QuestionFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Questions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Questions
     * const questions = await prisma.question.findMany()
     * 
     * // Get first 10 Questions
     * const questions = await prisma.question.findMany({ take: 10 })
     * 
     * // Only select the `uid`
     * const questionWithUidOnly = await prisma.question.findMany({ select: { uid: true } })
     * 
     */
    findMany<T extends QuestionFindManyArgs>(args?: SelectSubset<T, QuestionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Question.
     * @param {QuestionCreateArgs} args - Arguments to create a Question.
     * @example
     * // Create one Question
     * const Question = await prisma.question.create({
     *   data: {
     *     // ... data to create a Question
     *   }
     * })
     * 
     */
    create<T extends QuestionCreateArgs>(args: SelectSubset<T, QuestionCreateArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Questions.
     * @param {QuestionCreateManyArgs} args - Arguments to create many Questions.
     * @example
     * // Create many Questions
     * const question = await prisma.question.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuestionCreateManyArgs>(args?: SelectSubset<T, QuestionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Questions and returns the data saved in the database.
     * @param {QuestionCreateManyAndReturnArgs} args - Arguments to create many Questions.
     * @example
     * // Create many Questions
     * const question = await prisma.question.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Questions and only return the `uid`
     * const questionWithUidOnly = await prisma.question.createManyAndReturn({
     *   select: { uid: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuestionCreateManyAndReturnArgs>(args?: SelectSubset<T, QuestionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Question.
     * @param {QuestionDeleteArgs} args - Arguments to delete one Question.
     * @example
     * // Delete one Question
     * const Question = await prisma.question.delete({
     *   where: {
     *     // ... filter to delete one Question
     *   }
     * })
     * 
     */
    delete<T extends QuestionDeleteArgs>(args: SelectSubset<T, QuestionDeleteArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Question.
     * @param {QuestionUpdateArgs} args - Arguments to update one Question.
     * @example
     * // Update one Question
     * const question = await prisma.question.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuestionUpdateArgs>(args: SelectSubset<T, QuestionUpdateArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Questions.
     * @param {QuestionDeleteManyArgs} args - Arguments to filter Questions to delete.
     * @example
     * // Delete a few Questions
     * const { count } = await prisma.question.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuestionDeleteManyArgs>(args?: SelectSubset<T, QuestionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Questions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Questions
     * const question = await prisma.question.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuestionUpdateManyArgs>(args: SelectSubset<T, QuestionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Questions and returns the data updated in the database.
     * @param {QuestionUpdateManyAndReturnArgs} args - Arguments to update many Questions.
     * @example
     * // Update many Questions
     * const question = await prisma.question.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Questions and only return the `uid`
     * const questionWithUidOnly = await prisma.question.updateManyAndReturn({
     *   select: { uid: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends QuestionUpdateManyAndReturnArgs>(args: SelectSubset<T, QuestionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Question.
     * @param {QuestionUpsertArgs} args - Arguments to update or create a Question.
     * @example
     * // Update or create a Question
     * const question = await prisma.question.upsert({
     *   create: {
     *     // ... data to create a Question
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Question we want to update
     *   }
     * })
     */
    upsert<T extends QuestionUpsertArgs>(args: SelectSubset<T, QuestionUpsertArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Questions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionCountArgs} args - Arguments to filter Questions to count.
     * @example
     * // Count the number of Questions
     * const count = await prisma.question.count({
     *   where: {
     *     // ... the filter for the Questions we want to count
     *   }
     * })
    **/
    count<T extends QuestionCountArgs>(
      args?: Subset<T, QuestionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuestionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Question.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuestionAggregateArgs>(args: Subset<T, QuestionAggregateArgs>): Prisma.PrismaPromise<GetQuestionAggregateType<T>>

    /**
     * Group by Question.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuestionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuestionGroupByArgs['orderBy'] }
        : { orderBy?: QuestionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuestionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuestionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Question model
   */
  readonly fields: QuestionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Question.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuestionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quizTemplates<T extends Question$quizTemplatesArgs<ExtArgs> = {}>(args?: Subset<T, Question$quizTemplatesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Question model
   */
  interface QuestionFieldRefs {
    readonly uid: FieldRef<"Question", 'String'>
    readonly title: FieldRef<"Question", 'String'>
    readonly text: FieldRef<"Question", 'String'>
    readonly responses: FieldRef<"Question", 'Json'>
    readonly questionType: FieldRef<"Question", 'String'>
    readonly discipline: FieldRef<"Question", 'String'>
    readonly themes: FieldRef<"Question", 'String[]'>
    readonly difficulty: FieldRef<"Question", 'Int'>
    readonly gradeLevel: FieldRef<"Question", 'String'>
    readonly author: FieldRef<"Question", 'String'>
    readonly explanation: FieldRef<"Question", 'String'>
    readonly tags: FieldRef<"Question", 'String[]'>
    readonly timeLimit: FieldRef<"Question", 'Int'>
    readonly isHidden: FieldRef<"Question", 'Boolean'>
    readonly createdAt: FieldRef<"Question", 'DateTime'>
    readonly updatedAt: FieldRef<"Question", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Question findUnique
   */
  export type QuestionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question findUniqueOrThrow
   */
  export type QuestionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question findFirst
   */
  export type QuestionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Questions.
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Questions.
     */
    distinct?: QuestionScalarFieldEnum | QuestionScalarFieldEnum[]
  }

  /**
   * Question findFirstOrThrow
   */
  export type QuestionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Question to fetch.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Questions.
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Questions.
     */
    distinct?: QuestionScalarFieldEnum | QuestionScalarFieldEnum[]
  }

  /**
   * Question findMany
   */
  export type QuestionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter, which Questions to fetch.
     */
    where?: QuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Questions to fetch.
     */
    orderBy?: QuestionOrderByWithRelationInput | QuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Questions.
     */
    cursor?: QuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Questions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Questions.
     */
    skip?: number
    distinct?: QuestionScalarFieldEnum | QuestionScalarFieldEnum[]
  }

  /**
   * Question create
   */
  export type QuestionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * The data needed to create a Question.
     */
    data: XOR<QuestionCreateInput, QuestionUncheckedCreateInput>
  }

  /**
   * Question createMany
   */
  export type QuestionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Questions.
     */
    data: QuestionCreateManyInput | QuestionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Question createManyAndReturn
   */
  export type QuestionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * The data used to create many Questions.
     */
    data: QuestionCreateManyInput | QuestionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Question update
   */
  export type QuestionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * The data needed to update a Question.
     */
    data: XOR<QuestionUpdateInput, QuestionUncheckedUpdateInput>
    /**
     * Choose, which Question to update.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question updateMany
   */
  export type QuestionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Questions.
     */
    data: XOR<QuestionUpdateManyMutationInput, QuestionUncheckedUpdateManyInput>
    /**
     * Filter which Questions to update
     */
    where?: QuestionWhereInput
    /**
     * Limit how many Questions to update.
     */
    limit?: number
  }

  /**
   * Question updateManyAndReturn
   */
  export type QuestionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * The data used to update Questions.
     */
    data: XOR<QuestionUpdateManyMutationInput, QuestionUncheckedUpdateManyInput>
    /**
     * Filter which Questions to update
     */
    where?: QuestionWhereInput
    /**
     * Limit how many Questions to update.
     */
    limit?: number
  }

  /**
   * Question upsert
   */
  export type QuestionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * The filter to search for the Question to update in case it exists.
     */
    where: QuestionWhereUniqueInput
    /**
     * In case the Question found by the `where` argument doesn't exist, create a new Question with this data.
     */
    create: XOR<QuestionCreateInput, QuestionUncheckedCreateInput>
    /**
     * In case the Question was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuestionUpdateInput, QuestionUncheckedUpdateInput>
  }

  /**
   * Question delete
   */
  export type QuestionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
    /**
     * Filter which Question to delete.
     */
    where: QuestionWhereUniqueInput
  }

  /**
   * Question deleteMany
   */
  export type QuestionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Questions to delete
     */
    where?: QuestionWhereInput
    /**
     * Limit how many Questions to delete.
     */
    limit?: number
  }

  /**
   * Question.quizTemplates
   */
  export type Question$quizTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    where?: QuestionsInQuizTemplateWhereInput
    orderBy?: QuestionsInQuizTemplateOrderByWithRelationInput | QuestionsInQuizTemplateOrderByWithRelationInput[]
    cursor?: QuestionsInQuizTemplateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuestionsInQuizTemplateScalarFieldEnum | QuestionsInQuizTemplateScalarFieldEnum[]
  }

  /**
   * Question without action
   */
  export type QuestionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Question
     */
    select?: QuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Question
     */
    omit?: QuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionInclude<ExtArgs> | null
  }


  /**
   * Model QuizTemplate
   */

  export type AggregateQuizTemplate = {
    _count: QuizTemplateCountAggregateOutputType | null
    _min: QuizTemplateMinAggregateOutputType | null
    _max: QuizTemplateMaxAggregateOutputType | null
  }

  export type QuizTemplateMinAggregateOutputType = {
    id: string | null
    name: string | null
    creatorTeacherId: string | null
    gradeLevel: string | null
    discipline: string | null
    description: string | null
    defaultMode: $Enums.PlayMode | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuizTemplateMaxAggregateOutputType = {
    id: string | null
    name: string | null
    creatorTeacherId: string | null
    gradeLevel: string | null
    discipline: string | null
    description: string | null
    defaultMode: $Enums.PlayMode | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuizTemplateCountAggregateOutputType = {
    id: number
    name: number
    creatorTeacherId: number
    gradeLevel: number
    themes: number
    discipline: number
    description: number
    defaultMode: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type QuizTemplateMinAggregateInputType = {
    id?: true
    name?: true
    creatorTeacherId?: true
    gradeLevel?: true
    discipline?: true
    description?: true
    defaultMode?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuizTemplateMaxAggregateInputType = {
    id?: true
    name?: true
    creatorTeacherId?: true
    gradeLevel?: true
    discipline?: true
    description?: true
    defaultMode?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuizTemplateCountAggregateInputType = {
    id?: true
    name?: true
    creatorTeacherId?: true
    gradeLevel?: true
    themes?: true
    discipline?: true
    description?: true
    defaultMode?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type QuizTemplateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuizTemplate to aggregate.
     */
    where?: QuizTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizTemplates to fetch.
     */
    orderBy?: QuizTemplateOrderByWithRelationInput | QuizTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuizTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuizTemplates
    **/
    _count?: true | QuizTemplateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuizTemplateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuizTemplateMaxAggregateInputType
  }

  export type GetQuizTemplateAggregateType<T extends QuizTemplateAggregateArgs> = {
        [P in keyof T & keyof AggregateQuizTemplate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuizTemplate[P]>
      : GetScalarType<T[P], AggregateQuizTemplate[P]>
  }




  export type QuizTemplateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuizTemplateWhereInput
    orderBy?: QuizTemplateOrderByWithAggregationInput | QuizTemplateOrderByWithAggregationInput[]
    by: QuizTemplateScalarFieldEnum[] | QuizTemplateScalarFieldEnum
    having?: QuizTemplateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuizTemplateCountAggregateInputType | true
    _min?: QuizTemplateMinAggregateInputType
    _max?: QuizTemplateMaxAggregateInputType
  }

  export type QuizTemplateGroupByOutputType = {
    id: string
    name: string
    creatorTeacherId: string
    gradeLevel: string | null
    themes: string[]
    discipline: string | null
    description: string | null
    defaultMode: $Enums.PlayMode | null
    createdAt: Date
    updatedAt: Date
    _count: QuizTemplateCountAggregateOutputType | null
    _min: QuizTemplateMinAggregateOutputType | null
    _max: QuizTemplateMaxAggregateOutputType | null
  }

  type GetQuizTemplateGroupByPayload<T extends QuizTemplateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuizTemplateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuizTemplateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuizTemplateGroupByOutputType[P]>
            : GetScalarType<T[P], QuizTemplateGroupByOutputType[P]>
        }
      >
    >


  export type QuizTemplateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    creatorTeacherId?: boolean
    gradeLevel?: boolean
    themes?: boolean
    discipline?: boolean
    description?: boolean
    defaultMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creatorTeacher?: boolean | TeacherDefaultArgs<ExtArgs>
    questions?: boolean | QuizTemplate$questionsArgs<ExtArgs>
    gameInstances?: boolean | QuizTemplate$gameInstancesArgs<ExtArgs>
    _count?: boolean | QuizTemplateCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quizTemplate"]>

  export type QuizTemplateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    creatorTeacherId?: boolean
    gradeLevel?: boolean
    themes?: boolean
    discipline?: boolean
    description?: boolean
    defaultMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creatorTeacher?: boolean | TeacherDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quizTemplate"]>

  export type QuizTemplateSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    creatorTeacherId?: boolean
    gradeLevel?: boolean
    themes?: boolean
    discipline?: boolean
    description?: boolean
    defaultMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creatorTeacher?: boolean | TeacherDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quizTemplate"]>

  export type QuizTemplateSelectScalar = {
    id?: boolean
    name?: boolean
    creatorTeacherId?: boolean
    gradeLevel?: boolean
    themes?: boolean
    discipline?: boolean
    description?: boolean
    defaultMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type QuizTemplateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "creatorTeacherId" | "gradeLevel" | "themes" | "discipline" | "description" | "defaultMode" | "createdAt" | "updatedAt", ExtArgs["result"]["quizTemplate"]>
  export type QuizTemplateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creatorTeacher?: boolean | TeacherDefaultArgs<ExtArgs>
    questions?: boolean | QuizTemplate$questionsArgs<ExtArgs>
    gameInstances?: boolean | QuizTemplate$gameInstancesArgs<ExtArgs>
    _count?: boolean | QuizTemplateCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type QuizTemplateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creatorTeacher?: boolean | TeacherDefaultArgs<ExtArgs>
  }
  export type QuizTemplateIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creatorTeacher?: boolean | TeacherDefaultArgs<ExtArgs>
  }

  export type $QuizTemplatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuizTemplate"
    objects: {
      creatorTeacher: Prisma.$TeacherPayload<ExtArgs>
      questions: Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>[]
      gameInstances: Prisma.$GameInstancePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      creatorTeacherId: string
      gradeLevel: string | null
      themes: string[]
      discipline: string | null
      description: string | null
      defaultMode: $Enums.PlayMode | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["quizTemplate"]>
    composites: {}
  }

  type QuizTemplateGetPayload<S extends boolean | null | undefined | QuizTemplateDefaultArgs> = $Result.GetResult<Prisma.$QuizTemplatePayload, S>

  type QuizTemplateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QuizTemplateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QuizTemplateCountAggregateInputType | true
    }

  export interface QuizTemplateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuizTemplate'], meta: { name: 'QuizTemplate' } }
    /**
     * Find zero or one QuizTemplate that matches the filter.
     * @param {QuizTemplateFindUniqueArgs} args - Arguments to find a QuizTemplate
     * @example
     * // Get one QuizTemplate
     * const quizTemplate = await prisma.quizTemplate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuizTemplateFindUniqueArgs>(args: SelectSubset<T, QuizTemplateFindUniqueArgs<ExtArgs>>): Prisma__QuizTemplateClient<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one QuizTemplate that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QuizTemplateFindUniqueOrThrowArgs} args - Arguments to find a QuizTemplate
     * @example
     * // Get one QuizTemplate
     * const quizTemplate = await prisma.quizTemplate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuizTemplateFindUniqueOrThrowArgs>(args: SelectSubset<T, QuizTemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuizTemplateClient<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuizTemplate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizTemplateFindFirstArgs} args - Arguments to find a QuizTemplate
     * @example
     * // Get one QuizTemplate
     * const quizTemplate = await prisma.quizTemplate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuizTemplateFindFirstArgs>(args?: SelectSubset<T, QuizTemplateFindFirstArgs<ExtArgs>>): Prisma__QuizTemplateClient<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuizTemplate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizTemplateFindFirstOrThrowArgs} args - Arguments to find a QuizTemplate
     * @example
     * // Get one QuizTemplate
     * const quizTemplate = await prisma.quizTemplate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuizTemplateFindFirstOrThrowArgs>(args?: SelectSubset<T, QuizTemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuizTemplateClient<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more QuizTemplates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizTemplateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuizTemplates
     * const quizTemplates = await prisma.quizTemplate.findMany()
     * 
     * // Get first 10 QuizTemplates
     * const quizTemplates = await prisma.quizTemplate.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quizTemplateWithIdOnly = await prisma.quizTemplate.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuizTemplateFindManyArgs>(args?: SelectSubset<T, QuizTemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a QuizTemplate.
     * @param {QuizTemplateCreateArgs} args - Arguments to create a QuizTemplate.
     * @example
     * // Create one QuizTemplate
     * const QuizTemplate = await prisma.quizTemplate.create({
     *   data: {
     *     // ... data to create a QuizTemplate
     *   }
     * })
     * 
     */
    create<T extends QuizTemplateCreateArgs>(args: SelectSubset<T, QuizTemplateCreateArgs<ExtArgs>>): Prisma__QuizTemplateClient<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many QuizTemplates.
     * @param {QuizTemplateCreateManyArgs} args - Arguments to create many QuizTemplates.
     * @example
     * // Create many QuizTemplates
     * const quizTemplate = await prisma.quizTemplate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuizTemplateCreateManyArgs>(args?: SelectSubset<T, QuizTemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuizTemplates and returns the data saved in the database.
     * @param {QuizTemplateCreateManyAndReturnArgs} args - Arguments to create many QuizTemplates.
     * @example
     * // Create many QuizTemplates
     * const quizTemplate = await prisma.quizTemplate.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuizTemplates and only return the `id`
     * const quizTemplateWithIdOnly = await prisma.quizTemplate.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuizTemplateCreateManyAndReturnArgs>(args?: SelectSubset<T, QuizTemplateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a QuizTemplate.
     * @param {QuizTemplateDeleteArgs} args - Arguments to delete one QuizTemplate.
     * @example
     * // Delete one QuizTemplate
     * const QuizTemplate = await prisma.quizTemplate.delete({
     *   where: {
     *     // ... filter to delete one QuizTemplate
     *   }
     * })
     * 
     */
    delete<T extends QuizTemplateDeleteArgs>(args: SelectSubset<T, QuizTemplateDeleteArgs<ExtArgs>>): Prisma__QuizTemplateClient<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one QuizTemplate.
     * @param {QuizTemplateUpdateArgs} args - Arguments to update one QuizTemplate.
     * @example
     * // Update one QuizTemplate
     * const quizTemplate = await prisma.quizTemplate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuizTemplateUpdateArgs>(args: SelectSubset<T, QuizTemplateUpdateArgs<ExtArgs>>): Prisma__QuizTemplateClient<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more QuizTemplates.
     * @param {QuizTemplateDeleteManyArgs} args - Arguments to filter QuizTemplates to delete.
     * @example
     * // Delete a few QuizTemplates
     * const { count } = await prisma.quizTemplate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuizTemplateDeleteManyArgs>(args?: SelectSubset<T, QuizTemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuizTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizTemplateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuizTemplates
     * const quizTemplate = await prisma.quizTemplate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuizTemplateUpdateManyArgs>(args: SelectSubset<T, QuizTemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuizTemplates and returns the data updated in the database.
     * @param {QuizTemplateUpdateManyAndReturnArgs} args - Arguments to update many QuizTemplates.
     * @example
     * // Update many QuizTemplates
     * const quizTemplate = await prisma.quizTemplate.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more QuizTemplates and only return the `id`
     * const quizTemplateWithIdOnly = await prisma.quizTemplate.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends QuizTemplateUpdateManyAndReturnArgs>(args: SelectSubset<T, QuizTemplateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one QuizTemplate.
     * @param {QuizTemplateUpsertArgs} args - Arguments to update or create a QuizTemplate.
     * @example
     * // Update or create a QuizTemplate
     * const quizTemplate = await prisma.quizTemplate.upsert({
     *   create: {
     *     // ... data to create a QuizTemplate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuizTemplate we want to update
     *   }
     * })
     */
    upsert<T extends QuizTemplateUpsertArgs>(args: SelectSubset<T, QuizTemplateUpsertArgs<ExtArgs>>): Prisma__QuizTemplateClient<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of QuizTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizTemplateCountArgs} args - Arguments to filter QuizTemplates to count.
     * @example
     * // Count the number of QuizTemplates
     * const count = await prisma.quizTemplate.count({
     *   where: {
     *     // ... the filter for the QuizTemplates we want to count
     *   }
     * })
    **/
    count<T extends QuizTemplateCountArgs>(
      args?: Subset<T, QuizTemplateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuizTemplateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuizTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizTemplateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuizTemplateAggregateArgs>(args: Subset<T, QuizTemplateAggregateArgs>): Prisma.PrismaPromise<GetQuizTemplateAggregateType<T>>

    /**
     * Group by QuizTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuizTemplateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuizTemplateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuizTemplateGroupByArgs['orderBy'] }
        : { orderBy?: QuizTemplateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuizTemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuizTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuizTemplate model
   */
  readonly fields: QuizTemplateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuizTemplate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuizTemplateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    creatorTeacher<T extends TeacherDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TeacherDefaultArgs<ExtArgs>>): Prisma__TeacherClient<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    questions<T extends QuizTemplate$questionsArgs<ExtArgs> = {}>(args?: Subset<T, QuizTemplate$questionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    gameInstances<T extends QuizTemplate$gameInstancesArgs<ExtArgs> = {}>(args?: Subset<T, QuizTemplate$gameInstancesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the QuizTemplate model
   */
  interface QuizTemplateFieldRefs {
    readonly id: FieldRef<"QuizTemplate", 'String'>
    readonly name: FieldRef<"QuizTemplate", 'String'>
    readonly creatorTeacherId: FieldRef<"QuizTemplate", 'String'>
    readonly gradeLevel: FieldRef<"QuizTemplate", 'String'>
    readonly themes: FieldRef<"QuizTemplate", 'String[]'>
    readonly discipline: FieldRef<"QuizTemplate", 'String'>
    readonly description: FieldRef<"QuizTemplate", 'String'>
    readonly defaultMode: FieldRef<"QuizTemplate", 'PlayMode'>
    readonly createdAt: FieldRef<"QuizTemplate", 'DateTime'>
    readonly updatedAt: FieldRef<"QuizTemplate", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QuizTemplate findUnique
   */
  export type QuizTemplateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuizTemplate to fetch.
     */
    where: QuizTemplateWhereUniqueInput
  }

  /**
   * QuizTemplate findUniqueOrThrow
   */
  export type QuizTemplateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuizTemplate to fetch.
     */
    where: QuizTemplateWhereUniqueInput
  }

  /**
   * QuizTemplate findFirst
   */
  export type QuizTemplateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuizTemplate to fetch.
     */
    where?: QuizTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizTemplates to fetch.
     */
    orderBy?: QuizTemplateOrderByWithRelationInput | QuizTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuizTemplates.
     */
    cursor?: QuizTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuizTemplates.
     */
    distinct?: QuizTemplateScalarFieldEnum | QuizTemplateScalarFieldEnum[]
  }

  /**
   * QuizTemplate findFirstOrThrow
   */
  export type QuizTemplateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuizTemplate to fetch.
     */
    where?: QuizTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizTemplates to fetch.
     */
    orderBy?: QuizTemplateOrderByWithRelationInput | QuizTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuizTemplates.
     */
    cursor?: QuizTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuizTemplates.
     */
    distinct?: QuizTemplateScalarFieldEnum | QuizTemplateScalarFieldEnum[]
  }

  /**
   * QuizTemplate findMany
   */
  export type QuizTemplateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuizTemplates to fetch.
     */
    where?: QuizTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuizTemplates to fetch.
     */
    orderBy?: QuizTemplateOrderByWithRelationInput | QuizTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuizTemplates.
     */
    cursor?: QuizTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuizTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuizTemplates.
     */
    skip?: number
    distinct?: QuizTemplateScalarFieldEnum | QuizTemplateScalarFieldEnum[]
  }

  /**
   * QuizTemplate create
   */
  export type QuizTemplateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
    /**
     * The data needed to create a QuizTemplate.
     */
    data: XOR<QuizTemplateCreateInput, QuizTemplateUncheckedCreateInput>
  }

  /**
   * QuizTemplate createMany
   */
  export type QuizTemplateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuizTemplates.
     */
    data: QuizTemplateCreateManyInput | QuizTemplateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuizTemplate createManyAndReturn
   */
  export type QuizTemplateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * The data used to create many QuizTemplates.
     */
    data: QuizTemplateCreateManyInput | QuizTemplateCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuizTemplate update
   */
  export type QuizTemplateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
    /**
     * The data needed to update a QuizTemplate.
     */
    data: XOR<QuizTemplateUpdateInput, QuizTemplateUncheckedUpdateInput>
    /**
     * Choose, which QuizTemplate to update.
     */
    where: QuizTemplateWhereUniqueInput
  }

  /**
   * QuizTemplate updateMany
   */
  export type QuizTemplateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuizTemplates.
     */
    data: XOR<QuizTemplateUpdateManyMutationInput, QuizTemplateUncheckedUpdateManyInput>
    /**
     * Filter which QuizTemplates to update
     */
    where?: QuizTemplateWhereInput
    /**
     * Limit how many QuizTemplates to update.
     */
    limit?: number
  }

  /**
   * QuizTemplate updateManyAndReturn
   */
  export type QuizTemplateUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * The data used to update QuizTemplates.
     */
    data: XOR<QuizTemplateUpdateManyMutationInput, QuizTemplateUncheckedUpdateManyInput>
    /**
     * Filter which QuizTemplates to update
     */
    where?: QuizTemplateWhereInput
    /**
     * Limit how many QuizTemplates to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuizTemplate upsert
   */
  export type QuizTemplateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
    /**
     * The filter to search for the QuizTemplate to update in case it exists.
     */
    where: QuizTemplateWhereUniqueInput
    /**
     * In case the QuizTemplate found by the `where` argument doesn't exist, create a new QuizTemplate with this data.
     */
    create: XOR<QuizTemplateCreateInput, QuizTemplateUncheckedCreateInput>
    /**
     * In case the QuizTemplate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuizTemplateUpdateInput, QuizTemplateUncheckedUpdateInput>
  }

  /**
   * QuizTemplate delete
   */
  export type QuizTemplateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
    /**
     * Filter which QuizTemplate to delete.
     */
    where: QuizTemplateWhereUniqueInput
  }

  /**
   * QuizTemplate deleteMany
   */
  export type QuizTemplateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuizTemplates to delete
     */
    where?: QuizTemplateWhereInput
    /**
     * Limit how many QuizTemplates to delete.
     */
    limit?: number
  }

  /**
   * QuizTemplate.questions
   */
  export type QuizTemplate$questionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    where?: QuestionsInQuizTemplateWhereInput
    orderBy?: QuestionsInQuizTemplateOrderByWithRelationInput | QuestionsInQuizTemplateOrderByWithRelationInput[]
    cursor?: QuestionsInQuizTemplateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuestionsInQuizTemplateScalarFieldEnum | QuestionsInQuizTemplateScalarFieldEnum[]
  }

  /**
   * QuizTemplate.gameInstances
   */
  export type QuizTemplate$gameInstancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    where?: GameInstanceWhereInput
    orderBy?: GameInstanceOrderByWithRelationInput | GameInstanceOrderByWithRelationInput[]
    cursor?: GameInstanceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GameInstanceScalarFieldEnum | GameInstanceScalarFieldEnum[]
  }

  /**
   * QuizTemplate without action
   */
  export type QuizTemplateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuizTemplate
     */
    select?: QuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuizTemplate
     */
    omit?: QuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuizTemplateInclude<ExtArgs> | null
  }


  /**
   * Model QuestionsInQuizTemplate
   */

  export type AggregateQuestionsInQuizTemplate = {
    _count: QuestionsInQuizTemplateCountAggregateOutputType | null
    _avg: QuestionsInQuizTemplateAvgAggregateOutputType | null
    _sum: QuestionsInQuizTemplateSumAggregateOutputType | null
    _min: QuestionsInQuizTemplateMinAggregateOutputType | null
    _max: QuestionsInQuizTemplateMaxAggregateOutputType | null
  }

  export type QuestionsInQuizTemplateAvgAggregateOutputType = {
    sequence: number | null
  }

  export type QuestionsInQuizTemplateSumAggregateOutputType = {
    sequence: number | null
  }

  export type QuestionsInQuizTemplateMinAggregateOutputType = {
    quizTemplateId: string | null
    questionUid: string | null
    sequence: number | null
    createdAt: Date | null
  }

  export type QuestionsInQuizTemplateMaxAggregateOutputType = {
    quizTemplateId: string | null
    questionUid: string | null
    sequence: number | null
    createdAt: Date | null
  }

  export type QuestionsInQuizTemplateCountAggregateOutputType = {
    quizTemplateId: number
    questionUid: number
    sequence: number
    createdAt: number
    _all: number
  }


  export type QuestionsInQuizTemplateAvgAggregateInputType = {
    sequence?: true
  }

  export type QuestionsInQuizTemplateSumAggregateInputType = {
    sequence?: true
  }

  export type QuestionsInQuizTemplateMinAggregateInputType = {
    quizTemplateId?: true
    questionUid?: true
    sequence?: true
    createdAt?: true
  }

  export type QuestionsInQuizTemplateMaxAggregateInputType = {
    quizTemplateId?: true
    questionUid?: true
    sequence?: true
    createdAt?: true
  }

  export type QuestionsInQuizTemplateCountAggregateInputType = {
    quizTemplateId?: true
    questionUid?: true
    sequence?: true
    createdAt?: true
    _all?: true
  }

  export type QuestionsInQuizTemplateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuestionsInQuizTemplate to aggregate.
     */
    where?: QuestionsInQuizTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionsInQuizTemplates to fetch.
     */
    orderBy?: QuestionsInQuizTemplateOrderByWithRelationInput | QuestionsInQuizTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuestionsInQuizTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionsInQuizTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionsInQuizTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuestionsInQuizTemplates
    **/
    _count?: true | QuestionsInQuizTemplateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuestionsInQuizTemplateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuestionsInQuizTemplateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuestionsInQuizTemplateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuestionsInQuizTemplateMaxAggregateInputType
  }

  export type GetQuestionsInQuizTemplateAggregateType<T extends QuestionsInQuizTemplateAggregateArgs> = {
        [P in keyof T & keyof AggregateQuestionsInQuizTemplate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuestionsInQuizTemplate[P]>
      : GetScalarType<T[P], AggregateQuestionsInQuizTemplate[P]>
  }




  export type QuestionsInQuizTemplateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionsInQuizTemplateWhereInput
    orderBy?: QuestionsInQuizTemplateOrderByWithAggregationInput | QuestionsInQuizTemplateOrderByWithAggregationInput[]
    by: QuestionsInQuizTemplateScalarFieldEnum[] | QuestionsInQuizTemplateScalarFieldEnum
    having?: QuestionsInQuizTemplateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuestionsInQuizTemplateCountAggregateInputType | true
    _avg?: QuestionsInQuizTemplateAvgAggregateInputType
    _sum?: QuestionsInQuizTemplateSumAggregateInputType
    _min?: QuestionsInQuizTemplateMinAggregateInputType
    _max?: QuestionsInQuizTemplateMaxAggregateInputType
  }

  export type QuestionsInQuizTemplateGroupByOutputType = {
    quizTemplateId: string
    questionUid: string
    sequence: number
    createdAt: Date
    _count: QuestionsInQuizTemplateCountAggregateOutputType | null
    _avg: QuestionsInQuizTemplateAvgAggregateOutputType | null
    _sum: QuestionsInQuizTemplateSumAggregateOutputType | null
    _min: QuestionsInQuizTemplateMinAggregateOutputType | null
    _max: QuestionsInQuizTemplateMaxAggregateOutputType | null
  }

  type GetQuestionsInQuizTemplateGroupByPayload<T extends QuestionsInQuizTemplateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuestionsInQuizTemplateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuestionsInQuizTemplateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuestionsInQuizTemplateGroupByOutputType[P]>
            : GetScalarType<T[P], QuestionsInQuizTemplateGroupByOutputType[P]>
        }
      >
    >


  export type QuestionsInQuizTemplateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    quizTemplateId?: boolean
    questionUid?: boolean
    sequence?: boolean
    createdAt?: boolean
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["questionsInQuizTemplate"]>

  export type QuestionsInQuizTemplateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    quizTemplateId?: boolean
    questionUid?: boolean
    sequence?: boolean
    createdAt?: boolean
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["questionsInQuizTemplate"]>

  export type QuestionsInQuizTemplateSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    quizTemplateId?: boolean
    questionUid?: boolean
    sequence?: boolean
    createdAt?: boolean
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["questionsInQuizTemplate"]>

  export type QuestionsInQuizTemplateSelectScalar = {
    quizTemplateId?: boolean
    questionUid?: boolean
    sequence?: boolean
    createdAt?: boolean
  }

  export type QuestionsInQuizTemplateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"quizTemplateId" | "questionUid" | "sequence" | "createdAt", ExtArgs["result"]["questionsInQuizTemplate"]>
  export type QuestionsInQuizTemplateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }
  export type QuestionsInQuizTemplateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }
  export type QuestionsInQuizTemplateIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }

  export type $QuestionsInQuizTemplatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuestionsInQuizTemplate"
    objects: {
      quizTemplate: Prisma.$QuizTemplatePayload<ExtArgs>
      question: Prisma.$QuestionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      quizTemplateId: string
      questionUid: string
      sequence: number
      createdAt: Date
    }, ExtArgs["result"]["questionsInQuizTemplate"]>
    composites: {}
  }

  type QuestionsInQuizTemplateGetPayload<S extends boolean | null | undefined | QuestionsInQuizTemplateDefaultArgs> = $Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload, S>

  type QuestionsInQuizTemplateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QuestionsInQuizTemplateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QuestionsInQuizTemplateCountAggregateInputType | true
    }

  export interface QuestionsInQuizTemplateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuestionsInQuizTemplate'], meta: { name: 'QuestionsInQuizTemplate' } }
    /**
     * Find zero or one QuestionsInQuizTemplate that matches the filter.
     * @param {QuestionsInQuizTemplateFindUniqueArgs} args - Arguments to find a QuestionsInQuizTemplate
     * @example
     * // Get one QuestionsInQuizTemplate
     * const questionsInQuizTemplate = await prisma.questionsInQuizTemplate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuestionsInQuizTemplateFindUniqueArgs>(args: SelectSubset<T, QuestionsInQuizTemplateFindUniqueArgs<ExtArgs>>): Prisma__QuestionsInQuizTemplateClient<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one QuestionsInQuizTemplate that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QuestionsInQuizTemplateFindUniqueOrThrowArgs} args - Arguments to find a QuestionsInQuizTemplate
     * @example
     * // Get one QuestionsInQuizTemplate
     * const questionsInQuizTemplate = await prisma.questionsInQuizTemplate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuestionsInQuizTemplateFindUniqueOrThrowArgs>(args: SelectSubset<T, QuestionsInQuizTemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuestionsInQuizTemplateClient<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuestionsInQuizTemplate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInQuizTemplateFindFirstArgs} args - Arguments to find a QuestionsInQuizTemplate
     * @example
     * // Get one QuestionsInQuizTemplate
     * const questionsInQuizTemplate = await prisma.questionsInQuizTemplate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuestionsInQuizTemplateFindFirstArgs>(args?: SelectSubset<T, QuestionsInQuizTemplateFindFirstArgs<ExtArgs>>): Prisma__QuestionsInQuizTemplateClient<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuestionsInQuizTemplate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInQuizTemplateFindFirstOrThrowArgs} args - Arguments to find a QuestionsInQuizTemplate
     * @example
     * // Get one QuestionsInQuizTemplate
     * const questionsInQuizTemplate = await prisma.questionsInQuizTemplate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuestionsInQuizTemplateFindFirstOrThrowArgs>(args?: SelectSubset<T, QuestionsInQuizTemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuestionsInQuizTemplateClient<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more QuestionsInQuizTemplates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInQuizTemplateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuestionsInQuizTemplates
     * const questionsInQuizTemplates = await prisma.questionsInQuizTemplate.findMany()
     * 
     * // Get first 10 QuestionsInQuizTemplates
     * const questionsInQuizTemplates = await prisma.questionsInQuizTemplate.findMany({ take: 10 })
     * 
     * // Only select the `quizTemplateId`
     * const questionsInQuizTemplateWithQuizTemplateIdOnly = await prisma.questionsInQuizTemplate.findMany({ select: { quizTemplateId: true } })
     * 
     */
    findMany<T extends QuestionsInQuizTemplateFindManyArgs>(args?: SelectSubset<T, QuestionsInQuizTemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a QuestionsInQuizTemplate.
     * @param {QuestionsInQuizTemplateCreateArgs} args - Arguments to create a QuestionsInQuizTemplate.
     * @example
     * // Create one QuestionsInQuizTemplate
     * const QuestionsInQuizTemplate = await prisma.questionsInQuizTemplate.create({
     *   data: {
     *     // ... data to create a QuestionsInQuizTemplate
     *   }
     * })
     * 
     */
    create<T extends QuestionsInQuizTemplateCreateArgs>(args: SelectSubset<T, QuestionsInQuizTemplateCreateArgs<ExtArgs>>): Prisma__QuestionsInQuizTemplateClient<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many QuestionsInQuizTemplates.
     * @param {QuestionsInQuizTemplateCreateManyArgs} args - Arguments to create many QuestionsInQuizTemplates.
     * @example
     * // Create many QuestionsInQuizTemplates
     * const questionsInQuizTemplate = await prisma.questionsInQuizTemplate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuestionsInQuizTemplateCreateManyArgs>(args?: SelectSubset<T, QuestionsInQuizTemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuestionsInQuizTemplates and returns the data saved in the database.
     * @param {QuestionsInQuizTemplateCreateManyAndReturnArgs} args - Arguments to create many QuestionsInQuizTemplates.
     * @example
     * // Create many QuestionsInQuizTemplates
     * const questionsInQuizTemplate = await prisma.questionsInQuizTemplate.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuestionsInQuizTemplates and only return the `quizTemplateId`
     * const questionsInQuizTemplateWithQuizTemplateIdOnly = await prisma.questionsInQuizTemplate.createManyAndReturn({
     *   select: { quizTemplateId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuestionsInQuizTemplateCreateManyAndReturnArgs>(args?: SelectSubset<T, QuestionsInQuizTemplateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a QuestionsInQuizTemplate.
     * @param {QuestionsInQuizTemplateDeleteArgs} args - Arguments to delete one QuestionsInQuizTemplate.
     * @example
     * // Delete one QuestionsInQuizTemplate
     * const QuestionsInQuizTemplate = await prisma.questionsInQuizTemplate.delete({
     *   where: {
     *     // ... filter to delete one QuestionsInQuizTemplate
     *   }
     * })
     * 
     */
    delete<T extends QuestionsInQuizTemplateDeleteArgs>(args: SelectSubset<T, QuestionsInQuizTemplateDeleteArgs<ExtArgs>>): Prisma__QuestionsInQuizTemplateClient<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one QuestionsInQuizTemplate.
     * @param {QuestionsInQuizTemplateUpdateArgs} args - Arguments to update one QuestionsInQuizTemplate.
     * @example
     * // Update one QuestionsInQuizTemplate
     * const questionsInQuizTemplate = await prisma.questionsInQuizTemplate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuestionsInQuizTemplateUpdateArgs>(args: SelectSubset<T, QuestionsInQuizTemplateUpdateArgs<ExtArgs>>): Prisma__QuestionsInQuizTemplateClient<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more QuestionsInQuizTemplates.
     * @param {QuestionsInQuizTemplateDeleteManyArgs} args - Arguments to filter QuestionsInQuizTemplates to delete.
     * @example
     * // Delete a few QuestionsInQuizTemplates
     * const { count } = await prisma.questionsInQuizTemplate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuestionsInQuizTemplateDeleteManyArgs>(args?: SelectSubset<T, QuestionsInQuizTemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuestionsInQuizTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInQuizTemplateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuestionsInQuizTemplates
     * const questionsInQuizTemplate = await prisma.questionsInQuizTemplate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuestionsInQuizTemplateUpdateManyArgs>(args: SelectSubset<T, QuestionsInQuizTemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuestionsInQuizTemplates and returns the data updated in the database.
     * @param {QuestionsInQuizTemplateUpdateManyAndReturnArgs} args - Arguments to update many QuestionsInQuizTemplates.
     * @example
     * // Update many QuestionsInQuizTemplates
     * const questionsInQuizTemplate = await prisma.questionsInQuizTemplate.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more QuestionsInQuizTemplates and only return the `quizTemplateId`
     * const questionsInQuizTemplateWithQuizTemplateIdOnly = await prisma.questionsInQuizTemplate.updateManyAndReturn({
     *   select: { quizTemplateId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends QuestionsInQuizTemplateUpdateManyAndReturnArgs>(args: SelectSubset<T, QuestionsInQuizTemplateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one QuestionsInQuizTemplate.
     * @param {QuestionsInQuizTemplateUpsertArgs} args - Arguments to update or create a QuestionsInQuizTemplate.
     * @example
     * // Update or create a QuestionsInQuizTemplate
     * const questionsInQuizTemplate = await prisma.questionsInQuizTemplate.upsert({
     *   create: {
     *     // ... data to create a QuestionsInQuizTemplate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuestionsInQuizTemplate we want to update
     *   }
     * })
     */
    upsert<T extends QuestionsInQuizTemplateUpsertArgs>(args: SelectSubset<T, QuestionsInQuizTemplateUpsertArgs<ExtArgs>>): Prisma__QuestionsInQuizTemplateClient<$Result.GetResult<Prisma.$QuestionsInQuizTemplatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of QuestionsInQuizTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInQuizTemplateCountArgs} args - Arguments to filter QuestionsInQuizTemplates to count.
     * @example
     * // Count the number of QuestionsInQuizTemplates
     * const count = await prisma.questionsInQuizTemplate.count({
     *   where: {
     *     // ... the filter for the QuestionsInQuizTemplates we want to count
     *   }
     * })
    **/
    count<T extends QuestionsInQuizTemplateCountArgs>(
      args?: Subset<T, QuestionsInQuizTemplateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuestionsInQuizTemplateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuestionsInQuizTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInQuizTemplateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuestionsInQuizTemplateAggregateArgs>(args: Subset<T, QuestionsInQuizTemplateAggregateArgs>): Prisma.PrismaPromise<GetQuestionsInQuizTemplateAggregateType<T>>

    /**
     * Group by QuestionsInQuizTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInQuizTemplateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuestionsInQuizTemplateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuestionsInQuizTemplateGroupByArgs['orderBy'] }
        : { orderBy?: QuestionsInQuizTemplateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuestionsInQuizTemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuestionsInQuizTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuestionsInQuizTemplate model
   */
  readonly fields: QuestionsInQuizTemplateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuestionsInQuizTemplate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuestionsInQuizTemplateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quizTemplate<T extends QuizTemplateDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuizTemplateDefaultArgs<ExtArgs>>): Prisma__QuizTemplateClient<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    question<T extends QuestionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuestionDefaultArgs<ExtArgs>>): Prisma__QuestionClient<$Result.GetResult<Prisma.$QuestionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the QuestionsInQuizTemplate model
   */
  interface QuestionsInQuizTemplateFieldRefs {
    readonly quizTemplateId: FieldRef<"QuestionsInQuizTemplate", 'String'>
    readonly questionUid: FieldRef<"QuestionsInQuizTemplate", 'String'>
    readonly sequence: FieldRef<"QuestionsInQuizTemplate", 'Int'>
    readonly createdAt: FieldRef<"QuestionsInQuizTemplate", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QuestionsInQuizTemplate findUnique
   */
  export type QuestionsInQuizTemplateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuestionsInQuizTemplate to fetch.
     */
    where: QuestionsInQuizTemplateWhereUniqueInput
  }

  /**
   * QuestionsInQuizTemplate findUniqueOrThrow
   */
  export type QuestionsInQuizTemplateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuestionsInQuizTemplate to fetch.
     */
    where: QuestionsInQuizTemplateWhereUniqueInput
  }

  /**
   * QuestionsInQuizTemplate findFirst
   */
  export type QuestionsInQuizTemplateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuestionsInQuizTemplate to fetch.
     */
    where?: QuestionsInQuizTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionsInQuizTemplates to fetch.
     */
    orderBy?: QuestionsInQuizTemplateOrderByWithRelationInput | QuestionsInQuizTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuestionsInQuizTemplates.
     */
    cursor?: QuestionsInQuizTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionsInQuizTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionsInQuizTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuestionsInQuizTemplates.
     */
    distinct?: QuestionsInQuizTemplateScalarFieldEnum | QuestionsInQuizTemplateScalarFieldEnum[]
  }

  /**
   * QuestionsInQuizTemplate findFirstOrThrow
   */
  export type QuestionsInQuizTemplateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuestionsInQuizTemplate to fetch.
     */
    where?: QuestionsInQuizTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionsInQuizTemplates to fetch.
     */
    orderBy?: QuestionsInQuizTemplateOrderByWithRelationInput | QuestionsInQuizTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuestionsInQuizTemplates.
     */
    cursor?: QuestionsInQuizTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionsInQuizTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionsInQuizTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuestionsInQuizTemplates.
     */
    distinct?: QuestionsInQuizTemplateScalarFieldEnum | QuestionsInQuizTemplateScalarFieldEnum[]
  }

  /**
   * QuestionsInQuizTemplate findMany
   */
  export type QuestionsInQuizTemplateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuestionsInQuizTemplates to fetch.
     */
    where?: QuestionsInQuizTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionsInQuizTemplates to fetch.
     */
    orderBy?: QuestionsInQuizTemplateOrderByWithRelationInput | QuestionsInQuizTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuestionsInQuizTemplates.
     */
    cursor?: QuestionsInQuizTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionsInQuizTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionsInQuizTemplates.
     */
    skip?: number
    distinct?: QuestionsInQuizTemplateScalarFieldEnum | QuestionsInQuizTemplateScalarFieldEnum[]
  }

  /**
   * QuestionsInQuizTemplate create
   */
  export type QuestionsInQuizTemplateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    /**
     * The data needed to create a QuestionsInQuizTemplate.
     */
    data: XOR<QuestionsInQuizTemplateCreateInput, QuestionsInQuizTemplateUncheckedCreateInput>
  }

  /**
   * QuestionsInQuizTemplate createMany
   */
  export type QuestionsInQuizTemplateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuestionsInQuizTemplates.
     */
    data: QuestionsInQuizTemplateCreateManyInput | QuestionsInQuizTemplateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuestionsInQuizTemplate createManyAndReturn
   */
  export type QuestionsInQuizTemplateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * The data used to create many QuestionsInQuizTemplates.
     */
    data: QuestionsInQuizTemplateCreateManyInput | QuestionsInQuizTemplateCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuestionsInQuizTemplate update
   */
  export type QuestionsInQuizTemplateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    /**
     * The data needed to update a QuestionsInQuizTemplate.
     */
    data: XOR<QuestionsInQuizTemplateUpdateInput, QuestionsInQuizTemplateUncheckedUpdateInput>
    /**
     * Choose, which QuestionsInQuizTemplate to update.
     */
    where: QuestionsInQuizTemplateWhereUniqueInput
  }

  /**
   * QuestionsInQuizTemplate updateMany
   */
  export type QuestionsInQuizTemplateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuestionsInQuizTemplates.
     */
    data: XOR<QuestionsInQuizTemplateUpdateManyMutationInput, QuestionsInQuizTemplateUncheckedUpdateManyInput>
    /**
     * Filter which QuestionsInQuizTemplates to update
     */
    where?: QuestionsInQuizTemplateWhereInput
    /**
     * Limit how many QuestionsInQuizTemplates to update.
     */
    limit?: number
  }

  /**
   * QuestionsInQuizTemplate updateManyAndReturn
   */
  export type QuestionsInQuizTemplateUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * The data used to update QuestionsInQuizTemplates.
     */
    data: XOR<QuestionsInQuizTemplateUpdateManyMutationInput, QuestionsInQuizTemplateUncheckedUpdateManyInput>
    /**
     * Filter which QuestionsInQuizTemplates to update
     */
    where?: QuestionsInQuizTemplateWhereInput
    /**
     * Limit how many QuestionsInQuizTemplates to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuestionsInQuizTemplate upsert
   */
  export type QuestionsInQuizTemplateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    /**
     * The filter to search for the QuestionsInQuizTemplate to update in case it exists.
     */
    where: QuestionsInQuizTemplateWhereUniqueInput
    /**
     * In case the QuestionsInQuizTemplate found by the `where` argument doesn't exist, create a new QuestionsInQuizTemplate with this data.
     */
    create: XOR<QuestionsInQuizTemplateCreateInput, QuestionsInQuizTemplateUncheckedCreateInput>
    /**
     * In case the QuestionsInQuizTemplate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuestionsInQuizTemplateUpdateInput, QuestionsInQuizTemplateUncheckedUpdateInput>
  }

  /**
   * QuestionsInQuizTemplate delete
   */
  export type QuestionsInQuizTemplateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
    /**
     * Filter which QuestionsInQuizTemplate to delete.
     */
    where: QuestionsInQuizTemplateWhereUniqueInput
  }

  /**
   * QuestionsInQuizTemplate deleteMany
   */
  export type QuestionsInQuizTemplateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuestionsInQuizTemplates to delete
     */
    where?: QuestionsInQuizTemplateWhereInput
    /**
     * Limit how many QuestionsInQuizTemplates to delete.
     */
    limit?: number
  }

  /**
   * QuestionsInQuizTemplate without action
   */
  export type QuestionsInQuizTemplateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInQuizTemplate
     */
    select?: QuestionsInQuizTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInQuizTemplate
     */
    omit?: QuestionsInQuizTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInQuizTemplateInclude<ExtArgs> | null
  }


  /**
   * Model GameInstance
   */

  export type AggregateGameInstance = {
    _count: GameInstanceCountAggregateOutputType | null
    _avg: GameInstanceAvgAggregateOutputType | null
    _sum: GameInstanceSumAggregateOutputType | null
    _min: GameInstanceMinAggregateOutputType | null
    _max: GameInstanceMaxAggregateOutputType | null
  }

  export type GameInstanceAvgAggregateOutputType = {
    currentQuestionIndex: number | null
  }

  export type GameInstanceSumAggregateOutputType = {
    currentQuestionIndex: number | null
  }

  export type GameInstanceMinAggregateOutputType = {
    id: string | null
    name: string | null
    quizTemplateId: string | null
    initiatorTeacherId: string | null
    accessCode: string | null
    status: string | null
    playMode: $Enums.PlayMode | null
    currentQuestionIndex: number | null
    createdAt: Date | null
    startedAt: Date | null
    endedAt: Date | null
  }

  export type GameInstanceMaxAggregateOutputType = {
    id: string | null
    name: string | null
    quizTemplateId: string | null
    initiatorTeacherId: string | null
    accessCode: string | null
    status: string | null
    playMode: $Enums.PlayMode | null
    currentQuestionIndex: number | null
    createdAt: Date | null
    startedAt: Date | null
    endedAt: Date | null
  }

  export type GameInstanceCountAggregateOutputType = {
    id: number
    name: number
    quizTemplateId: number
    initiatorTeacherId: number
    accessCode: number
    status: number
    playMode: number
    leaderboard: number
    currentQuestionIndex: number
    settings: number
    createdAt: number
    startedAt: number
    endedAt: number
    _all: number
  }


  export type GameInstanceAvgAggregateInputType = {
    currentQuestionIndex?: true
  }

  export type GameInstanceSumAggregateInputType = {
    currentQuestionIndex?: true
  }

  export type GameInstanceMinAggregateInputType = {
    id?: true
    name?: true
    quizTemplateId?: true
    initiatorTeacherId?: true
    accessCode?: true
    status?: true
    playMode?: true
    currentQuestionIndex?: true
    createdAt?: true
    startedAt?: true
    endedAt?: true
  }

  export type GameInstanceMaxAggregateInputType = {
    id?: true
    name?: true
    quizTemplateId?: true
    initiatorTeacherId?: true
    accessCode?: true
    status?: true
    playMode?: true
    currentQuestionIndex?: true
    createdAt?: true
    startedAt?: true
    endedAt?: true
  }

  export type GameInstanceCountAggregateInputType = {
    id?: true
    name?: true
    quizTemplateId?: true
    initiatorTeacherId?: true
    accessCode?: true
    status?: true
    playMode?: true
    leaderboard?: true
    currentQuestionIndex?: true
    settings?: true
    createdAt?: true
    startedAt?: true
    endedAt?: true
    _all?: true
  }

  export type GameInstanceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GameInstance to aggregate.
     */
    where?: GameInstanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameInstances to fetch.
     */
    orderBy?: GameInstanceOrderByWithRelationInput | GameInstanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GameInstanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameInstances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameInstances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GameInstances
    **/
    _count?: true | GameInstanceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GameInstanceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GameInstanceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GameInstanceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GameInstanceMaxAggregateInputType
  }

  export type GetGameInstanceAggregateType<T extends GameInstanceAggregateArgs> = {
        [P in keyof T & keyof AggregateGameInstance]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGameInstance[P]>
      : GetScalarType<T[P], AggregateGameInstance[P]>
  }




  export type GameInstanceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameInstanceWhereInput
    orderBy?: GameInstanceOrderByWithAggregationInput | GameInstanceOrderByWithAggregationInput[]
    by: GameInstanceScalarFieldEnum[] | GameInstanceScalarFieldEnum
    having?: GameInstanceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GameInstanceCountAggregateInputType | true
    _avg?: GameInstanceAvgAggregateInputType
    _sum?: GameInstanceSumAggregateInputType
    _min?: GameInstanceMinAggregateInputType
    _max?: GameInstanceMaxAggregateInputType
  }

  export type GameInstanceGroupByOutputType = {
    id: string
    name: string
    quizTemplateId: string
    initiatorTeacherId: string | null
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard: JsonValue | null
    currentQuestionIndex: number | null
    settings: JsonValue | null
    createdAt: Date
    startedAt: Date | null
    endedAt: Date | null
    _count: GameInstanceCountAggregateOutputType | null
    _avg: GameInstanceAvgAggregateOutputType | null
    _sum: GameInstanceSumAggregateOutputType | null
    _min: GameInstanceMinAggregateOutputType | null
    _max: GameInstanceMaxAggregateOutputType | null
  }

  type GetGameInstanceGroupByPayload<T extends GameInstanceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GameInstanceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GameInstanceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GameInstanceGroupByOutputType[P]>
            : GetScalarType<T[P], GameInstanceGroupByOutputType[P]>
        }
      >
    >


  export type GameInstanceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    quizTemplateId?: boolean
    initiatorTeacherId?: boolean
    accessCode?: boolean
    status?: boolean
    playMode?: boolean
    leaderboard?: boolean
    currentQuestionIndex?: boolean
    settings?: boolean
    createdAt?: boolean
    startedAt?: boolean
    endedAt?: boolean
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    initiatorTeacher?: boolean | GameInstance$initiatorTeacherArgs<ExtArgs>
    participants?: boolean | GameInstance$participantsArgs<ExtArgs>
    _count?: boolean | GameInstanceCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameInstance"]>

  export type GameInstanceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    quizTemplateId?: boolean
    initiatorTeacherId?: boolean
    accessCode?: boolean
    status?: boolean
    playMode?: boolean
    leaderboard?: boolean
    currentQuestionIndex?: boolean
    settings?: boolean
    createdAt?: boolean
    startedAt?: boolean
    endedAt?: boolean
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    initiatorTeacher?: boolean | GameInstance$initiatorTeacherArgs<ExtArgs>
  }, ExtArgs["result"]["gameInstance"]>

  export type GameInstanceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    quizTemplateId?: boolean
    initiatorTeacherId?: boolean
    accessCode?: boolean
    status?: boolean
    playMode?: boolean
    leaderboard?: boolean
    currentQuestionIndex?: boolean
    settings?: boolean
    createdAt?: boolean
    startedAt?: boolean
    endedAt?: boolean
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    initiatorTeacher?: boolean | GameInstance$initiatorTeacherArgs<ExtArgs>
  }, ExtArgs["result"]["gameInstance"]>

  export type GameInstanceSelectScalar = {
    id?: boolean
    name?: boolean
    quizTemplateId?: boolean
    initiatorTeacherId?: boolean
    accessCode?: boolean
    status?: boolean
    playMode?: boolean
    leaderboard?: boolean
    currentQuestionIndex?: boolean
    settings?: boolean
    createdAt?: boolean
    startedAt?: boolean
    endedAt?: boolean
  }

  export type GameInstanceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "quizTemplateId" | "initiatorTeacherId" | "accessCode" | "status" | "playMode" | "leaderboard" | "currentQuestionIndex" | "settings" | "createdAt" | "startedAt" | "endedAt", ExtArgs["result"]["gameInstance"]>
  export type GameInstanceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    initiatorTeacher?: boolean | GameInstance$initiatorTeacherArgs<ExtArgs>
    participants?: boolean | GameInstance$participantsArgs<ExtArgs>
    _count?: boolean | GameInstanceCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GameInstanceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    initiatorTeacher?: boolean | GameInstance$initiatorTeacherArgs<ExtArgs>
  }
  export type GameInstanceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quizTemplate?: boolean | QuizTemplateDefaultArgs<ExtArgs>
    initiatorTeacher?: boolean | GameInstance$initiatorTeacherArgs<ExtArgs>
  }

  export type $GameInstancePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GameInstance"
    objects: {
      quizTemplate: Prisma.$QuizTemplatePayload<ExtArgs>
      initiatorTeacher: Prisma.$TeacherPayload<ExtArgs> | null
      participants: Prisma.$GameParticipantPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      quizTemplateId: string
      initiatorTeacherId: string | null
      accessCode: string
      status: string
      playMode: $Enums.PlayMode
      leaderboard: Prisma.JsonValue | null
      currentQuestionIndex: number | null
      settings: Prisma.JsonValue | null
      createdAt: Date
      startedAt: Date | null
      endedAt: Date | null
    }, ExtArgs["result"]["gameInstance"]>
    composites: {}
  }

  type GameInstanceGetPayload<S extends boolean | null | undefined | GameInstanceDefaultArgs> = $Result.GetResult<Prisma.$GameInstancePayload, S>

  type GameInstanceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GameInstanceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GameInstanceCountAggregateInputType | true
    }

  export interface GameInstanceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GameInstance'], meta: { name: 'GameInstance' } }
    /**
     * Find zero or one GameInstance that matches the filter.
     * @param {GameInstanceFindUniqueArgs} args - Arguments to find a GameInstance
     * @example
     * // Get one GameInstance
     * const gameInstance = await prisma.gameInstance.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GameInstanceFindUniqueArgs>(args: SelectSubset<T, GameInstanceFindUniqueArgs<ExtArgs>>): Prisma__GameInstanceClient<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GameInstance that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GameInstanceFindUniqueOrThrowArgs} args - Arguments to find a GameInstance
     * @example
     * // Get one GameInstance
     * const gameInstance = await prisma.gameInstance.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GameInstanceFindUniqueOrThrowArgs>(args: SelectSubset<T, GameInstanceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GameInstanceClient<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GameInstance that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameInstanceFindFirstArgs} args - Arguments to find a GameInstance
     * @example
     * // Get one GameInstance
     * const gameInstance = await prisma.gameInstance.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GameInstanceFindFirstArgs>(args?: SelectSubset<T, GameInstanceFindFirstArgs<ExtArgs>>): Prisma__GameInstanceClient<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GameInstance that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameInstanceFindFirstOrThrowArgs} args - Arguments to find a GameInstance
     * @example
     * // Get one GameInstance
     * const gameInstance = await prisma.gameInstance.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GameInstanceFindFirstOrThrowArgs>(args?: SelectSubset<T, GameInstanceFindFirstOrThrowArgs<ExtArgs>>): Prisma__GameInstanceClient<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GameInstances that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameInstanceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GameInstances
     * const gameInstances = await prisma.gameInstance.findMany()
     * 
     * // Get first 10 GameInstances
     * const gameInstances = await prisma.gameInstance.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const gameInstanceWithIdOnly = await prisma.gameInstance.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GameInstanceFindManyArgs>(args?: SelectSubset<T, GameInstanceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GameInstance.
     * @param {GameInstanceCreateArgs} args - Arguments to create a GameInstance.
     * @example
     * // Create one GameInstance
     * const GameInstance = await prisma.gameInstance.create({
     *   data: {
     *     // ... data to create a GameInstance
     *   }
     * })
     * 
     */
    create<T extends GameInstanceCreateArgs>(args: SelectSubset<T, GameInstanceCreateArgs<ExtArgs>>): Prisma__GameInstanceClient<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GameInstances.
     * @param {GameInstanceCreateManyArgs} args - Arguments to create many GameInstances.
     * @example
     * // Create many GameInstances
     * const gameInstance = await prisma.gameInstance.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GameInstanceCreateManyArgs>(args?: SelectSubset<T, GameInstanceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GameInstances and returns the data saved in the database.
     * @param {GameInstanceCreateManyAndReturnArgs} args - Arguments to create many GameInstances.
     * @example
     * // Create many GameInstances
     * const gameInstance = await prisma.gameInstance.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GameInstances and only return the `id`
     * const gameInstanceWithIdOnly = await prisma.gameInstance.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GameInstanceCreateManyAndReturnArgs>(args?: SelectSubset<T, GameInstanceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GameInstance.
     * @param {GameInstanceDeleteArgs} args - Arguments to delete one GameInstance.
     * @example
     * // Delete one GameInstance
     * const GameInstance = await prisma.gameInstance.delete({
     *   where: {
     *     // ... filter to delete one GameInstance
     *   }
     * })
     * 
     */
    delete<T extends GameInstanceDeleteArgs>(args: SelectSubset<T, GameInstanceDeleteArgs<ExtArgs>>): Prisma__GameInstanceClient<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GameInstance.
     * @param {GameInstanceUpdateArgs} args - Arguments to update one GameInstance.
     * @example
     * // Update one GameInstance
     * const gameInstance = await prisma.gameInstance.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GameInstanceUpdateArgs>(args: SelectSubset<T, GameInstanceUpdateArgs<ExtArgs>>): Prisma__GameInstanceClient<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GameInstances.
     * @param {GameInstanceDeleteManyArgs} args - Arguments to filter GameInstances to delete.
     * @example
     * // Delete a few GameInstances
     * const { count } = await prisma.gameInstance.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GameInstanceDeleteManyArgs>(args?: SelectSubset<T, GameInstanceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GameInstances.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameInstanceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GameInstances
     * const gameInstance = await prisma.gameInstance.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GameInstanceUpdateManyArgs>(args: SelectSubset<T, GameInstanceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GameInstances and returns the data updated in the database.
     * @param {GameInstanceUpdateManyAndReturnArgs} args - Arguments to update many GameInstances.
     * @example
     * // Update many GameInstances
     * const gameInstance = await prisma.gameInstance.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GameInstances and only return the `id`
     * const gameInstanceWithIdOnly = await prisma.gameInstance.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GameInstanceUpdateManyAndReturnArgs>(args: SelectSubset<T, GameInstanceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GameInstance.
     * @param {GameInstanceUpsertArgs} args - Arguments to update or create a GameInstance.
     * @example
     * // Update or create a GameInstance
     * const gameInstance = await prisma.gameInstance.upsert({
     *   create: {
     *     // ... data to create a GameInstance
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GameInstance we want to update
     *   }
     * })
     */
    upsert<T extends GameInstanceUpsertArgs>(args: SelectSubset<T, GameInstanceUpsertArgs<ExtArgs>>): Prisma__GameInstanceClient<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GameInstances.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameInstanceCountArgs} args - Arguments to filter GameInstances to count.
     * @example
     * // Count the number of GameInstances
     * const count = await prisma.gameInstance.count({
     *   where: {
     *     // ... the filter for the GameInstances we want to count
     *   }
     * })
    **/
    count<T extends GameInstanceCountArgs>(
      args?: Subset<T, GameInstanceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GameInstanceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GameInstance.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameInstanceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GameInstanceAggregateArgs>(args: Subset<T, GameInstanceAggregateArgs>): Prisma.PrismaPromise<GetGameInstanceAggregateType<T>>

    /**
     * Group by GameInstance.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameInstanceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GameInstanceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GameInstanceGroupByArgs['orderBy'] }
        : { orderBy?: GameInstanceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GameInstanceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGameInstanceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GameInstance model
   */
  readonly fields: GameInstanceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GameInstance.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GameInstanceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quizTemplate<T extends QuizTemplateDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuizTemplateDefaultArgs<ExtArgs>>): Prisma__QuizTemplateClient<$Result.GetResult<Prisma.$QuizTemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    initiatorTeacher<T extends GameInstance$initiatorTeacherArgs<ExtArgs> = {}>(args?: Subset<T, GameInstance$initiatorTeacherArgs<ExtArgs>>): Prisma__TeacherClient<$Result.GetResult<Prisma.$TeacherPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    participants<T extends GameInstance$participantsArgs<ExtArgs> = {}>(args?: Subset<T, GameInstance$participantsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the GameInstance model
   */
  interface GameInstanceFieldRefs {
    readonly id: FieldRef<"GameInstance", 'String'>
    readonly name: FieldRef<"GameInstance", 'String'>
    readonly quizTemplateId: FieldRef<"GameInstance", 'String'>
    readonly initiatorTeacherId: FieldRef<"GameInstance", 'String'>
    readonly accessCode: FieldRef<"GameInstance", 'String'>
    readonly status: FieldRef<"GameInstance", 'String'>
    readonly playMode: FieldRef<"GameInstance", 'PlayMode'>
    readonly leaderboard: FieldRef<"GameInstance", 'Json'>
    readonly currentQuestionIndex: FieldRef<"GameInstance", 'Int'>
    readonly settings: FieldRef<"GameInstance", 'Json'>
    readonly createdAt: FieldRef<"GameInstance", 'DateTime'>
    readonly startedAt: FieldRef<"GameInstance", 'DateTime'>
    readonly endedAt: FieldRef<"GameInstance", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * GameInstance findUnique
   */
  export type GameInstanceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    /**
     * Filter, which GameInstance to fetch.
     */
    where: GameInstanceWhereUniqueInput
  }

  /**
   * GameInstance findUniqueOrThrow
   */
  export type GameInstanceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    /**
     * Filter, which GameInstance to fetch.
     */
    where: GameInstanceWhereUniqueInput
  }

  /**
   * GameInstance findFirst
   */
  export type GameInstanceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    /**
     * Filter, which GameInstance to fetch.
     */
    where?: GameInstanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameInstances to fetch.
     */
    orderBy?: GameInstanceOrderByWithRelationInput | GameInstanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GameInstances.
     */
    cursor?: GameInstanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameInstances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameInstances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameInstances.
     */
    distinct?: GameInstanceScalarFieldEnum | GameInstanceScalarFieldEnum[]
  }

  /**
   * GameInstance findFirstOrThrow
   */
  export type GameInstanceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    /**
     * Filter, which GameInstance to fetch.
     */
    where?: GameInstanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameInstances to fetch.
     */
    orderBy?: GameInstanceOrderByWithRelationInput | GameInstanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GameInstances.
     */
    cursor?: GameInstanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameInstances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameInstances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameInstances.
     */
    distinct?: GameInstanceScalarFieldEnum | GameInstanceScalarFieldEnum[]
  }

  /**
   * GameInstance findMany
   */
  export type GameInstanceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    /**
     * Filter, which GameInstances to fetch.
     */
    where?: GameInstanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameInstances to fetch.
     */
    orderBy?: GameInstanceOrderByWithRelationInput | GameInstanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GameInstances.
     */
    cursor?: GameInstanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameInstances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameInstances.
     */
    skip?: number
    distinct?: GameInstanceScalarFieldEnum | GameInstanceScalarFieldEnum[]
  }

  /**
   * GameInstance create
   */
  export type GameInstanceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    /**
     * The data needed to create a GameInstance.
     */
    data: XOR<GameInstanceCreateInput, GameInstanceUncheckedCreateInput>
  }

  /**
   * GameInstance createMany
   */
  export type GameInstanceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GameInstances.
     */
    data: GameInstanceCreateManyInput | GameInstanceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * GameInstance createManyAndReturn
   */
  export type GameInstanceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * The data used to create many GameInstances.
     */
    data: GameInstanceCreateManyInput | GameInstanceCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * GameInstance update
   */
  export type GameInstanceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    /**
     * The data needed to update a GameInstance.
     */
    data: XOR<GameInstanceUpdateInput, GameInstanceUncheckedUpdateInput>
    /**
     * Choose, which GameInstance to update.
     */
    where: GameInstanceWhereUniqueInput
  }

  /**
   * GameInstance updateMany
   */
  export type GameInstanceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GameInstances.
     */
    data: XOR<GameInstanceUpdateManyMutationInput, GameInstanceUncheckedUpdateManyInput>
    /**
     * Filter which GameInstances to update
     */
    where?: GameInstanceWhereInput
    /**
     * Limit how many GameInstances to update.
     */
    limit?: number
  }

  /**
   * GameInstance updateManyAndReturn
   */
  export type GameInstanceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * The data used to update GameInstances.
     */
    data: XOR<GameInstanceUpdateManyMutationInput, GameInstanceUncheckedUpdateManyInput>
    /**
     * Filter which GameInstances to update
     */
    where?: GameInstanceWhereInput
    /**
     * Limit how many GameInstances to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * GameInstance upsert
   */
  export type GameInstanceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    /**
     * The filter to search for the GameInstance to update in case it exists.
     */
    where: GameInstanceWhereUniqueInput
    /**
     * In case the GameInstance found by the `where` argument doesn't exist, create a new GameInstance with this data.
     */
    create: XOR<GameInstanceCreateInput, GameInstanceUncheckedCreateInput>
    /**
     * In case the GameInstance was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GameInstanceUpdateInput, GameInstanceUncheckedUpdateInput>
  }

  /**
   * GameInstance delete
   */
  export type GameInstanceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
    /**
     * Filter which GameInstance to delete.
     */
    where: GameInstanceWhereUniqueInput
  }

  /**
   * GameInstance deleteMany
   */
  export type GameInstanceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GameInstances to delete
     */
    where?: GameInstanceWhereInput
    /**
     * Limit how many GameInstances to delete.
     */
    limit?: number
  }

  /**
   * GameInstance.initiatorTeacher
   */
  export type GameInstance$initiatorTeacherArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Teacher
     */
    select?: TeacherSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Teacher
     */
    omit?: TeacherOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherInclude<ExtArgs> | null
    where?: TeacherWhereInput
  }

  /**
   * GameInstance.participants
   */
  export type GameInstance$participantsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    where?: GameParticipantWhereInput
    orderBy?: GameParticipantOrderByWithRelationInput | GameParticipantOrderByWithRelationInput[]
    cursor?: GameParticipantWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GameParticipantScalarFieldEnum | GameParticipantScalarFieldEnum[]
  }

  /**
   * GameInstance without action
   */
  export type GameInstanceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameInstance
     */
    select?: GameInstanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameInstance
     */
    omit?: GameInstanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInstanceInclude<ExtArgs> | null
  }


  /**
   * Model GameParticipant
   */

  export type AggregateGameParticipant = {
    _count: GameParticipantCountAggregateOutputType | null
    _avg: GameParticipantAvgAggregateOutputType | null
    _sum: GameParticipantSumAggregateOutputType | null
    _min: GameParticipantMinAggregateOutputType | null
    _max: GameParticipantMaxAggregateOutputType | null
  }

  export type GameParticipantAvgAggregateOutputType = {
    score: number | null
    rank: number | null
    timeTakenMs: number | null
  }

  export type GameParticipantSumAggregateOutputType = {
    score: number | null
    rank: number | null
    timeTakenMs: number | null
  }

  export type GameParticipantMinAggregateOutputType = {
    id: string | null
    gameInstanceId: string | null
    playerId: string | null
    score: number | null
    rank: number | null
    timeTakenMs: number | null
    joinedAt: Date | null
    completedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type GameParticipantMaxAggregateOutputType = {
    id: string | null
    gameInstanceId: string | null
    playerId: string | null
    score: number | null
    rank: number | null
    timeTakenMs: number | null
    joinedAt: Date | null
    completedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type GameParticipantCountAggregateOutputType = {
    id: number
    gameInstanceId: number
    playerId: number
    score: number
    rank: number
    timeTakenMs: number
    joinedAt: number
    completedAt: number
    answers: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type GameParticipantAvgAggregateInputType = {
    score?: true
    rank?: true
    timeTakenMs?: true
  }

  export type GameParticipantSumAggregateInputType = {
    score?: true
    rank?: true
    timeTakenMs?: true
  }

  export type GameParticipantMinAggregateInputType = {
    id?: true
    gameInstanceId?: true
    playerId?: true
    score?: true
    rank?: true
    timeTakenMs?: true
    joinedAt?: true
    completedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type GameParticipantMaxAggregateInputType = {
    id?: true
    gameInstanceId?: true
    playerId?: true
    score?: true
    rank?: true
    timeTakenMs?: true
    joinedAt?: true
    completedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type GameParticipantCountAggregateInputType = {
    id?: true
    gameInstanceId?: true
    playerId?: true
    score?: true
    rank?: true
    timeTakenMs?: true
    joinedAt?: true
    completedAt?: true
    answers?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type GameParticipantAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GameParticipant to aggregate.
     */
    where?: GameParticipantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameParticipants to fetch.
     */
    orderBy?: GameParticipantOrderByWithRelationInput | GameParticipantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GameParticipantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameParticipants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameParticipants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GameParticipants
    **/
    _count?: true | GameParticipantCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GameParticipantAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GameParticipantSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GameParticipantMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GameParticipantMaxAggregateInputType
  }

  export type GetGameParticipantAggregateType<T extends GameParticipantAggregateArgs> = {
        [P in keyof T & keyof AggregateGameParticipant]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGameParticipant[P]>
      : GetScalarType<T[P], AggregateGameParticipant[P]>
  }




  export type GameParticipantGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameParticipantWhereInput
    orderBy?: GameParticipantOrderByWithAggregationInput | GameParticipantOrderByWithAggregationInput[]
    by: GameParticipantScalarFieldEnum[] | GameParticipantScalarFieldEnum
    having?: GameParticipantScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GameParticipantCountAggregateInputType | true
    _avg?: GameParticipantAvgAggregateInputType
    _sum?: GameParticipantSumAggregateInputType
    _min?: GameParticipantMinAggregateInputType
    _max?: GameParticipantMaxAggregateInputType
  }

  export type GameParticipantGroupByOutputType = {
    id: string
    gameInstanceId: string
    playerId: string
    score: number
    rank: number | null
    timeTakenMs: number | null
    joinedAt: Date
    completedAt: Date | null
    answers: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: GameParticipantCountAggregateOutputType | null
    _avg: GameParticipantAvgAggregateOutputType | null
    _sum: GameParticipantSumAggregateOutputType | null
    _min: GameParticipantMinAggregateOutputType | null
    _max: GameParticipantMaxAggregateOutputType | null
  }

  type GetGameParticipantGroupByPayload<T extends GameParticipantGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GameParticipantGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GameParticipantGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GameParticipantGroupByOutputType[P]>
            : GetScalarType<T[P], GameParticipantGroupByOutputType[P]>
        }
      >
    >


  export type GameParticipantSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gameInstanceId?: boolean
    playerId?: boolean
    score?: boolean
    rank?: boolean
    timeTakenMs?: boolean
    joinedAt?: boolean
    completedAt?: boolean
    answers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameParticipant"]>

  export type GameParticipantSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gameInstanceId?: boolean
    playerId?: boolean
    score?: boolean
    rank?: boolean
    timeTakenMs?: boolean
    joinedAt?: boolean
    completedAt?: boolean
    answers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameParticipant"]>

  export type GameParticipantSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gameInstanceId?: boolean
    playerId?: boolean
    score?: boolean
    rank?: boolean
    timeTakenMs?: boolean
    joinedAt?: boolean
    completedAt?: boolean
    answers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameParticipant"]>

  export type GameParticipantSelectScalar = {
    id?: boolean
    gameInstanceId?: boolean
    playerId?: boolean
    score?: boolean
    rank?: boolean
    timeTakenMs?: boolean
    joinedAt?: boolean
    completedAt?: boolean
    answers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type GameParticipantOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "gameInstanceId" | "playerId" | "score" | "rank" | "timeTakenMs" | "joinedAt" | "completedAt" | "answers" | "createdAt" | "updatedAt", ExtArgs["result"]["gameParticipant"]>
  export type GameParticipantInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }
  export type GameParticipantIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }
  export type GameParticipantIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }

  export type $GameParticipantPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GameParticipant"
    objects: {
      gameInstance: Prisma.$GameInstancePayload<ExtArgs>
      player: Prisma.$PlayerPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      gameInstanceId: string
      playerId: string
      score: number
      rank: number | null
      timeTakenMs: number | null
      joinedAt: Date
      completedAt: Date | null
      answers: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["gameParticipant"]>
    composites: {}
  }

  type GameParticipantGetPayload<S extends boolean | null | undefined | GameParticipantDefaultArgs> = $Result.GetResult<Prisma.$GameParticipantPayload, S>

  type GameParticipantCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GameParticipantFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GameParticipantCountAggregateInputType | true
    }

  export interface GameParticipantDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GameParticipant'], meta: { name: 'GameParticipant' } }
    /**
     * Find zero or one GameParticipant that matches the filter.
     * @param {GameParticipantFindUniqueArgs} args - Arguments to find a GameParticipant
     * @example
     * // Get one GameParticipant
     * const gameParticipant = await prisma.gameParticipant.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GameParticipantFindUniqueArgs>(args: SelectSubset<T, GameParticipantFindUniqueArgs<ExtArgs>>): Prisma__GameParticipantClient<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GameParticipant that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GameParticipantFindUniqueOrThrowArgs} args - Arguments to find a GameParticipant
     * @example
     * // Get one GameParticipant
     * const gameParticipant = await prisma.gameParticipant.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GameParticipantFindUniqueOrThrowArgs>(args: SelectSubset<T, GameParticipantFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GameParticipantClient<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GameParticipant that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameParticipantFindFirstArgs} args - Arguments to find a GameParticipant
     * @example
     * // Get one GameParticipant
     * const gameParticipant = await prisma.gameParticipant.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GameParticipantFindFirstArgs>(args?: SelectSubset<T, GameParticipantFindFirstArgs<ExtArgs>>): Prisma__GameParticipantClient<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GameParticipant that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameParticipantFindFirstOrThrowArgs} args - Arguments to find a GameParticipant
     * @example
     * // Get one GameParticipant
     * const gameParticipant = await prisma.gameParticipant.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GameParticipantFindFirstOrThrowArgs>(args?: SelectSubset<T, GameParticipantFindFirstOrThrowArgs<ExtArgs>>): Prisma__GameParticipantClient<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GameParticipants that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameParticipantFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GameParticipants
     * const gameParticipants = await prisma.gameParticipant.findMany()
     * 
     * // Get first 10 GameParticipants
     * const gameParticipants = await prisma.gameParticipant.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const gameParticipantWithIdOnly = await prisma.gameParticipant.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GameParticipantFindManyArgs>(args?: SelectSubset<T, GameParticipantFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GameParticipant.
     * @param {GameParticipantCreateArgs} args - Arguments to create a GameParticipant.
     * @example
     * // Create one GameParticipant
     * const GameParticipant = await prisma.gameParticipant.create({
     *   data: {
     *     // ... data to create a GameParticipant
     *   }
     * })
     * 
     */
    create<T extends GameParticipantCreateArgs>(args: SelectSubset<T, GameParticipantCreateArgs<ExtArgs>>): Prisma__GameParticipantClient<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GameParticipants.
     * @param {GameParticipantCreateManyArgs} args - Arguments to create many GameParticipants.
     * @example
     * // Create many GameParticipants
     * const gameParticipant = await prisma.gameParticipant.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GameParticipantCreateManyArgs>(args?: SelectSubset<T, GameParticipantCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GameParticipants and returns the data saved in the database.
     * @param {GameParticipantCreateManyAndReturnArgs} args - Arguments to create many GameParticipants.
     * @example
     * // Create many GameParticipants
     * const gameParticipant = await prisma.gameParticipant.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GameParticipants and only return the `id`
     * const gameParticipantWithIdOnly = await prisma.gameParticipant.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GameParticipantCreateManyAndReturnArgs>(args?: SelectSubset<T, GameParticipantCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GameParticipant.
     * @param {GameParticipantDeleteArgs} args - Arguments to delete one GameParticipant.
     * @example
     * // Delete one GameParticipant
     * const GameParticipant = await prisma.gameParticipant.delete({
     *   where: {
     *     // ... filter to delete one GameParticipant
     *   }
     * })
     * 
     */
    delete<T extends GameParticipantDeleteArgs>(args: SelectSubset<T, GameParticipantDeleteArgs<ExtArgs>>): Prisma__GameParticipantClient<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GameParticipant.
     * @param {GameParticipantUpdateArgs} args - Arguments to update one GameParticipant.
     * @example
     * // Update one GameParticipant
     * const gameParticipant = await prisma.gameParticipant.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GameParticipantUpdateArgs>(args: SelectSubset<T, GameParticipantUpdateArgs<ExtArgs>>): Prisma__GameParticipantClient<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GameParticipants.
     * @param {GameParticipantDeleteManyArgs} args - Arguments to filter GameParticipants to delete.
     * @example
     * // Delete a few GameParticipants
     * const { count } = await prisma.gameParticipant.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GameParticipantDeleteManyArgs>(args?: SelectSubset<T, GameParticipantDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GameParticipants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameParticipantUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GameParticipants
     * const gameParticipant = await prisma.gameParticipant.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GameParticipantUpdateManyArgs>(args: SelectSubset<T, GameParticipantUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GameParticipants and returns the data updated in the database.
     * @param {GameParticipantUpdateManyAndReturnArgs} args - Arguments to update many GameParticipants.
     * @example
     * // Update many GameParticipants
     * const gameParticipant = await prisma.gameParticipant.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GameParticipants and only return the `id`
     * const gameParticipantWithIdOnly = await prisma.gameParticipant.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GameParticipantUpdateManyAndReturnArgs>(args: SelectSubset<T, GameParticipantUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GameParticipant.
     * @param {GameParticipantUpsertArgs} args - Arguments to update or create a GameParticipant.
     * @example
     * // Update or create a GameParticipant
     * const gameParticipant = await prisma.gameParticipant.upsert({
     *   create: {
     *     // ... data to create a GameParticipant
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GameParticipant we want to update
     *   }
     * })
     */
    upsert<T extends GameParticipantUpsertArgs>(args: SelectSubset<T, GameParticipantUpsertArgs<ExtArgs>>): Prisma__GameParticipantClient<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GameParticipants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameParticipantCountArgs} args - Arguments to filter GameParticipants to count.
     * @example
     * // Count the number of GameParticipants
     * const count = await prisma.gameParticipant.count({
     *   where: {
     *     // ... the filter for the GameParticipants we want to count
     *   }
     * })
    **/
    count<T extends GameParticipantCountArgs>(
      args?: Subset<T, GameParticipantCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GameParticipantCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GameParticipant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameParticipantAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GameParticipantAggregateArgs>(args: Subset<T, GameParticipantAggregateArgs>): Prisma.PrismaPromise<GetGameParticipantAggregateType<T>>

    /**
     * Group by GameParticipant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameParticipantGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GameParticipantGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GameParticipantGroupByArgs['orderBy'] }
        : { orderBy?: GameParticipantGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GameParticipantGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGameParticipantGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GameParticipant model
   */
  readonly fields: GameParticipantFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GameParticipant.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GameParticipantClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    gameInstance<T extends GameInstanceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, GameInstanceDefaultArgs<ExtArgs>>): Prisma__GameInstanceClient<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    player<T extends PlayerDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PlayerDefaultArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the GameParticipant model
   */
  interface GameParticipantFieldRefs {
    readonly id: FieldRef<"GameParticipant", 'String'>
    readonly gameInstanceId: FieldRef<"GameParticipant", 'String'>
    readonly playerId: FieldRef<"GameParticipant", 'String'>
    readonly score: FieldRef<"GameParticipant", 'Int'>
    readonly rank: FieldRef<"GameParticipant", 'Int'>
    readonly timeTakenMs: FieldRef<"GameParticipant", 'Int'>
    readonly joinedAt: FieldRef<"GameParticipant", 'DateTime'>
    readonly completedAt: FieldRef<"GameParticipant", 'DateTime'>
    readonly answers: FieldRef<"GameParticipant", 'Json'>
    readonly createdAt: FieldRef<"GameParticipant", 'DateTime'>
    readonly updatedAt: FieldRef<"GameParticipant", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * GameParticipant findUnique
   */
  export type GameParticipantFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    /**
     * Filter, which GameParticipant to fetch.
     */
    where: GameParticipantWhereUniqueInput
  }

  /**
   * GameParticipant findUniqueOrThrow
   */
  export type GameParticipantFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    /**
     * Filter, which GameParticipant to fetch.
     */
    where: GameParticipantWhereUniqueInput
  }

  /**
   * GameParticipant findFirst
   */
  export type GameParticipantFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    /**
     * Filter, which GameParticipant to fetch.
     */
    where?: GameParticipantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameParticipants to fetch.
     */
    orderBy?: GameParticipantOrderByWithRelationInput | GameParticipantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GameParticipants.
     */
    cursor?: GameParticipantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameParticipants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameParticipants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameParticipants.
     */
    distinct?: GameParticipantScalarFieldEnum | GameParticipantScalarFieldEnum[]
  }

  /**
   * GameParticipant findFirstOrThrow
   */
  export type GameParticipantFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    /**
     * Filter, which GameParticipant to fetch.
     */
    where?: GameParticipantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameParticipants to fetch.
     */
    orderBy?: GameParticipantOrderByWithRelationInput | GameParticipantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GameParticipants.
     */
    cursor?: GameParticipantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameParticipants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameParticipants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameParticipants.
     */
    distinct?: GameParticipantScalarFieldEnum | GameParticipantScalarFieldEnum[]
  }

  /**
   * GameParticipant findMany
   */
  export type GameParticipantFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    /**
     * Filter, which GameParticipants to fetch.
     */
    where?: GameParticipantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameParticipants to fetch.
     */
    orderBy?: GameParticipantOrderByWithRelationInput | GameParticipantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GameParticipants.
     */
    cursor?: GameParticipantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameParticipants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameParticipants.
     */
    skip?: number
    distinct?: GameParticipantScalarFieldEnum | GameParticipantScalarFieldEnum[]
  }

  /**
   * GameParticipant create
   */
  export type GameParticipantCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    /**
     * The data needed to create a GameParticipant.
     */
    data: XOR<GameParticipantCreateInput, GameParticipantUncheckedCreateInput>
  }

  /**
   * GameParticipant createMany
   */
  export type GameParticipantCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GameParticipants.
     */
    data: GameParticipantCreateManyInput | GameParticipantCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * GameParticipant createManyAndReturn
   */
  export type GameParticipantCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * The data used to create many GameParticipants.
     */
    data: GameParticipantCreateManyInput | GameParticipantCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * GameParticipant update
   */
  export type GameParticipantUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    /**
     * The data needed to update a GameParticipant.
     */
    data: XOR<GameParticipantUpdateInput, GameParticipantUncheckedUpdateInput>
    /**
     * Choose, which GameParticipant to update.
     */
    where: GameParticipantWhereUniqueInput
  }

  /**
   * GameParticipant updateMany
   */
  export type GameParticipantUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GameParticipants.
     */
    data: XOR<GameParticipantUpdateManyMutationInput, GameParticipantUncheckedUpdateManyInput>
    /**
     * Filter which GameParticipants to update
     */
    where?: GameParticipantWhereInput
    /**
     * Limit how many GameParticipants to update.
     */
    limit?: number
  }

  /**
   * GameParticipant updateManyAndReturn
   */
  export type GameParticipantUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * The data used to update GameParticipants.
     */
    data: XOR<GameParticipantUpdateManyMutationInput, GameParticipantUncheckedUpdateManyInput>
    /**
     * Filter which GameParticipants to update
     */
    where?: GameParticipantWhereInput
    /**
     * Limit how many GameParticipants to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * GameParticipant upsert
   */
  export type GameParticipantUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    /**
     * The filter to search for the GameParticipant to update in case it exists.
     */
    where: GameParticipantWhereUniqueInput
    /**
     * In case the GameParticipant found by the `where` argument doesn't exist, create a new GameParticipant with this data.
     */
    create: XOR<GameParticipantCreateInput, GameParticipantUncheckedCreateInput>
    /**
     * In case the GameParticipant was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GameParticipantUpdateInput, GameParticipantUncheckedUpdateInput>
  }

  /**
   * GameParticipant delete
   */
  export type GameParticipantDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
    /**
     * Filter which GameParticipant to delete.
     */
    where: GameParticipantWhereUniqueInput
  }

  /**
   * GameParticipant deleteMany
   */
  export type GameParticipantDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GameParticipants to delete
     */
    where?: GameParticipantWhereInput
    /**
     * Limit how many GameParticipants to delete.
     */
    limit?: number
  }

  /**
   * GameParticipant without action
   */
  export type GameParticipantDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameParticipant
     */
    select?: GameParticipantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameParticipant
     */
    omit?: GameParticipantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameParticipantInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TeacherScalarFieldEnum: {
    id: 'id',
    username: 'username',
    passwordHash: 'passwordHash',
    email: 'email',
    createdAt: 'createdAt',
    avatarUrl: 'avatarUrl',
    resetToken: 'resetToken',
    resetTokenExpiresAt: 'resetTokenExpiresAt'
  };

  export type TeacherScalarFieldEnum = (typeof TeacherScalarFieldEnum)[keyof typeof TeacherScalarFieldEnum]


  export const PlayerScalarFieldEnum: {
    id: 'id',
    username: 'username',
    cookieId: 'cookieId',
    email: 'email',
    passwordHash: 'passwordHash',
    createdAt: 'createdAt',
    avatarUrl: 'avatarUrl'
  };

  export type PlayerScalarFieldEnum = (typeof PlayerScalarFieldEnum)[keyof typeof PlayerScalarFieldEnum]


  export const QuestionScalarFieldEnum: {
    uid: 'uid',
    title: 'title',
    text: 'text',
    responses: 'responses',
    questionType: 'questionType',
    discipline: 'discipline',
    themes: 'themes',
    difficulty: 'difficulty',
    gradeLevel: 'gradeLevel',
    author: 'author',
    explanation: 'explanation',
    tags: 'tags',
    timeLimit: 'timeLimit',
    isHidden: 'isHidden',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type QuestionScalarFieldEnum = (typeof QuestionScalarFieldEnum)[keyof typeof QuestionScalarFieldEnum]


  export const QuizTemplateScalarFieldEnum: {
    id: 'id',
    name: 'name',
    creatorTeacherId: 'creatorTeacherId',
    gradeLevel: 'gradeLevel',
    themes: 'themes',
    discipline: 'discipline',
    description: 'description',
    defaultMode: 'defaultMode',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type QuizTemplateScalarFieldEnum = (typeof QuizTemplateScalarFieldEnum)[keyof typeof QuizTemplateScalarFieldEnum]


  export const QuestionsInQuizTemplateScalarFieldEnum: {
    quizTemplateId: 'quizTemplateId',
    questionUid: 'questionUid',
    sequence: 'sequence',
    createdAt: 'createdAt'
  };

  export type QuestionsInQuizTemplateScalarFieldEnum = (typeof QuestionsInQuizTemplateScalarFieldEnum)[keyof typeof QuestionsInQuizTemplateScalarFieldEnum]


  export const GameInstanceScalarFieldEnum: {
    id: 'id',
    name: 'name',
    quizTemplateId: 'quizTemplateId',
    initiatorTeacherId: 'initiatorTeacherId',
    accessCode: 'accessCode',
    status: 'status',
    playMode: 'playMode',
    leaderboard: 'leaderboard',
    currentQuestionIndex: 'currentQuestionIndex',
    settings: 'settings',
    createdAt: 'createdAt',
    startedAt: 'startedAt',
    endedAt: 'endedAt'
  };

  export type GameInstanceScalarFieldEnum = (typeof GameInstanceScalarFieldEnum)[keyof typeof GameInstanceScalarFieldEnum]


  export const GameParticipantScalarFieldEnum: {
    id: 'id',
    gameInstanceId: 'gameInstanceId',
    playerId: 'playerId',
    score: 'score',
    rank: 'rank',
    timeTakenMs: 'timeTakenMs',
    joinedAt: 'joinedAt',
    completedAt: 'completedAt',
    answers: 'answers',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type GameParticipantScalarFieldEnum = (typeof GameParticipantScalarFieldEnum)[keyof typeof GameParticipantScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'PlayMode'
   */
  export type EnumPlayModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PlayMode'>
    


  /**
   * Reference to a field of type 'PlayMode[]'
   */
  export type ListEnumPlayModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PlayMode[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type TeacherWhereInput = {
    AND?: TeacherWhereInput | TeacherWhereInput[]
    OR?: TeacherWhereInput[]
    NOT?: TeacherWhereInput | TeacherWhereInput[]
    id?: StringFilter<"Teacher"> | string
    username?: StringFilter<"Teacher"> | string
    passwordHash?: StringFilter<"Teacher"> | string
    email?: StringNullableFilter<"Teacher"> | string | null
    createdAt?: DateTimeFilter<"Teacher"> | Date | string
    avatarUrl?: StringNullableFilter<"Teacher"> | string | null
    resetToken?: StringNullableFilter<"Teacher"> | string | null
    resetTokenExpiresAt?: DateTimeNullableFilter<"Teacher"> | Date | string | null
    quizTemplates?: QuizTemplateListRelationFilter
    gameInstances?: GameInstanceListRelationFilter
  }

  export type TeacherOrderByWithRelationInput = {
    id?: SortOrder
    username?: SortOrder
    passwordHash?: SortOrder
    email?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    resetToken?: SortOrderInput | SortOrder
    resetTokenExpiresAt?: SortOrderInput | SortOrder
    quizTemplates?: QuizTemplateOrderByRelationAggregateInput
    gameInstances?: GameInstanceOrderByRelationAggregateInput
  }

  export type TeacherWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    username?: string
    email?: string
    AND?: TeacherWhereInput | TeacherWhereInput[]
    OR?: TeacherWhereInput[]
    NOT?: TeacherWhereInput | TeacherWhereInput[]
    passwordHash?: StringFilter<"Teacher"> | string
    createdAt?: DateTimeFilter<"Teacher"> | Date | string
    avatarUrl?: StringNullableFilter<"Teacher"> | string | null
    resetToken?: StringNullableFilter<"Teacher"> | string | null
    resetTokenExpiresAt?: DateTimeNullableFilter<"Teacher"> | Date | string | null
    quizTemplates?: QuizTemplateListRelationFilter
    gameInstances?: GameInstanceListRelationFilter
  }, "id" | "username" | "email">

  export type TeacherOrderByWithAggregationInput = {
    id?: SortOrder
    username?: SortOrder
    passwordHash?: SortOrder
    email?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    resetToken?: SortOrderInput | SortOrder
    resetTokenExpiresAt?: SortOrderInput | SortOrder
    _count?: TeacherCountOrderByAggregateInput
    _max?: TeacherMaxOrderByAggregateInput
    _min?: TeacherMinOrderByAggregateInput
  }

  export type TeacherScalarWhereWithAggregatesInput = {
    AND?: TeacherScalarWhereWithAggregatesInput | TeacherScalarWhereWithAggregatesInput[]
    OR?: TeacherScalarWhereWithAggregatesInput[]
    NOT?: TeacherScalarWhereWithAggregatesInput | TeacherScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Teacher"> | string
    username?: StringWithAggregatesFilter<"Teacher"> | string
    passwordHash?: StringWithAggregatesFilter<"Teacher"> | string
    email?: StringNullableWithAggregatesFilter<"Teacher"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Teacher"> | Date | string
    avatarUrl?: StringNullableWithAggregatesFilter<"Teacher"> | string | null
    resetToken?: StringNullableWithAggregatesFilter<"Teacher"> | string | null
    resetTokenExpiresAt?: DateTimeNullableWithAggregatesFilter<"Teacher"> | Date | string | null
  }

  export type PlayerWhereInput = {
    AND?: PlayerWhereInput | PlayerWhereInput[]
    OR?: PlayerWhereInput[]
    NOT?: PlayerWhereInput | PlayerWhereInput[]
    id?: StringFilter<"Player"> | string
    username?: StringFilter<"Player"> | string
    cookieId?: StringFilter<"Player"> | string
    email?: StringNullableFilter<"Player"> | string | null
    passwordHash?: StringNullableFilter<"Player"> | string | null
    createdAt?: DateTimeFilter<"Player"> | Date | string
    avatarUrl?: StringNullableFilter<"Player"> | string | null
    gameParticipations?: GameParticipantListRelationFilter
  }

  export type PlayerOrderByWithRelationInput = {
    id?: SortOrder
    username?: SortOrder
    cookieId?: SortOrder
    email?: SortOrderInput | SortOrder
    passwordHash?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    gameParticipations?: GameParticipantOrderByRelationAggregateInput
  }

  export type PlayerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    username?: string
    cookieId?: string
    email?: string
    AND?: PlayerWhereInput | PlayerWhereInput[]
    OR?: PlayerWhereInput[]
    NOT?: PlayerWhereInput | PlayerWhereInput[]
    passwordHash?: StringNullableFilter<"Player"> | string | null
    createdAt?: DateTimeFilter<"Player"> | Date | string
    avatarUrl?: StringNullableFilter<"Player"> | string | null
    gameParticipations?: GameParticipantListRelationFilter
  }, "id" | "username" | "cookieId" | "email">

  export type PlayerOrderByWithAggregationInput = {
    id?: SortOrder
    username?: SortOrder
    cookieId?: SortOrder
    email?: SortOrderInput | SortOrder
    passwordHash?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    _count?: PlayerCountOrderByAggregateInput
    _max?: PlayerMaxOrderByAggregateInput
    _min?: PlayerMinOrderByAggregateInput
  }

  export type PlayerScalarWhereWithAggregatesInput = {
    AND?: PlayerScalarWhereWithAggregatesInput | PlayerScalarWhereWithAggregatesInput[]
    OR?: PlayerScalarWhereWithAggregatesInput[]
    NOT?: PlayerScalarWhereWithAggregatesInput | PlayerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Player"> | string
    username?: StringWithAggregatesFilter<"Player"> | string
    cookieId?: StringWithAggregatesFilter<"Player"> | string
    email?: StringNullableWithAggregatesFilter<"Player"> | string | null
    passwordHash?: StringNullableWithAggregatesFilter<"Player"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Player"> | Date | string
    avatarUrl?: StringNullableWithAggregatesFilter<"Player"> | string | null
  }

  export type QuestionWhereInput = {
    AND?: QuestionWhereInput | QuestionWhereInput[]
    OR?: QuestionWhereInput[]
    NOT?: QuestionWhereInput | QuestionWhereInput[]
    uid?: StringFilter<"Question"> | string
    title?: StringNullableFilter<"Question"> | string | null
    text?: StringFilter<"Question"> | string
    responses?: JsonFilter<"Question">
    questionType?: StringFilter<"Question"> | string
    discipline?: StringFilter<"Question"> | string
    themes?: StringNullableListFilter<"Question">
    difficulty?: IntNullableFilter<"Question"> | number | null
    gradeLevel?: StringNullableFilter<"Question"> | string | null
    author?: StringNullableFilter<"Question"> | string | null
    explanation?: StringNullableFilter<"Question"> | string | null
    tags?: StringNullableListFilter<"Question">
    timeLimit?: IntNullableFilter<"Question"> | number | null
    isHidden?: BoolNullableFilter<"Question"> | boolean | null
    createdAt?: DateTimeFilter<"Question"> | Date | string
    updatedAt?: DateTimeFilter<"Question"> | Date | string
    quizTemplates?: QuestionsInQuizTemplateListRelationFilter
  }

  export type QuestionOrderByWithRelationInput = {
    uid?: SortOrder
    title?: SortOrderInput | SortOrder
    text?: SortOrder
    responses?: SortOrder
    questionType?: SortOrder
    discipline?: SortOrder
    themes?: SortOrder
    difficulty?: SortOrderInput | SortOrder
    gradeLevel?: SortOrderInput | SortOrder
    author?: SortOrderInput | SortOrder
    explanation?: SortOrderInput | SortOrder
    tags?: SortOrder
    timeLimit?: SortOrderInput | SortOrder
    isHidden?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    quizTemplates?: QuestionsInQuizTemplateOrderByRelationAggregateInput
  }

  export type QuestionWhereUniqueInput = Prisma.AtLeast<{
    uid?: string
    AND?: QuestionWhereInput | QuestionWhereInput[]
    OR?: QuestionWhereInput[]
    NOT?: QuestionWhereInput | QuestionWhereInput[]
    title?: StringNullableFilter<"Question"> | string | null
    text?: StringFilter<"Question"> | string
    responses?: JsonFilter<"Question">
    questionType?: StringFilter<"Question"> | string
    discipline?: StringFilter<"Question"> | string
    themes?: StringNullableListFilter<"Question">
    difficulty?: IntNullableFilter<"Question"> | number | null
    gradeLevel?: StringNullableFilter<"Question"> | string | null
    author?: StringNullableFilter<"Question"> | string | null
    explanation?: StringNullableFilter<"Question"> | string | null
    tags?: StringNullableListFilter<"Question">
    timeLimit?: IntNullableFilter<"Question"> | number | null
    isHidden?: BoolNullableFilter<"Question"> | boolean | null
    createdAt?: DateTimeFilter<"Question"> | Date | string
    updatedAt?: DateTimeFilter<"Question"> | Date | string
    quizTemplates?: QuestionsInQuizTemplateListRelationFilter
  }, "uid">

  export type QuestionOrderByWithAggregationInput = {
    uid?: SortOrder
    title?: SortOrderInput | SortOrder
    text?: SortOrder
    responses?: SortOrder
    questionType?: SortOrder
    discipline?: SortOrder
    themes?: SortOrder
    difficulty?: SortOrderInput | SortOrder
    gradeLevel?: SortOrderInput | SortOrder
    author?: SortOrderInput | SortOrder
    explanation?: SortOrderInput | SortOrder
    tags?: SortOrder
    timeLimit?: SortOrderInput | SortOrder
    isHidden?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: QuestionCountOrderByAggregateInput
    _avg?: QuestionAvgOrderByAggregateInput
    _max?: QuestionMaxOrderByAggregateInput
    _min?: QuestionMinOrderByAggregateInput
    _sum?: QuestionSumOrderByAggregateInput
  }

  export type QuestionScalarWhereWithAggregatesInput = {
    AND?: QuestionScalarWhereWithAggregatesInput | QuestionScalarWhereWithAggregatesInput[]
    OR?: QuestionScalarWhereWithAggregatesInput[]
    NOT?: QuestionScalarWhereWithAggregatesInput | QuestionScalarWhereWithAggregatesInput[]
    uid?: StringWithAggregatesFilter<"Question"> | string
    title?: StringNullableWithAggregatesFilter<"Question"> | string | null
    text?: StringWithAggregatesFilter<"Question"> | string
    responses?: JsonWithAggregatesFilter<"Question">
    questionType?: StringWithAggregatesFilter<"Question"> | string
    discipline?: StringWithAggregatesFilter<"Question"> | string
    themes?: StringNullableListFilter<"Question">
    difficulty?: IntNullableWithAggregatesFilter<"Question"> | number | null
    gradeLevel?: StringNullableWithAggregatesFilter<"Question"> | string | null
    author?: StringNullableWithAggregatesFilter<"Question"> | string | null
    explanation?: StringNullableWithAggregatesFilter<"Question"> | string | null
    tags?: StringNullableListFilter<"Question">
    timeLimit?: IntNullableWithAggregatesFilter<"Question"> | number | null
    isHidden?: BoolNullableWithAggregatesFilter<"Question"> | boolean | null
    createdAt?: DateTimeWithAggregatesFilter<"Question"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Question"> | Date | string
  }

  export type QuizTemplateWhereInput = {
    AND?: QuizTemplateWhereInput | QuizTemplateWhereInput[]
    OR?: QuizTemplateWhereInput[]
    NOT?: QuizTemplateWhereInput | QuizTemplateWhereInput[]
    id?: StringFilter<"QuizTemplate"> | string
    name?: StringFilter<"QuizTemplate"> | string
    creatorTeacherId?: StringFilter<"QuizTemplate"> | string
    gradeLevel?: StringNullableFilter<"QuizTemplate"> | string | null
    themes?: StringNullableListFilter<"QuizTemplate">
    discipline?: StringNullableFilter<"QuizTemplate"> | string | null
    description?: StringNullableFilter<"QuizTemplate"> | string | null
    defaultMode?: EnumPlayModeNullableFilter<"QuizTemplate"> | $Enums.PlayMode | null
    createdAt?: DateTimeFilter<"QuizTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"QuizTemplate"> | Date | string
    creatorTeacher?: XOR<TeacherScalarRelationFilter, TeacherWhereInput>
    questions?: QuestionsInQuizTemplateListRelationFilter
    gameInstances?: GameInstanceListRelationFilter
  }

  export type QuizTemplateOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    creatorTeacherId?: SortOrder
    gradeLevel?: SortOrderInput | SortOrder
    themes?: SortOrder
    discipline?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    defaultMode?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creatorTeacher?: TeacherOrderByWithRelationInput
    questions?: QuestionsInQuizTemplateOrderByRelationAggregateInput
    gameInstances?: GameInstanceOrderByRelationAggregateInput
  }

  export type QuizTemplateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QuizTemplateWhereInput | QuizTemplateWhereInput[]
    OR?: QuizTemplateWhereInput[]
    NOT?: QuizTemplateWhereInput | QuizTemplateWhereInput[]
    name?: StringFilter<"QuizTemplate"> | string
    creatorTeacherId?: StringFilter<"QuizTemplate"> | string
    gradeLevel?: StringNullableFilter<"QuizTemplate"> | string | null
    themes?: StringNullableListFilter<"QuizTemplate">
    discipline?: StringNullableFilter<"QuizTemplate"> | string | null
    description?: StringNullableFilter<"QuizTemplate"> | string | null
    defaultMode?: EnumPlayModeNullableFilter<"QuizTemplate"> | $Enums.PlayMode | null
    createdAt?: DateTimeFilter<"QuizTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"QuizTemplate"> | Date | string
    creatorTeacher?: XOR<TeacherScalarRelationFilter, TeacherWhereInput>
    questions?: QuestionsInQuizTemplateListRelationFilter
    gameInstances?: GameInstanceListRelationFilter
  }, "id">

  export type QuizTemplateOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    creatorTeacherId?: SortOrder
    gradeLevel?: SortOrderInput | SortOrder
    themes?: SortOrder
    discipline?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    defaultMode?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: QuizTemplateCountOrderByAggregateInput
    _max?: QuizTemplateMaxOrderByAggregateInput
    _min?: QuizTemplateMinOrderByAggregateInput
  }

  export type QuizTemplateScalarWhereWithAggregatesInput = {
    AND?: QuizTemplateScalarWhereWithAggregatesInput | QuizTemplateScalarWhereWithAggregatesInput[]
    OR?: QuizTemplateScalarWhereWithAggregatesInput[]
    NOT?: QuizTemplateScalarWhereWithAggregatesInput | QuizTemplateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuizTemplate"> | string
    name?: StringWithAggregatesFilter<"QuizTemplate"> | string
    creatorTeacherId?: StringWithAggregatesFilter<"QuizTemplate"> | string
    gradeLevel?: StringNullableWithAggregatesFilter<"QuizTemplate"> | string | null
    themes?: StringNullableListFilter<"QuizTemplate">
    discipline?: StringNullableWithAggregatesFilter<"QuizTemplate"> | string | null
    description?: StringNullableWithAggregatesFilter<"QuizTemplate"> | string | null
    defaultMode?: EnumPlayModeNullableWithAggregatesFilter<"QuizTemplate"> | $Enums.PlayMode | null
    createdAt?: DateTimeWithAggregatesFilter<"QuizTemplate"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"QuizTemplate"> | Date | string
  }

  export type QuestionsInQuizTemplateWhereInput = {
    AND?: QuestionsInQuizTemplateWhereInput | QuestionsInQuizTemplateWhereInput[]
    OR?: QuestionsInQuizTemplateWhereInput[]
    NOT?: QuestionsInQuizTemplateWhereInput | QuestionsInQuizTemplateWhereInput[]
    quizTemplateId?: StringFilter<"QuestionsInQuizTemplate"> | string
    questionUid?: StringFilter<"QuestionsInQuizTemplate"> | string
    sequence?: IntFilter<"QuestionsInQuizTemplate"> | number
    createdAt?: DateTimeFilter<"QuestionsInQuizTemplate"> | Date | string
    quizTemplate?: XOR<QuizTemplateScalarRelationFilter, QuizTemplateWhereInput>
    question?: XOR<QuestionScalarRelationFilter, QuestionWhereInput>
  }

  export type QuestionsInQuizTemplateOrderByWithRelationInput = {
    quizTemplateId?: SortOrder
    questionUid?: SortOrder
    sequence?: SortOrder
    createdAt?: SortOrder
    quizTemplate?: QuizTemplateOrderByWithRelationInput
    question?: QuestionOrderByWithRelationInput
  }

  export type QuestionsInQuizTemplateWhereUniqueInput = Prisma.AtLeast<{
    quizTemplateId_questionUid?: QuestionsInQuizTemplateQuizTemplateIdQuestionUidCompoundUniqueInput
    quizTemplateId_sequence?: QuestionsInQuizTemplateQuizTemplateIdSequenceCompoundUniqueInput
    AND?: QuestionsInQuizTemplateWhereInput | QuestionsInQuizTemplateWhereInput[]
    OR?: QuestionsInQuizTemplateWhereInput[]
    NOT?: QuestionsInQuizTemplateWhereInput | QuestionsInQuizTemplateWhereInput[]
    quizTemplateId?: StringFilter<"QuestionsInQuizTemplate"> | string
    questionUid?: StringFilter<"QuestionsInQuizTemplate"> | string
    sequence?: IntFilter<"QuestionsInQuizTemplate"> | number
    createdAt?: DateTimeFilter<"QuestionsInQuizTemplate"> | Date | string
    quizTemplate?: XOR<QuizTemplateScalarRelationFilter, QuizTemplateWhereInput>
    question?: XOR<QuestionScalarRelationFilter, QuestionWhereInput>
  }, "quizTemplateId_sequence" | "quizTemplateId_questionUid">

  export type QuestionsInQuizTemplateOrderByWithAggregationInput = {
    quizTemplateId?: SortOrder
    questionUid?: SortOrder
    sequence?: SortOrder
    createdAt?: SortOrder
    _count?: QuestionsInQuizTemplateCountOrderByAggregateInput
    _avg?: QuestionsInQuizTemplateAvgOrderByAggregateInput
    _max?: QuestionsInQuizTemplateMaxOrderByAggregateInput
    _min?: QuestionsInQuizTemplateMinOrderByAggregateInput
    _sum?: QuestionsInQuizTemplateSumOrderByAggregateInput
  }

  export type QuestionsInQuizTemplateScalarWhereWithAggregatesInput = {
    AND?: QuestionsInQuizTemplateScalarWhereWithAggregatesInput | QuestionsInQuizTemplateScalarWhereWithAggregatesInput[]
    OR?: QuestionsInQuizTemplateScalarWhereWithAggregatesInput[]
    NOT?: QuestionsInQuizTemplateScalarWhereWithAggregatesInput | QuestionsInQuizTemplateScalarWhereWithAggregatesInput[]
    quizTemplateId?: StringWithAggregatesFilter<"QuestionsInQuizTemplate"> | string
    questionUid?: StringWithAggregatesFilter<"QuestionsInQuizTemplate"> | string
    sequence?: IntWithAggregatesFilter<"QuestionsInQuizTemplate"> | number
    createdAt?: DateTimeWithAggregatesFilter<"QuestionsInQuizTemplate"> | Date | string
  }

  export type GameInstanceWhereInput = {
    AND?: GameInstanceWhereInput | GameInstanceWhereInput[]
    OR?: GameInstanceWhereInput[]
    NOT?: GameInstanceWhereInput | GameInstanceWhereInput[]
    id?: StringFilter<"GameInstance"> | string
    name?: StringFilter<"GameInstance"> | string
    quizTemplateId?: StringFilter<"GameInstance"> | string
    initiatorTeacherId?: StringNullableFilter<"GameInstance"> | string | null
    accessCode?: StringFilter<"GameInstance"> | string
    status?: StringFilter<"GameInstance"> | string
    playMode?: EnumPlayModeFilter<"GameInstance"> | $Enums.PlayMode
    leaderboard?: JsonNullableFilter<"GameInstance">
    currentQuestionIndex?: IntNullableFilter<"GameInstance"> | number | null
    settings?: JsonNullableFilter<"GameInstance">
    createdAt?: DateTimeFilter<"GameInstance"> | Date | string
    startedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    quizTemplate?: XOR<QuizTemplateScalarRelationFilter, QuizTemplateWhereInput>
    initiatorTeacher?: XOR<TeacherNullableScalarRelationFilter, TeacherWhereInput> | null
    participants?: GameParticipantListRelationFilter
  }

  export type GameInstanceOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    quizTemplateId?: SortOrder
    initiatorTeacherId?: SortOrderInput | SortOrder
    accessCode?: SortOrder
    status?: SortOrder
    playMode?: SortOrder
    leaderboard?: SortOrderInput | SortOrder
    currentQuestionIndex?: SortOrderInput | SortOrder
    settings?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    endedAt?: SortOrderInput | SortOrder
    quizTemplate?: QuizTemplateOrderByWithRelationInput
    initiatorTeacher?: TeacherOrderByWithRelationInput
    participants?: GameParticipantOrderByRelationAggregateInput
  }

  export type GameInstanceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    accessCode?: string
    AND?: GameInstanceWhereInput | GameInstanceWhereInput[]
    OR?: GameInstanceWhereInput[]
    NOT?: GameInstanceWhereInput | GameInstanceWhereInput[]
    name?: StringFilter<"GameInstance"> | string
    quizTemplateId?: StringFilter<"GameInstance"> | string
    initiatorTeacherId?: StringNullableFilter<"GameInstance"> | string | null
    status?: StringFilter<"GameInstance"> | string
    playMode?: EnumPlayModeFilter<"GameInstance"> | $Enums.PlayMode
    leaderboard?: JsonNullableFilter<"GameInstance">
    currentQuestionIndex?: IntNullableFilter<"GameInstance"> | number | null
    settings?: JsonNullableFilter<"GameInstance">
    createdAt?: DateTimeFilter<"GameInstance"> | Date | string
    startedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    quizTemplate?: XOR<QuizTemplateScalarRelationFilter, QuizTemplateWhereInput>
    initiatorTeacher?: XOR<TeacherNullableScalarRelationFilter, TeacherWhereInput> | null
    participants?: GameParticipantListRelationFilter
  }, "id" | "accessCode">

  export type GameInstanceOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    quizTemplateId?: SortOrder
    initiatorTeacherId?: SortOrderInput | SortOrder
    accessCode?: SortOrder
    status?: SortOrder
    playMode?: SortOrder
    leaderboard?: SortOrderInput | SortOrder
    currentQuestionIndex?: SortOrderInput | SortOrder
    settings?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    endedAt?: SortOrderInput | SortOrder
    _count?: GameInstanceCountOrderByAggregateInput
    _avg?: GameInstanceAvgOrderByAggregateInput
    _max?: GameInstanceMaxOrderByAggregateInput
    _min?: GameInstanceMinOrderByAggregateInput
    _sum?: GameInstanceSumOrderByAggregateInput
  }

  export type GameInstanceScalarWhereWithAggregatesInput = {
    AND?: GameInstanceScalarWhereWithAggregatesInput | GameInstanceScalarWhereWithAggregatesInput[]
    OR?: GameInstanceScalarWhereWithAggregatesInput[]
    NOT?: GameInstanceScalarWhereWithAggregatesInput | GameInstanceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"GameInstance"> | string
    name?: StringWithAggregatesFilter<"GameInstance"> | string
    quizTemplateId?: StringWithAggregatesFilter<"GameInstance"> | string
    initiatorTeacherId?: StringNullableWithAggregatesFilter<"GameInstance"> | string | null
    accessCode?: StringWithAggregatesFilter<"GameInstance"> | string
    status?: StringWithAggregatesFilter<"GameInstance"> | string
    playMode?: EnumPlayModeWithAggregatesFilter<"GameInstance"> | $Enums.PlayMode
    leaderboard?: JsonNullableWithAggregatesFilter<"GameInstance">
    currentQuestionIndex?: IntNullableWithAggregatesFilter<"GameInstance"> | number | null
    settings?: JsonNullableWithAggregatesFilter<"GameInstance">
    createdAt?: DateTimeWithAggregatesFilter<"GameInstance"> | Date | string
    startedAt?: DateTimeNullableWithAggregatesFilter<"GameInstance"> | Date | string | null
    endedAt?: DateTimeNullableWithAggregatesFilter<"GameInstance"> | Date | string | null
  }

  export type GameParticipantWhereInput = {
    AND?: GameParticipantWhereInput | GameParticipantWhereInput[]
    OR?: GameParticipantWhereInput[]
    NOT?: GameParticipantWhereInput | GameParticipantWhereInput[]
    id?: StringFilter<"GameParticipant"> | string
    gameInstanceId?: StringFilter<"GameParticipant"> | string
    playerId?: StringFilter<"GameParticipant"> | string
    score?: IntFilter<"GameParticipant"> | number
    rank?: IntNullableFilter<"GameParticipant"> | number | null
    timeTakenMs?: IntNullableFilter<"GameParticipant"> | number | null
    joinedAt?: DateTimeFilter<"GameParticipant"> | Date | string
    completedAt?: DateTimeNullableFilter<"GameParticipant"> | Date | string | null
    answers?: JsonNullableFilter<"GameParticipant">
    createdAt?: DateTimeFilter<"GameParticipant"> | Date | string
    updatedAt?: DateTimeFilter<"GameParticipant"> | Date | string
    gameInstance?: XOR<GameInstanceScalarRelationFilter, GameInstanceWhereInput>
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>
  }

  export type GameParticipantOrderByWithRelationInput = {
    id?: SortOrder
    gameInstanceId?: SortOrder
    playerId?: SortOrder
    score?: SortOrder
    rank?: SortOrderInput | SortOrder
    timeTakenMs?: SortOrderInput | SortOrder
    joinedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    answers?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    gameInstance?: GameInstanceOrderByWithRelationInput
    player?: PlayerOrderByWithRelationInput
  }

  export type GameParticipantWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    gameInstanceId_playerId?: GameParticipantGameInstanceIdPlayerIdCompoundUniqueInput
    AND?: GameParticipantWhereInput | GameParticipantWhereInput[]
    OR?: GameParticipantWhereInput[]
    NOT?: GameParticipantWhereInput | GameParticipantWhereInput[]
    gameInstanceId?: StringFilter<"GameParticipant"> | string
    playerId?: StringFilter<"GameParticipant"> | string
    score?: IntFilter<"GameParticipant"> | number
    rank?: IntNullableFilter<"GameParticipant"> | number | null
    timeTakenMs?: IntNullableFilter<"GameParticipant"> | number | null
    joinedAt?: DateTimeFilter<"GameParticipant"> | Date | string
    completedAt?: DateTimeNullableFilter<"GameParticipant"> | Date | string | null
    answers?: JsonNullableFilter<"GameParticipant">
    createdAt?: DateTimeFilter<"GameParticipant"> | Date | string
    updatedAt?: DateTimeFilter<"GameParticipant"> | Date | string
    gameInstance?: XOR<GameInstanceScalarRelationFilter, GameInstanceWhereInput>
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>
  }, "id" | "gameInstanceId_playerId">

  export type GameParticipantOrderByWithAggregationInput = {
    id?: SortOrder
    gameInstanceId?: SortOrder
    playerId?: SortOrder
    score?: SortOrder
    rank?: SortOrderInput | SortOrder
    timeTakenMs?: SortOrderInput | SortOrder
    joinedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    answers?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: GameParticipantCountOrderByAggregateInput
    _avg?: GameParticipantAvgOrderByAggregateInput
    _max?: GameParticipantMaxOrderByAggregateInput
    _min?: GameParticipantMinOrderByAggregateInput
    _sum?: GameParticipantSumOrderByAggregateInput
  }

  export type GameParticipantScalarWhereWithAggregatesInput = {
    AND?: GameParticipantScalarWhereWithAggregatesInput | GameParticipantScalarWhereWithAggregatesInput[]
    OR?: GameParticipantScalarWhereWithAggregatesInput[]
    NOT?: GameParticipantScalarWhereWithAggregatesInput | GameParticipantScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"GameParticipant"> | string
    gameInstanceId?: StringWithAggregatesFilter<"GameParticipant"> | string
    playerId?: StringWithAggregatesFilter<"GameParticipant"> | string
    score?: IntWithAggregatesFilter<"GameParticipant"> | number
    rank?: IntNullableWithAggregatesFilter<"GameParticipant"> | number | null
    timeTakenMs?: IntNullableWithAggregatesFilter<"GameParticipant"> | number | null
    joinedAt?: DateTimeWithAggregatesFilter<"GameParticipant"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"GameParticipant"> | Date | string | null
    answers?: JsonNullableWithAggregatesFilter<"GameParticipant">
    createdAt?: DateTimeWithAggregatesFilter<"GameParticipant"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"GameParticipant"> | Date | string
  }

  export type TeacherCreateInput = {
    id?: string
    username: string
    passwordHash: string
    email?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    quizTemplates?: QuizTemplateCreateNestedManyWithoutCreatorTeacherInput
    gameInstances?: GameInstanceCreateNestedManyWithoutInitiatorTeacherInput
  }

  export type TeacherUncheckedCreateInput = {
    id?: string
    username: string
    passwordHash: string
    email?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    quizTemplates?: QuizTemplateUncheckedCreateNestedManyWithoutCreatorTeacherInput
    gameInstances?: GameInstanceUncheckedCreateNestedManyWithoutInitiatorTeacherInput
  }

  export type TeacherUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quizTemplates?: QuizTemplateUpdateManyWithoutCreatorTeacherNestedInput
    gameInstances?: GameInstanceUpdateManyWithoutInitiatorTeacherNestedInput
  }

  export type TeacherUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quizTemplates?: QuizTemplateUncheckedUpdateManyWithoutCreatorTeacherNestedInput
    gameInstances?: GameInstanceUncheckedUpdateManyWithoutInitiatorTeacherNestedInput
  }

  export type TeacherCreateManyInput = {
    id?: string
    username: string
    passwordHash: string
    email?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
  }

  export type TeacherUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TeacherUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PlayerCreateInput = {
    id?: string
    username: string
    cookieId: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
    gameParticipations?: GameParticipantCreateNestedManyWithoutPlayerInput
  }

  export type PlayerUncheckedCreateInput = {
    id?: string
    username: string
    cookieId: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
    gameParticipations?: GameParticipantUncheckedCreateNestedManyWithoutPlayerInput
  }

  export type PlayerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    cookieId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    gameParticipations?: GameParticipantUpdateManyWithoutPlayerNestedInput
  }

  export type PlayerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    cookieId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    gameParticipations?: GameParticipantUncheckedUpdateManyWithoutPlayerNestedInput
  }

  export type PlayerCreateManyInput = {
    id?: string
    username: string
    cookieId: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
  }

  export type PlayerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    cookieId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PlayerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    cookieId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QuestionCreateInput = {
    uid?: string
    title?: string | null
    text: string
    responses: JsonNullValueInput | InputJsonValue
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit?: number | null
    isHidden?: boolean | null
    createdAt?: Date | string
    updatedAt?: Date | string
    quizTemplates?: QuestionsInQuizTemplateCreateNestedManyWithoutQuestionInput
  }

  export type QuestionUncheckedCreateInput = {
    uid?: string
    title?: string | null
    text: string
    responses: JsonNullValueInput | InputJsonValue
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit?: number | null
    isHidden?: boolean | null
    createdAt?: Date | string
    updatedAt?: Date | string
    quizTemplates?: QuestionsInQuizTemplateUncheckedCreateNestedManyWithoutQuestionInput
  }

  export type QuestionUpdateInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    responses?: JsonNullValueInput | InputJsonValue
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quizTemplates?: QuestionsInQuizTemplateUpdateManyWithoutQuestionNestedInput
  }

  export type QuestionUncheckedUpdateInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    responses?: JsonNullValueInput | InputJsonValue
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quizTemplates?: QuestionsInQuizTemplateUncheckedUpdateManyWithoutQuestionNestedInput
  }

  export type QuestionCreateManyInput = {
    uid?: string
    title?: string | null
    text: string
    responses: JsonNullValueInput | InputJsonValue
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit?: number | null
    isHidden?: boolean | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuestionUpdateManyMutationInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    responses?: JsonNullValueInput | InputJsonValue
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionUncheckedUpdateManyInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    responses?: JsonNullValueInput | InputJsonValue
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizTemplateCreateInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: QuizTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creatorTeacher: TeacherCreateNestedOneWithoutQuizTemplatesInput
    questions?: QuestionsInQuizTemplateCreateNestedManyWithoutQuizTemplateInput
    gameInstances?: GameInstanceCreateNestedManyWithoutQuizTemplateInput
  }

  export type QuizTemplateUncheckedCreateInput = {
    id?: string
    name: string
    creatorTeacherId: string
    gradeLevel?: string | null
    themes?: QuizTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    questions?: QuestionsInQuizTemplateUncheckedCreateNestedManyWithoutQuizTemplateInput
    gameInstances?: GameInstanceUncheckedCreateNestedManyWithoutQuizTemplateInput
  }

  export type QuizTemplateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorTeacher?: TeacherUpdateOneRequiredWithoutQuizTemplatesNestedInput
    questions?: QuestionsInQuizTemplateUpdateManyWithoutQuizTemplateNestedInput
    gameInstances?: GameInstanceUpdateManyWithoutQuizTemplateNestedInput
  }

  export type QuizTemplateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    creatorTeacherId?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questions?: QuestionsInQuizTemplateUncheckedUpdateManyWithoutQuizTemplateNestedInput
    gameInstances?: GameInstanceUncheckedUpdateManyWithoutQuizTemplateNestedInput
  }

  export type QuizTemplateCreateManyInput = {
    id?: string
    name: string
    creatorTeacherId: string
    gradeLevel?: string | null
    themes?: QuizTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuizTemplateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizTemplateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    creatorTeacherId?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInQuizTemplateCreateInput = {
    sequence: number
    createdAt?: Date | string
    quizTemplate: QuizTemplateCreateNestedOneWithoutQuestionsInput
    question: QuestionCreateNestedOneWithoutQuizTemplatesInput
  }

  export type QuestionsInQuizTemplateUncheckedCreateInput = {
    quizTemplateId: string
    questionUid: string
    sequence: number
    createdAt?: Date | string
  }

  export type QuestionsInQuizTemplateUpdateInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quizTemplate?: QuizTemplateUpdateOneRequiredWithoutQuestionsNestedInput
    question?: QuestionUpdateOneRequiredWithoutQuizTemplatesNestedInput
  }

  export type QuestionsInQuizTemplateUncheckedUpdateInput = {
    quizTemplateId?: StringFieldUpdateOperationsInput | string
    questionUid?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInQuizTemplateCreateManyInput = {
    quizTemplateId: string
    questionUid: string
    sequence: number
    createdAt?: Date | string
  }

  export type QuestionsInQuizTemplateUpdateManyMutationInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInQuizTemplateUncheckedUpdateManyInput = {
    quizTemplateId?: StringFieldUpdateOperationsInput | string
    questionUid?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameInstanceCreateInput = {
    id?: string
    name: string
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    quizTemplate: QuizTemplateCreateNestedOneWithoutGameInstancesInput
    initiatorTeacher?: TeacherCreateNestedOneWithoutGameInstancesInput
    participants?: GameParticipantCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceUncheckedCreateInput = {
    id?: string
    name: string
    quizTemplateId: string
    initiatorTeacherId?: string | null
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    participants?: GameParticipantUncheckedCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quizTemplate?: QuizTemplateUpdateOneRequiredWithoutGameInstancesNestedInput
    initiatorTeacher?: TeacherUpdateOneWithoutGameInstancesNestedInput
    participants?: GameParticipantUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    quizTemplateId?: StringFieldUpdateOperationsInput | string
    initiatorTeacherId?: NullableStringFieldUpdateOperationsInput | string | null
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    participants?: GameParticipantUncheckedUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceCreateManyInput = {
    id?: string
    name: string
    quizTemplateId: string
    initiatorTeacherId?: string | null
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
  }

  export type GameInstanceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameInstanceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    quizTemplateId?: StringFieldUpdateOperationsInput | string
    initiatorTeacherId?: NullableStringFieldUpdateOperationsInput | string | null
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameParticipantCreateInput = {
    id?: string
    score?: number
    rank?: number | null
    timeTakenMs?: number | null
    joinedAt?: Date | string
    completedAt?: Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    gameInstance: GameInstanceCreateNestedOneWithoutParticipantsInput
    player: PlayerCreateNestedOneWithoutGameParticipationsInput
  }

  export type GameParticipantUncheckedCreateInput = {
    id?: string
    gameInstanceId: string
    playerId: string
    score?: number
    rank?: number | null
    timeTakenMs?: number | null
    joinedAt?: Date | string
    completedAt?: Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GameParticipantUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    rank?: NullableIntFieldUpdateOperationsInput | number | null
    timeTakenMs?: NullableIntFieldUpdateOperationsInput | number | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameInstance?: GameInstanceUpdateOneRequiredWithoutParticipantsNestedInput
    player?: PlayerUpdateOneRequiredWithoutGameParticipationsNestedInput
  }

  export type GameParticipantUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameInstanceId?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    rank?: NullableIntFieldUpdateOperationsInput | number | null
    timeTakenMs?: NullableIntFieldUpdateOperationsInput | number | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameParticipantCreateManyInput = {
    id?: string
    gameInstanceId: string
    playerId: string
    score?: number
    rank?: number | null
    timeTakenMs?: number | null
    joinedAt?: Date | string
    completedAt?: Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GameParticipantUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    rank?: NullableIntFieldUpdateOperationsInput | number | null
    timeTakenMs?: NullableIntFieldUpdateOperationsInput | number | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameParticipantUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameInstanceId?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    rank?: NullableIntFieldUpdateOperationsInput | number | null
    timeTakenMs?: NullableIntFieldUpdateOperationsInput | number | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type QuizTemplateListRelationFilter = {
    every?: QuizTemplateWhereInput
    some?: QuizTemplateWhereInput
    none?: QuizTemplateWhereInput
  }

  export type GameInstanceListRelationFilter = {
    every?: GameInstanceWhereInput
    some?: GameInstanceWhereInput
    none?: GameInstanceWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type QuizTemplateOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GameInstanceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TeacherCountOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    passwordHash?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    avatarUrl?: SortOrder
    resetToken?: SortOrder
    resetTokenExpiresAt?: SortOrder
  }

  export type TeacherMaxOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    passwordHash?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    avatarUrl?: SortOrder
    resetToken?: SortOrder
    resetTokenExpiresAt?: SortOrder
  }

  export type TeacherMinOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    passwordHash?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    avatarUrl?: SortOrder
    resetToken?: SortOrder
    resetTokenExpiresAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type GameParticipantListRelationFilter = {
    every?: GameParticipantWhereInput
    some?: GameParticipantWhereInput
    none?: GameParticipantWhereInput
  }

  export type GameParticipantOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PlayerCountOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    cookieId?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
    avatarUrl?: SortOrder
  }

  export type PlayerMaxOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    cookieId?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
    avatarUrl?: SortOrder
  }

  export type PlayerMinOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    cookieId?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
    avatarUrl?: SortOrder
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type QuestionsInQuizTemplateListRelationFilter = {
    every?: QuestionsInQuizTemplateWhereInput
    some?: QuestionsInQuizTemplateWhereInput
    none?: QuestionsInQuizTemplateWhereInput
  }

  export type QuestionsInQuizTemplateOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuestionCountOrderByAggregateInput = {
    uid?: SortOrder
    title?: SortOrder
    text?: SortOrder
    responses?: SortOrder
    questionType?: SortOrder
    discipline?: SortOrder
    themes?: SortOrder
    difficulty?: SortOrder
    gradeLevel?: SortOrder
    author?: SortOrder
    explanation?: SortOrder
    tags?: SortOrder
    timeLimit?: SortOrder
    isHidden?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuestionAvgOrderByAggregateInput = {
    difficulty?: SortOrder
    timeLimit?: SortOrder
  }

  export type QuestionMaxOrderByAggregateInput = {
    uid?: SortOrder
    title?: SortOrder
    text?: SortOrder
    questionType?: SortOrder
    discipline?: SortOrder
    difficulty?: SortOrder
    gradeLevel?: SortOrder
    author?: SortOrder
    explanation?: SortOrder
    timeLimit?: SortOrder
    isHidden?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuestionMinOrderByAggregateInput = {
    uid?: SortOrder
    title?: SortOrder
    text?: SortOrder
    questionType?: SortOrder
    discipline?: SortOrder
    difficulty?: SortOrder
    gradeLevel?: SortOrder
    author?: SortOrder
    explanation?: SortOrder
    timeLimit?: SortOrder
    isHidden?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuestionSumOrderByAggregateInput = {
    difficulty?: SortOrder
    timeLimit?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type EnumPlayModeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayMode | EnumPlayModeFieldRefInput<$PrismaModel> | null
    in?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumPlayModeNullableFilter<$PrismaModel> | $Enums.PlayMode | null
  }

  export type TeacherScalarRelationFilter = {
    is?: TeacherWhereInput
    isNot?: TeacherWhereInput
  }

  export type QuizTemplateCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    creatorTeacherId?: SortOrder
    gradeLevel?: SortOrder
    themes?: SortOrder
    discipline?: SortOrder
    description?: SortOrder
    defaultMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuizTemplateMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    creatorTeacherId?: SortOrder
    gradeLevel?: SortOrder
    discipline?: SortOrder
    description?: SortOrder
    defaultMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuizTemplateMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    creatorTeacherId?: SortOrder
    gradeLevel?: SortOrder
    discipline?: SortOrder
    description?: SortOrder
    defaultMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumPlayModeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayMode | EnumPlayModeFieldRefInput<$PrismaModel> | null
    in?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumPlayModeNullableWithAggregatesFilter<$PrismaModel> | $Enums.PlayMode | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumPlayModeNullableFilter<$PrismaModel>
    _max?: NestedEnumPlayModeNullableFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type QuizTemplateScalarRelationFilter = {
    is?: QuizTemplateWhereInput
    isNot?: QuizTemplateWhereInput
  }

  export type QuestionScalarRelationFilter = {
    is?: QuestionWhereInput
    isNot?: QuestionWhereInput
  }

  export type QuestionsInQuizTemplateQuizTemplateIdQuestionUidCompoundUniqueInput = {
    quizTemplateId: string
    questionUid: string
  }

  export type QuestionsInQuizTemplateQuizTemplateIdSequenceCompoundUniqueInput = {
    quizTemplateId: string
    sequence: number
  }

  export type QuestionsInQuizTemplateCountOrderByAggregateInput = {
    quizTemplateId?: SortOrder
    questionUid?: SortOrder
    sequence?: SortOrder
    createdAt?: SortOrder
  }

  export type QuestionsInQuizTemplateAvgOrderByAggregateInput = {
    sequence?: SortOrder
  }

  export type QuestionsInQuizTemplateMaxOrderByAggregateInput = {
    quizTemplateId?: SortOrder
    questionUid?: SortOrder
    sequence?: SortOrder
    createdAt?: SortOrder
  }

  export type QuestionsInQuizTemplateMinOrderByAggregateInput = {
    quizTemplateId?: SortOrder
    questionUid?: SortOrder
    sequence?: SortOrder
    createdAt?: SortOrder
  }

  export type QuestionsInQuizTemplateSumOrderByAggregateInput = {
    sequence?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type EnumPlayModeFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayMode | EnumPlayModeFieldRefInput<$PrismaModel>
    in?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel>
    not?: NestedEnumPlayModeFilter<$PrismaModel> | $Enums.PlayMode
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type TeacherNullableScalarRelationFilter = {
    is?: TeacherWhereInput | null
    isNot?: TeacherWhereInput | null
  }

  export type GameInstanceCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    quizTemplateId?: SortOrder
    initiatorTeacherId?: SortOrder
    accessCode?: SortOrder
    status?: SortOrder
    playMode?: SortOrder
    leaderboard?: SortOrder
    currentQuestionIndex?: SortOrder
    settings?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
  }

  export type GameInstanceAvgOrderByAggregateInput = {
    currentQuestionIndex?: SortOrder
  }

  export type GameInstanceMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    quizTemplateId?: SortOrder
    initiatorTeacherId?: SortOrder
    accessCode?: SortOrder
    status?: SortOrder
    playMode?: SortOrder
    currentQuestionIndex?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
  }

  export type GameInstanceMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    quizTemplateId?: SortOrder
    initiatorTeacherId?: SortOrder
    accessCode?: SortOrder
    status?: SortOrder
    playMode?: SortOrder
    currentQuestionIndex?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
  }

  export type GameInstanceSumOrderByAggregateInput = {
    currentQuestionIndex?: SortOrder
  }

  export type EnumPlayModeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayMode | EnumPlayModeFieldRefInput<$PrismaModel>
    in?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel>
    not?: NestedEnumPlayModeWithAggregatesFilter<$PrismaModel> | $Enums.PlayMode
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPlayModeFilter<$PrismaModel>
    _max?: NestedEnumPlayModeFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type GameInstanceScalarRelationFilter = {
    is?: GameInstanceWhereInput
    isNot?: GameInstanceWhereInput
  }

  export type PlayerScalarRelationFilter = {
    is?: PlayerWhereInput
    isNot?: PlayerWhereInput
  }

  export type GameParticipantGameInstanceIdPlayerIdCompoundUniqueInput = {
    gameInstanceId: string
    playerId: string
  }

  export type GameParticipantCountOrderByAggregateInput = {
    id?: SortOrder
    gameInstanceId?: SortOrder
    playerId?: SortOrder
    score?: SortOrder
    rank?: SortOrder
    timeTakenMs?: SortOrder
    joinedAt?: SortOrder
    completedAt?: SortOrder
    answers?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type GameParticipantAvgOrderByAggregateInput = {
    score?: SortOrder
    rank?: SortOrder
    timeTakenMs?: SortOrder
  }

  export type GameParticipantMaxOrderByAggregateInput = {
    id?: SortOrder
    gameInstanceId?: SortOrder
    playerId?: SortOrder
    score?: SortOrder
    rank?: SortOrder
    timeTakenMs?: SortOrder
    joinedAt?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type GameParticipantMinOrderByAggregateInput = {
    id?: SortOrder
    gameInstanceId?: SortOrder
    playerId?: SortOrder
    score?: SortOrder
    rank?: SortOrder
    timeTakenMs?: SortOrder
    joinedAt?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type GameParticipantSumOrderByAggregateInput = {
    score?: SortOrder
    rank?: SortOrder
    timeTakenMs?: SortOrder
  }

  export type QuizTemplateCreateNestedManyWithoutCreatorTeacherInput = {
    create?: XOR<QuizTemplateCreateWithoutCreatorTeacherInput, QuizTemplateUncheckedCreateWithoutCreatorTeacherInput> | QuizTemplateCreateWithoutCreatorTeacherInput[] | QuizTemplateUncheckedCreateWithoutCreatorTeacherInput[]
    connectOrCreate?: QuizTemplateCreateOrConnectWithoutCreatorTeacherInput | QuizTemplateCreateOrConnectWithoutCreatorTeacherInput[]
    createMany?: QuizTemplateCreateManyCreatorTeacherInputEnvelope
    connect?: QuizTemplateWhereUniqueInput | QuizTemplateWhereUniqueInput[]
  }

  export type GameInstanceCreateNestedManyWithoutInitiatorTeacherInput = {
    create?: XOR<GameInstanceCreateWithoutInitiatorTeacherInput, GameInstanceUncheckedCreateWithoutInitiatorTeacherInput> | GameInstanceCreateWithoutInitiatorTeacherInput[] | GameInstanceUncheckedCreateWithoutInitiatorTeacherInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutInitiatorTeacherInput | GameInstanceCreateOrConnectWithoutInitiatorTeacherInput[]
    createMany?: GameInstanceCreateManyInitiatorTeacherInputEnvelope
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
  }

  export type QuizTemplateUncheckedCreateNestedManyWithoutCreatorTeacherInput = {
    create?: XOR<QuizTemplateCreateWithoutCreatorTeacherInput, QuizTemplateUncheckedCreateWithoutCreatorTeacherInput> | QuizTemplateCreateWithoutCreatorTeacherInput[] | QuizTemplateUncheckedCreateWithoutCreatorTeacherInput[]
    connectOrCreate?: QuizTemplateCreateOrConnectWithoutCreatorTeacherInput | QuizTemplateCreateOrConnectWithoutCreatorTeacherInput[]
    createMany?: QuizTemplateCreateManyCreatorTeacherInputEnvelope
    connect?: QuizTemplateWhereUniqueInput | QuizTemplateWhereUniqueInput[]
  }

  export type GameInstanceUncheckedCreateNestedManyWithoutInitiatorTeacherInput = {
    create?: XOR<GameInstanceCreateWithoutInitiatorTeacherInput, GameInstanceUncheckedCreateWithoutInitiatorTeacherInput> | GameInstanceCreateWithoutInitiatorTeacherInput[] | GameInstanceUncheckedCreateWithoutInitiatorTeacherInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutInitiatorTeacherInput | GameInstanceCreateOrConnectWithoutInitiatorTeacherInput[]
    createMany?: GameInstanceCreateManyInitiatorTeacherInputEnvelope
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type QuizTemplateUpdateManyWithoutCreatorTeacherNestedInput = {
    create?: XOR<QuizTemplateCreateWithoutCreatorTeacherInput, QuizTemplateUncheckedCreateWithoutCreatorTeacherInput> | QuizTemplateCreateWithoutCreatorTeacherInput[] | QuizTemplateUncheckedCreateWithoutCreatorTeacherInput[]
    connectOrCreate?: QuizTemplateCreateOrConnectWithoutCreatorTeacherInput | QuizTemplateCreateOrConnectWithoutCreatorTeacherInput[]
    upsert?: QuizTemplateUpsertWithWhereUniqueWithoutCreatorTeacherInput | QuizTemplateUpsertWithWhereUniqueWithoutCreatorTeacherInput[]
    createMany?: QuizTemplateCreateManyCreatorTeacherInputEnvelope
    set?: QuizTemplateWhereUniqueInput | QuizTemplateWhereUniqueInput[]
    disconnect?: QuizTemplateWhereUniqueInput | QuizTemplateWhereUniqueInput[]
    delete?: QuizTemplateWhereUniqueInput | QuizTemplateWhereUniqueInput[]
    connect?: QuizTemplateWhereUniqueInput | QuizTemplateWhereUniqueInput[]
    update?: QuizTemplateUpdateWithWhereUniqueWithoutCreatorTeacherInput | QuizTemplateUpdateWithWhereUniqueWithoutCreatorTeacherInput[]
    updateMany?: QuizTemplateUpdateManyWithWhereWithoutCreatorTeacherInput | QuizTemplateUpdateManyWithWhereWithoutCreatorTeacherInput[]
    deleteMany?: QuizTemplateScalarWhereInput | QuizTemplateScalarWhereInput[]
  }

  export type GameInstanceUpdateManyWithoutInitiatorTeacherNestedInput = {
    create?: XOR<GameInstanceCreateWithoutInitiatorTeacherInput, GameInstanceUncheckedCreateWithoutInitiatorTeacherInput> | GameInstanceCreateWithoutInitiatorTeacherInput[] | GameInstanceUncheckedCreateWithoutInitiatorTeacherInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutInitiatorTeacherInput | GameInstanceCreateOrConnectWithoutInitiatorTeacherInput[]
    upsert?: GameInstanceUpsertWithWhereUniqueWithoutInitiatorTeacherInput | GameInstanceUpsertWithWhereUniqueWithoutInitiatorTeacherInput[]
    createMany?: GameInstanceCreateManyInitiatorTeacherInputEnvelope
    set?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    disconnect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    delete?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    update?: GameInstanceUpdateWithWhereUniqueWithoutInitiatorTeacherInput | GameInstanceUpdateWithWhereUniqueWithoutInitiatorTeacherInput[]
    updateMany?: GameInstanceUpdateManyWithWhereWithoutInitiatorTeacherInput | GameInstanceUpdateManyWithWhereWithoutInitiatorTeacherInput[]
    deleteMany?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
  }

  export type QuizTemplateUncheckedUpdateManyWithoutCreatorTeacherNestedInput = {
    create?: XOR<QuizTemplateCreateWithoutCreatorTeacherInput, QuizTemplateUncheckedCreateWithoutCreatorTeacherInput> | QuizTemplateCreateWithoutCreatorTeacherInput[] | QuizTemplateUncheckedCreateWithoutCreatorTeacherInput[]
    connectOrCreate?: QuizTemplateCreateOrConnectWithoutCreatorTeacherInput | QuizTemplateCreateOrConnectWithoutCreatorTeacherInput[]
    upsert?: QuizTemplateUpsertWithWhereUniqueWithoutCreatorTeacherInput | QuizTemplateUpsertWithWhereUniqueWithoutCreatorTeacherInput[]
    createMany?: QuizTemplateCreateManyCreatorTeacherInputEnvelope
    set?: QuizTemplateWhereUniqueInput | QuizTemplateWhereUniqueInput[]
    disconnect?: QuizTemplateWhereUniqueInput | QuizTemplateWhereUniqueInput[]
    delete?: QuizTemplateWhereUniqueInput | QuizTemplateWhereUniqueInput[]
    connect?: QuizTemplateWhereUniqueInput | QuizTemplateWhereUniqueInput[]
    update?: QuizTemplateUpdateWithWhereUniqueWithoutCreatorTeacherInput | QuizTemplateUpdateWithWhereUniqueWithoutCreatorTeacherInput[]
    updateMany?: QuizTemplateUpdateManyWithWhereWithoutCreatorTeacherInput | QuizTemplateUpdateManyWithWhereWithoutCreatorTeacherInput[]
    deleteMany?: QuizTemplateScalarWhereInput | QuizTemplateScalarWhereInput[]
  }

  export type GameInstanceUncheckedUpdateManyWithoutInitiatorTeacherNestedInput = {
    create?: XOR<GameInstanceCreateWithoutInitiatorTeacherInput, GameInstanceUncheckedCreateWithoutInitiatorTeacherInput> | GameInstanceCreateWithoutInitiatorTeacherInput[] | GameInstanceUncheckedCreateWithoutInitiatorTeacherInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutInitiatorTeacherInput | GameInstanceCreateOrConnectWithoutInitiatorTeacherInput[]
    upsert?: GameInstanceUpsertWithWhereUniqueWithoutInitiatorTeacherInput | GameInstanceUpsertWithWhereUniqueWithoutInitiatorTeacherInput[]
    createMany?: GameInstanceCreateManyInitiatorTeacherInputEnvelope
    set?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    disconnect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    delete?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    update?: GameInstanceUpdateWithWhereUniqueWithoutInitiatorTeacherInput | GameInstanceUpdateWithWhereUniqueWithoutInitiatorTeacherInput[]
    updateMany?: GameInstanceUpdateManyWithWhereWithoutInitiatorTeacherInput | GameInstanceUpdateManyWithWhereWithoutInitiatorTeacherInput[]
    deleteMany?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
  }

  export type GameParticipantCreateNestedManyWithoutPlayerInput = {
    create?: XOR<GameParticipantCreateWithoutPlayerInput, GameParticipantUncheckedCreateWithoutPlayerInput> | GameParticipantCreateWithoutPlayerInput[] | GameParticipantUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutPlayerInput | GameParticipantCreateOrConnectWithoutPlayerInput[]
    createMany?: GameParticipantCreateManyPlayerInputEnvelope
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
  }

  export type GameParticipantUncheckedCreateNestedManyWithoutPlayerInput = {
    create?: XOR<GameParticipantCreateWithoutPlayerInput, GameParticipantUncheckedCreateWithoutPlayerInput> | GameParticipantCreateWithoutPlayerInput[] | GameParticipantUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutPlayerInput | GameParticipantCreateOrConnectWithoutPlayerInput[]
    createMany?: GameParticipantCreateManyPlayerInputEnvelope
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
  }

  export type GameParticipantUpdateManyWithoutPlayerNestedInput = {
    create?: XOR<GameParticipantCreateWithoutPlayerInput, GameParticipantUncheckedCreateWithoutPlayerInput> | GameParticipantCreateWithoutPlayerInput[] | GameParticipantUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutPlayerInput | GameParticipantCreateOrConnectWithoutPlayerInput[]
    upsert?: GameParticipantUpsertWithWhereUniqueWithoutPlayerInput | GameParticipantUpsertWithWhereUniqueWithoutPlayerInput[]
    createMany?: GameParticipantCreateManyPlayerInputEnvelope
    set?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    disconnect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    delete?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    update?: GameParticipantUpdateWithWhereUniqueWithoutPlayerInput | GameParticipantUpdateWithWhereUniqueWithoutPlayerInput[]
    updateMany?: GameParticipantUpdateManyWithWhereWithoutPlayerInput | GameParticipantUpdateManyWithWhereWithoutPlayerInput[]
    deleteMany?: GameParticipantScalarWhereInput | GameParticipantScalarWhereInput[]
  }

  export type GameParticipantUncheckedUpdateManyWithoutPlayerNestedInput = {
    create?: XOR<GameParticipantCreateWithoutPlayerInput, GameParticipantUncheckedCreateWithoutPlayerInput> | GameParticipantCreateWithoutPlayerInput[] | GameParticipantUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutPlayerInput | GameParticipantCreateOrConnectWithoutPlayerInput[]
    upsert?: GameParticipantUpsertWithWhereUniqueWithoutPlayerInput | GameParticipantUpsertWithWhereUniqueWithoutPlayerInput[]
    createMany?: GameParticipantCreateManyPlayerInputEnvelope
    set?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    disconnect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    delete?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    update?: GameParticipantUpdateWithWhereUniqueWithoutPlayerInput | GameParticipantUpdateWithWhereUniqueWithoutPlayerInput[]
    updateMany?: GameParticipantUpdateManyWithWhereWithoutPlayerInput | GameParticipantUpdateManyWithWhereWithoutPlayerInput[]
    deleteMany?: GameParticipantScalarWhereInput | GameParticipantScalarWhereInput[]
  }

  export type QuestionCreatethemesInput = {
    set: string[]
  }

  export type QuestionCreatetagsInput = {
    set: string[]
  }

  export type QuestionsInQuizTemplateCreateNestedManyWithoutQuestionInput = {
    create?: XOR<QuestionsInQuizTemplateCreateWithoutQuestionInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput> | QuestionsInQuizTemplateCreateWithoutQuestionInput[] | QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: QuestionsInQuizTemplateCreateOrConnectWithoutQuestionInput | QuestionsInQuizTemplateCreateOrConnectWithoutQuestionInput[]
    createMany?: QuestionsInQuizTemplateCreateManyQuestionInputEnvelope
    connect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
  }

  export type QuestionsInQuizTemplateUncheckedCreateNestedManyWithoutQuestionInput = {
    create?: XOR<QuestionsInQuizTemplateCreateWithoutQuestionInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput> | QuestionsInQuizTemplateCreateWithoutQuestionInput[] | QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: QuestionsInQuizTemplateCreateOrConnectWithoutQuestionInput | QuestionsInQuizTemplateCreateOrConnectWithoutQuestionInput[]
    createMany?: QuestionsInQuizTemplateCreateManyQuestionInputEnvelope
    connect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
  }

  export type QuestionUpdatethemesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type QuestionUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type QuestionsInQuizTemplateUpdateManyWithoutQuestionNestedInput = {
    create?: XOR<QuestionsInQuizTemplateCreateWithoutQuestionInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput> | QuestionsInQuizTemplateCreateWithoutQuestionInput[] | QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: QuestionsInQuizTemplateCreateOrConnectWithoutQuestionInput | QuestionsInQuizTemplateCreateOrConnectWithoutQuestionInput[]
    upsert?: QuestionsInQuizTemplateUpsertWithWhereUniqueWithoutQuestionInput | QuestionsInQuizTemplateUpsertWithWhereUniqueWithoutQuestionInput[]
    createMany?: QuestionsInQuizTemplateCreateManyQuestionInputEnvelope
    set?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    disconnect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    delete?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    connect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    update?: QuestionsInQuizTemplateUpdateWithWhereUniqueWithoutQuestionInput | QuestionsInQuizTemplateUpdateWithWhereUniqueWithoutQuestionInput[]
    updateMany?: QuestionsInQuizTemplateUpdateManyWithWhereWithoutQuestionInput | QuestionsInQuizTemplateUpdateManyWithWhereWithoutQuestionInput[]
    deleteMany?: QuestionsInQuizTemplateScalarWhereInput | QuestionsInQuizTemplateScalarWhereInput[]
  }

  export type QuestionsInQuizTemplateUncheckedUpdateManyWithoutQuestionNestedInput = {
    create?: XOR<QuestionsInQuizTemplateCreateWithoutQuestionInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput> | QuestionsInQuizTemplateCreateWithoutQuestionInput[] | QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: QuestionsInQuizTemplateCreateOrConnectWithoutQuestionInput | QuestionsInQuizTemplateCreateOrConnectWithoutQuestionInput[]
    upsert?: QuestionsInQuizTemplateUpsertWithWhereUniqueWithoutQuestionInput | QuestionsInQuizTemplateUpsertWithWhereUniqueWithoutQuestionInput[]
    createMany?: QuestionsInQuizTemplateCreateManyQuestionInputEnvelope
    set?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    disconnect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    delete?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    connect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    update?: QuestionsInQuizTemplateUpdateWithWhereUniqueWithoutQuestionInput | QuestionsInQuizTemplateUpdateWithWhereUniqueWithoutQuestionInput[]
    updateMany?: QuestionsInQuizTemplateUpdateManyWithWhereWithoutQuestionInput | QuestionsInQuizTemplateUpdateManyWithWhereWithoutQuestionInput[]
    deleteMany?: QuestionsInQuizTemplateScalarWhereInput | QuestionsInQuizTemplateScalarWhereInput[]
  }

  export type QuizTemplateCreatethemesInput = {
    set: string[]
  }

  export type TeacherCreateNestedOneWithoutQuizTemplatesInput = {
    create?: XOR<TeacherCreateWithoutQuizTemplatesInput, TeacherUncheckedCreateWithoutQuizTemplatesInput>
    connectOrCreate?: TeacherCreateOrConnectWithoutQuizTemplatesInput
    connect?: TeacherWhereUniqueInput
  }

  export type QuestionsInQuizTemplateCreateNestedManyWithoutQuizTemplateInput = {
    create?: XOR<QuestionsInQuizTemplateCreateWithoutQuizTemplateInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput> | QuestionsInQuizTemplateCreateWithoutQuizTemplateInput[] | QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput[]
    connectOrCreate?: QuestionsInQuizTemplateCreateOrConnectWithoutQuizTemplateInput | QuestionsInQuizTemplateCreateOrConnectWithoutQuizTemplateInput[]
    createMany?: QuestionsInQuizTemplateCreateManyQuizTemplateInputEnvelope
    connect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
  }

  export type GameInstanceCreateNestedManyWithoutQuizTemplateInput = {
    create?: XOR<GameInstanceCreateWithoutQuizTemplateInput, GameInstanceUncheckedCreateWithoutQuizTemplateInput> | GameInstanceCreateWithoutQuizTemplateInput[] | GameInstanceUncheckedCreateWithoutQuizTemplateInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutQuizTemplateInput | GameInstanceCreateOrConnectWithoutQuizTemplateInput[]
    createMany?: GameInstanceCreateManyQuizTemplateInputEnvelope
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
  }

  export type QuestionsInQuizTemplateUncheckedCreateNestedManyWithoutQuizTemplateInput = {
    create?: XOR<QuestionsInQuizTemplateCreateWithoutQuizTemplateInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput> | QuestionsInQuizTemplateCreateWithoutQuizTemplateInput[] | QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput[]
    connectOrCreate?: QuestionsInQuizTemplateCreateOrConnectWithoutQuizTemplateInput | QuestionsInQuizTemplateCreateOrConnectWithoutQuizTemplateInput[]
    createMany?: QuestionsInQuizTemplateCreateManyQuizTemplateInputEnvelope
    connect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
  }

  export type GameInstanceUncheckedCreateNestedManyWithoutQuizTemplateInput = {
    create?: XOR<GameInstanceCreateWithoutQuizTemplateInput, GameInstanceUncheckedCreateWithoutQuizTemplateInput> | GameInstanceCreateWithoutQuizTemplateInput[] | GameInstanceUncheckedCreateWithoutQuizTemplateInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutQuizTemplateInput | GameInstanceCreateOrConnectWithoutQuizTemplateInput[]
    createMany?: GameInstanceCreateManyQuizTemplateInputEnvelope
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
  }

  export type QuizTemplateUpdatethemesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type NullableEnumPlayModeFieldUpdateOperationsInput = {
    set?: $Enums.PlayMode | null
  }

  export type TeacherUpdateOneRequiredWithoutQuizTemplatesNestedInput = {
    create?: XOR<TeacherCreateWithoutQuizTemplatesInput, TeacherUncheckedCreateWithoutQuizTemplatesInput>
    connectOrCreate?: TeacherCreateOrConnectWithoutQuizTemplatesInput
    upsert?: TeacherUpsertWithoutQuizTemplatesInput
    connect?: TeacherWhereUniqueInput
    update?: XOR<XOR<TeacherUpdateToOneWithWhereWithoutQuizTemplatesInput, TeacherUpdateWithoutQuizTemplatesInput>, TeacherUncheckedUpdateWithoutQuizTemplatesInput>
  }

  export type QuestionsInQuizTemplateUpdateManyWithoutQuizTemplateNestedInput = {
    create?: XOR<QuestionsInQuizTemplateCreateWithoutQuizTemplateInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput> | QuestionsInQuizTemplateCreateWithoutQuizTemplateInput[] | QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput[]
    connectOrCreate?: QuestionsInQuizTemplateCreateOrConnectWithoutQuizTemplateInput | QuestionsInQuizTemplateCreateOrConnectWithoutQuizTemplateInput[]
    upsert?: QuestionsInQuizTemplateUpsertWithWhereUniqueWithoutQuizTemplateInput | QuestionsInQuizTemplateUpsertWithWhereUniqueWithoutQuizTemplateInput[]
    createMany?: QuestionsInQuizTemplateCreateManyQuizTemplateInputEnvelope
    set?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    disconnect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    delete?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    connect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    update?: QuestionsInQuizTemplateUpdateWithWhereUniqueWithoutQuizTemplateInput | QuestionsInQuizTemplateUpdateWithWhereUniqueWithoutQuizTemplateInput[]
    updateMany?: QuestionsInQuizTemplateUpdateManyWithWhereWithoutQuizTemplateInput | QuestionsInQuizTemplateUpdateManyWithWhereWithoutQuizTemplateInput[]
    deleteMany?: QuestionsInQuizTemplateScalarWhereInput | QuestionsInQuizTemplateScalarWhereInput[]
  }

  export type GameInstanceUpdateManyWithoutQuizTemplateNestedInput = {
    create?: XOR<GameInstanceCreateWithoutQuizTemplateInput, GameInstanceUncheckedCreateWithoutQuizTemplateInput> | GameInstanceCreateWithoutQuizTemplateInput[] | GameInstanceUncheckedCreateWithoutQuizTemplateInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutQuizTemplateInput | GameInstanceCreateOrConnectWithoutQuizTemplateInput[]
    upsert?: GameInstanceUpsertWithWhereUniqueWithoutQuizTemplateInput | GameInstanceUpsertWithWhereUniqueWithoutQuizTemplateInput[]
    createMany?: GameInstanceCreateManyQuizTemplateInputEnvelope
    set?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    disconnect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    delete?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    update?: GameInstanceUpdateWithWhereUniqueWithoutQuizTemplateInput | GameInstanceUpdateWithWhereUniqueWithoutQuizTemplateInput[]
    updateMany?: GameInstanceUpdateManyWithWhereWithoutQuizTemplateInput | GameInstanceUpdateManyWithWhereWithoutQuizTemplateInput[]
    deleteMany?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
  }

  export type QuestionsInQuizTemplateUncheckedUpdateManyWithoutQuizTemplateNestedInput = {
    create?: XOR<QuestionsInQuizTemplateCreateWithoutQuizTemplateInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput> | QuestionsInQuizTemplateCreateWithoutQuizTemplateInput[] | QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput[]
    connectOrCreate?: QuestionsInQuizTemplateCreateOrConnectWithoutQuizTemplateInput | QuestionsInQuizTemplateCreateOrConnectWithoutQuizTemplateInput[]
    upsert?: QuestionsInQuizTemplateUpsertWithWhereUniqueWithoutQuizTemplateInput | QuestionsInQuizTemplateUpsertWithWhereUniqueWithoutQuizTemplateInput[]
    createMany?: QuestionsInQuizTemplateCreateManyQuizTemplateInputEnvelope
    set?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    disconnect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    delete?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    connect?: QuestionsInQuizTemplateWhereUniqueInput | QuestionsInQuizTemplateWhereUniqueInput[]
    update?: QuestionsInQuizTemplateUpdateWithWhereUniqueWithoutQuizTemplateInput | QuestionsInQuizTemplateUpdateWithWhereUniqueWithoutQuizTemplateInput[]
    updateMany?: QuestionsInQuizTemplateUpdateManyWithWhereWithoutQuizTemplateInput | QuestionsInQuizTemplateUpdateManyWithWhereWithoutQuizTemplateInput[]
    deleteMany?: QuestionsInQuizTemplateScalarWhereInput | QuestionsInQuizTemplateScalarWhereInput[]
  }

  export type GameInstanceUncheckedUpdateManyWithoutQuizTemplateNestedInput = {
    create?: XOR<GameInstanceCreateWithoutQuizTemplateInput, GameInstanceUncheckedCreateWithoutQuizTemplateInput> | GameInstanceCreateWithoutQuizTemplateInput[] | GameInstanceUncheckedCreateWithoutQuizTemplateInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutQuizTemplateInput | GameInstanceCreateOrConnectWithoutQuizTemplateInput[]
    upsert?: GameInstanceUpsertWithWhereUniqueWithoutQuizTemplateInput | GameInstanceUpsertWithWhereUniqueWithoutQuizTemplateInput[]
    createMany?: GameInstanceCreateManyQuizTemplateInputEnvelope
    set?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    disconnect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    delete?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    update?: GameInstanceUpdateWithWhereUniqueWithoutQuizTemplateInput | GameInstanceUpdateWithWhereUniqueWithoutQuizTemplateInput[]
    updateMany?: GameInstanceUpdateManyWithWhereWithoutQuizTemplateInput | GameInstanceUpdateManyWithWhereWithoutQuizTemplateInput[]
    deleteMany?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
  }

  export type QuizTemplateCreateNestedOneWithoutQuestionsInput = {
    create?: XOR<QuizTemplateCreateWithoutQuestionsInput, QuizTemplateUncheckedCreateWithoutQuestionsInput>
    connectOrCreate?: QuizTemplateCreateOrConnectWithoutQuestionsInput
    connect?: QuizTemplateWhereUniqueInput
  }

  export type QuestionCreateNestedOneWithoutQuizTemplatesInput = {
    create?: XOR<QuestionCreateWithoutQuizTemplatesInput, QuestionUncheckedCreateWithoutQuizTemplatesInput>
    connectOrCreate?: QuestionCreateOrConnectWithoutQuizTemplatesInput
    connect?: QuestionWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type QuizTemplateUpdateOneRequiredWithoutQuestionsNestedInput = {
    create?: XOR<QuizTemplateCreateWithoutQuestionsInput, QuizTemplateUncheckedCreateWithoutQuestionsInput>
    connectOrCreate?: QuizTemplateCreateOrConnectWithoutQuestionsInput
    upsert?: QuizTemplateUpsertWithoutQuestionsInput
    connect?: QuizTemplateWhereUniqueInput
    update?: XOR<XOR<QuizTemplateUpdateToOneWithWhereWithoutQuestionsInput, QuizTemplateUpdateWithoutQuestionsInput>, QuizTemplateUncheckedUpdateWithoutQuestionsInput>
  }

  export type QuestionUpdateOneRequiredWithoutQuizTemplatesNestedInput = {
    create?: XOR<QuestionCreateWithoutQuizTemplatesInput, QuestionUncheckedCreateWithoutQuizTemplatesInput>
    connectOrCreate?: QuestionCreateOrConnectWithoutQuizTemplatesInput
    upsert?: QuestionUpsertWithoutQuizTemplatesInput
    connect?: QuestionWhereUniqueInput
    update?: XOR<XOR<QuestionUpdateToOneWithWhereWithoutQuizTemplatesInput, QuestionUpdateWithoutQuizTemplatesInput>, QuestionUncheckedUpdateWithoutQuizTemplatesInput>
  }

  export type QuizTemplateCreateNestedOneWithoutGameInstancesInput = {
    create?: XOR<QuizTemplateCreateWithoutGameInstancesInput, QuizTemplateUncheckedCreateWithoutGameInstancesInput>
    connectOrCreate?: QuizTemplateCreateOrConnectWithoutGameInstancesInput
    connect?: QuizTemplateWhereUniqueInput
  }

  export type TeacherCreateNestedOneWithoutGameInstancesInput = {
    create?: XOR<TeacherCreateWithoutGameInstancesInput, TeacherUncheckedCreateWithoutGameInstancesInput>
    connectOrCreate?: TeacherCreateOrConnectWithoutGameInstancesInput
    connect?: TeacherWhereUniqueInput
  }

  export type GameParticipantCreateNestedManyWithoutGameInstanceInput = {
    create?: XOR<GameParticipantCreateWithoutGameInstanceInput, GameParticipantUncheckedCreateWithoutGameInstanceInput> | GameParticipantCreateWithoutGameInstanceInput[] | GameParticipantUncheckedCreateWithoutGameInstanceInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutGameInstanceInput | GameParticipantCreateOrConnectWithoutGameInstanceInput[]
    createMany?: GameParticipantCreateManyGameInstanceInputEnvelope
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
  }

  export type GameParticipantUncheckedCreateNestedManyWithoutGameInstanceInput = {
    create?: XOR<GameParticipantCreateWithoutGameInstanceInput, GameParticipantUncheckedCreateWithoutGameInstanceInput> | GameParticipantCreateWithoutGameInstanceInput[] | GameParticipantUncheckedCreateWithoutGameInstanceInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutGameInstanceInput | GameParticipantCreateOrConnectWithoutGameInstanceInput[]
    createMany?: GameParticipantCreateManyGameInstanceInputEnvelope
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
  }

  export type EnumPlayModeFieldUpdateOperationsInput = {
    set?: $Enums.PlayMode
  }

  export type QuizTemplateUpdateOneRequiredWithoutGameInstancesNestedInput = {
    create?: XOR<QuizTemplateCreateWithoutGameInstancesInput, QuizTemplateUncheckedCreateWithoutGameInstancesInput>
    connectOrCreate?: QuizTemplateCreateOrConnectWithoutGameInstancesInput
    upsert?: QuizTemplateUpsertWithoutGameInstancesInput
    connect?: QuizTemplateWhereUniqueInput
    update?: XOR<XOR<QuizTemplateUpdateToOneWithWhereWithoutGameInstancesInput, QuizTemplateUpdateWithoutGameInstancesInput>, QuizTemplateUncheckedUpdateWithoutGameInstancesInput>
  }

  export type TeacherUpdateOneWithoutGameInstancesNestedInput = {
    create?: XOR<TeacherCreateWithoutGameInstancesInput, TeacherUncheckedCreateWithoutGameInstancesInput>
    connectOrCreate?: TeacherCreateOrConnectWithoutGameInstancesInput
    upsert?: TeacherUpsertWithoutGameInstancesInput
    disconnect?: TeacherWhereInput | boolean
    delete?: TeacherWhereInput | boolean
    connect?: TeacherWhereUniqueInput
    update?: XOR<XOR<TeacherUpdateToOneWithWhereWithoutGameInstancesInput, TeacherUpdateWithoutGameInstancesInput>, TeacherUncheckedUpdateWithoutGameInstancesInput>
  }

  export type GameParticipantUpdateManyWithoutGameInstanceNestedInput = {
    create?: XOR<GameParticipantCreateWithoutGameInstanceInput, GameParticipantUncheckedCreateWithoutGameInstanceInput> | GameParticipantCreateWithoutGameInstanceInput[] | GameParticipantUncheckedCreateWithoutGameInstanceInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutGameInstanceInput | GameParticipantCreateOrConnectWithoutGameInstanceInput[]
    upsert?: GameParticipantUpsertWithWhereUniqueWithoutGameInstanceInput | GameParticipantUpsertWithWhereUniqueWithoutGameInstanceInput[]
    createMany?: GameParticipantCreateManyGameInstanceInputEnvelope
    set?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    disconnect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    delete?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    update?: GameParticipantUpdateWithWhereUniqueWithoutGameInstanceInput | GameParticipantUpdateWithWhereUniqueWithoutGameInstanceInput[]
    updateMany?: GameParticipantUpdateManyWithWhereWithoutGameInstanceInput | GameParticipantUpdateManyWithWhereWithoutGameInstanceInput[]
    deleteMany?: GameParticipantScalarWhereInput | GameParticipantScalarWhereInput[]
  }

  export type GameParticipantUncheckedUpdateManyWithoutGameInstanceNestedInput = {
    create?: XOR<GameParticipantCreateWithoutGameInstanceInput, GameParticipantUncheckedCreateWithoutGameInstanceInput> | GameParticipantCreateWithoutGameInstanceInput[] | GameParticipantUncheckedCreateWithoutGameInstanceInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutGameInstanceInput | GameParticipantCreateOrConnectWithoutGameInstanceInput[]
    upsert?: GameParticipantUpsertWithWhereUniqueWithoutGameInstanceInput | GameParticipantUpsertWithWhereUniqueWithoutGameInstanceInput[]
    createMany?: GameParticipantCreateManyGameInstanceInputEnvelope
    set?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    disconnect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    delete?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    update?: GameParticipantUpdateWithWhereUniqueWithoutGameInstanceInput | GameParticipantUpdateWithWhereUniqueWithoutGameInstanceInput[]
    updateMany?: GameParticipantUpdateManyWithWhereWithoutGameInstanceInput | GameParticipantUpdateManyWithWhereWithoutGameInstanceInput[]
    deleteMany?: GameParticipantScalarWhereInput | GameParticipantScalarWhereInput[]
  }

  export type GameInstanceCreateNestedOneWithoutParticipantsInput = {
    create?: XOR<GameInstanceCreateWithoutParticipantsInput, GameInstanceUncheckedCreateWithoutParticipantsInput>
    connectOrCreate?: GameInstanceCreateOrConnectWithoutParticipantsInput
    connect?: GameInstanceWhereUniqueInput
  }

  export type PlayerCreateNestedOneWithoutGameParticipationsInput = {
    create?: XOR<PlayerCreateWithoutGameParticipationsInput, PlayerUncheckedCreateWithoutGameParticipationsInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutGameParticipationsInput
    connect?: PlayerWhereUniqueInput
  }

  export type GameInstanceUpdateOneRequiredWithoutParticipantsNestedInput = {
    create?: XOR<GameInstanceCreateWithoutParticipantsInput, GameInstanceUncheckedCreateWithoutParticipantsInput>
    connectOrCreate?: GameInstanceCreateOrConnectWithoutParticipantsInput
    upsert?: GameInstanceUpsertWithoutParticipantsInput
    connect?: GameInstanceWhereUniqueInput
    update?: XOR<XOR<GameInstanceUpdateToOneWithWhereWithoutParticipantsInput, GameInstanceUpdateWithoutParticipantsInput>, GameInstanceUncheckedUpdateWithoutParticipantsInput>
  }

  export type PlayerUpdateOneRequiredWithoutGameParticipationsNestedInput = {
    create?: XOR<PlayerCreateWithoutGameParticipationsInput, PlayerUncheckedCreateWithoutGameParticipationsInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutGameParticipationsInput
    upsert?: PlayerUpsertWithoutGameParticipationsInput
    connect?: PlayerWhereUniqueInput
    update?: XOR<XOR<PlayerUpdateToOneWithWhereWithoutGameParticipationsInput, PlayerUpdateWithoutGameParticipationsInput>, PlayerUncheckedUpdateWithoutGameParticipationsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type NestedEnumPlayModeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayMode | EnumPlayModeFieldRefInput<$PrismaModel> | null
    in?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumPlayModeNullableFilter<$PrismaModel> | $Enums.PlayMode | null
  }

  export type NestedEnumPlayModeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayMode | EnumPlayModeFieldRefInput<$PrismaModel> | null
    in?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumPlayModeNullableWithAggregatesFilter<$PrismaModel> | $Enums.PlayMode | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumPlayModeNullableFilter<$PrismaModel>
    _max?: NestedEnumPlayModeNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumPlayModeFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayMode | EnumPlayModeFieldRefInput<$PrismaModel>
    in?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel>
    not?: NestedEnumPlayModeFilter<$PrismaModel> | $Enums.PlayMode
  }

  export type NestedEnumPlayModeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayMode | EnumPlayModeFieldRefInput<$PrismaModel>
    in?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel>
    not?: NestedEnumPlayModeWithAggregatesFilter<$PrismaModel> | $Enums.PlayMode
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPlayModeFilter<$PrismaModel>
    _max?: NestedEnumPlayModeFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type QuizTemplateCreateWithoutCreatorTeacherInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: QuizTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    questions?: QuestionsInQuizTemplateCreateNestedManyWithoutQuizTemplateInput
    gameInstances?: GameInstanceCreateNestedManyWithoutQuizTemplateInput
  }

  export type QuizTemplateUncheckedCreateWithoutCreatorTeacherInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: QuizTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    questions?: QuestionsInQuizTemplateUncheckedCreateNestedManyWithoutQuizTemplateInput
    gameInstances?: GameInstanceUncheckedCreateNestedManyWithoutQuizTemplateInput
  }

  export type QuizTemplateCreateOrConnectWithoutCreatorTeacherInput = {
    where: QuizTemplateWhereUniqueInput
    create: XOR<QuizTemplateCreateWithoutCreatorTeacherInput, QuizTemplateUncheckedCreateWithoutCreatorTeacherInput>
  }

  export type QuizTemplateCreateManyCreatorTeacherInputEnvelope = {
    data: QuizTemplateCreateManyCreatorTeacherInput | QuizTemplateCreateManyCreatorTeacherInput[]
    skipDuplicates?: boolean
  }

  export type GameInstanceCreateWithoutInitiatorTeacherInput = {
    id?: string
    name: string
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    quizTemplate: QuizTemplateCreateNestedOneWithoutGameInstancesInput
    participants?: GameParticipantCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceUncheckedCreateWithoutInitiatorTeacherInput = {
    id?: string
    name: string
    quizTemplateId: string
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    participants?: GameParticipantUncheckedCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceCreateOrConnectWithoutInitiatorTeacherInput = {
    where: GameInstanceWhereUniqueInput
    create: XOR<GameInstanceCreateWithoutInitiatorTeacherInput, GameInstanceUncheckedCreateWithoutInitiatorTeacherInput>
  }

  export type GameInstanceCreateManyInitiatorTeacherInputEnvelope = {
    data: GameInstanceCreateManyInitiatorTeacherInput | GameInstanceCreateManyInitiatorTeacherInput[]
    skipDuplicates?: boolean
  }

  export type QuizTemplateUpsertWithWhereUniqueWithoutCreatorTeacherInput = {
    where: QuizTemplateWhereUniqueInput
    update: XOR<QuizTemplateUpdateWithoutCreatorTeacherInput, QuizTemplateUncheckedUpdateWithoutCreatorTeacherInput>
    create: XOR<QuizTemplateCreateWithoutCreatorTeacherInput, QuizTemplateUncheckedCreateWithoutCreatorTeacherInput>
  }

  export type QuizTemplateUpdateWithWhereUniqueWithoutCreatorTeacherInput = {
    where: QuizTemplateWhereUniqueInput
    data: XOR<QuizTemplateUpdateWithoutCreatorTeacherInput, QuizTemplateUncheckedUpdateWithoutCreatorTeacherInput>
  }

  export type QuizTemplateUpdateManyWithWhereWithoutCreatorTeacherInput = {
    where: QuizTemplateScalarWhereInput
    data: XOR<QuizTemplateUpdateManyMutationInput, QuizTemplateUncheckedUpdateManyWithoutCreatorTeacherInput>
  }

  export type QuizTemplateScalarWhereInput = {
    AND?: QuizTemplateScalarWhereInput | QuizTemplateScalarWhereInput[]
    OR?: QuizTemplateScalarWhereInput[]
    NOT?: QuizTemplateScalarWhereInput | QuizTemplateScalarWhereInput[]
    id?: StringFilter<"QuizTemplate"> | string
    name?: StringFilter<"QuizTemplate"> | string
    creatorTeacherId?: StringFilter<"QuizTemplate"> | string
    gradeLevel?: StringNullableFilter<"QuizTemplate"> | string | null
    themes?: StringNullableListFilter<"QuizTemplate">
    discipline?: StringNullableFilter<"QuizTemplate"> | string | null
    description?: StringNullableFilter<"QuizTemplate"> | string | null
    defaultMode?: EnumPlayModeNullableFilter<"QuizTemplate"> | $Enums.PlayMode | null
    createdAt?: DateTimeFilter<"QuizTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"QuizTemplate"> | Date | string
  }

  export type GameInstanceUpsertWithWhereUniqueWithoutInitiatorTeacherInput = {
    where: GameInstanceWhereUniqueInput
    update: XOR<GameInstanceUpdateWithoutInitiatorTeacherInput, GameInstanceUncheckedUpdateWithoutInitiatorTeacherInput>
    create: XOR<GameInstanceCreateWithoutInitiatorTeacherInput, GameInstanceUncheckedCreateWithoutInitiatorTeacherInput>
  }

  export type GameInstanceUpdateWithWhereUniqueWithoutInitiatorTeacherInput = {
    where: GameInstanceWhereUniqueInput
    data: XOR<GameInstanceUpdateWithoutInitiatorTeacherInput, GameInstanceUncheckedUpdateWithoutInitiatorTeacherInput>
  }

  export type GameInstanceUpdateManyWithWhereWithoutInitiatorTeacherInput = {
    where: GameInstanceScalarWhereInput
    data: XOR<GameInstanceUpdateManyMutationInput, GameInstanceUncheckedUpdateManyWithoutInitiatorTeacherInput>
  }

  export type GameInstanceScalarWhereInput = {
    AND?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
    OR?: GameInstanceScalarWhereInput[]
    NOT?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
    id?: StringFilter<"GameInstance"> | string
    name?: StringFilter<"GameInstance"> | string
    quizTemplateId?: StringFilter<"GameInstance"> | string
    initiatorTeacherId?: StringNullableFilter<"GameInstance"> | string | null
    accessCode?: StringFilter<"GameInstance"> | string
    status?: StringFilter<"GameInstance"> | string
    playMode?: EnumPlayModeFilter<"GameInstance"> | $Enums.PlayMode
    leaderboard?: JsonNullableFilter<"GameInstance">
    currentQuestionIndex?: IntNullableFilter<"GameInstance"> | number | null
    settings?: JsonNullableFilter<"GameInstance">
    createdAt?: DateTimeFilter<"GameInstance"> | Date | string
    startedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
  }

  export type GameParticipantCreateWithoutPlayerInput = {
    id?: string
    score?: number
    rank?: number | null
    timeTakenMs?: number | null
    joinedAt?: Date | string
    completedAt?: Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    gameInstance: GameInstanceCreateNestedOneWithoutParticipantsInput
  }

  export type GameParticipantUncheckedCreateWithoutPlayerInput = {
    id?: string
    gameInstanceId: string
    score?: number
    rank?: number | null
    timeTakenMs?: number | null
    joinedAt?: Date | string
    completedAt?: Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GameParticipantCreateOrConnectWithoutPlayerInput = {
    where: GameParticipantWhereUniqueInput
    create: XOR<GameParticipantCreateWithoutPlayerInput, GameParticipantUncheckedCreateWithoutPlayerInput>
  }

  export type GameParticipantCreateManyPlayerInputEnvelope = {
    data: GameParticipantCreateManyPlayerInput | GameParticipantCreateManyPlayerInput[]
    skipDuplicates?: boolean
  }

  export type GameParticipantUpsertWithWhereUniqueWithoutPlayerInput = {
    where: GameParticipantWhereUniqueInput
    update: XOR<GameParticipantUpdateWithoutPlayerInput, GameParticipantUncheckedUpdateWithoutPlayerInput>
    create: XOR<GameParticipantCreateWithoutPlayerInput, GameParticipantUncheckedCreateWithoutPlayerInput>
  }

  export type GameParticipantUpdateWithWhereUniqueWithoutPlayerInput = {
    where: GameParticipantWhereUniqueInput
    data: XOR<GameParticipantUpdateWithoutPlayerInput, GameParticipantUncheckedUpdateWithoutPlayerInput>
  }

  export type GameParticipantUpdateManyWithWhereWithoutPlayerInput = {
    where: GameParticipantScalarWhereInput
    data: XOR<GameParticipantUpdateManyMutationInput, GameParticipantUncheckedUpdateManyWithoutPlayerInput>
  }

  export type GameParticipantScalarWhereInput = {
    AND?: GameParticipantScalarWhereInput | GameParticipantScalarWhereInput[]
    OR?: GameParticipantScalarWhereInput[]
    NOT?: GameParticipantScalarWhereInput | GameParticipantScalarWhereInput[]
    id?: StringFilter<"GameParticipant"> | string
    gameInstanceId?: StringFilter<"GameParticipant"> | string
    playerId?: StringFilter<"GameParticipant"> | string
    score?: IntFilter<"GameParticipant"> | number
    rank?: IntNullableFilter<"GameParticipant"> | number | null
    timeTakenMs?: IntNullableFilter<"GameParticipant"> | number | null
    joinedAt?: DateTimeFilter<"GameParticipant"> | Date | string
    completedAt?: DateTimeNullableFilter<"GameParticipant"> | Date | string | null
    answers?: JsonNullableFilter<"GameParticipant">
    createdAt?: DateTimeFilter<"GameParticipant"> | Date | string
    updatedAt?: DateTimeFilter<"GameParticipant"> | Date | string
  }

  export type QuestionsInQuizTemplateCreateWithoutQuestionInput = {
    sequence: number
    createdAt?: Date | string
    quizTemplate: QuizTemplateCreateNestedOneWithoutQuestionsInput
  }

  export type QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput = {
    quizTemplateId: string
    sequence: number
    createdAt?: Date | string
  }

  export type QuestionsInQuizTemplateCreateOrConnectWithoutQuestionInput = {
    where: QuestionsInQuizTemplateWhereUniqueInput
    create: XOR<QuestionsInQuizTemplateCreateWithoutQuestionInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput>
  }

  export type QuestionsInQuizTemplateCreateManyQuestionInputEnvelope = {
    data: QuestionsInQuizTemplateCreateManyQuestionInput | QuestionsInQuizTemplateCreateManyQuestionInput[]
    skipDuplicates?: boolean
  }

  export type QuestionsInQuizTemplateUpsertWithWhereUniqueWithoutQuestionInput = {
    where: QuestionsInQuizTemplateWhereUniqueInput
    update: XOR<QuestionsInQuizTemplateUpdateWithoutQuestionInput, QuestionsInQuizTemplateUncheckedUpdateWithoutQuestionInput>
    create: XOR<QuestionsInQuizTemplateCreateWithoutQuestionInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuestionInput>
  }

  export type QuestionsInQuizTemplateUpdateWithWhereUniqueWithoutQuestionInput = {
    where: QuestionsInQuizTemplateWhereUniqueInput
    data: XOR<QuestionsInQuizTemplateUpdateWithoutQuestionInput, QuestionsInQuizTemplateUncheckedUpdateWithoutQuestionInput>
  }

  export type QuestionsInQuizTemplateUpdateManyWithWhereWithoutQuestionInput = {
    where: QuestionsInQuizTemplateScalarWhereInput
    data: XOR<QuestionsInQuizTemplateUpdateManyMutationInput, QuestionsInQuizTemplateUncheckedUpdateManyWithoutQuestionInput>
  }

  export type QuestionsInQuizTemplateScalarWhereInput = {
    AND?: QuestionsInQuizTemplateScalarWhereInput | QuestionsInQuizTemplateScalarWhereInput[]
    OR?: QuestionsInQuizTemplateScalarWhereInput[]
    NOT?: QuestionsInQuizTemplateScalarWhereInput | QuestionsInQuizTemplateScalarWhereInput[]
    quizTemplateId?: StringFilter<"QuestionsInQuizTemplate"> | string
    questionUid?: StringFilter<"QuestionsInQuizTemplate"> | string
    sequence?: IntFilter<"QuestionsInQuizTemplate"> | number
    createdAt?: DateTimeFilter<"QuestionsInQuizTemplate"> | Date | string
  }

  export type TeacherCreateWithoutQuizTemplatesInput = {
    id?: string
    username: string
    passwordHash: string
    email?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    gameInstances?: GameInstanceCreateNestedManyWithoutInitiatorTeacherInput
  }

  export type TeacherUncheckedCreateWithoutQuizTemplatesInput = {
    id?: string
    username: string
    passwordHash: string
    email?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    gameInstances?: GameInstanceUncheckedCreateNestedManyWithoutInitiatorTeacherInput
  }

  export type TeacherCreateOrConnectWithoutQuizTemplatesInput = {
    where: TeacherWhereUniqueInput
    create: XOR<TeacherCreateWithoutQuizTemplatesInput, TeacherUncheckedCreateWithoutQuizTemplatesInput>
  }

  export type QuestionsInQuizTemplateCreateWithoutQuizTemplateInput = {
    sequence: number
    createdAt?: Date | string
    question: QuestionCreateNestedOneWithoutQuizTemplatesInput
  }

  export type QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput = {
    questionUid: string
    sequence: number
    createdAt?: Date | string
  }

  export type QuestionsInQuizTemplateCreateOrConnectWithoutQuizTemplateInput = {
    where: QuestionsInQuizTemplateWhereUniqueInput
    create: XOR<QuestionsInQuizTemplateCreateWithoutQuizTemplateInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput>
  }

  export type QuestionsInQuizTemplateCreateManyQuizTemplateInputEnvelope = {
    data: QuestionsInQuizTemplateCreateManyQuizTemplateInput | QuestionsInQuizTemplateCreateManyQuizTemplateInput[]
    skipDuplicates?: boolean
  }

  export type GameInstanceCreateWithoutQuizTemplateInput = {
    id?: string
    name: string
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    initiatorTeacher?: TeacherCreateNestedOneWithoutGameInstancesInput
    participants?: GameParticipantCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceUncheckedCreateWithoutQuizTemplateInput = {
    id?: string
    name: string
    initiatorTeacherId?: string | null
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    participants?: GameParticipantUncheckedCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceCreateOrConnectWithoutQuizTemplateInput = {
    where: GameInstanceWhereUniqueInput
    create: XOR<GameInstanceCreateWithoutQuizTemplateInput, GameInstanceUncheckedCreateWithoutQuizTemplateInput>
  }

  export type GameInstanceCreateManyQuizTemplateInputEnvelope = {
    data: GameInstanceCreateManyQuizTemplateInput | GameInstanceCreateManyQuizTemplateInput[]
    skipDuplicates?: boolean
  }

  export type TeacherUpsertWithoutQuizTemplatesInput = {
    update: XOR<TeacherUpdateWithoutQuizTemplatesInput, TeacherUncheckedUpdateWithoutQuizTemplatesInput>
    create: XOR<TeacherCreateWithoutQuizTemplatesInput, TeacherUncheckedCreateWithoutQuizTemplatesInput>
    where?: TeacherWhereInput
  }

  export type TeacherUpdateToOneWithWhereWithoutQuizTemplatesInput = {
    where?: TeacherWhereInput
    data: XOR<TeacherUpdateWithoutQuizTemplatesInput, TeacherUncheckedUpdateWithoutQuizTemplatesInput>
  }

  export type TeacherUpdateWithoutQuizTemplatesInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameInstances?: GameInstanceUpdateManyWithoutInitiatorTeacherNestedInput
  }

  export type TeacherUncheckedUpdateWithoutQuizTemplatesInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameInstances?: GameInstanceUncheckedUpdateManyWithoutInitiatorTeacherNestedInput
  }

  export type QuestionsInQuizTemplateUpsertWithWhereUniqueWithoutQuizTemplateInput = {
    where: QuestionsInQuizTemplateWhereUniqueInput
    update: XOR<QuestionsInQuizTemplateUpdateWithoutQuizTemplateInput, QuestionsInQuizTemplateUncheckedUpdateWithoutQuizTemplateInput>
    create: XOR<QuestionsInQuizTemplateCreateWithoutQuizTemplateInput, QuestionsInQuizTemplateUncheckedCreateWithoutQuizTemplateInput>
  }

  export type QuestionsInQuizTemplateUpdateWithWhereUniqueWithoutQuizTemplateInput = {
    where: QuestionsInQuizTemplateWhereUniqueInput
    data: XOR<QuestionsInQuizTemplateUpdateWithoutQuizTemplateInput, QuestionsInQuizTemplateUncheckedUpdateWithoutQuizTemplateInput>
  }

  export type QuestionsInQuizTemplateUpdateManyWithWhereWithoutQuizTemplateInput = {
    where: QuestionsInQuizTemplateScalarWhereInput
    data: XOR<QuestionsInQuizTemplateUpdateManyMutationInput, QuestionsInQuizTemplateUncheckedUpdateManyWithoutQuizTemplateInput>
  }

  export type GameInstanceUpsertWithWhereUniqueWithoutQuizTemplateInput = {
    where: GameInstanceWhereUniqueInput
    update: XOR<GameInstanceUpdateWithoutQuizTemplateInput, GameInstanceUncheckedUpdateWithoutQuizTemplateInput>
    create: XOR<GameInstanceCreateWithoutQuizTemplateInput, GameInstanceUncheckedCreateWithoutQuizTemplateInput>
  }

  export type GameInstanceUpdateWithWhereUniqueWithoutQuizTemplateInput = {
    where: GameInstanceWhereUniqueInput
    data: XOR<GameInstanceUpdateWithoutQuizTemplateInput, GameInstanceUncheckedUpdateWithoutQuizTemplateInput>
  }

  export type GameInstanceUpdateManyWithWhereWithoutQuizTemplateInput = {
    where: GameInstanceScalarWhereInput
    data: XOR<GameInstanceUpdateManyMutationInput, GameInstanceUncheckedUpdateManyWithoutQuizTemplateInput>
  }

  export type QuizTemplateCreateWithoutQuestionsInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: QuizTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creatorTeacher: TeacherCreateNestedOneWithoutQuizTemplatesInput
    gameInstances?: GameInstanceCreateNestedManyWithoutQuizTemplateInput
  }

  export type QuizTemplateUncheckedCreateWithoutQuestionsInput = {
    id?: string
    name: string
    creatorTeacherId: string
    gradeLevel?: string | null
    themes?: QuizTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    gameInstances?: GameInstanceUncheckedCreateNestedManyWithoutQuizTemplateInput
  }

  export type QuizTemplateCreateOrConnectWithoutQuestionsInput = {
    where: QuizTemplateWhereUniqueInput
    create: XOR<QuizTemplateCreateWithoutQuestionsInput, QuizTemplateUncheckedCreateWithoutQuestionsInput>
  }

  export type QuestionCreateWithoutQuizTemplatesInput = {
    uid?: string
    title?: string | null
    text: string
    responses: JsonNullValueInput | InputJsonValue
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit?: number | null
    isHidden?: boolean | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuestionUncheckedCreateWithoutQuizTemplatesInput = {
    uid?: string
    title?: string | null
    text: string
    responses: JsonNullValueInput | InputJsonValue
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit?: number | null
    isHidden?: boolean | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuestionCreateOrConnectWithoutQuizTemplatesInput = {
    where: QuestionWhereUniqueInput
    create: XOR<QuestionCreateWithoutQuizTemplatesInput, QuestionUncheckedCreateWithoutQuizTemplatesInput>
  }

  export type QuizTemplateUpsertWithoutQuestionsInput = {
    update: XOR<QuizTemplateUpdateWithoutQuestionsInput, QuizTemplateUncheckedUpdateWithoutQuestionsInput>
    create: XOR<QuizTemplateCreateWithoutQuestionsInput, QuizTemplateUncheckedCreateWithoutQuestionsInput>
    where?: QuizTemplateWhereInput
  }

  export type QuizTemplateUpdateToOneWithWhereWithoutQuestionsInput = {
    where?: QuizTemplateWhereInput
    data: XOR<QuizTemplateUpdateWithoutQuestionsInput, QuizTemplateUncheckedUpdateWithoutQuestionsInput>
  }

  export type QuizTemplateUpdateWithoutQuestionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorTeacher?: TeacherUpdateOneRequiredWithoutQuizTemplatesNestedInput
    gameInstances?: GameInstanceUpdateManyWithoutQuizTemplateNestedInput
  }

  export type QuizTemplateUncheckedUpdateWithoutQuestionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    creatorTeacherId?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameInstances?: GameInstanceUncheckedUpdateManyWithoutQuizTemplateNestedInput
  }

  export type QuestionUpsertWithoutQuizTemplatesInput = {
    update: XOR<QuestionUpdateWithoutQuizTemplatesInput, QuestionUncheckedUpdateWithoutQuizTemplatesInput>
    create: XOR<QuestionCreateWithoutQuizTemplatesInput, QuestionUncheckedCreateWithoutQuizTemplatesInput>
    where?: QuestionWhereInput
  }

  export type QuestionUpdateToOneWithWhereWithoutQuizTemplatesInput = {
    where?: QuestionWhereInput
    data: XOR<QuestionUpdateWithoutQuizTemplatesInput, QuestionUncheckedUpdateWithoutQuizTemplatesInput>
  }

  export type QuestionUpdateWithoutQuizTemplatesInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    responses?: JsonNullValueInput | InputJsonValue
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionUncheckedUpdateWithoutQuizTemplatesInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    responses?: JsonNullValueInput | InputJsonValue
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuizTemplateCreateWithoutGameInstancesInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: QuizTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creatorTeacher: TeacherCreateNestedOneWithoutQuizTemplatesInput
    questions?: QuestionsInQuizTemplateCreateNestedManyWithoutQuizTemplateInput
  }

  export type QuizTemplateUncheckedCreateWithoutGameInstancesInput = {
    id?: string
    name: string
    creatorTeacherId: string
    gradeLevel?: string | null
    themes?: QuizTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    questions?: QuestionsInQuizTemplateUncheckedCreateNestedManyWithoutQuizTemplateInput
  }

  export type QuizTemplateCreateOrConnectWithoutGameInstancesInput = {
    where: QuizTemplateWhereUniqueInput
    create: XOR<QuizTemplateCreateWithoutGameInstancesInput, QuizTemplateUncheckedCreateWithoutGameInstancesInput>
  }

  export type TeacherCreateWithoutGameInstancesInput = {
    id?: string
    username: string
    passwordHash: string
    email?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    quizTemplates?: QuizTemplateCreateNestedManyWithoutCreatorTeacherInput
  }

  export type TeacherUncheckedCreateWithoutGameInstancesInput = {
    id?: string
    username: string
    passwordHash: string
    email?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    quizTemplates?: QuizTemplateUncheckedCreateNestedManyWithoutCreatorTeacherInput
  }

  export type TeacherCreateOrConnectWithoutGameInstancesInput = {
    where: TeacherWhereUniqueInput
    create: XOR<TeacherCreateWithoutGameInstancesInput, TeacherUncheckedCreateWithoutGameInstancesInput>
  }

  export type GameParticipantCreateWithoutGameInstanceInput = {
    id?: string
    score?: number
    rank?: number | null
    timeTakenMs?: number | null
    joinedAt?: Date | string
    completedAt?: Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    player: PlayerCreateNestedOneWithoutGameParticipationsInput
  }

  export type GameParticipantUncheckedCreateWithoutGameInstanceInput = {
    id?: string
    playerId: string
    score?: number
    rank?: number | null
    timeTakenMs?: number | null
    joinedAt?: Date | string
    completedAt?: Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GameParticipantCreateOrConnectWithoutGameInstanceInput = {
    where: GameParticipantWhereUniqueInput
    create: XOR<GameParticipantCreateWithoutGameInstanceInput, GameParticipantUncheckedCreateWithoutGameInstanceInput>
  }

  export type GameParticipantCreateManyGameInstanceInputEnvelope = {
    data: GameParticipantCreateManyGameInstanceInput | GameParticipantCreateManyGameInstanceInput[]
    skipDuplicates?: boolean
  }

  export type QuizTemplateUpsertWithoutGameInstancesInput = {
    update: XOR<QuizTemplateUpdateWithoutGameInstancesInput, QuizTemplateUncheckedUpdateWithoutGameInstancesInput>
    create: XOR<QuizTemplateCreateWithoutGameInstancesInput, QuizTemplateUncheckedCreateWithoutGameInstancesInput>
    where?: QuizTemplateWhereInput
  }

  export type QuizTemplateUpdateToOneWithWhereWithoutGameInstancesInput = {
    where?: QuizTemplateWhereInput
    data: XOR<QuizTemplateUpdateWithoutGameInstancesInput, QuizTemplateUncheckedUpdateWithoutGameInstancesInput>
  }

  export type QuizTemplateUpdateWithoutGameInstancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorTeacher?: TeacherUpdateOneRequiredWithoutQuizTemplatesNestedInput
    questions?: QuestionsInQuizTemplateUpdateManyWithoutQuizTemplateNestedInput
  }

  export type QuizTemplateUncheckedUpdateWithoutGameInstancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    creatorTeacherId?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questions?: QuestionsInQuizTemplateUncheckedUpdateManyWithoutQuizTemplateNestedInput
  }

  export type TeacherUpsertWithoutGameInstancesInput = {
    update: XOR<TeacherUpdateWithoutGameInstancesInput, TeacherUncheckedUpdateWithoutGameInstancesInput>
    create: XOR<TeacherCreateWithoutGameInstancesInput, TeacherUncheckedCreateWithoutGameInstancesInput>
    where?: TeacherWhereInput
  }

  export type TeacherUpdateToOneWithWhereWithoutGameInstancesInput = {
    where?: TeacherWhereInput
    data: XOR<TeacherUpdateWithoutGameInstancesInput, TeacherUncheckedUpdateWithoutGameInstancesInput>
  }

  export type TeacherUpdateWithoutGameInstancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quizTemplates?: QuizTemplateUpdateManyWithoutCreatorTeacherNestedInput
  }

  export type TeacherUncheckedUpdateWithoutGameInstancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quizTemplates?: QuizTemplateUncheckedUpdateManyWithoutCreatorTeacherNestedInput
  }

  export type GameParticipantUpsertWithWhereUniqueWithoutGameInstanceInput = {
    where: GameParticipantWhereUniqueInput
    update: XOR<GameParticipantUpdateWithoutGameInstanceInput, GameParticipantUncheckedUpdateWithoutGameInstanceInput>
    create: XOR<GameParticipantCreateWithoutGameInstanceInput, GameParticipantUncheckedCreateWithoutGameInstanceInput>
  }

  export type GameParticipantUpdateWithWhereUniqueWithoutGameInstanceInput = {
    where: GameParticipantWhereUniqueInput
    data: XOR<GameParticipantUpdateWithoutGameInstanceInput, GameParticipantUncheckedUpdateWithoutGameInstanceInput>
  }

  export type GameParticipantUpdateManyWithWhereWithoutGameInstanceInput = {
    where: GameParticipantScalarWhereInput
    data: XOR<GameParticipantUpdateManyMutationInput, GameParticipantUncheckedUpdateManyWithoutGameInstanceInput>
  }

  export type GameInstanceCreateWithoutParticipantsInput = {
    id?: string
    name: string
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    quizTemplate: QuizTemplateCreateNestedOneWithoutGameInstancesInput
    initiatorTeacher?: TeacherCreateNestedOneWithoutGameInstancesInput
  }

  export type GameInstanceUncheckedCreateWithoutParticipantsInput = {
    id?: string
    name: string
    quizTemplateId: string
    initiatorTeacherId?: string | null
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
  }

  export type GameInstanceCreateOrConnectWithoutParticipantsInput = {
    where: GameInstanceWhereUniqueInput
    create: XOR<GameInstanceCreateWithoutParticipantsInput, GameInstanceUncheckedCreateWithoutParticipantsInput>
  }

  export type PlayerCreateWithoutGameParticipationsInput = {
    id?: string
    username: string
    cookieId: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
  }

  export type PlayerUncheckedCreateWithoutGameParticipationsInput = {
    id?: string
    username: string
    cookieId: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    avatarUrl?: string | null
  }

  export type PlayerCreateOrConnectWithoutGameParticipationsInput = {
    where: PlayerWhereUniqueInput
    create: XOR<PlayerCreateWithoutGameParticipationsInput, PlayerUncheckedCreateWithoutGameParticipationsInput>
  }

  export type GameInstanceUpsertWithoutParticipantsInput = {
    update: XOR<GameInstanceUpdateWithoutParticipantsInput, GameInstanceUncheckedUpdateWithoutParticipantsInput>
    create: XOR<GameInstanceCreateWithoutParticipantsInput, GameInstanceUncheckedCreateWithoutParticipantsInput>
    where?: GameInstanceWhereInput
  }

  export type GameInstanceUpdateToOneWithWhereWithoutParticipantsInput = {
    where?: GameInstanceWhereInput
    data: XOR<GameInstanceUpdateWithoutParticipantsInput, GameInstanceUncheckedUpdateWithoutParticipantsInput>
  }

  export type GameInstanceUpdateWithoutParticipantsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quizTemplate?: QuizTemplateUpdateOneRequiredWithoutGameInstancesNestedInput
    initiatorTeacher?: TeacherUpdateOneWithoutGameInstancesNestedInput
  }

  export type GameInstanceUncheckedUpdateWithoutParticipantsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    quizTemplateId?: StringFieldUpdateOperationsInput | string
    initiatorTeacherId?: NullableStringFieldUpdateOperationsInput | string | null
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PlayerUpsertWithoutGameParticipationsInput = {
    update: XOR<PlayerUpdateWithoutGameParticipationsInput, PlayerUncheckedUpdateWithoutGameParticipationsInput>
    create: XOR<PlayerCreateWithoutGameParticipationsInput, PlayerUncheckedCreateWithoutGameParticipationsInput>
    where?: PlayerWhereInput
  }

  export type PlayerUpdateToOneWithWhereWithoutGameParticipationsInput = {
    where?: PlayerWhereInput
    data: XOR<PlayerUpdateWithoutGameParticipationsInput, PlayerUncheckedUpdateWithoutGameParticipationsInput>
  }

  export type PlayerUpdateWithoutGameParticipationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    cookieId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PlayerUncheckedUpdateWithoutGameParticipationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    cookieId?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QuizTemplateCreateManyCreatorTeacherInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: QuizTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GameInstanceCreateManyInitiatorTeacherInput = {
    id?: string
    name: string
    quizTemplateId: string
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
  }

  export type QuizTemplateUpdateWithoutCreatorTeacherInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questions?: QuestionsInQuizTemplateUpdateManyWithoutQuizTemplateNestedInput
    gameInstances?: GameInstanceUpdateManyWithoutQuizTemplateNestedInput
  }

  export type QuizTemplateUncheckedUpdateWithoutCreatorTeacherInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questions?: QuestionsInQuizTemplateUncheckedUpdateManyWithoutQuizTemplateNestedInput
    gameInstances?: GameInstanceUncheckedUpdateManyWithoutQuizTemplateNestedInput
  }

  export type QuizTemplateUncheckedUpdateManyWithoutCreatorTeacherInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: QuizTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameInstanceUpdateWithoutInitiatorTeacherInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quizTemplate?: QuizTemplateUpdateOneRequiredWithoutGameInstancesNestedInput
    participants?: GameParticipantUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceUncheckedUpdateWithoutInitiatorTeacherInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    quizTemplateId?: StringFieldUpdateOperationsInput | string
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    participants?: GameParticipantUncheckedUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceUncheckedUpdateManyWithoutInitiatorTeacherInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    quizTemplateId?: StringFieldUpdateOperationsInput | string
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameParticipantCreateManyPlayerInput = {
    id?: string
    gameInstanceId: string
    score?: number
    rank?: number | null
    timeTakenMs?: number | null
    joinedAt?: Date | string
    completedAt?: Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GameParticipantUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    rank?: NullableIntFieldUpdateOperationsInput | number | null
    timeTakenMs?: NullableIntFieldUpdateOperationsInput | number | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameInstance?: GameInstanceUpdateOneRequiredWithoutParticipantsNestedInput
  }

  export type GameParticipantUncheckedUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameInstanceId?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    rank?: NullableIntFieldUpdateOperationsInput | number | null
    timeTakenMs?: NullableIntFieldUpdateOperationsInput | number | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameParticipantUncheckedUpdateManyWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameInstanceId?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    rank?: NullableIntFieldUpdateOperationsInput | number | null
    timeTakenMs?: NullableIntFieldUpdateOperationsInput | number | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInQuizTemplateCreateManyQuestionInput = {
    quizTemplateId: string
    sequence: number
    createdAt?: Date | string
  }

  export type QuestionsInQuizTemplateUpdateWithoutQuestionInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quizTemplate?: QuizTemplateUpdateOneRequiredWithoutQuestionsNestedInput
  }

  export type QuestionsInQuizTemplateUncheckedUpdateWithoutQuestionInput = {
    quizTemplateId?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInQuizTemplateUncheckedUpdateManyWithoutQuestionInput = {
    quizTemplateId?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInQuizTemplateCreateManyQuizTemplateInput = {
    questionUid: string
    sequence: number
    createdAt?: Date | string
  }

  export type GameInstanceCreateManyQuizTemplateInput = {
    id?: string
    name: string
    initiatorTeacherId?: string | null
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    startedAt?: Date | string | null
    endedAt?: Date | string | null
  }

  export type QuestionsInQuizTemplateUpdateWithoutQuizTemplateInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    question?: QuestionUpdateOneRequiredWithoutQuizTemplatesNestedInput
  }

  export type QuestionsInQuizTemplateUncheckedUpdateWithoutQuizTemplateInput = {
    questionUid?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInQuizTemplateUncheckedUpdateManyWithoutQuizTemplateInput = {
    questionUid?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameInstanceUpdateWithoutQuizTemplateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    initiatorTeacher?: TeacherUpdateOneWithoutGameInstancesNestedInput
    participants?: GameParticipantUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceUncheckedUpdateWithoutQuizTemplateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    initiatorTeacherId?: NullableStringFieldUpdateOperationsInput | string | null
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    participants?: GameParticipantUncheckedUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceUncheckedUpdateManyWithoutQuizTemplateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    initiatorTeacherId?: NullableStringFieldUpdateOperationsInput | string | null
    accessCode?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    playMode?: EnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode
    leaderboard?: NullableJsonNullValueInput | InputJsonValue
    currentQuestionIndex?: NullableIntFieldUpdateOperationsInput | number | null
    settings?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameParticipantCreateManyGameInstanceInput = {
    id?: string
    playerId: string
    score?: number
    rank?: number | null
    timeTakenMs?: number | null
    joinedAt?: Date | string
    completedAt?: Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GameParticipantUpdateWithoutGameInstanceInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    rank?: NullableIntFieldUpdateOperationsInput | number | null
    timeTakenMs?: NullableIntFieldUpdateOperationsInput | number | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    player?: PlayerUpdateOneRequiredWithoutGameParticipationsNestedInput
  }

  export type GameParticipantUncheckedUpdateWithoutGameInstanceInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    rank?: NullableIntFieldUpdateOperationsInput | number | null
    timeTakenMs?: NullableIntFieldUpdateOperationsInput | number | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameParticipantUncheckedUpdateManyWithoutGameInstanceInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    score?: IntFieldUpdateOperationsInput | number
    rank?: NullableIntFieldUpdateOperationsInput | number | null
    timeTakenMs?: NullableIntFieldUpdateOperationsInput | number | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    answers?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}