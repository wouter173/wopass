import { Effect, Schema } from 'effect'

const envSchema = Schema.Struct({
  VALKEY_PORT: Schema.NumberFromString.pipe(Schema.withDecodingDefault(Effect.succeed(''))),
  VALKEY_USERNAME: Schema.String.pipe(Schema.withDecodingDefault(Effect.succeed('default'))),
  VALKEY_HOST: Schema.String,
  VALKEY_PASSWORD: Schema.String,
})

export const env = Schema.decodeUnknownSync(envSchema)(process.env)
