#!/usr/bin/env bash
# Transforma um vídeo na abertura que roda conforme a rolagem (sequência de quadros WebP).
# Uso: scripts/hero-video.sh video.mp4 [inicio_s] [fim_s]
# Saída: public/img/hero/seq/{f,m}-NNN.webp + meta.json (o site detecta sozinho; apagar a pasta volta para a foto).
set -euo pipefail
V="${1:?uso: hero-video.sh video.mp4 [inicio_s] [fim_s]}"; INI="${2:-0}"; FIM="${3:-}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/img/hero/seq"
command -v ffmpeg >/dev/null || { echo "precisa do ffmpeg"; exit 1; }
rm -rf "$OUT"; mkdir -p "$OUT"
T=(-ss "$INI"); [ -n "$FIM" ] && T+=(-to "$FIM")
DUR=$(awk -v i="$INI" -v f="${FIM:-$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")}" 'BEGIN{print f-i}')
# computador: ~72 quadros (o navegador mistura quadros vizinhos, então fica fluido), até 1280 px de largura
FD=$(awk -v d="$DUR" 'BEGIN{printf "%.4f", 72/d}'); FM=$(awk -v d="$DUR" 'BEGIN{printf "%.4f", 48/d}')
ffmpeg -v error "${T[@]}" -i "$V" -an -vf "fps=$FD,scale='min(1280,iw)':-2" -c:v libwebp -quality 66 -compression_level 6 "$OUT/f-%03d.webp"
# celular: recorte vertical 5:8 do centro, 48 quadros, bem mais leve
ffmpeg -v error "${T[@]}" -i "$V" -an -vf "fps=$FM,crop=ih*5/8:ih,scale='min(540,iw)':-2" -c:v libwebp -quality 62 -compression_level 6 "$OUT/m-%03d.webp"
ND=$(ls "$OUT"/f-*.webp | wc -l); NM=$(ls "$OUT"/m-*.webp | wc -l)
printf '{"total":%d,"totalMobile":%d,"v":"%s"}\n' "$ND" "$NM" "$(date +%Y%m%d%H%M%S)" > "$OUT/meta.json"
echo "Quadros: $ND (PC, $(du -sh --block-size=1K "$OUT"/f-*.webp | awk '{s+=$1} END{print s}') KB) e $NM (celular, $(du -sh --block-size=1K "$OUT"/m-*.webp | awk '{s+=$1} END{print s}') KB)"
