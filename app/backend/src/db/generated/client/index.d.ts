
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
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model TeacherProfile
 * 
 */
export type TeacherProfile = $Result.DefaultSelection<Prisma.$TeacherProfilePayload>
/**
 * Model StudentProfile
 * 
 */
export type StudentProfile = $Result.DefaultSelection<Prisma.$StudentProfilePayload>
/**
 * Model Question
 * 
 */
export type Question = $Result.DefaultSelection<Prisma.$QuestionPayload>
/**
 * Model MultipleChoiceQuestion
 * 
 */
export type MultipleChoiceQuestion = $Result.DefaultSelection<Prisma.$MultipleChoiceQuestionPayload>
/**
 * Model NumericQuestion
 * 
 */
export type NumericQuestion = $Result.DefaultSelection<Prisma.$NumericQuestionPayload>
/**
 * Model GameTemplate
 * 
 */
export type GameTemplate = $Result.DefaultSelection<Prisma.$GameTemplatePayload>
/**
 * Model QuestionsInGameTemplate
 * 
 */
export type QuestionsInGameTemplate = $Result.DefaultSelection<Prisma.$QuestionsInGameTemplatePayload>
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
  export const UserRole: {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  GUEST: 'GUEST'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]


export const PlayMode: {
  quiz: 'quiz',
  tournament: 'tournament',
  practice: 'practice'
};

export type PlayMode = (typeof PlayMode)[keyof typeof PlayMode]


export const ParticipantStatus: {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  LEFT: 'LEFT'
};

export type ParticipantStatus = (typeof ParticipantStatus)[keyof typeof ParticipantStatus]

}

export type UserRole = $Enums.UserRole

export const UserRole: typeof $Enums.UserRole

export type PlayMode = $Enums.PlayMode

export const PlayMode: typeof $Enums.PlayMode

export type ParticipantStatus = $Enums.ParticipantStatus

