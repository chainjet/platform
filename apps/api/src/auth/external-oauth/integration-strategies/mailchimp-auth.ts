export async function afterAuthHook(
  credentials: Record<string, string | undefined>,
): Promise<Record<string, string | undefined>> {
  // https://mailchimp.com/developer/marketing/guides/access-user-data-oauth-2/#implement-the-oauth-2-workflow-on-your-server
  const metadataResponse = await fetch('https://login.mailchimp.com/oauth2/metadata', {
    headers: {
      Authorization: `OAuth ${credentials.accessToken}`,
    },
  })

  const { dc } = await metadataResponse.json()
  return {
    ...credentials,
    dc,
  }
}
