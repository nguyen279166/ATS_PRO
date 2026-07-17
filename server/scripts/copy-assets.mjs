import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve("src/assets");
const destination = resolve("dist/src/assets");

mkdirSync(dirname(destination), { recursive: true });
cpSync(source, destination, { recursive: true });
