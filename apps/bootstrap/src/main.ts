import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { BootstrapModule } from './bootstrap.module'
import { BootstrapService } from './services/bootstrap.service'

/**
 * This app is a standalone application https://docs.nestjs.com/standalone-applications
 *
 * Bootstrap all integrations:
 *   $ yarn start bootstrap
 *
 * Bootstrap a single integration:
 *   $ yarn start bootstrap -- -- [integration]
 *
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(BootstrapModule)

  const lastArgv = process.argv.pop()
  const integration = lastArgv?.includes('/') ? undefined : lastArgv

  const bootstrapService = app.get(BootstrapService)
  logger.log(integration ? `Bootstrapping ${integration}` : 'Bootstrapping integrations')
  await bootstrapService.bootstrapIntegrations(integration)
  logger.log('Integrations bootstrapped')

  await app.close()
}

void bootstrap()
