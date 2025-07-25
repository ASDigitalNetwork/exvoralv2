'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Building, Mail, Lock } from "lucide-react"
import { signUpWithProfile } from "@/lib/auth"
import { useNavigate } from 'react-router-dom'

const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phoneNumber: z.string().min(10, "Numéro de téléphone invalide"),
  role: z.enum(["client", "partner"]),
  company: z.string().optional(),
  businessAddress: z.string().optional(),
  city: z.string().optional(),
  vatNumber: z.string().optional(),
  siretNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "partner") {
    return (
      data.businessAddress &&
      data.city &&
      data.siretNumber &&
      data.company
    );
  }
  return true;
}, {
  message: "Toutes les informations d'entreprise sont requises pour les partenaires",
  path: ["businessAddress"],
});

interface SignupFormProps {
  onToggleMode: () => void
}

export function SignupForm({ onToggleMode }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      role: "client",
      company: "",
      businessAddress: "",
      city: "",
      vatNumber: "",
      siretNumber: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true)
    try {
      await signUpWithProfile(values)
      toast({
        title: "Compte créé",
        description: "Un email de confirmation vous a été envoyé.",
      })
      navigate('/signup-success')
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="space-y-4 text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
        <CardTitle className="text-3xl font-bold text-primary">Créer un compte</CardTitle>
        <CardDescription className="text-lg">Rejoignez la plateforme et commencez dès maintenant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="email" type="email" placeholder="votre@email.com" {...form.register("email")} className="h-12 pl-10" disabled={isLoading} />
            </div>
          </div>

          {/* Mot de passe + Confirmation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" {...form.register("password")} className="h-12 pl-10" disabled={isLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="confirmPassword" type="password" placeholder="••••••••" {...form.register("confirmPassword")} className="h-12 pl-10" disabled={isLoading} />
              </div>
            </div>
          </div>

          {/* Infos personnelles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" {...form.register("firstName")} className="h-12" disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" {...form.register("lastName")} className="h-12" disabled={isLoading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
            <Input id="phoneNumber" type="tel" placeholder="+33 6 12 34 56 78" {...form.register("phoneNumber")} className="h-12" disabled={isLoading} />
          </div>

          {/* Rôle */}
          <div className="space-y-4">
            <Label>Type de compte</Label>
            <RadioGroup
              value={form.watch("role")}
              onValueChange={(value) => form.setValue("role", value as "client" | "partner")}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="client"
                className="flex flex-col items-center space-y-3 border-2 border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
              >
                <RadioGroupItem value="client" id="client" className="sr-only" />
                <User className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Client</div>
                  <div className="text-xs text-muted-foreground">Faire une demande de transport</div>
                </div>
              </Label>

              <Label
                htmlFor="partner"
                className="flex flex-col items-center space-y-3 border-2 border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
              >
                <RadioGroupItem value="partner" id="partner" className="sr-only" />
                <Building className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Partenaire</div>
                  <div className="text-xs text-muted-foreground">Proposer vos offres de transport</div>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Infos entreprise */}
          {form.watch("role") === "partner" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-lg">Informations de l’entreprise</h3>
              <div className="space-y-2">
                <Label htmlFor="company">Nom de l’entreprise *</Label>
                <Input id="company" {...form.register("company")} className="h-12" disabled={isLoading} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Adresse *</Label>
                  <Input id="businessAddress" {...form.register("businessAddress")} className="h-12" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input id="city" {...form.register("city")} className="h-12" disabled={isLoading} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siretNumber">Numéro SIRET *</Label>
                  <Input id="siretNumber" {...form.register("siretNumber")} className="h-12" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">Numéro TVA (facultatif)</Label>
                  <Input id="vatNumber" {...form.register("vatNumber")} className="h-12" disabled={isLoading} />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-lg font-semibold bg-orange-400 hover:bg-orange-500 text-white" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Création en cours...</> : "Créer un compte"}
          </Button>

          <div className="text-center">
            <p className="text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <button onClick={onToggleMode} className="text-primary hover:underline font-medium" disabled={isLoading}>
                Se connecter
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
