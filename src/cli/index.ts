import dotenv from 'dotenv'
dotenv.config()

import { program } from "commander";
import { scanDependencies } from "../core/scanner";

program
  .version("1.0.0")
  .description("CLI para analizar dependencias y detectar breaking changes");

program
  .command("scan")
  .description("Escanea dependencias y detecta problemas")
  .action(async () => {
    await scanDependencies();
  });

program.parse(process.argv);