#!/usr/bin/env node
/**
 * Copyright 2023 The original authors
 * SPDX-License-Identifier: Apache License 2.0
 */

// Libs
const ExecOutputListener = require("./lib/exec-output-listener");

// Node.js core
const os = require("os");
const path = require("path");

// Github toolkit
const core = require("@actions/core");
const io = require("@actions/io");
const exec = require("@actions/exec");

// Get path to Jikkou CLI
const pathToCLI = (function () {
  const exeSuffix = os.platform().startsWith("win") ? ".exe" : "";
  return [process.env.JIKKOU_CLI_PATH, `jikkou-bin${exeSuffix}`].join(path.sep);
})();

// Throw if 'jikkou' is not found
async function checkJikkouCLI() {
  return io.which(pathToCLI, true);
}

(async () => {
  // Check Jikkou CLI is installed
  checkJikkouCLI();

  // Get Args
  // The two first args correspond to the process.execPath and the path to the file being executed.
  const args = process.argv.slice(2);

  // Setup Exec options.
  const options = {
    // will not fail on non zero.
    ignoreReturnCode: true,
    // Don't fail if output to stderr.
    failOnStdErr: false,
  };

  // Listeners for output.
  const stdout = new ExecOutputListener();
  const stderr = new ExecOutputListener();
  options.listeners = { stdout: stdout.listener, stderr: stderr.listener };

  // Execute
  core.debug(`Exec Jikkou CLI with args ${args}.`);
  const exitCode = await exec.exec(pathToCLI, args, options);

  // Debug stdout, stderr, and exitCode
  core.debug(`Jikkou CLI exited with code ${exitCode}.`);
  core.debug(`stdout: ${stdout.data}`);
  core.debug(`stderr: ${stderr.data}`);
  core.debug(`exitcode: ${exitCode}`);

  // Set outputs, stdout, stderr, and exitCode
  core.setOutput("stdout", stdout.data);
  core.setOutput("stderr", stderr.data);
  core.setOutput("exitcode", exitCode.toString(10));

  if (exitCode === 0 || exitCode === 2) {
    // 0: Execution is considered a success A exitCode of 0 is considered a success
    // 2: May be returned when invalid input files are passed in arguments
    return;
  }

  // A non-zero exitCode is considered an error
  core.setFailed(`Jikkou CLI exited with code ${exitCode}.`);
})();
