"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Users, UserCheck, UserMinus, UserX } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"

type User = {
  username: string
  full_name?: string
  profile_pic_url?: string
}

type AnalysisResult = {
  followers: User[]
  following: User[]
  notFollowingBack: User[]
  youDontFollowBack: User[]
}

export default function InstagramAnalyzer() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "followers" | "following") => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      setError(null)

      const fileContent = await readFileAsText(file)
      const jsonData = JSON.parse(fileContent)

      // Extract users from the JSON data
      const users = extractUsersFromJson(jsonData, type)

      if (users.length === 0) {
        throw new Error(`No ${type} found in the JSON file. Please check the format.`)
      }

      // Update the result state based on the file type
      setResult((prevResult) => {
        const newResult = { ...prevResult } as AnalysisResult

        if (type === "followers") {
          newResult.followers = users
        } else {
          newResult.following = users
        }

        // If both followers and following are available, calculate the differences
        if (newResult.followers && newResult.following) {
          newResult.notFollowingBack = findNotFollowingBack(newResult.following, newResult.followers)
          newResult.youDontFollowBack = findNotFollowingBack(newResult.followers, newResult.following)
        }

        return newResult
      })
    } catch (err) {
      setError(`Error processing ${type} file: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  const extractUsersFromJson = (data: any, type: "followers" | "following"): User[] => {
    // Try different possible JSON structures
    if (Array.isArray(data)) {
      // Direct array of users
      return data
        .map((user) => ({
          username: user.username || user.string_list_data?.[0]?.value || "",
          full_name: user.full_name || user.string_list_data?.[0]?.href || "",
          profile_pic_url: user.profile_pic_url || "",
        }))
        .filter((user) => user.username)
    }

    // Instagram export format
    if (data.relationships_followers && type === "followers") {
      return data.relationships_followers
        .map((item: any) => ({
          username: item.string_list_data?.[0]?.value || "",
          full_name: item.string_list_data?.[0]?.href || "",
        }))
        .filter((user: User) => user.username)
    }

    if (data.relationships_following && type === "following") {
      return data.relationships_following
        .map((item: any) => ({
          username: item.string_list_data?.[0]?.value || "",
          full_name: item.string_list_data?.[0]?.href || "",
        }))
        .filter((user: User) => user.username)
    }

    // Try to find users in nested structures
    for (const key in data) {
      if (typeof data[key] === "object" && data[key] !== null) {
        if (Array.isArray(data[key])) {
          const users = data[key].filter(
            (item: any) => item.username || (item.string_list_data && item.string_list_data[0]?.value),
          )
          if (users.length > 0) {
            return users.map((user: any) => ({
              username: user.username || user.string_list_data?.[0]?.value || "",
              full_name: user.full_name || user.string_list_data?.[0]?.href || "",
              profile_pic_url: user.profile_pic_url || "",
            }))
          }
        } else {
          // Recursively search for users in nested objects
          const users = extractUsersFromJson(data[key], type)
          if (users.length > 0) return users
        }
      }
    }

    return []
  }

  const findNotFollowingBack = (list1: User[], list2: User[]): User[] => {
    return list1.filter((user1) => !list2.some((user2) => user2.username === user1.username))
  }

  const resetAnalysis = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Instagram Followers/Following Analyzer</CardTitle>
          <CardDescription>
            Upload your Instagram followers and following JSON data to analyze your relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label htmlFor="followers-upload" className="block mb-2 text-sm font-medium">
                Upload Followers JSON
              </label>
              <div className="relative">
                <input
                  id="followers-upload"
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, "followers")}
                  className="hidden"
                />
                <Button
                  onClick={() => document.getElementById("followers-upload")?.click()}
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <Upload size={16} />
                  {result?.followers ? `${result.followers.length} followers loaded` : "Upload Followers"}
                </Button>
              </div>
            </div>

            <div className="flex-1">
              <label htmlFor="following-upload" className="block mb-2 text-sm font-medium">
                Upload Following JSON
              </label>
              <div className="relative">
                <input
                  id="following-upload"
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, "following")}
                  className="hidden"
                />
                <Button
                  onClick={() => document.getElementById("following-upload")?.click()}
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <Upload size={16} />
                  {result?.following ? `${result.following.length} following loaded` : "Upload Following"}
                </Button>
              </div>
            </div>
          </div>

          {result && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Analysis Results</h3>
                <Button variant="outline" onClick={resetAnalysis}>
                  Reset
                </Button>
              </div>

              <Tabs defaultValue="followers" className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
                  <TabsTrigger value="followers" className="flex items-center gap-2">
                    <Users size={16} />
                    <span>All Followers</span>
                    {result.followers && <span className="ml-1 text-xs">({result.followers.length})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="following" className="flex items-center gap-2">
                    <UserCheck size={16} />
                    <span>All Following</span>
                    {result.following && <span className="ml-1 text-xs">({result.following.length})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="not-following-back" className="flex items-center gap-2">
                    <UserX size={16} />
                    <span>Not Following Back</span>
                    {result.notFollowingBack && (
                      <span className="ml-1 text-xs">({result.notFollowingBack.length})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="you-dont-follow" className="flex items-center gap-2">
                    <UserMinus size={16} />
                    <span>You Don't Follow</span>
                    {result.youDontFollowBack && (
                      <span className="ml-1 text-xs">({result.youDontFollowBack.length})</span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="followers">
                  <UserList users={result.followers || []} title="People who follow you" />
                </TabsContent>

                <TabsContent value="following">
                  <UserList users={result.following || []} title="People you follow" />
                </TabsContent>

                <TabsContent value="not-following-back">
                  <UserList
                    users={result.notFollowingBack || []}
                    title="People who don't follow you back"
                    emptyMessage="Everyone you follow also follows you back!"
                  />
                </TabsContent>

                <TabsContent value="you-dont-follow">
                  <UserList
                    users={result.youDontFollowBack || []}
                    title="People you don't follow back"
                    emptyMessage="You follow everyone who follows you!"
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {!result && !error && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Upload your Instagram followers and following JSON files to see the analysis.
              </p>
              <p className="text-sm text-muted-foreground">
                You can download your Instagram data from your Instagram account settings.
                <br />
                Go to Settings → Privacy and Security → Data Download → Request Download
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function UserList({
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
                      src={user.profile_pic_url || "/placeholder.svg"}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium">{user.username}</p>
                  {user.full_name && <p className="text-xs text-muted-foreground">{user.full_name}</p>}
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
