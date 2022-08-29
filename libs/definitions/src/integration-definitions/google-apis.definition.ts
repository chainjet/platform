import { MultiIntegrationDefinition } from '@app/definitions/multi-integration.definition'
import { OpenAPIObject, OperationObject, SecuritySchemeObject } from 'openapi3-ts'
import request from 'request'
import { IntegrationAccount } from '../../../../apps/api/src/integration-accounts/entities/integration-account'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'
import { RequestInterceptorOptions, SingleIntegrationData } from '../definition'
import { SingleIntegrationDefinition } from '../single-integration.definition'

export class GoogleApisDefinition extends MultiIntegrationDefinition {
  parentKey = 'google-apis'
  parentName = 'Google APIs'

  async getIntegrationsData(): Promise<SingleIntegrationData[]> {
    // List of apis: https://console.developers.google.com/apis/library
    return [
      // Advertising
      // {
      //   integrationKey: 'admob',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/admob/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'doubleclick-bid-manager',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/doubleclickbidmanager/v1.1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'doubleclick-dcm-dfa-reporting-trafficking',
      //   integrationVersion: '3',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/dfareporting/v3.4/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-ad-exchange-buyer',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/adexchangebuyer2/v2beta1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-adsense-host',
      //   integrationVersion: '4',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/adsensehost/v4.1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-analytics-reporting',
      //   integrationVersion: '4',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/analyticsreporting/v4/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-local-services',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/localservices/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-real-time-bidding',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/realtimebidding/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-search-ads-360',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/doubleclicksearch/v2/openapi.yaml',
      // },

      // Analytics
      // {
      //   integrationKey: 'google-tag-manager',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/tagmanager/v2/openapi.yaml',
      // },

      // Big data
      // {
      //   integrationKey: 'google-cloud-bigquery',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/bigquery/v2/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-bigquery-data-transfer',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/bigquerydatatransfer/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-bigtable-admin',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/bigtableadmin/v2/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-life-sciences',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/lifesciences/v2beta/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-pubsub',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/pubsub/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-pubsub-lite',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/pubsublite/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-vision',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/vision/v1/openapi.yaml',
      // },

      // Blog & CMS
      // {
      //   integrationKey: 'blogger',
      //   integrationVersion: '3',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/blogger/v3/openapi.yaml',
      // },

      // Compute
      // {
      //   integrationKey: 'google-cloud-app-engine-admin',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/appengine/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-replica-pool',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/replicapool/v1beta1/openapi.yaml',
      // },

      // Databases
      // {
      //   integrationKey: 'google-cloud-datastore',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/datastore/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-firestore',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/firestore/v1/openapi.yaml',
      // },

      // Developer tools
      // {
      //   integrationKey: 'google-chrome-ux-report',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/chromeuxreport/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-debugger',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/clouddebugger/v2/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-deployment-manager',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/deploymentmanager/v2/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-identity',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/cloudidentity/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-custom-search',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/customsearch/v1/openapi.yaml',
      // },

      // Firebase
      // {
      //   integrationKey: 'firebase-cloud-messaging',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/fcm/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'firebase-dynamic-links',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/firebasedynamiclinks/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'firebase-rules',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/firebaserules/v1/openapi.yaml',
      // },

      // Google Cloud APIs
      // {
      //   integrationKey: 'google-cloud-os-login',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/oslogin/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-resource-manager',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/cloudresourcemanager/v2/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-runtime-configuration',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/runtimeconfig/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-service-management',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/servicemanagement/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-source-repositories',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/sourcerepo/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-error-reporting',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/clouderrorreporting/v1beta1/openapi.yaml',
      // },

      // G Suite
      {
        integrationKey: 'gmail',
        integrationVersion: '1',
        schemaUrl:
          'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/gmail/v1/openapi.yaml',
      },
      // {
      //   integrationKey: 'google-apps-activity',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/appsactivity/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-apps-reseller',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/reseller/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-apps-script',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/script/v1/openapi.yaml',
      // },
      {
        integrationKey: 'google-calendar',
        integrationVersion: '3',
        schemaUrl:
          'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/calendar/v3/openapi.yaml',
      },
      // {
      //   integrationKey: 'google-classroom',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/classroom/v1/openapi.yaml',
      // },
      {
        integrationKey: 'google-docs',
        integrationVersion: '1',
        schemaUrl:
          'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/docs/v1/openapi.yaml',
      },
      {
        integrationKey: 'google-drive',
        integrationVersion: '3',
        schemaUrl:
          'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/drive/v3/openapi.yaml',
      },
      // {
      //   integrationKey: 'google-enterprise-license-manager',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/licensing/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-g-suite-vault',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/vault/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-hangouts-chat',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/chat/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-sheets',
      //   integrationVersion: '4',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/sheets/v4/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-shopping-content',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/shoppingcontent/v2/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-slides',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/slides/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-tasks',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/tasks/v1/openapi.yaml',
      // },

      // Machine learning
      // {
      //   integrationKey: 'google-cloud-ai-platform',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/ml/v1/openapi.yaml',
      // },

      // Maps
      // {
      //   integrationKey: 'google-playable-locations',
      //   integrationVersion: '3',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/playablelocations/v3/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-street-view-publish',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/streetviewpublish/v1/openapi.yaml',
      // },

      // Mobile
      // {
      //   integrationKey: 'android-device-provisioning-partner',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/androiddeviceprovisioning/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'android-management',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/androidmanagement/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-accelerated-mobile-pages-url',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/acceleratedmobilepageurl/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-fitness',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/fitness/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-play-android-developer',
      //   integrationVersion: '3',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/androidpublisher/v3/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-play-emm',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/androidenterprise/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-play-game-management',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/gamesManagement/v1management/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-play-game-services',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/games/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-play-game-services-publishing',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/gamesConfiguration/v1configuration/openapi.yaml',
      // },

      // Networking
      // {
      //   integrationKey: 'google-cloud-service-networking',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/servicenetworking/v1/openapi.yaml',
      // },

      // Social
      // {
      //   integrationKey: 'google-people',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/people/v1/openapi.yaml',
      // },

      // YouTube
      // {
      //   integrationKey: 'youtube',
      //   integrationVersion: '3',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/youtube/v3/openapi.yaml',
      // },
      // {
      //   integrationKey: 'youtube-analytics',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/youtubeAnalytics/v2/openapi.yaml',
      // },
      // {
      //   integrationKey: 'youtube-reporting',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/youtubereporting/v1/openapi.yaml',
      // },

      // Other
      // {
      //   integrationKey: 'gmail-postmaster-tools',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/gmailpostmastertools/v1beta1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-access-approval',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/accessapproval/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-analytics',
      //   integrationVersion: '3',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/analytics/v3/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-analytics-data',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/analyticsdata/v1alpha/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-api-discovery-service',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/discovery/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-books',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/books/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-civic-information',
      //   integrationVersion: '2',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/civicinfo/v2/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-apigee',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/apigee/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-asset',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/cloudasset/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-bigquery-connection',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/bigqueryconnection/v1beta1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-bigquery-reservation',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/bigqueryreservation/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-billing-budget',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/billingbudgets/v1beta1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-catalog',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/cloudprivatecatalog/v1beta1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-cloud-tool-results',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/toolresults/v1beta3/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-display-video-360',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/displayvideo/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-domains-rdap',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/domainsrdap/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-fact-check-tools',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/factchecktools/v1alpha1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-groups-migration',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/groupsmigration/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-groups-settings',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/groupssettings/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-g-suite-alert-center',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/alertcenter/v1beta1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-library-agent',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/libraryagent/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-pagespeed-insights',
      //   integrationVersion: '5',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/pagespeedonline/v5/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-policy-troubleshooter',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/policytroubleshooter/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-poly',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/poly/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-recommender',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/recommender/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-sas-portal',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/sasportal/v1alpha1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-search-console',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/searchconsole/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-service-directory',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/servicedirectory/v1beta1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-smart-device-management',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/smartdevicemanagement/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-web-fonts-developer',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/webfonts/v1/openapi.yaml',
      // },
      // {
      //   integrationKey: 'google-web-security-scanner',
      //   integrationVersion: '1',
      //   schemaUrl:
      //     'https://raw.githubusercontent.com/APIs-guru/openapi-directory/master/APIs/googleapis.com/websecurityscanner/v1/openapi.yaml',
      // },
    ].map((int) => ({ ...int, parentKey: this.parentKey }))
  }

