export default function SignupSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-2xl font-bold text-primary mb-4">🎉 Merci pour votre inscription</h1>
        <p className="text-muted-foreground mb-6">
          Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception pour activer votre compte.
        </p>
        <a
          href="/"
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition"
        >
          Aller à la connexion
        </a>
      </div>
    </div>
  )
}
