import Link from 'next/link'
import type { Recipe } from '@/types'

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 active:bg-gray-50"
    >
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{recipe.title}</h3>
        {recipe.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{recipe.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{recipe.ingredients.length} ingredients</p>
      </div>
    </Link>
  )
}
