"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Github, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { BRAND } from "@/lib/branding"
import { createBrowserSupabaseClient } from "@/lib/auth-client"

const benefits = [
  "Track unlimited products",
  "Get personalized recommendations",
  "Save favorites and build collections",
  "Weekly insights newsletter",
  "Early access to new features"
]

function SignupPageInner() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return
    setError(null)

    // Client-side validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // Show confirmation message — Supabase sends a confirmation email
      setSuccess(true)
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const strength = passwordStrength(formData.password)

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xl font-serif text-primary-foreground">{BRAND.initial}</span>
            </div>
            <span className="font-serif text-2xl">{BRAND.name}</span>
          </Link>

          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-primary" />
          </div>

          <h1 className="font-serif text-3xl mb-3">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{formData.email}</span>.
            Click the link to activate your account.
          </p>

          <p className="text-sm text-muted-foreground">
            Already confirmed?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-md">
          <h2 className="font-serif text-4xl mb-6">
            Join the community tracking tomorrow&apos;s products today
          </h2>

          <ul className="space-y-4">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 p-6 bg-card rounded-xl border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div>
                <div className="font-medium">Sarah Chen</div>
                <div className="text-sm text-muted-foreground">Product Manager @ Stripe</div>
              </div>
            </div>
            <p className="text-muted-foreground italic">
              &quot;{BRAND.name} helped me discover tools that gave our team a competitive edge. The buzz score feature is genius.&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xl font-serif text-primary-foreground">{BRAND.initial}</span>
            </div>
            <span className="font-serif text-2xl">{BRAND.name}</span>
          </Link>

          <h1 className="font-serif text-3xl mb-2">Create your account</h1>
          <p className="text-muted-foreground mb-8">
            Start tracking the products that matter to you.
          </p>

          {/* Social Signup */}
          <div className="space-y-3 mb-6">
            <Button variant="outline" className="w-full gap-2" type="button">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
            <Button variant="outline" className="w-full gap-2" type="button">
              <Github className="h-4 w-4" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          strength >= level
                            ? strength <= 1
                              ? "bg-red-500"
                              : strength <= 2
                              ? "bg-yellow-500"
                              : strength <= 3
                              ? "bg-blue-500"
                              : "bg-green-500"
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {strength <= 1 && "Weak — add numbers, symbols, and uppercase letters"}
                    {strength === 2 && "Fair — add more variety"}
                    {strength === 3 && "Good — almost there"}
                    {strength === 4 && "Strong password"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !agreed}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
export default function SignupPage() { return <Suspense><SignupPageInner /></Suspense> }
