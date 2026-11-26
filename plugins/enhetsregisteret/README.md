# enhetsregisteret

Oppslag i Enhetsregisteret, slik Brønnøysundregistrene selv svarer, for feilsøk av det Neo gjør med
organisasjonsnumre. Bare lesing, gjennom det åpne API-et (`data.brreg.no/enhetsregisteret/api`), uten innlogging.

| Skill | Hva |
|---|---|
| `enhetsregisteret:api` | `enhet`, `underenhet` og `underenheter` for et organisasjonsnummer |

`scripts/enhetsregisteret.mjs` har kommandoene, uten avhengigheter.

## Config

```json
"enhetsregisteret": { "miljo": "produksjon", "orgnr": "<kommunens eget, valgfritt>" }
```

Ingen hemmeligheter. Enhetsregisteret er åpne data, så `produksjon` (data.brreg.no) er det som gjelder.
Brønnøysundregistrene har et testmiljø med oppdiktede data (`test`, data.ppe.brreg.no). Uten `miljo` i config-fila må
`--miljo` sies; skriptet velger aldri et miljø selv.

## Det kunden må ha selv

Ingenting: API-et er åpent. Bruken følger Brønnøysundregistrenes vilkår for åpne data.
