import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { prop } from '@typegoose/typegoose'
import { GraphQLJSONObject } from 'graphql-type-json'

export enum AssistantSkillKey {
  api = 'api',
  tags = 'tags',
}

@ObjectType()
export class AssistantSkill {
  @Field()
  @prop({ required: true })
  key: AssistantSkillKey

  @Field(() => GraphQLJSONObject)
  @jsonProp({ required: true })
  inputs: object
}

@InputType()
export class CreateAssistantSkillInput {
  @Field()
  key: AssistantSkillKey

  @Field(() => GraphQLJSONObject)
  inputs: object
}

@InputType()
export class UpdateAssistantSkillInput {
  @Field({ nullable: true })
  key?: AssistantSkillKey

  @Field(() => GraphQLJSONObject, { nullable: true })
  inputs?: object
}
