import OAuth2Strategy from 'passport-oauth2'
import { stringify } from 'querystring'

// Ported from https://github.com/Slotos/passport-reddit
// We can't install it directly due to ESM module incompatibility

export default class RedditPassportStrategy extends OAuth2Strategy {
  name = 'reddit'

  constructor(options, verify) {
    options = options || {}
    options.authorizationURL = options.authorizationURL || 'https://ssl.reddit.com/api/v1/authorize'
    options.tokenURL = options.tokenURL || 'https://ssl.reddit.com/api/v1/access_token'

    // ensuring we request identity scope
    // sacrificing efficiency due to one-time nature of this
    if (options.scope) {
      if (Array.isArray(options.scope)) {
        options.scope.push('identity')
        options.scopeSeparator = ','
      } else {
        options.scope = options.scope
          .split(',')
          .reduce(
            function (previousValue, currentValue, _index, _array) {
              if (currentValue !== '') previousValue.push(currentValue)
              return previousValue
            },
            ['identity'],
          )
          .join(',')
      }
    } else {
      options.scope = 'identity'
    }

    // Enable state handling by default, but ~~allow foot shooting~~ future-proof by allowing a false value
    if (typeof options.state === 'undefined' && typeof options.store === 'undefined') {
      options.state = true
    }

    super(options, verify)
    // Reddit requires Auth token in GET requests
    // @ts-expect-error
    this._oauth2._useAuthorizationHeaderForGET = true

    // Reddit token endpoint expects basic auth header "with the consumer key as the username
    // and the consumer secret as the password". To comply we are resorting to overriding
    // node-oauth's implmentation of getOAuthAccessToken().
    // @ts-expect-error
    this._oauth2.getOAuthAccessToken = function (code, params, callback) {
      params = params || {}
      params.type = 'web_server'
      var codeParam = params.grant_type === 'refresh_token' ? 'refresh_token' : 'code'
      params[codeParam] = code

      var post_data = stringify(params)
      var authorization = 'Basic ' + Buffer.from('' + this._clientId + ':' + this._clientSecret).toString('base64')
      var post_headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authorization,
      }

      this._request(
        'POST',
        this._getAccessTokenUrl(),
        post_headers,
        post_data,
        null,
        function (error, data, _response) {
          // @ts-expect-error
          if (error) callback(error)
          else {
            var results = JSON.parse(data)
            var access_token = results.access_token
            var refresh_token = results.refresh_token
            delete results.refresh_token
            // @ts-expect-error
            callback(null, access_token, refresh_token, results) // callback results =-=
          }
        },
      )
    }
  }
}
