'use client'

import React, { useState } from 'react'
import type { Service } from '@/lib/types'
import ServiceDialog from '@/components/services/ServiceDialog'
import { toggleServiceStatus } from './actions'
import { Plus, Scissors, Clock, Percent, RotateCcw, Edit2, ToggleLeft, ToggleRight, Search } from 'lucide-react'

interface ServicesClientProps {
  initialServices: Service[]
}

export default function ServicesClient({ initialServices }: ServicesClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Service | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category))).sort()]

  const filtered = services.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = selectedCategory === 'All' || s.category === selectedCategory
    return matchSearch && matchCat
  })

  const openAdd = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (service: Service) => {
    setEditTarget(service)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    // In real mode Next.js revalidates; in dev mode reload to get new mock
    window.location.reload()
  }

  const handleToggle = async (service: Service) => {
    const newState = !service.is_active
    // Optimistic update
    setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, is_active: newState } : s)))
    await toggleServiceStatus(service.id, newState)
  }

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Services Menu
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Configure salon offerings, pricing, durations, and default stylist commissions.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2.5 glow-cta glow-cta-hover text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Search & Category Filter box */}
      <div className="space-y-4 bg-slate-900/40 border border-slate-900/60 p-5 rounded-2xl shadow-inner">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search service menu by keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 glass-input glass-input-focus rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap pt-1">
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  isCatActive
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] font-extrabold'
                    : 'bg-slate-950/60 text-slate-400 border-slate-900 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Services Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm italic">
          No services match the active search or category filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((service) => (
            <div
              key={service.id}
              className={`glass-card rounded-3xl flex flex-col justify-between space-y-5 p-6 ${
                service.is_active
                  ? 'glass-card-hover'
                  : 'opacity-40 border-slate-900 bg-slate-950/20'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs bg-slate-950/60 text-indigo-405 border border-slate-900/60 px-3.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    {service.category}
                  </span>
                  <span className="text-[17px] font-extrabold text-white">
                    ₹{service.price.toLocaleString('en-IN')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-4.5 flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-slate-550 shrink-0" />
                  {service.name}
                </h3>
              </div>

              {/* Specifications row */}
              <div className="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-slate-900/60 text-sm font-bold">
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/65 text-center">
                  <span className="text-slate-500 block mb-1 uppercase tracking-wider text-xs">Duration</span>
                  <span className="font-extrabold text-slate-300 flex items-center justify-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    {service.duration_minutes}m
                  </span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/65 text-center">
                  <span className="text-slate-500 block mb-1 uppercase tracking-wider text-[10px]">Comm</span>
                  <span className="font-extrabold text-purple-300 flex items-center justify-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-purple-400" />
                    {service.commission_percentage}%
                  </span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/65 text-center">
                  <span className="text-slate-500 block mb-1 uppercase tracking-wider text-[10px]">Recall</span>
                  <span className="font-extrabold text-emerald-300 flex items-center justify-center gap-1">
                    <RotateCcw className="h-3.5 w-3.5 text-emerald-455" />
                    {service.repeat_cycle_days}d
                  </span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-900/60">
                <button
                  onClick={() => handleToggle(service)}
                  className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    service.is_active ? 'text-emerald-400 hover:text-rose-400' : 'text-slate-500 hover:text-emerald-400'
                  }`}
                >
                  {service.is_active ? (
                    <ToggleRight className="h-5 w-5" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                  <span>{service.is_active ? 'Active' : 'Inactive'}</span>
                </button>
                <button
                  onClick={() => openEdit(service)}
                  className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary footer */}
      <p className="text-sm font-bold text-slate-500 text-right uppercase tracking-wider select-none">
        {filtered.length} of {services.length} services cataloged
      </p>

      <ServiceDialog
        key={editTarget?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editService={editTarget}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
