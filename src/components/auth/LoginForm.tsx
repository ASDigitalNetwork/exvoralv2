'use client'

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, Lock } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { account } from "@/lib/appwrite"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { useTranslation } from '@/hooks/useTranslation';

const BRAND = "Exvoral Transport";

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  // Schéma i18n (seulement les messages changent)
  const loginSchema = useMemo(() => z.object({
    email: z.string().email(t.errEmailInvalid),
    password: z.string().min(1, t.errPasswordRequired),
  }), [t])

  type LoginValues = z.infer<typeof loginSchema>

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true)
    try {
      await account.deleteSession('current').catch(() => {})
      await account.createEmailPasswordSession(values.email, values.password)

      const session = await account.get()
      const userId = session.$id

      // 🔎 Profil utilisateur Appwrite
      const res = await databases.listDocuments('transport_db', 'user_profiles', [
        Query.equal('user_id', userId),
        Query.limit(1)
      ])

      const profile = res.documents[0]

      if (!profile) {
        throw new Error(t.errProfileNotFound)
      }

      const role = profile.role
      const isValidated = profile.is_validated

      if (role === 'partner') {
        if (isValidated === true) {
          window.location.href = "/dashboard"
        } else {
          window.location.href = "waiting-approval"
        }
      } else if (role === 'client') {
        window.location.href = "/dashboard"
      } else if (role === 'admin') {
        window.location.href = "/dashboard"
      } else {
        throw new Error(t.errUnknownRole)
      }

      toast({
        title: t.toastLoginSuccessTitle,
        description: t.toastLoginSuccessDesc.replace("{brand}", BRAND),
      })
    } catch (error: any) {
      toast({
        title: t.toastLoginErrorTitle,
        description: error?.message || t.toastLoginErrorDefault,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border border-exv-border bg-exv-card text-exv-text">
      <CardHeader className="space-y-2 text-center bg-exv-panel rounded-t-lg border-b border-exv-border">
        <CardTitle className="text-3xl font-bold text-exv-text">{t.loginTitle}</CardTitle>
        <CardDescription className="text-lg text-exv-sub">{t.loginSubtitle.replace("{brand}", BRAND)}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-exv-text">{t.labelEmail}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-exv-sub" />
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder={t.placeholderEmail}
                className="h-12 pl-10 bg-white text-black"
                disabled={isLoading}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-exv-text">{t.labelPassword}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-exv-sub" />
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                placeholder={t.placeholderPassword}
                className="h-12 pl-10 bg-white text-black"
                disabled={isLoading}
              />
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-exv-accent text-exv-primary hover:opacity-90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t.btnLoggingIn}
              </>
            ) : (
              t.btnLogin
            )}
          </Button>

          {/* Links */}
          <div className="text-center space-y-4">
            <button type="button" className="text-sm text-exv-text hover:underline" disabled={isLoading}>
              {t.forgotPassword}
            </button>
            <div className="pt-4 border-t border-exv-border">
              <p className="text-exv-sub">
                {t.noAccount}{" "}
                <button
                  onClick={onToggleMode}
                  className="text-exv-accent hover:underline font-medium"
                  disabled={isLoading}
                >
                  {t.createAccount}
                </button>
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
