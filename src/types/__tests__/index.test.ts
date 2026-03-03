import type { Recipe, Ingredient } from '../index'

test('Recipe type shape is correct', () => {
  const recipe: Recipe = {
    id: '123',
    title: 'Pasta',
    description: 'Simple pasta',
    image_url: null,
    ingredients: [{ name: 'Pasta', quantity: '200', unit: 'g' }],
    created_by: 'user-1',
    created_at: '2026-03-02T00:00:00Z',
  }
  expect(recipe.title).toBe('Pasta')
  expect(recipe.ingredients[0].name).toBe('Pasta')
})
