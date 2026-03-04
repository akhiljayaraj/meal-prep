import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWeekStartString, formatWeekLabel } from '@/lib/utils/dates'
import MenuPageClient from './MenuPageClient'
import type { MenuRecipeWithRecipe } from '@/types'

async function getOrCreateCurrentMenu(supabase: Awaited<ReturnType<typeof createClient>>) {
  const weekStart = getWeekStartString()
  let { data: menu } = await supabase
    .from('weekly_menus')
    .select('*')
    .eq('week_start_date', weekStart)
    .single()

  if (!menu) {
    const { data } = await supabase
      .from('weekly_menus')
      .insert({ week_start_date: weekStart })
      .select()
      .single()
    menu = data
  }
  return menu
}

export default async function MenuPage() {
  const supabase = await createClient()
  const menu = await getOrCreateCurrentMenu(supabase)
  if (!menu) redirect('/login')

  const { data: menuRecipes } = await supabase
    .from('menu_recipes')
    .select('*, recipe:recipes(*)')
    .eq('menu_id', menu.id)
    .order('added_at')

  return (
    <MenuPageClient
      menu={menu}
      menuRecipes={(menuRecipes ?? []) as MenuRecipeWithRecipe[]}
      weekLabel={formatWeekLabel(menu.week_start_date)}
    />
  )
}
