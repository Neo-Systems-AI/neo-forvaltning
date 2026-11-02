# konfig

Gjennomgang av oppsettet i Neo mot regler, på siste snapshot. Bare lesing.

| Skill | Hva |
|---|---|
| `konfig:konfig` | Reglene på ett miljø, med en prioritert liste over tiltak |
| `konfig:env` | Config-fila slik pluginen leser den |

Reglene står i `scripts/rules.mjs`, hver med navn, nivå og hvorfor. En regel slås av i `konfig.off`.
