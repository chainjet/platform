import { SecurityUtils } from '@app/common/utils/security.utils'
import { BadRequestException, HttpService, Logger, UnauthorizedException } from '@nestjs/common'
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { GraphQLBoolean, GraphQLString } from 'graphql'
import { ObjectId } from 'mongodb'
import { EmailService } from '../../../../../libs/emails/src/services/email.service'
import { ResetPasswordTemplate } from '../../../../../libs/emails/src/templates/resetPasswordTemplate'
import { ProjectService } from '../../projects/services/project.service'
import { User } from '../../users/entities/user'
import { UserService } from '../../users/services/user.service'
import { UserId } from '../decorators/user-id.decorator'
import { GraphqlGuard } from '../guards/graphql.guard'
import {
  CompleteExternalAuthPayload,
  CompletePasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from '../payloads/auth.payload'
import { AuthService } from '../services/auth.service'

@Resolver('Auth')
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name)

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly projectService: ProjectService,
    private readonly emailService: EmailService,
    private readonly httpService: HttpService,
  ) {}

  @Mutation(() => LoginPayload)
  async login(
    @Args({ name: 'username', type: () => GraphQLString }) username: string,
    @Args({ name: 'password', type: () => GraphQLString }) password: string,
  ): Promise<LoginPayload> {
    const user = await this.userService.findOneByEmailOrUsername(username)

    if (!user || !(await this.userService.passwordIsValid(user, password))) {
      throw new UnauthorizedException('Invalid username or password')
    }

    return this.completeLogin(user)
  }

  @Mutation(() => RegisterPayload)
  async register(
    @Args({ name: 'email', type: () => GraphQLString }) email: string,
    @Args({ name: 'username', type: () => GraphQLString }) username: string,
    @Args({ name: 'password', type: () => GraphQLString }) password: string,
  ): Promise<RegisterPayload> {
    this.logger.debug(`Registering user ${username}`)

    if (this.authService.blacklistedUsername(username)) {
      throw new BadRequestException('Username is not available')
    }

    const user = await this.userService.createOne({
      email,
      username,
      password: await SecurityUtils.hashWithBcrypt(password, 12),
      verified: false,
    })

    return await this.completeRegistration(user)
  }

  @Mutation(() => GraphQLBoolean)
  @UseGuards(GraphqlGuard)
  async logout(@UserId() userId: ObjectId): Promise<boolean> {
    await this.userService.updateOne(userId.toString(), {
      refreshTokenHash: undefined,
    })
    return true
  }

  // TODO
  @Mutation(() => GraphQLString)
  async getAccessToken(): Promise<string> {
    return 'Not implemented'
  }

  @Mutation(() => VerifyEmailPayload)
  async verifyEmail(
    @Args({ name: 'username', type: () => GraphQLString }) username: string,
    @Args({ name: 'code', type: () => GraphQLString }) code: string,
  ): Promise<VerifyEmailPayload> {
    const user = await this.userService.findOne({ username })
    if (!user?.verificationToken || user.verified) {
      return { error: 'Verification code is invalid or it has expired.' }
    }
    if (await SecurityUtils.bcryptHashIsValid(code, user.verificationToken)) {
      await this.userService.updateOne(user.id, { verified: true, verificationToken: undefined })
      return {}
    }
    return { error: 'Verification code is invalid or it has expired.' }
  }

  @Mutation(() => ResetPasswordPayload)
  async requestPasswordReset(
    @Args({ name: 'email', type: () => GraphQLString }) email: string,
  ): Promise<ResetPasswordPayload> {
    const user = await this.userService.findOne({ email })
    if (user) {
      const plainResetPasswordToken = await this.authService.generateAndSaveResetPasswordToken(user)
      const template = new ResetPasswordTemplate(user.username, plainResetPasswordToken)
      await this.emailService.sendEmailTemplate(template, email)
    }

    // always return true to avoid exposing existence of users
    return {
      result: true,
    }
  }

  @Mutation(() => CompletePasswordPayload)
  async completePasswordReset(
    @Args({ name: 'username', type: () => GraphQLString }) username: string,
    @Args({ name: 'code', type: () => GraphQLString }) code: string,
    @Args({ name: 'password', type: () => GraphQLString }) password: string,
  ): Promise<CompletePasswordPayload> {
    const user = await this.userService.findOne({ username })
    if (user?.resetPasswordToken && (await SecurityUtils.bcryptHashIsValid(code, user.resetPasswordToken))) {
      await this.userService.updateOne(user.id, {
        password: await SecurityUtils.hashWithBcrypt(password, 12),
        resetPasswordToken: undefined,
      })
      return {}
    }
    return { error: 'Reset password code is invalid or it has expired.' }
  }

  @Mutation(() => CompleteExternalAuthPayload)
  async completeExternalAuth(
    @Args({ name: 'id', type: () => GraphQLString }) id: string,
    @Args({ name: 'code', type: () => GraphQLString }) code: string,
    @Args({ name: 'username', type: () => GraphQLString }) username?: string,
    @Args({ name: 'email', type: () => GraphQLString }) email?: string,
  ): Promise<CompleteExternalAuthPayload> {
    const { user, isNew } = await this.userService.completeProviderAuth(id, code, username, email)
    if (isNew) {
      return await this.completeRegistration(user)
    }
    return await this.completeLogin(user)
  }

  async completeLogin(user: User): Promise<LoginPayload> {
    const plainRefreshToken = await this.authService.generateAndSaveRefreshToken(user)

    return {
      user,
      token: {
        ...this.authService.generateAccessToken(user),
        refreshToken: plainRefreshToken,
      },
    }
  }

  async completeRegistration(user: User): Promise<RegisterPayload> {
    this.logger.log(`Completing registration of user ${user.username}`)

    // Run Sign Up Workflow on ChainJet
    let signUpWorkflowData: Record<string, any>
    if (user.verified) {
      signUpWorkflowData = {
        verified: true,
      }
    } else {
      const plainVerificationToken = await this.userService.generateAndSaveVerificationToken(user)
      signUpWorkflowData = {
        verified: false,
        verificationCode: plainVerificationToken,
      }
    }
    await this.httpService
      .request({
        url: process.env.SIGN_UP_WORKFLOW_HOOK,
        method: 'POST',
        data: {
          username: user.username,
          email: user.email,
          ...signUpWorkflowData,
        },
      })
      .toPromise()

    const project = await this.projectService.createOne({
      owner: user._id,
      name: 'First Project',
      public: false,
    })

    const plainRefreshToken = await this.authService.generateAndSaveRefreshToken(user)

    return {
      user,
      token: {
        ...this.authService.generateAccessToken(user),
        refreshToken: plainRefreshToken,
      },
      project,
    }
  }
}
