'use client'

import { useMemo, useState } from "react"
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
import { useTranslation } from '@/hooks/useTranslation';

interface SignupFormProps {
  onToggleMode: () => void
}

export function SignupForm({ onToggleMode }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Schéma avec messages traduits
  const signupSchema = useMemo(() => z.object({
    email: z.string().email(t.errEmailInvalid),
    password: z.string().min(6, t.errPasswordMin),
    confirmPassword: z.string(),
    firstName: z.string().min(2, t.errFirstNameMin),
    lastName: z.string().min(2, t.errLastNameMin),
    phoneNumber: z.string().min(10, t.errPhoneInvalid),
    role: z.enum(["client", "partner"]),
    company: z.string().optional(),
    businessAddress: z.string().optional(),
    city: z.string().optional(),
    vatNumber: z.string().optional(),
    siretNumber: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t.errPasswordsDontMatch,
    path: ["confirmPassword"],
  }).refine((data) => {
    if (data.role === "partner") {
      return Boolean(data.businessAddress && data.city && data.siretNumber && data.company)
    }
    return true
  }, {
    message: t.errPartnerCompanyRequired,
    path: ["businessAddress"],
  }), [t])

  type SignupValues = z.infer<typeof signupSchema>

  const form = useForm<SignupValues>({
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

  const onSubmit = async (values: SignupValues) => {
    setIsLoading(true)
    try {
      await signUpWithProfile(values)
      toast({ title: t.toastSignupSuccessTitle, description: t.toastSignupSuccessDesc })
      navigate('/signup-success')
    } catch (error: any) {
      toast({
        title: t.toastSignupErrorTitle,
        description: error?.message || t.toastSignupErrorDefault,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border border-exv-border bg-exv-card text-exv-text">
      <CardHeader className="space-y-2 text-center bg-exv-panel rounded-t-lg border-b border-exv-border">
        <CardTitle className="text-3xl font-bold text-exv-text">{t.signupTitle}</CardTitle>
        <CardDescription className="text-lg text-exv-sub">{t.signupSubtitle}</CardDescription>
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
                placeholder={t.placeholderEmail}
                {...form.register("email")}
                className="h-12 pl-10 bg-white text-black"
                disabled={isLoading}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Password + confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-exv-text">{t.labelPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-exv-sub" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t.placeholderPassword}
                  {...form.register("password")}
                  className="h-12 pl-10 bg-white text-black"
                  disabled={isLoading}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-exv-text">{t.labelConfirmPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-exv-sub" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t.placeholderPassword}
                  {...form.register("confirmPassword")}
                  className="h-12 pl-10 bg-white text-black"
                  disabled={isLoading}
                />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Personal info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-exv-text">{t.labelFirstName}</Label>
              <Input id="firstName" {...form.register("firstName")} className="h-12 bg-white text-black" disabled={isLoading} />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-exv-text">{t.labelLastName}</Label>
              <Input id="lastName" {...form.register("lastName")} className="h-12 bg-white text-black" disabled={isLoading} />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-exv-text">{t.labelPhone}</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder={t.placeholderPhone}
              {...form.register("phoneNumber")}
              className="h-12 bg-white text-black"
              disabled={isLoading}
            />
            {form.formState.errors.phoneNumber && (
              <p className="text-sm text-red-500">{form.formState.errors.phoneNumber.message}</p>
            )}
          </div>

          {/* Account type */}
          <div className="space-y-3">
            <Label className="text-exv-text">{t.accountType}</Label>
            <RadioGroup
              value={form.watch("role")}
              onValueChange={(value) => form.setValue("role", value as "client" | "partner")}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="client"
                className="flex flex-col items-center space-y-3 border-2 border-exv-border rounded-xl p-4 cursor-pointer hover:border-exv-accent transition-colors [&:has(:checked)]:border-exv-accent [&:has(:checked)]:bg-exv-panel"
              >
                <RadioGroupItem value="client" id="client" className="sr-only" />
                <User className="h-8 w-8 text-exv-accent" />
                <div className="text-center">
                  <div className="font-semibold text-exv-text">{t.roleClientTitle}</div>
                  <div className="text-xs text-exv-sub">{t.roleClientDesc}</div>
                </div>
              </Label>

              <Label
                htmlFor="partner"
                className="flex flex-col items-center space-y-3 border-2 border-exv-border rounded-xl p-4 cursor-pointer hover:border-exv-accent transition-colors [&:has(:checked)]:border-exv-accent [&:has(:checked)]:bg-exv-panel"
              >
                <RadioGroupItem value="partner" id="partner" className="sr-only" />
                <Building className="h-8 w-8 text-exv-accent" />
                <div className="text-center">
                  <div className="font-semibold text-exv-text">{t.rolePartnerTitle}</div>
                  <div className="text-xs text-exv-sub">{t.rolePartnerDesc}</div>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Company info (partner only) */}
          {form.watch("role") === "partner" && (
            <div className="space-y-4 p-4 border border-exv-border rounded-lg bg-exv-panel">
              <h3 className="font-semibold text-lg text-exv-text">{t.companyInfoTitle}</h3>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-exv-text">{t.labelCompany} *</Label>
                <Input id="company" {...form.register("company")} className="h-12 bg-white text-black" disabled={isLoading} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessAddress" className="text-exv-text">{t.labelBusinessAddress} *</Label>
                  <Input id="businessAddress" {...form.register("businessAddress")} className="h-12 bg-white text-black" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-exv-text">{t.labelCity} *</Label>
                  <Input id="city" {...form.register("city")} className="h-12 bg-white text-black" disabled={isLoading} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siretNumber" className="text-exv-text">{t.labelSiret} *</Label>
                  <Input id="siretNumber" {...form.register("siretNumber")} className="h-12 bg-white text-black" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber" className="text-exv-text">{t.labelVatOptional}</Label>
                  <Input id="vatNumber" {...form.register("vatNumber")} className="h-12 bg-white text-black" disabled={isLoading} />
                </div>
              </div>

              {/* Affichage d'éventuelles erreurs globales pour la section */}
              {form.formState.errors.businessAddress?.message && (
                <p className="text-sm text-red-500">{form.formState.errors.businessAddress.message}</p>
              )}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-exv-accent text-exv-primary hover:opacity-90"
            disabled={isLoading}
          >
            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t.btnCreating}</> : t.btnCreate}
          </Button>

          {/* Footer */}
          <div className="text-center">
            <p className="text-exv-sub">
              {t.haveAccount}{" "}
              <button onClick={onToggleMode} className="text-exv-accent hover:underline font-medium" disabled={isLoading}>
                {t.actionLogin}
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
