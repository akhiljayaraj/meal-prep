import { getWeekStart, getWeekStartString, formatWeekLabel } from '../dates'

describe('getWeekStart', () => {
  test('returns Monday for a Wednesday', () => {
    const result = getWeekStart(new Date('2026-03-04T12:00:00Z'))
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-02')
  })

  test('returns same Monday for a Monday', () => {
    const result = getWeekStart(new Date('2026-03-02T12:00:00Z'))
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-02')
  })

  test('returns previous Monday for a Sunday', () => {
    const result = getWeekStart(new Date('2026-03-08T12:00:00Z'))
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-02')
  })
})

describe('formatWeekLabel', () => {
  test('formats a date string as "Week of Mar 2"', () => {
    expect(formatWeekLabel('2026-03-02')).toBe('Week of Mar 2')
  })
})
