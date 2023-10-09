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
import { ChatbotDefinition } from './integration-definitions/chatbot/chatbot.definition'
import { ClvscanDefinition } from './integration-definitions/clvscan.definition'
import { CoinbaseDefinition } from './integration-definitions/coinbase.definition'
import { CoinMarketCapDefinition } from './integration-definitions/coinmarketcap.definition'
import { ContactsDefinition } from './integration-definitions/contacts/contacts.definition'
import { CronoscanDefinition } from './integration-definitions/cronoscan.definition'
import { DecentralandMarketplaceDefinition } from './integration-definitions/decentraland-marketplace.definition'
import { DexScreenerDefinition } from './integration-definitions/dexscreener.definition'
import { DiscordDefinition } from './integration-definitions/discord/discord.definition'
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
import { HttpDefinition } from './integration-definitions/http/http.definition'
import { InternalDefinition } from './integration-definitions/internal/internal.definition'
import { LensDefinition } from './integration-definitions/lens/lens.definition'
import { LensListsDefinition } from './integration-definitions/lenslists/lenslists.definition'
import { ListsDefinition } from './integration-definitions/lists/list.definition'
import { LogicDefinition } from './integration-definitions/logic/logic.definition'
import { MailChainDefinition } from './integration-definitions/mailchain/mailchain.definition'
import { MailchimpDefinition } from './integration-definitions/mailchimp.definition'
import { MediumDefinition } from './integration-definitions/medium.definition'
import { MirrorDefinition } from './integration-definitions/mirror/mirror.definition'
import { MongoDBDefinition } from './integration-definitions/mongodb.definition'
import { MoonbeamMoonscanDefinition } from './integration-definitions/moonbeam-moonscan.definition'
import { MoonriverMoonscanDefinition } from './integration-definitions/moonriver-moonscan.definition'
import { MoralisDefinition } from './integration-definitions/moralis.definition'
import { NotionDefinition } from './integration-definitions/notion/notion.definition'
import { OpenAiDefinition } from './integration-definitions/openai/openai.definition'
import { OptimisticEtherscanDefinition } from './integration-definitions/optimistic-etherscan.definition'
import { OrdersDefinition } from './integration-definitions/orders/orders.definition'
import { PoapDefinition } from './integration-definitions/poap/poap.definition'
import { PolygonscanDefinition } from './integration-definitions/polygonscan.definition'
import { PricesDefinition } from './integration-definitions/prices/prices.definition'
import { RedditDefinition } from './integration-definitions/reddit.definition'
import { RssDefinition } from './integration-definitions/rss.definition'
import { ScheduleDefinition } from './integration-definitions/schedule.definition'
import { SlackDefinition } from './integration-definitions/slack.definition'
import { SleepDefinition } from './integration-definitions/sleep/sleep.definition'
import { SnapshotDefinition } from './integration-definitions/snapshot/snapshot.definition'
import { SnowtraceDefinition } from './integration-definitions/snowtrace.definition'
import { StorageDefinition } from './integration-definitions/storage/storage.definition'
import { TelegramBotDefinition } from './integration-definitions/telegram-bot.definition'
import { TelegramDefinition } from './integration-definitions/telegram/telegram.definition'
import { TwitterDefinition } from './integration-definitions/twitter/twitter.definition'
import { WebhookDefinition } from './integration-definitions/webhook.definition'
import { WorkflowsDefinition } from './integration-definitions/workflows/workflows.definition'
import { XmtpDefinition } from './integration-definitions/xmtp/xmtp.definition'

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
    chatbot: ChatbotDefinition,
    // checkly: ChecklyDefinition,
    // circleci: CircleciDefinition,
    clvscan: ClvscanDefinition,
    coinbase: CoinbaseDefinition,
    coinmarketcap: CoinMarketCapDefinition,
    contacts: ContactsDefinition,
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
    internal: InternalDefinition,
    // kubernetes: KubernetesDefinition,
    lens: LensDefinition,
    lenslists: LensListsDefinition,
    // linode: LinodeDefinition,
    lists: ListsDefinition,
    logic: LogicDefinition,
    mailchain: MailChainDefinition,
    mailchimp: MailchimpDefinition,
    // 'mailchimp-marketing': MailchimpMarketingDefinition,
    // makerdao: MakerDaoDefinition,
    // makerlog: MakerlogDefinition,
    medium: MediumDefinition,
    mirror: MirrorDefinition,
    mongodb: MongoDBDefinition,
    'moonbeam-moonscan': MoonbeamMoonscanDefinition,
    'moonriver-moonscan': MoonriverMoonscanDefinition,
    moralis: MoralisDefinition,
    notion: NotionDefinition,
    openai: OpenAiDefinition,
    'optimistic-etherscan': OptimisticEtherscanDefinition,
    orders: OrdersDefinition,
    // pagerduty: PagerdutyDefinition,
    // pancakeswap: PancakeSwapDefinition,
    poap: PoapDefinition,
    polygonscan: PolygonscanDefinition,
    prices: PricesDefinition,
    reddit: RedditDefinition,
    rss: RssDefinition,
    schedule: ScheduleDefinition,
    // sendgrid: SendgridDefinition,
    slack: SlackDefinition,
    sleep: SleepDefinition,
    snapshot: SnapshotDefinition,
    snowtrace: SnowtraceDefinition,
    storage: StorageDefinition,
    // statuspage: StatuspageDefinition,
    telegram: TelegramDefinition,
    'telegram-bot': TelegramBotDefinition,
    trello: TrelloDefinition,
    // twilio: TwilioDefinition,
    twitter: TwitterDefinition,
    // typeform: TypeFormDefinition,
    // uniswapv2: UniswapV2Definition,
    // uniswapv3: UniswapV3Definition,
    webhook: WebhookDefinition,
    workflows: WorkflowsDefinition,
    xmtp: XmtpDefinition,
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
