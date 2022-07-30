import { Field, ID, ObjectType } from '@nestjs/graphql'
import { plainToClass } from 'class-transformer'

const categories = [
  {
    key: 'chainjet',
    name: 'ChainJet Utils',
  },
  {
    key: 'analytics',
    name: 'Analytics',
  },
  {
    key: 'blog',
    name: 'Blog & Writing',
  },
  {
    key: 'chat',
    name: 'Chat & Communication',
  },
  {
    key: 'cloud-computing',
    name: 'Cloud Computing',
  },
  {
    key: 'database',
    name: 'Database',
  },
  {
    key: 'document',
    name: 'Document & Spreadsheets',
  },
  {
    key: 'e-commerce',
    name: 'E-Commerce',
  },
  {
    key: 'email',
    name: 'Email',
  },
  {
    key: 'events',
    name: 'Events & Calendar',
  },
  {
    key: 'file',
    name: 'File Management',
  },
  // {
  //   key: 'finance',
  //   name: 'Finance'
  // },
  // {
  //   key: 'form',
  //   name: 'Form & Survey'
  // },
  {
    key: 'iot',
    name: 'Internet of Things',
  },
  {
    key: 'machine-learning',
    name: 'Machine Learning',
  },
  // {
  //   key: 'marketing',
  //   name: 'Marketing'
  // },
  {
    key: 'monitoring',
    name: 'Monitoring & Metrics',
  },
  // {
  //   key: 'payments',
  //   name: 'Payments'
  // },
  {
    key: 'nocode',
    name: 'No-code tools',
  },
  {
    key: 'productivity',
    name: 'Productivity',
  },
  {
    key: 'project-management',
    name: 'Project Management',
  },
  {
    key: 'social-networks',
    name: 'Social Networks',
  },
  {
    key: 'software-development',
    name: 'Software Development',
  },
]

@ObjectType()
export class IntegrationCategory {
  @Field(() => ID)
  id: string

  @Field()
  key: string

  @Field()
  name: string
}

export const integrationCategories = categories.map((category) =>
  plainToClass(IntegrationCategory, {
    id: category.key,
    ...category,
  }),
)
