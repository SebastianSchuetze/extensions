const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");
const WebpackCommon = require("./webpack.common.config");

const Target = WebpackCommon.GetTargetPath();
const TaskName = "vsteam-powershell";

const Settings = {
    "production": {
        Tag: "",
        TaskGuid: "bd15d14f-43af-429b-a1d4-13b892f5368b",
    },
    "development": {
        Tag: "Dev",
        TaskGuid: "27eb4bfc-a9e0-4984-b451-1133e3222a94",
    }
};

module.exports = env => {

    const validEnvs = Object.keys(Settings);
    if (!env.development && !env.production) {
        console.error(`BUILD_ENV not set correctly. Allowed values are: ${validEnvs.join(", ")}`);
        process.exit(1);
    }

    let envName = env.development ? "development" : "production";

    const config = {

        entry: {
            "main": `./src/${TaskName}/main.ts`,
        },

        plugins: [
            new CopyWebpackPlugin([
                // These files are needed by azure-pipelines-task-lib library.
                {
                    from: path.resolve("./node_modules/azure-pipelines-task-lib/lib.json"),
                    to: path.join(Target, TaskName)
                },
                {
                    from: path.resolve("./node_modules/azure-pipelines-task-lib/Strings"),
                    to: path.join(Target, TaskName)
                },

                {
                    from: path.join(__dirname, `./src/${TaskName}/task.json`),
                    to: path.join(Target, TaskName)
                },
                {
                    from: path.join(__dirname, "./images/icon.png"),
                    to: path.join(Target, TaskName, "icon.png")
                },
                {
                    from: path.join(__dirname, "./manifests/base.json"),
                    to: Target
                },
                {
                    from: path.join(__dirname, "./manifests", `${envName}.json`),
                    to: Target
                },
                {
                    from: path.join(__dirname, "./images/icon.png"),
                    to: Target
                },
                {
                    from: path.join(__dirname, "./src/README.md"),
                    to: Target
                }
            ]),

            WebpackCommon.PackageJsonLoadFixer(Target, [
                `${TaskName}/main.js`,
            ]),

            WebpackCommon.VersionStringReplacer(Target, [
                `${TaskName}/task.json`,
                "base.json"
            ]),

            new ReplaceInFileWebpackPlugin([
                {
                    dir: Target,
                    files: [
                        `${TaskName}/main.js`,
                        `${TaskName}/task.json`,
                        "base.json"
                    ],
                    rules: [
                        // This replacement is required to allow azure-pipelines-task-lib to load the
                        // json resource file correctly
                        {
                            search: /__webpack_require__\(.*\)\(resourceFile\)/,
                            replace: 'require(resourceFile)'
                        },
                        {
                            search: /{{taskid}}/ig,
                            replace: Settings[envName].TaskGuid
                        },
                        {
                            search: /{{tag}}/ig,
                            replace: Settings[envName].Tag
                        }
                    ]
                }
            ])
        ],
    };

    return WebpackCommon.FillDefaultNodeSettings(config, envName, TaskName);
};
