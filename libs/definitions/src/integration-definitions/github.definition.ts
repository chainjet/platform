import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import request from 'request'
import { RequestInterceptorOptions } from '..'
import { PipedreamMixin } from '../mixins/pipedream.mixin'

export class GithubDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'github'
  pipedreamKey = 'github'
  integrationVersion = '1'
  schemaUrl = null

  requestInterceptor({ req }: RequestInterceptorOptions): request.OptionsWithUrl {
    req.headers = req.headers ?? {}
    req.headers.Accept = 'application/vnd.github.v3+json'
    return req
  }

  async getExternalOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/github/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
