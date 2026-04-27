import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"
import { getUserSaves } from "@/lib/db/watchlist"
import { getUserCollections } from "@/lib/db/collections"
import { supabaseAdmin } from "@/lib/supabase-server"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProfileTabs } from "@/components/profile-tabs"
import { Calendar } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings, Edit } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const user = await getUser()

  if (!user) {
    redirect("/login?redirectTo=/profile")
  }

  const [savedProducts, userCollections, submissionsData] = await Promise.all([
    getUserSaves(user.id).catch(() => []),
    getUserCollections(user.id).catch(() => []),
    Promise.resolve(supabaseAdmin
      .from("products")
      .select("id, slug, name, logo_url, category, status, created_at")
      .eq("source", "user-submission")
      // TODO: add submitter_id column to products to filter by user
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20)
    ).then((r) => (r.data as Array<{ id: string; slug: string; name: string; logo_url: string | null; category: string; status: string; created_at: string }> ?? []))
      .catch(() => []),
  ])

  const submissions = submissionsData as Array<{
    id: string
    slug: string
    name: string
    logo_url: string | null
    category: string
    status: string
    created_at: string
  }>

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
        <div className="mb-8 flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-serif text-primary shrink-0">
            {avatarInitial}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{displayName}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Member since {joinedDate}
                </p>
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

            {/* Stats row */}
            <div className="flex gap-6 mt-3">
              <div className="text-center">
                <div className="text-lg font-mono font-semibold">{savedProducts.length}</div>
                <div className="text-xs text-muted-foreground">Saved</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono font-semibold">{userCollections.length}</div>
                <div className="text-xs text-muted-foreground">Lists</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono font-semibold">{submissions.length}</div>
                <div className="text-xs text-muted-foreground">Submitted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ProfileTabs
          savedProducts={savedProducts}
          collections={userCollections}
          submissions={submissions}
          userId={user.id}
        />
      </main>

      <SiteFooter />
    </div>
  )
}