  async createOrUpdateIntegrationAccount(
    schema: OpenAPIObject,
    integrationData: SingleIntegrationData,
  ): Promise<IntegrationAccount | null> {
    const { integrationKey, integrationVersion } = integrationData
    const servicesData = await this.getIntegrationsData()
    const serviceData = servicesData.filter(
      (data) => data.integrationKey === integrationKey && data.integrationVersion === integrationVersion,
    )

    if (!serviceData.length) {
      throw new Error(`Google API with key ${integrationKey} and version ${integrationVersion} not found`)
    }
    if (serviceData.length > 1) {
      throw new Error(`Multiple declarations found for Google API with key ${integrationKey}`)
    }

    const definition = this.getServiceDefinitionInstance(serviceData[0])
    return definition.createOrUpdateIntegrationAccount(schema)
  }

  private getServiceDefinitionInstance(serviceData: SingleIntegrationData): SingleIntegrationDefinition {
    class GoogleService extends SingleIntegrationDefinition {
      integrationKey = serviceData.integrationKey
      integrationVersion = serviceData.integrationVersion
      schemaUrl = serviceData.schemaUrl
    }
    return new GoogleService(
      this.schemaService,
      this.integrationService,
      this.integrationAccountService,
      this.integrationActionService,
      this.integrationTriggerService,
    )
  }

