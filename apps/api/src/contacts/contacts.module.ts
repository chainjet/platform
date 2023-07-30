import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { Contact, ContactAuthorizer } from './entities/contact'
import { ContactResolver } from './resolvers/contact.resolver'
import { ContactService } from './services/contact.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Contact])],
      dtos: [{ DTOClass: Contact }],
    }),
    AuthModule, // required for GraphqlGuard
    UsersModule, // required for GraphqlGuard
  ],
  providers: [
    // Resolvers
    ContactResolver,

    // Services
    ContactService,

    // Authorizers
    ContactAuthorizer,
  ],
  exports: [ContactService],
})
export class ContactsModule {}
