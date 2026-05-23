'use client'

import React, { useState, useMemo } from 'react'
import type { Customer } from '@/lib/types'
import {
  MessageSquare,
  AlertCircle,
  Sparkles,
  Send,
  Search,
  Users,
  Award,
  Gift,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react'

interface RetentionClientProps {
  customers: Customer[]
}

type CampaignTemplateKey = 'haircut' | 'facial' | 'coupon' | 'birthday'

const TEMPLATES: Record<CampaignTemplateKey, { name: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  haircut: {
    name: 'Haircut Recall',
    text: 'Hi {{name}}, it may be time for your next haircut. Book your preferred slot with us today!',
    icon: Sparkles
  },
  facial: {
    name: 'Facial Recall',
    text: 'Hi {{name}}, your next facial/glow session is due. We have relaxing slots available this weekend!',
    icon: Calendar
  },
  coupon: {
    name: 'Lost Client Coupon',
    text: 'Hi {{name}}, we missed you! Here is a special 20% discount coupon for your next visit this week.',
    icon: Gift
  },
  birthday: {
    name: 'Birthday Offer',
    text: 'Happy Birthday, {{name}}! Enjoy a special birthday surprise offer on your next visit this week.',
    icon: Award
  }
}

export default function RetentionClient({ customers }: RetentionClientProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'vip' | 'due' | 'lost' | 'birthday'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplateKey>('haircut')
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({})

  // Compute inactive days for customers
  const now = useMemo(() => new Date(), [])
  const enrichedCustomers = useMemo(() => {
    return customers.map((c) => {
      let inactiveDays = 0
      let segment: 'vip' | 'due' | 'lost' | 'birthday' | 'regular' = 'regular'

      if (c.last_visit_date) {
        const lastVisit = new Date(c.last_visit_date)
        const diffTime = Math.abs(now.getTime() - lastVisit.getTime())
        inactiveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      const isVIP = (c.total_visits || 0) >= 10 && (c.total_spend || 0) >= 15000
      const isBirthdayThisMonth = c.birthday ? new Date(c.birthday).getMonth() === now.getMonth() : false

      if (isVIP) segment = 'vip'
      else if (isBirthdayThisMonth) segment = 'birthday'
      else if (inactiveDays >= 60) segment = 'lost'
      else if (inactiveDays >= 30) segment = 'due'

      return {
        ...c,
        inactiveDays,
        segment,
        isVIP,
        isBirthdayThisMonth
      }
    })
  }, [customers, now])

  // Filter customers list
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter((c) => {
      // 1. Search Query filter
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)

      if (!matchesSearch) return false

      // 2. Tab Filter
      if (activeTab === 'vip') return c.segment === 'vip'
      if (activeTab === 'birthday') return c.segment === 'birthday'
      if (activeTab === 'due') return c.segment === 'due'
      if (activeTab === 'lost') return c.segment === 'lost'
      return true // 'all'
    })
  }, [enrichedCustomers, activeTab, searchQuery])

  // Calculate dynamic dashboard counters
  const counters = useMemo(() => {
    let vipCount = 0
    let dueCount = 0
    let lostCount = 0
    let birthdayCount = 0

    enrichedCustomers.forEach((c) => {
      if (c.segment === 'vip') vipCount++
      else if (c.segment === 'due') dueCount++
      else if (c.segment === 'lost') lostCount++
      else if (c.segment === 'birthday') birthdayCount++
    })

    return {
      vip: vipCount,
      due: dueCount,
      lost: lostCount,
      birthday: birthdayCount
    }
  }, [enrichedCustomers])

  // Get active selected customer details
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) {
      return filteredCustomers[0] || null
    }
    return enrichedCustomers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0] || null
  }, [selectedCustomerId, filteredCustomers, enrichedCustomers])

  // Initialize and get campaign message text
  const currentMessageText = useMemo(() => {
    if (!selectedCustomer) return ''
    const key = `${selectedCustomer.id}-${selectedTemplate}`
    if (editedMessages[key] !== undefined) {
      return editedMessages[key]
    }
    // Render default template text replacing placeholder
    const templateText = TEMPLATES[selectedTemplate].text
    return templateText.replace('{{name}}', selectedCustomer.name)
  }, [selectedCustomer, selectedTemplate, editedMessages])

  const handleMessageChange = (val: string) => {
    if (!selectedCustomer) return
    const key = `${selectedCustomer.id}-${selectedTemplate}`
    setEditedMessages((prev) => ({
      ...prev,
      [key]: val
    }))
  }

  const handleSendMessage = () => {
    if (!selectedCustomer) return
    const url = `https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(currentMessageText)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Retention Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Reactivate lost clients and send customized follow-ups using WhatsApp triggers.
          </p>
        </div>
      </div>

      {/* Overview Metric Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {/* Card 1: Churn Risk */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Churn Risk (30-60d)</span>
            <h3 className="text-3xl font-black text-white mt-2 tracking-tight">{counters.due}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shadow-inner">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Lost Customers */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lost (60d+)</span>
            <h3 className="text-3xl font-black text-white mt-2 tracking-tight">{counters.lost}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-450 shadow-inner">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: VIP Clients */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">VIP Cohort Recall</span>
            <h3 className="text-3xl font-black text-white mt-2 tracking-tight">{counters.vip}</h3>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 shadow-inner">
            <Award className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Birthdays */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Birthdays This Month</span>
            <h3 className="text-3xl font-black text-white mt-2 tracking-tight">{counters.birthday}</h3>
          </div>
          <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-400 shadow-inner">
            <Gift className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Campaign Dashboard Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Client Selector */}
        <div className="lg:col-span-7 glass-card p-5 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/60 pb-4">
            <h3 className="text-xs font-bold text-white tracking-wider flex items-center gap-2 uppercase">
              <Users className="h-4 w-4 text-purple-400" />
              Recall Cohort Selection
            </h3>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-900 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* Segment Filter Badges */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Clients', count: enrichedCustomers.length },
              { id: 'vip', label: 'VIPs', count: counters.vip },
              { id: 'due', label: 'Churn Risk', count: counters.due },
              { id: 'lost', label: 'Lost', count: counters.lost },
              { id: 'birthday', label: 'Birthdays', count: counters.birthday }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'all' | 'vip' | 'due' | 'lost' | 'birthday')
                  setSelectedCustomerId(null)
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.1)]'
                    : 'bg-slate-950/40 border-slate-900 text-slate-450 hover:text-slate-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Clients List container */}
          <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-10 border border-dashed border-slate-900 rounded-2xl">
                No clients match the active recall filter.
              </p>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-500/[0.04] border-purple-500/30'
                        : 'bg-slate-950/20 border-slate-900/60 hover:bg-slate-900/10'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-205">{cust.name}</span>
                        {cust.segment === 'vip' && (
                          <span className="text-[8px] bg-purple-500/15 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                            VIP
                          </span>
                        )}
                        {cust.segment === 'birthday' && (
                          <span className="text-[8px] bg-pink-500/15 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                            Birthday
                          </span>
                        )}
                        {cust.segment === 'lost' && (
                          <span className="text-[8px] bg-rose-500/15 text-rose-450 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                            {cust.inactiveDays}d Lost
                          </span>
                        )}
                        {cust.segment === 'due' && (
                          <span className="text-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                            {cust.inactiveDays}d Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Last Service: {cust.last_visit_date ? new Date(cust.last_visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                        {cust.total_visits ? ` • ${cust.total_visits} visits` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ChevronRight className={`h-4.5 w-4.5 text-slate-500 transition-transform ${isSelected ? 'translate-x-0.5 text-purple-400' : ''}`} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: HubSpot-Style Campaign Builder Panel */}
        <div className="lg:col-span-5 glass-card p-5 rounded-3xl space-y-5">
          <h3 className="text-xs font-bold text-white tracking-wider flex items-center gap-2 pb-3 border-b border-slate-900/60 uppercase">
            <MessageSquare className="h-4 w-4 text-purple-400" />
            Interactive Template Builder
          </h3>

          {selectedCustomer ? (
            <div className="space-y-5">
              {/* Selected client card details */}
              <div className="bg-slate-950/40 border border-slate-900/60 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target Recipient</p>
                <h4 className="font-extrabold text-white text-base mt-1">{selectedCustomer.name}</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">{selectedCustomer.phone}</p>
              </div>

              {/* Template Style Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Template Choice</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TEMPLATES).map(([key, item]) => {
                    const Icon = item.icon
                    const isSelected = selectedTemplate === key
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedTemplate(key as CampaignTemplateKey)}
                        className={`p-3 border rounded-xl flex items-center gap-2.5 text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-500/[0.03] border-purple-500 text-purple-400'
                            : 'bg-slate-950/30 border-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-bold tracking-tight">{item.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Message Content Editor */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Customize Text Body</label>
                  <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded-full">
                    LIVE PREVIEW
                  </span>
                </div>
                <textarea
                  value={currentMessageText}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-900 rounded-2xl p-4 text-xs font-mono text-slate-300 leading-relaxed placeholder-slate-600 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 shadow-inner"
                />
              </div>

              {/* Send trigger */}
              <button
                onClick={handleSendMessage}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Transmit Recall WhatsApp</span>
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic text-center py-20">
              Select a customer to customize campaigns.
            </p>
          )}
        </div>

      </div>

    </div>
  )
}
