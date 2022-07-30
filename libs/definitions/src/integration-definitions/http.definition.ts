import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { HttpService } from '@nestjs/common'
import { RunResponse } from '..'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'
import { convertKeys } from '../../../common/src/utils/object.utils'

export class HttpDefinition extends SingleIntegrationDefinition {
  integrationKey = 'http'
  integrationVersion = '1'
  schemaUrl = null

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.url) {
      throw new Error('URL is required')
    }

    // Header names are case-insensitive (RFC 2616)
    const headers = {
      'content-type': inputs.contentType,
      'user-agent': 'ChainJet.io/1.0',
      ...convertKeys(inputs.headers ?? {}, (key) => key.toLowerCase()),
    }

    const auth = inputs.basicAuth?.username
      ? { username: inputs.basicAuth.username, password: inputs.basicAuth.password }
      : undefined

    const proxy = inputs.proxy?.host
      ? {
          host: inputs.proxy.host,
          port: inputs.proxy.port,
          auth: { username: inputs.proxy.username, password: inputs.proxy.password },
        }
      : undefined

    try {
      const res = await new HttpService()
        .request({
          url: inputs.url,
          method: inputs.method ?? 'GET',
          headers,
          params: inputs.queryParams ?? {},
          data: inputs.body ?? {},
          auth,
          proxy,
        })
        .toPromise()

      return {
        outputs: {
          data: res.data,
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        },
      }
    } catch (e) {
      throw new Error(e.response.data)
    }
  }
}
