import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize, FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import CryptoJS from 'crypto-js'
import { GraphQLBoolean } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { JSONSchema7 } from 'json-schema'
import { IntegrationAccount } from '../../integration-accounts/entities/integration-account'
import { User } from '../../users/entities/user'

@Injectable()
export class AccountCredentialAuthorizer extends OwnedAuthorizer<AccountCredential> {}

@ObjectType()
@OwnedEntity()
@Authorize<AccountCredential>(AccountCredentialAuthorizer)
@EntityRef('integrationAccount', () => IntegrationAccount)
export class AccountCredential extends BaseEntity {
  @prop({ ref: User, required: true, index: true })
  readonly owner!: Reference<User>

  @FilterableField(() => ID)
  @prop({ ref: IntegrationAccount, required: true, index: true })
  readonly integrationAccount!: Reference<IntegrationAccount>

  @Field()
  @prop({ required: true })
  name: string

  // Placeholder for credential pairs input
  credentialInputs: Record<string, string>

  /**
   * Get decrypted credentials
   */
  public get credentials(): Record<string, string> {
    const key = process.env.CREDENTIALS_AES_KEY
    if (!key) {
      throw new InternalServerErrorException('Credentials key not set')
    }
    if (!this.encryptedCredentials) {
      return {}
    }
    const decryption = CryptoJS.AES.decrypt(this.encryptedCredentials, key)
    const unencryptedCredentials = JSON.parse(decryption.toString(CryptoJS.enc.Utf8))
    return {
      ...(this.fields ?? {}),
      ...unencryptedCredentials,
    }
  }

  public set credentials(credentials: Record<string, string>) {
    const key = process.env.CREDENTIALS_AES_KEY
    if (!key) {
      throw new InternalServerErrorException('Credentials key not set')
    }
    this.encryptedCredentials = CryptoJS.AES.encrypt(JSON.stringify(credentials), key).toString()
    this.lastCredentialUpdate = new Date()
  }

  @prop()
  encryptedCredentials?: string

  @prop()
  lastCredentialUpdate?: Date

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  fields: Record<string, string | number>

  /**
   * Stores references for operations with dynamic schemas.
   */
  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  schemaRefs?: Record<string, JSONSchema7>

  @Field(() => GraphQLBoolean, { defaultValue: false })
  @prop({ default: false })
  authExpired?: boolean
}

@InputType()
export class CreateAccountCredentialInput {
  @Field(() => ID)
  integrationAccount: Reference<IntegrationAccount>

  @Field()
  name: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  credentialInputs: Record<string, string>

  @Field(() => GraphQLJSONObject, { nullable: true })
  fields: Record<string, string>
}

@InputType()
export class UpdateAccountCredentialInput {
  @Field({ nullable: true })
  name: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  credentialInputs: Record<string, string>

  @Field(() => GraphQLJSONObject, { nullable: true })
  fields: Record<string, string>
}
