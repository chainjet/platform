import { GetAsyncSchemasProps, RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { AsyncSchema } from '@app/definitions/types/AsyncSchema'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { NotionLib } from '../notion.lib'

export class CreateDatabaseItemAction extends OperationOffChain {
  key = 'createDatabaseItem'
  name = 'Create Database Item'
  description = 'Add a new item or page to a Notion database'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['databaseId'],
    properties: {
      databaseId: {
        type: 'string',
        title: 'Database ID',
        description: 'The ID of the Notion database to add the item to.',
      },
      props: {
        type: 'object',
        title: 'Item Properties',
        properties: {},
      },
      pageContent: {
        type: 'string',
        title: 'Page Content',
        description: 'If you want to create a new page, enter the content here.',
        'x-ui:widget': 'textarea',
      } as JSONSchema7,
    },
  }
  outputs: JSONSchema7 = {
    type: 'object',
    properties: {
      pageId: {
        type: 'string',
      },
      pageUrl: {
        type: 'string',
      },
    },
  }
  asyncSchemas: AsyncSchema[] = [{ name: 'databaseId' }, { name: 'props', dependencies: ['databaseId'] }]

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    const client = NotionLib.getClient(credentials)
    const database = await NotionLib.getDatabase(client, inputs.databaseId)
    const res = await client.pages.create({
      parent: {
        database_id: inputs.databaseId,
      },
      properties: Object.entries(inputs.props ?? {}).reduce((acc, [key, value]) => {
        if (value) {
          const prop = database.properties[key]
          const res = NotionLib.getPropertyData(prop, value)?.result
          if (res) {
            acc[key] = res
          }
        }
        return acc
      }, {}),
      ...(inputs.pageContent
        ? {
            children: [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: inputs.pageContent,
                      },
                    },
                  ],
                },
              },
            ],
          }
        : {}),
    })
    return {
      outputs: {
        pageId: res.id,
        pageUrl: (res as any).url,
      },
    }
  }

  async getAsyncSchemas(
    operation: IntegrationAction,
  ): Promise<{ [key: string]: (props: GetAsyncSchemasProps) => Promise<JSONSchema7> }> {
    return {
      databaseId: async ({ credentials }) => {
        const client = NotionLib.getClient(credentials)
        const databases = await NotionLib.listDatabases(client)
        return {
          type: 'string',
          oneOf: databases.results.map((database) => ({
            title: (database as any).title[0].plain_text,
            const: database.id,
          })),
        }
      },
    }
  }

  async getAsyncSchemaExtension(
    operation: IntegrationAction,
    { inputs, credentials }: GetAsyncSchemasProps,
  ): Promise<JSONSchema7> {
    if (!inputs.databaseId) {
      return {}
    }
    const client = NotionLib.getClient(credentials)
    const database = await NotionLib.getDatabase(client, inputs.databaseId)
    const props = Object.entries(database.properties).reduce((acc, [key, value]) => {
      return {
        [key]: NotionLib.getPropertyData(value, inputs.props?.[key])?.schema ?? {},
        ...acc,
      }
    }, {})
    return {
      properties: {
        props: {
          type: 'object',
          title: 'Item Properties',
          properties: props,
        },
      },
    }
  }
}
