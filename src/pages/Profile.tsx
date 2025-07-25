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

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>({
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const fetchProfile = async () => {
    try {
      const user = await account.get();
      const res = await databases.listDocuments("transport_db", "user_profiles", [
        Query.equal("user_id", user.$id),
        Query.limit(1)
      ]);

      if (res.total === 0) throw new Error("Profil non trouv\u00e9");

      const userProfile = res.documents[0];
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
        city: profile.city
      });
      setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
    } catch (err) {
      console.error("Erreur de mise \u00e0 jour:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) return <Layout showSidebar><div className="text-center py-10">Chargement...</div></Layout>;

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || "/placeholder-avatar.jpg"} />
                <AvatarFallback>
                  {(profile.first_name?.[0] || "").toUpperCase() + (profile.last_name?.[0] || "").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
                <Camera size={16} />
                <input type="file" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div>
              <CardTitle className="text-xl">{profile.first_name} {profile.last_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Prénom</Label>
              <Input value={profile.first_name} onChange={(e) => handleInputChange("first_name", e.target.value)} />
            </div>
            <div>
              <Label>Nom</Label>
              <Input value={profile.last_name} onChange={(e) => handleInputChange("last_name", e.target.value)} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={profile.phone_number} onChange={(e) => handleInputChange("phone_number", e.target.value)} />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input value={profile.business_address} onChange={(e) => handleInputChange("business_address", e.target.value)} />
            </div>
            <div>
              <Label>Ville / Code postal</Label>
              <Input value={profile.city} onChange={(e) => handleInputChange("city", e.target.value)} />
            </div>
            {profile.role === "partner" && (
              <>
                <div>
                  <Label>Nom de l’entreprise</Label>
                  <Input value={profile.company || ""} disabled />
                </div>
                <div>
                  <Label>Numéro SIRET</Label>
                  <Input value={profile.siret_number} disabled />
                </div>
                <div>
                  <Label>Numéro de TVA</Label>
                  <Input value={profile.vat_number} disabled />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={async () => {
                const email = window.prompt("Confirmez votre email");
                const oldPassword = window.prompt("Mot de passe actuel");
                const newPassword = window.prompt("Nouveau mot de passe");
                if (email && oldPassword && newPassword) {
                  try {
                    await account.updateEmail(email, oldPassword);
                    await account.updatePassword(newPassword, oldPassword);
                    alert("Mise à jour réussie");
                  } catch (e: any) {
                    alert("Erreur: " + e.message);
                  }
                }
              }}
              variant="outline"
            >
              Modifier email / mot de passe
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={updateProfile} disabled={isSaving} className="bg-blue-800 text-white">
            {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
