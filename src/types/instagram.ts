export type User = {
    username: string
    url?: string
    profile_pic_url?: string
  }
  
  export type AnalysisResult = {
    followers: User[]
    following: User[]
    notFollowingBack: User[]
    youDontFollowBack: User[]
  }
  