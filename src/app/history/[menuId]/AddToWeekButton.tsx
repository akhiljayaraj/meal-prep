'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getWeekStartString } from '@/lib/utils/dates'

export default function AddToWeekButton({ recipeId }: { recipeId: string }) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const router = useRouter()

  async function addToThisWeek() {
    setAdding(true)
    const supabase = createClient()
    const weekStart = getWeekStartString()

    let { data: menu } = await supabase
      .from('weekly_menus')
      .select('id')
      .eq('week_start_date', weekStart)
      .single()

    if (!menu) {
      const { data } = await supabase
        .from('weekly_menus')
        .insert({ week_start_date: weekStart })
        .select('id')
        .single()
      menu = data
    }

    await supabase.from('menu_recipes').upsert(
      { menu_id: menu!.id, recipe_id: recipeId },
      { onConflict: 'menu_id,recipe_id' }
    )

    setAdded(true)
    setAdding(false)
    router.refresh()
  }

  if (added) return <p className="text-xs text-emerald-600 mt-1">Added to this week!</p>

  return (
    <button
      onClick={addToThisWeek}
      disabled={adding}
      className="text-xs text-emerald-600 font-medium mt-1 disabled:opacity-50"
    >
      {adding ? 'Adding...' : '+ Add to this week'}
    </button>
  )
}
