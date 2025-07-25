import { account, databases } from './appwrite'
import { ID } from 'appwrite'

const DB_ID = 'transport_db'
const PROFILES_COLLECTION = 'user_profiles'

export async function signUpWithProfile(values: any) {
  const user = await account.create(
    ID.unique(),
    values.email,
    values.password,
    `${values.firstName} ${values.lastName}`,
    {
      emailRedirectTo: './pages/email-confirmed' // ✅ URL de redirection après validation
    }
  )

  await databases.createDocument(DB_ID, PROFILES_COLLECTION, ID.unique(), {
    user_id: user.$id,
    email: values.email,
    first_name: values.firstName,
    last_name: values.lastName,
    phone_number: values.phoneNumber,
    role: values.role,
    business_address: values.businessAddress ?? '',
    city: values.city ?? '',
    vat_number: values.vatNumber ?? '',
    siret_number: values.siretNumber ?? '',
    is_validated: values.role === 'client' ? true : false
  })

  return user
}
