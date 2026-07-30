import Valkey from 'iovalkey'
import { env } from './env'

export const valkey = new Valkey({
  host: env.VALKEY_HOST,
  port: env.VALKEY_PORT,
  username: env.VALKEY_USERNAME,
  password: env.VALKEY_PASSWORD,
})
