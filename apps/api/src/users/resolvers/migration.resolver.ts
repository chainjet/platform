import { SecurityUtils } from '@app/common/utils/security.utils'
import { EmailService } from '@app/emails/services/email.service'
import { MigrateAccountTemplate } from '@app/emails/templates/migrateAccountTemplate'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { getAddress } from 'ethers/lib/utils'
import { GraphQLString } from 'graphql'
import { RequestMigrationPayload as MigrationPayload } from '../../auth/payloads/auth.payload'
import { AuthService } from '../../auth/services/auth.service'
import { UserService } from '../services/user.service'

@Resolver()
export class MigrationResolver {
  constructor(private userService: UserService, private emailService: EmailService, private authService: AuthService) {}

  @Mutation(() => MigrationPayload)
  async requestMigration(@Args({ name: 'email', type: () => GraphQLString }) email: string): Promise<MigrationPayload> {
    const user = await this.userService.findOne({ email })
    if (user) {
      const plainToken = SecurityUtils.generateRandomString(48)
      const verificationToken = await SecurityUtils.hashWithBcrypt(plainToken, 12)
      await this.userService.updateOne(user.id, { verificationToken })

      const template = new MigrateAccountTemplate(user.email, plainToken)
      await this.emailService.sendEmailTemplate(template, email)
    }
    return {
      result: true,
    }
  }

  @Mutation(() => MigrationPayload)
  async completeMigration(
    @Args({ name: 'email', type: () => GraphQLString }) email: string,
    @Args({ name: 'code', type: () => GraphQLString }) code: string,
    @Args({ name: 'data', type: () => GraphQLString }) data: string,
  ): Promise<MigrationPayload> {
    const user = await this.userService.findOne({ email })
    if (
      !user?.address &&
      user?.verificationToken &&
      (await SecurityUtils.bcryptHashIsValid(code, user.verificationToken))
    ) {
      try {
        const { message, signature } = JSON.parse(data)
        const { fields } = await this.authService.validateSignature(message, signature, null, false)
        await this.userService.updateById(user._id, { verificationToken: null, address: getAddress(fields.address) })
        return { result: true }
      } catch (e) {}
    }
    return {
      result: false,
    }
  }
}
