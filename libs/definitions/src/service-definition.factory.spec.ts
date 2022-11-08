import { Test, TestingModule } from '@nestjs/testing'
import { IntegrationAccountsModule } from '../../../apps/api/src/integration-accounts/integration-accounts.module'
import { IntegrationActionsModule } from '../../../apps/api/src/integration-actions/integration-actions.module'
import { IntegrationTriggersModule } from '../../../apps/api/src/integration-triggers/integration-triggers.module'
import { IntegrationsModule } from '../../../apps/api/src/integrations/integrations.module'
import { closeMongoConnection, TestDatabaseModule } from '../../common/test/database/test-database.module'
import { IntegrationDefinitionFactory } from './integration-definition.factory'
import { AwsDefinition } from './integration-definitions/aws.definition'
import { GithubDefinition } from './integration-definitions/github.definition'

describe('ServiceDefinitionFactory', () => {
  let service: IntegrationDefinitionFactory

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [IntegrationDefinitionFactory],
      imports: [
        TestDatabaseModule,
        IntegrationsModule,
        IntegrationAccountsModule,
        IntegrationActionsModule,
        IntegrationTriggersModule,
      ],
    }).compile()

    service = testModule.get<IntegrationDefinitionFactory>(IntegrationDefinitionFactory)
  })

  afterAll(async () => await closeMongoConnection())

  describe('getDefinition', () => {
    it('should return a integration definition for the given key', () => {
      expect(service.getDefinition('aws')).toBeInstanceOf(AwsDefinition)
      expect(service.getDefinition('github')).toBeInstanceOf(GithubDefinition)
    })
  })

  describe('getAllDefinitions', () => {
    it('should return all integration definitions', () => {
      expect(service.getAllDefinitions().some((def) => def instanceof AwsDefinition)).toBe(true)
      expect(service.getAllDefinitions().some((def) => def instanceof GithubDefinition)).toBe(true)
    })
  })
})
