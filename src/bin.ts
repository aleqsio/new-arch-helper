#! /usr/bin/env node

import spawnAsync from "@expo/spawn-async";
import * as path from "path";
import PublicGoogleSheetsParser from "public-google-sheets-parser";
import chalk from "chalk";
import { compareVersions } from "compare-versions";

type PackageInfo = {
  minVersionSupported: string;
  packageName: string;
  recommendedAlternative: string;
  message?: string;
};
async function getNewArchSupportedPackages(): Promise<
  Record<string, PackageInfo>
> {
  const parser = new PublicGoogleSheetsParser(
    "1WzZHK6VF7qQRbNq0kUFSSReHJjf8-kQOzIhZWmEsPBg"
  );
  return Object.fromEntries(
    (await parser.parse()).map((row) => [row.packageName, row])
  );
}

async function getAllPackageDirectories() {
  const packages = [];
  const supportedPackages = await getNewArchSupportedPackages();
  try {
    let rnAutolinking = JSON.parse(
      (await spawnAsync("npx", ["--yes", "react-native", "config"])).stdout
    );

    for (const name in rnAutolinking.dependencies) {
      try {
        const dependency = rnAutolinking.dependencies[name];
        const packagePath = path.join(dependency.root, "package.json");
        const version = (
          await import(packagePath, {
            assert: { type: "json" },
          })
        )["default"].version;
        packages.push({ name, version });
      } catch (error) {
        console.error("Unable to scan package:", name);
      }
    }
  } catch (error) {
    console.error("Unable to run react-native config", error);
  }
  try {
    let expoAutolinking = JSON.parse(
      (
        await spawnAsync("npx", [
          "--yes",
          "expo-modules-autolinking",
          "search",
          "-j",
        ])
      ).stdout
    );
    for (const name in expoAutolinking) {
      const dependency = expoAutolinking[name];
      const version = dependency.version;
      packages.push({ name, version });
    }
  } catch (error) {
    console.error("Unable to run expo-modules-autolinking config", error);
  }
  console.log(chalk.bold("New architecture support helper"));
  console.log(chalk.bold("Scanned packages:\n"));
  for (const pkg of packages) {
    if (supportedPackages[pkg.name]) {
      const supportedPackage = supportedPackages[pkg.name];
      if (supportedPackage.minVersionSupported) {
        // has support
        if (
          compareVersions(pkg.version, supportedPackage.minVersionSupported) >=
          0
        ) {
          console.log(
            `🟢 ${chalk.bgGreen(pkg.name)}: ${pkg.version} – supported`
          );
        } else {
          console.log(
            `⬆️  ${chalk.bgYellowBright(pkg.name)} – update to ${
              supportedPackage.minVersionSupported
            } (currently ${pkg.version})`
          );
        }
      } else {
        // no support
        console.log(
          `🔴 ${chalk.bgRed(pkg.name)}: ${pkg.version} – not supported (yet)`
        );
        if (supportedPackage.recommendedAlternative) {
          console.log(
            `     🔧 ${chalk.bgRedBright(
              supportedPackage.recommendedAlternative
            )} - recommended alternative`
          );
        }
        if (supportedPackage.message) {
          console.log(`    ${chalk.bgRedBright(supportedPackage.message)}`);
        }
      }
    } else {
      console.log(
        `❔ ${chalk.bgGray(pkg.name)} – no information found (currently ${
          pkg.version
        })`
      );
    }
    console.log("\n");
  }

  // const nodeModulesPath = path.join(packagePath, "node_modules");
  // const allPackages = await glob("**/*.js", { ignore: "node_modules/**" });
  // if (packageJsonPath) {
  //   const packagePath = path.dirname(packageJsonPath);
  //   try {
  //     const packageJson = (
  //       await import(packageJsonPath, {
  //         assert: { type: "json" },
  //       })
  //     )["default"];

  //     for (const packageName in packageJson.dependencies) {
  //       const modulePath = path.join(packagePath, "node_modules", packageName);
  //       console.log(`${packageName}: ${modulePath}`);
  //     }
  //   } catch (error) {
  //     console.error("Error reading package.json:", error);
  //   }
  // } else {
  //   console.error(
  //     "No package.json file found in the directory or any of its parent directories."
  //   );
  // }
}

// Example usage
await getAllPackageDirectories();
