@echo off
title Servidor Biometria Facial
cls
echo ============================================================
echo   INICIANDO SERVIDOR LOCAL DE BIOMETRIA FACIAL (HTTP)
echo ============================================================
echo.
echo 1. Abrindo o sistema no seu navegador em: http://localhost:8080
echo 2. Nao feche esta janela enquanto estiver usando o sistema.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=8080; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add(\"http://localhost:$port/\"); try { $listener.Start() } catch { Write-Host 'Porta 8080 em uso, tentando 8081...'; $port=8081; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add(\"http://localhost:$port/\"); $listener.Start() }; Start-Process \"http://localhost:$port/\"; Write-Host \"Servidor HTTP Ativo na porta $port...\"; while ($listener.IsListening) { $context = $listener.GetContext(); $req = $context.Request; $res = $context.Response; $res.Headers.Add('Access-Control-Allow-Origin', '*'); $localPath = '.' + $req.Url.LocalPath.Replace('/', '\'); if ($localPath -eq '.\') { $localPath = '.\index.html' }; if (Test-Path $localPath -PathType Leaf) { try { $bytes = [System.IO.File]::ReadAllBytes($localPath); $res.ContentLength64 = $bytes.Length; if ($localPath.EndsWith('.html')) { $res.ContentType = 'text/html; charset=utf-8' } elseif ($localPath.EndsWith('.js')) { $res.ContentType = 'application/javascript' } elseif ($localPath.EndsWith('.css')) { $res.ContentType = 'text/css' } elseif ($localPath.EndsWith('.json')) { $res.ContentType = 'application/json' } else { $res.ContentType = 'application/octet-stream' }; $res.OutputStream.Write($bytes, 0, $bytes.Length) } catch {} } else { $res.StatusCode = 404 }; $res.Close() }"
