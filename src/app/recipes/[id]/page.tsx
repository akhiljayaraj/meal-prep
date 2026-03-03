import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Recipe } from '@/types'

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: recipe } = await supabase.from('recipes').select('*').eq('id', id).single()

  if (!recipe) notFound()

  const r = recipe as Recipe

  return (
    <div className="pb-8">
      {r.image_url && (
        <div className="w-full h-56 overflow-hidden">
          <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <Link href="/recipes" className="text-gray-500 mt-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex-1">{r.title}</h1>
        </div>

        {r.description && <p className="text-gray-600 mb-6">{r.description}</p>}

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h2>
          {r.ingredients.length === 0 ? (
            <p className="text-gray-400 text-sm">No ingredients listed</p>
          ) : (
            <ul className="space-y-2">
              {r.ingredients.map((ingredient, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>
                    {ingredient.quantity} {ingredient.unit}{' '}
                    <span className="font-medium">{ingredient.name}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
