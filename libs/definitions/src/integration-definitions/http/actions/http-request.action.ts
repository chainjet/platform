import { convertKeys } from '@app/common/utils/object.utils'
import { RunResponse } from '@app/definitions/definition'
import { OperationAction } from '@app/definitions/opertion-action'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import axios from 'axios'
import { JSONSchema7 } from 'json-schema'

export class HttpRequestAction extends OperationAction {
  key = 'httpRequest'
  name = 'HTTP Request'
  description = 'Make an HTTP request'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['url', 'method'],
    properties: {
      url: { title: 'URL', type: 'string', format: 'uri' },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'CONNECT', 'OPTIONS', 'TRACE'],
      },
      contentType: {
        title: 'Content-Type',
        type: 'string',
        enum: ['application/json', 'application/xml', 'application/x-www-form-urlencoded', 'text/html', 'text/plain'],
      },
      headers: {
        title: 'Headers',
        type: 'object',
        additionalProperties: { type: 'string' },
      },
      queryParams: {
        title: 'Query Params',
        type: 'object',
        additionalProperties: { type: 'string' },
      },
      body: {
        title: 'Body',
        type: 'object',
        additionalProperties: true,
      },
      basicAuth: {
        title: 'Basic Authentication',
        type: 'object',
        properties: {
          username: { type: 'string' },
          password: { type: 'string', format: 'password' },
        },
      },
      proxy: {
        type: 'object',
        properties: {
          host: { type: 'string' },
          port: {
            type: 'integer',
            minimum: 1,
            maximum: 65535,
          },
          username: { type: 'string' },
          password: { type: 'string', format: 'password' },
        },
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      data: { type: 'object', additionalProperties: true },
      status: { type: 'number' },
      statusText: { type: 'string' },
      headers: { type: 'object' },
    },
  }
  learnResponseWorkflow = true

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
      const res = await axios({
        url: inputs.url,
        method: inputs.method ?? 'GET',
        headers,
        params: inputs.queryParams ?? {},
        data: inputs.body ?? (inputs.method === 'GET' ? undefined : {}),
        auth,
        proxy,
      })

      return {
        outputs: {
          data: res.data,
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        },
      }
    } catch (e) {
      throw new Error(e.response.data?.message ?? e.message)
    }
  }
}
