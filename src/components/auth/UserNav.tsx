'use client'

import { User } from '@supabase/supabase-js'
import { LogoutButton } from './LogoutButton'
import Link from 'next/link'

interface UserNavProps {
  user: User
}

export function UserNav({ user }: UserNavProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {user.user_metadata.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name || user.email}
            className="h-8 w-8 rounded-full"
          />
        )}
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {user.user_metadata.full_name || user.email}
          </div>
          <div className="text-gray-500">{user.email}</div>
        </div>
      </div>
      <Link
        href="/profile"
        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Profile
      </Link>
      <LogoutButton />
    </div>
  )
}
