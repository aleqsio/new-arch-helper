#! /usr/bin/env node --no-warnings
import spawnAsync from "@expo/spawn-async";
import * as path from "path";
import PublicGoogleSheetsParser from "public-google-sheets-parser";
import chalk from "chalk";
import { compareVersions } from "compare-versions";
async function getNewArchSupportedPackages() {
    const parser = new PublicGoogleSheetsParser("1WzZHK6VF7qQRbNq0kUFSSReHJjf8-kQOzIhZWmEsPBg", { sheetId: "420110515" });
    return Object.fromEntries((await parser.parse()).map((row) => [row.packageName, row]));
}
async function runHelper() {
    console.log(chalk.bold("New architecture support helper\n"));
    const packages = [];
    console.log("Fetching data...");
    const supportedPackages = await getNewArchSupportedPackages();
    console.log("Getting autolinked packages...");
    try {
        let rnAutolinking = JSON.parse((await spawnAsync("npx", ["--yes", "react-native", "config"])).stdout);
        for (const name in rnAutolinking.dependencies) {
            try {
                const dependency = rnAutolinking.dependencies[name];
                const packagePath = path.join(dependency.root, "package.json");
                const version = (await import(packagePath, {
                    assert: { type: "json" },
                }))["default"].version;
                packages.push({ name, version, source: "rn" });
            }
            catch (error) {
                console.error("Unable to scan package:", name);
            }
        }
    }
    catch (error) {
        console.error("Unable to run react-native config", error);
    }
    try {
        let expoAutolinking = JSON.parse((await spawnAsync("npx", [
            "--yes",
            "expo-modules-autolinking",
            "search",
            "-j",
        ])).stdout);
        for (const name in expoAutolinking) {
            const dependency = expoAutolinking[name];
            const version = dependency.version;
            if (!packages.find((pkg) => pkg.name === name)) {
                packages.push({ name, version, source: "expo" });
            }
        }
    }
    catch (error) {
        console.error("Unable to run expo-modules-autolinking config", error);
    }
    // print out the results
    console.log(chalk.bold("\n\nScanned packages:\n"));
    for (const pkg of packages) {
        if (supportedPackages[pkg.name]) {
            const supportedPackage = supportedPackages[pkg.name];
            const testedOnString = supportedPackage.testedOnReactNativeVersion
                ? ` on RN${supportedPackage.testedOnReactNativeVersion}`
                : "";
            if (supportedPackage.minVersionSupported) {
                // has support
                if (compareVersions(pkg.version, supportedPackage.minVersionSupported) >=
                    0) {
                    console.log(`🟢 ${chalk.bgGreen(pkg.name)}: ${chalk.bold(pkg.version)} – tested successfully${testedOnString}`);
                }
                else {
                    console.log(`⬆️  ${chalk.bgYellowBright(pkg.name)} – update at least to ${supportedPackage.minVersionSupported} (currently ${chalk.bold(pkg.version)})`);
                }
            }
            else {
                // no support
                console.log(`🔴 ${chalk.bgRed(pkg.name)}: you have v${chalk.bold(pkg.version)} – tested${testedOnString}, may not work`);
                if (supportedPackage.recommendedAlternative) {
                    console.log(`     🔄 ${chalk.bold(supportedPackage.recommendedAlternative)} - recommended alternative`);
                }
                if (supportedPackage.message) {
                    console.log(`     ${chalk.white(supportedPackage.message)}`);
                }
            }
        }
        else {
            if (pkg.source === "expo") {
                console.log(`🟢 ${chalk.bgGreen(pkg.name)}: ${chalk.bold(pkg.version)} – expo modules are supported by default`);
            }
            else {
                console.log(`❔ ${chalk.bgGray(pkg.name)}: ${chalk.bold(pkg.version)} – not tested`);
            }
        }
        console.log("");
    }
}
await runHelper();
