# enhetsregisteret

Oppslag i Enhetsregisteret, slik Brønnøysundregistrene selv svarer, for feilsøk av det Neo gjør med
organisasjonsnumre. Bare lesing, gjennom det åpne API-et (`data.brreg.no/enhetsregisteret/api`), uten innlogging.

| Skill | Hva |
|---|---|
| `enhetsregisteret:enhetsregisteret` | `enhet`, `underenhet` og `underenheter` for et organisasjonsnummer |
| `enhetsregisteret:env` | Config-fila slik pluginen leser den |

`scripts/enhetsregisteret.mjs` har kommandoene, uten avhengigheter.

## Config

```json
"enhetsregisteret": { "environments": ["produksjon"], "orgnr": "<kommunens eget, valgfritt>" }
```

Ingen hemmeligheter, og pluginen går også uten config-fil (da i produksjon). Enhetsregisteret er åpne data, så det er
ikke noe eget testmiljø å sette opp nøkler til: `produksjon` er det som gjelder. Brønnøysundregistrene har et
testmiljø med oppdiktede data (`data.ppe.brreg.no`); det brukes som `test` når det står i `environments`.

## Det kunden må ha selv

Ingenting: API-et er åpent. Bruken følger Brønnøysundregistrenes vilkår for åpne data.
