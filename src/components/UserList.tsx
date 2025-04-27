"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User } from "@/types/instagram"

export function UserList({
  users,
  title,
  emptyMessage = "No users found",
}: {
  users: User[]
  title: string
  emptyMessage?: string
}) {
  if (users.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{users.length} users</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <ul className="space-y-2">
            {users.map((user, index) => (
              <li key={index} className="p-2 hover:bg-muted rounded-md flex items-center">
                <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center text-sm mr-3">
                  {user.profile_pic_url ? (
                    <img
                      src={user.profile_pic_url}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium">{user.username}</p>
                  {user.url && (
                    <a
                      href={user.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-blue-400 cursor-pointer"
                    >
                      {user.url}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
