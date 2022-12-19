import { Definition } from '@app/definitions/definition'
import { AwsDefinition } from '@app/definitions/integration-definitions/aws.definition'
import { GithubDefinition } from '@app/definitions/integration-definitions/github.definition'
import { TrelloDefinition } from '@app/definitions/integration-definitions/trello.definition'
import { Injectable } from '@nestjs/common'
import { Class } from '@ptc-org/nestjs-query-core'
import { IntegrationAccountService } from '../../../apps/api/src/integration-accounts/services/integration-account.service'
import { IntegrationActionService } from '../../../apps/api/src/integration-actions/services/integration-action.service'
import { IntegrationTriggerService } from '../../../apps/api/src/integration-triggers/services/integration-trigger.service'
import { IntegrationService } from '../../../apps/api/src/integrations/services/integration.service'
import { OneInchDefinition } from './integration-definitions/1inch.definition'
import { AirtableDefinition } from './integration-definitions/airtable.definition'
import { ArbiscanDefinition } from './integration-definitions/arbiscan.definition'
import { AurorascanDefinition } from './integration-definitions/aurorascan.definition'
import { BlockchainDefinition } from './integration-definitions/blockchain/blockchain.definition'
import { BobascanDefinition } from './integration-definitions/bobascan.definition'
import { BscscanDefinition } from './integration-definitions/bscscan.definition'
import { BttcscanDefinition } from './integration-definitions/bttcscan.definition'
import { CeloscanDefinition } from './integration-definitions/celoscan.definition'
import { ClvscanDefinition } from './integration-definitions/clvscan.definition'
import { CoinbaseDefinition } from './integration-definitions/coinbase.definition'
import { CoinMarketCapDefinition } from './integration-definitions/coinmarketcap.definition'
import { CronoscanDefinition } from './integration-definitions/cronoscan.definition'
import { DecentralandMarketplaceDefinition } from './integration-definitions/decentraland-marketplace.definition'
import { DexScreenerDefinition } from './integration-definitions/dexscreener.definition'
import { DiscordDefinition } from './integration-definitions/discord.definition'
import { DiscourseDefinition } from './integration-definitions/discourse.definition'
import { EmailDefinition } from './integration-definitions/email.definition'
import { EnsDefinition } from './integration-definitions/ens/ens.definition'
import { EtherscanDefinition } from './integration-definitions/etherscan.definition'
import { FtmscanDefinition } from './integration-definitions/ftmscan.definition'
import { GnosisscanDefinition } from './integration-definitions/gnosisscan.definition'
import { GoogleApisDefinition } from './integration-definitions/google-apis.definition'
import { GoogleSheetsDefinition } from './integration-definitions/google-sheets.definition'
import { GraphqlDefinition } from './integration-definitions/graphql.definition'
import { HetznerCloudDefinition } from './integration-definitions/hetzner-cloud.definition'
import { HttpDefinition } from './integration-definitions/http.definition'
import { LensDefinition } from './integration-definitions/lens/lens.definition'
import { ListsDefinition } from './integration-definitions/lists/list.definition'
import { LogicDefinition } from './integration-definitions/logic.definition'
import { MailchimpDefinition } from './integration-definitions/mailchimp.definition'
import { MediumDefinition } from './integration-definitions/medium.definition'
import { MongoDBDefinition } from './integration-definitions/mongodb.definition'
import { MoonbeamMoonscanDefinition } from './integration-definitions/moonbeam-moonscan.definition'
import { MoonriverMoonscanDefinition } from './integration-definitions/moonriver-moonscan.definition'
import { MoralisDefinition } from './integration-definitions/moralis.definition'
import { OptimisticEtherscanDefinition } from './integration-definitions/optimistic-etherscan.definition'
import { PolygonscanDefinition } from './integration-definitions/polygonscan.definition'
import { RedditDefinition } from './integration-definitions/reddit.definition'
import { RssDefinition } from './integration-definitions/rss.definition'
import { ScheduleDefinition } from './integration-definitions/schedule.definition'
import { SleepDefinition } from './integration-definitions/sleep.definition'
import { SnowtraceDefinition } from './integration-definitions/snowtrace.definition'
import { TelegramBotDefinition } from './integration-definitions/telegram-bot.definition'
import { TwitterDefinition } from './integration-definitions/twitter.definition'
import { WebhookDefinition } from './integration-definitions/webhook.definition'
import { WorkflowsDefinition } from './integration-definitions/workflows/workflows.definition'

