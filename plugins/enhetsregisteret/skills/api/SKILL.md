---
name: api
description: Slår opp en enhet, en underenhet eller underenhetene til en enhet i Enhetsregisteret, slik Brønnøysundregistrene selv svarer. Brukes i feilsøk når Neo fant feil organisasjon, feil adresse eller en underenhet som er slettet. Bare lesing, åpent API uten innlogging.
---

# Enhetsregisteret

Det rå svaret fra Enhetsregisteret, så det kan settes opp mot det Neo gjorde: finnes nummeret,
er det en enhet eller en underenhet, er den slettet, konkurs eller under avvikling, og hvilken enhet hører den til?

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/enhetsregisteret.mjs" enhet [<orgnr>] [--miljo produksjon|test]
node "${CLAUDE_PLUGIN_ROOT}/scripts/enhetsregisteret.mjs" underenhet <orgnr> [--miljo produksjon|test]
node "${CLAUDE_PLUGIN_ROOT}/scripts/enhetsregisteret.mjs" underenheter [<orgnr>] [--side <n>] [--antall <n>] [--miljo produksjon|test]
```

- Svaret skrives ut som registeret ga det, og så én linje per enhet: nummer, navn, organisasjonsform, kommune,
  overordnet enhet, og om den er slettet, konkurs eller under avvikling.
- Uten orgnr brukes `enhetsregisteret.orgnr` fra config-fila (for eksempel kommunens eget).
- 404 betyr at nummeret ikke finnes som det du spurte etter: en underenhet slås opp med `underenhet`, ikke `enhet`.
- Et nummer med feil kontrollsiffer sies (`MERK: …`) og sendes likevel, så du ser hva registeret svarer.
- **Miljøet** er `--miljo`, ellers `enhetsregisteret.miljo`; uten noen av dem stopper skriptet og sier det.
  `produksjon` (data.brreg.no) er åpne data og det som gjelder; `test` (data.ppe.brreg.no) har oppdiktede data.

## Reglene

- **Bare lesing.** Ingen kall endrer noe.
- **Si alltid miljøet** svaret kom fra.
- Enhetsregisteret er åpent, men et enkeltpersonforetak bærer et personnavn. Skriv ikke mer om personen enn
  feilsøket trenger.
