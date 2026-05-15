import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createSwaggerSpec from '../src/config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '../docs/swagger.json');

const swaggerSpec = createSwaggerSpec();

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(swaggerSpec, null, 2)}\n`);

console.log(`Swagger docs generated at ${path.relative(process.cwd(), outputPath)}`);