  mapSchemaOperation(operationSchema: OperationObject): OperationObject {
    // Operation IDs have a format like "gmail.users.drafts.list" or "drive.about.get"
    const summary = (operationSchema.summary || operationSchema.operationId)
      ?.split('.')
      .slice(-2)
      .reverse()
      .join(' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')

    return {
      ...operationSchema,
      summary,
    }
  }

  updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const securityScheme = schema.components?.securitySchemes?.Oauth2c as SecuritySchemeObject
    // Use Google Client ID and Secret
    if (securityScheme) {
      securityScheme['x-credentialsKey'] = 'google'
    }

    // Google APIs require extra parameters in order to send back the refresh token
    if (securityScheme?.flows?.authorizationCode) {
      securityScheme.flows.authorizationCode.authorizationUrl =
        'https://accounts.google.com/o/oauth2/auth?prompt=consent&access_type=offline'
    }

    // Ignore authentication and response related parameters
    const blacklistedParams = [
      'key',
      'access_token',
      'oauth_token',
      'quotaUser',
      'prettyPrint',
      'callback',
      'fields',
      'alt',
      '_.xgafv',
      'uploadType',
      'upload_protocol',
    ]
    for (const [paramKey, paramValue] of Object.entries(schema.components?.parameters ?? {})) {
      if (blacklistedParams.includes(paramKey)) {
        paramValue['x-ignore'] = true
      }
    }

    return Promise.resolve(schema)
  }

  requestInterceptor(opts: RequestInterceptorOptions): request.OptionsWithUrl {
    const unionSymbol = opts.req.url.toString().includes('?') ? '&' : '?'
    opts.req.url = `${opts.req.url}${unionSymbol}key=${process.env.GOOGLE_API_KEY}`

    // Request interceptor for Gmail
    if (opts.integration.key === 'gmail') {
      return this.gmailRequestInterceptor(opts)
    }

    return opts.req
  }

  /**
   * We added extra inputs to message operations in order to make sending emails easier
   */
  gmailRequestInterceptor(opts: RequestInterceptorOptions): request.OptionsWithUrl {
    if (opts.req.body) {
      const body = JSON.parse(opts.req.body)
      if (body?.to && body?.body && !body.raw) {
        // https://stackoverflow.com/a/55966122/2246938
        const str = [
          'Content-Type: text/plain; charset="UTF-8"\n',
          'MINE-Version: 1.0\n',
          'Content-Transfer-Encoding: 7bit\n',
          `to: ${body.to} \n`,
          `from: ${opts.inputs.userId} \n`,
          body.cc ? `cc: ${body.cc} \n` : '',
          body.bcc ? `bcc: ${body.bcc} \n` : '',
          `subject: =?UTF-8?B?${Buffer.from(body.subject).toString('base64')}?= \n\n`,
          body.body,
        ].join('')
        body.raw = Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
        opts.req.body = JSON.stringify(body)
      }
    }
    return opts.req
  }

  afterOperationRun(opts: OperationRunOptions, outputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (opts.integration.key === 'gmail') {
      return this.gmailAfterOperationRun(opts, outputs)
    }
    return Promise.resolve(outputs)
  }

  async gmailAfterOperationRun(
    opts: OperationRunOptions,
    outputs: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const payload = outputs?.payload as Record<string, unknown>
    if (payload?.headers && Array.isArray(payload.headers)) {
      outputs.to = payload.headers.find((header) => header.name === 'To')?.value
      outputs.from = payload.headers.find((header) => header.name === 'From')?.value
      outputs.replyTo = payload.headers.find((header) => header.name === 'Reply-To')?.value
      outputs.subject = payload.headers.find((header) => header.name === 'Subject')?.value
      outputs.cc = payload.headers.find((header) => header.name === 'Cc')?.value
      outputs.bcc = payload.headers.find((header) => header.name === 'Bcc')?.value
    }
    let payloadPart: any[] | undefined

    // First condition is for threads, second one for messages
    if (
      payload?.parts &&
      Array.isArray(payload.parts) &&
      payload.parts.length &&
      Array.isArray(payload.parts[0].parts)
    ) {
      payloadPart = payload.parts[0].parts
      delete payload.parts[0].parts
    } else if (payload?.parts && Array.isArray(payload.parts)) {
      payloadPart = payload.parts
      delete payload.parts
    }

    if (payloadPart) {
      const textBody = payloadPart.find((part) => part.mimeType === 'text/plain')?.body?.data
      const htmlBody = payloadPart.find((part) => part.mimeType === 'text/html')?.body?.data
      outputs.body = ''
      if (textBody) {
        outputs.body = Buffer.from(textBody, 'base64').toString('ascii')
      }
      if (htmlBody) {
        outputs.body = `${outputs.body}\n${Buffer.from(htmlBody, 'base64').toString('ascii')}`.trim()
      }
    }

    return await Promise.resolve(outputs)
  }
}
