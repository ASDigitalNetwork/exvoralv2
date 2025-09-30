"use client";

import { useEffect, useMemo, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";

type RoleFilter = "all" | "client" | "partner";

interface User {
  $id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_validated?: boolean;
  role: "client" | "partner" | "admin";
  created_at?: string;
  $createdAt?: string;
}

const DB_ID = "transport_db";
const COL_USERS = "user_profiles";

export default function AdminUsers() {
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredRole, setFilteredRole] = useState<RoleFilter>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const safeDate = (u: User) => u.created_at || u.$createdAt || "";

  const fetchUsers = async () => {
    try {
      const res = await databases.listDocuments(DB_ID, COL_USERS, [
        Query.orderDesc("$createdAt"),
        Query.limit(500),
      ]);
      setUsers(res.documents as unknown as User[]);
    } catch (err) {
      console.error(err);
      toast({
        title: t.errLoad ?? "Erreur",
        description: t.errLoadUsers ?? "Échec de chargement des utilisateurs",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (filteredRole === "all") return users;
    return users.filter((u) => u.role === filteredRole);
  }, [users, filteredRole]);

  const handleValidate = async (userId: string, value: boolean) => {
    try {
      await databases.updateDocument(DB_ID, COL_USERS, userId, {
        is_validated: value,
      });
      toast({
        title: value ? (t.validated ?? "Validé") : (t.suspended ?? "Suspendu"),
        description: value
          ? (t.accountValidated ?? "Le compte a été validé.")
          : (t.accountSuspended ?? "Le compte a été suspendu."),
      });
      await fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description:
          t.errUpdateAccount ?? "Impossible de mettre à jour le compte",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await databases.deleteDocument(DB_ID, COL_USERS, userId);
      toast({
        title: t.accountDeleted ?? "Compte supprimé",
        description:
          t.accountDeletedDesc ??
          "Le compte a été définitivement supprimé.",
      });
      await fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description: t.errDeleteAccount ?? "Impossible de supprimer le compte",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-exv-primary">{t.adminUsersTitle}</h1>
          <div className="space-x-2">
            <Button
              variant={filteredRole === "all" ? "default" : "outline"}
              className={
                filteredRole === "all"
                  ? "bg-exv-accent text-white hover:bg-exv-dark"
                  : "border-exv-accent text-exv-dark"
              }
              onClick={() => setFilteredRole("all")}
            >
              {t.filterAll}
            </Button>
            <Button
              variant={filteredRole === "client" ? "default" : "outline"}
              className={
                filteredRole === "client"
                  ? "bg-exv-accent text-white hover:bg-exv-dark"
                  : "border-exv-accent text-exv-dark"
              }
              onClick={() => setFilteredRole("client")}
            >
              {t.filterClients}
            </Button>
            <Button
              variant={filteredRole === "partner" ? "default" : "outline"}
              className={
                filteredRole === "partner"
                  ? "bg-exv-accent text-white hover:bg-exv-dark"
                  : "border-exv-accent text-exv-dark"
              }
              onClick={() => setFilteredRole("partner")}
            >
              {t.filterPartners}
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card
              key={user.$id}
              onClick={() => setSelectedUser(user)}
              className="hover:shadow-md cursor-pointer border border-exv-border"
            >
              <CardHeader className="bg-exv-panel/40 rounded-t-2xl">
                <CardTitle className="text-exv-primary">
                  {(user.first_name || "") + " " + (user.last_name || "")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1 text-exv-dark">
                <p>
                  <span className="font-medium">{t.emailLabel}:</span>{" "}
                  {user.email || t.notProvided}
                </p>
                <p>
                  <span className="font-medium">{t.phoneLabel}:</span>{" "}
                  {user.phone_number || t.notProvided}
                </p>
                <p>
                  <span className="font-medium">{t.role}:</span> {user.role}
                </p>
                <p>
                  <span className="font-medium">{t.registeredAt}:</span>{" "}
                  {safeDate(user)
                    ? new Date(safeDate(user)).toLocaleDateString()
                    : "—"}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">{t.statusLabel}:</span>
                  {user.is_validated ? (
                    <Badge className="bg-green-600 text-white hover:bg-green-600">
                      {t.validated}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t.statusPending}</Badge>
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog: user details */}
        {selectedUser && (
          <>
            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-exv-primary">
                    {t.userDetailsTitle}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm text-exv-dark">
                  <p>
                    <strong>{t.nameLabel}:</strong>{" "}
                    {(selectedUser.first_name || "") +
                      " " +
                      (selectedUser.last_name || "")}
                  </p>
                  <p>
                    <strong>{t.emailLabel}:</strong> {selectedUser.email || "—"}
                  </p>
                  <p>
                    <strong>{t.phoneLabel}:</strong>{" "}
                    {selectedUser.phone_number || t.notProvided}
                  </p>
                  <p>
                    <strong>{t.role}:</strong> {selectedUser.role}
                  </p>
                  <p>
                    <strong>{t.statusLabel}:</strong>{" "}
                    {selectedUser.is_validated ? t.validated : t.statusPending}
                  </p>
                  <p>
                    <strong>{t.registeredAt}:</strong>{" "}
                    {safeDate(selectedUser)
                      ? new Date(safeDate(selectedUser)).toLocaleDateString()
                      : "—"}
                  </p>

                  <div className="flex flex-wrap gap-3 pt-4">
                    {selectedUser.role === "partner" && !selectedUser.is_validated && (
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleValidate(selectedUser.$id, true)}
                      >
                        {t.validatePartner}
                      </Button>
                    )}
                    {selectedUser.is_validated && (
                      <Button
                        variant="outline"
                        className="border-exv-accent text-exv-dark"
                        onClick={() => handleValidate(selectedUser.$id, false)}
                      >
                        {t.suspendAccount}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      {t.delete}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-exv-primary">
                    {t.confirmDeleteTitle}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-exv-dark">
                  <p>{t.confirmDeleteDesc}</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      {t.cancel}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (selectedUser) {
                          handleDelete(selectedUser.$id);
                          setShowDeleteConfirm(false);
                        }
                      }}
                    >
                      {t.confirmDelete}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </Layout>
  );
}
