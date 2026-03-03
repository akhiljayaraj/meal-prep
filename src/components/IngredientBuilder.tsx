'use client'

import { useState } from 'react'
import type { Ingredient } from '@/types'

interface Props {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
}

export default function IngredientBuilder({ ingredients, onChange }: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')

  function add() {
    if (!name.trim()) return
    onChange([...ingredients, { name: name.trim(), quantity: quantity.trim(), unit: unit.trim() }])
    setName('')
    setQuantity('')
    setUnit('')
  }

  function remove(index: number) {
    onChange(ingredients.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {ingredients.map((ingredient, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <span className="flex-1 text-sm">
              {ingredient.quantity} {ingredient.unit} {ingredient.name}
            </span>
            <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ingredient"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <input
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder="Qty"
          className="w-16 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={unit}
          onChange={e => setUnit(e.target.value)}
          placeholder="Unit"
          className="w-16 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
        >
          Add
        </button>
      </div>
    </div>
  )
}
