import fs from "fs";
import path from "path";
import axios from "axios";

export async function checkTypeSupport(dep: string): Promise<boolean | null> {
  const packageJsonPath = path.join("node_modules", dep, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    if (packageJson.types || packageJson.typings) {
      return true;
    }
  }

  try {
    const response = await axios.get(`https://registry.npmjs.org/@types/${dep}`);
    if (response.status === 200) {
      return false;
    }
  } catch (error) {
    return null;
  }

  return null;
}