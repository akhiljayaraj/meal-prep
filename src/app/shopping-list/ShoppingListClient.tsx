'use client'

import { useState, useEffect } from 'react'
import type { Ingredient } from '@/types'

interface Props {
  ingredients: Ingredient[]
  weekStart: string
}

export default function ShoppingListClient({ ingredients, weekStart }: Props) {
  const storageKey = `checked-${weekStart}`
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) setChecked(new Set(JSON.parse(stored)))
  }, [storageKey])

  function toggle(key: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      localStorage.setItem(storageKey, JSON.stringify([...next]))
      return next
    })
  }

  if (ingredients.length === 0) {
    return (
      <div className="p-4 text-center py-16 text-gray-400">
        <p className="text-lg">No ingredients yet</p>
        <p className="text-sm mt-1">Add dishes to this week&apos;s menu first</p>
      </div>
    )
  }

  const remaining = ingredients.filter(i => !checked.has(i.name.toLowerCase()))
  const done = ingredients.filter(i => checked.has(i.name.toLowerCase()))

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Shopping List</h1>
      <div className="space-y-2">
        {remaining.map(ingredient => (
          <button
            key={ingredient.name}
            onClick={() => toggle(ingredient.name.toLowerCase())}
            className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 text-left"
          >
            <span className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0" />
            <span className="flex-1 text-gray-900">
              <span className="font-medium">{ingredient.name}</span>
              {(ingredient.quantity || ingredient.unit) && (
                <span className="text-gray-400 text-sm"> — {ingredient.quantity} {ingredient.unit}</span>
              )}
            </span>
          </button>
        ))}

        {done.length > 0 && (
          <>
            <p className="text-xs text-gray-400 pt-2 pl-1">Done ({done.length})</p>
            {done.map(ingredient => (
              <button
                key={ingredient.name}
                onClick={() => toggle(ingredient.name.toLowerCase())}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-left opacity-50"
              >
                <span className="w-5 h-5 rounded border-2 border-emerald-400 bg-emerald-400 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="flex-1 text-gray-400 line-through">{ingredient.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
