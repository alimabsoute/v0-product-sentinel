import { redirect } from "next/navigation"
import Link from "next/link"
import { getUser } from "@/lib/auth"
import { getUserSaves } from "@/lib/db/watchlist"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
import { ProfileTabs } from "@/components/profile-tabs"
import {
  Settings,
  Bookmark,
  Calendar,
  Bell,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const user = await getUser()

  if (!user) {
    redirect("/login?redirectTo=/profile")
  }

  // Fetch saved products — handle case where user_saves table isn't yet created
  let savedProducts: Awaited<ReturnType<typeof getUserSaves>> = []
  try {
    savedProducts = await getUserSaves(user.id)
  } catch {
    // Table may not exist yet if migration hasn't run — degrade gracefully
    savedProducts = []
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User"

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })

  const avatarInitial = displayName[0]?.toUpperCase() ?? "U"

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-serif text-primary">
              {avatarInitial}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl mb-1">{displayName}</h1>
                <p className="text-muted-foreground mb-3">{user.email}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {joinedDate}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link href="/profile/settings">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                  <Link href="/profile/settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-6">
              <div className="text-center">
                <div className="text-2xl font-serif">{savedProducts.length}</div>
                <div className="text-xs text-muted-foreground">Saved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs (client component for interactivity) */}
        <ProfileTabs savedProducts={savedProducts} userId={user.id} />
      </main>

      <SiteFooter />
    </div>
  )
}
