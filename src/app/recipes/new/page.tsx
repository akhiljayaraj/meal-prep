'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import IngredientBuilder from '@/components/IngredientBuilder'
import type { Ingredient } from '@/types'

export default function NewRecipePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [saving, setSaving] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setImageUrl('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const supabase = createClient()

    let finalImageUrl = imageUrl
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `recipes/${Date.now()}.${ext}`
      const { data } = await supabase.storage.from('recipe-images').upload(path, imageFile)
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('recipe-images').getPublicUrl(data.path)
        finalImageUrl = publicUrl
      }
    }

    await supabase.from('recipes').insert({
      title: title.trim(),
      description: description.trim() || null,
      image_url: finalImageUrl || null,
      ingredients,
      created_by: null,
    })

    router.push('/recipes')
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">New Recipe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g. Chicken Stir Fry"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="A quick and healthy weeknight dinner..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
          {(imagePreview || imageUrl) && (
            <img src={imagePreview || imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" />
          )}
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or paste URL</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <input
              value={imageUrl}
              onChange={e => { setImageUrl(e.target.value); setImageFile(null); setImagePreview('') }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="https://example.com/photo.jpg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
          <IngredientBuilder ingredients={ingredients} onChange={setIngredients} />
        </div>

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Recipe'}
        </button>
      </form>
    </div>
  )
}
