/**
 * Copyright 2023 The original authors
 * SPDX-License-Identifier: Apache License 2.0
 */

// Node.js core
const fs = require("fs");
const os = require("os");
const path = require("path");

// Github toolkit
const core = require("@actions/core");
const github = require("@actions/github");
const tc = require("@actions/tool-cache");
const http = require("@actions/http-client");
const io = require("@actions/io");

const project = { owner: "streamthoughts", repo: "jikkou" };

async function downloadCLI(url) {
  core.info(`Downloading Jikkou CLI from ${url}`);
  const pathToCLIZip = await tc.downloadTool(url);

  let pathToCLI = "";

  core.debug("Extracting Jikkou CLI zip file");
  if (os.platform().startsWith("win")) {
    core.debug(`Jikkou CLI Download Path is ${pathToCLIZip}`);
    const fixedPathToCLIZip = `${pathToCLIZip}.zip`;
    io.mv(pathToCLIZip, fixedPathToCLIZip);
    core.debug(`Moved download to ${fixedPathToCLIZip}`);
    pathToCLI = await tc.extractZip(fixedPathToCLIZip);
  } else {
    pathToCLI = await tc.extractZip(pathToCLIZip);
  }

  if (!pathToCLIZip || !pathToCLI) {
    throw new Error(`Unable to download Jikkou from ${url}`);
  }
  return pathToCLI;
}

// arch in [arm, x32, x64...]
// (https://nodejs.org/api/os.html#os_os_platform)
function mapArch(arch) {
  const mappings = {
    x64: "x86_64",
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...]
// (https://nodejs.org/api/os.html#os_os_platform)
function mapOS(os) {
  const mappings = {
    win32: "windows",
    darwin: "osx",
  };
  return mappings[os] || os;
}

async function getReleaseVersion(version) {
  const _http = new http.HttpClient("http-client-actions", [], {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const res = await _http.get(
    `https://api.github.com/repos/${project.owner}/${project.repo}/releases/${version}`,
  );
  const body = await res.readBody();
  const response = JSON.parse(body);
  return response;
}

async function findLatestReleaseVersion() {
  const response = await getReleaseVersion("latest");
  return response.tag_name.substring(1);
}

async function getBuild(version, platform, arch) {
  const response = await getReleaseVersion(`tags/v${version}`);
  if (!response || !response.assets) return null;

  const asset = response.assets.find((asset) =>
    asset.name.includes(`jikkou-${version}-${platform}-${arch}.zip`),
  );
  return !asset
    ? null
    : {
        name: `${asset.name}`,
        url: `${asset.browser_download_url}`,
        created_at: `${asset.created_at}`,
        size: `${asset.size}`,
      };
}

async function installWrapper(pathToCLI) {
  let source, target;

  // If we're on Windows, then the executable ends with .exe
  const exeSuffix = os.platform().startsWith("win") ? ".exe" : "";

  // Rename jikkou(.exe) to jikkou-bin(.exe)
  try {
    source = [pathToCLI, `jikkou${exeSuffix}`].join(path.sep);
    target = [pathToCLI, `jikkou-bin${exeSuffix}`].join(path.sep);
    core.debug(`Moving binary from ${source} to ${target}`);
    await io.mv(source, target);
  } catch (e) {
    core.error(`Unable to move binary from ${source} to ${target}`);
    throw e;
  }

  // Install our wrapper as jikkou
  try {
    source = path.resolve(
      [__dirname, "..", "wrapper", "dist", "index.js"].join(path.sep),
    );
    target = [pathToCLI, "jikkou"].join(path.sep);
    core.debug(`Copying ${source} to ${target}.`);
    await io.cp(source, target);
  } catch (e) {
    core.error(`Unable to copy ${source} to ${target}.`);
    throw e;
  }

  // Export a new environment variable, so our wrapper can locate the binary
  core.exportVariable("JIKKOU_CLI_PATH", pathToCLI);
}

async function run() {
  try {
    // Gather GitHub Actions inputs
    const inputVersion = core.getInput("jikkou_version") || "latest";
    const inputConfig = core.getInput("jikkou_config");
    const inputWrapper = core.getInput("jikkou_wrapper") === "true";

    // Gather OS details
    const osPlatform = os.platform();
    const osArch = os.arch();
    core.debug(`OS: {platform:"${osPlatform}", arch: "${osArch}"}`);

    // Gather Release
    core.info(`Finding releases for Jikkou version "${inputVersion}"`);
    const platform = mapOS(osPlatform);
    const arch = mapArch(osArch);

    let version = inputVersion;
    if (version === "latest") {
      version = await findLatestReleaseVersion();
    }

    core.info(
      `Getting build for Jikkou version ${version}: ${platform} ${arch}`,
    );

    const build = await getBuild(version, platform, arch);
    if (!build) {
      throw new Error(
        `Jikkou version ${version} not available for ${platform} and ${arch}`,
      );
    }
    // Download requested version
    const pathToCLIDirectory = await downloadCLI(build.url);

    // Add to path
    const pathToCLI = path.resolve(
      [pathToCLIDirectory, build.name.replace(".zip", ""), "bin"].join(
        path.sep,
      ),
    );

    // Configure Jikkou Config File
    if (inputConfig && inputConfig !== "") {
      const pathToConfigFile = path.resolve(inputConfig);
      if (fs.existsSync(pathToConfigFile)) {
        core.info(`Set environment variable JIKKOUCONFIG=${pathToConfigFile}`);
        core.exportVariable("JIKKOUCONFIG", pathToConfigFile);
      } else {
        core.warn(`Jikkou config file does not exist: "${pathToConfigFile}"`);
      }
    }

    // Install Wrapper
    if (inputWrapper) {
      await installWrapper(pathToCLI);
    }

    core.info(`Jikkou CLI path is ${pathToCLI}`);
    core.addPath(pathToCLI);

    const release = {
      version: version,
      name: build.name,
      url: build.url,
      created_at: build.created_at,
      size: build.size,
    };

    return release;
  } catch (error) {
    core.error(error);
    throw error;
  }
}

module.exports = run;
