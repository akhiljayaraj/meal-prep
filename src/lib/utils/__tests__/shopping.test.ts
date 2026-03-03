import { aggregateIngredients } from '../shopping'
import type { Recipe } from '@/types'

const makeRecipe = (ingredients: Recipe['ingredients']): Recipe => ({
  id: '1',
  title: 'Test',
  description: null,
  image_url: null,
  ingredients,
  created_by: null,
  created_at: '2026-03-02T00:00:00Z',
})

describe('aggregateIngredients', () => {
  test('returns empty array for no recipes', () => {
    expect(aggregateIngredients([])).toEqual([])
  })

  test('returns ingredients from a single recipe', () => {
    const recipes = [makeRecipe([{ name: 'Onion', quantity: '2', unit: 'pcs' }])]
    expect(aggregateIngredients(recipes)).toEqual([{ name: 'Onion', quantity: '2', unit: 'pcs' }])
  })

  test('sums numeric quantities for same-name ingredients', () => {
    const recipes = [
      makeRecipe([{ name: 'Garlic', quantity: '3', unit: 'cloves' }]),
      makeRecipe([{ name: 'Garlic', quantity: '2', unit: 'cloves' }]),
    ]
    expect(aggregateIngredients(recipes)).toEqual([
      { name: 'Garlic', quantity: '5', unit: 'cloves' },
    ])
  })

  test('keeps different ingredients separate', () => {
    const recipes = [
      makeRecipe([
        { name: 'Onion', quantity: '1', unit: 'pcs' },
        { name: 'Garlic', quantity: '2', unit: 'cloves' },
      ]),
    ]
    expect(aggregateIngredients(recipes)).toHaveLength(2)
  })

  test('case-insensitive matching for ingredient names', () => {
    const recipes = [
      makeRecipe([{ name: 'onion', quantity: '1', unit: 'pcs' }]),
      makeRecipe([{ name: 'Onion', quantity: '2', unit: 'pcs' }]),
    ]
    const result = aggregateIngredients(recipes)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe('3')
  })

  test('keeps non-numeric quantities, ignores duplicate', () => {
    const recipes = [
      makeRecipe([{ name: 'Salt', quantity: 'to taste', unit: '' }]),
      makeRecipe([{ name: 'Salt', quantity: 'pinch', unit: '' }]),
    ]
    const result = aggregateIngredients(recipes)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Salt')
  })
})
