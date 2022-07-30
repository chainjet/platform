import { IntegrationDefinitionFactory } from '@app/definitions/integration-definition.factory'
import { Injectable } from '@nestjs/common'
import { IntegrationInstallerService } from '../../../../libs/definitions/src/services/integration-installer.service'

@Injectable()
export class BootstrapService {
  constructor(
    protected integrationDefinitionFactory: IntegrationDefinitionFactory,
    protected integrationInstallerService: IntegrationInstallerService,
  ) {}

  async bootstrapIntegrations(integration?: string): Promise<void> {
    if (integration) {
      const definition = this.integrationDefinitionFactory.getDefinition(integration)
      await this.integrationInstallerService.install(definition)
    } else {
      const definitions = this.integrationDefinitionFactory.getAllDefinitions()
      for (const definition of definitions) {
        await this.integrationInstallerService.install(definition)
      }
    }
  }
}
