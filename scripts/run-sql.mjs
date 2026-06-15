import { readFileSync } from "node:fs"
import { Pool } from "pg"
import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"

const signer = new Signer({
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN,
    clientConfig: { region: process.env.AWS_REGION },
  }),
  region: process.env.AWS_REGION,
  hostname: process.env.PGHOST,
  username: process.env.PGUSER || "postgres",
  port: 5432,
})

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE || "postgres",
  port: 5432,
  user: process.env.PGUSER || "postgres",
  password: () => signer.getAuthToken(),
  ssl: { rejectUnauthorized: false },
  max: 5,
})

const files = process.argv.slice(2)
for (const file of files) {
  const sql = readFileSync(file, "utf8")
  console.log(`\n=== Running ${file} ===`)
  await pool.query(sql)
  console.log(`=== Done ${file} ===`)
}
await pool.end()
console.log("All scripts executed.")
