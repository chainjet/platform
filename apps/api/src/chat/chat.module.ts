import { CommonModule } from '@app/common'
import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { BullModule } from '@nestjs/bull'
import { forwardRef, Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { RunnerModule } from 'apps/runner/src/runner.module'
import { AccountCredentialsModule } from '../account-credentials/account-credentials.module'
import { AuthModule } from '../auth/auth.module'
import { IntegrationAccountsModule } from '../integration-accounts/integration-accounts.module'
import { IntegrationTriggersModule } from '../integration-triggers/integration-triggers.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { UsersModule } from '../users/users.module'
import { WorkflowActionsModule } from '../workflow-actions/workflow-actions.module'
import { WorkflowRunsModule } from '../workflow-runs/workflow-runs.module'
import { ChatbotConsumer } from '../workflow-triggers/services/chatbot.consumer'
import { WorkflowTriggersModule } from '../workflow-triggers/workflow-triggers.module'
import { WorkflowsModule } from '../workflows/workflows.module'
import { ContactSubscriptionController } from './controllers/contact-subscription.controller'
import { Campaign, CampaignAuthorizer } from './entities/campaign'
import { CampaignMessage } from './entities/campaign-message'
import { Contact, ContactAuthorizer } from './entities/contact'
import { Menu, MenuAuthorizer } from './entities/menu'
import { Order, OrderAuthorizer } from './entities/order'
import { CampaignResolver } from './resolvers/campaign.resolver'
import { ContactResolver } from './resolvers/contact.resolver'
import { MenuResolver } from './resolvers/menu.resolver'
import { OrderResolver } from './resolvers/order.resolver'
import { BroadcastConsumer } from './services/broadcast.consumer'
import { CampaignMessageService } from './services/campaign-message.service'
import { CampaignService } from './services/campaign.service'
import { ContactsConsumer } from './services/contact.consumer'
import { ContactService } from './services/contact.service'
import { MenuService } from './services/menu.service'
import { OrderService } from './services/order.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Contact])],
      dtos: [{ DTOClass: Contact }],
    }),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Campaign])],
      dtos: [{ DTOClass: Campaign }],
    }),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([CampaignMessage])],
      // dtos: [{ DTOClass: Campaign }],
    }),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Menu])],
      dtos: [{ DTOClass: Menu }],
    }),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Order])],
      dtos: [{ DTOClass: Order }],
    }),
    BullModule.registerQueue({
      name: 'chatbotMessage',
      settings: {
        lockDuration: 60000,
        stalledInterval: 30000,
        maxStalledCount: 3,
      },
    }),
    BullModule.registerQueue({
      name: 'broadcast',
      settings: {
        lockDuration: 60000,
        stalledInterval: 30000,
        maxStalledCount: 3,
      },
    }),
    BullModule.registerQueue({
      name: 'contacts',
      settings: {
        lockDuration: 60000,
        stalledInterval: 30000,
        maxStalledCount: 3,
      },
    }),
    BullModule.registerQueue({
      name: 'blockchainEvent',
      settings: {
        lockDuration: 60000,
        stalledInterval: 30000,
        maxStalledCount: 3,
      },
    }),
    CommonModule,
    AuthModule, // required for GraphqlGuard
    UsersModule, // required for GraphqlGuard
    IntegrationAccountsModule,
    IntegrationsModule,
    IntegrationTriggersModule,
    forwardRef(() => AccountCredentialsModule),
    WorkflowsModule,
    forwardRef(() => WorkflowTriggersModule),
    forwardRef(() => WorkflowActionsModule),
    WorkflowRunsModule,
    forwardRef(() => RunnerModule),
  ],
  providers: [
    // Resolvers
    ContactResolver,
    CampaignResolver,
    MenuResolver,
    OrderResolver,

    // Services
    ContactService,
    CampaignService,
    CampaignMessageService,
    MenuService,
    OrderService,

    // Authorizers
    ContactAuthorizer,
    CampaignAuthorizer,
    MenuAuthorizer,
    OrderAuthorizer,

    // Consumers
    ChatbotConsumer,
    BroadcastConsumer,
    ContactsConsumer,
  ],
  controllers: [ContactSubscriptionController],
  exports: [ContactService, CampaignService, MenuService, OrderService],
})
export class ChatsModule {}
