# Back-nodejs

Backend Node.js em TypeScript para consultar o Azure DevOps e expor os dados ao frontend.

## Estrutura

- `src/index.ts`: bootstrap do servidor
- `src/routes`: mapeamento de endpoints
- `src/controllers`: camada HTTP
- `src/services`: regras de negocio e acesso ao Azure DevOps
- `src/config`: configuracao da aplicacao
- `src/utils`: utilitarios de resposta, CSV e datas

## Executar

O projeto le apenas o caminho do arquivo central via `.env`.

```bash
cd Back-nodejs
/home/iuri/.nvm/versions/node/v18.20.8/bin/npm run dev
```

## Configuracao

Por padrao o backend le o arquivo:

`../config.json`

Voce pode sobrescrever no `.env`:

- `APP_CONFIG_FILE`

## Scripts

- `npm run dev`
- `npm run build`
- `npm start`

## Configuracao central

O backend espera um arquivo `config.json` no diretorio pai de `Back-nodejs`.

Campos usados pelo backend:

- `server.port`
- `server.corsOrigin`
- `azureDevops.base64AuthInfo`
- `azureDevops.orgUrl`
- `azureDevops.daysAgo`
- `azureDevops.insecureTls`
- `azureDevops.caCertPath`
- `azureDevops.authorEmails`
- `azureDevops.repositories`

Se `azureDevops.caCertPath` for informado, o backend usa esse certificado CA para validar o TLS do Azure DevOps.
O caminho pode ser absoluto ou relativo ao `config.json`.
Se `caCertPath` estiver vazio, o backend continua usando `insecureTls` como fallback.

## Endpoints

- `GET /api/health`
- `GET /api/config`
- `GET /api/commits`
- `GET /api/commits/export`