export const ParticipantStatus: typeof $Enums.ParticipantStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
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
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
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
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.teacherProfile`: Exposes CRUD operations for the **TeacherProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TeacherProfiles
    * const teacherProfiles = await prisma.teacherProfile.findMany()
    * ```
    */
  get teacherProfile(): Prisma.TeacherProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.studentProfile`: Exposes CRUD operations for the **StudentProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StudentProfiles
    * const studentProfiles = await prisma.studentProfile.findMany()
    * ```
    */
  get studentProfile(): Prisma.StudentProfileDelegate<ExtArgs, ClientOptions>;

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
   * `prisma.multipleChoiceQuestion`: Exposes CRUD operations for the **MultipleChoiceQuestion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MultipleChoiceQuestions
    * const multipleChoiceQuestions = await prisma.multipleChoiceQuestion.findMany()
    * ```
    */
  get multipleChoiceQuestion(): Prisma.MultipleChoiceQuestionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.numericQuestion`: Exposes CRUD operations for the **NumericQuestion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more NumericQuestions
    * const numericQuestions = await prisma.numericQuestion.findMany()
    * ```
    */
  get numericQuestion(): Prisma.NumericQuestionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.gameTemplate`: Exposes CRUD operations for the **GameTemplate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GameTemplates
    * const gameTemplates = await prisma.gameTemplate.findMany()
    * ```
    */
  get gameTemplate(): Prisma.GameTemplateDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.questionsInGameTemplate`: Exposes CRUD operations for the **QuestionsInGameTemplate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuestionsInGameTemplates
    * const questionsInGameTemplates = await prisma.questionsInGameTemplate.findMany()
    * ```
    */
  get questionsInGameTemplate(): Prisma.QuestionsInGameTemplateDelegate<ExtArgs, ClientOptions>;

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
    User: 'User',
    TeacherProfile: 'TeacherProfile',
    StudentProfile: 'StudentProfile',
    Question: 'Question',
    MultipleChoiceQuestion: 'MultipleChoiceQuestion',
    NumericQuestion: 'NumericQuestion',
    GameTemplate: 'GameTemplate',
    QuestionsInGameTemplate: 'QuestionsInGameTemplate',
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
      modelProps: "user" | "teacherProfile" | "studentProfile" | "question" | "multipleChoiceQuestion" | "numericQuestion" | "gameTemplate" | "questionsInGameTemplate" | "gameInstance" | "gameParticipant"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      TeacherProfile: {
        payload: Prisma.$TeacherProfilePayload<ExtArgs>
        fields: Prisma.TeacherProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TeacherProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TeacherProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload>
          }
          findFirst: {
            args: Prisma.TeacherProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TeacherProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload>
          }
          findMany: {
            args: Prisma.TeacherProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload>[]
          }
          create: {
            args: Prisma.TeacherProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload>
          }
          createMany: {
            args: Prisma.TeacherProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TeacherProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload>[]
          }
          delete: {
            args: Prisma.TeacherProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload>
          }
          update: {
            args: Prisma.TeacherProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload>
          }
          deleteMany: {
            args: Prisma.TeacherProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TeacherProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TeacherProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload>[]
          }
          upsert: {
            args: Prisma.TeacherProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeacherProfilePayload>
          }
          aggregate: {
            args: Prisma.TeacherProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTeacherProfile>
          }
          groupBy: {
            args: Prisma.TeacherProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<TeacherProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.TeacherProfileCountArgs<ExtArgs>
            result: $Utils.Optional<TeacherProfileCountAggregateOutputType> | number
          }
        }
      }
      StudentProfile: {
        payload: Prisma.$StudentProfilePayload<ExtArgs>
        fields: Prisma.StudentProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StudentProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StudentProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload>
          }
          findFirst: {
            args: Prisma.StudentProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StudentProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload>
          }
          findMany: {
            args: Prisma.StudentProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload>[]
          }
          create: {
            args: Prisma.StudentProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload>
          }
          createMany: {
            args: Prisma.StudentProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StudentProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload>[]
          }
          delete: {
            args: Prisma.StudentProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload>
          }
          update: {
            args: Prisma.StudentProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload>
          }
          deleteMany: {
            args: Prisma.StudentProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StudentProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.StudentProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload>[]
          }
          upsert: {
            args: Prisma.StudentProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudentProfilePayload>
          }
          aggregate: {
            args: Prisma.StudentProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStudentProfile>
          }
          groupBy: {
            args: Prisma.StudentProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<StudentProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.StudentProfileCountArgs<ExtArgs>
            result: $Utils.Optional<StudentProfileCountAggregateOutputType> | number
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
      MultipleChoiceQuestion: {
        payload: Prisma.$MultipleChoiceQuestionPayload<ExtArgs>
        fields: Prisma.MultipleChoiceQuestionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MultipleChoiceQuestionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MultipleChoiceQuestionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload>
          }
          findFirst: {
            args: Prisma.MultipleChoiceQuestionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MultipleChoiceQuestionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload>
          }
          findMany: {
            args: Prisma.MultipleChoiceQuestionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload>[]
          }
          create: {
            args: Prisma.MultipleChoiceQuestionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload>
          }
          createMany: {
            args: Prisma.MultipleChoiceQuestionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MultipleChoiceQuestionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload>[]
          }
          delete: {
            args: Prisma.MultipleChoiceQuestionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload>
          }
          update: {
            args: Prisma.MultipleChoiceQuestionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload>
          }
          deleteMany: {
            args: Prisma.MultipleChoiceQuestionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MultipleChoiceQuestionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MultipleChoiceQuestionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload>[]
          }
          upsert: {
            args: Prisma.MultipleChoiceQuestionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MultipleChoiceQuestionPayload>
          }
          aggregate: {
            args: Prisma.MultipleChoiceQuestionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMultipleChoiceQuestion>
          }
          groupBy: {
            args: Prisma.MultipleChoiceQuestionGroupByArgs<ExtArgs>
            result: $Utils.Optional<MultipleChoiceQuestionGroupByOutputType>[]
          }
          count: {
            args: Prisma.MultipleChoiceQuestionCountArgs<ExtArgs>
            result: $Utils.Optional<MultipleChoiceQuestionCountAggregateOutputType> | number
          }
        }
      }
      NumericQuestion: {
        payload: Prisma.$NumericQuestionPayload<ExtArgs>
        fields: Prisma.NumericQuestionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NumericQuestionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NumericQuestionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload>
          }
          findFirst: {
            args: Prisma.NumericQuestionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NumericQuestionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload>
          }
          findMany: {
            args: Prisma.NumericQuestionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload>[]
          }
          create: {
            args: Prisma.NumericQuestionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload>
          }
          createMany: {
            args: Prisma.NumericQuestionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NumericQuestionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload>[]
          }
          delete: {
            args: Prisma.NumericQuestionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload>
          }
          update: {
            args: Prisma.NumericQuestionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload>
          }
          deleteMany: {
            args: Prisma.NumericQuestionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NumericQuestionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.NumericQuestionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload>[]
          }
          upsert: {
            args: Prisma.NumericQuestionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NumericQuestionPayload>
          }
          aggregate: {
            args: Prisma.NumericQuestionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNumericQuestion>
          }
          groupBy: {
            args: Prisma.NumericQuestionGroupByArgs<ExtArgs>
            result: $Utils.Optional<NumericQuestionGroupByOutputType>[]
          }
          count: {
            args: Prisma.NumericQuestionCountArgs<ExtArgs>
            result: $Utils.Optional<NumericQuestionCountAggregateOutputType> | number
          }
        }
      }
      GameTemplate: {
        payload: Prisma.$GameTemplatePayload<ExtArgs>
        fields: Prisma.GameTemplateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GameTemplateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GameTemplateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload>
          }
          findFirst: {
            args: Prisma.GameTemplateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GameTemplateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload>
          }
          findMany: {
            args: Prisma.GameTemplateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload>[]
          }
          create: {
            args: Prisma.GameTemplateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload>
          }
          createMany: {
            args: Prisma.GameTemplateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GameTemplateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload>[]
          }
          delete: {
            args: Prisma.GameTemplateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload>
          }
          update: {
            args: Prisma.GameTemplateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload>
          }
          deleteMany: {
            args: Prisma.GameTemplateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GameTemplateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GameTemplateUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload>[]
          }
          upsert: {
            args: Prisma.GameTemplateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameTemplatePayload>
          }
          aggregate: {
            args: Prisma.GameTemplateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGameTemplate>
          }
          groupBy: {
            args: Prisma.GameTemplateGroupByArgs<ExtArgs>
            result: $Utils.Optional<GameTemplateGroupByOutputType>[]
          }
          count: {
            args: Prisma.GameTemplateCountArgs<ExtArgs>
            result: $Utils.Optional<GameTemplateCountAggregateOutputType> | number
          }
        }
      }
      QuestionsInGameTemplate: {
        payload: Prisma.$QuestionsInGameTemplatePayload<ExtArgs>
        fields: Prisma.QuestionsInGameTemplateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuestionsInGameTemplateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuestionsInGameTemplateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload>
          }
          findFirst: {
            args: Prisma.QuestionsInGameTemplateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuestionsInGameTemplateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload>
          }
          findMany: {
            args: Prisma.QuestionsInGameTemplateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload>[]
          }
          create: {
            args: Prisma.QuestionsInGameTemplateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload>
          }
          createMany: {
            args: Prisma.QuestionsInGameTemplateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuestionsInGameTemplateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload>[]
          }
          delete: {
            args: Prisma.QuestionsInGameTemplateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload>
          }
          update: {
            args: Prisma.QuestionsInGameTemplateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload>
          }
          deleteMany: {
            args: Prisma.QuestionsInGameTemplateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuestionsInGameTemplateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QuestionsInGameTemplateUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload>[]
          }
          upsert: {
            args: Prisma.QuestionsInGameTemplateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionsInGameTemplatePayload>
          }
          aggregate: {
            args: Prisma.QuestionsInGameTemplateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuestionsInGameTemplate>
          }
          groupBy: {
            args: Prisma.QuestionsInGameTemplateGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuestionsInGameTemplateGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuestionsInGameTemplateCountArgs<ExtArgs>
            result: $Utils.Optional<QuestionsInGameTemplateCountAggregateOutputType> | number
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
    user?: UserOmit
    teacherProfile?: TeacherProfileOmit
    studentProfile?: StudentProfileOmit
    question?: QuestionOmit
    multipleChoiceQuestion?: MultipleChoiceQuestionOmit
    numericQuestion?: NumericQuestionOmit
    gameTemplate?: GameTemplateOmit
    questionsInGameTemplate?: QuestionsInGameTemplateOmit
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
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    initiatedGameInstances: number
    gameParticipations: number
    createdGameTemplates: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    initiatedGameInstances?: boolean | UserCountOutputTypeCountInitiatedGameInstancesArgs
    gameParticipations?: boolean | UserCountOutputTypeCountGameParticipationsArgs
    createdGameTemplates?: boolean | UserCountOutputTypeCountCreatedGameTemplatesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountInitiatedGameInstancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameInstanceWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountGameParticipationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameParticipantWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCreatedGameTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameTemplateWhereInput
  }


  /**
   * Count Type QuestionCountOutputType
   */

  export type QuestionCountOutputType = {
    gameTemplates: number
  }

  export type QuestionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameTemplates?: boolean | QuestionCountOutputTypeCountGameTemplatesArgs
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
  export type QuestionCountOutputTypeCountGameTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionsInGameTemplateWhereInput
  }


  /**
   * Count Type GameTemplateCountOutputType
   */

  export type GameTemplateCountOutputType = {
    gameInstances: number
    questions: number
  }

  export type GameTemplateCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameInstances?: boolean | GameTemplateCountOutputTypeCountGameInstancesArgs
    questions?: boolean | GameTemplateCountOutputTypeCountQuestionsArgs
  }

  // Custom InputTypes
  /**
   * GameTemplateCountOutputType without action
   */
  export type GameTemplateCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplateCountOutputType
     */
    select?: GameTemplateCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * GameTemplateCountOutputType without action
   */
  export type GameTemplateCountOutputTypeCountGameInstancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameInstanceWhereInput
  }

  /**
   * GameTemplateCountOutputType without action
   */
  export type GameTemplateCountOutputTypeCountQuestionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionsInGameTemplateWhereInput
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
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    username: string | null
    email: string | null
    passwordHash: string | null
    createdAt: Date | null
    role: $Enums.UserRole | null
    resetToken: string | null
    resetTokenExpiresAt: Date | null
    avatarEmoji: string | null
    emailVerificationToken: string | null
    emailVerificationTokenExpiresAt: Date | null
    emailVerified: boolean | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    username: string | null
    email: string | null
    passwordHash: string | null
    createdAt: Date | null
    role: $Enums.UserRole | null
    resetToken: string | null
    resetTokenExpiresAt: Date | null
    avatarEmoji: string | null
    emailVerificationToken: string | null
    emailVerificationTokenExpiresAt: Date | null
    emailVerified: boolean | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    username: number
    email: number
    passwordHash: number
    createdAt: number
    role: number
    resetToken: number
    resetTokenExpiresAt: number
    avatarEmoji: number
    emailVerificationToken: number
    emailVerificationTokenExpiresAt: number
    emailVerified: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    username?: true
    email?: true
    passwordHash?: true
    createdAt?: true
    role?: true
    resetToken?: true
    resetTokenExpiresAt?: true
    avatarEmoji?: true
    emailVerificationToken?: true
    emailVerificationTokenExpiresAt?: true
    emailVerified?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    username?: true
    email?: true
    passwordHash?: true
    createdAt?: true
    role?: true
    resetToken?: true
    resetTokenExpiresAt?: true
    avatarEmoji?: true
    emailVerificationToken?: true
    emailVerificationTokenExpiresAt?: true
    emailVerified?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    username?: true
    email?: true
    passwordHash?: true
    createdAt?: true
    role?: true
    resetToken?: true
    resetTokenExpiresAt?: true
    avatarEmoji?: true
    emailVerificationToken?: true
    emailVerificationTokenExpiresAt?: true
    emailVerified?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    username: string
    email: string | null
    passwordHash: string | null
    createdAt: Date
    role: $Enums.UserRole
    resetToken: string | null
    resetTokenExpiresAt: Date | null
    avatarEmoji: string | null
    emailVerificationToken: string | null
    emailVerificationTokenExpiresAt: Date | null
    emailVerified: boolean | null
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    email?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    role?: boolean
    resetToken?: boolean
    resetTokenExpiresAt?: boolean
    avatarEmoji?: boolean
    emailVerificationToken?: boolean
    emailVerificationTokenExpiresAt?: boolean
    emailVerified?: boolean
    studentProfile?: boolean | User$studentProfileArgs<ExtArgs>
    teacherProfile?: boolean | User$teacherProfileArgs<ExtArgs>
    initiatedGameInstances?: boolean | User$initiatedGameInstancesArgs<ExtArgs>
    gameParticipations?: boolean | User$gameParticipationsArgs<ExtArgs>
    createdGameTemplates?: boolean | User$createdGameTemplatesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    email?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    role?: boolean
    resetToken?: boolean
    resetTokenExpiresAt?: boolean
    avatarEmoji?: boolean
    emailVerificationToken?: boolean
    emailVerificationTokenExpiresAt?: boolean
    emailVerified?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    email?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    role?: boolean
    resetToken?: boolean
    resetTokenExpiresAt?: boolean
    avatarEmoji?: boolean
    emailVerificationToken?: boolean
    emailVerificationTokenExpiresAt?: boolean
    emailVerified?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    username?: boolean
    email?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    role?: boolean
    resetToken?: boolean
    resetTokenExpiresAt?: boolean
    avatarEmoji?: boolean
    emailVerificationToken?: boolean
    emailVerificationTokenExpiresAt?: boolean
    emailVerified?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "username" | "email" | "passwordHash" | "createdAt" | "role" | "resetToken" | "resetTokenExpiresAt" | "avatarEmoji" | "emailVerificationToken" | "emailVerificationTokenExpiresAt" | "emailVerified", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    studentProfile?: boolean | User$studentProfileArgs<ExtArgs>
    teacherProfile?: boolean | User$teacherProfileArgs<ExtArgs>
    initiatedGameInstances?: boolean | User$initiatedGameInstancesArgs<ExtArgs>
    gameParticipations?: boolean | User$gameParticipationsArgs<ExtArgs>
    createdGameTemplates?: boolean | User$createdGameTemplatesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      studentProfile: Prisma.$StudentProfilePayload<ExtArgs> | null
      teacherProfile: Prisma.$TeacherProfilePayload<ExtArgs> | null
      initiatedGameInstances: Prisma.$GameInstancePayload<ExtArgs>[]
      gameParticipations: Prisma.$GameParticipantPayload<ExtArgs>[]
      createdGameTemplates: Prisma.$GameTemplatePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      username: string
      email: string | null
      passwordHash: string | null
      createdAt: Date
      role: $Enums.UserRole
      resetToken: string | null
      resetTokenExpiresAt: Date | null
      avatarEmoji: string | null
      emailVerificationToken: string | null
      emailVerificationTokenExpiresAt: Date | null
      emailVerified: boolean | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
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
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
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
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    studentProfile<T extends User$studentProfileArgs<ExtArgs> = {}>(args?: Subset<T, User$studentProfileArgs<ExtArgs>>): Prisma__StudentProfileClient<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    teacherProfile<T extends User$teacherProfileArgs<ExtArgs> = {}>(args?: Subset<T, User$teacherProfileArgs<ExtArgs>>): Prisma__TeacherProfileClient<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    initiatedGameInstances<T extends User$initiatedGameInstancesArgs<ExtArgs> = {}>(args?: Subset<T, User$initiatedGameInstancesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    gameParticipations<T extends User$gameParticipationsArgs<ExtArgs> = {}>(args?: Subset<T, User$gameParticipationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameParticipantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    createdGameTemplates<T extends User$createdGameTemplatesArgs<ExtArgs> = {}>(args?: Subset<T, User$createdGameTemplatesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly username: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly role: FieldRef<"User", 'UserRole'>
    readonly resetToken: FieldRef<"User", 'String'>
    readonly resetTokenExpiresAt: FieldRef<"User", 'DateTime'>
    readonly avatarEmoji: FieldRef<"User", 'String'>
    readonly emailVerificationToken: FieldRef<"User", 'String'>
    readonly emailVerificationTokenExpiresAt: FieldRef<"User", 'DateTime'>
    readonly emailVerified: FieldRef<"User", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.studentProfile
   */
  export type User$studentProfileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
    where?: StudentProfileWhereInput
  }

  /**
   * User.teacherProfile
   */
  export type User$teacherProfileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
    where?: TeacherProfileWhereInput
  }

  /**
   * User.initiatedGameInstances
   */
  export type User$initiatedGameInstancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
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
   * User.gameParticipations
   */
  export type User$gameParticipationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
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
   * User.createdGameTemplates
   */
  export type User$createdGameTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
    where?: GameTemplateWhereInput
    orderBy?: GameTemplateOrderByWithRelationInput | GameTemplateOrderByWithRelationInput[]
    cursor?: GameTemplateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GameTemplateScalarFieldEnum | GameTemplateScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model TeacherProfile
   */

  export type AggregateTeacherProfile = {
    _count: TeacherProfileCountAggregateOutputType | null
    _min: TeacherProfileMinAggregateOutputType | null
    _max: TeacherProfileMaxAggregateOutputType | null
  }

  export type TeacherProfileMinAggregateOutputType = {
    id: string | null
  }

  export type TeacherProfileMaxAggregateOutputType = {
    id: string | null
  }

  export type TeacherProfileCountAggregateOutputType = {
    id: number
    _all: number
  }


  export type TeacherProfileMinAggregateInputType = {
    id?: true
  }

  export type TeacherProfileMaxAggregateInputType = {
    id?: true
  }

  export type TeacherProfileCountAggregateInputType = {
    id?: true
    _all?: true
  }

  export type TeacherProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TeacherProfile to aggregate.
     */
    where?: TeacherProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeacherProfiles to fetch.
     */
    orderBy?: TeacherProfileOrderByWithRelationInput | TeacherProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TeacherProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeacherProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeacherProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TeacherProfiles
    **/
    _count?: true | TeacherProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TeacherProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TeacherProfileMaxAggregateInputType
  }

  export type GetTeacherProfileAggregateType<T extends TeacherProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateTeacherProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTeacherProfile[P]>
      : GetScalarType<T[P], AggregateTeacherProfile[P]>
  }




  export type TeacherProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeacherProfileWhereInput
    orderBy?: TeacherProfileOrderByWithAggregationInput | TeacherProfileOrderByWithAggregationInput[]
    by: TeacherProfileScalarFieldEnum[] | TeacherProfileScalarFieldEnum
    having?: TeacherProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TeacherProfileCountAggregateInputType | true
    _min?: TeacherProfileMinAggregateInputType
    _max?: TeacherProfileMaxAggregateInputType
  }

  export type TeacherProfileGroupByOutputType = {
    id: string
    _count: TeacherProfileCountAggregateOutputType | null
    _min: TeacherProfileMinAggregateOutputType | null
    _max: TeacherProfileMaxAggregateOutputType | null
  }

  type GetTeacherProfileGroupByPayload<T extends TeacherProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TeacherProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TeacherProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TeacherProfileGroupByOutputType[P]>
            : GetScalarType<T[P], TeacherProfileGroupByOutputType[P]>
        }
      >
    >


  export type TeacherProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["teacherProfile"]>

  export type TeacherProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["teacherProfile"]>

  export type TeacherProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["teacherProfile"]>

  export type TeacherProfileSelectScalar = {
    id?: boolean
  }

  export type TeacherProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id", ExtArgs["result"]["teacherProfile"]>
  export type TeacherProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type TeacherProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type TeacherProfileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $TeacherProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TeacherProfile"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
    }, ExtArgs["result"]["teacherProfile"]>
    composites: {}
  }

  type TeacherProfileGetPayload<S extends boolean | null | undefined | TeacherProfileDefaultArgs> = $Result.GetResult<Prisma.$TeacherProfilePayload, S>

  type TeacherProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TeacherProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TeacherProfileCountAggregateInputType | true
    }

  export interface TeacherProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TeacherProfile'], meta: { name: 'TeacherProfile' } }
    /**
     * Find zero or one TeacherProfile that matches the filter.
     * @param {TeacherProfileFindUniqueArgs} args - Arguments to find a TeacherProfile
     * @example
     * // Get one TeacherProfile
     * const teacherProfile = await prisma.teacherProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TeacherProfileFindUniqueArgs>(args: SelectSubset<T, TeacherProfileFindUniqueArgs<ExtArgs>>): Prisma__TeacherProfileClient<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TeacherProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TeacherProfileFindUniqueOrThrowArgs} args - Arguments to find a TeacherProfile
     * @example
     * // Get one TeacherProfile
     * const teacherProfile = await prisma.teacherProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TeacherProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, TeacherProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TeacherProfileClient<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TeacherProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherProfileFindFirstArgs} args - Arguments to find a TeacherProfile
     * @example
     * // Get one TeacherProfile
     * const teacherProfile = await prisma.teacherProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TeacherProfileFindFirstArgs>(args?: SelectSubset<T, TeacherProfileFindFirstArgs<ExtArgs>>): Prisma__TeacherProfileClient<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TeacherProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherProfileFindFirstOrThrowArgs} args - Arguments to find a TeacherProfile
     * @example
     * // Get one TeacherProfile
     * const teacherProfile = await prisma.teacherProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TeacherProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, TeacherProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__TeacherProfileClient<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TeacherProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TeacherProfiles
     * const teacherProfiles = await prisma.teacherProfile.findMany()
     * 
     * // Get first 10 TeacherProfiles
     * const teacherProfiles = await prisma.teacherProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const teacherProfileWithIdOnly = await prisma.teacherProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TeacherProfileFindManyArgs>(args?: SelectSubset<T, TeacherProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TeacherProfile.
     * @param {TeacherProfileCreateArgs} args - Arguments to create a TeacherProfile.
     * @example
     * // Create one TeacherProfile
     * const TeacherProfile = await prisma.teacherProfile.create({
     *   data: {
     *     // ... data to create a TeacherProfile
     *   }
     * })
     * 
     */
    create<T extends TeacherProfileCreateArgs>(args: SelectSubset<T, TeacherProfileCreateArgs<ExtArgs>>): Prisma__TeacherProfileClient<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TeacherProfiles.
     * @param {TeacherProfileCreateManyArgs} args - Arguments to create many TeacherProfiles.
     * @example
     * // Create many TeacherProfiles
     * const teacherProfile = await prisma.teacherProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TeacherProfileCreateManyArgs>(args?: SelectSubset<T, TeacherProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TeacherProfiles and returns the data saved in the database.
     * @param {TeacherProfileCreateManyAndReturnArgs} args - Arguments to create many TeacherProfiles.
     * @example
     * // Create many TeacherProfiles
     * const teacherProfile = await prisma.teacherProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TeacherProfiles and only return the `id`
     * const teacherProfileWithIdOnly = await prisma.teacherProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TeacherProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, TeacherProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TeacherProfile.
     * @param {TeacherProfileDeleteArgs} args - Arguments to delete one TeacherProfile.
     * @example
     * // Delete one TeacherProfile
     * const TeacherProfile = await prisma.teacherProfile.delete({
     *   where: {
     *     // ... filter to delete one TeacherProfile
     *   }
     * })
     * 
     */
    delete<T extends TeacherProfileDeleteArgs>(args: SelectSubset<T, TeacherProfileDeleteArgs<ExtArgs>>): Prisma__TeacherProfileClient<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TeacherProfile.
     * @param {TeacherProfileUpdateArgs} args - Arguments to update one TeacherProfile.
     * @example
     * // Update one TeacherProfile
     * const teacherProfile = await prisma.teacherProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TeacherProfileUpdateArgs>(args: SelectSubset<T, TeacherProfileUpdateArgs<ExtArgs>>): Prisma__TeacherProfileClient<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TeacherProfiles.
     * @param {TeacherProfileDeleteManyArgs} args - Arguments to filter TeacherProfiles to delete.
     * @example
     * // Delete a few TeacherProfiles
     * const { count } = await prisma.teacherProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TeacherProfileDeleteManyArgs>(args?: SelectSubset<T, TeacherProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TeacherProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TeacherProfiles
     * const teacherProfile = await prisma.teacherProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TeacherProfileUpdateManyArgs>(args: SelectSubset<T, TeacherProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TeacherProfiles and returns the data updated in the database.
     * @param {TeacherProfileUpdateManyAndReturnArgs} args - Arguments to update many TeacherProfiles.
     * @example
     * // Update many TeacherProfiles
     * const teacherProfile = await prisma.teacherProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TeacherProfiles and only return the `id`
     * const teacherProfileWithIdOnly = await prisma.teacherProfile.updateManyAndReturn({
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
    updateManyAndReturn<T extends TeacherProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, TeacherProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TeacherProfile.
     * @param {TeacherProfileUpsertArgs} args - Arguments to update or create a TeacherProfile.
     * @example
     * // Update or create a TeacherProfile
     * const teacherProfile = await prisma.teacherProfile.upsert({
     *   create: {
     *     // ... data to create a TeacherProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TeacherProfile we want to update
     *   }
     * })
     */
    upsert<T extends TeacherProfileUpsertArgs>(args: SelectSubset<T, TeacherProfileUpsertArgs<ExtArgs>>): Prisma__TeacherProfileClient<$Result.GetResult<Prisma.$TeacherProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TeacherProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherProfileCountArgs} args - Arguments to filter TeacherProfiles to count.
     * @example
     * // Count the number of TeacherProfiles
     * const count = await prisma.teacherProfile.count({
     *   where: {
     *     // ... the filter for the TeacherProfiles we want to count
     *   }
     * })
    **/
    count<T extends TeacherProfileCountArgs>(
      args?: Subset<T, TeacherProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TeacherProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TeacherProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends TeacherProfileAggregateArgs>(args: Subset<T, TeacherProfileAggregateArgs>): Prisma.PrismaPromise<GetTeacherProfileAggregateType<T>>

    /**
     * Group by TeacherProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeacherProfileGroupByArgs} args - Group by arguments.
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
      T extends TeacherProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TeacherProfileGroupByArgs['orderBy'] }
        : { orderBy?: TeacherProfileGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, TeacherProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTeacherProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TeacherProfile model
   */
  readonly fields: TeacherProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TeacherProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TeacherProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the TeacherProfile model
   */
  interface TeacherProfileFieldRefs {
    readonly id: FieldRef<"TeacherProfile", 'String'>
  }
    

  // Custom InputTypes
  /**
   * TeacherProfile findUnique
   */
  export type TeacherProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
    /**
     * Filter, which TeacherProfile to fetch.
     */
    where: TeacherProfileWhereUniqueInput
  }

  /**
   * TeacherProfile findUniqueOrThrow
   */
  export type TeacherProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
    /**
     * Filter, which TeacherProfile to fetch.
     */
    where: TeacherProfileWhereUniqueInput
  }

  /**
   * TeacherProfile findFirst
   */
  export type TeacherProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
    /**
     * Filter, which TeacherProfile to fetch.
     */
    where?: TeacherProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeacherProfiles to fetch.
     */
    orderBy?: TeacherProfileOrderByWithRelationInput | TeacherProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TeacherProfiles.
     */
    cursor?: TeacherProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeacherProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeacherProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TeacherProfiles.
     */
    distinct?: TeacherProfileScalarFieldEnum | TeacherProfileScalarFieldEnum[]
  }

  /**
   * TeacherProfile findFirstOrThrow
   */
  export type TeacherProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
    /**
     * Filter, which TeacherProfile to fetch.
     */
    where?: TeacherProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeacherProfiles to fetch.
     */
    orderBy?: TeacherProfileOrderByWithRelationInput | TeacherProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TeacherProfiles.
     */
    cursor?: TeacherProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeacherProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeacherProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TeacherProfiles.
     */
    distinct?: TeacherProfileScalarFieldEnum | TeacherProfileScalarFieldEnum[]
  }

  /**
   * TeacherProfile findMany
   */
  export type TeacherProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
    /**
     * Filter, which TeacherProfiles to fetch.
     */
    where?: TeacherProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeacherProfiles to fetch.
     */
    orderBy?: TeacherProfileOrderByWithRelationInput | TeacherProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TeacherProfiles.
     */
    cursor?: TeacherProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeacherProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeacherProfiles.
     */
    skip?: number
    distinct?: TeacherProfileScalarFieldEnum | TeacherProfileScalarFieldEnum[]
  }

  /**
   * TeacherProfile create
   */
  export type TeacherProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a TeacherProfile.
     */
    data: XOR<TeacherProfileCreateInput, TeacherProfileUncheckedCreateInput>
  }

  /**
   * TeacherProfile createMany
   */
  export type TeacherProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TeacherProfiles.
     */
    data: TeacherProfileCreateManyInput | TeacherProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TeacherProfile createManyAndReturn
   */
  export type TeacherProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * The data used to create many TeacherProfiles.
     */
    data: TeacherProfileCreateManyInput | TeacherProfileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TeacherProfile update
   */
  export type TeacherProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a TeacherProfile.
     */
    data: XOR<TeacherProfileUpdateInput, TeacherProfileUncheckedUpdateInput>
    /**
     * Choose, which TeacherProfile to update.
     */
    where: TeacherProfileWhereUniqueInput
  }

  /**
   * TeacherProfile updateMany
   */
  export type TeacherProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TeacherProfiles.
     */
    data: XOR<TeacherProfileUpdateManyMutationInput, TeacherProfileUncheckedUpdateManyInput>
    /**
     * Filter which TeacherProfiles to update
     */
    where?: TeacherProfileWhereInput
    /**
     * Limit how many TeacherProfiles to update.
     */
    limit?: number
  }

  /**
   * TeacherProfile updateManyAndReturn
   */
  export type TeacherProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * The data used to update TeacherProfiles.
     */
    data: XOR<TeacherProfileUpdateManyMutationInput, TeacherProfileUncheckedUpdateManyInput>
    /**
     * Filter which TeacherProfiles to update
     */
    where?: TeacherProfileWhereInput
    /**
     * Limit how many TeacherProfiles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TeacherProfile upsert
   */
  export type TeacherProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the TeacherProfile to update in case it exists.
     */
    where: TeacherProfileWhereUniqueInput
    /**
     * In case the TeacherProfile found by the `where` argument doesn't exist, create a new TeacherProfile with this data.
     */
    create: XOR<TeacherProfileCreateInput, TeacherProfileUncheckedCreateInput>
    /**
     * In case the TeacherProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TeacherProfileUpdateInput, TeacherProfileUncheckedUpdateInput>
  }

  /**
   * TeacherProfile delete
   */
  export type TeacherProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
    /**
     * Filter which TeacherProfile to delete.
     */
    where: TeacherProfileWhereUniqueInput
  }

  /**
   * TeacherProfile deleteMany
   */
  export type TeacherProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TeacherProfiles to delete
     */
    where?: TeacherProfileWhereInput
    /**
     * Limit how many TeacherProfiles to delete.
     */
    limit?: number
  }

  /**
   * TeacherProfile without action
   */
  export type TeacherProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeacherProfile
     */
    select?: TeacherProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeacherProfile
     */
    omit?: TeacherProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeacherProfileInclude<ExtArgs> | null
  }


  /**
   * Model StudentProfile
   */

  export type AggregateStudentProfile = {
    _count: StudentProfileCountAggregateOutputType | null
    _min: StudentProfileMinAggregateOutputType | null
    _max: StudentProfileMaxAggregateOutputType | null
  }

  export type StudentProfileMinAggregateOutputType = {
    id: string | null
    cookieId: string | null
  }

  export type StudentProfileMaxAggregateOutputType = {
    id: string | null
    cookieId: string | null
  }

  export type StudentProfileCountAggregateOutputType = {
    id: number
    cookieId: number
    _all: number
  }


  export type StudentProfileMinAggregateInputType = {
    id?: true
    cookieId?: true
  }

  export type StudentProfileMaxAggregateInputType = {
    id?: true
    cookieId?: true
  }

  export type StudentProfileCountAggregateInputType = {
    id?: true
    cookieId?: true
    _all?: true
  }

  export type StudentProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StudentProfile to aggregate.
     */
    where?: StudentProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StudentProfiles to fetch.
     */
    orderBy?: StudentProfileOrderByWithRelationInput | StudentProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StudentProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StudentProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StudentProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StudentProfiles
    **/
    _count?: true | StudentProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StudentProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StudentProfileMaxAggregateInputType
  }

  export type GetStudentProfileAggregateType<T extends StudentProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateStudentProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStudentProfile[P]>
      : GetScalarType<T[P], AggregateStudentProfile[P]>
  }




  export type StudentProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StudentProfileWhereInput
    orderBy?: StudentProfileOrderByWithAggregationInput | StudentProfileOrderByWithAggregationInput[]
    by: StudentProfileScalarFieldEnum[] | StudentProfileScalarFieldEnum
    having?: StudentProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StudentProfileCountAggregateInputType | true
    _min?: StudentProfileMinAggregateInputType
    _max?: StudentProfileMaxAggregateInputType
  }

  export type StudentProfileGroupByOutputType = {
    id: string
    cookieId: string | null
    _count: StudentProfileCountAggregateOutputType | null
    _min: StudentProfileMinAggregateOutputType | null
    _max: StudentProfileMaxAggregateOutputType | null
  }

  type GetStudentProfileGroupByPayload<T extends StudentProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StudentProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StudentProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StudentProfileGroupByOutputType[P]>
            : GetScalarType<T[P], StudentProfileGroupByOutputType[P]>
        }
      >
    >


  export type StudentProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    cookieId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["studentProfile"]>

  export type StudentProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    cookieId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["studentProfile"]>

  export type StudentProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    cookieId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["studentProfile"]>

  export type StudentProfileSelectScalar = {
    id?: boolean
    cookieId?: boolean
  }

  export type StudentProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "cookieId", ExtArgs["result"]["studentProfile"]>
  export type StudentProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type StudentProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type StudentProfileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $StudentProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StudentProfile"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      cookieId: string | null
    }, ExtArgs["result"]["studentProfile"]>
    composites: {}
  }

  type StudentProfileGetPayload<S extends boolean | null | undefined | StudentProfileDefaultArgs> = $Result.GetResult<Prisma.$StudentProfilePayload, S>

  type StudentProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<StudentProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: StudentProfileCountAggregateInputType | true
    }

  export interface StudentProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StudentProfile'], meta: { name: 'StudentProfile' } }
    /**
     * Find zero or one StudentProfile that matches the filter.
     * @param {StudentProfileFindUniqueArgs} args - Arguments to find a StudentProfile
     * @example
     * // Get one StudentProfile
     * const studentProfile = await prisma.studentProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StudentProfileFindUniqueArgs>(args: SelectSubset<T, StudentProfileFindUniqueArgs<ExtArgs>>): Prisma__StudentProfileClient<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one StudentProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {StudentProfileFindUniqueOrThrowArgs} args - Arguments to find a StudentProfile
     * @example
     * // Get one StudentProfile
     * const studentProfile = await prisma.studentProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StudentProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, StudentProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StudentProfileClient<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StudentProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentProfileFindFirstArgs} args - Arguments to find a StudentProfile
     * @example
     * // Get one StudentProfile
     * const studentProfile = await prisma.studentProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StudentProfileFindFirstArgs>(args?: SelectSubset<T, StudentProfileFindFirstArgs<ExtArgs>>): Prisma__StudentProfileClient<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StudentProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentProfileFindFirstOrThrowArgs} args - Arguments to find a StudentProfile
     * @example
     * // Get one StudentProfile
     * const studentProfile = await prisma.studentProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StudentProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, StudentProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__StudentProfileClient<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more StudentProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StudentProfiles
     * const studentProfiles = await prisma.studentProfile.findMany()
     * 
     * // Get first 10 StudentProfiles
     * const studentProfiles = await prisma.studentProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const studentProfileWithIdOnly = await prisma.studentProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StudentProfileFindManyArgs>(args?: SelectSubset<T, StudentProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a StudentProfile.
     * @param {StudentProfileCreateArgs} args - Arguments to create a StudentProfile.
     * @example
     * // Create one StudentProfile
     * const StudentProfile = await prisma.studentProfile.create({
     *   data: {
     *     // ... data to create a StudentProfile
     *   }
     * })
     * 
     */
    create<T extends StudentProfileCreateArgs>(args: SelectSubset<T, StudentProfileCreateArgs<ExtArgs>>): Prisma__StudentProfileClient<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many StudentProfiles.
     * @param {StudentProfileCreateManyArgs} args - Arguments to create many StudentProfiles.
     * @example
     * // Create many StudentProfiles
     * const studentProfile = await prisma.studentProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StudentProfileCreateManyArgs>(args?: SelectSubset<T, StudentProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StudentProfiles and returns the data saved in the database.
     * @param {StudentProfileCreateManyAndReturnArgs} args - Arguments to create many StudentProfiles.
     * @example
     * // Create many StudentProfiles
     * const studentProfile = await prisma.studentProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StudentProfiles and only return the `id`
     * const studentProfileWithIdOnly = await prisma.studentProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StudentProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, StudentProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a StudentProfile.
     * @param {StudentProfileDeleteArgs} args - Arguments to delete one StudentProfile.
     * @example
     * // Delete one StudentProfile
     * const StudentProfile = await prisma.studentProfile.delete({
     *   where: {
     *     // ... filter to delete one StudentProfile
     *   }
     * })
     * 
     */
    delete<T extends StudentProfileDeleteArgs>(args: SelectSubset<T, StudentProfileDeleteArgs<ExtArgs>>): Prisma__StudentProfileClient<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one StudentProfile.
     * @param {StudentProfileUpdateArgs} args - Arguments to update one StudentProfile.
     * @example
     * // Update one StudentProfile
     * const studentProfile = await prisma.studentProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StudentProfileUpdateArgs>(args: SelectSubset<T, StudentProfileUpdateArgs<ExtArgs>>): Prisma__StudentProfileClient<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more StudentProfiles.
     * @param {StudentProfileDeleteManyArgs} args - Arguments to filter StudentProfiles to delete.
     * @example
     * // Delete a few StudentProfiles
     * const { count } = await prisma.studentProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StudentProfileDeleteManyArgs>(args?: SelectSubset<T, StudentProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StudentProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StudentProfiles
     * const studentProfile = await prisma.studentProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StudentProfileUpdateManyArgs>(args: SelectSubset<T, StudentProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StudentProfiles and returns the data updated in the database.
     * @param {StudentProfileUpdateManyAndReturnArgs} args - Arguments to update many StudentProfiles.
     * @example
     * // Update many StudentProfiles
     * const studentProfile = await prisma.studentProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more StudentProfiles and only return the `id`
     * const studentProfileWithIdOnly = await prisma.studentProfile.updateManyAndReturn({
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
    updateManyAndReturn<T extends StudentProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, StudentProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one StudentProfile.
     * @param {StudentProfileUpsertArgs} args - Arguments to update or create a StudentProfile.
     * @example
     * // Update or create a StudentProfile
     * const studentProfile = await prisma.studentProfile.upsert({
     *   create: {
     *     // ... data to create a StudentProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StudentProfile we want to update
     *   }
     * })
     */
    upsert<T extends StudentProfileUpsertArgs>(args: SelectSubset<T, StudentProfileUpsertArgs<ExtArgs>>): Prisma__StudentProfileClient<$Result.GetResult<Prisma.$StudentProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of StudentProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentProfileCountArgs} args - Arguments to filter StudentProfiles to count.
     * @example
     * // Count the number of StudentProfiles
     * const count = await prisma.studentProfile.count({
     *   where: {
     *     // ... the filter for the StudentProfiles we want to count
     *   }
     * })
    **/
    count<T extends StudentProfileCountArgs>(
      args?: Subset<T, StudentProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StudentProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StudentProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends StudentProfileAggregateArgs>(args: Subset<T, StudentProfileAggregateArgs>): Prisma.PrismaPromise<GetStudentProfileAggregateType<T>>

    /**
     * Group by StudentProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudentProfileGroupByArgs} args - Group by arguments.
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
      T extends StudentProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StudentProfileGroupByArgs['orderBy'] }
        : { orderBy?: StudentProfileGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, StudentProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStudentProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StudentProfile model
   */
  readonly fields: StudentProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StudentProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StudentProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the StudentProfile model
   */
  interface StudentProfileFieldRefs {
    readonly id: FieldRef<"StudentProfile", 'String'>
    readonly cookieId: FieldRef<"StudentProfile", 'String'>
  }
    

  // Custom InputTypes
  /**
   * StudentProfile findUnique
   */
  export type StudentProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
    /**
     * Filter, which StudentProfile to fetch.
     */
    where: StudentProfileWhereUniqueInput
  }

  /**
   * StudentProfile findUniqueOrThrow
   */
  export type StudentProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
    /**
     * Filter, which StudentProfile to fetch.
     */
    where: StudentProfileWhereUniqueInput
  }

  /**
   * StudentProfile findFirst
   */
  export type StudentProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
    /**
     * Filter, which StudentProfile to fetch.
     */
    where?: StudentProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StudentProfiles to fetch.
     */
    orderBy?: StudentProfileOrderByWithRelationInput | StudentProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StudentProfiles.
     */
    cursor?: StudentProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StudentProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StudentProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StudentProfiles.
     */
    distinct?: StudentProfileScalarFieldEnum | StudentProfileScalarFieldEnum[]
  }

  /**
   * StudentProfile findFirstOrThrow
   */
  export type StudentProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
    /**
     * Filter, which StudentProfile to fetch.
     */
    where?: StudentProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StudentProfiles to fetch.
     */
    orderBy?: StudentProfileOrderByWithRelationInput | StudentProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StudentProfiles.
     */
    cursor?: StudentProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StudentProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StudentProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StudentProfiles.
     */
    distinct?: StudentProfileScalarFieldEnum | StudentProfileScalarFieldEnum[]
  }

  /**
   * StudentProfile findMany
   */
  export type StudentProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
    /**
     * Filter, which StudentProfiles to fetch.
     */
    where?: StudentProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StudentProfiles to fetch.
     */
    orderBy?: StudentProfileOrderByWithRelationInput | StudentProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StudentProfiles.
     */
    cursor?: StudentProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StudentProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StudentProfiles.
     */
    skip?: number
    distinct?: StudentProfileScalarFieldEnum | StudentProfileScalarFieldEnum[]
  }

  /**
   * StudentProfile create
   */
  export type StudentProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a StudentProfile.
     */
    data: XOR<StudentProfileCreateInput, StudentProfileUncheckedCreateInput>
  }

  /**
   * StudentProfile createMany
   */
  export type StudentProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StudentProfiles.
     */
    data: StudentProfileCreateManyInput | StudentProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StudentProfile createManyAndReturn
   */
  export type StudentProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * The data used to create many StudentProfiles.
     */
    data: StudentProfileCreateManyInput | StudentProfileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * StudentProfile update
   */
  export type StudentProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a StudentProfile.
     */
    data: XOR<StudentProfileUpdateInput, StudentProfileUncheckedUpdateInput>
    /**
     * Choose, which StudentProfile to update.
     */
    where: StudentProfileWhereUniqueInput
  }

  /**
   * StudentProfile updateMany
   */
  export type StudentProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StudentProfiles.
     */
    data: XOR<StudentProfileUpdateManyMutationInput, StudentProfileUncheckedUpdateManyInput>
    /**
     * Filter which StudentProfiles to update
     */
    where?: StudentProfileWhereInput
    /**
     * Limit how many StudentProfiles to update.
     */
    limit?: number
  }

  /**
   * StudentProfile updateManyAndReturn
   */
  export type StudentProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * The data used to update StudentProfiles.
     */
    data: XOR<StudentProfileUpdateManyMutationInput, StudentProfileUncheckedUpdateManyInput>
    /**
     * Filter which StudentProfiles to update
     */
    where?: StudentProfileWhereInput
    /**
     * Limit how many StudentProfiles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * StudentProfile upsert
   */
  export type StudentProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the StudentProfile to update in case it exists.
     */
    where: StudentProfileWhereUniqueInput
    /**
     * In case the StudentProfile found by the `where` argument doesn't exist, create a new StudentProfile with this data.
     */
    create: XOR<StudentProfileCreateInput, StudentProfileUncheckedCreateInput>
    /**
     * In case the StudentProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StudentProfileUpdateInput, StudentProfileUncheckedUpdateInput>
  }

  /**
   * StudentProfile delete
   */
  export type StudentProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
    /**
     * Filter which StudentProfile to delete.
     */
    where: StudentProfileWhereUniqueInput
  }

  /**
   * StudentProfile deleteMany
   */
  export type StudentProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StudentProfiles to delete
     */
    where?: StudentProfileWhereInput
    /**
     * Limit how many StudentProfiles to delete.
     */
    limit?: number
  }

  /**
   * StudentProfile without action
   */
  export type StudentProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudentProfile
     */
    select?: StudentProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudentProfile
     */
    omit?: StudentProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudentProfileInclude<ExtArgs> | null
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
    feedbackWaitTime: number | null
  }

  export type QuestionSumAggregateOutputType = {
    difficulty: number | null
    timeLimit: number | null
    feedbackWaitTime: number | null
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
    createdAt: Date | null
    updatedAt: Date | null
    feedbackWaitTime: number | null
    isHidden: boolean | null
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
    createdAt: Date | null
    updatedAt: Date | null
    feedbackWaitTime: number | null
    isHidden: boolean | null
  }

  export type QuestionCountAggregateOutputType = {
    uid: number
    title: number
    text: number
    questionType: number
    discipline: number
    themes: number
    difficulty: number
    gradeLevel: number
    author: number
    explanation: number
    tags: number
    timeLimit: number
    excludedFrom: number
    createdAt: number
    updatedAt: number
    feedbackWaitTime: number
    isHidden: number
    _all: number
  }


  export type QuestionAvgAggregateInputType = {
    difficulty?: true
    timeLimit?: true
    feedbackWaitTime?: true
  }

  export type QuestionSumAggregateInputType = {
    difficulty?: true
    timeLimit?: true
    feedbackWaitTime?: true
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
    createdAt?: true
    updatedAt?: true
    feedbackWaitTime?: true
    isHidden?: true
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
    createdAt?: true
    updatedAt?: true
    feedbackWaitTime?: true
    isHidden?: true
  }

  export type QuestionCountAggregateInputType = {
    uid?: true
    title?: true
    text?: true
    questionType?: true
    discipline?: true
    themes?: true
    difficulty?: true
    gradeLevel?: true
    author?: true
    explanation?: true
    tags?: true
    timeLimit?: true
    excludedFrom?: true
    createdAt?: true
    updatedAt?: true
    feedbackWaitTime?: true
    isHidden?: true
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
    questionType: string
    discipline: string
    themes: string[]
    difficulty: number | null
    gradeLevel: string | null
    author: string | null
    explanation: string | null
    tags: string[]
    timeLimit: number
    excludedFrom: string[]
    createdAt: Date
    updatedAt: Date
    feedbackWaitTime: number | null
    isHidden: boolean | null
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
    questionType?: boolean
    discipline?: boolean
    themes?: boolean
    difficulty?: boolean
    gradeLevel?: boolean
    author?: boolean
    explanation?: boolean
    tags?: boolean
    timeLimit?: boolean
    excludedFrom?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    feedbackWaitTime?: boolean
    isHidden?: boolean
    multipleChoiceQuestion?: boolean | Question$multipleChoiceQuestionArgs<ExtArgs>
    numericQuestion?: boolean | Question$numericQuestionArgs<ExtArgs>
    gameTemplates?: boolean | Question$gameTemplatesArgs<ExtArgs>
    _count?: boolean | QuestionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["question"]>

  export type QuestionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    uid?: boolean
    title?: boolean
    text?: boolean
    questionType?: boolean
    discipline?: boolean
    themes?: boolean
    difficulty?: boolean
    gradeLevel?: boolean
    author?: boolean
    explanation?: boolean
    tags?: boolean
    timeLimit?: boolean
    excludedFrom?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    feedbackWaitTime?: boolean
    isHidden?: boolean
  }, ExtArgs["result"]["question"]>

  export type QuestionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    uid?: boolean
    title?: boolean
    text?: boolean
    questionType?: boolean
    discipline?: boolean
    themes?: boolean
    difficulty?: boolean
    gradeLevel?: boolean
    author?: boolean
    explanation?: boolean
    tags?: boolean
    timeLimit?: boolean
    excludedFrom?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    feedbackWaitTime?: boolean
    isHidden?: boolean
  }, ExtArgs["result"]["question"]>

  export type QuestionSelectScalar = {
    uid?: boolean
    title?: boolean
    text?: boolean
    questionType?: boolean
    discipline?: boolean
    themes?: boolean
    difficulty?: boolean
    gradeLevel?: boolean
    author?: boolean
    explanation?: boolean
    tags?: boolean
    timeLimit?: boolean
    excludedFrom?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    feedbackWaitTime?: boolean
    isHidden?: boolean
  }

  export type QuestionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"uid" | "title" | "text" | "questionType" | "discipline" | "themes" | "difficulty" | "gradeLevel" | "author" | "explanation" | "tags" | "timeLimit" | "excludedFrom" | "createdAt" | "updatedAt" | "feedbackWaitTime" | "isHidden", ExtArgs["result"]["question"]>
  export type QuestionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    multipleChoiceQuestion?: boolean | Question$multipleChoiceQuestionArgs<ExtArgs>
    numericQuestion?: boolean | Question$numericQuestionArgs<ExtArgs>
    gameTemplates?: boolean | Question$gameTemplatesArgs<ExtArgs>
    _count?: boolean | QuestionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type QuestionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type QuestionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $QuestionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Question"
    objects: {
      multipleChoiceQuestion: Prisma.$MultipleChoiceQuestionPayload<ExtArgs> | null
      numericQuestion: Prisma.$NumericQuestionPayload<ExtArgs> | null
      gameTemplates: Prisma.$QuestionsInGameTemplatePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      uid: string
      title: string | null
      text: string
      questionType: string
      discipline: string
      themes: string[]
      difficulty: number | null
      gradeLevel: string | null
      author: string | null
      explanation: string | null
      tags: string[]
      timeLimit: number
      excludedFrom: string[]
      createdAt: Date
      updatedAt: Date
      feedbackWaitTime: number | null
      isHidden: boolean | null
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
    multipleChoiceQuestion<T extends Question$multipleChoiceQuestionArgs<ExtArgs> = {}>(args?: Subset<T, Question$multipleChoiceQuestionArgs<ExtArgs>>): Prisma__MultipleChoiceQuestionClient<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    numericQuestion<T extends Question$numericQuestionArgs<ExtArgs> = {}>(args?: Subset<T, Question$numericQuestionArgs<ExtArgs>>): Prisma__NumericQuestionClient<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    gameTemplates<T extends Question$gameTemplatesArgs<ExtArgs> = {}>(args?: Subset<T, Question$gameTemplatesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
    readonly questionType: FieldRef<"Question", 'String'>
    readonly discipline: FieldRef<"Question", 'String'>
    readonly themes: FieldRef<"Question", 'String[]'>
    readonly difficulty: FieldRef<"Question", 'Int'>
    readonly gradeLevel: FieldRef<"Question", 'String'>
    readonly author: FieldRef<"Question", 'String'>
    readonly explanation: FieldRef<"Question", 'String'>
    readonly tags: FieldRef<"Question", 'String[]'>
    readonly timeLimit: FieldRef<"Question", 'Int'>
    readonly excludedFrom: FieldRef<"Question", 'String[]'>
    readonly createdAt: FieldRef<"Question", 'DateTime'>
    readonly updatedAt: FieldRef<"Question", 'DateTime'>
    readonly feedbackWaitTime: FieldRef<"Question", 'Int'>
    readonly isHidden: FieldRef<"Question", 'Boolean'>
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
   * Question.multipleChoiceQuestion
   */
  export type Question$multipleChoiceQuestionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
    where?: MultipleChoiceQuestionWhereInput
  }

  /**
   * Question.numericQuestion
   */
  export type Question$numericQuestionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
    where?: NumericQuestionWhereInput
  }

  /**
   * Question.gameTemplates
   */
  export type Question$gameTemplatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    where?: QuestionsInGameTemplateWhereInput
    orderBy?: QuestionsInGameTemplateOrderByWithRelationInput | QuestionsInGameTemplateOrderByWithRelationInput[]
    cursor?: QuestionsInGameTemplateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuestionsInGameTemplateScalarFieldEnum | QuestionsInGameTemplateScalarFieldEnum[]
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
   * Model MultipleChoiceQuestion
   */

  export type AggregateMultipleChoiceQuestion = {
    _count: MultipleChoiceQuestionCountAggregateOutputType | null
    _min: MultipleChoiceQuestionMinAggregateOutputType | null
    _max: MultipleChoiceQuestionMaxAggregateOutputType | null
  }

  export type MultipleChoiceQuestionMinAggregateOutputType = {
    questionUid: string | null
  }

  export type MultipleChoiceQuestionMaxAggregateOutputType = {
    questionUid: string | null
  }

  export type MultipleChoiceQuestionCountAggregateOutputType = {
    questionUid: number
    answerOptions: number
    correctAnswers: number
    _all: number
  }


  export type MultipleChoiceQuestionMinAggregateInputType = {
    questionUid?: true
  }

  export type MultipleChoiceQuestionMaxAggregateInputType = {
    questionUid?: true
  }

  export type MultipleChoiceQuestionCountAggregateInputType = {
    questionUid?: true
    answerOptions?: true
    correctAnswers?: true
    _all?: true
  }

  export type MultipleChoiceQuestionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MultipleChoiceQuestion to aggregate.
     */
    where?: MultipleChoiceQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MultipleChoiceQuestions to fetch.
     */
    orderBy?: MultipleChoiceQuestionOrderByWithRelationInput | MultipleChoiceQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MultipleChoiceQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MultipleChoiceQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MultipleChoiceQuestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MultipleChoiceQuestions
    **/
    _count?: true | MultipleChoiceQuestionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MultipleChoiceQuestionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MultipleChoiceQuestionMaxAggregateInputType
  }

  export type GetMultipleChoiceQuestionAggregateType<T extends MultipleChoiceQuestionAggregateArgs> = {
        [P in keyof T & keyof AggregateMultipleChoiceQuestion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMultipleChoiceQuestion[P]>
      : GetScalarType<T[P], AggregateMultipleChoiceQuestion[P]>
  }




  export type MultipleChoiceQuestionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MultipleChoiceQuestionWhereInput
    orderBy?: MultipleChoiceQuestionOrderByWithAggregationInput | MultipleChoiceQuestionOrderByWithAggregationInput[]
    by: MultipleChoiceQuestionScalarFieldEnum[] | MultipleChoiceQuestionScalarFieldEnum
    having?: MultipleChoiceQuestionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MultipleChoiceQuestionCountAggregateInputType | true
    _min?: MultipleChoiceQuestionMinAggregateInputType
    _max?: MultipleChoiceQuestionMaxAggregateInputType
  }

  export type MultipleChoiceQuestionGroupByOutputType = {
    questionUid: string
    answerOptions: string[]
    correctAnswers: boolean[]
    _count: MultipleChoiceQuestionCountAggregateOutputType | null
    _min: MultipleChoiceQuestionMinAggregateOutputType | null
    _max: MultipleChoiceQuestionMaxAggregateOutputType | null
  }

  type GetMultipleChoiceQuestionGroupByPayload<T extends MultipleChoiceQuestionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MultipleChoiceQuestionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MultipleChoiceQuestionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MultipleChoiceQuestionGroupByOutputType[P]>
            : GetScalarType<T[P], MultipleChoiceQuestionGroupByOutputType[P]>
        }
      >
    >


  export type MultipleChoiceQuestionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    questionUid?: boolean
    answerOptions?: boolean
    correctAnswers?: boolean
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["multipleChoiceQuestion"]>

  export type MultipleChoiceQuestionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    questionUid?: boolean
    answerOptions?: boolean
    correctAnswers?: boolean
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["multipleChoiceQuestion"]>

  export type MultipleChoiceQuestionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    questionUid?: boolean
    answerOptions?: boolean
    correctAnswers?: boolean
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["multipleChoiceQuestion"]>

  export type MultipleChoiceQuestionSelectScalar = {
    questionUid?: boolean
    answerOptions?: boolean
    correctAnswers?: boolean
  }

  export type MultipleChoiceQuestionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"questionUid" | "answerOptions" | "correctAnswers", ExtArgs["result"]["multipleChoiceQuestion"]>
  export type MultipleChoiceQuestionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }
  export type MultipleChoiceQuestionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }
  export type MultipleChoiceQuestionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }

  export type $MultipleChoiceQuestionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MultipleChoiceQuestion"
    objects: {
      question: Prisma.$QuestionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      questionUid: string
      answerOptions: string[]
      correctAnswers: boolean[]
    }, ExtArgs["result"]["multipleChoiceQuestion"]>
    composites: {}
  }

  type MultipleChoiceQuestionGetPayload<S extends boolean | null | undefined | MultipleChoiceQuestionDefaultArgs> = $Result.GetResult<Prisma.$MultipleChoiceQuestionPayload, S>

  type MultipleChoiceQuestionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MultipleChoiceQuestionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MultipleChoiceQuestionCountAggregateInputType | true
    }

  export interface MultipleChoiceQuestionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MultipleChoiceQuestion'], meta: { name: 'MultipleChoiceQuestion' } }
    /**
     * Find zero or one MultipleChoiceQuestion that matches the filter.
     * @param {MultipleChoiceQuestionFindUniqueArgs} args - Arguments to find a MultipleChoiceQuestion
     * @example
     * // Get one MultipleChoiceQuestion
     * const multipleChoiceQuestion = await prisma.multipleChoiceQuestion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MultipleChoiceQuestionFindUniqueArgs>(args: SelectSubset<T, MultipleChoiceQuestionFindUniqueArgs<ExtArgs>>): Prisma__MultipleChoiceQuestionClient<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MultipleChoiceQuestion that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MultipleChoiceQuestionFindUniqueOrThrowArgs} args - Arguments to find a MultipleChoiceQuestion
     * @example
     * // Get one MultipleChoiceQuestion
     * const multipleChoiceQuestion = await prisma.multipleChoiceQuestion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MultipleChoiceQuestionFindUniqueOrThrowArgs>(args: SelectSubset<T, MultipleChoiceQuestionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MultipleChoiceQuestionClient<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MultipleChoiceQuestion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MultipleChoiceQuestionFindFirstArgs} args - Arguments to find a MultipleChoiceQuestion
     * @example
     * // Get one MultipleChoiceQuestion
     * const multipleChoiceQuestion = await prisma.multipleChoiceQuestion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MultipleChoiceQuestionFindFirstArgs>(args?: SelectSubset<T, MultipleChoiceQuestionFindFirstArgs<ExtArgs>>): Prisma__MultipleChoiceQuestionClient<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MultipleChoiceQuestion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MultipleChoiceQuestionFindFirstOrThrowArgs} args - Arguments to find a MultipleChoiceQuestion
     * @example
     * // Get one MultipleChoiceQuestion
     * const multipleChoiceQuestion = await prisma.multipleChoiceQuestion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MultipleChoiceQuestionFindFirstOrThrowArgs>(args?: SelectSubset<T, MultipleChoiceQuestionFindFirstOrThrowArgs<ExtArgs>>): Prisma__MultipleChoiceQuestionClient<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MultipleChoiceQuestions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MultipleChoiceQuestionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MultipleChoiceQuestions
     * const multipleChoiceQuestions = await prisma.multipleChoiceQuestion.findMany()
     * 
     * // Get first 10 MultipleChoiceQuestions
     * const multipleChoiceQuestions = await prisma.multipleChoiceQuestion.findMany({ take: 10 })
     * 
     * // Only select the `questionUid`
     * const multipleChoiceQuestionWithQuestionUidOnly = await prisma.multipleChoiceQuestion.findMany({ select: { questionUid: true } })
     * 
     */
    findMany<T extends MultipleChoiceQuestionFindManyArgs>(args?: SelectSubset<T, MultipleChoiceQuestionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MultipleChoiceQuestion.
     * @param {MultipleChoiceQuestionCreateArgs} args - Arguments to create a MultipleChoiceQuestion.
     * @example
     * // Create one MultipleChoiceQuestion
     * const MultipleChoiceQuestion = await prisma.multipleChoiceQuestion.create({
     *   data: {
     *     // ... data to create a MultipleChoiceQuestion
     *   }
     * })
     * 
     */
    create<T extends MultipleChoiceQuestionCreateArgs>(args: SelectSubset<T, MultipleChoiceQuestionCreateArgs<ExtArgs>>): Prisma__MultipleChoiceQuestionClient<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MultipleChoiceQuestions.
     * @param {MultipleChoiceQuestionCreateManyArgs} args - Arguments to create many MultipleChoiceQuestions.
     * @example
     * // Create many MultipleChoiceQuestions
     * const multipleChoiceQuestion = await prisma.multipleChoiceQuestion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MultipleChoiceQuestionCreateManyArgs>(args?: SelectSubset<T, MultipleChoiceQuestionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MultipleChoiceQuestions and returns the data saved in the database.
     * @param {MultipleChoiceQuestionCreateManyAndReturnArgs} args - Arguments to create many MultipleChoiceQuestions.
     * @example
     * // Create many MultipleChoiceQuestions
     * const multipleChoiceQuestion = await prisma.multipleChoiceQuestion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MultipleChoiceQuestions and only return the `questionUid`
     * const multipleChoiceQuestionWithQuestionUidOnly = await prisma.multipleChoiceQuestion.createManyAndReturn({
     *   select: { questionUid: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MultipleChoiceQuestionCreateManyAndReturnArgs>(args?: SelectSubset<T, MultipleChoiceQuestionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MultipleChoiceQuestion.
     * @param {MultipleChoiceQuestionDeleteArgs} args - Arguments to delete one MultipleChoiceQuestion.
     * @example
     * // Delete one MultipleChoiceQuestion
     * const MultipleChoiceQuestion = await prisma.multipleChoiceQuestion.delete({
     *   where: {
     *     // ... filter to delete one MultipleChoiceQuestion
     *   }
     * })
     * 
     */
    delete<T extends MultipleChoiceQuestionDeleteArgs>(args: SelectSubset<T, MultipleChoiceQuestionDeleteArgs<ExtArgs>>): Prisma__MultipleChoiceQuestionClient<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MultipleChoiceQuestion.
     * @param {MultipleChoiceQuestionUpdateArgs} args - Arguments to update one MultipleChoiceQuestion.
     * @example
     * // Update one MultipleChoiceQuestion
     * const multipleChoiceQuestion = await prisma.multipleChoiceQuestion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MultipleChoiceQuestionUpdateArgs>(args: SelectSubset<T, MultipleChoiceQuestionUpdateArgs<ExtArgs>>): Prisma__MultipleChoiceQuestionClient<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MultipleChoiceQuestions.
     * @param {MultipleChoiceQuestionDeleteManyArgs} args - Arguments to filter MultipleChoiceQuestions to delete.
     * @example
     * // Delete a few MultipleChoiceQuestions
     * const { count } = await prisma.multipleChoiceQuestion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MultipleChoiceQuestionDeleteManyArgs>(args?: SelectSubset<T, MultipleChoiceQuestionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MultipleChoiceQuestions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MultipleChoiceQuestionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MultipleChoiceQuestions
     * const multipleChoiceQuestion = await prisma.multipleChoiceQuestion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MultipleChoiceQuestionUpdateManyArgs>(args: SelectSubset<T, MultipleChoiceQuestionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MultipleChoiceQuestions and returns the data updated in the database.
     * @param {MultipleChoiceQuestionUpdateManyAndReturnArgs} args - Arguments to update many MultipleChoiceQuestions.
     * @example
     * // Update many MultipleChoiceQuestions
     * const multipleChoiceQuestion = await prisma.multipleChoiceQuestion.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MultipleChoiceQuestions and only return the `questionUid`
     * const multipleChoiceQuestionWithQuestionUidOnly = await prisma.multipleChoiceQuestion.updateManyAndReturn({
     *   select: { questionUid: true },
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
    updateManyAndReturn<T extends MultipleChoiceQuestionUpdateManyAndReturnArgs>(args: SelectSubset<T, MultipleChoiceQuestionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MultipleChoiceQuestion.
     * @param {MultipleChoiceQuestionUpsertArgs} args - Arguments to update or create a MultipleChoiceQuestion.
     * @example
     * // Update or create a MultipleChoiceQuestion
     * const multipleChoiceQuestion = await prisma.multipleChoiceQuestion.upsert({
     *   create: {
     *     // ... data to create a MultipleChoiceQuestion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MultipleChoiceQuestion we want to update
     *   }
     * })
     */
    upsert<T extends MultipleChoiceQuestionUpsertArgs>(args: SelectSubset<T, MultipleChoiceQuestionUpsertArgs<ExtArgs>>): Prisma__MultipleChoiceQuestionClient<$Result.GetResult<Prisma.$MultipleChoiceQuestionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MultipleChoiceQuestions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MultipleChoiceQuestionCountArgs} args - Arguments to filter MultipleChoiceQuestions to count.
     * @example
     * // Count the number of MultipleChoiceQuestions
     * const count = await prisma.multipleChoiceQuestion.count({
     *   where: {
     *     // ... the filter for the MultipleChoiceQuestions we want to count
     *   }
     * })
    **/
    count<T extends MultipleChoiceQuestionCountArgs>(
      args?: Subset<T, MultipleChoiceQuestionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MultipleChoiceQuestionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MultipleChoiceQuestion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MultipleChoiceQuestionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends MultipleChoiceQuestionAggregateArgs>(args: Subset<T, MultipleChoiceQuestionAggregateArgs>): Prisma.PrismaPromise<GetMultipleChoiceQuestionAggregateType<T>>

    /**
     * Group by MultipleChoiceQuestion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MultipleChoiceQuestionGroupByArgs} args - Group by arguments.
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
      T extends MultipleChoiceQuestionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MultipleChoiceQuestionGroupByArgs['orderBy'] }
        : { orderBy?: MultipleChoiceQuestionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, MultipleChoiceQuestionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMultipleChoiceQuestionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MultipleChoiceQuestion model
   */
  readonly fields: MultipleChoiceQuestionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MultipleChoiceQuestion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MultipleChoiceQuestionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the MultipleChoiceQuestion model
   */
  interface MultipleChoiceQuestionFieldRefs {
    readonly questionUid: FieldRef<"MultipleChoiceQuestion", 'String'>
    readonly answerOptions: FieldRef<"MultipleChoiceQuestion", 'String[]'>
    readonly correctAnswers: FieldRef<"MultipleChoiceQuestion", 'Boolean[]'>
  }
    

  // Custom InputTypes
  /**
   * MultipleChoiceQuestion findUnique
   */
  export type MultipleChoiceQuestionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
    /**
     * Filter, which MultipleChoiceQuestion to fetch.
     */
    where: MultipleChoiceQuestionWhereUniqueInput
  }

  /**
   * MultipleChoiceQuestion findUniqueOrThrow
   */
  export type MultipleChoiceQuestionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
    /**
     * Filter, which MultipleChoiceQuestion to fetch.
     */
    where: MultipleChoiceQuestionWhereUniqueInput
  }

  /**
   * MultipleChoiceQuestion findFirst
   */
  export type MultipleChoiceQuestionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
    /**
     * Filter, which MultipleChoiceQuestion to fetch.
     */
    where?: MultipleChoiceQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MultipleChoiceQuestions to fetch.
     */
    orderBy?: MultipleChoiceQuestionOrderByWithRelationInput | MultipleChoiceQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MultipleChoiceQuestions.
     */
    cursor?: MultipleChoiceQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MultipleChoiceQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MultipleChoiceQuestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MultipleChoiceQuestions.
     */
    distinct?: MultipleChoiceQuestionScalarFieldEnum | MultipleChoiceQuestionScalarFieldEnum[]
  }

  /**
   * MultipleChoiceQuestion findFirstOrThrow
   */
  export type MultipleChoiceQuestionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
    /**
     * Filter, which MultipleChoiceQuestion to fetch.
     */
    where?: MultipleChoiceQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MultipleChoiceQuestions to fetch.
     */
    orderBy?: MultipleChoiceQuestionOrderByWithRelationInput | MultipleChoiceQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MultipleChoiceQuestions.
     */
    cursor?: MultipleChoiceQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MultipleChoiceQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MultipleChoiceQuestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MultipleChoiceQuestions.
     */
    distinct?: MultipleChoiceQuestionScalarFieldEnum | MultipleChoiceQuestionScalarFieldEnum[]
  }

  /**
   * MultipleChoiceQuestion findMany
   */
  export type MultipleChoiceQuestionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
    /**
     * Filter, which MultipleChoiceQuestions to fetch.
     */
    where?: MultipleChoiceQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MultipleChoiceQuestions to fetch.
     */
    orderBy?: MultipleChoiceQuestionOrderByWithRelationInput | MultipleChoiceQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MultipleChoiceQuestions.
     */
    cursor?: MultipleChoiceQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MultipleChoiceQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MultipleChoiceQuestions.
     */
    skip?: number
    distinct?: MultipleChoiceQuestionScalarFieldEnum | MultipleChoiceQuestionScalarFieldEnum[]
  }

  /**
   * MultipleChoiceQuestion create
   */
  export type MultipleChoiceQuestionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
    /**
     * The data needed to create a MultipleChoiceQuestion.
     */
    data: XOR<MultipleChoiceQuestionCreateInput, MultipleChoiceQuestionUncheckedCreateInput>
  }

  /**
   * MultipleChoiceQuestion createMany
   */
  export type MultipleChoiceQuestionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MultipleChoiceQuestions.
     */
    data: MultipleChoiceQuestionCreateManyInput | MultipleChoiceQuestionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MultipleChoiceQuestion createManyAndReturn
   */
  export type MultipleChoiceQuestionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * The data used to create many MultipleChoiceQuestions.
     */
    data: MultipleChoiceQuestionCreateManyInput | MultipleChoiceQuestionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * MultipleChoiceQuestion update
   */
  export type MultipleChoiceQuestionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
    /**
     * The data needed to update a MultipleChoiceQuestion.
     */
    data: XOR<MultipleChoiceQuestionUpdateInput, MultipleChoiceQuestionUncheckedUpdateInput>
    /**
     * Choose, which MultipleChoiceQuestion to update.
     */
    where: MultipleChoiceQuestionWhereUniqueInput
  }

  /**
   * MultipleChoiceQuestion updateMany
   */
  export type MultipleChoiceQuestionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MultipleChoiceQuestions.
     */
    data: XOR<MultipleChoiceQuestionUpdateManyMutationInput, MultipleChoiceQuestionUncheckedUpdateManyInput>
    /**
     * Filter which MultipleChoiceQuestions to update
     */
    where?: MultipleChoiceQuestionWhereInput
    /**
     * Limit how many MultipleChoiceQuestions to update.
     */
    limit?: number
  }

  /**
   * MultipleChoiceQuestion updateManyAndReturn
   */
  export type MultipleChoiceQuestionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * The data used to update MultipleChoiceQuestions.
     */
    data: XOR<MultipleChoiceQuestionUpdateManyMutationInput, MultipleChoiceQuestionUncheckedUpdateManyInput>
    /**
     * Filter which MultipleChoiceQuestions to update
     */
    where?: MultipleChoiceQuestionWhereInput
    /**
     * Limit how many MultipleChoiceQuestions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * MultipleChoiceQuestion upsert
   */
  export type MultipleChoiceQuestionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
    /**
     * The filter to search for the MultipleChoiceQuestion to update in case it exists.
     */
    where: MultipleChoiceQuestionWhereUniqueInput
    /**
     * In case the MultipleChoiceQuestion found by the `where` argument doesn't exist, create a new MultipleChoiceQuestion with this data.
     */
    create: XOR<MultipleChoiceQuestionCreateInput, MultipleChoiceQuestionUncheckedCreateInput>
    /**
     * In case the MultipleChoiceQuestion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MultipleChoiceQuestionUpdateInput, MultipleChoiceQuestionUncheckedUpdateInput>
  }

  /**
   * MultipleChoiceQuestion delete
   */
  export type MultipleChoiceQuestionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
    /**
     * Filter which MultipleChoiceQuestion to delete.
     */
    where: MultipleChoiceQuestionWhereUniqueInput
  }

  /**
   * MultipleChoiceQuestion deleteMany
   */
  export type MultipleChoiceQuestionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MultipleChoiceQuestions to delete
     */
    where?: MultipleChoiceQuestionWhereInput
    /**
     * Limit how many MultipleChoiceQuestions to delete.
     */
    limit?: number
  }

  /**
   * MultipleChoiceQuestion without action
   */
  export type MultipleChoiceQuestionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MultipleChoiceQuestion
     */
    select?: MultipleChoiceQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MultipleChoiceQuestion
     */
    omit?: MultipleChoiceQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MultipleChoiceQuestionInclude<ExtArgs> | null
  }


  /**
   * Model NumericQuestion
   */

  export type AggregateNumericQuestion = {
    _count: NumericQuestionCountAggregateOutputType | null
    _avg: NumericQuestionAvgAggregateOutputType | null
    _sum: NumericQuestionSumAggregateOutputType | null
    _min: NumericQuestionMinAggregateOutputType | null
    _max: NumericQuestionMaxAggregateOutputType | null
  }

  export type NumericQuestionAvgAggregateOutputType = {
    correctAnswer: number | null
    tolerance: number | null
  }

  export type NumericQuestionSumAggregateOutputType = {
    correctAnswer: number | null
    tolerance: number | null
  }

  export type NumericQuestionMinAggregateOutputType = {
    questionUid: string | null
    correctAnswer: number | null
    tolerance: number | null
    unit: string | null
  }

  export type NumericQuestionMaxAggregateOutputType = {
    questionUid: string | null
    correctAnswer: number | null
    tolerance: number | null
    unit: string | null
  }

  export type NumericQuestionCountAggregateOutputType = {
    questionUid: number
    correctAnswer: number
    tolerance: number
    unit: number
    _all: number
  }


  export type NumericQuestionAvgAggregateInputType = {
    correctAnswer?: true
    tolerance?: true
  }

  export type NumericQuestionSumAggregateInputType = {
    correctAnswer?: true
    tolerance?: true
  }

  export type NumericQuestionMinAggregateInputType = {
    questionUid?: true
    correctAnswer?: true
    tolerance?: true
    unit?: true
  }

  export type NumericQuestionMaxAggregateInputType = {
    questionUid?: true
    correctAnswer?: true
    tolerance?: true
    unit?: true
  }

  export type NumericQuestionCountAggregateInputType = {
    questionUid?: true
    correctAnswer?: true
    tolerance?: true
    unit?: true
    _all?: true
  }

  export type NumericQuestionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NumericQuestion to aggregate.
     */
    where?: NumericQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NumericQuestions to fetch.
     */
    orderBy?: NumericQuestionOrderByWithRelationInput | NumericQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NumericQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NumericQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NumericQuestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned NumericQuestions
    **/
    _count?: true | NumericQuestionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: NumericQuestionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: NumericQuestionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NumericQuestionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NumericQuestionMaxAggregateInputType
  }

  export type GetNumericQuestionAggregateType<T extends NumericQuestionAggregateArgs> = {
        [P in keyof T & keyof AggregateNumericQuestion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNumericQuestion[P]>
      : GetScalarType<T[P], AggregateNumericQuestion[P]>
  }




  export type NumericQuestionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NumericQuestionWhereInput
    orderBy?: NumericQuestionOrderByWithAggregationInput | NumericQuestionOrderByWithAggregationInput[]
    by: NumericQuestionScalarFieldEnum[] | NumericQuestionScalarFieldEnum
    having?: NumericQuestionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NumericQuestionCountAggregateInputType | true
    _avg?: NumericQuestionAvgAggregateInputType
    _sum?: NumericQuestionSumAggregateInputType
    _min?: NumericQuestionMinAggregateInputType
    _max?: NumericQuestionMaxAggregateInputType
  }

  export type NumericQuestionGroupByOutputType = {
    questionUid: string
    correctAnswer: number
    tolerance: number | null
    unit: string | null
    _count: NumericQuestionCountAggregateOutputType | null
    _avg: NumericQuestionAvgAggregateOutputType | null
    _sum: NumericQuestionSumAggregateOutputType | null
    _min: NumericQuestionMinAggregateOutputType | null
    _max: NumericQuestionMaxAggregateOutputType | null
  }

  type GetNumericQuestionGroupByPayload<T extends NumericQuestionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NumericQuestionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NumericQuestionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NumericQuestionGroupByOutputType[P]>
            : GetScalarType<T[P], NumericQuestionGroupByOutputType[P]>
        }
      >
    >


  export type NumericQuestionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    questionUid?: boolean
    correctAnswer?: boolean
    tolerance?: boolean
    unit?: boolean
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["numericQuestion"]>

  export type NumericQuestionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    questionUid?: boolean
    correctAnswer?: boolean
    tolerance?: boolean
    unit?: boolean
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["numericQuestion"]>

  export type NumericQuestionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    questionUid?: boolean
    correctAnswer?: boolean
    tolerance?: boolean
    unit?: boolean
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["numericQuestion"]>

  export type NumericQuestionSelectScalar = {
    questionUid?: boolean
    correctAnswer?: boolean
    tolerance?: boolean
    unit?: boolean
  }

  export type NumericQuestionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"questionUid" | "correctAnswer" | "tolerance" | "unit", ExtArgs["result"]["numericQuestion"]>
  export type NumericQuestionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }
  export type NumericQuestionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }
  export type NumericQuestionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }

  export type $NumericQuestionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "NumericQuestion"
    objects: {
      question: Prisma.$QuestionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      questionUid: string
      correctAnswer: number
      tolerance: number | null
      unit: string | null
    }, ExtArgs["result"]["numericQuestion"]>
    composites: {}
  }

  type NumericQuestionGetPayload<S extends boolean | null | undefined | NumericQuestionDefaultArgs> = $Result.GetResult<Prisma.$NumericQuestionPayload, S>

  type NumericQuestionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NumericQuestionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NumericQuestionCountAggregateInputType | true
    }

  export interface NumericQuestionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['NumericQuestion'], meta: { name: 'NumericQuestion' } }
    /**
     * Find zero or one NumericQuestion that matches the filter.
     * @param {NumericQuestionFindUniqueArgs} args - Arguments to find a NumericQuestion
     * @example
     * // Get one NumericQuestion
     * const numericQuestion = await prisma.numericQuestion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NumericQuestionFindUniqueArgs>(args: SelectSubset<T, NumericQuestionFindUniqueArgs<ExtArgs>>): Prisma__NumericQuestionClient<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one NumericQuestion that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NumericQuestionFindUniqueOrThrowArgs} args - Arguments to find a NumericQuestion
     * @example
     * // Get one NumericQuestion
     * const numericQuestion = await prisma.numericQuestion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NumericQuestionFindUniqueOrThrowArgs>(args: SelectSubset<T, NumericQuestionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NumericQuestionClient<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NumericQuestion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NumericQuestionFindFirstArgs} args - Arguments to find a NumericQuestion
     * @example
     * // Get one NumericQuestion
     * const numericQuestion = await prisma.numericQuestion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NumericQuestionFindFirstArgs>(args?: SelectSubset<T, NumericQuestionFindFirstArgs<ExtArgs>>): Prisma__NumericQuestionClient<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NumericQuestion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NumericQuestionFindFirstOrThrowArgs} args - Arguments to find a NumericQuestion
     * @example
     * // Get one NumericQuestion
     * const numericQuestion = await prisma.numericQuestion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NumericQuestionFindFirstOrThrowArgs>(args?: SelectSubset<T, NumericQuestionFindFirstOrThrowArgs<ExtArgs>>): Prisma__NumericQuestionClient<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more NumericQuestions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NumericQuestionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NumericQuestions
     * const numericQuestions = await prisma.numericQuestion.findMany()
     * 
     * // Get first 10 NumericQuestions
     * const numericQuestions = await prisma.numericQuestion.findMany({ take: 10 })
     * 
     * // Only select the `questionUid`
     * const numericQuestionWithQuestionUidOnly = await prisma.numericQuestion.findMany({ select: { questionUid: true } })
     * 
     */
    findMany<T extends NumericQuestionFindManyArgs>(args?: SelectSubset<T, NumericQuestionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a NumericQuestion.
     * @param {NumericQuestionCreateArgs} args - Arguments to create a NumericQuestion.
     * @example
     * // Create one NumericQuestion
     * const NumericQuestion = await prisma.numericQuestion.create({
     *   data: {
     *     // ... data to create a NumericQuestion
     *   }
     * })
     * 
     */
    create<T extends NumericQuestionCreateArgs>(args: SelectSubset<T, NumericQuestionCreateArgs<ExtArgs>>): Prisma__NumericQuestionClient<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many NumericQuestions.
     * @param {NumericQuestionCreateManyArgs} args - Arguments to create many NumericQuestions.
     * @example
     * // Create many NumericQuestions
     * const numericQuestion = await prisma.numericQuestion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NumericQuestionCreateManyArgs>(args?: SelectSubset<T, NumericQuestionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many NumericQuestions and returns the data saved in the database.
     * @param {NumericQuestionCreateManyAndReturnArgs} args - Arguments to create many NumericQuestions.
     * @example
     * // Create many NumericQuestions
     * const numericQuestion = await prisma.numericQuestion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many NumericQuestions and only return the `questionUid`
     * const numericQuestionWithQuestionUidOnly = await prisma.numericQuestion.createManyAndReturn({
     *   select: { questionUid: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NumericQuestionCreateManyAndReturnArgs>(args?: SelectSubset<T, NumericQuestionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a NumericQuestion.
     * @param {NumericQuestionDeleteArgs} args - Arguments to delete one NumericQuestion.
     * @example
     * // Delete one NumericQuestion
     * const NumericQuestion = await prisma.numericQuestion.delete({
     *   where: {
     *     // ... filter to delete one NumericQuestion
     *   }
     * })
     * 
     */
    delete<T extends NumericQuestionDeleteArgs>(args: SelectSubset<T, NumericQuestionDeleteArgs<ExtArgs>>): Prisma__NumericQuestionClient<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one NumericQuestion.
     * @param {NumericQuestionUpdateArgs} args - Arguments to update one NumericQuestion.
     * @example
     * // Update one NumericQuestion
     * const numericQuestion = await prisma.numericQuestion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NumericQuestionUpdateArgs>(args: SelectSubset<T, NumericQuestionUpdateArgs<ExtArgs>>): Prisma__NumericQuestionClient<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more NumericQuestions.
     * @param {NumericQuestionDeleteManyArgs} args - Arguments to filter NumericQuestions to delete.
     * @example
     * // Delete a few NumericQuestions
     * const { count } = await prisma.numericQuestion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NumericQuestionDeleteManyArgs>(args?: SelectSubset<T, NumericQuestionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NumericQuestions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NumericQuestionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NumericQuestions
     * const numericQuestion = await prisma.numericQuestion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NumericQuestionUpdateManyArgs>(args: SelectSubset<T, NumericQuestionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NumericQuestions and returns the data updated in the database.
     * @param {NumericQuestionUpdateManyAndReturnArgs} args - Arguments to update many NumericQuestions.
     * @example
     * // Update many NumericQuestions
     * const numericQuestion = await prisma.numericQuestion.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more NumericQuestions and only return the `questionUid`
     * const numericQuestionWithQuestionUidOnly = await prisma.numericQuestion.updateManyAndReturn({
     *   select: { questionUid: true },
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
    updateManyAndReturn<T extends NumericQuestionUpdateManyAndReturnArgs>(args: SelectSubset<T, NumericQuestionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one NumericQuestion.
     * @param {NumericQuestionUpsertArgs} args - Arguments to update or create a NumericQuestion.
     * @example
     * // Update or create a NumericQuestion
     * const numericQuestion = await prisma.numericQuestion.upsert({
     *   create: {
     *     // ... data to create a NumericQuestion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NumericQuestion we want to update
     *   }
     * })
     */
    upsert<T extends NumericQuestionUpsertArgs>(args: SelectSubset<T, NumericQuestionUpsertArgs<ExtArgs>>): Prisma__NumericQuestionClient<$Result.GetResult<Prisma.$NumericQuestionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of NumericQuestions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NumericQuestionCountArgs} args - Arguments to filter NumericQuestions to count.
     * @example
     * // Count the number of NumericQuestions
     * const count = await prisma.numericQuestion.count({
     *   where: {
     *     // ... the filter for the NumericQuestions we want to count
     *   }
     * })
    **/
    count<T extends NumericQuestionCountArgs>(
      args?: Subset<T, NumericQuestionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NumericQuestionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a NumericQuestion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NumericQuestionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends NumericQuestionAggregateArgs>(args: Subset<T, NumericQuestionAggregateArgs>): Prisma.PrismaPromise<GetNumericQuestionAggregateType<T>>

    /**
     * Group by NumericQuestion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NumericQuestionGroupByArgs} args - Group by arguments.
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
      T extends NumericQuestionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NumericQuestionGroupByArgs['orderBy'] }
        : { orderBy?: NumericQuestionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, NumericQuestionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNumericQuestionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the NumericQuestion model
   */
  readonly fields: NumericQuestionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for NumericQuestion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NumericQuestionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
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
   * Fields of the NumericQuestion model
   */
  interface NumericQuestionFieldRefs {
    readonly questionUid: FieldRef<"NumericQuestion", 'String'>
    readonly correctAnswer: FieldRef<"NumericQuestion", 'Float'>
    readonly tolerance: FieldRef<"NumericQuestion", 'Float'>
    readonly unit: FieldRef<"NumericQuestion", 'String'>
  }
    

  // Custom InputTypes
  /**
   * NumericQuestion findUnique
   */
  export type NumericQuestionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
    /**
     * Filter, which NumericQuestion to fetch.
     */
    where: NumericQuestionWhereUniqueInput
  }

  /**
   * NumericQuestion findUniqueOrThrow
   */
  export type NumericQuestionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
    /**
     * Filter, which NumericQuestion to fetch.
     */
    where: NumericQuestionWhereUniqueInput
  }

  /**
   * NumericQuestion findFirst
   */
  export type NumericQuestionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
    /**
     * Filter, which NumericQuestion to fetch.
     */
    where?: NumericQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NumericQuestions to fetch.
     */
    orderBy?: NumericQuestionOrderByWithRelationInput | NumericQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NumericQuestions.
     */
    cursor?: NumericQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NumericQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NumericQuestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NumericQuestions.
     */
    distinct?: NumericQuestionScalarFieldEnum | NumericQuestionScalarFieldEnum[]
  }

  /**
   * NumericQuestion findFirstOrThrow
   */
  export type NumericQuestionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
    /**
     * Filter, which NumericQuestion to fetch.
     */
    where?: NumericQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NumericQuestions to fetch.
     */
    orderBy?: NumericQuestionOrderByWithRelationInput | NumericQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NumericQuestions.
     */
    cursor?: NumericQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NumericQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NumericQuestions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NumericQuestions.
     */
    distinct?: NumericQuestionScalarFieldEnum | NumericQuestionScalarFieldEnum[]
  }

  /**
   * NumericQuestion findMany
   */
  export type NumericQuestionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
    /**
     * Filter, which NumericQuestions to fetch.
     */
    where?: NumericQuestionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NumericQuestions to fetch.
     */
    orderBy?: NumericQuestionOrderByWithRelationInput | NumericQuestionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing NumericQuestions.
     */
    cursor?: NumericQuestionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NumericQuestions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NumericQuestions.
     */
    skip?: number
    distinct?: NumericQuestionScalarFieldEnum | NumericQuestionScalarFieldEnum[]
  }

  /**
   * NumericQuestion create
   */
  export type NumericQuestionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
    /**
     * The data needed to create a NumericQuestion.
     */
    data: XOR<NumericQuestionCreateInput, NumericQuestionUncheckedCreateInput>
  }

  /**
   * NumericQuestion createMany
   */
  export type NumericQuestionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many NumericQuestions.
     */
    data: NumericQuestionCreateManyInput | NumericQuestionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * NumericQuestion createManyAndReturn
   */
  export type NumericQuestionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * The data used to create many NumericQuestions.
     */
    data: NumericQuestionCreateManyInput | NumericQuestionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * NumericQuestion update
   */
  export type NumericQuestionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
    /**
     * The data needed to update a NumericQuestion.
     */
    data: XOR<NumericQuestionUpdateInput, NumericQuestionUncheckedUpdateInput>
    /**
     * Choose, which NumericQuestion to update.
     */
    where: NumericQuestionWhereUniqueInput
  }

  /**
   * NumericQuestion updateMany
   */
  export type NumericQuestionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update NumericQuestions.
     */
    data: XOR<NumericQuestionUpdateManyMutationInput, NumericQuestionUncheckedUpdateManyInput>
    /**
     * Filter which NumericQuestions to update
     */
    where?: NumericQuestionWhereInput
    /**
     * Limit how many NumericQuestions to update.
     */
    limit?: number
  }

  /**
   * NumericQuestion updateManyAndReturn
   */
  export type NumericQuestionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * The data used to update NumericQuestions.
     */
    data: XOR<NumericQuestionUpdateManyMutationInput, NumericQuestionUncheckedUpdateManyInput>
    /**
     * Filter which NumericQuestions to update
     */
    where?: NumericQuestionWhereInput
    /**
     * Limit how many NumericQuestions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * NumericQuestion upsert
   */
  export type NumericQuestionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
    /**
     * The filter to search for the NumericQuestion to update in case it exists.
     */
    where: NumericQuestionWhereUniqueInput
    /**
     * In case the NumericQuestion found by the `where` argument doesn't exist, create a new NumericQuestion with this data.
     */
    create: XOR<NumericQuestionCreateInput, NumericQuestionUncheckedCreateInput>
    /**
     * In case the NumericQuestion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NumericQuestionUpdateInput, NumericQuestionUncheckedUpdateInput>
  }

  /**
   * NumericQuestion delete
   */
  export type NumericQuestionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
    /**
     * Filter which NumericQuestion to delete.
     */
    where: NumericQuestionWhereUniqueInput
  }

  /**
   * NumericQuestion deleteMany
   */
  export type NumericQuestionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NumericQuestions to delete
     */
    where?: NumericQuestionWhereInput
    /**
     * Limit how many NumericQuestions to delete.
     */
    limit?: number
  }

  /**
   * NumericQuestion without action
   */
  export type NumericQuestionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NumericQuestion
     */
    select?: NumericQuestionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NumericQuestion
     */
    omit?: NumericQuestionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NumericQuestionInclude<ExtArgs> | null
  }


  /**
   * Model GameTemplate
   */

  export type AggregateGameTemplate = {
    _count: GameTemplateCountAggregateOutputType | null
    _min: GameTemplateMinAggregateOutputType | null
    _max: GameTemplateMaxAggregateOutputType | null
  }

  export type GameTemplateMinAggregateOutputType = {
    id: string | null
    name: string | null
    gradeLevel: string | null
    discipline: string | null
    description: string | null
    defaultMode: $Enums.PlayMode | null
    createdAt: Date | null
    updatedAt: Date | null
    creatorId: string | null
  }

  export type GameTemplateMaxAggregateOutputType = {
    id: string | null
    name: string | null
    gradeLevel: string | null
    discipline: string | null
    description: string | null
    defaultMode: $Enums.PlayMode | null
    createdAt: Date | null
    updatedAt: Date | null
    creatorId: string | null
  }

  export type GameTemplateCountAggregateOutputType = {
    id: number
    name: number
    gradeLevel: number
    themes: number
    discipline: number
    description: number
    defaultMode: number
    createdAt: number
    updatedAt: number
    creatorId: number
    _all: number
  }


  export type GameTemplateMinAggregateInputType = {
    id?: true
    name?: true
    gradeLevel?: true
    discipline?: true
    description?: true
    defaultMode?: true
    createdAt?: true
    updatedAt?: true
    creatorId?: true
  }

  export type GameTemplateMaxAggregateInputType = {
    id?: true
    name?: true
    gradeLevel?: true
    discipline?: true
    description?: true
    defaultMode?: true
    createdAt?: true
    updatedAt?: true
    creatorId?: true
  }

  export type GameTemplateCountAggregateInputType = {
    id?: true
    name?: true
    gradeLevel?: true
    themes?: true
    discipline?: true
    description?: true
    defaultMode?: true
    createdAt?: true
    updatedAt?: true
    creatorId?: true
    _all?: true
  }

  export type GameTemplateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GameTemplate to aggregate.
     */
    where?: GameTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameTemplates to fetch.
     */
    orderBy?: GameTemplateOrderByWithRelationInput | GameTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GameTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GameTemplates
    **/
    _count?: true | GameTemplateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GameTemplateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GameTemplateMaxAggregateInputType
  }

  export type GetGameTemplateAggregateType<T extends GameTemplateAggregateArgs> = {
        [P in keyof T & keyof AggregateGameTemplate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGameTemplate[P]>
      : GetScalarType<T[P], AggregateGameTemplate[P]>
  }




  export type GameTemplateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameTemplateWhereInput
    orderBy?: GameTemplateOrderByWithAggregationInput | GameTemplateOrderByWithAggregationInput[]
    by: GameTemplateScalarFieldEnum[] | GameTemplateScalarFieldEnum
    having?: GameTemplateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GameTemplateCountAggregateInputType | true
    _min?: GameTemplateMinAggregateInputType
    _max?: GameTemplateMaxAggregateInputType
  }

  export type GameTemplateGroupByOutputType = {
    id: string
    name: string
    gradeLevel: string | null
    themes: string[]
    discipline: string | null
    description: string | null
    defaultMode: $Enums.PlayMode | null
    createdAt: Date
    updatedAt: Date
    creatorId: string
    _count: GameTemplateCountAggregateOutputType | null
    _min: GameTemplateMinAggregateOutputType | null
    _max: GameTemplateMaxAggregateOutputType | null
  }

  type GetGameTemplateGroupByPayload<T extends GameTemplateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GameTemplateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GameTemplateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GameTemplateGroupByOutputType[P]>
            : GetScalarType<T[P], GameTemplateGroupByOutputType[P]>
        }
      >
    >


  export type GameTemplateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    gradeLevel?: boolean
    themes?: boolean
    discipline?: boolean
    description?: boolean
    defaultMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creatorId?: boolean
    gameInstances?: boolean | GameTemplate$gameInstancesArgs<ExtArgs>
    creator?: boolean | UserDefaultArgs<ExtArgs>
    questions?: boolean | GameTemplate$questionsArgs<ExtArgs>
    _count?: boolean | GameTemplateCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameTemplate"]>

  export type GameTemplateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    gradeLevel?: boolean
    themes?: boolean
    discipline?: boolean
    description?: boolean
    defaultMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creatorId?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameTemplate"]>

  export type GameTemplateSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    gradeLevel?: boolean
    themes?: boolean
    discipline?: boolean
    description?: boolean
    defaultMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creatorId?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameTemplate"]>

  export type GameTemplateSelectScalar = {
    id?: boolean
    name?: boolean
    gradeLevel?: boolean
    themes?: boolean
    discipline?: boolean
    description?: boolean
    defaultMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creatorId?: boolean
  }

  export type GameTemplateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "gradeLevel" | "themes" | "discipline" | "description" | "defaultMode" | "createdAt" | "updatedAt" | "creatorId", ExtArgs["result"]["gameTemplate"]>
  export type GameTemplateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameInstances?: boolean | GameTemplate$gameInstancesArgs<ExtArgs>
    creator?: boolean | UserDefaultArgs<ExtArgs>
    questions?: boolean | GameTemplate$questionsArgs<ExtArgs>
    _count?: boolean | GameTemplateCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GameTemplateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type GameTemplateIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $GameTemplatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GameTemplate"
    objects: {
      gameInstances: Prisma.$GameInstancePayload<ExtArgs>[]
      creator: Prisma.$UserPayload<ExtArgs>
      questions: Prisma.$QuestionsInGameTemplatePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      gradeLevel: string | null
      themes: string[]
      discipline: string | null
      description: string | null
      defaultMode: $Enums.PlayMode | null
      createdAt: Date
      updatedAt: Date
      creatorId: string
    }, ExtArgs["result"]["gameTemplate"]>
    composites: {}
  }

  type GameTemplateGetPayload<S extends boolean | null | undefined | GameTemplateDefaultArgs> = $Result.GetResult<Prisma.$GameTemplatePayload, S>

  type GameTemplateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GameTemplateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GameTemplateCountAggregateInputType | true
    }

  export interface GameTemplateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GameTemplate'], meta: { name: 'GameTemplate' } }
    /**
     * Find zero or one GameTemplate that matches the filter.
     * @param {GameTemplateFindUniqueArgs} args - Arguments to find a GameTemplate
     * @example
     * // Get one GameTemplate
     * const gameTemplate = await prisma.gameTemplate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GameTemplateFindUniqueArgs>(args: SelectSubset<T, GameTemplateFindUniqueArgs<ExtArgs>>): Prisma__GameTemplateClient<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GameTemplate that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GameTemplateFindUniqueOrThrowArgs} args - Arguments to find a GameTemplate
     * @example
     * // Get one GameTemplate
     * const gameTemplate = await prisma.gameTemplate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GameTemplateFindUniqueOrThrowArgs>(args: SelectSubset<T, GameTemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GameTemplateClient<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GameTemplate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameTemplateFindFirstArgs} args - Arguments to find a GameTemplate
     * @example
     * // Get one GameTemplate
     * const gameTemplate = await prisma.gameTemplate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GameTemplateFindFirstArgs>(args?: SelectSubset<T, GameTemplateFindFirstArgs<ExtArgs>>): Prisma__GameTemplateClient<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GameTemplate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameTemplateFindFirstOrThrowArgs} args - Arguments to find a GameTemplate
     * @example
     * // Get one GameTemplate
     * const gameTemplate = await prisma.gameTemplate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GameTemplateFindFirstOrThrowArgs>(args?: SelectSubset<T, GameTemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma__GameTemplateClient<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GameTemplates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameTemplateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GameTemplates
     * const gameTemplates = await prisma.gameTemplate.findMany()
     * 
     * // Get first 10 GameTemplates
     * const gameTemplates = await prisma.gameTemplate.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const gameTemplateWithIdOnly = await prisma.gameTemplate.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GameTemplateFindManyArgs>(args?: SelectSubset<T, GameTemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GameTemplate.
     * @param {GameTemplateCreateArgs} args - Arguments to create a GameTemplate.
     * @example
     * // Create one GameTemplate
     * const GameTemplate = await prisma.gameTemplate.create({
     *   data: {
     *     // ... data to create a GameTemplate
     *   }
     * })
     * 
     */
    create<T extends GameTemplateCreateArgs>(args: SelectSubset<T, GameTemplateCreateArgs<ExtArgs>>): Prisma__GameTemplateClient<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GameTemplates.
     * @param {GameTemplateCreateManyArgs} args - Arguments to create many GameTemplates.
     * @example
     * // Create many GameTemplates
     * const gameTemplate = await prisma.gameTemplate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GameTemplateCreateManyArgs>(args?: SelectSubset<T, GameTemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GameTemplates and returns the data saved in the database.
     * @param {GameTemplateCreateManyAndReturnArgs} args - Arguments to create many GameTemplates.
     * @example
     * // Create many GameTemplates
     * const gameTemplate = await prisma.gameTemplate.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GameTemplates and only return the `id`
     * const gameTemplateWithIdOnly = await prisma.gameTemplate.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GameTemplateCreateManyAndReturnArgs>(args?: SelectSubset<T, GameTemplateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GameTemplate.
     * @param {GameTemplateDeleteArgs} args - Arguments to delete one GameTemplate.
     * @example
     * // Delete one GameTemplate
     * const GameTemplate = await prisma.gameTemplate.delete({
     *   where: {
     *     // ... filter to delete one GameTemplate
     *   }
     * })
     * 
     */
    delete<T extends GameTemplateDeleteArgs>(args: SelectSubset<T, GameTemplateDeleteArgs<ExtArgs>>): Prisma__GameTemplateClient<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GameTemplate.
     * @param {GameTemplateUpdateArgs} args - Arguments to update one GameTemplate.
     * @example
     * // Update one GameTemplate
     * const gameTemplate = await prisma.gameTemplate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GameTemplateUpdateArgs>(args: SelectSubset<T, GameTemplateUpdateArgs<ExtArgs>>): Prisma__GameTemplateClient<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GameTemplates.
     * @param {GameTemplateDeleteManyArgs} args - Arguments to filter GameTemplates to delete.
     * @example
     * // Delete a few GameTemplates
     * const { count } = await prisma.gameTemplate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GameTemplateDeleteManyArgs>(args?: SelectSubset<T, GameTemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GameTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameTemplateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GameTemplates
     * const gameTemplate = await prisma.gameTemplate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GameTemplateUpdateManyArgs>(args: SelectSubset<T, GameTemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GameTemplates and returns the data updated in the database.
     * @param {GameTemplateUpdateManyAndReturnArgs} args - Arguments to update many GameTemplates.
     * @example
     * // Update many GameTemplates
     * const gameTemplate = await prisma.gameTemplate.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GameTemplates and only return the `id`
     * const gameTemplateWithIdOnly = await prisma.gameTemplate.updateManyAndReturn({
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
    updateManyAndReturn<T extends GameTemplateUpdateManyAndReturnArgs>(args: SelectSubset<T, GameTemplateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GameTemplate.
     * @param {GameTemplateUpsertArgs} args - Arguments to update or create a GameTemplate.
     * @example
     * // Update or create a GameTemplate
     * const gameTemplate = await prisma.gameTemplate.upsert({
     *   create: {
     *     // ... data to create a GameTemplate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GameTemplate we want to update
     *   }
     * })
     */
    upsert<T extends GameTemplateUpsertArgs>(args: SelectSubset<T, GameTemplateUpsertArgs<ExtArgs>>): Prisma__GameTemplateClient<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GameTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameTemplateCountArgs} args - Arguments to filter GameTemplates to count.
     * @example
     * // Count the number of GameTemplates
     * const count = await prisma.gameTemplate.count({
     *   where: {
     *     // ... the filter for the GameTemplates we want to count
     *   }
     * })
    **/
    count<T extends GameTemplateCountArgs>(
      args?: Subset<T, GameTemplateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GameTemplateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GameTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameTemplateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends GameTemplateAggregateArgs>(args: Subset<T, GameTemplateAggregateArgs>): Prisma.PrismaPromise<GetGameTemplateAggregateType<T>>

    /**
     * Group by GameTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameTemplateGroupByArgs} args - Group by arguments.
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
      T extends GameTemplateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GameTemplateGroupByArgs['orderBy'] }
        : { orderBy?: GameTemplateGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, GameTemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGameTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GameTemplate model
   */
  readonly fields: GameTemplateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GameTemplate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GameTemplateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    gameInstances<T extends GameTemplate$gameInstancesArgs<ExtArgs> = {}>(args?: Subset<T, GameTemplate$gameInstancesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameInstancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    creator<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    questions<T extends GameTemplate$questionsArgs<ExtArgs> = {}>(args?: Subset<T, GameTemplate$questionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the GameTemplate model
   */
  interface GameTemplateFieldRefs {
    readonly id: FieldRef<"GameTemplate", 'String'>
    readonly name: FieldRef<"GameTemplate", 'String'>
    readonly gradeLevel: FieldRef<"GameTemplate", 'String'>
    readonly themes: FieldRef<"GameTemplate", 'String[]'>
    readonly discipline: FieldRef<"GameTemplate", 'String'>
    readonly description: FieldRef<"GameTemplate", 'String'>
    readonly defaultMode: FieldRef<"GameTemplate", 'PlayMode'>
    readonly createdAt: FieldRef<"GameTemplate", 'DateTime'>
    readonly updatedAt: FieldRef<"GameTemplate", 'DateTime'>
    readonly creatorId: FieldRef<"GameTemplate", 'String'>
  }
    

  // Custom InputTypes
  /**
   * GameTemplate findUnique
   */
  export type GameTemplateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
    /**
     * Filter, which GameTemplate to fetch.
     */
    where: GameTemplateWhereUniqueInput
  }

  /**
   * GameTemplate findUniqueOrThrow
   */
  export type GameTemplateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
    /**
     * Filter, which GameTemplate to fetch.
     */
    where: GameTemplateWhereUniqueInput
  }

  /**
   * GameTemplate findFirst
   */
  export type GameTemplateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
    /**
     * Filter, which GameTemplate to fetch.
     */
    where?: GameTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameTemplates to fetch.
     */
    orderBy?: GameTemplateOrderByWithRelationInput | GameTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GameTemplates.
     */
    cursor?: GameTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameTemplates.
     */
    distinct?: GameTemplateScalarFieldEnum | GameTemplateScalarFieldEnum[]
  }

  /**
   * GameTemplate findFirstOrThrow
   */
  export type GameTemplateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
    /**
     * Filter, which GameTemplate to fetch.
     */
    where?: GameTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameTemplates to fetch.
     */
    orderBy?: GameTemplateOrderByWithRelationInput | GameTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GameTemplates.
     */
    cursor?: GameTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameTemplates.
     */
    distinct?: GameTemplateScalarFieldEnum | GameTemplateScalarFieldEnum[]
  }

  /**
   * GameTemplate findMany
   */
  export type GameTemplateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
    /**
     * Filter, which GameTemplates to fetch.
     */
    where?: GameTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameTemplates to fetch.
     */
    orderBy?: GameTemplateOrderByWithRelationInput | GameTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GameTemplates.
     */
    cursor?: GameTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameTemplates.
     */
    skip?: number
    distinct?: GameTemplateScalarFieldEnum | GameTemplateScalarFieldEnum[]
  }

  /**
   * GameTemplate create
   */
  export type GameTemplateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
    /**
     * The data needed to create a GameTemplate.
     */
    data: XOR<GameTemplateCreateInput, GameTemplateUncheckedCreateInput>
  }

  /**
   * GameTemplate createMany
   */
  export type GameTemplateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GameTemplates.
     */
    data: GameTemplateCreateManyInput | GameTemplateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * GameTemplate createManyAndReturn
   */
  export type GameTemplateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * The data used to create many GameTemplates.
     */
    data: GameTemplateCreateManyInput | GameTemplateCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * GameTemplate update
   */
  export type GameTemplateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
    /**
     * The data needed to update a GameTemplate.
     */
    data: XOR<GameTemplateUpdateInput, GameTemplateUncheckedUpdateInput>
    /**
     * Choose, which GameTemplate to update.
     */
    where: GameTemplateWhereUniqueInput
  }

  /**
   * GameTemplate updateMany
   */
  export type GameTemplateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GameTemplates.
     */
    data: XOR<GameTemplateUpdateManyMutationInput, GameTemplateUncheckedUpdateManyInput>
    /**
     * Filter which GameTemplates to update
     */
    where?: GameTemplateWhereInput
    /**
     * Limit how many GameTemplates to update.
     */
    limit?: number
  }

  /**
   * GameTemplate updateManyAndReturn
   */
  export type GameTemplateUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * The data used to update GameTemplates.
     */
    data: XOR<GameTemplateUpdateManyMutationInput, GameTemplateUncheckedUpdateManyInput>
    /**
     * Filter which GameTemplates to update
     */
    where?: GameTemplateWhereInput
    /**
     * Limit how many GameTemplates to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * GameTemplate upsert
   */
  export type GameTemplateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
    /**
     * The filter to search for the GameTemplate to update in case it exists.
     */
    where: GameTemplateWhereUniqueInput
    /**
     * In case the GameTemplate found by the `where` argument doesn't exist, create a new GameTemplate with this data.
     */
    create: XOR<GameTemplateCreateInput, GameTemplateUncheckedCreateInput>
    /**
     * In case the GameTemplate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GameTemplateUpdateInput, GameTemplateUncheckedUpdateInput>
  }

  /**
   * GameTemplate delete
   */
  export type GameTemplateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
    /**
     * Filter which GameTemplate to delete.
     */
    where: GameTemplateWhereUniqueInput
  }

  /**
   * GameTemplate deleteMany
   */
  export type GameTemplateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GameTemplates to delete
     */
    where?: GameTemplateWhereInput
    /**
     * Limit how many GameTemplates to delete.
     */
    limit?: number
  }

  /**
   * GameTemplate.gameInstances
   */
  export type GameTemplate$gameInstancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
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
   * GameTemplate.questions
   */
  export type GameTemplate$questionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    where?: QuestionsInGameTemplateWhereInput
    orderBy?: QuestionsInGameTemplateOrderByWithRelationInput | QuestionsInGameTemplateOrderByWithRelationInput[]
    cursor?: QuestionsInGameTemplateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuestionsInGameTemplateScalarFieldEnum | QuestionsInGameTemplateScalarFieldEnum[]
  }

  /**
   * GameTemplate without action
   */
  export type GameTemplateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameTemplate
     */
    select?: GameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameTemplate
     */
    omit?: GameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameTemplateInclude<ExtArgs> | null
  }


  /**
   * Model QuestionsInGameTemplate
   */

  export type AggregateQuestionsInGameTemplate = {
    _count: QuestionsInGameTemplateCountAggregateOutputType | null
    _avg: QuestionsInGameTemplateAvgAggregateOutputType | null
    _sum: QuestionsInGameTemplateSumAggregateOutputType | null
    _min: QuestionsInGameTemplateMinAggregateOutputType | null
    _max: QuestionsInGameTemplateMaxAggregateOutputType | null
  }

  export type QuestionsInGameTemplateAvgAggregateOutputType = {
    sequence: number | null
  }

  export type QuestionsInGameTemplateSumAggregateOutputType = {
    sequence: number | null
  }

  export type QuestionsInGameTemplateMinAggregateOutputType = {
    gameTemplateId: string | null
    questionUid: string | null
    sequence: number | null
    createdAt: Date | null
  }

  export type QuestionsInGameTemplateMaxAggregateOutputType = {
    gameTemplateId: string | null
    questionUid: string | null
    sequence: number | null
    createdAt: Date | null
  }

  export type QuestionsInGameTemplateCountAggregateOutputType = {
    gameTemplateId: number
    questionUid: number
    sequence: number
    createdAt: number
    _all: number
  }


  export type QuestionsInGameTemplateAvgAggregateInputType = {
    sequence?: true
  }

  export type QuestionsInGameTemplateSumAggregateInputType = {
    sequence?: true
  }

  export type QuestionsInGameTemplateMinAggregateInputType = {
    gameTemplateId?: true
    questionUid?: true
    sequence?: true
    createdAt?: true
  }

  export type QuestionsInGameTemplateMaxAggregateInputType = {
    gameTemplateId?: true
    questionUid?: true
    sequence?: true
    createdAt?: true
  }

  export type QuestionsInGameTemplateCountAggregateInputType = {
    gameTemplateId?: true
    questionUid?: true
    sequence?: true
    createdAt?: true
    _all?: true
  }

  export type QuestionsInGameTemplateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuestionsInGameTemplate to aggregate.
     */
    where?: QuestionsInGameTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionsInGameTemplates to fetch.
     */
    orderBy?: QuestionsInGameTemplateOrderByWithRelationInput | QuestionsInGameTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuestionsInGameTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionsInGameTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionsInGameTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuestionsInGameTemplates
    **/
    _count?: true | QuestionsInGameTemplateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuestionsInGameTemplateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuestionsInGameTemplateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuestionsInGameTemplateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuestionsInGameTemplateMaxAggregateInputType
  }

  export type GetQuestionsInGameTemplateAggregateType<T extends QuestionsInGameTemplateAggregateArgs> = {
        [P in keyof T & keyof AggregateQuestionsInGameTemplate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuestionsInGameTemplate[P]>
      : GetScalarType<T[P], AggregateQuestionsInGameTemplate[P]>
  }




  export type QuestionsInGameTemplateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionsInGameTemplateWhereInput
    orderBy?: QuestionsInGameTemplateOrderByWithAggregationInput | QuestionsInGameTemplateOrderByWithAggregationInput[]
    by: QuestionsInGameTemplateScalarFieldEnum[] | QuestionsInGameTemplateScalarFieldEnum
    having?: QuestionsInGameTemplateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuestionsInGameTemplateCountAggregateInputType | true
    _avg?: QuestionsInGameTemplateAvgAggregateInputType
    _sum?: QuestionsInGameTemplateSumAggregateInputType
    _min?: QuestionsInGameTemplateMinAggregateInputType
    _max?: QuestionsInGameTemplateMaxAggregateInputType
  }

  export type QuestionsInGameTemplateGroupByOutputType = {
    gameTemplateId: string
    questionUid: string
    sequence: number
    createdAt: Date
    _count: QuestionsInGameTemplateCountAggregateOutputType | null
    _avg: QuestionsInGameTemplateAvgAggregateOutputType | null
    _sum: QuestionsInGameTemplateSumAggregateOutputType | null
    _min: QuestionsInGameTemplateMinAggregateOutputType | null
    _max: QuestionsInGameTemplateMaxAggregateOutputType | null
  }

  type GetQuestionsInGameTemplateGroupByPayload<T extends QuestionsInGameTemplateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuestionsInGameTemplateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuestionsInGameTemplateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuestionsInGameTemplateGroupByOutputType[P]>
            : GetScalarType<T[P], QuestionsInGameTemplateGroupByOutputType[P]>
        }
      >
    >


  export type QuestionsInGameTemplateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    gameTemplateId?: boolean
    questionUid?: boolean
    sequence?: boolean
    createdAt?: boolean
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["questionsInGameTemplate"]>

  export type QuestionsInGameTemplateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    gameTemplateId?: boolean
    questionUid?: boolean
    sequence?: boolean
    createdAt?: boolean
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["questionsInGameTemplate"]>

  export type QuestionsInGameTemplateSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    gameTemplateId?: boolean
    questionUid?: boolean
    sequence?: boolean
    createdAt?: boolean
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["questionsInGameTemplate"]>

  export type QuestionsInGameTemplateSelectScalar = {
    gameTemplateId?: boolean
    questionUid?: boolean
    sequence?: boolean
    createdAt?: boolean
  }

  export type QuestionsInGameTemplateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"gameTemplateId" | "questionUid" | "sequence" | "createdAt", ExtArgs["result"]["questionsInGameTemplate"]>
  export type QuestionsInGameTemplateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }
  export type QuestionsInGameTemplateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }
  export type QuestionsInGameTemplateIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    question?: boolean | QuestionDefaultArgs<ExtArgs>
  }

  export type $QuestionsInGameTemplatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuestionsInGameTemplate"
    objects: {
      gameTemplate: Prisma.$GameTemplatePayload<ExtArgs>
      question: Prisma.$QuestionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      gameTemplateId: string
      questionUid: string
      sequence: number
      createdAt: Date
    }, ExtArgs["result"]["questionsInGameTemplate"]>
    composites: {}
  }

  type QuestionsInGameTemplateGetPayload<S extends boolean | null | undefined | QuestionsInGameTemplateDefaultArgs> = $Result.GetResult<Prisma.$QuestionsInGameTemplatePayload, S>

  type QuestionsInGameTemplateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QuestionsInGameTemplateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QuestionsInGameTemplateCountAggregateInputType | true
    }

  export interface QuestionsInGameTemplateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuestionsInGameTemplate'], meta: { name: 'QuestionsInGameTemplate' } }
    /**
     * Find zero or one QuestionsInGameTemplate that matches the filter.
     * @param {QuestionsInGameTemplateFindUniqueArgs} args - Arguments to find a QuestionsInGameTemplate
     * @example
     * // Get one QuestionsInGameTemplate
     * const questionsInGameTemplate = await prisma.questionsInGameTemplate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuestionsInGameTemplateFindUniqueArgs>(args: SelectSubset<T, QuestionsInGameTemplateFindUniqueArgs<ExtArgs>>): Prisma__QuestionsInGameTemplateClient<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one QuestionsInGameTemplate that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QuestionsInGameTemplateFindUniqueOrThrowArgs} args - Arguments to find a QuestionsInGameTemplate
     * @example
     * // Get one QuestionsInGameTemplate
     * const questionsInGameTemplate = await prisma.questionsInGameTemplate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuestionsInGameTemplateFindUniqueOrThrowArgs>(args: SelectSubset<T, QuestionsInGameTemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuestionsInGameTemplateClient<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuestionsInGameTemplate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInGameTemplateFindFirstArgs} args - Arguments to find a QuestionsInGameTemplate
     * @example
     * // Get one QuestionsInGameTemplate
     * const questionsInGameTemplate = await prisma.questionsInGameTemplate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuestionsInGameTemplateFindFirstArgs>(args?: SelectSubset<T, QuestionsInGameTemplateFindFirstArgs<ExtArgs>>): Prisma__QuestionsInGameTemplateClient<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuestionsInGameTemplate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInGameTemplateFindFirstOrThrowArgs} args - Arguments to find a QuestionsInGameTemplate
     * @example
     * // Get one QuestionsInGameTemplate
     * const questionsInGameTemplate = await prisma.questionsInGameTemplate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuestionsInGameTemplateFindFirstOrThrowArgs>(args?: SelectSubset<T, QuestionsInGameTemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuestionsInGameTemplateClient<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more QuestionsInGameTemplates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInGameTemplateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuestionsInGameTemplates
     * const questionsInGameTemplates = await prisma.questionsInGameTemplate.findMany()
     * 
     * // Get first 10 QuestionsInGameTemplates
     * const questionsInGameTemplates = await prisma.questionsInGameTemplate.findMany({ take: 10 })
     * 
     * // Only select the `gameTemplateId`
     * const questionsInGameTemplateWithGameTemplateIdOnly = await prisma.questionsInGameTemplate.findMany({ select: { gameTemplateId: true } })
     * 
     */
    findMany<T extends QuestionsInGameTemplateFindManyArgs>(args?: SelectSubset<T, QuestionsInGameTemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a QuestionsInGameTemplate.
     * @param {QuestionsInGameTemplateCreateArgs} args - Arguments to create a QuestionsInGameTemplate.
     * @example
     * // Create one QuestionsInGameTemplate
     * const QuestionsInGameTemplate = await prisma.questionsInGameTemplate.create({
     *   data: {
     *     // ... data to create a QuestionsInGameTemplate
     *   }
     * })
     * 
     */
    create<T extends QuestionsInGameTemplateCreateArgs>(args: SelectSubset<T, QuestionsInGameTemplateCreateArgs<ExtArgs>>): Prisma__QuestionsInGameTemplateClient<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many QuestionsInGameTemplates.
     * @param {QuestionsInGameTemplateCreateManyArgs} args - Arguments to create many QuestionsInGameTemplates.
     * @example
     * // Create many QuestionsInGameTemplates
     * const questionsInGameTemplate = await prisma.questionsInGameTemplate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuestionsInGameTemplateCreateManyArgs>(args?: SelectSubset<T, QuestionsInGameTemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuestionsInGameTemplates and returns the data saved in the database.
     * @param {QuestionsInGameTemplateCreateManyAndReturnArgs} args - Arguments to create many QuestionsInGameTemplates.
     * @example
     * // Create many QuestionsInGameTemplates
     * const questionsInGameTemplate = await prisma.questionsInGameTemplate.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuestionsInGameTemplates and only return the `gameTemplateId`
     * const questionsInGameTemplateWithGameTemplateIdOnly = await prisma.questionsInGameTemplate.createManyAndReturn({
     *   select: { gameTemplateId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuestionsInGameTemplateCreateManyAndReturnArgs>(args?: SelectSubset<T, QuestionsInGameTemplateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a QuestionsInGameTemplate.
     * @param {QuestionsInGameTemplateDeleteArgs} args - Arguments to delete one QuestionsInGameTemplate.
     * @example
     * // Delete one QuestionsInGameTemplate
     * const QuestionsInGameTemplate = await prisma.questionsInGameTemplate.delete({
     *   where: {
     *     // ... filter to delete one QuestionsInGameTemplate
     *   }
     * })
     * 
     */
    delete<T extends QuestionsInGameTemplateDeleteArgs>(args: SelectSubset<T, QuestionsInGameTemplateDeleteArgs<ExtArgs>>): Prisma__QuestionsInGameTemplateClient<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one QuestionsInGameTemplate.
     * @param {QuestionsInGameTemplateUpdateArgs} args - Arguments to update one QuestionsInGameTemplate.
     * @example
     * // Update one QuestionsInGameTemplate
     * const questionsInGameTemplate = await prisma.questionsInGameTemplate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuestionsInGameTemplateUpdateArgs>(args: SelectSubset<T, QuestionsInGameTemplateUpdateArgs<ExtArgs>>): Prisma__QuestionsInGameTemplateClient<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more QuestionsInGameTemplates.
     * @param {QuestionsInGameTemplateDeleteManyArgs} args - Arguments to filter QuestionsInGameTemplates to delete.
     * @example
     * // Delete a few QuestionsInGameTemplates
     * const { count } = await prisma.questionsInGameTemplate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuestionsInGameTemplateDeleteManyArgs>(args?: SelectSubset<T, QuestionsInGameTemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuestionsInGameTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInGameTemplateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuestionsInGameTemplates
     * const questionsInGameTemplate = await prisma.questionsInGameTemplate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuestionsInGameTemplateUpdateManyArgs>(args: SelectSubset<T, QuestionsInGameTemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuestionsInGameTemplates and returns the data updated in the database.
     * @param {QuestionsInGameTemplateUpdateManyAndReturnArgs} args - Arguments to update many QuestionsInGameTemplates.
     * @example
     * // Update many QuestionsInGameTemplates
     * const questionsInGameTemplate = await prisma.questionsInGameTemplate.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more QuestionsInGameTemplates and only return the `gameTemplateId`
     * const questionsInGameTemplateWithGameTemplateIdOnly = await prisma.questionsInGameTemplate.updateManyAndReturn({
     *   select: { gameTemplateId: true },
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
    updateManyAndReturn<T extends QuestionsInGameTemplateUpdateManyAndReturnArgs>(args: SelectSubset<T, QuestionsInGameTemplateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one QuestionsInGameTemplate.
     * @param {QuestionsInGameTemplateUpsertArgs} args - Arguments to update or create a QuestionsInGameTemplate.
     * @example
     * // Update or create a QuestionsInGameTemplate
     * const questionsInGameTemplate = await prisma.questionsInGameTemplate.upsert({
     *   create: {
     *     // ... data to create a QuestionsInGameTemplate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuestionsInGameTemplate we want to update
     *   }
     * })
     */
    upsert<T extends QuestionsInGameTemplateUpsertArgs>(args: SelectSubset<T, QuestionsInGameTemplateUpsertArgs<ExtArgs>>): Prisma__QuestionsInGameTemplateClient<$Result.GetResult<Prisma.$QuestionsInGameTemplatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of QuestionsInGameTemplates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInGameTemplateCountArgs} args - Arguments to filter QuestionsInGameTemplates to count.
     * @example
     * // Count the number of QuestionsInGameTemplates
     * const count = await prisma.questionsInGameTemplate.count({
     *   where: {
     *     // ... the filter for the QuestionsInGameTemplates we want to count
     *   }
     * })
    **/
    count<T extends QuestionsInGameTemplateCountArgs>(
      args?: Subset<T, QuestionsInGameTemplateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuestionsInGameTemplateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuestionsInGameTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInGameTemplateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends QuestionsInGameTemplateAggregateArgs>(args: Subset<T, QuestionsInGameTemplateAggregateArgs>): Prisma.PrismaPromise<GetQuestionsInGameTemplateAggregateType<T>>

    /**
     * Group by QuestionsInGameTemplate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionsInGameTemplateGroupByArgs} args - Group by arguments.
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
      T extends QuestionsInGameTemplateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuestionsInGameTemplateGroupByArgs['orderBy'] }
        : { orderBy?: QuestionsInGameTemplateGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, QuestionsInGameTemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuestionsInGameTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuestionsInGameTemplate model
   */
  readonly fields: QuestionsInGameTemplateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuestionsInGameTemplate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuestionsInGameTemplateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    gameTemplate<T extends GameTemplateDefaultArgs<ExtArgs> = {}>(args?: Subset<T, GameTemplateDefaultArgs<ExtArgs>>): Prisma__GameTemplateClient<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the QuestionsInGameTemplate model
   */
  interface QuestionsInGameTemplateFieldRefs {
    readonly gameTemplateId: FieldRef<"QuestionsInGameTemplate", 'String'>
    readonly questionUid: FieldRef<"QuestionsInGameTemplate", 'String'>
    readonly sequence: FieldRef<"QuestionsInGameTemplate", 'Int'>
    readonly createdAt: FieldRef<"QuestionsInGameTemplate", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QuestionsInGameTemplate findUnique
   */
  export type QuestionsInGameTemplateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuestionsInGameTemplate to fetch.
     */
    where: QuestionsInGameTemplateWhereUniqueInput
  }

  /**
   * QuestionsInGameTemplate findUniqueOrThrow
   */
  export type QuestionsInGameTemplateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuestionsInGameTemplate to fetch.
     */
    where: QuestionsInGameTemplateWhereUniqueInput
  }

  /**
   * QuestionsInGameTemplate findFirst
   */
  export type QuestionsInGameTemplateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuestionsInGameTemplate to fetch.
     */
    where?: QuestionsInGameTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionsInGameTemplates to fetch.
     */
    orderBy?: QuestionsInGameTemplateOrderByWithRelationInput | QuestionsInGameTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuestionsInGameTemplates.
     */
    cursor?: QuestionsInGameTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionsInGameTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionsInGameTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuestionsInGameTemplates.
     */
    distinct?: QuestionsInGameTemplateScalarFieldEnum | QuestionsInGameTemplateScalarFieldEnum[]
  }

  /**
   * QuestionsInGameTemplate findFirstOrThrow
   */
  export type QuestionsInGameTemplateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuestionsInGameTemplate to fetch.
     */
    where?: QuestionsInGameTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionsInGameTemplates to fetch.
     */
    orderBy?: QuestionsInGameTemplateOrderByWithRelationInput | QuestionsInGameTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuestionsInGameTemplates.
     */
    cursor?: QuestionsInGameTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionsInGameTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionsInGameTemplates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuestionsInGameTemplates.
     */
    distinct?: QuestionsInGameTemplateScalarFieldEnum | QuestionsInGameTemplateScalarFieldEnum[]
  }

  /**
   * QuestionsInGameTemplate findMany
   */
  export type QuestionsInGameTemplateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    /**
     * Filter, which QuestionsInGameTemplates to fetch.
     */
    where?: QuestionsInGameTemplateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionsInGameTemplates to fetch.
     */
    orderBy?: QuestionsInGameTemplateOrderByWithRelationInput | QuestionsInGameTemplateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuestionsInGameTemplates.
     */
    cursor?: QuestionsInGameTemplateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionsInGameTemplates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionsInGameTemplates.
     */
    skip?: number
    distinct?: QuestionsInGameTemplateScalarFieldEnum | QuestionsInGameTemplateScalarFieldEnum[]
  }

  /**
   * QuestionsInGameTemplate create
   */
  export type QuestionsInGameTemplateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    /**
     * The data needed to create a QuestionsInGameTemplate.
     */
    data: XOR<QuestionsInGameTemplateCreateInput, QuestionsInGameTemplateUncheckedCreateInput>
  }

  /**
   * QuestionsInGameTemplate createMany
   */
  export type QuestionsInGameTemplateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuestionsInGameTemplates.
     */
    data: QuestionsInGameTemplateCreateManyInput | QuestionsInGameTemplateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuestionsInGameTemplate createManyAndReturn
   */
  export type QuestionsInGameTemplateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * The data used to create many QuestionsInGameTemplates.
     */
    data: QuestionsInGameTemplateCreateManyInput | QuestionsInGameTemplateCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuestionsInGameTemplate update
   */
  export type QuestionsInGameTemplateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    /**
     * The data needed to update a QuestionsInGameTemplate.
     */
    data: XOR<QuestionsInGameTemplateUpdateInput, QuestionsInGameTemplateUncheckedUpdateInput>
    /**
     * Choose, which QuestionsInGameTemplate to update.
     */
    where: QuestionsInGameTemplateWhereUniqueInput
  }

  /**
   * QuestionsInGameTemplate updateMany
   */
  export type QuestionsInGameTemplateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuestionsInGameTemplates.
     */
    data: XOR<QuestionsInGameTemplateUpdateManyMutationInput, QuestionsInGameTemplateUncheckedUpdateManyInput>
    /**
     * Filter which QuestionsInGameTemplates to update
     */
    where?: QuestionsInGameTemplateWhereInput
    /**
     * Limit how many QuestionsInGameTemplates to update.
     */
    limit?: number
  }

  /**
   * QuestionsInGameTemplate updateManyAndReturn
   */
  export type QuestionsInGameTemplateUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * The data used to update QuestionsInGameTemplates.
     */
    data: XOR<QuestionsInGameTemplateUpdateManyMutationInput, QuestionsInGameTemplateUncheckedUpdateManyInput>
    /**
     * Filter which QuestionsInGameTemplates to update
     */
    where?: QuestionsInGameTemplateWhereInput
    /**
     * Limit how many QuestionsInGameTemplates to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuestionsInGameTemplate upsert
   */
  export type QuestionsInGameTemplateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    /**
     * The filter to search for the QuestionsInGameTemplate to update in case it exists.
     */
    where: QuestionsInGameTemplateWhereUniqueInput
    /**
     * In case the QuestionsInGameTemplate found by the `where` argument doesn't exist, create a new QuestionsInGameTemplate with this data.
     */
    create: XOR<QuestionsInGameTemplateCreateInput, QuestionsInGameTemplateUncheckedCreateInput>
    /**
     * In case the QuestionsInGameTemplate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuestionsInGameTemplateUpdateInput, QuestionsInGameTemplateUncheckedUpdateInput>
  }

  /**
   * QuestionsInGameTemplate delete
   */
  export type QuestionsInGameTemplateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
    /**
     * Filter which QuestionsInGameTemplate to delete.
     */
    where: QuestionsInGameTemplateWhereUniqueInput
  }

  /**
   * QuestionsInGameTemplate deleteMany
   */
  export type QuestionsInGameTemplateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuestionsInGameTemplates to delete
     */
    where?: QuestionsInGameTemplateWhereInput
    /**
     * Limit how many QuestionsInGameTemplates to delete.
     */
    limit?: number
  }

  /**
   * QuestionsInGameTemplate without action
   */
  export type QuestionsInGameTemplateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionsInGameTemplate
     */
    select?: QuestionsInGameTemplateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionsInGameTemplate
     */
    omit?: QuestionsInGameTemplateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionsInGameTemplateInclude<ExtArgs> | null
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
    accessCode: string | null
    status: string | null
    playMode: $Enums.PlayMode | null
    currentQuestionIndex: number | null
    createdAt: Date | null
    startedAt: Date | null
    endedAt: Date | null
    differedAvailableFrom: Date | null
    differedAvailableTo: Date | null
    gameTemplateId: string | null
    initiatorUserId: string | null
  }

  export type GameInstanceMaxAggregateOutputType = {
    id: string | null
    name: string | null
    accessCode: string | null
    status: string | null
    playMode: $Enums.PlayMode | null
    currentQuestionIndex: number | null
    createdAt: Date | null
    startedAt: Date | null
    endedAt: Date | null
    differedAvailableFrom: Date | null
    differedAvailableTo: Date | null
    gameTemplateId: string | null
    initiatorUserId: string | null
  }

  export type GameInstanceCountAggregateOutputType = {
    id: number
    name: number
    accessCode: number
    status: number
    playMode: number
    leaderboard: number
    currentQuestionIndex: number
    settings: number
    createdAt: number
    startedAt: number
    endedAt: number
    differedAvailableFrom: number
    differedAvailableTo: number
    gameTemplateId: number
    initiatorUserId: number
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
    accessCode?: true
    status?: true
    playMode?: true
    currentQuestionIndex?: true
    createdAt?: true
    startedAt?: true
    endedAt?: true
    differedAvailableFrom?: true
    differedAvailableTo?: true
    gameTemplateId?: true
    initiatorUserId?: true
  }

  export type GameInstanceMaxAggregateInputType = {
    id?: true
    name?: true
    accessCode?: true
    status?: true
    playMode?: true
    currentQuestionIndex?: true
    createdAt?: true
    startedAt?: true
    endedAt?: true
    differedAvailableFrom?: true
    differedAvailableTo?: true
    gameTemplateId?: true
    initiatorUserId?: true
  }

  export type GameInstanceCountAggregateInputType = {
    id?: true
    name?: true
    accessCode?: true
    status?: true
    playMode?: true
    leaderboard?: true
    currentQuestionIndex?: true
    settings?: true
    createdAt?: true
    startedAt?: true
    endedAt?: true
    differedAvailableFrom?: true
    differedAvailableTo?: true
    gameTemplateId?: true
    initiatorUserId?: true
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
    accessCode: string
    status: string
    playMode: $Enums.PlayMode
    leaderboard: JsonValue | null
    currentQuestionIndex: number | null
    settings: JsonValue | null
    createdAt: Date
    startedAt: Date | null
    endedAt: Date | null
    differedAvailableFrom: Date | null
    differedAvailableTo: Date | null
    gameTemplateId: string
    initiatorUserId: string | null
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
    accessCode?: boolean
    status?: boolean
    playMode?: boolean
    leaderboard?: boolean
    currentQuestionIndex?: boolean
    settings?: boolean
    createdAt?: boolean
    startedAt?: boolean
    endedAt?: boolean
    differedAvailableFrom?: boolean
    differedAvailableTo?: boolean
    gameTemplateId?: boolean
    initiatorUserId?: boolean
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    initiatorUser?: boolean | GameInstance$initiatorUserArgs<ExtArgs>
    participants?: boolean | GameInstance$participantsArgs<ExtArgs>
    _count?: boolean | GameInstanceCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameInstance"]>

  export type GameInstanceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    accessCode?: boolean
    status?: boolean
    playMode?: boolean
    leaderboard?: boolean
    currentQuestionIndex?: boolean
    settings?: boolean
    createdAt?: boolean
    startedAt?: boolean
    endedAt?: boolean
    differedAvailableFrom?: boolean
    differedAvailableTo?: boolean
    gameTemplateId?: boolean
    initiatorUserId?: boolean
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    initiatorUser?: boolean | GameInstance$initiatorUserArgs<ExtArgs>
  }, ExtArgs["result"]["gameInstance"]>

  export type GameInstanceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    accessCode?: boolean
    status?: boolean
    playMode?: boolean
    leaderboard?: boolean
    currentQuestionIndex?: boolean
    settings?: boolean
    createdAt?: boolean
    startedAt?: boolean
    endedAt?: boolean
    differedAvailableFrom?: boolean
    differedAvailableTo?: boolean
    gameTemplateId?: boolean
    initiatorUserId?: boolean
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    initiatorUser?: boolean | GameInstance$initiatorUserArgs<ExtArgs>
  }, ExtArgs["result"]["gameInstance"]>

  export type GameInstanceSelectScalar = {
    id?: boolean
    name?: boolean
    accessCode?: boolean
    status?: boolean
    playMode?: boolean
    leaderboard?: boolean
    currentQuestionIndex?: boolean
    settings?: boolean
    createdAt?: boolean
    startedAt?: boolean
    endedAt?: boolean
    differedAvailableFrom?: boolean
    differedAvailableTo?: boolean
    gameTemplateId?: boolean
    initiatorUserId?: boolean
  }

  export type GameInstanceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "accessCode" | "status" | "playMode" | "leaderboard" | "currentQuestionIndex" | "settings" | "createdAt" | "startedAt" | "endedAt" | "differedAvailableFrom" | "differedAvailableTo" | "gameTemplateId" | "initiatorUserId", ExtArgs["result"]["gameInstance"]>
  export type GameInstanceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    initiatorUser?: boolean | GameInstance$initiatorUserArgs<ExtArgs>
    participants?: boolean | GameInstance$participantsArgs<ExtArgs>
    _count?: boolean | GameInstanceCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GameInstanceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    initiatorUser?: boolean | GameInstance$initiatorUserArgs<ExtArgs>
  }
  export type GameInstanceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameTemplate?: boolean | GameTemplateDefaultArgs<ExtArgs>
    initiatorUser?: boolean | GameInstance$initiatorUserArgs<ExtArgs>
  }

  export type $GameInstancePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GameInstance"
    objects: {
      gameTemplate: Prisma.$GameTemplatePayload<ExtArgs>
      initiatorUser: Prisma.$UserPayload<ExtArgs> | null
      participants: Prisma.$GameParticipantPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      accessCode: string
      status: string
      playMode: $Enums.PlayMode
      leaderboard: Prisma.JsonValue | null
      currentQuestionIndex: number | null
      settings: Prisma.JsonValue | null
      createdAt: Date
      startedAt: Date | null
      endedAt: Date | null
      differedAvailableFrom: Date | null
      differedAvailableTo: Date | null
      gameTemplateId: string
      initiatorUserId: string | null
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
    gameTemplate<T extends GameTemplateDefaultArgs<ExtArgs> = {}>(args?: Subset<T, GameTemplateDefaultArgs<ExtArgs>>): Prisma__GameTemplateClient<$Result.GetResult<Prisma.$GameTemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    initiatorUser<T extends GameInstance$initiatorUserArgs<ExtArgs> = {}>(args?: Subset<T, GameInstance$initiatorUserArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
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
    readonly accessCode: FieldRef<"GameInstance", 'String'>
    readonly status: FieldRef<"GameInstance", 'String'>
    readonly playMode: FieldRef<"GameInstance", 'PlayMode'>
    readonly leaderboard: FieldRef<"GameInstance", 'Json'>
    readonly currentQuestionIndex: FieldRef<"GameInstance", 'Int'>
    readonly settings: FieldRef<"GameInstance", 'Json'>
    readonly createdAt: FieldRef<"GameInstance", 'DateTime'>
    readonly startedAt: FieldRef<"GameInstance", 'DateTime'>
    readonly endedAt: FieldRef<"GameInstance", 'DateTime'>
    readonly differedAvailableFrom: FieldRef<"GameInstance", 'DateTime'>
    readonly differedAvailableTo: FieldRef<"GameInstance", 'DateTime'>
    readonly gameTemplateId: FieldRef<"GameInstance", 'String'>
    readonly initiatorUserId: FieldRef<"GameInstance", 'String'>
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
   * GameInstance.initiatorUser
   */
  export type GameInstance$initiatorUserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
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
    liveScore: number | null
    deferredScore: number | null
    nbAttempts: number | null
  }

  export type GameParticipantSumAggregateOutputType = {
    liveScore: number | null
    deferredScore: number | null
    nbAttempts: number | null
  }

  export type GameParticipantMinAggregateOutputType = {
    id: string | null
    gameInstanceId: string | null
    userId: string | null
    liveScore: number | null
    deferredScore: number | null
    nbAttempts: number | null
    status: $Enums.ParticipantStatus | null
    joinedAt: Date | null
    lastActiveAt: Date | null
    completedAt: Date | null
  }

  export type GameParticipantMaxAggregateOutputType = {
    id: string | null
    gameInstanceId: string | null
    userId: string | null
    liveScore: number | null
    deferredScore: number | null
    nbAttempts: number | null
    status: $Enums.ParticipantStatus | null
    joinedAt: Date | null
    lastActiveAt: Date | null
    completedAt: Date | null
  }

  export type GameParticipantCountAggregateOutputType = {
    id: number
    gameInstanceId: number
    userId: number
    liveScore: number
    deferredScore: number
    nbAttempts: number
    status: number
    joinedAt: number
    lastActiveAt: number
    completedAt: number
    _all: number
  }


  export type GameParticipantAvgAggregateInputType = {
    liveScore?: true
    deferredScore?: true
    nbAttempts?: true
  }

  export type GameParticipantSumAggregateInputType = {
    liveScore?: true
    deferredScore?: true
    nbAttempts?: true
  }

  export type GameParticipantMinAggregateInputType = {
    id?: true
    gameInstanceId?: true
    userId?: true
    liveScore?: true
    deferredScore?: true
    nbAttempts?: true
    status?: true
    joinedAt?: true
    lastActiveAt?: true
    completedAt?: true
  }

  export type GameParticipantMaxAggregateInputType = {
    id?: true
    gameInstanceId?: true
    userId?: true
    liveScore?: true
    deferredScore?: true
    nbAttempts?: true
    status?: true
    joinedAt?: true
    lastActiveAt?: true
    completedAt?: true
  }

  export type GameParticipantCountAggregateInputType = {
    id?: true
    gameInstanceId?: true
    userId?: true
    liveScore?: true
    deferredScore?: true
    nbAttempts?: true
    status?: true
    joinedAt?: true
    lastActiveAt?: true
    completedAt?: true
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
    userId: string
    liveScore: number
    deferredScore: number
    nbAttempts: number
    status: $Enums.ParticipantStatus
    joinedAt: Date
    lastActiveAt: Date | null
    completedAt: Date | null
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
    userId?: boolean
    liveScore?: boolean
    deferredScore?: boolean
    nbAttempts?: boolean
    status?: boolean
    joinedAt?: boolean
    lastActiveAt?: boolean
    completedAt?: boolean
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameParticipant"]>

  export type GameParticipantSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gameInstanceId?: boolean
    userId?: boolean
    liveScore?: boolean
    deferredScore?: boolean
    nbAttempts?: boolean
    status?: boolean
    joinedAt?: boolean
    lastActiveAt?: boolean
    completedAt?: boolean
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameParticipant"]>

  export type GameParticipantSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gameInstanceId?: boolean
    userId?: boolean
    liveScore?: boolean
    deferredScore?: boolean
    nbAttempts?: boolean
    status?: boolean
    joinedAt?: boolean
    lastActiveAt?: boolean
    completedAt?: boolean
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameParticipant"]>

  export type GameParticipantSelectScalar = {
    id?: boolean
    gameInstanceId?: boolean
    userId?: boolean
    liveScore?: boolean
    deferredScore?: boolean
    nbAttempts?: boolean
    status?: boolean
    joinedAt?: boolean
    lastActiveAt?: boolean
    completedAt?: boolean
  }

  export type GameParticipantOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "gameInstanceId" | "userId" | "liveScore" | "deferredScore" | "nbAttempts" | "status" | "joinedAt" | "lastActiveAt" | "completedAt", ExtArgs["result"]["gameParticipant"]>
  export type GameParticipantInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type GameParticipantIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type GameParticipantIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameInstance?: boolean | GameInstanceDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $GameParticipantPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GameParticipant"
    objects: {
      gameInstance: Prisma.$GameInstancePayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      gameInstanceId: string
      userId: string
      liveScore: number
      deferredScore: number
      nbAttempts: number
      status: $Enums.ParticipantStatus
      joinedAt: Date
      lastActiveAt: Date | null
      completedAt: Date | null
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
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
    readonly userId: FieldRef<"GameParticipant", 'String'>
    readonly liveScore: FieldRef<"GameParticipant", 'Int'>
    readonly deferredScore: FieldRef<"GameParticipant", 'Int'>
    readonly nbAttempts: FieldRef<"GameParticipant", 'Int'>
    readonly status: FieldRef<"GameParticipant", 'ParticipantStatus'>
    readonly joinedAt: FieldRef<"GameParticipant", 'DateTime'>
    readonly lastActiveAt: FieldRef<"GameParticipant", 'DateTime'>
    readonly completedAt: FieldRef<"GameParticipant", 'DateTime'>
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


  export const UserScalarFieldEnum: {
    id: 'id',
    username: 'username',
    email: 'email',
    passwordHash: 'passwordHash',
    createdAt: 'createdAt',
    role: 'role',
    resetToken: 'resetToken',
    resetTokenExpiresAt: 'resetTokenExpiresAt',
    avatarEmoji: 'avatarEmoji',
    emailVerificationToken: 'emailVerificationToken',
    emailVerificationTokenExpiresAt: 'emailVerificationTokenExpiresAt',
    emailVerified: 'emailVerified'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const TeacherProfileScalarFieldEnum: {
    id: 'id'
  };

  export type TeacherProfileScalarFieldEnum = (typeof TeacherProfileScalarFieldEnum)[keyof typeof TeacherProfileScalarFieldEnum]


  export const StudentProfileScalarFieldEnum: {
    id: 'id',
    cookieId: 'cookieId'
  };

  export type StudentProfileScalarFieldEnum = (typeof StudentProfileScalarFieldEnum)[keyof typeof StudentProfileScalarFieldEnum]


  export const QuestionScalarFieldEnum: {
    uid: 'uid',
    title: 'title',
    text: 'text',
    questionType: 'questionType',
    discipline: 'discipline',
    themes: 'themes',
    difficulty: 'difficulty',
    gradeLevel: 'gradeLevel',
    author: 'author',
    explanation: 'explanation',
    tags: 'tags',
    timeLimit: 'timeLimit',
    excludedFrom: 'excludedFrom',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    feedbackWaitTime: 'feedbackWaitTime',
    isHidden: 'isHidden'
  };

  export type QuestionScalarFieldEnum = (typeof QuestionScalarFieldEnum)[keyof typeof QuestionScalarFieldEnum]


  export const MultipleChoiceQuestionScalarFieldEnum: {
    questionUid: 'questionUid',
    answerOptions: 'answerOptions',
    correctAnswers: 'correctAnswers'
  };

  export type MultipleChoiceQuestionScalarFieldEnum = (typeof MultipleChoiceQuestionScalarFieldEnum)[keyof typeof MultipleChoiceQuestionScalarFieldEnum]


  export const NumericQuestionScalarFieldEnum: {
    questionUid: 'questionUid',
    correctAnswer: 'correctAnswer',
    tolerance: 'tolerance',
    unit: 'unit'
  };

  export type NumericQuestionScalarFieldEnum = (typeof NumericQuestionScalarFieldEnum)[keyof typeof NumericQuestionScalarFieldEnum]


  export const GameTemplateScalarFieldEnum: {
    id: 'id',
    name: 'name',
    gradeLevel: 'gradeLevel',
    themes: 'themes',
    discipline: 'discipline',
    description: 'description',
    defaultMode: 'defaultMode',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    creatorId: 'creatorId'
  };

  export type GameTemplateScalarFieldEnum = (typeof GameTemplateScalarFieldEnum)[keyof typeof GameTemplateScalarFieldEnum]


  export const QuestionsInGameTemplateScalarFieldEnum: {
    gameTemplateId: 'gameTemplateId',
    questionUid: 'questionUid',
    sequence: 'sequence',
    createdAt: 'createdAt'
  };

  export type QuestionsInGameTemplateScalarFieldEnum = (typeof QuestionsInGameTemplateScalarFieldEnum)[keyof typeof QuestionsInGameTemplateScalarFieldEnum]


  export const GameInstanceScalarFieldEnum: {
    id: 'id',
    name: 'name',
    accessCode: 'accessCode',
    status: 'status',
    playMode: 'playMode',
    leaderboard: 'leaderboard',
    currentQuestionIndex: 'currentQuestionIndex',
    settings: 'settings',
    createdAt: 'createdAt',
    startedAt: 'startedAt',
    endedAt: 'endedAt',
    differedAvailableFrom: 'differedAvailableFrom',
    differedAvailableTo: 'differedAvailableTo',
    gameTemplateId: 'gameTemplateId',
    initiatorUserId: 'initiatorUserId'
  };

  export type GameInstanceScalarFieldEnum = (typeof GameInstanceScalarFieldEnum)[keyof typeof GameInstanceScalarFieldEnum]


  export const GameParticipantScalarFieldEnum: {
    id: 'id',
    gameInstanceId: 'gameInstanceId',
    userId: 'userId',
    liveScore: 'liveScore',
    deferredScore: 'deferredScore',
    nbAttempts: 'nbAttempts',
    status: 'status',
    joinedAt: 'joinedAt',
    lastActiveAt: 'lastActiveAt',
    completedAt: 'completedAt'
  };

  export type GameParticipantScalarFieldEnum = (typeof GameParticipantScalarFieldEnum)[keyof typeof GameParticipantScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


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
   * Reference to a field of type 'UserRole'
   */
  export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>
    


  /**
   * Reference to a field of type 'UserRole[]'
   */
  export type ListEnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean[]'
   */
  export type ListBooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'PlayMode'
   */
  export type EnumPlayModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PlayMode'>
    


  /**
   * Reference to a field of type 'PlayMode[]'
   */
  export type ListEnumPlayModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PlayMode[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'ParticipantStatus'
   */
  export type EnumParticipantStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ParticipantStatus'>
    


  /**
   * Reference to a field of type 'ParticipantStatus[]'
   */
  export type ListEnumParticipantStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ParticipantStatus[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    username?: StringFilter<"User"> | string
    email?: StringNullableFilter<"User"> | string | null
    passwordHash?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    resetToken?: StringNullableFilter<"User"> | string | null
    resetTokenExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    avatarEmoji?: StringNullableFilter<"User"> | string | null
    emailVerificationToken?: StringNullableFilter<"User"> | string | null
    emailVerificationTokenExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    emailVerified?: BoolNullableFilter<"User"> | boolean | null
    studentProfile?: XOR<StudentProfileNullableScalarRelationFilter, StudentProfileWhereInput> | null
    teacherProfile?: XOR<TeacherProfileNullableScalarRelationFilter, TeacherProfileWhereInput> | null
    initiatedGameInstances?: GameInstanceListRelationFilter
    gameParticipations?: GameParticipantListRelationFilter
    createdGameTemplates?: GameTemplateListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrderInput | SortOrder
    passwordHash?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    role?: SortOrder
    resetToken?: SortOrderInput | SortOrder
    resetTokenExpiresAt?: SortOrderInput | SortOrder
    avatarEmoji?: SortOrderInput | SortOrder
    emailVerificationToken?: SortOrderInput | SortOrder
    emailVerificationTokenExpiresAt?: SortOrderInput | SortOrder
    emailVerified?: SortOrderInput | SortOrder
    studentProfile?: StudentProfileOrderByWithRelationInput
    teacherProfile?: TeacherProfileOrderByWithRelationInput
    initiatedGameInstances?: GameInstanceOrderByRelationAggregateInput
    gameParticipations?: GameParticipantOrderByRelationAggregateInput
    createdGameTemplates?: GameTemplateOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    username?: StringFilter<"User"> | string
    passwordHash?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    resetToken?: StringNullableFilter<"User"> | string | null
    resetTokenExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    avatarEmoji?: StringNullableFilter<"User"> | string | null
    emailVerificationToken?: StringNullableFilter<"User"> | string | null
    emailVerificationTokenExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    emailVerified?: BoolNullableFilter<"User"> | boolean | null
    studentProfile?: XOR<StudentProfileNullableScalarRelationFilter, StudentProfileWhereInput> | null
    teacherProfile?: XOR<TeacherProfileNullableScalarRelationFilter, TeacherProfileWhereInput> | null
    initiatedGameInstances?: GameInstanceListRelationFilter
    gameParticipations?: GameParticipantListRelationFilter
    createdGameTemplates?: GameTemplateListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrderInput | SortOrder
    passwordHash?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    role?: SortOrder
    resetToken?: SortOrderInput | SortOrder
    resetTokenExpiresAt?: SortOrderInput | SortOrder
    avatarEmoji?: SortOrderInput | SortOrder
    emailVerificationToken?: SortOrderInput | SortOrder
    emailVerificationTokenExpiresAt?: SortOrderInput | SortOrder
    emailVerified?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    username?: StringWithAggregatesFilter<"User"> | string
    email?: StringNullableWithAggregatesFilter<"User"> | string | null
    passwordHash?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    role?: EnumUserRoleWithAggregatesFilter<"User"> | $Enums.UserRole
    resetToken?: StringNullableWithAggregatesFilter<"User"> | string | null
    resetTokenExpiresAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    avatarEmoji?: StringNullableWithAggregatesFilter<"User"> | string | null
    emailVerificationToken?: StringNullableWithAggregatesFilter<"User"> | string | null
    emailVerificationTokenExpiresAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    emailVerified?: BoolNullableWithAggregatesFilter<"User"> | boolean | null
  }

  export type TeacherProfileWhereInput = {
    AND?: TeacherProfileWhereInput | TeacherProfileWhereInput[]
    OR?: TeacherProfileWhereInput[]
    NOT?: TeacherProfileWhereInput | TeacherProfileWhereInput[]
    id?: StringFilter<"TeacherProfile"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type TeacherProfileOrderByWithRelationInput = {
    id?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type TeacherProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TeacherProfileWhereInput | TeacherProfileWhereInput[]
    OR?: TeacherProfileWhereInput[]
    NOT?: TeacherProfileWhereInput | TeacherProfileWhereInput[]
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type TeacherProfileOrderByWithAggregationInput = {
    id?: SortOrder
    _count?: TeacherProfileCountOrderByAggregateInput
    _max?: TeacherProfileMaxOrderByAggregateInput
    _min?: TeacherProfileMinOrderByAggregateInput
  }

  export type TeacherProfileScalarWhereWithAggregatesInput = {
    AND?: TeacherProfileScalarWhereWithAggregatesInput | TeacherProfileScalarWhereWithAggregatesInput[]
    OR?: TeacherProfileScalarWhereWithAggregatesInput[]
    NOT?: TeacherProfileScalarWhereWithAggregatesInput | TeacherProfileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TeacherProfile"> | string
  }

  export type StudentProfileWhereInput = {
    AND?: StudentProfileWhereInput | StudentProfileWhereInput[]
    OR?: StudentProfileWhereInput[]
    NOT?: StudentProfileWhereInput | StudentProfileWhereInput[]
    id?: StringFilter<"StudentProfile"> | string
    cookieId?: StringNullableFilter<"StudentProfile"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type StudentProfileOrderByWithRelationInput = {
    id?: SortOrder
    cookieId?: SortOrderInput | SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type StudentProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    cookieId?: string
    AND?: StudentProfileWhereInput | StudentProfileWhereInput[]
    OR?: StudentProfileWhereInput[]
    NOT?: StudentProfileWhereInput | StudentProfileWhereInput[]
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "cookieId">

  export type StudentProfileOrderByWithAggregationInput = {
    id?: SortOrder
    cookieId?: SortOrderInput | SortOrder
    _count?: StudentProfileCountOrderByAggregateInput
    _max?: StudentProfileMaxOrderByAggregateInput
    _min?: StudentProfileMinOrderByAggregateInput
  }

  export type StudentProfileScalarWhereWithAggregatesInput = {
    AND?: StudentProfileScalarWhereWithAggregatesInput | StudentProfileScalarWhereWithAggregatesInput[]
    OR?: StudentProfileScalarWhereWithAggregatesInput[]
    NOT?: StudentProfileScalarWhereWithAggregatesInput | StudentProfileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StudentProfile"> | string
    cookieId?: StringNullableWithAggregatesFilter<"StudentProfile"> | string | null
  }

  export type QuestionWhereInput = {
    AND?: QuestionWhereInput | QuestionWhereInput[]
    OR?: QuestionWhereInput[]
    NOT?: QuestionWhereInput | QuestionWhereInput[]
    uid?: StringFilter<"Question"> | string
    title?: StringNullableFilter<"Question"> | string | null
    text?: StringFilter<"Question"> | string
    questionType?: StringFilter<"Question"> | string
    discipline?: StringFilter<"Question"> | string
    themes?: StringNullableListFilter<"Question">
    difficulty?: IntNullableFilter<"Question"> | number | null
    gradeLevel?: StringNullableFilter<"Question"> | string | null
    author?: StringNullableFilter<"Question"> | string | null
    explanation?: StringNullableFilter<"Question"> | string | null
    tags?: StringNullableListFilter<"Question">
    timeLimit?: IntFilter<"Question"> | number
    excludedFrom?: StringNullableListFilter<"Question">
    createdAt?: DateTimeFilter<"Question"> | Date | string
    updatedAt?: DateTimeFilter<"Question"> | Date | string
    feedbackWaitTime?: IntNullableFilter<"Question"> | number | null
    isHidden?: BoolNullableFilter<"Question"> | boolean | null
    multipleChoiceQuestion?: XOR<MultipleChoiceQuestionNullableScalarRelationFilter, MultipleChoiceQuestionWhereInput> | null
    numericQuestion?: XOR<NumericQuestionNullableScalarRelationFilter, NumericQuestionWhereInput> | null
    gameTemplates?: QuestionsInGameTemplateListRelationFilter
  }

  export type QuestionOrderByWithRelationInput = {
    uid?: SortOrder
    title?: SortOrderInput | SortOrder
    text?: SortOrder
    questionType?: SortOrder
    discipline?: SortOrder
    themes?: SortOrder
    difficulty?: SortOrderInput | SortOrder
    gradeLevel?: SortOrderInput | SortOrder
    author?: SortOrderInput | SortOrder
    explanation?: SortOrderInput | SortOrder
    tags?: SortOrder
    timeLimit?: SortOrder
    excludedFrom?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    feedbackWaitTime?: SortOrderInput | SortOrder
    isHidden?: SortOrderInput | SortOrder
    multipleChoiceQuestion?: MultipleChoiceQuestionOrderByWithRelationInput
    numericQuestion?: NumericQuestionOrderByWithRelationInput
    gameTemplates?: QuestionsInGameTemplateOrderByRelationAggregateInput
  }

  export type QuestionWhereUniqueInput = Prisma.AtLeast<{
    uid?: string
    AND?: QuestionWhereInput | QuestionWhereInput[]
    OR?: QuestionWhereInput[]
    NOT?: QuestionWhereInput | QuestionWhereInput[]
    title?: StringNullableFilter<"Question"> | string | null
    text?: StringFilter<"Question"> | string
    questionType?: StringFilter<"Question"> | string
    discipline?: StringFilter<"Question"> | string
    themes?: StringNullableListFilter<"Question">
    difficulty?: IntNullableFilter<"Question"> | number | null
    gradeLevel?: StringNullableFilter<"Question"> | string | null
    author?: StringNullableFilter<"Question"> | string | null
    explanation?: StringNullableFilter<"Question"> | string | null
    tags?: StringNullableListFilter<"Question">
    timeLimit?: IntFilter<"Question"> | number
    excludedFrom?: StringNullableListFilter<"Question">
    createdAt?: DateTimeFilter<"Question"> | Date | string
    updatedAt?: DateTimeFilter<"Question"> | Date | string
    feedbackWaitTime?: IntNullableFilter<"Question"> | number | null
    isHidden?: BoolNullableFilter<"Question"> | boolean | null
    multipleChoiceQuestion?: XOR<MultipleChoiceQuestionNullableScalarRelationFilter, MultipleChoiceQuestionWhereInput> | null
    numericQuestion?: XOR<NumericQuestionNullableScalarRelationFilter, NumericQuestionWhereInput> | null
    gameTemplates?: QuestionsInGameTemplateListRelationFilter
  }, "uid">

  export type QuestionOrderByWithAggregationInput = {
    uid?: SortOrder
    title?: SortOrderInput | SortOrder
    text?: SortOrder
    questionType?: SortOrder
    discipline?: SortOrder
    themes?: SortOrder
    difficulty?: SortOrderInput | SortOrder
    gradeLevel?: SortOrderInput | SortOrder
    author?: SortOrderInput | SortOrder
    explanation?: SortOrderInput | SortOrder
    tags?: SortOrder
    timeLimit?: SortOrder
    excludedFrom?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    feedbackWaitTime?: SortOrderInput | SortOrder
    isHidden?: SortOrderInput | SortOrder
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
    questionType?: StringWithAggregatesFilter<"Question"> | string
    discipline?: StringWithAggregatesFilter<"Question"> | string
    themes?: StringNullableListFilter<"Question">
    difficulty?: IntNullableWithAggregatesFilter<"Question"> | number | null
    gradeLevel?: StringNullableWithAggregatesFilter<"Question"> | string | null
    author?: StringNullableWithAggregatesFilter<"Question"> | string | null
    explanation?: StringNullableWithAggregatesFilter<"Question"> | string | null
    tags?: StringNullableListFilter<"Question">
    timeLimit?: IntWithAggregatesFilter<"Question"> | number
    excludedFrom?: StringNullableListFilter<"Question">
    createdAt?: DateTimeWithAggregatesFilter<"Question"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Question"> | Date | string
    feedbackWaitTime?: IntNullableWithAggregatesFilter<"Question"> | number | null
    isHidden?: BoolNullableWithAggregatesFilter<"Question"> | boolean | null
  }

  export type MultipleChoiceQuestionWhereInput = {
    AND?: MultipleChoiceQuestionWhereInput | MultipleChoiceQuestionWhereInput[]
    OR?: MultipleChoiceQuestionWhereInput[]
    NOT?: MultipleChoiceQuestionWhereInput | MultipleChoiceQuestionWhereInput[]
    questionUid?: StringFilter<"MultipleChoiceQuestion"> | string
    answerOptions?: StringNullableListFilter<"MultipleChoiceQuestion">
    correctAnswers?: BoolNullableListFilter<"MultipleChoiceQuestion">
    question?: XOR<QuestionScalarRelationFilter, QuestionWhereInput>
  }

  export type MultipleChoiceQuestionOrderByWithRelationInput = {
    questionUid?: SortOrder
    answerOptions?: SortOrder
    correctAnswers?: SortOrder
    question?: QuestionOrderByWithRelationInput
  }

  export type MultipleChoiceQuestionWhereUniqueInput = Prisma.AtLeast<{
    questionUid?: string
    AND?: MultipleChoiceQuestionWhereInput | MultipleChoiceQuestionWhereInput[]
    OR?: MultipleChoiceQuestionWhereInput[]
    NOT?: MultipleChoiceQuestionWhereInput | MultipleChoiceQuestionWhereInput[]
    answerOptions?: StringNullableListFilter<"MultipleChoiceQuestion">
    correctAnswers?: BoolNullableListFilter<"MultipleChoiceQuestion">
    question?: XOR<QuestionScalarRelationFilter, QuestionWhereInput>
  }, "questionUid">

  export type MultipleChoiceQuestionOrderByWithAggregationInput = {
    questionUid?: SortOrder
    answerOptions?: SortOrder
    correctAnswers?: SortOrder
    _count?: MultipleChoiceQuestionCountOrderByAggregateInput
    _max?: MultipleChoiceQuestionMaxOrderByAggregateInput
    _min?: MultipleChoiceQuestionMinOrderByAggregateInput
  }

  export type MultipleChoiceQuestionScalarWhereWithAggregatesInput = {
    AND?: MultipleChoiceQuestionScalarWhereWithAggregatesInput | MultipleChoiceQuestionScalarWhereWithAggregatesInput[]
    OR?: MultipleChoiceQuestionScalarWhereWithAggregatesInput[]
    NOT?: MultipleChoiceQuestionScalarWhereWithAggregatesInput | MultipleChoiceQuestionScalarWhereWithAggregatesInput[]
    questionUid?: StringWithAggregatesFilter<"MultipleChoiceQuestion"> | string
    answerOptions?: StringNullableListFilter<"MultipleChoiceQuestion">
    correctAnswers?: BoolNullableListFilter<"MultipleChoiceQuestion">
  }

  export type NumericQuestionWhereInput = {
    AND?: NumericQuestionWhereInput | NumericQuestionWhereInput[]
    OR?: NumericQuestionWhereInput[]
    NOT?: NumericQuestionWhereInput | NumericQuestionWhereInput[]
    questionUid?: StringFilter<"NumericQuestion"> | string
    correctAnswer?: FloatFilter<"NumericQuestion"> | number
    tolerance?: FloatNullableFilter<"NumericQuestion"> | number | null
    unit?: StringNullableFilter<"NumericQuestion"> | string | null
    question?: XOR<QuestionScalarRelationFilter, QuestionWhereInput>
  }

  export type NumericQuestionOrderByWithRelationInput = {
    questionUid?: SortOrder
    correctAnswer?: SortOrder
    tolerance?: SortOrderInput | SortOrder
    unit?: SortOrderInput | SortOrder
    question?: QuestionOrderByWithRelationInput
  }

  export type NumericQuestionWhereUniqueInput = Prisma.AtLeast<{
    questionUid?: string
    AND?: NumericQuestionWhereInput | NumericQuestionWhereInput[]
    OR?: NumericQuestionWhereInput[]
    NOT?: NumericQuestionWhereInput | NumericQuestionWhereInput[]
    correctAnswer?: FloatFilter<"NumericQuestion"> | number
    tolerance?: FloatNullableFilter<"NumericQuestion"> | number | null
    unit?: StringNullableFilter<"NumericQuestion"> | string | null
    question?: XOR<QuestionScalarRelationFilter, QuestionWhereInput>
  }, "questionUid">

  export type NumericQuestionOrderByWithAggregationInput = {
    questionUid?: SortOrder
    correctAnswer?: SortOrder
    tolerance?: SortOrderInput | SortOrder
    unit?: SortOrderInput | SortOrder
    _count?: NumericQuestionCountOrderByAggregateInput
    _avg?: NumericQuestionAvgOrderByAggregateInput
    _max?: NumericQuestionMaxOrderByAggregateInput
    _min?: NumericQuestionMinOrderByAggregateInput
    _sum?: NumericQuestionSumOrderByAggregateInput
  }

  export type NumericQuestionScalarWhereWithAggregatesInput = {
    AND?: NumericQuestionScalarWhereWithAggregatesInput | NumericQuestionScalarWhereWithAggregatesInput[]
    OR?: NumericQuestionScalarWhereWithAggregatesInput[]
    NOT?: NumericQuestionScalarWhereWithAggregatesInput | NumericQuestionScalarWhereWithAggregatesInput[]
    questionUid?: StringWithAggregatesFilter<"NumericQuestion"> | string
    correctAnswer?: FloatWithAggregatesFilter<"NumericQuestion"> | number
    tolerance?: FloatNullableWithAggregatesFilter<"NumericQuestion"> | number | null
    unit?: StringNullableWithAggregatesFilter<"NumericQuestion"> | string | null
  }

  export type GameTemplateWhereInput = {
    AND?: GameTemplateWhereInput | GameTemplateWhereInput[]
    OR?: GameTemplateWhereInput[]
    NOT?: GameTemplateWhereInput | GameTemplateWhereInput[]
    id?: StringFilter<"GameTemplate"> | string
    name?: StringFilter<"GameTemplate"> | string
    gradeLevel?: StringNullableFilter<"GameTemplate"> | string | null
    themes?: StringNullableListFilter<"GameTemplate">
    discipline?: StringNullableFilter<"GameTemplate"> | string | null
    description?: StringNullableFilter<"GameTemplate"> | string | null
    defaultMode?: EnumPlayModeNullableFilter<"GameTemplate"> | $Enums.PlayMode | null
    createdAt?: DateTimeFilter<"GameTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"GameTemplate"> | Date | string
    creatorId?: StringFilter<"GameTemplate"> | string
    gameInstances?: GameInstanceListRelationFilter
    creator?: XOR<UserScalarRelationFilter, UserWhereInput>
    questions?: QuestionsInGameTemplateListRelationFilter
  }

  export type GameTemplateOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    gradeLevel?: SortOrderInput | SortOrder
    themes?: SortOrder
    discipline?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    defaultMode?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creatorId?: SortOrder
    gameInstances?: GameInstanceOrderByRelationAggregateInput
    creator?: UserOrderByWithRelationInput
    questions?: QuestionsInGameTemplateOrderByRelationAggregateInput
  }

  export type GameTemplateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: GameTemplateWhereInput | GameTemplateWhereInput[]
    OR?: GameTemplateWhereInput[]
    NOT?: GameTemplateWhereInput | GameTemplateWhereInput[]
    name?: StringFilter<"GameTemplate"> | string
    gradeLevel?: StringNullableFilter<"GameTemplate"> | string | null
    themes?: StringNullableListFilter<"GameTemplate">
    discipline?: StringNullableFilter<"GameTemplate"> | string | null
    description?: StringNullableFilter<"GameTemplate"> | string | null
    defaultMode?: EnumPlayModeNullableFilter<"GameTemplate"> | $Enums.PlayMode | null
    createdAt?: DateTimeFilter<"GameTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"GameTemplate"> | Date | string
    creatorId?: StringFilter<"GameTemplate"> | string
    gameInstances?: GameInstanceListRelationFilter
    creator?: XOR<UserScalarRelationFilter, UserWhereInput>
    questions?: QuestionsInGameTemplateListRelationFilter
  }, "id">

  export type GameTemplateOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    gradeLevel?: SortOrderInput | SortOrder
    themes?: SortOrder
    discipline?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    defaultMode?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creatorId?: SortOrder
    _count?: GameTemplateCountOrderByAggregateInput
    _max?: GameTemplateMaxOrderByAggregateInput
    _min?: GameTemplateMinOrderByAggregateInput
  }

  export type GameTemplateScalarWhereWithAggregatesInput = {
    AND?: GameTemplateScalarWhereWithAggregatesInput | GameTemplateScalarWhereWithAggregatesInput[]
    OR?: GameTemplateScalarWhereWithAggregatesInput[]
    NOT?: GameTemplateScalarWhereWithAggregatesInput | GameTemplateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"GameTemplate"> | string
    name?: StringWithAggregatesFilter<"GameTemplate"> | string
    gradeLevel?: StringNullableWithAggregatesFilter<"GameTemplate"> | string | null
    themes?: StringNullableListFilter<"GameTemplate">
    discipline?: StringNullableWithAggregatesFilter<"GameTemplate"> | string | null
    description?: StringNullableWithAggregatesFilter<"GameTemplate"> | string | null
    defaultMode?: EnumPlayModeNullableWithAggregatesFilter<"GameTemplate"> | $Enums.PlayMode | null
    createdAt?: DateTimeWithAggregatesFilter<"GameTemplate"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"GameTemplate"> | Date | string
    creatorId?: StringWithAggregatesFilter<"GameTemplate"> | string
  }

  export type QuestionsInGameTemplateWhereInput = {
    AND?: QuestionsInGameTemplateWhereInput | QuestionsInGameTemplateWhereInput[]
    OR?: QuestionsInGameTemplateWhereInput[]
    NOT?: QuestionsInGameTemplateWhereInput | QuestionsInGameTemplateWhereInput[]
    gameTemplateId?: StringFilter<"QuestionsInGameTemplate"> | string
    questionUid?: StringFilter<"QuestionsInGameTemplate"> | string
    sequence?: IntFilter<"QuestionsInGameTemplate"> | number
    createdAt?: DateTimeFilter<"QuestionsInGameTemplate"> | Date | string
    gameTemplate?: XOR<GameTemplateScalarRelationFilter, GameTemplateWhereInput>
    question?: XOR<QuestionScalarRelationFilter, QuestionWhereInput>
  }

  export type QuestionsInGameTemplateOrderByWithRelationInput = {
    gameTemplateId?: SortOrder
    questionUid?: SortOrder
    sequence?: SortOrder
    createdAt?: SortOrder
    gameTemplate?: GameTemplateOrderByWithRelationInput
    question?: QuestionOrderByWithRelationInput
  }

  export type QuestionsInGameTemplateWhereUniqueInput = Prisma.AtLeast<{
    gameTemplateId_questionUid?: QuestionsInGameTemplateGameTemplateIdQuestionUidCompoundUniqueInput
    gameTemplateId_sequence?: QuestionsInGameTemplateGameTemplateIdSequenceCompoundUniqueInput
    AND?: QuestionsInGameTemplateWhereInput | QuestionsInGameTemplateWhereInput[]
    OR?: QuestionsInGameTemplateWhereInput[]
    NOT?: QuestionsInGameTemplateWhereInput | QuestionsInGameTemplateWhereInput[]
    gameTemplateId?: StringFilter<"QuestionsInGameTemplate"> | string
    questionUid?: StringFilter<"QuestionsInGameTemplate"> | string
    sequence?: IntFilter<"QuestionsInGameTemplate"> | number
    createdAt?: DateTimeFilter<"QuestionsInGameTemplate"> | Date | string
    gameTemplate?: XOR<GameTemplateScalarRelationFilter, GameTemplateWhereInput>
    question?: XOR<QuestionScalarRelationFilter, QuestionWhereInput>
  }, "gameTemplateId_sequence" | "gameTemplateId_questionUid">

  export type QuestionsInGameTemplateOrderByWithAggregationInput = {
    gameTemplateId?: SortOrder
    questionUid?: SortOrder
    sequence?: SortOrder
    createdAt?: SortOrder
    _count?: QuestionsInGameTemplateCountOrderByAggregateInput
    _avg?: QuestionsInGameTemplateAvgOrderByAggregateInput
    _max?: QuestionsInGameTemplateMaxOrderByAggregateInput
    _min?: QuestionsInGameTemplateMinOrderByAggregateInput
    _sum?: QuestionsInGameTemplateSumOrderByAggregateInput
  }

  export type QuestionsInGameTemplateScalarWhereWithAggregatesInput = {
    AND?: QuestionsInGameTemplateScalarWhereWithAggregatesInput | QuestionsInGameTemplateScalarWhereWithAggregatesInput[]
    OR?: QuestionsInGameTemplateScalarWhereWithAggregatesInput[]
    NOT?: QuestionsInGameTemplateScalarWhereWithAggregatesInput | QuestionsInGameTemplateScalarWhereWithAggregatesInput[]
    gameTemplateId?: StringWithAggregatesFilter<"QuestionsInGameTemplate"> | string
    questionUid?: StringWithAggregatesFilter<"QuestionsInGameTemplate"> | string
    sequence?: IntWithAggregatesFilter<"QuestionsInGameTemplate"> | number
    createdAt?: DateTimeWithAggregatesFilter<"QuestionsInGameTemplate"> | Date | string
  }

  export type GameInstanceWhereInput = {
    AND?: GameInstanceWhereInput | GameInstanceWhereInput[]
    OR?: GameInstanceWhereInput[]
    NOT?: GameInstanceWhereInput | GameInstanceWhereInput[]
    id?: StringFilter<"GameInstance"> | string
    name?: StringFilter<"GameInstance"> | string
    accessCode?: StringFilter<"GameInstance"> | string
    status?: StringFilter<"GameInstance"> | string
    playMode?: EnumPlayModeFilter<"GameInstance"> | $Enums.PlayMode
    leaderboard?: JsonNullableFilter<"GameInstance">
    currentQuestionIndex?: IntNullableFilter<"GameInstance"> | number | null
    settings?: JsonNullableFilter<"GameInstance">
    createdAt?: DateTimeFilter<"GameInstance"> | Date | string
    startedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    differedAvailableFrom?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    differedAvailableTo?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    gameTemplateId?: StringFilter<"GameInstance"> | string
    initiatorUserId?: StringNullableFilter<"GameInstance"> | string | null
    gameTemplate?: XOR<GameTemplateScalarRelationFilter, GameTemplateWhereInput>
    initiatorUser?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
    participants?: GameParticipantListRelationFilter
  }

  export type GameInstanceOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    accessCode?: SortOrder
    status?: SortOrder
    playMode?: SortOrder
    leaderboard?: SortOrderInput | SortOrder
    currentQuestionIndex?: SortOrderInput | SortOrder
    settings?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    endedAt?: SortOrderInput | SortOrder
    differedAvailableFrom?: SortOrderInput | SortOrder
    differedAvailableTo?: SortOrderInput | SortOrder
    gameTemplateId?: SortOrder
    initiatorUserId?: SortOrderInput | SortOrder
    gameTemplate?: GameTemplateOrderByWithRelationInput
    initiatorUser?: UserOrderByWithRelationInput
    participants?: GameParticipantOrderByRelationAggregateInput
  }

  export type GameInstanceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    accessCode?: string
    AND?: GameInstanceWhereInput | GameInstanceWhereInput[]
    OR?: GameInstanceWhereInput[]
    NOT?: GameInstanceWhereInput | GameInstanceWhereInput[]
    name?: StringFilter<"GameInstance"> | string
    status?: StringFilter<"GameInstance"> | string
    playMode?: EnumPlayModeFilter<"GameInstance"> | $Enums.PlayMode
    leaderboard?: JsonNullableFilter<"GameInstance">
    currentQuestionIndex?: IntNullableFilter<"GameInstance"> | number | null
    settings?: JsonNullableFilter<"GameInstance">
    createdAt?: DateTimeFilter<"GameInstance"> | Date | string
    startedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    differedAvailableFrom?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    differedAvailableTo?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    gameTemplateId?: StringFilter<"GameInstance"> | string
    initiatorUserId?: StringNullableFilter<"GameInstance"> | string | null
    gameTemplate?: XOR<GameTemplateScalarRelationFilter, GameTemplateWhereInput>
    initiatorUser?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
    participants?: GameParticipantListRelationFilter
  }, "id" | "accessCode">

  export type GameInstanceOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    accessCode?: SortOrder
    status?: SortOrder
    playMode?: SortOrder
    leaderboard?: SortOrderInput | SortOrder
    currentQuestionIndex?: SortOrderInput | SortOrder
    settings?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    endedAt?: SortOrderInput | SortOrder
    differedAvailableFrom?: SortOrderInput | SortOrder
    differedAvailableTo?: SortOrderInput | SortOrder
    gameTemplateId?: SortOrder
    initiatorUserId?: SortOrderInput | SortOrder
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
    accessCode?: StringWithAggregatesFilter<"GameInstance"> | string
    status?: StringWithAggregatesFilter<"GameInstance"> | string
    playMode?: EnumPlayModeWithAggregatesFilter<"GameInstance"> | $Enums.PlayMode
    leaderboard?: JsonNullableWithAggregatesFilter<"GameInstance">
    currentQuestionIndex?: IntNullableWithAggregatesFilter<"GameInstance"> | number | null
    settings?: JsonNullableWithAggregatesFilter<"GameInstance">
    createdAt?: DateTimeWithAggregatesFilter<"GameInstance"> | Date | string
    startedAt?: DateTimeNullableWithAggregatesFilter<"GameInstance"> | Date | string | null
    endedAt?: DateTimeNullableWithAggregatesFilter<"GameInstance"> | Date | string | null
    differedAvailableFrom?: DateTimeNullableWithAggregatesFilter<"GameInstance"> | Date | string | null
    differedAvailableTo?: DateTimeNullableWithAggregatesFilter<"GameInstance"> | Date | string | null
    gameTemplateId?: StringWithAggregatesFilter<"GameInstance"> | string
    initiatorUserId?: StringNullableWithAggregatesFilter<"GameInstance"> | string | null
  }

  export type GameParticipantWhereInput = {
    AND?: GameParticipantWhereInput | GameParticipantWhereInput[]
    OR?: GameParticipantWhereInput[]
    NOT?: GameParticipantWhereInput | GameParticipantWhereInput[]
    id?: StringFilter<"GameParticipant"> | string
    gameInstanceId?: StringFilter<"GameParticipant"> | string
    userId?: StringFilter<"GameParticipant"> | string
    liveScore?: IntFilter<"GameParticipant"> | number
    deferredScore?: IntFilter<"GameParticipant"> | number
    nbAttempts?: IntFilter<"GameParticipant"> | number
    status?: EnumParticipantStatusFilter<"GameParticipant"> | $Enums.ParticipantStatus
    joinedAt?: DateTimeFilter<"GameParticipant"> | Date | string
    lastActiveAt?: DateTimeNullableFilter<"GameParticipant"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"GameParticipant"> | Date | string | null
    gameInstance?: XOR<GameInstanceScalarRelationFilter, GameInstanceWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type GameParticipantOrderByWithRelationInput = {
    id?: SortOrder
    gameInstanceId?: SortOrder
    userId?: SortOrder
    liveScore?: SortOrder
    deferredScore?: SortOrder
    nbAttempts?: SortOrder
    status?: SortOrder
    joinedAt?: SortOrder
    lastActiveAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    gameInstance?: GameInstanceOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type GameParticipantWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    gameInstanceId_userId?: GameParticipantGameInstanceIdUserIdCompoundUniqueInput
    AND?: GameParticipantWhereInput | GameParticipantWhereInput[]
    OR?: GameParticipantWhereInput[]
    NOT?: GameParticipantWhereInput | GameParticipantWhereInput[]
    gameInstanceId?: StringFilter<"GameParticipant"> | string
    userId?: StringFilter<"GameParticipant"> | string
    liveScore?: IntFilter<"GameParticipant"> | number
    deferredScore?: IntFilter<"GameParticipant"> | number
    nbAttempts?: IntFilter<"GameParticipant"> | number
    status?: EnumParticipantStatusFilter<"GameParticipant"> | $Enums.ParticipantStatus
    joinedAt?: DateTimeFilter<"GameParticipant"> | Date | string
    lastActiveAt?: DateTimeNullableFilter<"GameParticipant"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"GameParticipant"> | Date | string | null
    gameInstance?: XOR<GameInstanceScalarRelationFilter, GameInstanceWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "gameInstanceId_userId">

  export type GameParticipantOrderByWithAggregationInput = {
    id?: SortOrder
    gameInstanceId?: SortOrder
    userId?: SortOrder
    liveScore?: SortOrder
    deferredScore?: SortOrder
    nbAttempts?: SortOrder
    status?: SortOrder
    joinedAt?: SortOrder
    lastActiveAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
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
    userId?: StringWithAggregatesFilter<"GameParticipant"> | string
    liveScore?: IntWithAggregatesFilter<"GameParticipant"> | number
    deferredScore?: IntWithAggregatesFilter<"GameParticipant"> | number
    nbAttempts?: IntWithAggregatesFilter<"GameParticipant"> | number
    status?: EnumParticipantStatusWithAggregatesFilter<"GameParticipant"> | $Enums.ParticipantStatus
    joinedAt?: DateTimeWithAggregatesFilter<"GameParticipant"> | Date | string
    lastActiveAt?: DateTimeNullableWithAggregatesFilter<"GameParticipant"> | Date | string | null
    completedAt?: DateTimeNullableWithAggregatesFilter<"GameParticipant"> | Date | string | null
  }

  export type UserCreateInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    studentProfile?: StudentProfileCreateNestedOneWithoutUserInput
    teacherProfile?: TeacherProfileCreateNestedOneWithoutUserInput
    initiatedGameInstances?: GameInstanceCreateNestedManyWithoutInitiatorUserInput
    gameParticipations?: GameParticipantCreateNestedManyWithoutUserInput
    createdGameTemplates?: GameTemplateCreateNestedManyWithoutCreatorInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    studentProfile?: StudentProfileUncheckedCreateNestedOneWithoutUserInput
    teacherProfile?: TeacherProfileUncheckedCreateNestedOneWithoutUserInput
    initiatedGameInstances?: GameInstanceUncheckedCreateNestedManyWithoutInitiatorUserInput
    gameParticipations?: GameParticipantUncheckedCreateNestedManyWithoutUserInput
    createdGameTemplates?: GameTemplateUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    studentProfile?: StudentProfileUpdateOneWithoutUserNestedInput
    teacherProfile?: TeacherProfileUpdateOneWithoutUserNestedInput
    initiatedGameInstances?: GameInstanceUpdateManyWithoutInitiatorUserNestedInput
    gameParticipations?: GameParticipantUpdateManyWithoutUserNestedInput
    createdGameTemplates?: GameTemplateUpdateManyWithoutCreatorNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    studentProfile?: StudentProfileUncheckedUpdateOneWithoutUserNestedInput
    teacherProfile?: TeacherProfileUncheckedUpdateOneWithoutUserNestedInput
    initiatedGameInstances?: GameInstanceUncheckedUpdateManyWithoutInitiatorUserNestedInput
    gameParticipations?: GameParticipantUncheckedUpdateManyWithoutUserNestedInput
    createdGameTemplates?: GameTemplateUncheckedUpdateManyWithoutCreatorNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type TeacherProfileCreateInput = {
    user: UserCreateNestedOneWithoutTeacherProfileInput
  }

  export type TeacherProfileUncheckedCreateInput = {
    id: string
  }

  export type TeacherProfileUpdateInput = {
    user?: UserUpdateOneRequiredWithoutTeacherProfileNestedInput
  }

  export type TeacherProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
  }

  export type TeacherProfileCreateManyInput = {
    id: string
  }

  export type TeacherProfileUpdateManyMutationInput = {

  }

  export type TeacherProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
  }

  export type StudentProfileCreateInput = {
    cookieId?: string | null
    user: UserCreateNestedOneWithoutStudentProfileInput
  }

  export type StudentProfileUncheckedCreateInput = {
    id: string
    cookieId?: string | null
  }

  export type StudentProfileUpdateInput = {
    cookieId?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutStudentProfileNestedInput
  }

  export type StudentProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    cookieId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StudentProfileCreateManyInput = {
    id: string
    cookieId?: string | null
  }

  export type StudentProfileUpdateManyMutationInput = {
    cookieId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StudentProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    cookieId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QuestionCreateInput = {
    uid?: string
    title?: string | null
    text: string
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit: number
    excludedFrom?: QuestionCreateexcludedFromInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    feedbackWaitTime?: number | null
    isHidden?: boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionCreateNestedOneWithoutQuestionInput
    numericQuestion?: NumericQuestionCreateNestedOneWithoutQuestionInput
    gameTemplates?: QuestionsInGameTemplateCreateNestedManyWithoutQuestionInput
  }

  export type QuestionUncheckedCreateInput = {
    uid?: string
    title?: string | null
    text: string
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit: number
    excludedFrom?: QuestionCreateexcludedFromInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    feedbackWaitTime?: number | null
    isHidden?: boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionUncheckedCreateNestedOneWithoutQuestionInput
    numericQuestion?: NumericQuestionUncheckedCreateNestedOneWithoutQuestionInput
    gameTemplates?: QuestionsInGameTemplateUncheckedCreateNestedManyWithoutQuestionInput
  }

  export type QuestionUpdateInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: IntFieldUpdateOperationsInput | number
    excludedFrom?: QuestionUpdateexcludedFromInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedbackWaitTime?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionUpdateOneWithoutQuestionNestedInput
    numericQuestion?: NumericQuestionUpdateOneWithoutQuestionNestedInput
    gameTemplates?: QuestionsInGameTemplateUpdateManyWithoutQuestionNestedInput
  }

  export type QuestionUncheckedUpdateInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: IntFieldUpdateOperationsInput | number
    excludedFrom?: QuestionUpdateexcludedFromInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedbackWaitTime?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionUncheckedUpdateOneWithoutQuestionNestedInput
    numericQuestion?: NumericQuestionUncheckedUpdateOneWithoutQuestionNestedInput
    gameTemplates?: QuestionsInGameTemplateUncheckedUpdateManyWithoutQuestionNestedInput
  }

  export type QuestionCreateManyInput = {
    uid?: string
    title?: string | null
    text: string
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit: number
    excludedFrom?: QuestionCreateexcludedFromInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    feedbackWaitTime?: number | null
    isHidden?: boolean | null
  }

  export type QuestionUpdateManyMutationInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: IntFieldUpdateOperationsInput | number
    excludedFrom?: QuestionUpdateexcludedFromInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedbackWaitTime?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type QuestionUncheckedUpdateManyInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: IntFieldUpdateOperationsInput | number
    excludedFrom?: QuestionUpdateexcludedFromInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedbackWaitTime?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type MultipleChoiceQuestionCreateInput = {
    answerOptions?: MultipleChoiceQuestionCreateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionCreatecorrectAnswersInput | boolean[]
    question: QuestionCreateNestedOneWithoutMultipleChoiceQuestionInput
  }

  export type MultipleChoiceQuestionUncheckedCreateInput = {
    questionUid: string
    answerOptions?: MultipleChoiceQuestionCreateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionCreatecorrectAnswersInput | boolean[]
  }

  export type MultipleChoiceQuestionUpdateInput = {
    answerOptions?: MultipleChoiceQuestionUpdateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionUpdatecorrectAnswersInput | boolean[]
    question?: QuestionUpdateOneRequiredWithoutMultipleChoiceQuestionNestedInput
  }

  export type MultipleChoiceQuestionUncheckedUpdateInput = {
    questionUid?: StringFieldUpdateOperationsInput | string
    answerOptions?: MultipleChoiceQuestionUpdateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionUpdatecorrectAnswersInput | boolean[]
  }

  export type MultipleChoiceQuestionCreateManyInput = {
    questionUid: string
    answerOptions?: MultipleChoiceQuestionCreateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionCreatecorrectAnswersInput | boolean[]
  }

  export type MultipleChoiceQuestionUpdateManyMutationInput = {
    answerOptions?: MultipleChoiceQuestionUpdateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionUpdatecorrectAnswersInput | boolean[]
  }

  export type MultipleChoiceQuestionUncheckedUpdateManyInput = {
    questionUid?: StringFieldUpdateOperationsInput | string
    answerOptions?: MultipleChoiceQuestionUpdateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionUpdatecorrectAnswersInput | boolean[]
  }

  export type NumericQuestionCreateInput = {
    correctAnswer: number
    tolerance?: number | null
    unit?: string | null
    question: QuestionCreateNestedOneWithoutNumericQuestionInput
  }

  export type NumericQuestionUncheckedCreateInput = {
    questionUid: string
    correctAnswer: number
    tolerance?: number | null
    unit?: string | null
  }

  export type NumericQuestionUpdateInput = {
    correctAnswer?: FloatFieldUpdateOperationsInput | number
    tolerance?: NullableFloatFieldUpdateOperationsInput | number | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
    question?: QuestionUpdateOneRequiredWithoutNumericQuestionNestedInput
  }

  export type NumericQuestionUncheckedUpdateInput = {
    questionUid?: StringFieldUpdateOperationsInput | string
    correctAnswer?: FloatFieldUpdateOperationsInput | number
    tolerance?: NullableFloatFieldUpdateOperationsInput | number | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type NumericQuestionCreateManyInput = {
    questionUid: string
    correctAnswer: number
    tolerance?: number | null
    unit?: string | null
  }

  export type NumericQuestionUpdateManyMutationInput = {
    correctAnswer?: FloatFieldUpdateOperationsInput | number
    tolerance?: NullableFloatFieldUpdateOperationsInput | number | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type NumericQuestionUncheckedUpdateManyInput = {
    questionUid?: StringFieldUpdateOperationsInput | string
    correctAnswer?: FloatFieldUpdateOperationsInput | number
    tolerance?: NullableFloatFieldUpdateOperationsInput | number | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type GameTemplateCreateInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: GameTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    gameInstances?: GameInstanceCreateNestedManyWithoutGameTemplateInput
    creator: UserCreateNestedOneWithoutCreatedGameTemplatesInput
    questions?: QuestionsInGameTemplateCreateNestedManyWithoutGameTemplateInput
  }

  export type GameTemplateUncheckedCreateInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: GameTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creatorId: string
    gameInstances?: GameInstanceUncheckedCreateNestedManyWithoutGameTemplateInput
    questions?: QuestionsInGameTemplateUncheckedCreateNestedManyWithoutGameTemplateInput
  }

  export type GameTemplateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameInstances?: GameInstanceUpdateManyWithoutGameTemplateNestedInput
    creator?: UserUpdateOneRequiredWithoutCreatedGameTemplatesNestedInput
    questions?: QuestionsInGameTemplateUpdateManyWithoutGameTemplateNestedInput
  }

  export type GameTemplateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorId?: StringFieldUpdateOperationsInput | string
    gameInstances?: GameInstanceUncheckedUpdateManyWithoutGameTemplateNestedInput
    questions?: QuestionsInGameTemplateUncheckedUpdateManyWithoutGameTemplateNestedInput
  }

  export type GameTemplateCreateManyInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: GameTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creatorId: string
  }

  export type GameTemplateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameTemplateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorId?: StringFieldUpdateOperationsInput | string
  }

  export type QuestionsInGameTemplateCreateInput = {
    sequence: number
    createdAt?: Date | string
    gameTemplate: GameTemplateCreateNestedOneWithoutQuestionsInput
    question: QuestionCreateNestedOneWithoutGameTemplatesInput
  }

  export type QuestionsInGameTemplateUncheckedCreateInput = {
    gameTemplateId: string
    questionUid: string
    sequence: number
    createdAt?: Date | string
  }

  export type QuestionsInGameTemplateUpdateInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameTemplate?: GameTemplateUpdateOneRequiredWithoutQuestionsNestedInput
    question?: QuestionUpdateOneRequiredWithoutGameTemplatesNestedInput
  }

  export type QuestionsInGameTemplateUncheckedUpdateInput = {
    gameTemplateId?: StringFieldUpdateOperationsInput | string
    questionUid?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInGameTemplateCreateManyInput = {
    gameTemplateId: string
    questionUid: string
    sequence: number
    createdAt?: Date | string
  }

  export type QuestionsInGameTemplateUpdateManyMutationInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInGameTemplateUncheckedUpdateManyInput = {
    gameTemplateId?: StringFieldUpdateOperationsInput | string
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    gameTemplate: GameTemplateCreateNestedOneWithoutGameInstancesInput
    initiatorUser?: UserCreateNestedOneWithoutInitiatedGameInstancesInput
    participants?: GameParticipantCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceUncheckedCreateInput = {
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    gameTemplateId: string
    initiatorUserId?: string | null
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameTemplate?: GameTemplateUpdateOneRequiredWithoutGameInstancesNestedInput
    initiatorUser?: UserUpdateOneWithoutInitiatedGameInstancesNestedInput
    participants?: GameParticipantUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceUncheckedUpdateInput = {
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameTemplateId?: StringFieldUpdateOperationsInput | string
    initiatorUserId?: NullableStringFieldUpdateOperationsInput | string | null
    participants?: GameParticipantUncheckedUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceCreateManyInput = {
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    gameTemplateId: string
    initiatorUserId?: string | null
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameInstanceUncheckedUpdateManyInput = {
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameTemplateId?: StringFieldUpdateOperationsInput | string
    initiatorUserId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type GameParticipantCreateInput = {
    id?: string
    liveScore?: number
    deferredScore?: number
    nbAttempts?: number
    status?: $Enums.ParticipantStatus
    joinedAt?: Date | string
    lastActiveAt?: Date | string | null
    completedAt?: Date | string | null
    gameInstance: GameInstanceCreateNestedOneWithoutParticipantsInput
    user: UserCreateNestedOneWithoutGameParticipationsInput
  }

  export type GameParticipantUncheckedCreateInput = {
    id?: string
    gameInstanceId: string
    userId: string
    liveScore?: number
    deferredScore?: number
    nbAttempts?: number
    status?: $Enums.ParticipantStatus
    joinedAt?: Date | string
    lastActiveAt?: Date | string | null
    completedAt?: Date | string | null
  }

  export type GameParticipantUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    liveScore?: IntFieldUpdateOperationsInput | number
    deferredScore?: IntFieldUpdateOperationsInput | number
    nbAttempts?: IntFieldUpdateOperationsInput | number
    status?: EnumParticipantStatusFieldUpdateOperationsInput | $Enums.ParticipantStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActiveAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameInstance?: GameInstanceUpdateOneRequiredWithoutParticipantsNestedInput
    user?: UserUpdateOneRequiredWithoutGameParticipationsNestedInput
  }

  export type GameParticipantUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameInstanceId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    liveScore?: IntFieldUpdateOperationsInput | number
    deferredScore?: IntFieldUpdateOperationsInput | number
    nbAttempts?: IntFieldUpdateOperationsInput | number
    status?: EnumParticipantStatusFieldUpdateOperationsInput | $Enums.ParticipantStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActiveAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameParticipantCreateManyInput = {
    id?: string
    gameInstanceId: string
    userId: string
    liveScore?: number
    deferredScore?: number
    nbAttempts?: number
    status?: $Enums.ParticipantStatus
    joinedAt?: Date | string
    lastActiveAt?: Date | string | null
    completedAt?: Date | string | null
  }

  export type GameParticipantUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    liveScore?: IntFieldUpdateOperationsInput | number
    deferredScore?: IntFieldUpdateOperationsInput | number
    nbAttempts?: IntFieldUpdateOperationsInput | number
    status?: EnumParticipantStatusFieldUpdateOperationsInput | $Enums.ParticipantStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActiveAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameParticipantUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameInstanceId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    liveScore?: IntFieldUpdateOperationsInput | number
    deferredScore?: IntFieldUpdateOperationsInput | number
    nbAttempts?: IntFieldUpdateOperationsInput | number
    status?: EnumParticipantStatusFieldUpdateOperationsInput | $Enums.ParticipantStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActiveAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
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

  export type EnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
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

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type StudentProfileNullableScalarRelationFilter = {
    is?: StudentProfileWhereInput | null
    isNot?: StudentProfileWhereInput | null
  }

  export type TeacherProfileNullableScalarRelationFilter = {
    is?: TeacherProfileWhereInput | null
    isNot?: TeacherProfileWhereInput | null
  }

  export type GameInstanceListRelationFilter = {
    every?: GameInstanceWhereInput
    some?: GameInstanceWhereInput
    none?: GameInstanceWhereInput
  }

  export type GameParticipantListRelationFilter = {
    every?: GameParticipantWhereInput
    some?: GameParticipantWhereInput
    none?: GameParticipantWhereInput
  }

  export type GameTemplateListRelationFilter = {
    every?: GameTemplateWhereInput
    some?: GameTemplateWhereInput
    none?: GameTemplateWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type GameInstanceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GameParticipantOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GameTemplateOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
    role?: SortOrder
    resetToken?: SortOrder
    resetTokenExpiresAt?: SortOrder
    avatarEmoji?: SortOrder
    emailVerificationToken?: SortOrder
    emailVerificationTokenExpiresAt?: SortOrder
    emailVerified?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
    role?: SortOrder
    resetToken?: SortOrder
    resetTokenExpiresAt?: SortOrder
    avatarEmoji?: SortOrder
    emailVerificationToken?: SortOrder
    emailVerificationTokenExpiresAt?: SortOrder
    emailVerified?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
    role?: SortOrder
    resetToken?: SortOrder
    resetTokenExpiresAt?: SortOrder
    avatarEmoji?: SortOrder
    emailVerificationToken?: SortOrder
    emailVerificationTokenExpiresAt?: SortOrder
    emailVerified?: SortOrder
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

  export type EnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
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

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type TeacherProfileCountOrderByAggregateInput = {
    id?: SortOrder
  }

  export type TeacherProfileMaxOrderByAggregateInput = {
    id?: SortOrder
  }

  export type TeacherProfileMinOrderByAggregateInput = {
    id?: SortOrder
  }

  export type StudentProfileCountOrderByAggregateInput = {
    id?: SortOrder
    cookieId?: SortOrder
  }

  export type StudentProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    cookieId?: SortOrder
  }

  export type StudentProfileMinOrderByAggregateInput = {
    id?: SortOrder
    cookieId?: SortOrder
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

  export type MultipleChoiceQuestionNullableScalarRelationFilter = {
    is?: MultipleChoiceQuestionWhereInput | null
    isNot?: MultipleChoiceQuestionWhereInput | null
  }

  export type NumericQuestionNullableScalarRelationFilter = {
    is?: NumericQuestionWhereInput | null
    isNot?: NumericQuestionWhereInput | null
  }

  export type QuestionsInGameTemplateListRelationFilter = {
    every?: QuestionsInGameTemplateWhereInput
    some?: QuestionsInGameTemplateWhereInput
    none?: QuestionsInGameTemplateWhereInput
  }

  export type QuestionsInGameTemplateOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuestionCountOrderByAggregateInput = {
    uid?: SortOrder
    title?: SortOrder
    text?: SortOrder
    questionType?: SortOrder
    discipline?: SortOrder
    themes?: SortOrder
    difficulty?: SortOrder
    gradeLevel?: SortOrder
    author?: SortOrder
    explanation?: SortOrder
    tags?: SortOrder
    timeLimit?: SortOrder
    excludedFrom?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    feedbackWaitTime?: SortOrder
    isHidden?: SortOrder
  }

  export type QuestionAvgOrderByAggregateInput = {
    difficulty?: SortOrder
    timeLimit?: SortOrder
    feedbackWaitTime?: SortOrder
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
    createdAt?: SortOrder
    updatedAt?: SortOrder
    feedbackWaitTime?: SortOrder
    isHidden?: SortOrder
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
    createdAt?: SortOrder
    updatedAt?: SortOrder
    feedbackWaitTime?: SortOrder
    isHidden?: SortOrder
  }

  export type QuestionSumOrderByAggregateInput = {
    difficulty?: SortOrder
    timeLimit?: SortOrder
    feedbackWaitTime?: SortOrder
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

  export type BoolNullableListFilter<$PrismaModel = never> = {
    equals?: boolean[] | ListBooleanFieldRefInput<$PrismaModel> | null
    has?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    hasEvery?: boolean[] | ListBooleanFieldRefInput<$PrismaModel>
    hasSome?: boolean[] | ListBooleanFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type QuestionScalarRelationFilter = {
    is?: QuestionWhereInput
    isNot?: QuestionWhereInput
  }

  export type MultipleChoiceQuestionCountOrderByAggregateInput = {
    questionUid?: SortOrder
    answerOptions?: SortOrder
    correctAnswers?: SortOrder
  }

  export type MultipleChoiceQuestionMaxOrderByAggregateInput = {
    questionUid?: SortOrder
  }

  export type MultipleChoiceQuestionMinOrderByAggregateInput = {
    questionUid?: SortOrder
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NumericQuestionCountOrderByAggregateInput = {
    questionUid?: SortOrder
    correctAnswer?: SortOrder
    tolerance?: SortOrder
    unit?: SortOrder
  }

  export type NumericQuestionAvgOrderByAggregateInput = {
    correctAnswer?: SortOrder
    tolerance?: SortOrder
  }

  export type NumericQuestionMaxOrderByAggregateInput = {
    questionUid?: SortOrder
    correctAnswer?: SortOrder
    tolerance?: SortOrder
    unit?: SortOrder
  }

  export type NumericQuestionMinOrderByAggregateInput = {
    questionUid?: SortOrder
    correctAnswer?: SortOrder
    tolerance?: SortOrder
    unit?: SortOrder
  }

  export type NumericQuestionSumOrderByAggregateInput = {
    correctAnswer?: SortOrder
    tolerance?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type EnumPlayModeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayMode | EnumPlayModeFieldRefInput<$PrismaModel> | null
    in?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.PlayMode[] | ListEnumPlayModeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumPlayModeNullableFilter<$PrismaModel> | $Enums.PlayMode | null
  }

  export type GameTemplateCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    gradeLevel?: SortOrder
    themes?: SortOrder
    discipline?: SortOrder
    description?: SortOrder
    defaultMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creatorId?: SortOrder
  }

  export type GameTemplateMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    gradeLevel?: SortOrder
    discipline?: SortOrder
    description?: SortOrder
    defaultMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creatorId?: SortOrder
  }

  export type GameTemplateMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    gradeLevel?: SortOrder
    discipline?: SortOrder
    description?: SortOrder
    defaultMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creatorId?: SortOrder
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

  export type GameTemplateScalarRelationFilter = {
    is?: GameTemplateWhereInput
    isNot?: GameTemplateWhereInput
  }

  export type QuestionsInGameTemplateGameTemplateIdQuestionUidCompoundUniqueInput = {
    gameTemplateId: string
    questionUid: string
  }

  export type QuestionsInGameTemplateGameTemplateIdSequenceCompoundUniqueInput = {
    gameTemplateId: string
    sequence: number
  }

  export type QuestionsInGameTemplateCountOrderByAggregateInput = {
    gameTemplateId?: SortOrder
    questionUid?: SortOrder
    sequence?: SortOrder
    createdAt?: SortOrder
  }

  export type QuestionsInGameTemplateAvgOrderByAggregateInput = {
    sequence?: SortOrder
  }

  export type QuestionsInGameTemplateMaxOrderByAggregateInput = {
    gameTemplateId?: SortOrder
    questionUid?: SortOrder
    sequence?: SortOrder
    createdAt?: SortOrder
  }

  export type QuestionsInGameTemplateMinOrderByAggregateInput = {
    gameTemplateId?: SortOrder
    questionUid?: SortOrder
    sequence?: SortOrder
    createdAt?: SortOrder
  }

  export type QuestionsInGameTemplateSumOrderByAggregateInput = {
    sequence?: SortOrder
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

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type GameInstanceCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    accessCode?: SortOrder
    status?: SortOrder
    playMode?: SortOrder
    leaderboard?: SortOrder
    currentQuestionIndex?: SortOrder
    settings?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    differedAvailableFrom?: SortOrder
    differedAvailableTo?: SortOrder
    gameTemplateId?: SortOrder
    initiatorUserId?: SortOrder
  }

  export type GameInstanceAvgOrderByAggregateInput = {
    currentQuestionIndex?: SortOrder
  }

  export type GameInstanceMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    accessCode?: SortOrder
    status?: SortOrder
    playMode?: SortOrder
    currentQuestionIndex?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    differedAvailableFrom?: SortOrder
    differedAvailableTo?: SortOrder
    gameTemplateId?: SortOrder
    initiatorUserId?: SortOrder
  }

  export type GameInstanceMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    accessCode?: SortOrder
    status?: SortOrder
    playMode?: SortOrder
    currentQuestionIndex?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    differedAvailableFrom?: SortOrder
    differedAvailableTo?: SortOrder
    gameTemplateId?: SortOrder
    initiatorUserId?: SortOrder
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

  export type EnumParticipantStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ParticipantStatus | EnumParticipantStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ParticipantStatus[] | ListEnumParticipantStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ParticipantStatus[] | ListEnumParticipantStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumParticipantStatusFilter<$PrismaModel> | $Enums.ParticipantStatus
  }

  export type GameInstanceScalarRelationFilter = {
    is?: GameInstanceWhereInput
    isNot?: GameInstanceWhereInput
  }

  export type GameParticipantGameInstanceIdUserIdCompoundUniqueInput = {
    gameInstanceId: string
    userId: string
  }

  export type GameParticipantCountOrderByAggregateInput = {
    id?: SortOrder
    gameInstanceId?: SortOrder
    userId?: SortOrder
    liveScore?: SortOrder
    deferredScore?: SortOrder
    nbAttempts?: SortOrder
    status?: SortOrder
    joinedAt?: SortOrder
    lastActiveAt?: SortOrder
    completedAt?: SortOrder
  }

  export type GameParticipantAvgOrderByAggregateInput = {
    liveScore?: SortOrder
    deferredScore?: SortOrder
    nbAttempts?: SortOrder
  }

  export type GameParticipantMaxOrderByAggregateInput = {
    id?: SortOrder
    gameInstanceId?: SortOrder
    userId?: SortOrder
    liveScore?: SortOrder
    deferredScore?: SortOrder
    nbAttempts?: SortOrder
    status?: SortOrder
    joinedAt?: SortOrder
    lastActiveAt?: SortOrder
    completedAt?: SortOrder
  }

  export type GameParticipantMinOrderByAggregateInput = {
    id?: SortOrder
    gameInstanceId?: SortOrder
    userId?: SortOrder
    liveScore?: SortOrder
    deferredScore?: SortOrder
    nbAttempts?: SortOrder
    status?: SortOrder
    joinedAt?: SortOrder
    lastActiveAt?: SortOrder
    completedAt?: SortOrder
  }

  export type GameParticipantSumOrderByAggregateInput = {
    liveScore?: SortOrder
    deferredScore?: SortOrder
    nbAttempts?: SortOrder
  }

  export type EnumParticipantStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ParticipantStatus | EnumParticipantStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ParticipantStatus[] | ListEnumParticipantStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ParticipantStatus[] | ListEnumParticipantStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumParticipantStatusWithAggregatesFilter<$PrismaModel> | $Enums.ParticipantStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumParticipantStatusFilter<$PrismaModel>
    _max?: NestedEnumParticipantStatusFilter<$PrismaModel>
  }

  export type StudentProfileCreateNestedOneWithoutUserInput = {
    create?: XOR<StudentProfileCreateWithoutUserInput, StudentProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: StudentProfileCreateOrConnectWithoutUserInput
    connect?: StudentProfileWhereUniqueInput
  }

  export type TeacherProfileCreateNestedOneWithoutUserInput = {
    create?: XOR<TeacherProfileCreateWithoutUserInput, TeacherProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: TeacherProfileCreateOrConnectWithoutUserInput
    connect?: TeacherProfileWhereUniqueInput
  }

  export type GameInstanceCreateNestedManyWithoutInitiatorUserInput = {
    create?: XOR<GameInstanceCreateWithoutInitiatorUserInput, GameInstanceUncheckedCreateWithoutInitiatorUserInput> | GameInstanceCreateWithoutInitiatorUserInput[] | GameInstanceUncheckedCreateWithoutInitiatorUserInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutInitiatorUserInput | GameInstanceCreateOrConnectWithoutInitiatorUserInput[]
    createMany?: GameInstanceCreateManyInitiatorUserInputEnvelope
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
  }

  export type GameParticipantCreateNestedManyWithoutUserInput = {
    create?: XOR<GameParticipantCreateWithoutUserInput, GameParticipantUncheckedCreateWithoutUserInput> | GameParticipantCreateWithoutUserInput[] | GameParticipantUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutUserInput | GameParticipantCreateOrConnectWithoutUserInput[]
    createMany?: GameParticipantCreateManyUserInputEnvelope
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
  }

  export type GameTemplateCreateNestedManyWithoutCreatorInput = {
    create?: XOR<GameTemplateCreateWithoutCreatorInput, GameTemplateUncheckedCreateWithoutCreatorInput> | GameTemplateCreateWithoutCreatorInput[] | GameTemplateUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: GameTemplateCreateOrConnectWithoutCreatorInput | GameTemplateCreateOrConnectWithoutCreatorInput[]
    createMany?: GameTemplateCreateManyCreatorInputEnvelope
    connect?: GameTemplateWhereUniqueInput | GameTemplateWhereUniqueInput[]
  }

  export type StudentProfileUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<StudentProfileCreateWithoutUserInput, StudentProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: StudentProfileCreateOrConnectWithoutUserInput
    connect?: StudentProfileWhereUniqueInput
  }

  export type TeacherProfileUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<TeacherProfileCreateWithoutUserInput, TeacherProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: TeacherProfileCreateOrConnectWithoutUserInput
    connect?: TeacherProfileWhereUniqueInput
  }

  export type GameInstanceUncheckedCreateNestedManyWithoutInitiatorUserInput = {
    create?: XOR<GameInstanceCreateWithoutInitiatorUserInput, GameInstanceUncheckedCreateWithoutInitiatorUserInput> | GameInstanceCreateWithoutInitiatorUserInput[] | GameInstanceUncheckedCreateWithoutInitiatorUserInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutInitiatorUserInput | GameInstanceCreateOrConnectWithoutInitiatorUserInput[]
    createMany?: GameInstanceCreateManyInitiatorUserInputEnvelope
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
  }

  export type GameParticipantUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<GameParticipantCreateWithoutUserInput, GameParticipantUncheckedCreateWithoutUserInput> | GameParticipantCreateWithoutUserInput[] | GameParticipantUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutUserInput | GameParticipantCreateOrConnectWithoutUserInput[]
    createMany?: GameParticipantCreateManyUserInputEnvelope
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
  }

  export type GameTemplateUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<GameTemplateCreateWithoutCreatorInput, GameTemplateUncheckedCreateWithoutCreatorInput> | GameTemplateCreateWithoutCreatorInput[] | GameTemplateUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: GameTemplateCreateOrConnectWithoutCreatorInput | GameTemplateCreateOrConnectWithoutCreatorInput[]
    createMany?: GameTemplateCreateManyCreatorInputEnvelope
    connect?: GameTemplateWhereUniqueInput | GameTemplateWhereUniqueInput[]
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

  export type EnumUserRoleFieldUpdateOperationsInput = {
    set?: $Enums.UserRole
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type StudentProfileUpdateOneWithoutUserNestedInput = {
    create?: XOR<StudentProfileCreateWithoutUserInput, StudentProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: StudentProfileCreateOrConnectWithoutUserInput
    upsert?: StudentProfileUpsertWithoutUserInput
    disconnect?: StudentProfileWhereInput | boolean
    delete?: StudentProfileWhereInput | boolean
    connect?: StudentProfileWhereUniqueInput
    update?: XOR<XOR<StudentProfileUpdateToOneWithWhereWithoutUserInput, StudentProfileUpdateWithoutUserInput>, StudentProfileUncheckedUpdateWithoutUserInput>
  }

  export type TeacherProfileUpdateOneWithoutUserNestedInput = {
    create?: XOR<TeacherProfileCreateWithoutUserInput, TeacherProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: TeacherProfileCreateOrConnectWithoutUserInput
    upsert?: TeacherProfileUpsertWithoutUserInput
    disconnect?: TeacherProfileWhereInput | boolean
    delete?: TeacherProfileWhereInput | boolean
    connect?: TeacherProfileWhereUniqueInput
    update?: XOR<XOR<TeacherProfileUpdateToOneWithWhereWithoutUserInput, TeacherProfileUpdateWithoutUserInput>, TeacherProfileUncheckedUpdateWithoutUserInput>
  }

  export type GameInstanceUpdateManyWithoutInitiatorUserNestedInput = {
    create?: XOR<GameInstanceCreateWithoutInitiatorUserInput, GameInstanceUncheckedCreateWithoutInitiatorUserInput> | GameInstanceCreateWithoutInitiatorUserInput[] | GameInstanceUncheckedCreateWithoutInitiatorUserInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutInitiatorUserInput | GameInstanceCreateOrConnectWithoutInitiatorUserInput[]
    upsert?: GameInstanceUpsertWithWhereUniqueWithoutInitiatorUserInput | GameInstanceUpsertWithWhereUniqueWithoutInitiatorUserInput[]
    createMany?: GameInstanceCreateManyInitiatorUserInputEnvelope
    set?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    disconnect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    delete?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    update?: GameInstanceUpdateWithWhereUniqueWithoutInitiatorUserInput | GameInstanceUpdateWithWhereUniqueWithoutInitiatorUserInput[]
    updateMany?: GameInstanceUpdateManyWithWhereWithoutInitiatorUserInput | GameInstanceUpdateManyWithWhereWithoutInitiatorUserInput[]
    deleteMany?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
  }

  export type GameParticipantUpdateManyWithoutUserNestedInput = {
    create?: XOR<GameParticipantCreateWithoutUserInput, GameParticipantUncheckedCreateWithoutUserInput> | GameParticipantCreateWithoutUserInput[] | GameParticipantUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutUserInput | GameParticipantCreateOrConnectWithoutUserInput[]
    upsert?: GameParticipantUpsertWithWhereUniqueWithoutUserInput | GameParticipantUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: GameParticipantCreateManyUserInputEnvelope
    set?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    disconnect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    delete?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    update?: GameParticipantUpdateWithWhereUniqueWithoutUserInput | GameParticipantUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: GameParticipantUpdateManyWithWhereWithoutUserInput | GameParticipantUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: GameParticipantScalarWhereInput | GameParticipantScalarWhereInput[]
  }

  export type GameTemplateUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<GameTemplateCreateWithoutCreatorInput, GameTemplateUncheckedCreateWithoutCreatorInput> | GameTemplateCreateWithoutCreatorInput[] | GameTemplateUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: GameTemplateCreateOrConnectWithoutCreatorInput | GameTemplateCreateOrConnectWithoutCreatorInput[]
    upsert?: GameTemplateUpsertWithWhereUniqueWithoutCreatorInput | GameTemplateUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: GameTemplateCreateManyCreatorInputEnvelope
    set?: GameTemplateWhereUniqueInput | GameTemplateWhereUniqueInput[]
    disconnect?: GameTemplateWhereUniqueInput | GameTemplateWhereUniqueInput[]
    delete?: GameTemplateWhereUniqueInput | GameTemplateWhereUniqueInput[]
    connect?: GameTemplateWhereUniqueInput | GameTemplateWhereUniqueInput[]
    update?: GameTemplateUpdateWithWhereUniqueWithoutCreatorInput | GameTemplateUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: GameTemplateUpdateManyWithWhereWithoutCreatorInput | GameTemplateUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: GameTemplateScalarWhereInput | GameTemplateScalarWhereInput[]
  }

  export type StudentProfileUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<StudentProfileCreateWithoutUserInput, StudentProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: StudentProfileCreateOrConnectWithoutUserInput
    upsert?: StudentProfileUpsertWithoutUserInput
    disconnect?: StudentProfileWhereInput | boolean
    delete?: StudentProfileWhereInput | boolean
    connect?: StudentProfileWhereUniqueInput
    update?: XOR<XOR<StudentProfileUpdateToOneWithWhereWithoutUserInput, StudentProfileUpdateWithoutUserInput>, StudentProfileUncheckedUpdateWithoutUserInput>
  }

  export type TeacherProfileUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<TeacherProfileCreateWithoutUserInput, TeacherProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: TeacherProfileCreateOrConnectWithoutUserInput
    upsert?: TeacherProfileUpsertWithoutUserInput
    disconnect?: TeacherProfileWhereInput | boolean
    delete?: TeacherProfileWhereInput | boolean
    connect?: TeacherProfileWhereUniqueInput
    update?: XOR<XOR<TeacherProfileUpdateToOneWithWhereWithoutUserInput, TeacherProfileUpdateWithoutUserInput>, TeacherProfileUncheckedUpdateWithoutUserInput>
  }

  export type GameInstanceUncheckedUpdateManyWithoutInitiatorUserNestedInput = {
    create?: XOR<GameInstanceCreateWithoutInitiatorUserInput, GameInstanceUncheckedCreateWithoutInitiatorUserInput> | GameInstanceCreateWithoutInitiatorUserInput[] | GameInstanceUncheckedCreateWithoutInitiatorUserInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutInitiatorUserInput | GameInstanceCreateOrConnectWithoutInitiatorUserInput[]
    upsert?: GameInstanceUpsertWithWhereUniqueWithoutInitiatorUserInput | GameInstanceUpsertWithWhereUniqueWithoutInitiatorUserInput[]
    createMany?: GameInstanceCreateManyInitiatorUserInputEnvelope
    set?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    disconnect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    delete?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    update?: GameInstanceUpdateWithWhereUniqueWithoutInitiatorUserInput | GameInstanceUpdateWithWhereUniqueWithoutInitiatorUserInput[]
    updateMany?: GameInstanceUpdateManyWithWhereWithoutInitiatorUserInput | GameInstanceUpdateManyWithWhereWithoutInitiatorUserInput[]
    deleteMany?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
  }

  export type GameParticipantUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<GameParticipantCreateWithoutUserInput, GameParticipantUncheckedCreateWithoutUserInput> | GameParticipantCreateWithoutUserInput[] | GameParticipantUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GameParticipantCreateOrConnectWithoutUserInput | GameParticipantCreateOrConnectWithoutUserInput[]
    upsert?: GameParticipantUpsertWithWhereUniqueWithoutUserInput | GameParticipantUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: GameParticipantCreateManyUserInputEnvelope
    set?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    disconnect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    delete?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    connect?: GameParticipantWhereUniqueInput | GameParticipantWhereUniqueInput[]
    update?: GameParticipantUpdateWithWhereUniqueWithoutUserInput | GameParticipantUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: GameParticipantUpdateManyWithWhereWithoutUserInput | GameParticipantUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: GameParticipantScalarWhereInput | GameParticipantScalarWhereInput[]
  }

  export type GameTemplateUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<GameTemplateCreateWithoutCreatorInput, GameTemplateUncheckedCreateWithoutCreatorInput> | GameTemplateCreateWithoutCreatorInput[] | GameTemplateUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: GameTemplateCreateOrConnectWithoutCreatorInput | GameTemplateCreateOrConnectWithoutCreatorInput[]
    upsert?: GameTemplateUpsertWithWhereUniqueWithoutCreatorInput | GameTemplateUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: GameTemplateCreateManyCreatorInputEnvelope
    set?: GameTemplateWhereUniqueInput | GameTemplateWhereUniqueInput[]
    disconnect?: GameTemplateWhereUniqueInput | GameTemplateWhereUniqueInput[]
    delete?: GameTemplateWhereUniqueInput | GameTemplateWhereUniqueInput[]
    connect?: GameTemplateWhereUniqueInput | GameTemplateWhereUniqueInput[]
    update?: GameTemplateUpdateWithWhereUniqueWithoutCreatorInput | GameTemplateUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: GameTemplateUpdateManyWithWhereWithoutCreatorInput | GameTemplateUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: GameTemplateScalarWhereInput | GameTemplateScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutTeacherProfileInput = {
    create?: XOR<UserCreateWithoutTeacherProfileInput, UserUncheckedCreateWithoutTeacherProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutTeacherProfileInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutTeacherProfileNestedInput = {
    create?: XOR<UserCreateWithoutTeacherProfileInput, UserUncheckedCreateWithoutTeacherProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutTeacherProfileInput
    upsert?: UserUpsertWithoutTeacherProfileInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTeacherProfileInput, UserUpdateWithoutTeacherProfileInput>, UserUncheckedUpdateWithoutTeacherProfileInput>
  }

  export type UserCreateNestedOneWithoutStudentProfileInput = {
    create?: XOR<UserCreateWithoutStudentProfileInput, UserUncheckedCreateWithoutStudentProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutStudentProfileInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutStudentProfileNestedInput = {
    create?: XOR<UserCreateWithoutStudentProfileInput, UserUncheckedCreateWithoutStudentProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutStudentProfileInput
    upsert?: UserUpsertWithoutStudentProfileInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutStudentProfileInput, UserUpdateWithoutStudentProfileInput>, UserUncheckedUpdateWithoutStudentProfileInput>
  }

  export type QuestionCreatethemesInput = {
    set: string[]
  }

  export type QuestionCreatetagsInput = {
    set: string[]
  }

  export type QuestionCreateexcludedFromInput = {
    set: string[]
  }

  export type MultipleChoiceQuestionCreateNestedOneWithoutQuestionInput = {
    create?: XOR<MultipleChoiceQuestionCreateWithoutQuestionInput, MultipleChoiceQuestionUncheckedCreateWithoutQuestionInput>
    connectOrCreate?: MultipleChoiceQuestionCreateOrConnectWithoutQuestionInput
    connect?: MultipleChoiceQuestionWhereUniqueInput
  }

  export type NumericQuestionCreateNestedOneWithoutQuestionInput = {
    create?: XOR<NumericQuestionCreateWithoutQuestionInput, NumericQuestionUncheckedCreateWithoutQuestionInput>
    connectOrCreate?: NumericQuestionCreateOrConnectWithoutQuestionInput
    connect?: NumericQuestionWhereUniqueInput
  }

  export type QuestionsInGameTemplateCreateNestedManyWithoutQuestionInput = {
    create?: XOR<QuestionsInGameTemplateCreateWithoutQuestionInput, QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput> | QuestionsInGameTemplateCreateWithoutQuestionInput[] | QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: QuestionsInGameTemplateCreateOrConnectWithoutQuestionInput | QuestionsInGameTemplateCreateOrConnectWithoutQuestionInput[]
    createMany?: QuestionsInGameTemplateCreateManyQuestionInputEnvelope
    connect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
  }

  export type MultipleChoiceQuestionUncheckedCreateNestedOneWithoutQuestionInput = {
    create?: XOR<MultipleChoiceQuestionCreateWithoutQuestionInput, MultipleChoiceQuestionUncheckedCreateWithoutQuestionInput>
    connectOrCreate?: MultipleChoiceQuestionCreateOrConnectWithoutQuestionInput
    connect?: MultipleChoiceQuestionWhereUniqueInput
  }

  export type NumericQuestionUncheckedCreateNestedOneWithoutQuestionInput = {
    create?: XOR<NumericQuestionCreateWithoutQuestionInput, NumericQuestionUncheckedCreateWithoutQuestionInput>
    connectOrCreate?: NumericQuestionCreateOrConnectWithoutQuestionInput
    connect?: NumericQuestionWhereUniqueInput
  }

  export type QuestionsInGameTemplateUncheckedCreateNestedManyWithoutQuestionInput = {
    create?: XOR<QuestionsInGameTemplateCreateWithoutQuestionInput, QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput> | QuestionsInGameTemplateCreateWithoutQuestionInput[] | QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: QuestionsInGameTemplateCreateOrConnectWithoutQuestionInput | QuestionsInGameTemplateCreateOrConnectWithoutQuestionInput[]
    createMany?: QuestionsInGameTemplateCreateManyQuestionInputEnvelope
    connect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
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

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type QuestionUpdateexcludedFromInput = {
    set?: string[]
    push?: string | string[]
  }

  export type MultipleChoiceQuestionUpdateOneWithoutQuestionNestedInput = {
    create?: XOR<MultipleChoiceQuestionCreateWithoutQuestionInput, MultipleChoiceQuestionUncheckedCreateWithoutQuestionInput>
    connectOrCreate?: MultipleChoiceQuestionCreateOrConnectWithoutQuestionInput
    upsert?: MultipleChoiceQuestionUpsertWithoutQuestionInput
    disconnect?: MultipleChoiceQuestionWhereInput | boolean
    delete?: MultipleChoiceQuestionWhereInput | boolean
    connect?: MultipleChoiceQuestionWhereUniqueInput
    update?: XOR<XOR<MultipleChoiceQuestionUpdateToOneWithWhereWithoutQuestionInput, MultipleChoiceQuestionUpdateWithoutQuestionInput>, MultipleChoiceQuestionUncheckedUpdateWithoutQuestionInput>
  }

  export type NumericQuestionUpdateOneWithoutQuestionNestedInput = {
    create?: XOR<NumericQuestionCreateWithoutQuestionInput, NumericQuestionUncheckedCreateWithoutQuestionInput>
    connectOrCreate?: NumericQuestionCreateOrConnectWithoutQuestionInput
    upsert?: NumericQuestionUpsertWithoutQuestionInput
    disconnect?: NumericQuestionWhereInput | boolean
    delete?: NumericQuestionWhereInput | boolean
    connect?: NumericQuestionWhereUniqueInput
    update?: XOR<XOR<NumericQuestionUpdateToOneWithWhereWithoutQuestionInput, NumericQuestionUpdateWithoutQuestionInput>, NumericQuestionUncheckedUpdateWithoutQuestionInput>
  }

  export type QuestionsInGameTemplateUpdateManyWithoutQuestionNestedInput = {
    create?: XOR<QuestionsInGameTemplateCreateWithoutQuestionInput, QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput> | QuestionsInGameTemplateCreateWithoutQuestionInput[] | QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: QuestionsInGameTemplateCreateOrConnectWithoutQuestionInput | QuestionsInGameTemplateCreateOrConnectWithoutQuestionInput[]
    upsert?: QuestionsInGameTemplateUpsertWithWhereUniqueWithoutQuestionInput | QuestionsInGameTemplateUpsertWithWhereUniqueWithoutQuestionInput[]
    createMany?: QuestionsInGameTemplateCreateManyQuestionInputEnvelope
    set?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    disconnect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    delete?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    connect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    update?: QuestionsInGameTemplateUpdateWithWhereUniqueWithoutQuestionInput | QuestionsInGameTemplateUpdateWithWhereUniqueWithoutQuestionInput[]
    updateMany?: QuestionsInGameTemplateUpdateManyWithWhereWithoutQuestionInput | QuestionsInGameTemplateUpdateManyWithWhereWithoutQuestionInput[]
    deleteMany?: QuestionsInGameTemplateScalarWhereInput | QuestionsInGameTemplateScalarWhereInput[]
  }

  export type MultipleChoiceQuestionUncheckedUpdateOneWithoutQuestionNestedInput = {
    create?: XOR<MultipleChoiceQuestionCreateWithoutQuestionInput, MultipleChoiceQuestionUncheckedCreateWithoutQuestionInput>
    connectOrCreate?: MultipleChoiceQuestionCreateOrConnectWithoutQuestionInput
    upsert?: MultipleChoiceQuestionUpsertWithoutQuestionInput
    disconnect?: MultipleChoiceQuestionWhereInput | boolean
    delete?: MultipleChoiceQuestionWhereInput | boolean
    connect?: MultipleChoiceQuestionWhereUniqueInput
    update?: XOR<XOR<MultipleChoiceQuestionUpdateToOneWithWhereWithoutQuestionInput, MultipleChoiceQuestionUpdateWithoutQuestionInput>, MultipleChoiceQuestionUncheckedUpdateWithoutQuestionInput>
  }

  export type NumericQuestionUncheckedUpdateOneWithoutQuestionNestedInput = {
    create?: XOR<NumericQuestionCreateWithoutQuestionInput, NumericQuestionUncheckedCreateWithoutQuestionInput>
    connectOrCreate?: NumericQuestionCreateOrConnectWithoutQuestionInput
    upsert?: NumericQuestionUpsertWithoutQuestionInput
    disconnect?: NumericQuestionWhereInput | boolean
    delete?: NumericQuestionWhereInput | boolean
    connect?: NumericQuestionWhereUniqueInput
    update?: XOR<XOR<NumericQuestionUpdateToOneWithWhereWithoutQuestionInput, NumericQuestionUpdateWithoutQuestionInput>, NumericQuestionUncheckedUpdateWithoutQuestionInput>
  }

  export type QuestionsInGameTemplateUncheckedUpdateManyWithoutQuestionNestedInput = {
    create?: XOR<QuestionsInGameTemplateCreateWithoutQuestionInput, QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput> | QuestionsInGameTemplateCreateWithoutQuestionInput[] | QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput[]
    connectOrCreate?: QuestionsInGameTemplateCreateOrConnectWithoutQuestionInput | QuestionsInGameTemplateCreateOrConnectWithoutQuestionInput[]
    upsert?: QuestionsInGameTemplateUpsertWithWhereUniqueWithoutQuestionInput | QuestionsInGameTemplateUpsertWithWhereUniqueWithoutQuestionInput[]
    createMany?: QuestionsInGameTemplateCreateManyQuestionInputEnvelope
    set?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    disconnect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    delete?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    connect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    update?: QuestionsInGameTemplateUpdateWithWhereUniqueWithoutQuestionInput | QuestionsInGameTemplateUpdateWithWhereUniqueWithoutQuestionInput[]
    updateMany?: QuestionsInGameTemplateUpdateManyWithWhereWithoutQuestionInput | QuestionsInGameTemplateUpdateManyWithWhereWithoutQuestionInput[]
    deleteMany?: QuestionsInGameTemplateScalarWhereInput | QuestionsInGameTemplateScalarWhereInput[]
  }

  export type MultipleChoiceQuestionCreateanswerOptionsInput = {
    set: string[]
  }

  export type MultipleChoiceQuestionCreatecorrectAnswersInput = {
    set: boolean[]
  }

  export type QuestionCreateNestedOneWithoutMultipleChoiceQuestionInput = {
    create?: XOR<QuestionCreateWithoutMultipleChoiceQuestionInput, QuestionUncheckedCreateWithoutMultipleChoiceQuestionInput>
    connectOrCreate?: QuestionCreateOrConnectWithoutMultipleChoiceQuestionInput
    connect?: QuestionWhereUniqueInput
  }

  export type MultipleChoiceQuestionUpdateanswerOptionsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type MultipleChoiceQuestionUpdatecorrectAnswersInput = {
    set?: boolean[]
    push?: boolean | boolean[]
  }

  export type QuestionUpdateOneRequiredWithoutMultipleChoiceQuestionNestedInput = {
    create?: XOR<QuestionCreateWithoutMultipleChoiceQuestionInput, QuestionUncheckedCreateWithoutMultipleChoiceQuestionInput>
    connectOrCreate?: QuestionCreateOrConnectWithoutMultipleChoiceQuestionInput
    upsert?: QuestionUpsertWithoutMultipleChoiceQuestionInput
    connect?: QuestionWhereUniqueInput
    update?: XOR<XOR<QuestionUpdateToOneWithWhereWithoutMultipleChoiceQuestionInput, QuestionUpdateWithoutMultipleChoiceQuestionInput>, QuestionUncheckedUpdateWithoutMultipleChoiceQuestionInput>
  }

  export type QuestionCreateNestedOneWithoutNumericQuestionInput = {
    create?: XOR<QuestionCreateWithoutNumericQuestionInput, QuestionUncheckedCreateWithoutNumericQuestionInput>
    connectOrCreate?: QuestionCreateOrConnectWithoutNumericQuestionInput
    connect?: QuestionWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type QuestionUpdateOneRequiredWithoutNumericQuestionNestedInput = {
    create?: XOR<QuestionCreateWithoutNumericQuestionInput, QuestionUncheckedCreateWithoutNumericQuestionInput>
    connectOrCreate?: QuestionCreateOrConnectWithoutNumericQuestionInput
    upsert?: QuestionUpsertWithoutNumericQuestionInput
    connect?: QuestionWhereUniqueInput
    update?: XOR<XOR<QuestionUpdateToOneWithWhereWithoutNumericQuestionInput, QuestionUpdateWithoutNumericQuestionInput>, QuestionUncheckedUpdateWithoutNumericQuestionInput>
  }

  export type GameTemplateCreatethemesInput = {
    set: string[]
  }

  export type GameInstanceCreateNestedManyWithoutGameTemplateInput = {
    create?: XOR<GameInstanceCreateWithoutGameTemplateInput, GameInstanceUncheckedCreateWithoutGameTemplateInput> | GameInstanceCreateWithoutGameTemplateInput[] | GameInstanceUncheckedCreateWithoutGameTemplateInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutGameTemplateInput | GameInstanceCreateOrConnectWithoutGameTemplateInput[]
    createMany?: GameInstanceCreateManyGameTemplateInputEnvelope
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
  }

  export type UserCreateNestedOneWithoutCreatedGameTemplatesInput = {
    create?: XOR<UserCreateWithoutCreatedGameTemplatesInput, UserUncheckedCreateWithoutCreatedGameTemplatesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCreatedGameTemplatesInput
    connect?: UserWhereUniqueInput
  }

  export type QuestionsInGameTemplateCreateNestedManyWithoutGameTemplateInput = {
    create?: XOR<QuestionsInGameTemplateCreateWithoutGameTemplateInput, QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput> | QuestionsInGameTemplateCreateWithoutGameTemplateInput[] | QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput[]
    connectOrCreate?: QuestionsInGameTemplateCreateOrConnectWithoutGameTemplateInput | QuestionsInGameTemplateCreateOrConnectWithoutGameTemplateInput[]
    createMany?: QuestionsInGameTemplateCreateManyGameTemplateInputEnvelope
    connect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
  }

  export type GameInstanceUncheckedCreateNestedManyWithoutGameTemplateInput = {
    create?: XOR<GameInstanceCreateWithoutGameTemplateInput, GameInstanceUncheckedCreateWithoutGameTemplateInput> | GameInstanceCreateWithoutGameTemplateInput[] | GameInstanceUncheckedCreateWithoutGameTemplateInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutGameTemplateInput | GameInstanceCreateOrConnectWithoutGameTemplateInput[]
    createMany?: GameInstanceCreateManyGameTemplateInputEnvelope
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
  }

  export type QuestionsInGameTemplateUncheckedCreateNestedManyWithoutGameTemplateInput = {
    create?: XOR<QuestionsInGameTemplateCreateWithoutGameTemplateInput, QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput> | QuestionsInGameTemplateCreateWithoutGameTemplateInput[] | QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput[]
    connectOrCreate?: QuestionsInGameTemplateCreateOrConnectWithoutGameTemplateInput | QuestionsInGameTemplateCreateOrConnectWithoutGameTemplateInput[]
    createMany?: QuestionsInGameTemplateCreateManyGameTemplateInputEnvelope
    connect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
  }

  export type GameTemplateUpdatethemesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type NullableEnumPlayModeFieldUpdateOperationsInput = {
    set?: $Enums.PlayMode | null
  }

  export type GameInstanceUpdateManyWithoutGameTemplateNestedInput = {
    create?: XOR<GameInstanceCreateWithoutGameTemplateInput, GameInstanceUncheckedCreateWithoutGameTemplateInput> | GameInstanceCreateWithoutGameTemplateInput[] | GameInstanceUncheckedCreateWithoutGameTemplateInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutGameTemplateInput | GameInstanceCreateOrConnectWithoutGameTemplateInput[]
    upsert?: GameInstanceUpsertWithWhereUniqueWithoutGameTemplateInput | GameInstanceUpsertWithWhereUniqueWithoutGameTemplateInput[]
    createMany?: GameInstanceCreateManyGameTemplateInputEnvelope
    set?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    disconnect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    delete?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    update?: GameInstanceUpdateWithWhereUniqueWithoutGameTemplateInput | GameInstanceUpdateWithWhereUniqueWithoutGameTemplateInput[]
    updateMany?: GameInstanceUpdateManyWithWhereWithoutGameTemplateInput | GameInstanceUpdateManyWithWhereWithoutGameTemplateInput[]
    deleteMany?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
  }

  export type UserUpdateOneRequiredWithoutCreatedGameTemplatesNestedInput = {
    create?: XOR<UserCreateWithoutCreatedGameTemplatesInput, UserUncheckedCreateWithoutCreatedGameTemplatesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCreatedGameTemplatesInput
    upsert?: UserUpsertWithoutCreatedGameTemplatesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCreatedGameTemplatesInput, UserUpdateWithoutCreatedGameTemplatesInput>, UserUncheckedUpdateWithoutCreatedGameTemplatesInput>
  }

  export type QuestionsInGameTemplateUpdateManyWithoutGameTemplateNestedInput = {
    create?: XOR<QuestionsInGameTemplateCreateWithoutGameTemplateInput, QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput> | QuestionsInGameTemplateCreateWithoutGameTemplateInput[] | QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput[]
    connectOrCreate?: QuestionsInGameTemplateCreateOrConnectWithoutGameTemplateInput | QuestionsInGameTemplateCreateOrConnectWithoutGameTemplateInput[]
    upsert?: QuestionsInGameTemplateUpsertWithWhereUniqueWithoutGameTemplateInput | QuestionsInGameTemplateUpsertWithWhereUniqueWithoutGameTemplateInput[]
    createMany?: QuestionsInGameTemplateCreateManyGameTemplateInputEnvelope
    set?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    disconnect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    delete?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    connect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    update?: QuestionsInGameTemplateUpdateWithWhereUniqueWithoutGameTemplateInput | QuestionsInGameTemplateUpdateWithWhereUniqueWithoutGameTemplateInput[]
    updateMany?: QuestionsInGameTemplateUpdateManyWithWhereWithoutGameTemplateInput | QuestionsInGameTemplateUpdateManyWithWhereWithoutGameTemplateInput[]
    deleteMany?: QuestionsInGameTemplateScalarWhereInput | QuestionsInGameTemplateScalarWhereInput[]
  }

  export type GameInstanceUncheckedUpdateManyWithoutGameTemplateNestedInput = {
    create?: XOR<GameInstanceCreateWithoutGameTemplateInput, GameInstanceUncheckedCreateWithoutGameTemplateInput> | GameInstanceCreateWithoutGameTemplateInput[] | GameInstanceUncheckedCreateWithoutGameTemplateInput[]
    connectOrCreate?: GameInstanceCreateOrConnectWithoutGameTemplateInput | GameInstanceCreateOrConnectWithoutGameTemplateInput[]
    upsert?: GameInstanceUpsertWithWhereUniqueWithoutGameTemplateInput | GameInstanceUpsertWithWhereUniqueWithoutGameTemplateInput[]
    createMany?: GameInstanceCreateManyGameTemplateInputEnvelope
    set?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    disconnect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    delete?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    connect?: GameInstanceWhereUniqueInput | GameInstanceWhereUniqueInput[]
    update?: GameInstanceUpdateWithWhereUniqueWithoutGameTemplateInput | GameInstanceUpdateWithWhereUniqueWithoutGameTemplateInput[]
    updateMany?: GameInstanceUpdateManyWithWhereWithoutGameTemplateInput | GameInstanceUpdateManyWithWhereWithoutGameTemplateInput[]
    deleteMany?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
  }

  export type QuestionsInGameTemplateUncheckedUpdateManyWithoutGameTemplateNestedInput = {
    create?: XOR<QuestionsInGameTemplateCreateWithoutGameTemplateInput, QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput> | QuestionsInGameTemplateCreateWithoutGameTemplateInput[] | QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput[]
    connectOrCreate?: QuestionsInGameTemplateCreateOrConnectWithoutGameTemplateInput | QuestionsInGameTemplateCreateOrConnectWithoutGameTemplateInput[]
    upsert?: QuestionsInGameTemplateUpsertWithWhereUniqueWithoutGameTemplateInput | QuestionsInGameTemplateUpsertWithWhereUniqueWithoutGameTemplateInput[]
    createMany?: QuestionsInGameTemplateCreateManyGameTemplateInputEnvelope
    set?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    disconnect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    delete?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    connect?: QuestionsInGameTemplateWhereUniqueInput | QuestionsInGameTemplateWhereUniqueInput[]
    update?: QuestionsInGameTemplateUpdateWithWhereUniqueWithoutGameTemplateInput | QuestionsInGameTemplateUpdateWithWhereUniqueWithoutGameTemplateInput[]
    updateMany?: QuestionsInGameTemplateUpdateManyWithWhereWithoutGameTemplateInput | QuestionsInGameTemplateUpdateManyWithWhereWithoutGameTemplateInput[]
    deleteMany?: QuestionsInGameTemplateScalarWhereInput | QuestionsInGameTemplateScalarWhereInput[]
  }

  export type GameTemplateCreateNestedOneWithoutQuestionsInput = {
    create?: XOR<GameTemplateCreateWithoutQuestionsInput, GameTemplateUncheckedCreateWithoutQuestionsInput>
    connectOrCreate?: GameTemplateCreateOrConnectWithoutQuestionsInput
    connect?: GameTemplateWhereUniqueInput
  }

  export type QuestionCreateNestedOneWithoutGameTemplatesInput = {
    create?: XOR<QuestionCreateWithoutGameTemplatesInput, QuestionUncheckedCreateWithoutGameTemplatesInput>
    connectOrCreate?: QuestionCreateOrConnectWithoutGameTemplatesInput
    connect?: QuestionWhereUniqueInput
  }

  export type GameTemplateUpdateOneRequiredWithoutQuestionsNestedInput = {
    create?: XOR<GameTemplateCreateWithoutQuestionsInput, GameTemplateUncheckedCreateWithoutQuestionsInput>
    connectOrCreate?: GameTemplateCreateOrConnectWithoutQuestionsInput
    upsert?: GameTemplateUpsertWithoutQuestionsInput
    connect?: GameTemplateWhereUniqueInput
    update?: XOR<XOR<GameTemplateUpdateToOneWithWhereWithoutQuestionsInput, GameTemplateUpdateWithoutQuestionsInput>, GameTemplateUncheckedUpdateWithoutQuestionsInput>
  }

  export type QuestionUpdateOneRequiredWithoutGameTemplatesNestedInput = {
    create?: XOR<QuestionCreateWithoutGameTemplatesInput, QuestionUncheckedCreateWithoutGameTemplatesInput>
    connectOrCreate?: QuestionCreateOrConnectWithoutGameTemplatesInput
    upsert?: QuestionUpsertWithoutGameTemplatesInput
    connect?: QuestionWhereUniqueInput
    update?: XOR<XOR<QuestionUpdateToOneWithWhereWithoutGameTemplatesInput, QuestionUpdateWithoutGameTemplatesInput>, QuestionUncheckedUpdateWithoutGameTemplatesInput>
  }

  export type GameTemplateCreateNestedOneWithoutGameInstancesInput = {
    create?: XOR<GameTemplateCreateWithoutGameInstancesInput, GameTemplateUncheckedCreateWithoutGameInstancesInput>
    connectOrCreate?: GameTemplateCreateOrConnectWithoutGameInstancesInput
    connect?: GameTemplateWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutInitiatedGameInstancesInput = {
    create?: XOR<UserCreateWithoutInitiatedGameInstancesInput, UserUncheckedCreateWithoutInitiatedGameInstancesInput>
    connectOrCreate?: UserCreateOrConnectWithoutInitiatedGameInstancesInput
    connect?: UserWhereUniqueInput
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

  export type GameTemplateUpdateOneRequiredWithoutGameInstancesNestedInput = {
    create?: XOR<GameTemplateCreateWithoutGameInstancesInput, GameTemplateUncheckedCreateWithoutGameInstancesInput>
    connectOrCreate?: GameTemplateCreateOrConnectWithoutGameInstancesInput
    upsert?: GameTemplateUpsertWithoutGameInstancesInput
    connect?: GameTemplateWhereUniqueInput
    update?: XOR<XOR<GameTemplateUpdateToOneWithWhereWithoutGameInstancesInput, GameTemplateUpdateWithoutGameInstancesInput>, GameTemplateUncheckedUpdateWithoutGameInstancesInput>
  }

  export type UserUpdateOneWithoutInitiatedGameInstancesNestedInput = {
    create?: XOR<UserCreateWithoutInitiatedGameInstancesInput, UserUncheckedCreateWithoutInitiatedGameInstancesInput>
    connectOrCreate?: UserCreateOrConnectWithoutInitiatedGameInstancesInput
    upsert?: UserUpsertWithoutInitiatedGameInstancesInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutInitiatedGameInstancesInput, UserUpdateWithoutInitiatedGameInstancesInput>, UserUncheckedUpdateWithoutInitiatedGameInstancesInput>
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

  export type UserCreateNestedOneWithoutGameParticipationsInput = {
    create?: XOR<UserCreateWithoutGameParticipationsInput, UserUncheckedCreateWithoutGameParticipationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutGameParticipationsInput
    connect?: UserWhereUniqueInput
  }

  export type EnumParticipantStatusFieldUpdateOperationsInput = {
    set?: $Enums.ParticipantStatus
  }

  export type GameInstanceUpdateOneRequiredWithoutParticipantsNestedInput = {
    create?: XOR<GameInstanceCreateWithoutParticipantsInput, GameInstanceUncheckedCreateWithoutParticipantsInput>
    connectOrCreate?: GameInstanceCreateOrConnectWithoutParticipantsInput
    upsert?: GameInstanceUpsertWithoutParticipantsInput
    connect?: GameInstanceWhereUniqueInput
    update?: XOR<XOR<GameInstanceUpdateToOneWithWhereWithoutParticipantsInput, GameInstanceUpdateWithoutParticipantsInput>, GameInstanceUncheckedUpdateWithoutParticipantsInput>
  }

  export type UserUpdateOneRequiredWithoutGameParticipationsNestedInput = {
    create?: XOR<UserCreateWithoutGameParticipationsInput, UserUncheckedCreateWithoutGameParticipationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutGameParticipationsInput
    upsert?: UserUpsertWithoutGameParticipationsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutGameParticipationsInput, UserUpdateWithoutGameParticipationsInput>, UserUncheckedUpdateWithoutGameParticipationsInput>
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

  export type NestedEnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
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

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
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

  export type NestedEnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
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

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
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

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
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

  export type NestedEnumParticipantStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ParticipantStatus | EnumParticipantStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ParticipantStatus[] | ListEnumParticipantStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ParticipantStatus[] | ListEnumParticipantStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumParticipantStatusFilter<$PrismaModel> | $Enums.ParticipantStatus
  }

  export type NestedEnumParticipantStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ParticipantStatus | EnumParticipantStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ParticipantStatus[] | ListEnumParticipantStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ParticipantStatus[] | ListEnumParticipantStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumParticipantStatusWithAggregatesFilter<$PrismaModel> | $Enums.ParticipantStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumParticipantStatusFilter<$PrismaModel>
    _max?: NestedEnumParticipantStatusFilter<$PrismaModel>
  }

  export type StudentProfileCreateWithoutUserInput = {
    cookieId?: string | null
  }

  export type StudentProfileUncheckedCreateWithoutUserInput = {
    cookieId?: string | null
  }

  export type StudentProfileCreateOrConnectWithoutUserInput = {
    where: StudentProfileWhereUniqueInput
    create: XOR<StudentProfileCreateWithoutUserInput, StudentProfileUncheckedCreateWithoutUserInput>
  }

  export type TeacherProfileCreateWithoutUserInput = {

  }

  export type TeacherProfileUncheckedCreateWithoutUserInput = {

  }

  export type TeacherProfileCreateOrConnectWithoutUserInput = {
    where: TeacherProfileWhereUniqueInput
    create: XOR<TeacherProfileCreateWithoutUserInput, TeacherProfileUncheckedCreateWithoutUserInput>
  }

  export type GameInstanceCreateWithoutInitiatorUserInput = {
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    gameTemplate: GameTemplateCreateNestedOneWithoutGameInstancesInput
    participants?: GameParticipantCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceUncheckedCreateWithoutInitiatorUserInput = {
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    gameTemplateId: string
    participants?: GameParticipantUncheckedCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceCreateOrConnectWithoutInitiatorUserInput = {
    where: GameInstanceWhereUniqueInput
    create: XOR<GameInstanceCreateWithoutInitiatorUserInput, GameInstanceUncheckedCreateWithoutInitiatorUserInput>
  }

  export type GameInstanceCreateManyInitiatorUserInputEnvelope = {
    data: GameInstanceCreateManyInitiatorUserInput | GameInstanceCreateManyInitiatorUserInput[]
    skipDuplicates?: boolean
  }

  export type GameParticipantCreateWithoutUserInput = {
    id?: string
    liveScore?: number
    deferredScore?: number
    nbAttempts?: number
    status?: $Enums.ParticipantStatus
    joinedAt?: Date | string
    lastActiveAt?: Date | string | null
    completedAt?: Date | string | null
    gameInstance: GameInstanceCreateNestedOneWithoutParticipantsInput
  }

  export type GameParticipantUncheckedCreateWithoutUserInput = {
    id?: string
    gameInstanceId: string
    liveScore?: number
    deferredScore?: number
    nbAttempts?: number
    status?: $Enums.ParticipantStatus
    joinedAt?: Date | string
    lastActiveAt?: Date | string | null
    completedAt?: Date | string | null
  }

  export type GameParticipantCreateOrConnectWithoutUserInput = {
    where: GameParticipantWhereUniqueInput
    create: XOR<GameParticipantCreateWithoutUserInput, GameParticipantUncheckedCreateWithoutUserInput>
  }

  export type GameParticipantCreateManyUserInputEnvelope = {
    data: GameParticipantCreateManyUserInput | GameParticipantCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type GameTemplateCreateWithoutCreatorInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: GameTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    gameInstances?: GameInstanceCreateNestedManyWithoutGameTemplateInput
    questions?: QuestionsInGameTemplateCreateNestedManyWithoutGameTemplateInput
  }

  export type GameTemplateUncheckedCreateWithoutCreatorInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: GameTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    gameInstances?: GameInstanceUncheckedCreateNestedManyWithoutGameTemplateInput
    questions?: QuestionsInGameTemplateUncheckedCreateNestedManyWithoutGameTemplateInput
  }

  export type GameTemplateCreateOrConnectWithoutCreatorInput = {
    where: GameTemplateWhereUniqueInput
    create: XOR<GameTemplateCreateWithoutCreatorInput, GameTemplateUncheckedCreateWithoutCreatorInput>
  }

  export type GameTemplateCreateManyCreatorInputEnvelope = {
    data: GameTemplateCreateManyCreatorInput | GameTemplateCreateManyCreatorInput[]
    skipDuplicates?: boolean
  }

  export type StudentProfileUpsertWithoutUserInput = {
    update: XOR<StudentProfileUpdateWithoutUserInput, StudentProfileUncheckedUpdateWithoutUserInput>
    create: XOR<StudentProfileCreateWithoutUserInput, StudentProfileUncheckedCreateWithoutUserInput>
    where?: StudentProfileWhereInput
  }

  export type StudentProfileUpdateToOneWithWhereWithoutUserInput = {
    where?: StudentProfileWhereInput
    data: XOR<StudentProfileUpdateWithoutUserInput, StudentProfileUncheckedUpdateWithoutUserInput>
  }

  export type StudentProfileUpdateWithoutUserInput = {
    cookieId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StudentProfileUncheckedUpdateWithoutUserInput = {
    cookieId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TeacherProfileUpsertWithoutUserInput = {
    update: XOR<TeacherProfileUpdateWithoutUserInput, TeacherProfileUncheckedUpdateWithoutUserInput>
    create: XOR<TeacherProfileCreateWithoutUserInput, TeacherProfileUncheckedCreateWithoutUserInput>
    where?: TeacherProfileWhereInput
  }

  export type TeacherProfileUpdateToOneWithWhereWithoutUserInput = {
    where?: TeacherProfileWhereInput
    data: XOR<TeacherProfileUpdateWithoutUserInput, TeacherProfileUncheckedUpdateWithoutUserInput>
  }

  export type TeacherProfileUpdateWithoutUserInput = {

  }

  export type TeacherProfileUncheckedUpdateWithoutUserInput = {

  }

  export type GameInstanceUpsertWithWhereUniqueWithoutInitiatorUserInput = {
    where: GameInstanceWhereUniqueInput
    update: XOR<GameInstanceUpdateWithoutInitiatorUserInput, GameInstanceUncheckedUpdateWithoutInitiatorUserInput>
    create: XOR<GameInstanceCreateWithoutInitiatorUserInput, GameInstanceUncheckedCreateWithoutInitiatorUserInput>
  }

  export type GameInstanceUpdateWithWhereUniqueWithoutInitiatorUserInput = {
    where: GameInstanceWhereUniqueInput
    data: XOR<GameInstanceUpdateWithoutInitiatorUserInput, GameInstanceUncheckedUpdateWithoutInitiatorUserInput>
  }

  export type GameInstanceUpdateManyWithWhereWithoutInitiatorUserInput = {
    where: GameInstanceScalarWhereInput
    data: XOR<GameInstanceUpdateManyMutationInput, GameInstanceUncheckedUpdateManyWithoutInitiatorUserInput>
  }

  export type GameInstanceScalarWhereInput = {
    AND?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
    OR?: GameInstanceScalarWhereInput[]
    NOT?: GameInstanceScalarWhereInput | GameInstanceScalarWhereInput[]
    id?: StringFilter<"GameInstance"> | string
    name?: StringFilter<"GameInstance"> | string
    accessCode?: StringFilter<"GameInstance"> | string
    status?: StringFilter<"GameInstance"> | string
    playMode?: EnumPlayModeFilter<"GameInstance"> | $Enums.PlayMode
    leaderboard?: JsonNullableFilter<"GameInstance">
    currentQuestionIndex?: IntNullableFilter<"GameInstance"> | number | null
    settings?: JsonNullableFilter<"GameInstance">
    createdAt?: DateTimeFilter<"GameInstance"> | Date | string
    startedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    differedAvailableFrom?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    differedAvailableTo?: DateTimeNullableFilter<"GameInstance"> | Date | string | null
    gameTemplateId?: StringFilter<"GameInstance"> | string
    initiatorUserId?: StringNullableFilter<"GameInstance"> | string | null
  }

  export type GameParticipantUpsertWithWhereUniqueWithoutUserInput = {
    where: GameParticipantWhereUniqueInput
    update: XOR<GameParticipantUpdateWithoutUserInput, GameParticipantUncheckedUpdateWithoutUserInput>
    create: XOR<GameParticipantCreateWithoutUserInput, GameParticipantUncheckedCreateWithoutUserInput>
  }

  export type GameParticipantUpdateWithWhereUniqueWithoutUserInput = {
    where: GameParticipantWhereUniqueInput
    data: XOR<GameParticipantUpdateWithoutUserInput, GameParticipantUncheckedUpdateWithoutUserInput>
  }

  export type GameParticipantUpdateManyWithWhereWithoutUserInput = {
    where: GameParticipantScalarWhereInput
    data: XOR<GameParticipantUpdateManyMutationInput, GameParticipantUncheckedUpdateManyWithoutUserInput>
  }

  export type GameParticipantScalarWhereInput = {
    AND?: GameParticipantScalarWhereInput | GameParticipantScalarWhereInput[]
    OR?: GameParticipantScalarWhereInput[]
    NOT?: GameParticipantScalarWhereInput | GameParticipantScalarWhereInput[]
    id?: StringFilter<"GameParticipant"> | string
    gameInstanceId?: StringFilter<"GameParticipant"> | string
    userId?: StringFilter<"GameParticipant"> | string
    liveScore?: IntFilter<"GameParticipant"> | number
    deferredScore?: IntFilter<"GameParticipant"> | number
    nbAttempts?: IntFilter<"GameParticipant"> | number
    status?: EnumParticipantStatusFilter<"GameParticipant"> | $Enums.ParticipantStatus
    joinedAt?: DateTimeFilter<"GameParticipant"> | Date | string
    lastActiveAt?: DateTimeNullableFilter<"GameParticipant"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"GameParticipant"> | Date | string | null
  }

  export type GameTemplateUpsertWithWhereUniqueWithoutCreatorInput = {
    where: GameTemplateWhereUniqueInput
    update: XOR<GameTemplateUpdateWithoutCreatorInput, GameTemplateUncheckedUpdateWithoutCreatorInput>
    create: XOR<GameTemplateCreateWithoutCreatorInput, GameTemplateUncheckedCreateWithoutCreatorInput>
  }

  export type GameTemplateUpdateWithWhereUniqueWithoutCreatorInput = {
    where: GameTemplateWhereUniqueInput
    data: XOR<GameTemplateUpdateWithoutCreatorInput, GameTemplateUncheckedUpdateWithoutCreatorInput>
  }

  export type GameTemplateUpdateManyWithWhereWithoutCreatorInput = {
    where: GameTemplateScalarWhereInput
    data: XOR<GameTemplateUpdateManyMutationInput, GameTemplateUncheckedUpdateManyWithoutCreatorInput>
  }

  export type GameTemplateScalarWhereInput = {
    AND?: GameTemplateScalarWhereInput | GameTemplateScalarWhereInput[]
    OR?: GameTemplateScalarWhereInput[]
    NOT?: GameTemplateScalarWhereInput | GameTemplateScalarWhereInput[]
    id?: StringFilter<"GameTemplate"> | string
    name?: StringFilter<"GameTemplate"> | string
    gradeLevel?: StringNullableFilter<"GameTemplate"> | string | null
    themes?: StringNullableListFilter<"GameTemplate">
    discipline?: StringNullableFilter<"GameTemplate"> | string | null
    description?: StringNullableFilter<"GameTemplate"> | string | null
    defaultMode?: EnumPlayModeNullableFilter<"GameTemplate"> | $Enums.PlayMode | null
    createdAt?: DateTimeFilter<"GameTemplate"> | Date | string
    updatedAt?: DateTimeFilter<"GameTemplate"> | Date | string
    creatorId?: StringFilter<"GameTemplate"> | string
  }

  export type UserCreateWithoutTeacherProfileInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    studentProfile?: StudentProfileCreateNestedOneWithoutUserInput
    initiatedGameInstances?: GameInstanceCreateNestedManyWithoutInitiatorUserInput
    gameParticipations?: GameParticipantCreateNestedManyWithoutUserInput
    createdGameTemplates?: GameTemplateCreateNestedManyWithoutCreatorInput
  }

  export type UserUncheckedCreateWithoutTeacherProfileInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    studentProfile?: StudentProfileUncheckedCreateNestedOneWithoutUserInput
    initiatedGameInstances?: GameInstanceUncheckedCreateNestedManyWithoutInitiatorUserInput
    gameParticipations?: GameParticipantUncheckedCreateNestedManyWithoutUserInput
    createdGameTemplates?: GameTemplateUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type UserCreateOrConnectWithoutTeacherProfileInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTeacherProfileInput, UserUncheckedCreateWithoutTeacherProfileInput>
  }

  export type UserUpsertWithoutTeacherProfileInput = {
    update: XOR<UserUpdateWithoutTeacherProfileInput, UserUncheckedUpdateWithoutTeacherProfileInput>
    create: XOR<UserCreateWithoutTeacherProfileInput, UserUncheckedCreateWithoutTeacherProfileInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutTeacherProfileInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutTeacherProfileInput, UserUncheckedUpdateWithoutTeacherProfileInput>
  }

  export type UserUpdateWithoutTeacherProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    studentProfile?: StudentProfileUpdateOneWithoutUserNestedInput
    initiatedGameInstances?: GameInstanceUpdateManyWithoutInitiatorUserNestedInput
    gameParticipations?: GameParticipantUpdateManyWithoutUserNestedInput
    createdGameTemplates?: GameTemplateUpdateManyWithoutCreatorNestedInput
  }

  export type UserUncheckedUpdateWithoutTeacherProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    studentProfile?: StudentProfileUncheckedUpdateOneWithoutUserNestedInput
    initiatedGameInstances?: GameInstanceUncheckedUpdateManyWithoutInitiatorUserNestedInput
    gameParticipations?: GameParticipantUncheckedUpdateManyWithoutUserNestedInput
    createdGameTemplates?: GameTemplateUncheckedUpdateManyWithoutCreatorNestedInput
  }

  export type UserCreateWithoutStudentProfileInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    teacherProfile?: TeacherProfileCreateNestedOneWithoutUserInput
    initiatedGameInstances?: GameInstanceCreateNestedManyWithoutInitiatorUserInput
    gameParticipations?: GameParticipantCreateNestedManyWithoutUserInput
    createdGameTemplates?: GameTemplateCreateNestedManyWithoutCreatorInput
  }

  export type UserUncheckedCreateWithoutStudentProfileInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    teacherProfile?: TeacherProfileUncheckedCreateNestedOneWithoutUserInput
    initiatedGameInstances?: GameInstanceUncheckedCreateNestedManyWithoutInitiatorUserInput
    gameParticipations?: GameParticipantUncheckedCreateNestedManyWithoutUserInput
    createdGameTemplates?: GameTemplateUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type UserCreateOrConnectWithoutStudentProfileInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutStudentProfileInput, UserUncheckedCreateWithoutStudentProfileInput>
  }

  export type UserUpsertWithoutStudentProfileInput = {
    update: XOR<UserUpdateWithoutStudentProfileInput, UserUncheckedUpdateWithoutStudentProfileInput>
    create: XOR<UserCreateWithoutStudentProfileInput, UserUncheckedCreateWithoutStudentProfileInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutStudentProfileInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutStudentProfileInput, UserUncheckedUpdateWithoutStudentProfileInput>
  }

  export type UserUpdateWithoutStudentProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    teacherProfile?: TeacherProfileUpdateOneWithoutUserNestedInput
    initiatedGameInstances?: GameInstanceUpdateManyWithoutInitiatorUserNestedInput
    gameParticipations?: GameParticipantUpdateManyWithoutUserNestedInput
    createdGameTemplates?: GameTemplateUpdateManyWithoutCreatorNestedInput
  }

  export type UserUncheckedUpdateWithoutStudentProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    teacherProfile?: TeacherProfileUncheckedUpdateOneWithoutUserNestedInput
    initiatedGameInstances?: GameInstanceUncheckedUpdateManyWithoutInitiatorUserNestedInput
    gameParticipations?: GameParticipantUncheckedUpdateManyWithoutUserNestedInput
    createdGameTemplates?: GameTemplateUncheckedUpdateManyWithoutCreatorNestedInput
  }

  export type MultipleChoiceQuestionCreateWithoutQuestionInput = {
    answerOptions?: MultipleChoiceQuestionCreateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionCreatecorrectAnswersInput | boolean[]
  }

  export type MultipleChoiceQuestionUncheckedCreateWithoutQuestionInput = {
    answerOptions?: MultipleChoiceQuestionCreateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionCreatecorrectAnswersInput | boolean[]
  }

  export type MultipleChoiceQuestionCreateOrConnectWithoutQuestionInput = {
    where: MultipleChoiceQuestionWhereUniqueInput
    create: XOR<MultipleChoiceQuestionCreateWithoutQuestionInput, MultipleChoiceQuestionUncheckedCreateWithoutQuestionInput>
  }

  export type NumericQuestionCreateWithoutQuestionInput = {
    correctAnswer: number
    tolerance?: number | null
    unit?: string | null
  }

  export type NumericQuestionUncheckedCreateWithoutQuestionInput = {
    correctAnswer: number
    tolerance?: number | null
    unit?: string | null
  }

  export type NumericQuestionCreateOrConnectWithoutQuestionInput = {
    where: NumericQuestionWhereUniqueInput
    create: XOR<NumericQuestionCreateWithoutQuestionInput, NumericQuestionUncheckedCreateWithoutQuestionInput>
  }

  export type QuestionsInGameTemplateCreateWithoutQuestionInput = {
    sequence: number
    createdAt?: Date | string
    gameTemplate: GameTemplateCreateNestedOneWithoutQuestionsInput
  }

  export type QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput = {
    gameTemplateId: string
    sequence: number
    createdAt?: Date | string
  }

  export type QuestionsInGameTemplateCreateOrConnectWithoutQuestionInput = {
    where: QuestionsInGameTemplateWhereUniqueInput
    create: XOR<QuestionsInGameTemplateCreateWithoutQuestionInput, QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput>
  }

  export type QuestionsInGameTemplateCreateManyQuestionInputEnvelope = {
    data: QuestionsInGameTemplateCreateManyQuestionInput | QuestionsInGameTemplateCreateManyQuestionInput[]
    skipDuplicates?: boolean
  }

  export type MultipleChoiceQuestionUpsertWithoutQuestionInput = {
    update: XOR<MultipleChoiceQuestionUpdateWithoutQuestionInput, MultipleChoiceQuestionUncheckedUpdateWithoutQuestionInput>
    create: XOR<MultipleChoiceQuestionCreateWithoutQuestionInput, MultipleChoiceQuestionUncheckedCreateWithoutQuestionInput>
    where?: MultipleChoiceQuestionWhereInput
  }

  export type MultipleChoiceQuestionUpdateToOneWithWhereWithoutQuestionInput = {
    where?: MultipleChoiceQuestionWhereInput
    data: XOR<MultipleChoiceQuestionUpdateWithoutQuestionInput, MultipleChoiceQuestionUncheckedUpdateWithoutQuestionInput>
  }

  export type MultipleChoiceQuestionUpdateWithoutQuestionInput = {
    answerOptions?: MultipleChoiceQuestionUpdateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionUpdatecorrectAnswersInput | boolean[]
  }

  export type MultipleChoiceQuestionUncheckedUpdateWithoutQuestionInput = {
    answerOptions?: MultipleChoiceQuestionUpdateanswerOptionsInput | string[]
    correctAnswers?: MultipleChoiceQuestionUpdatecorrectAnswersInput | boolean[]
  }

  export type NumericQuestionUpsertWithoutQuestionInput = {
    update: XOR<NumericQuestionUpdateWithoutQuestionInput, NumericQuestionUncheckedUpdateWithoutQuestionInput>
    create: XOR<NumericQuestionCreateWithoutQuestionInput, NumericQuestionUncheckedCreateWithoutQuestionInput>
    where?: NumericQuestionWhereInput
  }

  export type NumericQuestionUpdateToOneWithWhereWithoutQuestionInput = {
    where?: NumericQuestionWhereInput
    data: XOR<NumericQuestionUpdateWithoutQuestionInput, NumericQuestionUncheckedUpdateWithoutQuestionInput>
  }

  export type NumericQuestionUpdateWithoutQuestionInput = {
    correctAnswer?: FloatFieldUpdateOperationsInput | number
    tolerance?: NullableFloatFieldUpdateOperationsInput | number | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type NumericQuestionUncheckedUpdateWithoutQuestionInput = {
    correctAnswer?: FloatFieldUpdateOperationsInput | number
    tolerance?: NullableFloatFieldUpdateOperationsInput | number | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QuestionsInGameTemplateUpsertWithWhereUniqueWithoutQuestionInput = {
    where: QuestionsInGameTemplateWhereUniqueInput
    update: XOR<QuestionsInGameTemplateUpdateWithoutQuestionInput, QuestionsInGameTemplateUncheckedUpdateWithoutQuestionInput>
    create: XOR<QuestionsInGameTemplateCreateWithoutQuestionInput, QuestionsInGameTemplateUncheckedCreateWithoutQuestionInput>
  }

  export type QuestionsInGameTemplateUpdateWithWhereUniqueWithoutQuestionInput = {
    where: QuestionsInGameTemplateWhereUniqueInput
    data: XOR<QuestionsInGameTemplateUpdateWithoutQuestionInput, QuestionsInGameTemplateUncheckedUpdateWithoutQuestionInput>
  }

  export type QuestionsInGameTemplateUpdateManyWithWhereWithoutQuestionInput = {
    where: QuestionsInGameTemplateScalarWhereInput
    data: XOR<QuestionsInGameTemplateUpdateManyMutationInput, QuestionsInGameTemplateUncheckedUpdateManyWithoutQuestionInput>
  }

  export type QuestionsInGameTemplateScalarWhereInput = {
    AND?: QuestionsInGameTemplateScalarWhereInput | QuestionsInGameTemplateScalarWhereInput[]
    OR?: QuestionsInGameTemplateScalarWhereInput[]
    NOT?: QuestionsInGameTemplateScalarWhereInput | QuestionsInGameTemplateScalarWhereInput[]
    gameTemplateId?: StringFilter<"QuestionsInGameTemplate"> | string
    questionUid?: StringFilter<"QuestionsInGameTemplate"> | string
    sequence?: IntFilter<"QuestionsInGameTemplate"> | number
    createdAt?: DateTimeFilter<"QuestionsInGameTemplate"> | Date | string
  }

  export type QuestionCreateWithoutMultipleChoiceQuestionInput = {
    uid?: string
    title?: string | null
    text: string
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit: number
    excludedFrom?: QuestionCreateexcludedFromInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    feedbackWaitTime?: number | null
    isHidden?: boolean | null
    numericQuestion?: NumericQuestionCreateNestedOneWithoutQuestionInput
    gameTemplates?: QuestionsInGameTemplateCreateNestedManyWithoutQuestionInput
  }

  export type QuestionUncheckedCreateWithoutMultipleChoiceQuestionInput = {
    uid?: string
    title?: string | null
    text: string
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit: number
    excludedFrom?: QuestionCreateexcludedFromInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    feedbackWaitTime?: number | null
    isHidden?: boolean | null
    numericQuestion?: NumericQuestionUncheckedCreateNestedOneWithoutQuestionInput
    gameTemplates?: QuestionsInGameTemplateUncheckedCreateNestedManyWithoutQuestionInput
  }

  export type QuestionCreateOrConnectWithoutMultipleChoiceQuestionInput = {
    where: QuestionWhereUniqueInput
    create: XOR<QuestionCreateWithoutMultipleChoiceQuestionInput, QuestionUncheckedCreateWithoutMultipleChoiceQuestionInput>
  }

  export type QuestionUpsertWithoutMultipleChoiceQuestionInput = {
    update: XOR<QuestionUpdateWithoutMultipleChoiceQuestionInput, QuestionUncheckedUpdateWithoutMultipleChoiceQuestionInput>
    create: XOR<QuestionCreateWithoutMultipleChoiceQuestionInput, QuestionUncheckedCreateWithoutMultipleChoiceQuestionInput>
    where?: QuestionWhereInput
  }

  export type QuestionUpdateToOneWithWhereWithoutMultipleChoiceQuestionInput = {
    where?: QuestionWhereInput
    data: XOR<QuestionUpdateWithoutMultipleChoiceQuestionInput, QuestionUncheckedUpdateWithoutMultipleChoiceQuestionInput>
  }

  export type QuestionUpdateWithoutMultipleChoiceQuestionInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: IntFieldUpdateOperationsInput | number
    excludedFrom?: QuestionUpdateexcludedFromInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedbackWaitTime?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    numericQuestion?: NumericQuestionUpdateOneWithoutQuestionNestedInput
    gameTemplates?: QuestionsInGameTemplateUpdateManyWithoutQuestionNestedInput
  }

  export type QuestionUncheckedUpdateWithoutMultipleChoiceQuestionInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: IntFieldUpdateOperationsInput | number
    excludedFrom?: QuestionUpdateexcludedFromInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedbackWaitTime?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    numericQuestion?: NumericQuestionUncheckedUpdateOneWithoutQuestionNestedInput
    gameTemplates?: QuestionsInGameTemplateUncheckedUpdateManyWithoutQuestionNestedInput
  }

  export type QuestionCreateWithoutNumericQuestionInput = {
    uid?: string
    title?: string | null
    text: string
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit: number
    excludedFrom?: QuestionCreateexcludedFromInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    feedbackWaitTime?: number | null
    isHidden?: boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionCreateNestedOneWithoutQuestionInput
    gameTemplates?: QuestionsInGameTemplateCreateNestedManyWithoutQuestionInput
  }

  export type QuestionUncheckedCreateWithoutNumericQuestionInput = {
    uid?: string
    title?: string | null
    text: string
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit: number
    excludedFrom?: QuestionCreateexcludedFromInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    feedbackWaitTime?: number | null
    isHidden?: boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionUncheckedCreateNestedOneWithoutQuestionInput
    gameTemplates?: QuestionsInGameTemplateUncheckedCreateNestedManyWithoutQuestionInput
  }

  export type QuestionCreateOrConnectWithoutNumericQuestionInput = {
    where: QuestionWhereUniqueInput
    create: XOR<QuestionCreateWithoutNumericQuestionInput, QuestionUncheckedCreateWithoutNumericQuestionInput>
  }

  export type QuestionUpsertWithoutNumericQuestionInput = {
    update: XOR<QuestionUpdateWithoutNumericQuestionInput, QuestionUncheckedUpdateWithoutNumericQuestionInput>
    create: XOR<QuestionCreateWithoutNumericQuestionInput, QuestionUncheckedCreateWithoutNumericQuestionInput>
    where?: QuestionWhereInput
  }

  export type QuestionUpdateToOneWithWhereWithoutNumericQuestionInput = {
    where?: QuestionWhereInput
    data: XOR<QuestionUpdateWithoutNumericQuestionInput, QuestionUncheckedUpdateWithoutNumericQuestionInput>
  }

  export type QuestionUpdateWithoutNumericQuestionInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: IntFieldUpdateOperationsInput | number
    excludedFrom?: QuestionUpdateexcludedFromInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedbackWaitTime?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionUpdateOneWithoutQuestionNestedInput
    gameTemplates?: QuestionsInGameTemplateUpdateManyWithoutQuestionNestedInput
  }

  export type QuestionUncheckedUpdateWithoutNumericQuestionInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: IntFieldUpdateOperationsInput | number
    excludedFrom?: QuestionUpdateexcludedFromInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedbackWaitTime?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionUncheckedUpdateOneWithoutQuestionNestedInput
    gameTemplates?: QuestionsInGameTemplateUncheckedUpdateManyWithoutQuestionNestedInput
  }

  export type GameInstanceCreateWithoutGameTemplateInput = {
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    initiatorUser?: UserCreateNestedOneWithoutInitiatedGameInstancesInput
    participants?: GameParticipantCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceUncheckedCreateWithoutGameTemplateInput = {
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    initiatorUserId?: string | null
    participants?: GameParticipantUncheckedCreateNestedManyWithoutGameInstanceInput
  }

  export type GameInstanceCreateOrConnectWithoutGameTemplateInput = {
    where: GameInstanceWhereUniqueInput
    create: XOR<GameInstanceCreateWithoutGameTemplateInput, GameInstanceUncheckedCreateWithoutGameTemplateInput>
  }

  export type GameInstanceCreateManyGameTemplateInputEnvelope = {
    data: GameInstanceCreateManyGameTemplateInput | GameInstanceCreateManyGameTemplateInput[]
    skipDuplicates?: boolean
  }

  export type UserCreateWithoutCreatedGameTemplatesInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    studentProfile?: StudentProfileCreateNestedOneWithoutUserInput
    teacherProfile?: TeacherProfileCreateNestedOneWithoutUserInput
    initiatedGameInstances?: GameInstanceCreateNestedManyWithoutInitiatorUserInput
    gameParticipations?: GameParticipantCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCreatedGameTemplatesInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    studentProfile?: StudentProfileUncheckedCreateNestedOneWithoutUserInput
    teacherProfile?: TeacherProfileUncheckedCreateNestedOneWithoutUserInput
    initiatedGameInstances?: GameInstanceUncheckedCreateNestedManyWithoutInitiatorUserInput
    gameParticipations?: GameParticipantUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCreatedGameTemplatesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCreatedGameTemplatesInput, UserUncheckedCreateWithoutCreatedGameTemplatesInput>
  }

  export type QuestionsInGameTemplateCreateWithoutGameTemplateInput = {
    sequence: number
    createdAt?: Date | string
    question: QuestionCreateNestedOneWithoutGameTemplatesInput
  }

  export type QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput = {
    questionUid: string
    sequence: number
    createdAt?: Date | string
  }

  export type QuestionsInGameTemplateCreateOrConnectWithoutGameTemplateInput = {
    where: QuestionsInGameTemplateWhereUniqueInput
    create: XOR<QuestionsInGameTemplateCreateWithoutGameTemplateInput, QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput>
  }

  export type QuestionsInGameTemplateCreateManyGameTemplateInputEnvelope = {
    data: QuestionsInGameTemplateCreateManyGameTemplateInput | QuestionsInGameTemplateCreateManyGameTemplateInput[]
    skipDuplicates?: boolean
  }

  export type GameInstanceUpsertWithWhereUniqueWithoutGameTemplateInput = {
    where: GameInstanceWhereUniqueInput
    update: XOR<GameInstanceUpdateWithoutGameTemplateInput, GameInstanceUncheckedUpdateWithoutGameTemplateInput>
    create: XOR<GameInstanceCreateWithoutGameTemplateInput, GameInstanceUncheckedCreateWithoutGameTemplateInput>
  }

  export type GameInstanceUpdateWithWhereUniqueWithoutGameTemplateInput = {
    where: GameInstanceWhereUniqueInput
    data: XOR<GameInstanceUpdateWithoutGameTemplateInput, GameInstanceUncheckedUpdateWithoutGameTemplateInput>
  }

  export type GameInstanceUpdateManyWithWhereWithoutGameTemplateInput = {
    where: GameInstanceScalarWhereInput
    data: XOR<GameInstanceUpdateManyMutationInput, GameInstanceUncheckedUpdateManyWithoutGameTemplateInput>
  }

  export type UserUpsertWithoutCreatedGameTemplatesInput = {
    update: XOR<UserUpdateWithoutCreatedGameTemplatesInput, UserUncheckedUpdateWithoutCreatedGameTemplatesInput>
    create: XOR<UserCreateWithoutCreatedGameTemplatesInput, UserUncheckedCreateWithoutCreatedGameTemplatesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCreatedGameTemplatesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCreatedGameTemplatesInput, UserUncheckedUpdateWithoutCreatedGameTemplatesInput>
  }

  export type UserUpdateWithoutCreatedGameTemplatesInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    studentProfile?: StudentProfileUpdateOneWithoutUserNestedInput
    teacherProfile?: TeacherProfileUpdateOneWithoutUserNestedInput
    initiatedGameInstances?: GameInstanceUpdateManyWithoutInitiatorUserNestedInput
    gameParticipations?: GameParticipantUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCreatedGameTemplatesInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    studentProfile?: StudentProfileUncheckedUpdateOneWithoutUserNestedInput
    teacherProfile?: TeacherProfileUncheckedUpdateOneWithoutUserNestedInput
    initiatedGameInstances?: GameInstanceUncheckedUpdateManyWithoutInitiatorUserNestedInput
    gameParticipations?: GameParticipantUncheckedUpdateManyWithoutUserNestedInput
  }

  export type QuestionsInGameTemplateUpsertWithWhereUniqueWithoutGameTemplateInput = {
    where: QuestionsInGameTemplateWhereUniqueInput
    update: XOR<QuestionsInGameTemplateUpdateWithoutGameTemplateInput, QuestionsInGameTemplateUncheckedUpdateWithoutGameTemplateInput>
    create: XOR<QuestionsInGameTemplateCreateWithoutGameTemplateInput, QuestionsInGameTemplateUncheckedCreateWithoutGameTemplateInput>
  }

  export type QuestionsInGameTemplateUpdateWithWhereUniqueWithoutGameTemplateInput = {
    where: QuestionsInGameTemplateWhereUniqueInput
    data: XOR<QuestionsInGameTemplateUpdateWithoutGameTemplateInput, QuestionsInGameTemplateUncheckedUpdateWithoutGameTemplateInput>
  }

  export type QuestionsInGameTemplateUpdateManyWithWhereWithoutGameTemplateInput = {
    where: QuestionsInGameTemplateScalarWhereInput
    data: XOR<QuestionsInGameTemplateUpdateManyMutationInput, QuestionsInGameTemplateUncheckedUpdateManyWithoutGameTemplateInput>
  }

  export type GameTemplateCreateWithoutQuestionsInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: GameTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    gameInstances?: GameInstanceCreateNestedManyWithoutGameTemplateInput
    creator: UserCreateNestedOneWithoutCreatedGameTemplatesInput
  }

  export type GameTemplateUncheckedCreateWithoutQuestionsInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: GameTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creatorId: string
    gameInstances?: GameInstanceUncheckedCreateNestedManyWithoutGameTemplateInput
  }

  export type GameTemplateCreateOrConnectWithoutQuestionsInput = {
    where: GameTemplateWhereUniqueInput
    create: XOR<GameTemplateCreateWithoutQuestionsInput, GameTemplateUncheckedCreateWithoutQuestionsInput>
  }

  export type QuestionCreateWithoutGameTemplatesInput = {
    uid?: string
    title?: string | null
    text: string
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit: number
    excludedFrom?: QuestionCreateexcludedFromInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    feedbackWaitTime?: number | null
    isHidden?: boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionCreateNestedOneWithoutQuestionInput
    numericQuestion?: NumericQuestionCreateNestedOneWithoutQuestionInput
  }

  export type QuestionUncheckedCreateWithoutGameTemplatesInput = {
    uid?: string
    title?: string | null
    text: string
    questionType: string
    discipline: string
    themes?: QuestionCreatethemesInput | string[]
    difficulty?: number | null
    gradeLevel?: string | null
    author?: string | null
    explanation?: string | null
    tags?: QuestionCreatetagsInput | string[]
    timeLimit: number
    excludedFrom?: QuestionCreateexcludedFromInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    feedbackWaitTime?: number | null
    isHidden?: boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionUncheckedCreateNestedOneWithoutQuestionInput
    numericQuestion?: NumericQuestionUncheckedCreateNestedOneWithoutQuestionInput
  }

  export type QuestionCreateOrConnectWithoutGameTemplatesInput = {
    where: QuestionWhereUniqueInput
    create: XOR<QuestionCreateWithoutGameTemplatesInput, QuestionUncheckedCreateWithoutGameTemplatesInput>
  }

  export type GameTemplateUpsertWithoutQuestionsInput = {
    update: XOR<GameTemplateUpdateWithoutQuestionsInput, GameTemplateUncheckedUpdateWithoutQuestionsInput>
    create: XOR<GameTemplateCreateWithoutQuestionsInput, GameTemplateUncheckedCreateWithoutQuestionsInput>
    where?: GameTemplateWhereInput
  }

  export type GameTemplateUpdateToOneWithWhereWithoutQuestionsInput = {
    where?: GameTemplateWhereInput
    data: XOR<GameTemplateUpdateWithoutQuestionsInput, GameTemplateUncheckedUpdateWithoutQuestionsInput>
  }

  export type GameTemplateUpdateWithoutQuestionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameInstances?: GameInstanceUpdateManyWithoutGameTemplateNestedInput
    creator?: UserUpdateOneRequiredWithoutCreatedGameTemplatesNestedInput
  }

  export type GameTemplateUncheckedUpdateWithoutQuestionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorId?: StringFieldUpdateOperationsInput | string
    gameInstances?: GameInstanceUncheckedUpdateManyWithoutGameTemplateNestedInput
  }

  export type QuestionUpsertWithoutGameTemplatesInput = {
    update: XOR<QuestionUpdateWithoutGameTemplatesInput, QuestionUncheckedUpdateWithoutGameTemplatesInput>
    create: XOR<QuestionCreateWithoutGameTemplatesInput, QuestionUncheckedCreateWithoutGameTemplatesInput>
    where?: QuestionWhereInput
  }

  export type QuestionUpdateToOneWithWhereWithoutGameTemplatesInput = {
    where?: QuestionWhereInput
    data: XOR<QuestionUpdateWithoutGameTemplatesInput, QuestionUncheckedUpdateWithoutGameTemplatesInput>
  }

  export type QuestionUpdateWithoutGameTemplatesInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: IntFieldUpdateOperationsInput | number
    excludedFrom?: QuestionUpdateexcludedFromInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedbackWaitTime?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionUpdateOneWithoutQuestionNestedInput
    numericQuestion?: NumericQuestionUpdateOneWithoutQuestionNestedInput
  }

  export type QuestionUncheckedUpdateWithoutGameTemplatesInput = {
    uid?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    text?: StringFieldUpdateOperationsInput | string
    questionType?: StringFieldUpdateOperationsInput | string
    discipline?: StringFieldUpdateOperationsInput | string
    themes?: QuestionUpdatethemesInput | string[]
    difficulty?: NullableIntFieldUpdateOperationsInput | number | null
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    author?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: QuestionUpdatetagsInput | string[]
    timeLimit?: IntFieldUpdateOperationsInput | number
    excludedFrom?: QuestionUpdateexcludedFromInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedbackWaitTime?: NullableIntFieldUpdateOperationsInput | number | null
    isHidden?: NullableBoolFieldUpdateOperationsInput | boolean | null
    multipleChoiceQuestion?: MultipleChoiceQuestionUncheckedUpdateOneWithoutQuestionNestedInput
    numericQuestion?: NumericQuestionUncheckedUpdateOneWithoutQuestionNestedInput
  }

  export type GameTemplateCreateWithoutGameInstancesInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: GameTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: UserCreateNestedOneWithoutCreatedGameTemplatesInput
    questions?: QuestionsInGameTemplateCreateNestedManyWithoutGameTemplateInput
  }

  export type GameTemplateUncheckedCreateWithoutGameInstancesInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: GameTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creatorId: string
    questions?: QuestionsInGameTemplateUncheckedCreateNestedManyWithoutGameTemplateInput
  }

  export type GameTemplateCreateOrConnectWithoutGameInstancesInput = {
    where: GameTemplateWhereUniqueInput
    create: XOR<GameTemplateCreateWithoutGameInstancesInput, GameTemplateUncheckedCreateWithoutGameInstancesInput>
  }

  export type UserCreateWithoutInitiatedGameInstancesInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    studentProfile?: StudentProfileCreateNestedOneWithoutUserInput
    teacherProfile?: TeacherProfileCreateNestedOneWithoutUserInput
    gameParticipations?: GameParticipantCreateNestedManyWithoutUserInput
    createdGameTemplates?: GameTemplateCreateNestedManyWithoutCreatorInput
  }

  export type UserUncheckedCreateWithoutInitiatedGameInstancesInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    studentProfile?: StudentProfileUncheckedCreateNestedOneWithoutUserInput
    teacherProfile?: TeacherProfileUncheckedCreateNestedOneWithoutUserInput
    gameParticipations?: GameParticipantUncheckedCreateNestedManyWithoutUserInput
    createdGameTemplates?: GameTemplateUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type UserCreateOrConnectWithoutInitiatedGameInstancesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutInitiatedGameInstancesInput, UserUncheckedCreateWithoutInitiatedGameInstancesInput>
  }

  export type GameParticipantCreateWithoutGameInstanceInput = {
    id?: string
    liveScore?: number
    deferredScore?: number
    nbAttempts?: number
    status?: $Enums.ParticipantStatus
    joinedAt?: Date | string
    lastActiveAt?: Date | string | null
    completedAt?: Date | string | null
    user: UserCreateNestedOneWithoutGameParticipationsInput
  }

  export type GameParticipantUncheckedCreateWithoutGameInstanceInput = {
    id?: string
    userId: string
    liveScore?: number
    deferredScore?: number
    nbAttempts?: number
    status?: $Enums.ParticipantStatus
    joinedAt?: Date | string
    lastActiveAt?: Date | string | null
    completedAt?: Date | string | null
  }

  export type GameParticipantCreateOrConnectWithoutGameInstanceInput = {
    where: GameParticipantWhereUniqueInput
    create: XOR<GameParticipantCreateWithoutGameInstanceInput, GameParticipantUncheckedCreateWithoutGameInstanceInput>
  }

  export type GameParticipantCreateManyGameInstanceInputEnvelope = {
    data: GameParticipantCreateManyGameInstanceInput | GameParticipantCreateManyGameInstanceInput[]
    skipDuplicates?: boolean
  }

  export type GameTemplateUpsertWithoutGameInstancesInput = {
    update: XOR<GameTemplateUpdateWithoutGameInstancesInput, GameTemplateUncheckedUpdateWithoutGameInstancesInput>
    create: XOR<GameTemplateCreateWithoutGameInstancesInput, GameTemplateUncheckedCreateWithoutGameInstancesInput>
    where?: GameTemplateWhereInput
  }

  export type GameTemplateUpdateToOneWithWhereWithoutGameInstancesInput = {
    where?: GameTemplateWhereInput
    data: XOR<GameTemplateUpdateWithoutGameInstancesInput, GameTemplateUncheckedUpdateWithoutGameInstancesInput>
  }

  export type GameTemplateUpdateWithoutGameInstancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: UserUpdateOneRequiredWithoutCreatedGameTemplatesNestedInput
    questions?: QuestionsInGameTemplateUpdateManyWithoutGameTemplateNestedInput
  }

  export type GameTemplateUncheckedUpdateWithoutGameInstancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorId?: StringFieldUpdateOperationsInput | string
    questions?: QuestionsInGameTemplateUncheckedUpdateManyWithoutGameTemplateNestedInput
  }

  export type UserUpsertWithoutInitiatedGameInstancesInput = {
    update: XOR<UserUpdateWithoutInitiatedGameInstancesInput, UserUncheckedUpdateWithoutInitiatedGameInstancesInput>
    create: XOR<UserCreateWithoutInitiatedGameInstancesInput, UserUncheckedCreateWithoutInitiatedGameInstancesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutInitiatedGameInstancesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutInitiatedGameInstancesInput, UserUncheckedUpdateWithoutInitiatedGameInstancesInput>
  }

  export type UserUpdateWithoutInitiatedGameInstancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    studentProfile?: StudentProfileUpdateOneWithoutUserNestedInput
    teacherProfile?: TeacherProfileUpdateOneWithoutUserNestedInput
    gameParticipations?: GameParticipantUpdateManyWithoutUserNestedInput
    createdGameTemplates?: GameTemplateUpdateManyWithoutCreatorNestedInput
  }

  export type UserUncheckedUpdateWithoutInitiatedGameInstancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    studentProfile?: StudentProfileUncheckedUpdateOneWithoutUserNestedInput
    teacherProfile?: TeacherProfileUncheckedUpdateOneWithoutUserNestedInput
    gameParticipations?: GameParticipantUncheckedUpdateManyWithoutUserNestedInput
    createdGameTemplates?: GameTemplateUncheckedUpdateManyWithoutCreatorNestedInput
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    gameTemplate: GameTemplateCreateNestedOneWithoutGameInstancesInput
    initiatorUser?: UserCreateNestedOneWithoutInitiatedGameInstancesInput
  }

  export type GameInstanceUncheckedCreateWithoutParticipantsInput = {
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    gameTemplateId: string
    initiatorUserId?: string | null
  }

  export type GameInstanceCreateOrConnectWithoutParticipantsInput = {
    where: GameInstanceWhereUniqueInput
    create: XOR<GameInstanceCreateWithoutParticipantsInput, GameInstanceUncheckedCreateWithoutParticipantsInput>
  }

  export type UserCreateWithoutGameParticipationsInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    studentProfile?: StudentProfileCreateNestedOneWithoutUserInput
    teacherProfile?: TeacherProfileCreateNestedOneWithoutUserInput
    initiatedGameInstances?: GameInstanceCreateNestedManyWithoutInitiatorUserInput
    createdGameTemplates?: GameTemplateCreateNestedManyWithoutCreatorInput
  }

  export type UserUncheckedCreateWithoutGameParticipationsInput = {
    id?: string
    username: string
    email?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    role: $Enums.UserRole
    resetToken?: string | null
    resetTokenExpiresAt?: Date | string | null
    avatarEmoji?: string | null
    emailVerificationToken?: string | null
    emailVerificationTokenExpiresAt?: Date | string | null
    emailVerified?: boolean | null
    studentProfile?: StudentProfileUncheckedCreateNestedOneWithoutUserInput
    teacherProfile?: TeacherProfileUncheckedCreateNestedOneWithoutUserInput
    initiatedGameInstances?: GameInstanceUncheckedCreateNestedManyWithoutInitiatorUserInput
    createdGameTemplates?: GameTemplateUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type UserCreateOrConnectWithoutGameParticipationsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutGameParticipationsInput, UserUncheckedCreateWithoutGameParticipationsInput>
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameTemplate?: GameTemplateUpdateOneRequiredWithoutGameInstancesNestedInput
    initiatorUser?: UserUpdateOneWithoutInitiatedGameInstancesNestedInput
  }

  export type GameInstanceUncheckedUpdateWithoutParticipantsInput = {
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameTemplateId?: StringFieldUpdateOperationsInput | string
    initiatorUserId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserUpsertWithoutGameParticipationsInput = {
    update: XOR<UserUpdateWithoutGameParticipationsInput, UserUncheckedUpdateWithoutGameParticipationsInput>
    create: XOR<UserCreateWithoutGameParticipationsInput, UserUncheckedCreateWithoutGameParticipationsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutGameParticipationsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutGameParticipationsInput, UserUncheckedUpdateWithoutGameParticipationsInput>
  }

  export type UserUpdateWithoutGameParticipationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    studentProfile?: StudentProfileUpdateOneWithoutUserNestedInput
    teacherProfile?: TeacherProfileUpdateOneWithoutUserNestedInput
    initiatedGameInstances?: GameInstanceUpdateManyWithoutInitiatorUserNestedInput
    createdGameTemplates?: GameTemplateUpdateManyWithoutCreatorNestedInput
  }

  export type UserUncheckedUpdateWithoutGameParticipationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    resetToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    avatarEmoji?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: NullableBoolFieldUpdateOperationsInput | boolean | null
    studentProfile?: StudentProfileUncheckedUpdateOneWithoutUserNestedInput
    teacherProfile?: TeacherProfileUncheckedUpdateOneWithoutUserNestedInput
    initiatedGameInstances?: GameInstanceUncheckedUpdateManyWithoutInitiatorUserNestedInput
    createdGameTemplates?: GameTemplateUncheckedUpdateManyWithoutCreatorNestedInput
  }

  export type GameInstanceCreateManyInitiatorUserInput = {
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    gameTemplateId: string
  }

  export type GameParticipantCreateManyUserInput = {
    id?: string
    gameInstanceId: string
    liveScore?: number
    deferredScore?: number
    nbAttempts?: number
    status?: $Enums.ParticipantStatus
    joinedAt?: Date | string
    lastActiveAt?: Date | string | null
    completedAt?: Date | string | null
  }

  export type GameTemplateCreateManyCreatorInput = {
    id?: string
    name: string
    gradeLevel?: string | null
    themes?: GameTemplateCreatethemesInput | string[]
    discipline?: string | null
    description?: string | null
    defaultMode?: $Enums.PlayMode | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GameInstanceUpdateWithoutInitiatorUserInput = {
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameTemplate?: GameTemplateUpdateOneRequiredWithoutGameInstancesNestedInput
    participants?: GameParticipantUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceUncheckedUpdateWithoutInitiatorUserInput = {
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameTemplateId?: StringFieldUpdateOperationsInput | string
    participants?: GameParticipantUncheckedUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceUncheckedUpdateManyWithoutInitiatorUserInput = {
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameTemplateId?: StringFieldUpdateOperationsInput | string
  }

  export type GameParticipantUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    liveScore?: IntFieldUpdateOperationsInput | number
    deferredScore?: IntFieldUpdateOperationsInput | number
    nbAttempts?: IntFieldUpdateOperationsInput | number
    status?: EnumParticipantStatusFieldUpdateOperationsInput | $Enums.ParticipantStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActiveAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    gameInstance?: GameInstanceUpdateOneRequiredWithoutParticipantsNestedInput
  }

  export type GameParticipantUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameInstanceId?: StringFieldUpdateOperationsInput | string
    liveScore?: IntFieldUpdateOperationsInput | number
    deferredScore?: IntFieldUpdateOperationsInput | number
    nbAttempts?: IntFieldUpdateOperationsInput | number
    status?: EnumParticipantStatusFieldUpdateOperationsInput | $Enums.ParticipantStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActiveAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameParticipantUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameInstanceId?: StringFieldUpdateOperationsInput | string
    liveScore?: IntFieldUpdateOperationsInput | number
    deferredScore?: IntFieldUpdateOperationsInput | number
    nbAttempts?: IntFieldUpdateOperationsInput | number
    status?: EnumParticipantStatusFieldUpdateOperationsInput | $Enums.ParticipantStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActiveAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameTemplateUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameInstances?: GameInstanceUpdateManyWithoutGameTemplateNestedInput
    questions?: QuestionsInGameTemplateUpdateManyWithoutGameTemplateNestedInput
  }

  export type GameTemplateUncheckedUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameInstances?: GameInstanceUncheckedUpdateManyWithoutGameTemplateNestedInput
    questions?: QuestionsInGameTemplateUncheckedUpdateManyWithoutGameTemplateNestedInput
  }

  export type GameTemplateUncheckedUpdateManyWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    gradeLevel?: NullableStringFieldUpdateOperationsInput | string | null
    themes?: GameTemplateUpdatethemesInput | string[]
    discipline?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    defaultMode?: NullableEnumPlayModeFieldUpdateOperationsInput | $Enums.PlayMode | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInGameTemplateCreateManyQuestionInput = {
    gameTemplateId: string
    sequence: number
    createdAt?: Date | string
  }

  export type QuestionsInGameTemplateUpdateWithoutQuestionInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gameTemplate?: GameTemplateUpdateOneRequiredWithoutQuestionsNestedInput
  }

  export type QuestionsInGameTemplateUncheckedUpdateWithoutQuestionInput = {
    gameTemplateId?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInGameTemplateUncheckedUpdateManyWithoutQuestionInput = {
    gameTemplateId?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameInstanceCreateManyGameTemplateInput = {
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
    differedAvailableFrom?: Date | string | null
    differedAvailableTo?: Date | string | null
    initiatorUserId?: string | null
  }

  export type QuestionsInGameTemplateCreateManyGameTemplateInput = {
    questionUid: string
    sequence: number
    createdAt?: Date | string
  }

  export type GameInstanceUpdateWithoutGameTemplateInput = {
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    initiatorUser?: UserUpdateOneWithoutInitiatedGameInstancesNestedInput
    participants?: GameParticipantUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceUncheckedUpdateWithoutGameTemplateInput = {
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    initiatorUserId?: NullableStringFieldUpdateOperationsInput | string | null
    participants?: GameParticipantUncheckedUpdateManyWithoutGameInstanceNestedInput
  }

  export type GameInstanceUncheckedUpdateManyWithoutGameTemplateInput = {
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
    differedAvailableFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    differedAvailableTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    initiatorUserId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QuestionsInGameTemplateUpdateWithoutGameTemplateInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    question?: QuestionUpdateOneRequiredWithoutGameTemplatesNestedInput
  }

  export type QuestionsInGameTemplateUncheckedUpdateWithoutGameTemplateInput = {
    questionUid?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionsInGameTemplateUncheckedUpdateManyWithoutGameTemplateInput = {
    questionUid?: StringFieldUpdateOperationsInput | string
    sequence?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameParticipantCreateManyGameInstanceInput = {
    id?: string
    userId: string
    liveScore?: number
    deferredScore?: number
    nbAttempts?: number
    status?: $Enums.ParticipantStatus
    joinedAt?: Date | string
    lastActiveAt?: Date | string | null
    completedAt?: Date | string | null
  }

  export type GameParticipantUpdateWithoutGameInstanceInput = {
    id?: StringFieldUpdateOperationsInput | string
    liveScore?: IntFieldUpdateOperationsInput | number
    deferredScore?: IntFieldUpdateOperationsInput | number
    nbAttempts?: IntFieldUpdateOperationsInput | number
    status?: EnumParticipantStatusFieldUpdateOperationsInput | $Enums.ParticipantStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActiveAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    user?: UserUpdateOneRequiredWithoutGameParticipationsNestedInput
  }

  export type GameParticipantUncheckedUpdateWithoutGameInstanceInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    liveScore?: IntFieldUpdateOperationsInput | number
    deferredScore?: IntFieldUpdateOperationsInput | number
    nbAttempts?: IntFieldUpdateOperationsInput | number
    status?: EnumParticipantStatusFieldUpdateOperationsInput | $Enums.ParticipantStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActiveAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameParticipantUncheckedUpdateManyWithoutGameInstanceInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    liveScore?: IntFieldUpdateOperationsInput | number
    deferredScore?: IntFieldUpdateOperationsInput | number
    nbAttempts?: IntFieldUpdateOperationsInput | number
    status?: EnumParticipantStatusFieldUpdateOperationsInput | $Enums.ParticipantStatus
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastActiveAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
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