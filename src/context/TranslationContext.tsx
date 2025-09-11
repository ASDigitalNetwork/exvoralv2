import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'fr' | 'en' | 'pt';
type Dict = Record<Lang, Record<string, string>>;

const LANG_STORAGE_KEY = 'lang';

const DICT: Dict = {
  fr: {
    appSlogan: "La plateforme qui centralise et sécurise vos transports B2B, de la demande au suivi.",
    heroBadge: "Plateforme de transport de confiance",
    ctaStart: "Commencer maintenant",
    ctaLogin: "Se connecter",

    trust1: "Validation manuelle des utilisateurs",
    trust2: "Paiements sécurisés",
    trust3: "Support client 24/7",

    whyTitle: "Pourquoi choisir",
    whyDesc: "Une plateforme complète qui simplifie la gestion de vos transports, avec des partenaires vérifiés et un suivi en temps réel.",

    feature1Title: "Transport Professionnel",
    feature1Desc: "Réseau de partenaires transporteurs qualifiés et vérifiés pour tous vos besoins.",
    feature2Title: "Plateforme Sécurisée",
    feature2Desc: "Validation manuelle des utilisateurs et paiements sécurisés pour votre tranquillité.",
    feature3Title: "Suivi Complet",
    feature3Desc: "Suivez vos demandes en temps réel depuis la création jusqu'à la livraison.",

    howTitle: "Comment ça marche",
    step1Title: "1. Créez votre demande",
    step1Desc: "Saisissez l’origine, la destination, les dates et les spécificités de la marchandise.",
    step2Title: "2. Recevez des offres",
    step2Desc: "Les partenaires validés proposent leurs tarifs en fonction de vos critères.",
    step3Title: "3. Validez et payez",
    step3Desc: "Choisissez l’offre, payez en toute sécurité, la mission est lancée.",
    step4Title: "4. Suivi & preuve de livraison",
    step4Desc: "Suivi en temps réel, photos de chargement/livraison, statut à chaque étape.",

    statMissions: "Missions déjà réalisées",
    statSatisfaction: "Satisfaction client",
    statAverageAssignment: "Attribution moyenne",

    testiRole1: "Responsable logistique",
    testiRole2: "Opérateur 3PL",
    testi1: "Process simple, offres rapides, et un vrai suivi — on a gagné des heures chaque semaine.",
    testi2: "Le contrôle des accès et le suivi photo ont nettement réduit nos litiges.",

    faqTitle: "Questions fréquentes",
    faq1Q: "Qui sont les transporteurs partenaires ?",
    faq1A: "Des entreprises vérifiées manuellement : KYC, assurances et conformité sont exigés avant l’accès.",
    faq2Q: "Comment sont sécurisés les paiements ?",
    faq2A: "Nous travaillons avec des prestataires reconnus. Les fonds sont tracés et les remboursements gérés selon les conditions.",
    faq3Q: "Puis-je suivre ma marchandise en temps réel ?",
    faq3A: "Oui. Vous voyez les statuts clés et pouvez exiger des preuves (photos) à chaque étape.",

    footerSubtitle: "Transport professionnel",
    allRightsReserved: "Tous droits réservés",
    hello: "Bonjour",
    logout: "Déconnexion",
    loginTitle: "Connexion",
    loginSubtitle: "Connectez-vous à votre compte {brand}",
    labelEmail: "Email",
    labelPassword: "Mot de passe",
    placeholderEmail: "votre@email.com",
    placeholderPassword: "••••••••",
    btnLogin: "Se connecter",
    btnLoggingIn: "Connexion...",
    forgotPassword: "Mot de passe oublié ?",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",

    toastLoginSuccessTitle: "Connexion réussie",
    toastLoginSuccessDesc: "Bienvenue sur {brand} 🚚",
    toastLoginErrorTitle: "Erreur de connexion",
    toastLoginErrorDefault: "Une erreur est survenue.",

    errEmailInvalid: "Email invalide",
    errPasswordRequired: "Le mot de passe est requis",
    errProfileNotFound: "Profil utilisateur introuvable.",
    errUnknownRole: "Rôle utilisateur inconnu.",
    signupTitle: "Créer un compte",
    signupSubtitle: "Rejoignez la plateforme et commencez dès maintenant",
    labelConfirmPassword: "Confirmer le mot de passe",
    labelFirstName: "Prénom",
    labelLastName: "Nom",
    labelPhone: "Numéro de téléphone",
    placeholderPhone: "+33 6 12 34 56 78",

    accountType: "Type de compte",
    roleClientTitle: "Client",
    roleClientDesc: "Faire une demande de transport",
    rolePartnerTitle: "Partenaire",
    rolePartnerDesc: "Proposer vos offres de transport",

    companyInfoTitle: "Informations de l’entreprise",
    labelCompany: "Nom de l’entreprise",
    labelBusinessAddress: "Adresse",
    labelCity: "Ville",
    labelSiret: "Numéro SIRET",
    labelVatOptional: "Numéro TVA (facultatif)",

    btnCreate: "Créer un compte",
    btnCreating: "Création en cours...",
    haveAccount: "Vous avez déjà un compte ?",
    actionLogin: "Se connecter",

    toastSignupSuccessTitle: "Compte créé",
    toastSignupSuccessDesc: "Un email de confirmation vous a été envoyé.",
    toastSignupErrorTitle: "Erreur d'inscription",
    toastSignupErrorDefault: "Une erreur est survenue.",

    errPasswordMin: "Le mot de passe doit contenir au moins 6 caractères",
    errPasswordsDontMatch: "Les mots de passe ne correspondent pas",
    errFirstNameMin: "Le prénom doit contenir au moins 2 caractères",
    errLastNameMin: "Le nom doit contenir au moins 2 caractères",
    errPhoneInvalid: "Numéro de téléphone invalide",
    errPartnerCompanyRequired: "Toutes les informations d'entreprise sont requises pour les partenaires",
    sidebarDashboard: "Tableau de bord",
    sidebarProfile: "Mon profil",
    sidebarNewRequest: "Nouvelle demande",
    sidebarMyRequests: "Mes demandes",
    sidebarMyTracking: "Mes transports",
    sidebarMyInvoices: "Mes factures",
    sidebarAvailableRequests: "Demandes disponibles",
    sidebarPartnerTransports: "Mes transports",
    sidebarPartnerTracking: "Suivi partenaire",
    sidebarPartnerInvoices: "Mes factures",
    sidebarAdminUsers: "Gestion utilisateurs",
    sidebarAdminRequests: "Toutes les demandes",
    sidebarAdminInvoices: "Toutes les factures",
    sidebarAdminAnalytics: "Analyses",

    roleClientLabel: "client",
    rolePartnerLabel: "partenaire",
    roleAdminLabel: "admin",

    loggingOut: "Déconnexion...",
    loading: "Chargement en cours...",
    dashboardTitle: "Tableau de bord",
    dashboardWelcome: "Bienvenue sur votre espace client",
    btnInvoices: "Factures",
    btnNewRequest: "Nouvelle demande",

    statOpenRequests: "Demandes en cours",
    statValidatedTransports: "Transports validés",
    statTotalRevenue: "Chiffre d’affaires total",
    statAllRequests: "Toutes mes demandes",

    tabOverview: "Tableau de bord",
    tabRequests: "Mes demandes",
    tabInvoices: "Mes factures",

    sectionMyTransports: "Mes transports",
    sectionMyTransportsDesc: "Suivi de vos transports récents",
    sectionStats: "Statistiques",

    statusPending: "En attente",
    statusValidated: "Validé",
    statusApproved: "Approuvé",
    statusInProgress: "En cours",
    statusCompleted: "Terminé",
    profilePersonalInfo: "Informations personnelles",
    profileSecurity: "Sécurité",
    labelCityZip: "Ville / Code postal",
    labelVatNumber: "Numéro de TVA",

    securityChangeCredentials: "Modifier email / mot de passe",
    securityConfirmEmailPrompt: "Confirmez votre email",
    securityCurrentPasswordPrompt: "Mot de passe actuel",
    securityNewPasswordPrompt: "Nouveau mot de passe",
    securityUpdateSuccess: "Mise à jour réussie",
    securityUpdateErrorPrefix: "Erreur :",

    saveChanges: "Enregistrer les modifications",
    savingChanges: "Enregistrement...",
    newRequestTitle: "Nouvelle demande",

    pickupAddressLabel: "Adresse de prise en charge",
    destinationAddressLabel: "Adresse de destination",
    packageTypeLabel: "Type de colis",
    heightCm: "Hauteur (cm)",
    widthCm: "Largeur (cm)",
    depthCm: "Profondeur (cm)",
    weightKg: "Poids (kg)",
    pickupDateLabel: "Date de prise en charge",
    deliveryDateLabel: "Date de livraison",
    attachImageOptional: "Joindre une image (optionnel)",

    addressPlaceholder: "Adresse complète",
    packageTypePlaceholder: "ex : palette, boîte, caisse…",

    btnCalcDistancePrice: "Calculer la distance et le prix",
    btnCalculating: "Calcul en cours...",
    btnCreateRequest: "Créer la demande",

    summaryTitle: "Résumé",
    summaryDistance: "Distance",
    summaryVolume: "Volume",
    summaryEstimatedPrice: "Prix estimé",

    toastUserNotConnected: "Utilisateur non connecté",
    toastRouteError: "Erreur lors du calcul de l'itinéraire",
    toastCreatedSuccess: "🎉 Votre demande a bien été créée ! Vous pouvez la suivre dans l'onglet Mes transports.",
    toastCreateError: "Erreur lors de la création de la demande",

    errPickupRequired: "L’adresse de prise en charge est requise",
    errDestinationRequired: "L’adresse de destination est requise",
    errPackageTypeRequired: "Le type de colis est requis",
    errHeightMin: "La hauteur doit être supérieure à 0",
    errWidthMin: "La largeur doit être supérieure à 0",
    errDepthMin: "La profondeur doit être supérieure à 0",
    errWeightMin: "Le poids doit être supérieur à 0",
    myTransportsTitle: "Mes transports",
    newTransportBtn: "Nouveau transport",

    emptyTitle: "Aucun transport",
    emptyDesc: "Vous n'avez pas encore de demandes de transport.",
    emptyCta: "Créer ma première demande",

    transportNumberPrefix: "Transport #",
    labelDeparture: "Départ",
    labelArrival: "Arrivée",
    labelType: "Type :",
    labelWeight: "Poids :",
    labelDistance: "Distance :",
    labelPrice: "Prix :",
    createdOn: "Créé le",
    follow: "Suivre",
    details: "Détails",
    notSpecified: "Non spécifié",

    statusQuoted: "Devisé",
    statusAccepted: "Accepté",
    statusDelivered: "Livré",
    statusCancelled: "Annulé",
    clientRequestsTitle: "Mes demandes",
    labelStatus: "Statut :",
    viewDetails: "Voir les détails",
    toastRequestsLoadError: "Erreur lors du chargement des demandes",




  },
  en: {
    appSlogan: "The platform that centralizes and secures your B2B transport — from request to delivery.",
    heroBadge: "Trusted transport platform",
    ctaStart: "Get started",
    ctaLogin: "Sign in",

    trust1: "Manual user validation",
    trust2: "Secure payments",
    trust3: "24/7 customer support",

    whyTitle: "Why choose",
    whyDesc: "A complete platform that simplifies your transport operations with vetted partners and real-time tracking.",

    feature1Title: "Professional Transport",
    feature1Desc: "A network of vetted carriers for all your needs.",
    feature2Title: "Secure Platform",
    feature2Desc: "Manual user approval and secure payments for peace of mind.",
    feature3Title: "End-to-End Tracking",
    feature3Desc: "Track each request in real time, from creation to delivery.",

    howTitle: "How it works",
    step1Title: "1. Create your request",
    step1Desc: "Enter origin, destination, dates and cargo specifications.",
    step2Title: "2. Receive quotes",
    step2Desc: "Approved partners submit offers tailored to your criteria.",
    step3Title: "3. Confirm & pay",
    step3Desc: "Pick an offer and pay securely; the job starts instantly.",
    step4Title: "4. Track & POD",
    step4Desc: "Live status, loading/delivery photos, and proof of delivery.",

    statMissions: "Jobs completed",
    statSatisfaction: "Customer satisfaction",
    statAverageAssignment: "Average assignment time",

    testiRole1: "Logistics Manager",
    testiRole2: "3PL Operator",
    testi1: "Simple process, quick quotes, real tracking — we save hours every week.",
    testi2: "Access control and photo tracking markedly reduced disputes.",

    faqTitle: "Frequently asked questions",
    faq1Q: "Who are the carrier partners?",
    faq1A: "Companies manually vetted: KYC, insurance, and compliance are required before access.",
    faq2Q: "How are payments secured?",
    faq2A: "We rely on renowned providers. Funds are traceable and refunds follow clear terms.",
    faq3Q: "Can I track my shipment in real time?",
    faq3A: "Yes. You see key statuses and can require photo evidence at each step.",

    footerSubtitle: "Professional transport",
    allRightsReserved: "All rights reserved",
    hello: "Hello",
    logout: "Logout",
    loginTitle: "Sign in",
    loginSubtitle: "Sign in to your {brand} account",
    labelEmail: "Email",
    labelPassword: "Password",
    placeholderEmail: "your@email.com",
    placeholderPassword: "••••••••",
    btnLogin: "Sign in",
    btnLoggingIn: "Signing in...",
    forgotPassword: "Forgot password?",
    noAccount: "Don’t have an account?",
    createAccount: "Create an account",

    toastLoginSuccessTitle: "Signed in",
    toastLoginSuccessDesc: "Welcome to {brand} 🚚",
    toastLoginErrorTitle: "Sign-in error",
    toastLoginErrorDefault: "Something went wrong.",

    errEmailInvalid: "Invalid email",
    errPasswordRequired: "Password is required",
    errProfileNotFound: "User profile not found.",
    errUnknownRole: "Unknown user role.",
    signupTitle: "Create an account",
    signupSubtitle: "Join the platform and get started now",

    labelConfirmPassword: "Confirm password",
    labelFirstName: "First name",
    labelLastName: "Last name",
    labelPhone: "Phone number",
    placeholderPhone: "+44 7700 900000",

    accountType: "Account type",
    roleClientTitle: "Client",
    roleClientDesc: "Submit transport requests",
    rolePartnerTitle: "Partner",
    rolePartnerDesc: "Offer your transport services",

    companyInfoTitle: "Company information",
    labelCompany: "Company name",
    labelBusinessAddress: "Address",
    labelCity: "City",
    labelSiret: "SIRET number",
    labelVatOptional: "VAT number (optional)",

    btnCreate: "Create account",
    btnCreating: "Creating...",
    haveAccount: "Already have an account?",
    actionLogin: "Sign in",

    toastSignupSuccessTitle: "Account created",
    toastSignupSuccessDesc: "A confirmation email has been sent to you.",
    toastSignupErrorTitle: "Sign-up error",
    toastSignupErrorDefault: "Something went wrong.",

    errPasswordMin: "Password must be at least 6 characters",
    errPasswordsDontMatch: "Passwords do not match",
    errFirstNameMin: "First name must be at least 2 characters",
    errLastNameMin: "Last name must be at least 2 characters",
    errPhoneInvalid: "Invalid phone number",
    errPartnerCompanyRequired: "All company fields are required for partners",
    sidebarDashboard: "Dashboard",
    sidebarProfile: "My profile",
    sidebarNewRequest: "New request",
    sidebarMyRequests: "My requests",
    sidebarMyTracking: "My shipments",
    sidebarMyInvoices: "My invoices",
    sidebarAvailableRequests: "Available requests",
    sidebarPartnerTransports: "My transports",
    sidebarPartnerTracking: "Partner tracking",
    sidebarPartnerInvoices: "My invoices",
    sidebarAdminUsers: "User management",
    sidebarAdminRequests: "All requests",
    sidebarAdminInvoices: "All invoices",
    sidebarAdminAnalytics: "Analytics",

    roleClientLabel: "client",
    rolePartnerLabel: "partner",
    roleAdminLabel: "admin",

    loggingOut: "Signing out...",
    loading: "Loading...",
    dashboardTitle: "Dashboard",
    dashboardWelcome: "Welcome to your client area",
    btnInvoices: "Invoices",
    btnNewRequest: "New request",

    statOpenRequests: "Open requests",
    statValidatedTransports: "Validated transports",
    statTotalRevenue: "Total revenue",
    statAllRequests: "All my requests",

    tabOverview: "Overview",
    tabRequests: "My requests",
    tabInvoices: "My invoices",

    sectionMyTransports: "My shipments",
    sectionMyTransportsDesc: "Track your recent shipments",
    sectionStats: "Statistics",

    statusPending: "Pending",
    statusValidated: "Validated",
    statusApproved: "Approved",
    statusInProgress: "In progress",
    statusCompleted: "Completed",
    profilePersonalInfo: "Personal information",
    profileSecurity: "Security",
    labelCityZip: "City / Postal code",
    labelVatNumber: "VAT number",

    securityChangeCredentials: "Change email / password",
    securityConfirmEmailPrompt: "Confirm your email",
    securityCurrentPasswordPrompt: "Current password",
    securityNewPasswordPrompt: "New password",
    securityUpdateSuccess: "Updated successfully",
    securityUpdateErrorPrefix: "Error:",

    saveChanges: "Save changes",
    savingChanges: "Saving...",
    newRequestTitle: "New request",

    pickupAddressLabel: "Pickup address",
    destinationAddressLabel: "Destination address",
    packageTypeLabel: "Package type",
    heightCm: "Height (cm)",
    widthCm: "Width (cm)",
    depthCm: "Depth (cm)",
    weightKg: "Weight (kg)",
    pickupDateLabel: "Pickup date",
    deliveryDateLabel: "Delivery date",
    attachImageOptional: "Attach an image (optional)",

    addressPlaceholder: "Full address",
    packageTypePlaceholder: "e.g. pallet, box, crate…",

    btnCalcDistancePrice: "Calculate distance and price",
    btnCalculating: "Calculating...",
    btnCreateRequest: "Create request",

    summaryTitle: "Summary",
    summaryDistance: "Distance",
    summaryVolume: "Volume",
    summaryEstimatedPrice: "Estimated price",

    toastUserNotConnected: "User not signed in",
    toastRouteError: "Error while calculating the route",
    toastCreatedSuccess: "🎉 Your request has been created! You can track it in the My transports tab.",
    toastCreateError: "Error while creating the request",

    errPickupRequired: "Pickup address is required",
    errDestinationRequired: "Destination address is required",
    errPackageTypeRequired: "Package type is required",
    errHeightMin: "Height must be greater than 0",
    errWidthMin: "Width must be greater than 0",
    errDepthMin: "Depth must be greater than 0",
    errWeightMin: "Weight must be greater than 0",
    myTransportsTitle: "My transports",
    newTransportBtn: "New transport",

    emptyTitle: "No transports",
    emptyDesc: "You don’t have any transport requests yet.",
    emptyCta: "Create my first request",

    transportNumberPrefix: "Transport #",
    labelDeparture: "Departure",
    labelArrival: "Arrival",
    labelType: "Type:",
    labelWeight: "Weight:",
    labelDistance: "Distance:",
    labelPrice: "Price:",
    createdOn: "Created on",
    follow: "Track",
    details: "Details",
    notSpecified: "Not specified",

    statusQuoted: "Quoted",
    statusAccepted: "Accepted",
    statusDelivered: "Delivered",
    statusCancelled: "Cancelled",
    clientRequestsTitle: "My requests",
    labelStatus: "Status:",
    viewDetails: "View details",
    toastRequestsLoadError: "Error loading requests",





  },
  pt: {
    appSlogan: "A plataforma que centraliza e protege o seu transporte B2B — do pedido à entrega.",
    heroBadge: "Plataforma de transporte confiável",
    ctaStart: "Começar agora",
    ctaLogin: "Entrar",

    trust1: "Validação manual de utilizadores",
    trust2: "Pagamentos seguros",
    trust3: "Apoio ao cliente 24/7",

    whyTitle: "Por que escolher",
    whyDesc: "Uma plataforma completa que simplifica a gestão dos seus transportes, com parceiros verificados e rastreamento em tempo real.",

    feature1Title: "Transporte Profissional",
    feature1Desc: "Rede de transportadoras qualificadas e verificadas para todas as necessidades.",
    feature2Title: "Plataforma Segura",
    feature2Desc: "Aprovação manual de utilizadores e pagamentos seguros para maior tranquilidade.",
    feature3Title: "Rastreamento Completo",
    feature3Desc: "Acompanhe cada pedido em tempo real, da criação à entrega.",

    howTitle: "Como funciona",
    step1Title: "1. Crie o seu pedido",
    step1Desc: "Indique origem, destino, datas e especificações da carga.",
    step2Title: "2. Receba propostas",
    step2Desc: "Parceiros aprovados enviam ofertas conforme os seus critérios.",
    step3Title: "3. Confirme e pague",
    step3Desc: "Escolha a oferta e pague com segurança; o serviço inicia-se de imediato.",
    step4Title: "4. Acompanhe & comprovativo",
    step4Desc: "Estado em tempo real, fotos de carga/entrega e comprovativo de entrega.",

    statMissions: "Serviços concluídos",
    statSatisfaction: "Satisfação do cliente",
    statAverageAssignment: "Tempo médio de atribuição",

    testiRole1: "Gestora de logística",
    testiRole2: "Operador 3PL",
    testi1: "Processo simples, propostas rápidas e rastreamento real — poupamos horas por semana.",
    testi2: "Controlo de acesso e fotos reduziram bastante disputas.",

    faqTitle: "Perguntas frequentes",
    faq1Q: "Quem são os parceiros transportadores?",
    faq1A: "Empresas verificadas manualmente: KYC, seguros e conformidade são exigidos antes do acesso.",
    faq2Q: "Como os pagamentos são protegidos?",
    faq2A: "Usamos provedores reconhecidos. Os fundos são rastreáveis e os reembolsos seguem termos claros.",
    faq3Q: "Posso rastrear a carga em tempo real?",
    faq3A: "Sim. Você vê estados chave e pode exigir fotos em cada etapa.",

    footerSubtitle: "Transporte profissional",
    allRightsReserved: "Todos os direitos reservados",
    hello: "Olá",
    logout: "Terminar sessão",
    loginTitle: "Iniciar sessão",
    loginSubtitle: "Entre na sua conta {brand}",
    labelEmail: "Email",
    labelPassword: "Palavra-passe",
    placeholderEmail: "o-seu@email.com",
    placeholderPassword: "••••••••",
    btnLogin: "Entrar",
    btnLoggingIn: "A entrar...",
    forgotPassword: "Esqueceu a palavra-passe?",
    noAccount: "Ainda não tem conta?",
    createAccount: "Criar conta",

    toastLoginSuccessTitle: "Sessão iniciada",
    toastLoginSuccessDesc: "Bem-vindo(a) ao {brand} 🚚",
    toastLoginErrorTitle: "Erro ao iniciar sessão",
    toastLoginErrorDefault: "Ocorreu um erro.",

    errEmailInvalid: "Email inválido",
    errPasswordRequired: "A palavra-passe é obrigatória",
    errProfileNotFound: "Perfil de utilizador não encontrado.",
    errUnknownRole: "Função de utilizador desconhecida.",
    signupTitle: "Criar conta",
    signupSubtitle: "Junte-se à plataforma e comece agora",

    labelConfirmPassword: "Confirmar palavra-passe",
    labelFirstName: "Nome",
    labelLastName: "Apelido",
    labelPhone: "Número de telefone",
    placeholderPhone: "+351 91 234 5678",

    accountType: "Tipo de conta",
    roleClientTitle: "Cliente",
    roleClientDesc: "Fazer pedidos de transporte",
    rolePartnerTitle: "Parceiro",
    rolePartnerDesc: "Oferecer serviços de transporte",

    companyInfoTitle: "Informações da empresa",
    labelCompany: "Nome da empresa",
    labelBusinessAddress: "Morada",
    labelCity: "Cidade",
    labelSiret: "Número SIRET",
    labelVatOptional: "Número de IVA (opcional)",

    btnCreate: "Criar conta",
    btnCreating: "A criar...",
    haveAccount: "Já tem conta?",
    actionLogin: "Iniciar sessão",

    toastSignupSuccessTitle: "Conta criada",
    toastSignupSuccessDesc: "Foi enviado um email de confirmação.",
    toastSignupErrorTitle: "Erro ao criar conta",
    toastSignupErrorDefault: "Ocorreu um erro.",

    errPasswordMin: "A palavra-passe deve ter pelo menos 6 caracteres",
    errPasswordsDontMatch: "As palavras-passe não coincidem",
    errFirstNameMin: "O nome deve ter pelo menos 2 caracteres",
    errLastNameMin: "O apelido deve ter pelo menos 2 caracteres",
    errPhoneInvalid: "Número de telefone inválido",
    errPartnerCompanyRequired: "Todos os campos da empresa são obrigatórios para parceiros",
    sidebarDashboard: "Painel",
    sidebarProfile: "O meu perfil",
    sidebarNewRequest: "Novo pedido",
    sidebarMyRequests: "Os meus pedidos",
    sidebarMyTracking: "Os meus transportes",
    sidebarMyInvoices: "As minhas faturas",
    sidebarAvailableRequests: "Pedidos disponíveis",
    sidebarPartnerTransports: "Os meus transportes",
    sidebarPartnerTracking: "Rastreio parceiro",
    sidebarPartnerInvoices: "As minhas faturas",
    sidebarAdminUsers: "Gestão de utilizadores",
    sidebarAdminRequests: "Todos os pedidos",
    sidebarAdminInvoices: "Todas as faturas",
    sidebarAdminAnalytics: "Análises",

    roleClientLabel: "cliente",
    rolePartnerLabel: "parceiro",
    roleAdminLabel: "admin",

    loggingOut: "A terminar sessão...",
    loading: "A carregar...",
    dashboardTitle: "Painel",
    dashboardWelcome: "Bem-vindo(a) à sua área de cliente",
    btnInvoices: "Faturas",
    btnNewRequest: "Novo pedido",

    statOpenRequests: "Pedidos em aberto",
    statValidatedTransports: "Transportes validados",
    statTotalRevenue: "Receita total",
    statAllRequests: "Todos os meus pedidos",

    tabOverview: "Resumo",
    tabRequests: "Os meus pedidos",
    tabInvoices: "As minhas faturas",

    sectionMyTransports: "Os meus transportes",
    sectionMyTransportsDesc: "Acompanhe os seus transportes recentes",
    sectionStats: "Estatísticas",

    statusPending: "Pendente",
    statusValidated: "Validado",
    statusApproved: "Aprovado",
    statusInProgress: "Em curso",
    statusCompleted: "Concluído",
    profilePersonalInfo: "Informações pessoais",
    profileSecurity: "Segurança",
    labelCityZip: "Cidade / Código postal",
    labelVatNumber: "Número de IVA",

    securityChangeCredentials: "Alterar email / palavra-passe",
    securityConfirmEmailPrompt: "Confirme o seu email",
    securityCurrentPasswordPrompt: "Palavra-passe atual",
    securityNewPasswordPrompt: "Nova palavra-passe",
    securityUpdateSuccess: "Atualização bem-sucedida",
    securityUpdateErrorPrefix: "Erro:",

    saveChanges: "Guardar alterações",
    savingChanges: "A guardar...",
    newRequestTitle: "Novo pedido",

    pickupAddressLabel: "Morada de recolha",
    destinationAddressLabel: "Morada de destino",
    packageTypeLabel: "Tipo de volumes",
    heightCm: "Altura (cm)",
    widthCm: "Largura (cm)",
    depthCm: "Profundidade (cm)",
    weightKg: "Peso (kg)",
    pickupDateLabel: "Data de recolha",
    deliveryDateLabel: "Data de entrega",
    attachImageOptional: "Anexar imagem (opcional)",

    addressPlaceholder: "Morada completa",
    packageTypePlaceholder: "ex.: palete, caixa, contentor…",

    btnCalcDistancePrice: "Calcular distância e preço",
    btnCalculating: "A calcular...",
    btnCreateRequest: "Criar pedido",

    summaryTitle: "Resumo",
    summaryDistance: "Distância",
    summaryVolume: "Volume",
    summaryEstimatedPrice: "Preço estimado",

    toastUserNotConnected: "Utilizador não autenticado",
    toastRouteError: "Erro ao calcular o trajeto",
    toastCreatedSuccess: "🎉 O seu pedido foi criado! Pode acompanhá-lo no separador Os meus transportes.",
    toastCreateError: "Erro ao criar o pedido",

    errPickupRequired: "A morada de recolha é obrigatória",
    errDestinationRequired: "A morada de destino é obrigatória",
    errPackageTypeRequired: "O tipo de volume é obrigatório",
    errHeightMin: "A altura deve ser superior a 0",
    errWidthMin: "A largura deve ser superior a 0",
    errDepthMin: "A profundidade deve ser superior a 0",
    errWeightMin: "O peso deve ser superior a 0",
    myTransportsTitle: "Os meus transportes",
    newTransportBtn: "Novo transporte",

    emptyTitle: "Sem transportes",
    emptyDesc: "Ainda não tem pedidos de transporte.",
    emptyCta: "Criar o meu primeiro pedido",

    transportNumberPrefix: "Transporte #",
    labelDeparture: "Partida",
    labelArrival: "Chegada",
    labelType: "Tipo:",
    labelWeight: "Peso:",
    labelDistance: "Distância:",
    labelPrice: "Preço:",
    createdOn: "Criado em",
    follow: "Acompanhar",
    details: "Detalhes",
    notSpecified: "Não especificado",

    statusQuoted: "Orçamentado",
    statusAccepted: "Aceite",
    statusDelivered: "Entregue",
    statusCancelled: "Cancelado",
    clientRequestsTitle: "Os meus pedidos",
    labelStatus: "Estado:",
    viewDetails: "Ver detalhes",
    toastRequestsLoadError: "Erro ao carregar os pedidos",



  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Record<string, string> };
const TranslationContext = createContext<Ctx | null>(null);

export const TranslationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LANG_STORAGE_KEY) as Lang) || 'fr');

  useEffect(() => localStorage.setItem(LANG_STORAGE_KEY, lang), [lang]);

  const t = useMemo(() => {
  const handler: ProxyHandler<Record<string, string>> = {
    get: (_target, prop: string | symbol) => {
      const key = String(prop);
      return DICT[lang]?.[key] ?? key;
    },
  };
  return new Proxy({} as Record<string, string>, handler);
}, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useI18n must be used within <TranslationProvider>');
  return ctx;
};
