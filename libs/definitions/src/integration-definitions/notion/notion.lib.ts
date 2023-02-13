import { Client } from '@notionhq/client'
import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints'

type NotionProperties = DatabaseObjectResponse['properties']
type NotionProperty = NotionProperties[keyof NotionProperties]

export const NotionLib = {
  getClient(credentials: Record<string, any>) {
    return new Client({
      auth: credentials.accessToken,
      notionVersion: '2022-02-22',
    })
  },

  async listDatabases(client: Client, params = {}) {
    return client.search({
      filter: {
        property: 'object',
        value: 'database',
      },
      ...params,
    })
  },

  async getDatabase(client: Client, databaseId: string) {
    return client.databases.retrieve({
      database_id: databaseId,
    })
  },

  getPropertyData(property: NotionProperty, value: any) {
    switch (property.type) {
      case 'title':
        return {
          schema: {
            title: property.name,
            type: 'string',
          },
          result: {
            title: [
              {
                type: 'text',
                text: {
                  content: value,
                },
              },
            ],
          },
        }
      case 'rich_text':
        return {
          schema: {
            title: property.name,
            type: 'string',
          },
          result: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: value,
                },
              },
            ],
          },
        }
      case 'number':
        return {
          schema: {
            title: property.name,
            type: 'number',
          },
          result: {
            number: parseFloat(value),
          },
        }
      case 'select':
        return {
          schema: {
            title: property.name,
            type: 'string',
            oneOf: property.select.options.map((option) => ({
              title: option.name,
              const: option.name,
            })),
          },
          result: {
            select: {
              name: value,
            },
          },
        }
      case 'multi_select':
        return {
          schema: {
            title: property.name,
            type: 'array',
            items: {
              type: 'string',
              ...(property.multi_select.options.length
                ? {
                    oneOf: property.multi_select.options.map((option) => ({
                      title: option.name,
                      const: option.name,
                    })),
                  }
                : {}),
            },
          },
          result: {
            multi_select: (Array.isArray(value) ? value : value?.split(',') ?? []).map((name: string) => ({
              name,
            })),
          },
        }
      case 'date':
        return {
          schema: {
            title: property.name,
            type: 'string',
            format: 'datetime',
          },
          result: {
            date: {
              start: value,
            },
          },
        }
      case 'people':
        return {
          schema: {
            title: property.name,
            type: 'array',
            items: {
              type: 'string',
            },
          },
          result: {
            people: (Array.isArray(value) ? value : value?.split(',') ?? []).map((name: string) => ({
              name,
            })),
          },
        }
      case 'files':
        return {
          schema: {
            title: property.name,
            type: 'array',
            items: {
              type: 'string',
            },
          },
          result: {
            files: (Array.isArray(value) ? value : value?.split(',') ?? []).map((name: string) => ({
              name,
            })),
          },
        }
      case 'checkbox':
        return {
          schema: {
            title: property.name,
            type: 'boolean',
          },
          result: {
            checkbox: value,
          },
        }
      case 'url':
        return {
          schema: {
            title: property.name,
            type: 'string',
            format: 'uri',
          },
          result: {
            url: value,
          },
        }
      case 'email':
        return {
          schema: {
            title: property.name,
            type: 'string',
            format: 'email',
          },
          result: {
            email: value,
          },
        }
      case 'phone_number':
        return {
          schema: {
            title: property.name,
            type: 'string',
          },
          result: {
            phone_number: value,
          },
        }
      case 'formula':
        return {
          schema: {
            title: property.name,
            type: 'string',
          },
          result: {
            formula: value,
          },
        }
      case 'relation':
        return {
          schema: {
            title: property.name,
            type: 'array',
            items: {
              type: 'string',
            },
          },
          result: {
            relation: (Array.isArray(value) ? value : value?.split(',') ?? []).map((name: string) => ({
              name,
            })),
          },
        }
      case 'rollup':
        return {
          schema: {
            title: property.name,
            type: 'string',
          },
          result: {
            rollup: value,
          },
        }
      case 'created_time':
        return {
          schema: {
            title: property.name,
            type: 'string',
            format: 'datetime',
          },
          result: {
            created_time: value,
          },
        }
      case 'created_by':
        return {
          schema: {
            title: property.name,
            type: 'string',
          },
          result: {
            created_by: value,
          },
        }
      case 'last_edited_time':
        return {
          schema: {
            title: property.name,
            type: 'string',
            format: 'datetime',
          },
          result: {
            last_edited_time: value,
          },
        }
      case 'last_edited_by':
        return {
          schema: {
            title: property.name,
            type: 'string',
          },
          result: {
            last_edited_by: value,
          },
        }
    }
  },
}