@Injectable()
export class IntegrationDefinitionFactory {
  protected readonly definitions: Record<string, Class<Definition>> = {
    '1inch': OneInchDefinition,
    // 'adafruit-io': AdafruitIoDefinition,
    airtable: AirtableDefinition,
    // appveyor: AppveyorDefinition,
    arbiscan: ArbiscanDefinition,
    // asana: AsanaDefinition,
    aurorascan: AurorascanDefinition,
    aws: AwsDefinition,
    // azure: AzureDefinition,
    // bitbucket: BitbucketDefinition,
    blockchain: BlockchainDefinition,
    bobascan: BobascanDefinition,
    // box: BoxDefinition,
    bscscan: BscscanDefinition,
    bttcscan: BttcscanDefinition,
    // calendly: CalendlyDefinition,
    celoscan: CeloscanDefinition,
    // checkly: ChecklyDefinition,
    // circleci: CircleciDefinition,
    clvscan: ClvscanDefinition,
    coinbase: CoinbaseDefinition,
    coinmarketcap: CoinMarketCapDefinition,
    cronoscan: CronoscanDefinition,
    // compoundv2: CompoundV2Definition,
    'decentraland-marketplace': DecentralandMarketplaceDefinition,
    dexscreener: DexScreenerDefinition,
    discord: DiscordDefinition,
    discourse: DiscourseDefinition,
    // docusign: DocusignDefinition,
    email: EmailDefinition,
    ens: EnsDefinition,
    etherscan: EtherscanDefinition,
    ftmscan: FtmscanDefinition,
    github: GithubDefinition,
    // gitlab: GitlabDefinition,
    gnosisscan: GnosisscanDefinition,
    'google-apis': GoogleApisDefinition,
    'google-sheets': GoogleSheetsDefinition,
    graphql: GraphqlDefinition,
    // gumroad: GumroadDefinition,
    'hetzner-cloud': HetznerCloudDefinition,
    http: HttpDefinition,
    // kubernetes: KubernetesDefinition,
    lens: LensDefinition,
    // linode: LinodeDefinition,
    lists: ListsDefinition,
    logic: LogicDefinition,
    mailchimp: MailchimpDefinition,
    // 'mailchimp-marketing': MailchimpMarketingDefinition,
    // makerdao: MakerDaoDefinition,
    // makerlog: MakerlogDefinition,
    medium: MediumDefinition,
    mongodb: MongoDBDefinition,
    'moonbeam-moonscan': MoonbeamMoonscanDefinition,
    'moonriver-moonscan': MoonriverMoonscanDefinition,
    moralis: MoralisDefinition,
    'optimistic-etherscan': OptimisticEtherscanDefinition,
    // pagerduty: PagerdutyDefinition,
    // pancakeswap: PancakeSwapDefinition,
    polygonscan: PolygonscanDefinition,
    reddit: RedditDefinition,
    rss: RssDefinition,
    schedule: ScheduleDefinition,
    // sendgrid: SendgridDefinition,
    // slack: SlackDefinition,
    sleep: SleepDefinition,
    // snapshot: SnapshotDefinition,
    snowtrace: SnowtraceDefinition,
    // statuspage: StatuspageDefinition,
    'telegram-bot': TelegramBotDefinition,
    trello: TrelloDefinition,
    // twilio: TwilioDefinition,
    twitter: TwitterDefinition,
    // typeform: TypeFormDefinition,
    // uniswapv2: UniswapV2Definition,
    // uniswapv3: UniswapV3Definition,
    webhook: WebhookDefinition,
    workflows: WorkflowsDefinition,
    // youcanbookme: YoucanbookmeDefinition,
    // zoom: ZoomDefinition,
  }

  constructor(
    protected readonly integrationService: IntegrationService,
    protected readonly integrationAccountService: IntegrationAccountService,
    protected readonly integrationActionService: IntegrationActionService,
    protected readonly integrationTriggerService: IntegrationTriggerService,
  ) {}

  getDefinition(key: string): Definition {
    if (!this.definitions[key]) {
      throw new Error(`Service definitions not found for ${key}`)
    }
    return new this.definitions[key]()
  }

  getAllDefinitions(): Definition[] {
    return Object.keys(this.definitions).map((key) => this.getDefinition(key))
  }
}
