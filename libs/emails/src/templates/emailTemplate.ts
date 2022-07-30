export interface EmailTemplate {
  name: string
  sendFrom: string
  getSubject: () => string
  getTextBody: () => string
  getHtmlBody: () => string
}
