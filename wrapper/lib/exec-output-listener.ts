/**
 * Copyright 2023 The original authors
 * SPDX-License-Identifier: Apache License 2.0
 */

/**
 * Output listeners for an exec call
 * see: https://github.com/actions/toolkit/tree/main/packages/exec
 */
class ExecOutputListener {
  buffers: Buffer[]

  constructor () {
    this.buffers = [];
  }

  get listener () {
    const listen = function listen (data: Buffer) {
      this.buffers.push(data);
    };
    return listen.bind(this);
  }

  get data () {
    return Buffer.concat(this.buffers).toString();
  }
}

module.exports = ExecOutputListener;