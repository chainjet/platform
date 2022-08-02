import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import request from 'request'
import { RequestInterceptorOptions } from '..'

export class PagerdutyDefinition extends SingleIntegrationDefinition {
  integrationKey = 'pagerduty'
  integrationVersion = '2'
  schemaUrl = 'https://raw.githubusercontent.com/PagerDuty/api-schema/main/reference/REST/openapiv3.json'

  requestInterceptor({ req }: RequestInterceptorOptions): request.OptionsWithUrl {
    // Authorization header should be prefixed with "Token token="
    // see https://developer.pagerduty.com/docs/rest-api-v2/authentication/
    if (req.headers?.Authorization && !req.headers.Authorization.startsWith('Token token=')) {
      req.headers.Authorization = `Token token=${req.headers.Authorization}`
    }
    return req
  }
}
