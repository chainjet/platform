import { Definition } from '@app/definitions/definition'
import { AwsDefinition } from '@app/definitions/integration-definitions/aws.definition'
import { BitbucketDefinition } from '@app/definitions/integration-definitions/bitbucket.definition'
import { CircleciDefinition } from '@app/definitions/integration-definitions/circleci.definition'
import { GithubDefinition } from '@app/definitions/integration-definitions/github.definition'
import { GitlabDefinition } from '@app/definitions/integration-definitions/gitlab.definition'
import { SendgridDefinition } from '@app/definitions/integration-definitions/sendgrid.definition'
import { SlackDefinition } from '@app/definitions/integration-definitions/slack.definition'
import { TrelloDefinition } from '@app/definitions/integration-definitions/trello.definition'
import { TwilioDefinition } from '@app/definitions/integration-definitions/twilio.definition'
import { ZoomDefinition } from '@app/definitions/integration-definitions/zoom.definition'
import { SchemaService } from '@app/definitions/schema/services/schema.service'
import { Injectable } from '@nestjs/common'
import { Class } from '@ptc-org/nestjs-query-core'
import { IntegrationAccountService } from '../../../apps/api/src/integration-accounts/services/integration-account.service'
import { IntegrationActionService } from '../../../apps/api/src/integration-actions/services/integration-action.service'
import { IntegrationTriggerService } from '../../../apps/api/src/integration-triggers/services/integration-trigger.service'
import { IntegrationService } from '../../../apps/api/src/integrations/services/integration.service'
import { OneInchDefinition } from './integration-definitions/1inch.definition'
import { AdafruitIoDefinition } from './integration-definitions/adafruit-io.definition'
import { AirtableDefinition } from './integration-definitions/airtable.definition'
import { AppveyorDefinition } from './integration-definitions/appveyor.definition'
import { AsanaDefinition } from './integration-definitions/asana.definition'
import { AzureDefinition } from './integration-definitions/azure.definition'
import { BlockchainDefinition } from './integration-definitions/blockchain.definition'
import { BoxDefinition } from './integration-definitions/box.definition'
import { CalendlyDefinition } from './integration-definitions/calendly.definition'
import { ChecklyDefinition } from './integration-definitions/checkly.definition'
import { CoinbaseDefinition } from './integration-definitions/coinbase.definition'
import { CoinMarketCapDefinition } from './integration-definitions/coinmarketcap.definition'
import { DexScreenerDefinition } from './integration-definitions/dexscreener.definition'
import { DiscordDefinition } from './integration-definitions/discord.definition'
import { DocusignDefinition } from './integration-definitions/docusign.definition'
import { EnsDefinition } from './integration-definitions/ens.definition'
import { GoogleApisDefinition } from './integration-definitions/google-apis.definition'
import { GraphqlDefinition } from './integration-definitions/graphql.definition'
import { GumroadDefinition } from './integration-definitions/gumroad.definition'
import { HetznerCloudDefinition } from './integration-definitions/hetzner-cloud.definition'
import { HttpDefinition } from './integration-definitions/http.definition'
import { KubernetesDefinition } from './integration-definitions/kubernetes.definition'
import { LinodeDefinition } from './integration-definitions/linode.definition'
import { LogicDefinition } from './integration-definitions/logic.definition'
import { MailchimpMarketingDefinition } from './integration-definitions/mailchimp-marketing.definition'
import { MakerlogDefinition } from './integration-definitions/makerlog.definition'
import { MediumDefinition } from './integration-definitions/medium.definition'
import { MongoDBDefinition } from './integration-definitions/mongodb.definition'
import { MoralisDefinition } from './integration-definitions/moralis.definition'
import { PagerdutyDefinition } from './integration-definitions/pagerduty.definition'
import { RedditDefinition } from './integration-definitions/reddit.definition'
import { RssDefinition } from './integration-definitions/rss.definition'
import { ScheduleDefinition } from './integration-definitions/schedule.definition'
import { SleepDefinition } from './integration-definitions/sleep.definition'
import { StatuspageDefinition } from './integration-definitions/statuspage.definition'
import { TelegramDefinition } from './integration-definitions/telegram.definition'
import { UniswapV2Definition } from './integration-definitions/uniswapv2.definition'
import { WebhookDefinition } from './integration-definitions/webhook.definition'
import { YoucanbookmeDefinition } from './integration-definitions/youcanbookme.definition'

@Injectable()
export class IntegrationDefinitionFactory {
  protected readonly definitions: Record<string, Class<Definition>> = {
    '1inch': OneInchDefinition,
    'adafruit-io': AdafruitIoDefinition,
    airtable: AirtableDefinition,
    appveyor: AppveyorDefinition,
    asana: AsanaDefinition,
    aws: AwsDefinition,
    azure: AzureDefinition,
    bitbucket: BitbucketDefinition,
    blockchain: BlockchainDefinition,
    box: BoxDefinition,
    calendly: CalendlyDefinition,
    checkly: ChecklyDefinition,
    circleci: CircleciDefinition,
    coinbase: CoinbaseDefinition,
    coinmarketcap: CoinMarketCapDefinition,
    dexscreener: DexScreenerDefinition,
    discord: DiscordDefinition,
    docusign: DocusignDefinition,
    ens: EnsDefinition,
    github: GithubDefinition,
    gitlab: GitlabDefinition,
    'google-apis': GoogleApisDefinition,
    graphql: GraphqlDefinition,
    gumroad: GumroadDefinition,
    'hetzner-cloud': HetznerCloudDefinition,
    http: HttpDefinition,
    kubernetes: KubernetesDefinition,
    linode: LinodeDefinition,
    logic: LogicDefinition,
    'mailchimp-marketing': MailchimpMarketingDefinition,
    makerlog: MakerlogDefinition,
    medium: MediumDefinition,
    mongodb: MongoDBDefinition,
    moralis: MoralisDefinition,
    pagerduty: PagerdutyDefinition,
    reddit: RedditDefinition,
    rss: RssDefinition,
    schedule: ScheduleDefinition,
    sendgrid: SendgridDefinition,
    slack: SlackDefinition,
    sleep: SleepDefinition,
    // snapshot: SnapshotDefinition,
    statuspage: StatuspageDefinition,
    telegram: TelegramDefinition,
    trello: TrelloDefinition,
    twilio: TwilioDefinition,
    uniswapv2: UniswapV2Definition,
    webhook: WebhookDefinition,
    youcanbookme: YoucanbookmeDefinition,
    zoom: ZoomDefinition,
  }

  constructor(
    protected readonly schemaService: SchemaService,
    protected readonly integrationService: IntegrationService,
    protected readonly integrationAccountService: IntegrationAccountService,
    protected readonly integrationActionService: IntegrationActionService,
    protected readonly integrationTriggerService: IntegrationTriggerService,
  ) {}

  getDefinition(key: string): Definition {
    if (!this.definitions[key]) {
      throw new Error(`Service definitions not found for ${key}`)
    }
    return new this.definitions[key](
      this.schemaService,
      this.integrationService,
      this.integrationAccountService,
      this.integrationActionService,
      this.integrationTriggerService,
    )
  }

  getAllDefinitions(): Definition[] {
    return Object.keys(this.definitions).map((key) => this.getDefinition(key))
  }
}
