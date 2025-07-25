export default function EmailConfirmed() {
  return (
    <div className="text-center p-10">
      <h1 className="text-3xl font-bold text-primary">Email confirmé ✅</h1>
      <p className="mt-4 text-muted-foreground">Vous pouvez maintenant vous connecter à votre compte.</p>
      <a href="/login" className="mt-6 inline-block bg-primary text-white py-2 px-4 rounded">
        Se connecter
      </a>
    </div>
  )
}
