// ProfilePage.tsx
"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { databases, account, storage } from "@/lib/appwrite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { Query } from "appwrite";
import { useTranslation } from "@/hooks/useTranslation";

type Profile = {
  $id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  avatar_url: string;
  business_address: string;
  city: string;
  siret_number: string;
  vat_number: string;
  role: string;
  company?: string;
};

export default function ProfilePage() {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<Profile>({
    $id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    avatar_url: "",
    business_address: "",
    city: "",
    siret_number: "",
    vat_number: "",
    role: "",
    company: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const fetchProfile = async () => {
    try {
      const user = await account.get();
      const res = await databases.listDocuments("transport_db", "user_profiles", [
        Query.equal("user_id", user.$id),
        Query.limit(1),
      ]);

      if (res.total === 0) throw new Error(t.errProfileNotFound);

      const userProfile = res.documents[0] as any;
      setProfile({
        $id: userProfile.$id,
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        email: user.email || "",
        phone_number: userProfile.phone_number || "",
        avatar_url: userProfile.avatar_url || "",
        business_address: userProfile.business_address || "",
        city: userProfile.city || "",
        siret_number: userProfile.siret_number || "",
        vat_number: userProfile.vat_number || "",
        role: userProfile.role || "",
        company: userProfile.company || "",
      });
    } catch (err) {
      console.error("Erreur de chargement du profil:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    setIsSaving(true);
    try {
      let avatarUrl = profile.avatar_url;

      if (avatarFile && profile.$id) {
        const uploaded = await storage.createFile("avatars", profile.$id, avatarFile);
        avatarUrl = storage.getFilePreview("avatars", uploaded.$id).href;
      }

      await databases.updateDocument("transport_db", "user_profiles", profile.$id, {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone_number: profile.phone_number,
        avatar_url: avatarUrl,
        business_address: profile.business_address,
        city: profile.city,
      });

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
    } catch (err) {
      console.error("Erreur de mise à jour:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading)
    return (
      <Layout showSidebar>
        <div className="text-center py-10">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-t-transparent border-exv-accent animate-spin" />
          <div className="text-exv-sub">{t.loading}</div>
        </div>
      </Layout>
    );

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-exv-card text-exv-text border border-exv-border">
          <CardHeader className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border border-exv-border">
                <AvatarImage src={profile.avatar_url || "/placeholder-avatar.jpg"} />
                <AvatarFallback>
                  {(profile.first_name?.[0] || "").toUpperCase()}
                  {(profile.last_name?.[0] || "").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-exv-accent text-exv-primary p-1 rounded-full shadow border border-exv-border cursor-pointer">
                <Camera size={16} />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <div>
              <CardTitle className="text-xl">{profile.first_name} {profile.last_name}</CardTitle>
              <p className="text-sm text-exv-sub">{profile.email}</p>
            </div>
          </CardHeader>
        </Card>

        {/* Personal info */}
        <Card className="bg-exv-panel text-exv-text border border-exv-border">
          <CardHeader>
            <CardTitle>{t.profilePersonalInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-exv-text">{t.labelFirstName}</Label>
              <Input
                value={profile.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div>
              <Label className="text-exv-text">{t.labelLastName}</Label>
              <Input
                value={profile.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div>
              <Label className="text-exv-text">{t.labelPhone}</Label>
              <Input
                value={profile.phone_number}
                onChange={(e) => handleInputChange("phone_number", e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div>
              <Label className="text-exv-text">{t.labelBusinessAddress}</Label>
              <Input
                value={profile.business_address}
                onChange={(e) => handleInputChange("business_address", e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div>
              <Label className="text-exv-text">{t.labelCityZip}</Label>
              <Input
                value={profile.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="bg-white text-black"
              />
            </div>

            {profile.role === "partner" && (
              <>
                <div>
                  <Label className="text-exv-text">{t.labelCompany}</Label>
                  <Input value={profile.company || ""} disabled className="bg-white text-black" />
                </div>
                <div>
                  <Label className="text-exv-text">{t.labelSiret}</Label>
                  <Input value={profile.siret_number} disabled className="bg-white text-black" />
                </div>
                <div>
                  <Label className="text-exv-text">{t.labelVatNumber}</Label>
                  <Input value={profile.vat_number} disabled className="bg-white text-black" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-exv-panel text-exv-text border border-exv-border">
          <CardHeader>
            <CardTitle>{t.profileSecurity}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={async () => {
                const email = window.prompt(t.securityConfirmEmailPrompt);
                const oldPassword = window.prompt(t.securityCurrentPasswordPrompt);
                const newPassword = window.prompt(t.securityNewPasswordPrompt);
                if (email && oldPassword && newPassword) {
                  try {
                    await account.updateEmail(email, oldPassword);
                    await account.updatePassword(newPassword, oldPassword);
                    alert(t.securityUpdateSuccess);
                  } catch (e: any) {
                    alert(`${t.securityUpdateErrorPrefix} ${e?.message || ""}`);
                  }
                }
              }}
              variant="outline"
              className="border-exv-border text-black hover:bg-exv-card hover:text-black"

            >
              {t.securityChangeCredentials}
            </Button>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button
            onClick={updateProfile}
            disabled={isSaving}
            className="bg-exv-accent text-exv-primary hover:opacity-90"
          >
            {isSaving ? t.savingChanges : t.saveChanges}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
