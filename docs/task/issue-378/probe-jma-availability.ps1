param([Parameter(Mandatory)][string]$RequestFile)

# Read-only public HTML probes, not the production CSV import pipeline.
$ErrorActionPreference = 'Stop'
$evidenceRoot = Join-Path $PSScriptRoot 'evidence'
New-Item -ItemType Directory -Path $evidenceRoot -Force | Out-Null
$requests = Get-Content -LiteralPath $RequestFile -Raw -Encoding utf8 | ConvertFrom-Json
foreach ($request in $requests) {
    $uri = [uri]$request.url
    if ($uri.Scheme -ne 'https' -or $uri.Host -ne 'www.data.jma.go.jp' -or $uri.AbsolutePath -notlike '/stats/etrn/view/*.php') {
        throw 'Only public JMA past-weather HTML tables are allowed.'
    }
    if ($request.id -notmatch '^[a-z0-9-]+$') { throw 'Invalid evidence id.' }
    $rawPath = Join-Path $evidenceRoot ($request.id + '.html')
    $jsonPath = Join-Path $evidenceRoot ($request.id + '.json')
    if (Test-Path -LiteralPath $jsonPath) { Write-Output "Already parsed: $($request.id)"; continue }
    if (-not (Test-Path -LiteralPath $rawPath)) {
        Invoke-WebRequest -Uri $uri -OutFile $rawPath -TimeoutSec 30
    }
    $html = [IO.File]::ReadAllText($rawPath)
    $table = [regex]::Match($html, '(?s)<table[^>]*id=["'']tablefix1["''].*?</table>').Value
    if (-not $table) { throw "Data table not found: $($request.id)" }
    $rows = @(foreach ($row in [regex]::Matches($table, '(?s)<tr\b[^>]*>(.*?)</tr>')) {
        $cells = @(foreach ($cell in [regex]::Matches($row.Groups[1].Value, '(?s)<t[dh]\b[^>]*>(.*?)</t[dh]>')) {
            $value = [regex]::Replace($cell.Groups[1].Value, '<img\b[^>]*alt="([^"]*)"[^>]*>', '$1')
            $value = [regex]::Replace($value, '<[^>]+>', ' ')
            [Net.WebUtility]::HtmlDecode(([regex]::Replace($value, '\s+', ' ')).Trim())
        })
        ,$cells
    })
    $snapshot = [ordered]@{
        id = $request.id; url = $request.url; retrieved_at = (Get-Item -LiteralPath $rawPath).LastWriteTimeUtc.ToString('o')
        source_sha256 = (Get-FileHash -LiteralPath $rawPath -Algorithm SHA256).Hash.ToLower()
        purpose = 'Availability probe only; not validated analysis data'; rows = $rows
    }
    $snapshot | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding utf8
    Write-Output "Parsed: $($request.id), $($rows.Count) table rows, sha256=$($snapshot.source_sha256)"
}
