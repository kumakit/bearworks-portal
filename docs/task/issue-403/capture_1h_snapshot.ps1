# Read-only remote snapshot; raw aggregates stay in the ignored local folder.
$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$probePath = Join-Path $PSScriptRoot 'probe_1h_snapshot.py'
$privateDir = Join-Path $repoRoot '.local-research\issue-403'
& git -C $repoRoot -c core.fsmonitor=false check-ignore -q '.local-research/issue-403/snapshot.json'
if ($LASTEXITCODE -ne 0) {
    throw '保存先が Git 対象外になっていません。保存を中止します。'
}

$snapshot = Get-Content -Raw -Encoding utf8 $probePath |
    ssh -o BatchMode=yes -o ConnectTimeout=8 oci 'cd /home/ubuntu/https_streamlit/dashboard && /home/ubuntu/.local/bin/uv run --locked python -B -'
if ($LASTEXITCODE -ne 0 -or -not $snapshot) {
    throw '1時間集計の読み取りに失敗しました。'
}

$parsed = $snapshot | ConvertFrom-Json
if ($parsed.schemaVersion -ne 1 -or $parsed.source -ne 'httpRequests1hGroups' -or
    $parsed.points.Count -ne 72) {
    throw '取得結果の形式が不正です。保存しません。'
}

New-Item -ItemType Directory -Force -Path $privateDir | Out-Null
$observedUtc = [DateTimeOffset]::Parse($parsed.observedAt).UtcDateTime
$fileName = 'snapshot_{0}.json' -f $observedUtc.ToString('yyyyMMddTHHmmssZ')
$target = Join-Path $privateDir $fileName
if (Test-Path -LiteralPath $target) {
    throw '同じ時刻の記録が存在します。上書きしません。'
}
Set-Content -LiteralPath $target -Value $snapshot -Encoding utf8 -NoNewline

[pscustomobject]@{
    result = 'SAVED_LOCALLY'
    observedAtUtc = $observedUtc.ToString('yyyy-MM-ddTHH:mm:ssZ')
    hours = $parsed.points.Count
    sampledHours = @($parsed.points | Where-Object { $_.sampleInterval -gt 1 }).Count
    gitIgnored = $true
} | ConvertTo-Json -Compress
