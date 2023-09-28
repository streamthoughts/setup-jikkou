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

async function run() {
  try {
    // Gather GitHub Actions inputs
    const inputVersion = core.getInput("jikkou_version") || "latest";
    const inputConfig = core.getInput("jikkou_config");

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
    core.info(`Jikkou CLI path is ${pathToCLI}`);
    core.addPath(pathToCLI);

    if (inputConfig) {
      const pathToConfigFile = path.resolve(inputConfig);
      core.info(`Set environment variable JIKKOUCONFIG=${pathToConfigFile}`);
      core.exportVariable("JIKKOUCONFIG", pathToConfigFile);
    }

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
