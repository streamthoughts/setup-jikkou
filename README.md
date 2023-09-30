# setup-jikkou

![Lisense](https://img.shields.io/github/license/streamthoughts/setup-jikkou)
![Issues](https://img.shields.io/github/issues/streamthoughts/setup-jikkou)
![Forks](https://img.shields.io/github/forks/streamthoughts/setup-jikkou)
![Stars](https://img.shields.io/github/stars/streamthoughts/setup-jikkou)
[![Setup Jikkou](https://github.com/streamthoughts/setup-jikkou/actions/workflows/setup-jikkou.yml/badge.svg)](https://github.com/streamthoughts/setup-jikkou/actions/workflows/setup-jikkou.yml)

**[Jikkou (jikkō / 実行)](https://github.com/streamthoughts/jikkou)** is an open-source tool designed to provide an efficient and easy way to manage, automate, and
provision resource configurations for Kafka, Schema Registry, etc.

The `streamthoughts/setup-jikkou` action is a JavaScript action that sets
up [Jikkou CLI](https://github.com/streamthoughts/jikkou) in your **GitHub Actions**
workflow by:

* Downloading a specific version of **Jikkou CLI** and adding it to the `PATH`.
* Configuring **JIKKOU CLI** with a custom configuration file and automatically setting up the `JIKKOUCONFIG`
  environment variable.
* Installing a **wrapper script** to wrap calls of the Jikkou CLI binary to expose its `STDOUT`, `STDERR`,
  and exit code as outputs named `stdout`, `stderr`, and `exitcode` respectively.

After you've used the action, subsequent steps in the same job can run arbitrary Jikkou commands using the GitHub
Actions run syntax. This allows most Jikkou commands to work exactly like they do on your local command line.

## Usages

```yaml
steps:
  - uses: streamthoughts/setup-jikkou@v1
```

A specific version of Jikkou CLI can be installed:

```yaml
steps:
  - uses: streamthoughts/setup-jikkou@v0.1.0
    with:
      jikkou_version: 0.28.0
```

A custom configuration file can be specified:

```yaml
steps:
  - uses: streamthoughts/setup-jikkou@v0.1.0
    with:
      jikkou_config: ./config/jikkouconfig.json
```

## Inputs

This Action additionally supports the following inputs :

| Property	        | Default  | Description                                                                                                                                                       |
|------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `jikkou_version` | `latest` | The version of Jikkou CLI to install. A value of `latest` will install the latest version of Jikkou CLI.                                                          |
| `jikkou_config`  |          | The path to the Jikkou CLI config file. If set, Jikkou CLI will be configured through the `JIKKOUCONFIG` environment variable.                                    |
| `jikkou_wrapper` | `true`   | If `true`,  wrap calls of the Jikkou CLI binary to expose its `STDOUT`, `STDERR`, and exit code as outputs named `stdout`, `stderr`, and `exitcode` respectively. |

## Outputs

Only available when input `jikkou-wrapper` is `true`.

| Property	  | Description                                 |
|------------|---------------------------------------------|
| `stdout`   | STDOUT of the Jikkou CLI execution call.    |
| `stderr`   | STDERR of the Jikkou CLI execution call.    |
| `exitcode` | Exit code of the Jikkou CLI execution call. |

## Documentation

Check the official [documentation](https://streamthoughts.github.io/jikkou/) for further usage about Jikkou CLI.

## 💡 Contributions

Any feedback, bug reports and PRs are greatly appreciated!

- **Source Code**: https://github.com/streamthoughts/setup-jikkou
- **Issue Tracker**: https://github.com/streamthoughts/setup-jikkou

## 🙏 Show your support

You think this project can help you or your team to manage your Apache Kafka Cluster ?
Please ⭐ this repository to support us!

## License

This code base is available under the Apache License, version 2.