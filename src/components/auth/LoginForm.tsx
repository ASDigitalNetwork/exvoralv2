'use client'

import { useState } from "react"
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


const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
})

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
  setIsLoading(true)
  try {
    await account.deleteSession('current').catch(() => {})
    await account.createEmailPasswordSession(values.email, values.password)

    const session = await account.get()
    const userId = session.$id

    // 🔎 Va chercher le profil utilisateur dans Appwrite
    const res = await databases.listDocuments('transport_db', 'user_profiles', [
      Query.equal('user_id', userId),
      Query.limit(1)
    ])

    const profile = res.documents[0]

    if (!profile) {
      throw new Error("Profil utilisateur introuvable.")
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
      throw new Error("Rôle utilisateur inconnu.")
    }

    toast({
      title: "Connexion réussie",
      description: "Bienvenue sur Exvoral 🚚",
    })
  } catch (error: any) {
    toast({
      title: "Erreur de connexion",
      description: error?.message || "Une erreur est survenue.",
      variant: "destructive",
    })
  } finally {
    setIsLoading(false)
  }
}


  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
      <CardHeader className="space-y-4 text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
        <CardTitle className="text-3xl font-bold text-primary">Connexion</CardTitle>
        <CardDescription className="text-lg">Connectez-vous à votre compte Exvoral</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="votre@email.com"
                className="h-12 pl-10 text-black"
                disabled={isLoading}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                placeholder="••••••••"
                className="h-12 pl-10 text-black"
                disabled={isLoading}
              />

            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-12 text-lg font-semibold bg-orange-400 hover:bg-orange-500 text-white" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>

          <div className="text-center space-y-4">
            <button type="button" className="text-sm text-white hover:underline" disabled={isLoading}>
              Mot de passe oublié ?
            </button>
            <div className="pt-4 border-t border-border">
              <p className="text-white-300">
                Pas encore de compte ?{" "}
                <button
                  onClick={onToggleMode}
                  className="text-orange-400 hover:underline font-medium"
                  disabled={isLoading}
                >
                  Créer un compte
                </button>
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
