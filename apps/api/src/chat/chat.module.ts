import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { BullModule } from '@nestjs/bull'
import { forwardRef, Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { AccountCredentialsModule } from '../account-credentials/account-credentials.module'
import { AuthModule } from '../auth/auth.module'
import { IntegrationAccountsModule } from '../integration-accounts/integration-accounts.module'
import { UsersModule } from '../users/users.module'
import { Campaign, CampaignAuthorizer } from './entities/campaign'
import { CampaignMessage } from './entities/campaign-message'
import { Contact, ContactAuthorizer } from './entities/contact'
import { Menu, MenuAuthorizer } from './entities/menu'
import { CampaignResolver } from './resolvers/campaign.resolver'
import { ContactResolver } from './resolvers/contact.resolver'
import { MenuResolver } from './resolvers/menu.resolver'
import { BroadcastConsumer } from './services/broadcast.consumer'
import { CampaignMessageService } from './services/campaign-message.service'
import { CampaignService } from './services/campaign.service'
import { ContactService } from './services/contact.service'
import { MenuService } from './services/menu.service'

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
    BullModule.registerQueue({
      name: 'broadcast',
      settings: {
        lockDuration: 60000,
        stalledInterval: 30000,
        maxStalledCount: 3,
      },
    }),
    AuthModule, // required for GraphqlGuard
    UsersModule, // required for GraphqlGuard
    IntegrationAccountsModule,
    forwardRef(() => AccountCredentialsModule),
  ],
  providers: [
    // Resolvers
    ContactResolver,
    CampaignResolver,
    MenuResolver,

    // Services
    ContactService,
    CampaignService,
    CampaignMessageService,
    MenuService,

    // Authorizers
    ContactAuthorizer,
    CampaignAuthorizer,
    MenuAuthorizer,

    BroadcastConsumer,
  ],
  exports: [ContactService, CampaignService, MenuService],
})
export class ChatsModule {}
