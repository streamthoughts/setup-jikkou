/**
 * Copyright 2023 The original authors
 * SPDX-License-Identifier: Apache License 2.0
 */

const core = require('@actions/core');
const setup = require('./lib/setup-jikkou');

(async () => {
  try {
    await setup();
  } catch (error) {
    core.setFailed(error.message);
  }
})();