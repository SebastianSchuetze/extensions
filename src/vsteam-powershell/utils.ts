import tl = require("azure-pipelines-task-lib/task");

export class AzureDevOpsCred {

    private hostUrl: string;
    private patToken: string;

    constructor(hostUrl: string, patToken: string) {
        if (typeof hostUrl.valueOf() !== 'string' || !hostUrl) {
            throw new Error("HostUrlCannotBeEmpty");
        }

        if (typeof patToken.valueOf() !== 'string' || !patToken) {
            throw new Error("PatTokenCannotBeEmpty");
        }

        this.hostUrl = hostUrl;
        this.patToken = patToken;
    }

    public getPatToken(): string {
        return this.patToken;
    }

    public getHostUrl(): string {
        return this.hostUrl;
    }

}

export class VsTeamTaskParameters {

    public scriptType!: string;
    public scriptPath!: string
    public scriptInline!: string
    public scriptArguments!: string
    public failOnStandardError!: boolean
    public workingDirectory!: string
    public errorActionPreference!: string
    public azureDevOpsCred!: AzureDevOpsCred
    public isDebugEnabled!: boolean
    public moduleSource!: string
    public requiredVersion!: string

    public getAzDPatToken(azDServiceConnection: string): AzureDevOpsCred {

        const endpointAuth = tl.getEndpointAuthorization(azDServiceConnection, true);
        if (endpointAuth !== undefined && endpointAuth.scheme === 'Token') {
            const hostUrl = tl.getEndpointUrl(azDServiceConnection, true);
            const patToken: string = endpointAuth.parameters.apitoken;
            if (hostUrl !== undefined && typeof hostUrl.valueOf() !== 'string' || !hostUrl) {
                throw new Error("UrlCannotBeEmpty");
            }

            if (typeof patToken.valueOf() !== 'string' || !patToken) {
                throw new Error("PatTokenCannotBeEmpty");
            }
            const credentials = new AzureDevOpsCred(hostUrl, patToken);
            return credentials;
        }
        else {
            throw new Error("OnlyTokenAuthAllowed");
        }
    }

    public getTaskParameters(): VsTeamTaskParameters {
        try {
            const errorActionPreference: string = tl.getInput('errorActionPreference', false) || 'Stop';
            switch (errorActionPreference.toUpperCase()) {
                case 'STOP':
                case 'CONTINUE':
                case 'SILENTLYCONTINUE':
                    break;
                default:
                    throw new Error("Option does not exist: " + errorActionPreference);
            }

            this.errorActionPreference = errorActionPreference.toUpperCase();
            this.scriptType = tl.getInput('FileOrInline', false)!;
            this.scriptPath = tl.getPathInput('PowerShellFilePath', false)!;
            this.scriptInline = tl.getInput('PowerShellInline', false)!;
            this.scriptArguments = tl.getInput('PsArguments', false)!;
            this.failOnStandardError = tl.getBoolInput('failOnStderr', false);
            const serviceName: string = tl.getInput('ConnectedServiceName', true)!;
            this.azureDevOpsCred = this.getAzDPatToken(serviceName)
            this.workingDirectory = tl.getPathInput('workingDirectory', true, true)!;
            this.isDebugEnabled = (process.env.SYSTEM_DEBUG || "").toLowerCase() === "true";
            this.moduleSource = tl.getInput('moduleSource', true)!;
            this.requiredVersion = tl.getInput('requiredVersion', false)!;


            return this

        } catch (error: any) {
            throw new Error("Error in Argumentconstruction:" + error.message);
        }
    }

}

export class VsTeamScriptGenerator {

    public generatePrescript(parameters: VsTeamTaskParameters): string[] {

        const tmpPReScript: string[] = [];

        tmpPReScript.push(`tree ${__dirname} /F`);

        switch (parameters.moduleSource.toUpperCase()) {
            case 'PSGALLERY':
                tmpPReScript.push(`Install-Module VSTeam -Scope -RequiredVersion ${parameters.requiredVersion} CurrentUser -Force`);
                break;
            case 'PACKED':
                tmpPReScript.push(`Import-Module -Name ${__dirname}/modules/VSTeam/VSTeam.psd1`);
                break;
            case 'AGENT':
                tmpPReScript.push(`Import-Module -Name VSTeam`);
                break;
            default:
                throw new Error("Option does not exist: " + parameters.moduleSource);
        }

        tmpPReScript.push(`Set-VSTeamAccount -Account "${parameters.azureDevOpsCred.getHostUrl()}" -PersonalAccessToken "${parameters.azureDevOpsCred.getPatToken()}"`);
        tmpPReScript.push(`$ErrorActionPreference='` + parameters.errorActionPreference.toUpperCase() + `'`);

        return tmpPReScript;
    }
}