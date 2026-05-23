'use client'

import React, { useActionState, useState } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/auth-actions'
import { Scissors, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, null)
  const [selectedRole, setSelectedRole] = useState<'owner' | 'stylist'>('owner')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Helper function to prefill credentials for easy testing
  const handlePrefill = (role: 'owner' | 'stylist') => {
    setSelectedRole(role)
    if (role === 'owner') {
      setEmail('owner@salongrowth.com')
      setPassword('password123')
    } else {
      setEmail('stylist@salongrowth.com')
      setPassword('password123')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl opacity-60 animate-pulse" />
      <div className="absolute bottom-0 right-4 w-96 h-96 bg-indigo-900/30 rounded-full blur-3xl opacity-60" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-2">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Scissors className="h-8 w-8 text-white animate-spin-slow" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            GlowFlow
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          Sign in to your dashboard
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{' '}
          <Link href="/register" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
            register a new salon
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 py-8 px-4 shadow-2xl rounded-3xl sm:px-10">
          
          {/* Quick-test Pre-fill Buttons */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Testing Assistant (Pre-fill Credentials)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePrefill('owner')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  selectedRole === 'owner'
                    ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-inner'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                Salon Owner
              </button>
              <button
                type="button"
                onClick={() => handlePrefill('stylist')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  selectedRole === 'stylist'
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-inner'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Scissors className="h-3 w-3" />
                Stylist / Staff
              </button>
            </div>
          </div>

          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="rounded-2xl bg-red-900/20 border border-red-500/30 p-4 flex gap-3 text-red-300 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@salon.com"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-indigo-500/10 cursor-pointer"
              >
                {isPending ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
