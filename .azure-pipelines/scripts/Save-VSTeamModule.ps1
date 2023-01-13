# download and save the VSTeam module into the folder ./dist/modules/

[CmdletBinding()]
param (
    [Parameter(Mandatory=$false)]
    [string]
    $Module = 'VSTeam',
    [Parameter(Mandatory=$false)]
    [string]
    $Version = 'latest',
    [Parameter(Mandatory=$false)]
    [string]
    $TargetDirectory = './dist/vsteam-powershell/modules/'
)

# if latest
if ($Version -eq 'latest') {
    $Version = (Find-Module -Name $Module -Repository PSGallery | Select-Object -First 1).Version
}

Save-Module -Name $Module -Path $TargetDirectory -RequiredVersion $Version -Force

$versionDir = "$TargetDirectory/$Module/$Version"

Get-ChildItem $versionDir -Directory | Move-Item -Force -Destination {
    $_.Parent.Parent.FullName
}

Get-ChildItem $versionDir -File -Force | Move-Item -Force -Destination {
    $_.Directory.Parent.FullName
}

Remove-Item -Path "$TargetDirectory/$Module/$Version" -Recurse