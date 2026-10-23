import https, { Agent as HttpsAgent } from 'node:https';
import { existsSync, readFileSync } from 'node:fs';

function createHttpsAgent(insecureTls: boolean, caCertPath: string): HttpsAgent {
  if (caCertPath) {
    if (!existsSync(caCertPath)) {
      throw new Error(`Arquivo de certificado CA nao encontrado em ${caCertPath}.`);
    }

    return new HttpsAgent({
      rejectUnauthorized: true,
      ca: readFileSync(caCertPath, 'utf-8')
    });
  }

  return new HttpsAgent({ rejectUnauthorized: !insecureTls });
}

export function httpGetJson<T>(
  url: string,
  headers: Record<string, string>,
  insecureTls: boolean,
  caCertPath: string
): Promise<T> {
  const agent = createHttpsAgent(insecureTls, caCertPath);

  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: 'GET',
        headers,
        agent
      },
      (response) => {
        let data = '';
        response.setEncoding('utf8');

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          if ((response.statusCode || 500) >= 400) {
            reject(new Error(`Azure DevOps retornou HTTP ${response.statusCode}. Corpo: ${data}`));
            return;
          }

          try {
            resolve(JSON.parse(data) as T);
          } catch (error) {
            reject(
              new Error(
                `Resposta JSON invalida do Azure DevOps. ${error instanceof Error ? error.message : ''}`
              )
            );
          }
        });
      }
    );

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });
}

export function httpPatchJson<TResponse, TBody>(
  url: string,
  headers: Record<string, string>,
  body: TBody,
  insecureTls: boolean,
  caCertPath: string
): Promise<TResponse> {
  const agent = createHttpsAgent(insecureTls, caCertPath);
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload).toString()
        },
        agent
      },
      (response) => {
        let data = '';
        response.setEncoding('utf8');

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          if ((response.statusCode || 500) >= 400) {
            reject(new Error(`Azure DevOps retornou HTTP ${response.statusCode}. Corpo: ${data}`));
            return;
          }

          try {
            resolve(JSON.parse(data) as TResponse);
          } catch (error) {
            reject(
              new Error(
                `Resposta JSON invalida do Azure DevOps. ${error instanceof Error ? error.message : ''}`
              )
            );
          }
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}
