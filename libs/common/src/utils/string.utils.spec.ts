import { addEllipsis, slugify, stripMarkdown, stripMarkdownSync } from '@app/common/utils/string.utils'

describe('StringUtils', () => {
  describe('slugify', () => {
    it('should return the slug for a given string', async () => {
      expect(slugify('Test TEST!!!')).toBe('test-test')
    })
  })

  describe('stripMarkdown', () => {
    it('should remove the markdown from a string', async () => {
      expect(await stripMarkdown('Some *emphasis*, **importance**, and `code`.'))
        .toBe('Some emphasis, importance, and code.')
    })

    it('should remove html from a string', async () => {
      expect(await stripMarkdown('Some <i>emphasis</i>, <strong>importance</strong>, and <code>code</code>.'))
        .toBe('Some emphasis, importance, and code.')
    })

    // https://github.com/remarkjs/strip-markdown/issues/19
    it('should remove html from a string starting with a html tag', async () => {
      expect(await stripMarkdown('<p>foo</p> bar'))
        .toBe('foo bar')
    })
  })

  describe('stripMarkdownSync', () => {
    it('should remove the markdown from a string', async () => {
      expect(stripMarkdownSync('Some *emphasis*, **importance**, and `code`.'))
        .toBe('Some emphasis, importance, and code.')
    })

    it('should remove html from a string', async () => {
      expect(stripMarkdownSync('Some <i>emphasis</i>, <strong>importance</strong>, and <code>code</code>.'))
        .toBe('Some emphasis, importance, and code.')
    })

    // https://github.com/remarkjs/strip-markdown/issues/19
    it('should remove html from a string starting with a html tag', async () => {
      expect(stripMarkdownSync('<p>foo</p> bar'))
        .toBe('foo bar')
    })
  })

  describe('addEllipsis', () => {
    it('should add ellipsis if string is longer than max length', async () => {
      expect(addEllipsis('This is a test', 5)).toBe('This...')
    })

    it('should not add ellipsis if string is shorter or equal than max length', async () => {
      expect(addEllipsis('This is a test', 14)).toBe('This is a test')
    })
  })
})
