# monitoring

Helsa til oppsettet i Neo, gjennom Neo sin MCP-server. Bare lesing.

| Skill | Hva |
|---|---|
| `monitoring:check-health` | Flytene og kjøringene i et tidsvindu: kort oversikt, «detaljer» gir alt |
| `monitoring:troubleshoot-run` | Én kjøring: hvilket steg, hvorfor, oppsett, data eller produkt |
| `monitoring:env` | Config-fila slik pluginen leser den |

`scripts/summarize-runs.mjs` teller kjøringene per flyt i vinduet, uten avhengigheter.

## Config

| Nøkkel | Standard | Hva |
|---|---|---|
| `monitoring.window` | `24h` | Tidsvinduet helsa ser på (`24h`, `7d`, `30d`) |
