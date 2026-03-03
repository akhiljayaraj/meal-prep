import type { Recipe, Ingredient } from '@/types'

export function aggregateIngredients(recipes: Recipe[]): Ingredient[] {
  const map = new Map<string, Ingredient>()

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = ingredient.name.toLowerCase().trim()
      if (!map.has(key)) {
        map.set(key, { ...ingredient })
        continue
      }
      const existing = map.get(key)!
      const existingQty = parseFloat(existing.quantity)
      const newQty = parseFloat(ingredient.quantity)
      if (!isNaN(existingQty) && !isNaN(newQty)) {
        map.set(key, { ...existing, quantity: String(existingQty + newQty) })
      }
    }
  }

  return Array.from(map.values())
}
