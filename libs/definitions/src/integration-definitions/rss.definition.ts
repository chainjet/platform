import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import RssParser from 'rss-parser'
import { RunResponse } from '..'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'

export class RssDefinition extends SingleIntegrationDefinition {
  integrationKey = 'rss'
  integrationVersion = '1'
  schemaUrl = null

  async run ({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const parser = new RssParser()
    const res = await parser.parseURL(inputs.url)

    // rss-parser converts description fields into content
    res.items = (res.items ?? []).map(item => {
      item.description = item.description ?? item.content
      item.descriptionPlainText = item.contentSnippet
      return item
    })

    return {
      outputs: res
    }
  }
}
