import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { capitalize } from 'lodash'
import { OperationObject } from 'openapi3-ts'
import { OptionsWithUrl } from 'request'
import { RequestInterceptorOptions } from '../definition'

export class TelegramDefinition extends SingleIntegrationDefinition {
  integrationKey = 'telegram'
  integrationVersion = '5'
  schemaUrl = null // https://app.swaggerhub.com/apis/JosXa/telegram-bot_api/5.0.0

  mapSchemaOperation(operationSchema: OperationObject): OperationObject {
    return {
      ...operationSchema,
      summary: capitalize(
        operationSchema.operationId
          ?.replace('/', '')
          .replace('.post', '')
          .replace(/([a-z])([A-Z])/g, '$1 $2'),
      ),
    }
  }

  requestInterceptor({ req }: RequestInterceptorOptions): OptionsWithUrl {
    // TODO there is a bug on how we parse the schema for reply_markup, so the body is sending the string 'undefined'
    //      since telegram expects and object, the request fails
    req.body = req.body.replace('reply_markup=undefined', '')

    return req
  }
}
