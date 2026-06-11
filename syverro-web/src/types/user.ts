export interface User {
  id: string
  email: string
  createdAt: string
  profile?: {
    name?: string
    avatar?: string
    readerLevel?: string
  }
}