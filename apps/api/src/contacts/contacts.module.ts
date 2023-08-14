import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { BullModule } from '@nestjs/bull'
import { forwardRef, Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { AccountCredentialsModule } from '../account-credentials/account-credentials.module'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { Campaign, CampaignAuthorizer } from './entities/campaign'
import { CampaignMessage } from './entities/campaign-message'
import { Contact, ContactAuthorizer } from './entities/contact'
import { CampaignResolver } from './resolvers/campaign.resolver'
import { ContactResolver } from './resolvers/contact.resolver'
import { BroadcastConsumer } from './services/broadcast.consumer'
import { CampaignMessageService } from './services/campaign-message.service'
import { CampaignService } from './services/campaign.service'
import { ContactService } from './services/contact.service'

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
    forwardRef(() => AccountCredentialsModule),
  ],
  providers: [
    // Resolvers
    ContactResolver,
    CampaignResolver,

    // Services
    ContactService,
    CampaignService,
    CampaignMessageService,

    // Authorizers
    ContactAuthorizer,
    CampaignAuthorizer,

    BroadcastConsumer,
  ],
  exports: [ContactService, CampaignService],
})
export class ContactsModule {}
