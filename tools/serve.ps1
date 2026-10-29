# Tiny static server for previewing the UI in a browser: http://localhost:5173
param([int]$Port = 5173)

$root = Join-Path $PSScriptRoot '..\src' | Resolve-Path
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css'; '.js' = 'text/javascript'
  '.png' = 'image/png'; '.svg' = 'image/svg+xml'; '.mp3' = 'audio/mpeg'; '.ogg' = 'audio/ogg'
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($path -eq '') { $path = 'index.html' }
  $file = Join-Path $root $path
  $res = $ctx.Response
  if ((Test-Path $file -PathType Leaf) -and ([IO.Path]::GetFullPath($file).StartsWith($root.Path))) {
    $bytes = [IO.File]::ReadAllBytes($file)
    $res.ContentType = $types[[IO.Path]::GetExtension($file)]
    $res.Headers.Add('Cache-Control', 'no-store')
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
  }
  $res.Close()
}
