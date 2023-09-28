# setup-jikkou

The `streamthoughts/setup-jikkou` action is a JavaScript action that sets up Jikkou CLI in your **GitHub Actions** workflow
by:

* Downloading a specific version of **Jikkou CLI** and adding it to the `PATH`.

After you've used the action, subsequent steps in the same job can run arbitrary Jikkou commands using the GitHub
Actions run syntax. This allows most Jikkou commands to work exactly like they do on your local command line.

## Usage

```yaml
steps:
- uses: streamthoughts/setup-jikkou@v1
```

A specific version of Jikkou CLI can be installed:

```yaml
steps:
- uses: streamthoughts/setup-jikkou@v1
  with:
    jikkou_version: 0.28.0
```

## License

This code base is available under the Apache License, version 2.