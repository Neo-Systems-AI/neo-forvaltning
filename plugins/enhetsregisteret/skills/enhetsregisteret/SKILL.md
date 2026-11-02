---
name: enhetsregisteret
description: Slår opp en enhet, en underenhet eller underenhetene til en enhet i Enhetsregisteret, slik Brønnøysundregistrene selv svarer. Brukes i feilsøk når Neo fant feil organisasjon, feil adresse eller en underenhet som er slettet. Bare lesing, åpent API uten innlogging.
---

# Enhetsregisteret

Det rå svaret fra Enhetsregisteret, så det kan settes opp mot det Neo gjorde (`/helse:feilsok`): finnes nummeret,
er det en enhet eller en underenhet, er den slettet, konkurs eller under avvikling, og hvilken enhet hører den til?

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/enhetsregisteret.mjs" enhet [<orgnr>] [--miljo <miljø>]
node "${CLAUDE_PLUGIN_ROOT}/scripts/enhetsregisteret.mjs" underenhet <orgnr> [--miljo <miljø>]
node "${CLAUDE_PLUGIN_ROOT}/scripts/enhetsregisteret.mjs" underenheter [<orgnr>] [--side <n>] [--antall <n>] [--miljo <miljø>]
```

- Svaret skrives ut som registeret ga det, og så én linje per enhet: nummer, navn, organisasjonsform, kommune,
  overordnet enhet, og om den er slettet, konkurs eller under avvikling.
- Uten orgnr brukes `enhetsregisteret.orgnr` fra config-fila (for eksempel kommunens eget).
- 404 betyr at nummeret ikke finnes som det du spurte etter: en underenhet slås opp med `underenhet`, ikke `enhet`.
- Et nummer med feil kontrollsiffer sies (`MERK: …`) og sendes likevel, så du ser hva registeret svarer.
- **Miljøet** er `produksjon` (data.brreg.no), også uten config-fil. Enhetsregisteret er åpne data, så det finnes ikke
  et eget testmiljø å ha nøkler til. Brønnøysundregistrene har et testmiljø med oppdiktede data (data.ppe.brreg.no),
  som `test` når det står i `enhetsregisteret.environments`.

## Reglene

- **Bare lesing.** Ingen kall endrer noe.
- **Si alltid miljøet** svaret kom fra.
- Enhetsregisteret er åpent, men et enkeltpersonforetak bærer et personnavn. Skriv ikke mer om personen enn
  feilsøket trenger.
