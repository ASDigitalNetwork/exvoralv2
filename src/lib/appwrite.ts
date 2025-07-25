// lib/appwrite.ts
import { Client, Account, Databases, Storage, ID } from 'appwrite'

const client = new Client()

client
  .setEndpoint('https://fra.cloud.appwrite.io/v1') // Exemple : https://appwrite.monsite.com/v1
  .setProject('68769734001f7d9ae3bc') // Disponible dans le dashboard Appwrite

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export default client
export {ID}