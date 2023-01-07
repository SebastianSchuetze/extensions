import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import fs = require('fs');
import os = require('os');
import path = require('path');
import { v4 as uuidV4 } from 'uuid';
import utils = require("./utils");

async function run() {
    try {

        tl.setResourcePath(path.join(__dirname, 'task.json'));

        // Get parameters.
        const vsTeamParameters = new utils.VsTeamTaskParameters()
        const parameters = vsTeamParameters.getTaskParameters()

        // Generate the script contents.
        console.log('GeneratingScript');
        const contents: string[] = [];

        contents.push(`Install-Module VSTeam -Scope CurrentUser -Force`);
        contents.push(`Set-VSTeamAccount -Account "${parameters.azureDevOpsCred.getHostUrl()}" -PersonalAccessToken "${parameters.azureDevOpsCred.getPatToken()}"`);
        contents.push(`$ErrorActionPreference='` + parameters.errorActionPreference.toUpperCase() + `'`)

        // file script or inline
        if (parameters.scriptType.toUpperCase() === 'FILE') {
            console.log("running via script file");
            contents.push(`. '${parameters.scriptPath.replace(/'/g, "''")}' ${parameters.scriptArguments}`.trim());
            console.log("Command length", contents[contents.length - 1]);
        }
        else {
            console.log("running via inline file");
            contents.push(parameters.scriptInline);
        }

        // Write the script to disk.
        tl.assertAgent('2.115.0');
        const tempDirectory = tl.getVariable('agent.tempDirectory')!;
        tl.checkPath(tempDirectory, `${tempDirectory} (agent.tempDirectory)`);
        const filePath = path.join(tempDirectory, uuidV4() + '.ps1');

        fs.writeFile(
            filePath,
            '\ufeff' + contents.join(os.EOL), // Prepend the Unicode BOM character.
            () => { });           // Using empty call back since it's requested but not needed currently

        // Run the script.
        // Note, use "-Command" instead of "-File" to match the Windows implementation. Refer to
        // comment on Windows implementation for an explanation why "-Command" is preferred.
        const powershell = tl.tool(tl.which('pwsh') || tl.which('powershell'))
            .arg('-NoLogo')
            .arg('-NoProfile')
            .arg('-NonInteractive')
            .arg('-ExecutionPolicy')
            .arg('Unrestricted')
            .arg('-Command')
            .arg(`. '${filePath.replace(/'/g, "''")}'`);

        const options = {
            cwd: parameters.workingDirectory,
            failOnStdErr: false,
            errStream: process.stdout, // Direct all output to STDOUT, otherwise the output may appear out
            outStream: process.stdout, // of order since Node buffers it's own STDOUT but not STDERR.
            ignoreReturnCode: true
        } as tr.IExecOptions;

        // Listen for stderr.
        let stderrFailure = false;
        if (parameters.failOnStandardError) {
            console.log("fail on standard error activated");
            powershell.on('stderr', (data) => {
                stderrFailure = true;
            });
        }

        // Run bash.
        const exitCode: number = await powershell.exec(options);

        // Fail on exit code.
        if (exitCode !== 0) {
            tl.setResult(tl.TaskResult.Failed, 'JS_ExitCode' + exitCode);
        }

        // Fail on stderr.
        if (stderrFailure) {
            tl.setResult(tl.TaskResult.Failed, 'JS_Stderr');
        }

    } catch (error: any) {
        tl.setResult(tl.TaskResult.Failed, error.message || 'run() failed');
    }
}

run();