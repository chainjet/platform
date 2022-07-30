import { Definition } from '@app/definitions/definition'
import { Logger } from '@nestjs/common'

/**
 * Integrations with a parent, like aws, a integration account is shared across multiple integrations
 */
export abstract class MultiIntegrationDefinition extends Definition {
  protected logger = new Logger(MultiIntegrationDefinition.name)

  abstract readonly parentKey: string
  abstract readonly parentName: string
}
