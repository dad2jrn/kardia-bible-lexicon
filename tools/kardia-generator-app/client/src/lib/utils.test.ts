import { describe, it, expect } from 'vitest'
import { catToId, escapeHTML } from './utils'

describe('catToId', () => {
  it('lowercases single words', () => {
    expect(catToId('Elohim')).toBe('elohim')
  })

  it('converts spaces to hyphens', () => {
    expect(catToId('El Shaddai')).toBe('el-shaddai')
  })

  it('normalises slash notation (lev / levav)', () => {
    expect(catToId('lev / levav')).toBe('lev-levav')
  })

  it('strips right-single-quote (apostrophe variant)', () => {
    // ga'al uses the right single quotation mark U+2019
    expect(catToId("ga\u2019al")).toBe('gaal')
  })

  it('strips ASCII apostrophe', () => {
    expect(catToId("ga'al")).toBe('gaal')
  })

  it('matches the exact output from the HTML source for every category', () => {
    const pairs: [string, string][] = [
      ['Elohim',      'elohim'],
      ['YHWH',        'yhwh'],
      ['El Shaddai',  'el-shaddai'],
      ['chesed',      'chesed'],
      ['emeth',       'emeth'],
      ['berith',      'berith'],
      ['nephesh',     'nephesh'],
      ['lev / levav', 'lev-levav'],
      ['basar',       'basar'],
      ['ruach',       'ruach'],
      ['yetzer',      'yetzer'],
      ['yada',        'yada'],
      ['shalom',      'shalom'],
      ['teshuvah',    'teshuvah'],
      ['mishpat',     'mishpat'],
      ['tsedaqah',    'tsedaqah'],
      ['racham',      'racham'],
      ['yirah',       'yirah'],
      ['kavod',       'kavod'],
      ['shachah',     'shachah'],
      ['dabar',       'dabar'],
      ['qodesh',      'qodesh'],
      ['shem',        'shem'],
      ['chata',       'chata'],
      ['avon',        'avon'],
      ['pesha',       'pesha'],
      ['kaphar',      'kaphar'],
      ['padah',       'padah'],
      ["ga'al",       'gaal'],
      ['shub',        'shub'],
    ]
    for (const [input, expected] of pairs) {
      expect(catToId(input), `catToId("${input}")`).toBe(expected)
    }
  })
})

describe('escapeHTML', () => {
  it('escapes ampersand', () => {
    expect(escapeHTML('a & b')).toBe('a &amp; b')
  })

  it('escapes less-than', () => {
    expect(escapeHTML('<div>')).toBe('&lt;div&gt;')
  })

  it('escapes greater-than', () => {
    expect(escapeHTML('a > b')).toBe('a &gt; b')
    expect(escapeHTML('a<b>c')).toBe('a&lt;b&gt;c')
  })

  it('escapes all three in combination', () => {
    expect(escapeHTML('<script>alert("a&b")</script>')).toBe(
      '&lt;script&gt;alert("a&amp;b")&lt;/script&gt;',
    )
  })

  it('passes through plain strings unchanged', () => {
    expect(escapeHTML('hello world')).toBe('hello world')
  })
})
