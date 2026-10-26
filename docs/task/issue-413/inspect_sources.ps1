param(
    [Parameter(Mandatory)][string]$SourceDirectory,
    [Parameter(Mandatory)][string]$OutputPath
)
# Phase 0 inspection only. Does not download, publish, or assert point continuity.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$cities = [ordered]@{'13201'='八王子';'13202'='立川';'13209'='町田';'13212'='日野';'13206'='府中';'13205'='青梅'}
function Read-ZipText($path, $pattern) {
    $zip = [IO.Compression.ZipFile]::OpenRead($path)
    try {
        $entry = @($zip.Entries | Where-Object FullName -Like $pattern)
        if ($entry.Count -ne 1) { throw "Expected one entry: $pattern" }
        $reader = [IO.StreamReader]::new($entry[0].Open())
        try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
    } finally { $zip.Dispose() }
}
function Summary($prices) {
    $sorted = @($prices | Sort-Object)
    if (!$sorted.Count) { throw 'Empty price series' }
    $middle = [int][math]::Floor($sorted.Count / 2)
    $median = if ($sorted.Count % 2) { $sorted[$middle] } else { ($sorted[$middle-1]+$sorted[$middle])/2 }
    return [ordered]@{count=$sorted.Count;mean=($sorted | Measure-Object -Average).Average;median=$median;min=$sorted[0];max=$sorted[-1]}
}
$path26 = Join-Path $SourceDirectory 'issue413-L01-26_13.zip'
$path16 = Join-Path $SourceDirectory 'issue413-L01-16_13.zip'
$data26 = (Read-ZipText $path26 '*.geojson') | ConvertFrom-Json
[xml]$data16 = Read-ZipText $path16 'L01-16_13.xml'
$ns = [Xml.XmlNamespaceManager]::new($data16.NameTable)
$ns.AddNamespace('ksj','http://nlftp.mlit.go.jp/ksj/schemas/ksj-app')
$points16 = @($data16.SelectNodes('//ksj:LandPrice',$ns))
$rows = foreach ($code in $cities.Keys) {
    $current = @($data26.features | Where-Object {$_.properties.L01_001 -eq $code -and $_.properties.L01_002 -eq '000'})
    $past = @($points16 | Where-Object {$_.administrativeAreaCode.InnerText -eq $code -and $_.representedLandCode.RepresentedLandCode.indexNumber -eq '000'})
    $ids = @($current | ForEach-Object { $_.properties.L01_001+'-'+$_.properties.L01_002+'-'+$_.properties.L01_003 })
    if (@($ids | Select-Object -Unique).Count -ne $ids.Count) { throw "Duplicate current ids: $code" }
    if (@($current | Where-Object {$_.properties.L01_007 -ne 2026 -or $_.properties.L01_008 -le 0}).Count) { throw "Invalid current price/year: $code" }
    if (@($past | Where-Object {$_.year.TimeInstant.timePosition -ne '2016' -or [int]$_.postedLandPrice -le 0}).Count) { throw "Invalid past price/year: $code" }
    $validCoordinates = @($current | Where-Object {$_.geometry.type -eq 'Point' -and $_.geometry.coordinates.Count -eq 2 -and $_.geometry.coordinates[0] -gt 138 -and $_.geometry.coordinates[0] -lt 141 -and $_.geometry.coordinates[1] -gt 34 -and $_.geometry.coordinates[1] -lt 37}).Count
    [ordered]@{
        code=$code;city=$cities[$code]
        year2026=(Summary @($current.properties.L01_008))
        year2016=(Summary @($past | ForEach-Object {[int]$_.postedLandPrice}))
        validCoordinates2026=$validCoordinates
        positive2016HistoryIn2026=@($current | Where-Object {$_.properties.L01_095 -gt 0}).Count
        continuityVerified=$false
    }
}
$result = [ordered]@{
    inspectedOn='2026-10-26';status='preliminary-not-for-publication'
    sourcePage='https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2026.html'
    sources=@(
        @{year=2026;url='https://nlftp.mlit.go.jp/ksj/gml/data/L01/L01-26/L01-26_13_GML.zip';sha256=(Get-FileHash $path26 -Algorithm SHA256).Hash},
        @{year=2016;url='https://nlftp.mlit.go.jp/ksj/gml/data/L01/L01-16/L01-16_13_GML.zip';sha256=(Get-FileHash $path16 -Algorithm SHA256).Hash}
    )
    officialAggregateReconciled=$false
    cities=@($rows)
}
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding utf8
