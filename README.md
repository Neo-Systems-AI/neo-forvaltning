# neo-forvaltning

Neo Systems sine offentlige plugins til Claude Code: for kommuner, virksomheter og partnere som forvalter oppsettet
sitt i [Neo](https://neosystems.ai), og for den som lager Altinn-skjemaer.

| Plugin | Hva |
|---|---|
| [`forvaltning`](./plugins/forvaltning) | Oppsettet i Neo som filer i et repo: snapshot, plan og gjennomføring i sandkassen, gjennom Neo sin MCP-server |
| [`altinn`](./plugins/altinn) | Bygg og publiser Altinn Studio-apper: Digdirs egne skills og `altinn-publisering` |

## Kom i gang

```
/plugin marketplace add Neo-Systems-AI/neo-forvaltning
/plugin install forvaltning@neo-forvaltning
/plugin install altinn@neo-forvaltning
```

Skal du forvalte oppsettet i Neo, start med et eget repo fra malen
[`neo-forvaltning-mal`](https://github.com/Neo-Systems-AI/neo-forvaltning-mal) («Use this template», privat, i din
egen organisasjon). Malen tar inn pluginene selv.

## Hva som ligger her, og hva som ikke gjør det

- **Her:** pluginene vi deler med kunder og partnere, versjonert. En fiks her treffer alle ved neste oppdatering.
- **I malen:** strukturen, reglene og de låste versjonene for ett kunderepo. Ingen plugins og ingen innhold.
- **Ikke her:** noe om en enkelt kunde, eller det Neo Systems bruker internt.

## Bidra

Endringer går som PR mot `main`, med `check` grønn (`node scripts/check.mjs` og `node --test "scripts/*.test.mjs"
"plugins/**/*.test.mjs"` lokalt). Bump versjonen både i `plugin.json` og i `.claude-plugin/marketplace.json`.

## Lisens

MIT, se [`LICENSE`](./LICENSE). Digdirs skills i `plugins/altinn` har sin egen MIT-lisens i
[`plugins/altinn/LICENSE-DIGDIR`](./plugins/altinn/LICENSE-DIGDIR).
