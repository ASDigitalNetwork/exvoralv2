'use client';

import { useEffect, useState } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface User {
  $id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_validated: boolean;
  role: 'client' | 'partner' | 'admin';
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredRole, setFilteredRole] = useState<'all' | 'client' | 'partner'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await databases.listDocuments('transport_db', 'user_profiles', [
        Query.orderDesc('$createdAt')
      ]);
      setUsers(res.documents as User[]);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erreur', description: 'Échec de chargement des utilisateurs', variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filteredRole === 'all') return true;
    return u.role === filteredRole;
  });

  const handleValidate = async (userId: string, value: boolean) => {
    try {
      await databases.updateDocument('transport_db', 'user_profiles', userId, {
        is_validated: value,
      });
      toast({ title: value ? 'Validé' : 'Suspendu', description: `Le compte a été ${value ? 'validé' : 'suspendu'}.` });
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le compte', variant: 'destructive' });
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await databases.deleteDocument('transport_db', 'user_profiles', userId);
      toast({ title: 'Compte supprimé', description: 'Le compte a été définitivement supprimé.' });
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le compte', variant: 'destructive' });
    }
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-800">Gestion des Utilisateurs</h1>
          <div className="space-x-2">
            <Button variant={filteredRole === 'all' ? 'default' : 'outline'} onClick={() => setFilteredRole('all')}>Tous</Button>
            <Button variant={filteredRole === 'client' ? 'default' : 'outline'} onClick={() => setFilteredRole('client')}>Clients</Button>
            <Button variant={filteredRole === 'partner' ? 'default' : 'outline'} onClick={() => setFilteredRole('partner')}>Partenaires</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.$id} onClick={() => setSelectedUser(user)} className="hover:shadow-md cursor-pointer">
              <CardHeader>
                <CardTitle>{user.first_name} {user.last_name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Email : {user.email}</p>
                <p>Téléphone : {user.phone_number || 'Non fourni'}</p>
                <p>Rôle : {user.role}</p>
                <p>Inscription : {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
                <p>Status : {user.is_validated ? <Badge variant="default">Validé</Badge> : <Badge variant="secondary">En attente</Badge>}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedUser && (
          <>
            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Détails de l'utilisateur</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <p><strong>Nom :</strong> {selectedUser.first_name} {selectedUser.last_name}</p>
                  <p><strong>Email :</strong> {selectedUser.email}</p>
                  <p><strong>Téléphone :</strong> {selectedUser.phone_number}</p>
                  <p><strong>Rôle :</strong> {selectedUser.role}</p>
                  <p><strong>Status :</strong> {selectedUser.is_validated ? 'Validé' : 'En attente'}</p>
                  <p><strong>Date inscription :</strong> {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>

                  <div className="flex flex-wrap gap-3 pt-4">
                    {selectedUser.role === 'partner' && !selectedUser.is_validated && (
                      <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleValidate(selectedUser.$id, true)}>
                        Valider ce partenaire
                      </Button>
                    )}
                    {selectedUser.is_validated && (
                      <Button variant="outline" onClick={() => handleValidate(selectedUser.$id, false)}>
                        Suspendre le compte
                      </Button>
                    )}
                    <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer la suppression</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (selectedUser) {
                          handleDelete(selectedUser.$id);
                          setShowDeleteConfirm(false);
                        }
                      }}
                    >
                      Confirmer la suppression
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
