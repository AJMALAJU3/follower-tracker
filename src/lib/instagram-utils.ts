import { User } from "@/types/instagram"

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

export const extractUsersFromJson = (data: any, type: "followers" | "following"): User[] => {
  if (Array.isArray(data)) {
    return data
      .map((user) => ({
        username: user.username || user.string_list_data?.[0]?.value || "",
        url: user.url || user.string_list_data?.[0]?.href || "",
        profile_pic_url: user.profile_pic_url || "",
      }))
      .filter((user) => user.username)
  }

  if (data.relationships_followers && type === "followers") {
    return data.relationships_followers
      .map((item: any) => ({
        username: item.string_list_data?.[0]?.value || "",
        url: item.string_list_data?.[0]?.href || "",
      }))
      .filter((user: User) => user.username)
  }

  if (data.relationships_following && type === "following") {
    return data.relationships_following
      .map((item: any) => ({
        username: item.string_list_data?.[0]?.value || "",
        url: item.string_list_data?.[0]?.href || "",
      }))
      .filter((user: User) => user.username)
  }

  for (const key in data) {
    if (typeof data[key] === "object" && data[key] !== null) {
      if (Array.isArray(data[key])) {
        const users = data[key].filter(
          (item: any) => item.username || (item.string_list_data && item.string_list_data[0]?.value)
        )
        if (users.length > 0) {
          return users.map((user: any) => ({
            username: user.username || user.string_list_data?.[0]?.value || "",
            url: user.url || user.string_list_data?.[0]?.href || "",
            profile_pic_url: user.profile_pic_url || "",
          }))
        }
      } else {
        const users = extractUsersFromJson(data[key], type)
        if (users.length > 0) return users
      }
    }
  }

  return []
}

export const findNotFollowingBack = (list1: User[], list2: User[]): User[] => {
  return list1.filter((user1) => !list2.some((user2) => user2.username === user1.username))
}
