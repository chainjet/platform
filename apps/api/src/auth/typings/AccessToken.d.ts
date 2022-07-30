export interface AuthPayload {
  id: string
}

export interface AccessTokenKeys {
  publicKey: string
  privateKey: {
    key: string
    passphrase: string
  }
}
