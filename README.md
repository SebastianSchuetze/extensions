# azure-pipelines-task-template

## Introduction

This repository contains a quick start template for creating and publishing a custom azure pipelines task written in TypeScript. It uses [webpack](https://webpack.js.org) to bundle scripts and is configured to use [jest](https://jestjs.io/) to run tests. Note that this only works on Windows platform as of now.

## Main features
1. Contains all pieces for the development workflow for a pipeline task - local building/testing/packaging and AzureDevOps based CI and PR validation pipelines.

1. Timestamp based versioning - Standard workflows require you to maintain a version file for your extension and task which is okay for small/medium scale development. Although dynamic versioning is a must if more than one developer needs to work on an extension and frees developers from one thing that needs to be managed by hand.

## Getting started

There are a few small steps that need to be carried out before you can start using this template for your purpose-


1. Enter your publisher and author name in place of `{{publisher}}` and `{{author}}` strings. These files have references to these strings - [webpack config](webpack.config.js), [task.json](./src/custom-task/task.json) and [manifest.json](./src/manifest.json)

2. Create a personal access token for the Azure Devops account where you would test run your task. Refer [this](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops) to learn how to create a personal access token.

3. Set following environment variables to enable inner loop commands-
    - `$env:BUILD_ENV = 'development'`
    - `$env:ADO_PAT = ''`  - Your personal access token
    - `$env:ADO_ACCOUNT_URI = 'https://dev.azure.com/razorspoint-vsteamtests'` - The default collection URI for your account *(eg. <https://dev.azure.com/{{name}})>*
    - `$env:DEV_PUBLISHER = 'RazorSPoint'` - Id of your publisher account

4. Run following commands to verify setup-
    1. `npm install` (Installs npm dependencies)
    2. `npm run dev` (Builds, packages and publishes the extension)

5. Refer to [package.json](./package.json) to see the list of all commands.

## Typical inner loop commands

| What changed? | Which NPM command to run? | What it does? |
| ------------- |:-------------:|:----- |
| Task implementation | `npm run dev:task` | Build, package and update custom task without updating extension *(Faster)* |
| Anything else | `npm run dev` | Build, package and publish full extension *(Slower)* |

## Questions/Issues?

It is possible that this template does not work out of the box in your specific environment. This can happen because of multiple reasons. I would love to know the issues faced so that I can submit corresponding fixes. Please create a GitHub issue describing your problem.