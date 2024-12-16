import PrivacyPolicyContent from './pages/privacyPolicy';
import TermsOfUseContent from './pages/termsOfUse';
import DisclaimerContent from './pages/disclaimer';

export default {
  healineTitle: 'Infinite-Opportunities 2',
  failed: "Échec de l'action",
  success: 'Action réussie',
  selectedLanguage: 'Français',
  login: 'Se connecter',
  yes: 'Oui',
  no: 'Non',
  ok: 'OK',

  productName: 'Infinite-Installer',

  navigationDrawer: {
    title: 'Navigation',
    items: {
      one: {
        name: 'Produits',
      },
    },
  },

  navigationMenu: {
    homeHeader: {
      home: 'Accueil',
      ourMission: 'Notre Mission',
      roadmap: 'Feuille de route',
      features: 'Caractéristiques',
      beta: 'Bêta',
      pricing: 'Tarification',
    },
  },

  pages: {
    catalog: {
      title: 'Produits Disponibles',
    },
    productCatalog: {
      title: 'Catalogue de Produits',
      loading: 'Chargement des produits...',
    },
  },
  footerWide: {
    privacyPolicy: {
      title: 'Politique de confidentialité',
      content: PrivacyPolicyContent.content,
    },
    legalTerms: {
      title: "Conditions d'utilisation",
      content: TermsOfUseContent.content,
    },
    disclaimer: {
      title: 'Avertissement',
      content: DisclaimerContent.content,
    },
    brandName: 'Infinite-Solutions',
    copyright: '©. Tous droits réservés',
    contactUs: 'Contactez-nous',
  },

  buttons: {
    login: 'Se connecter',
    discover: 'Découvrir',
  },

  heroHeader: {
    slide1: {
      header: 'Infinite-Installer',
      subtitle: {
        line1: 'Installez des produits logiciels infinis',
        line2: '',
      },
    },
    slide2: {
      header: 'Infinite-Clients',
      subtitle: {
        line1: {
          text: 'Atteignez des milliers de clients depuis :',
          align: 'center',
        },
        line2: 'Facebook',
        line3: 'Instagram',
        line4: 'TikTok',
      },
    },
  },

  ourMission: {
    slide1: {
      header: `
      <strong style="color: var(--gold-up1) !important; -webkit-text-stroke: 1px black; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        Automatisez
      </strong>
      Votre <br/>
      <strong style="color: var(--q-secondary) !important; -webkit-text-stroke: 1px black; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        Acquisition 
      </strong>
      <strong style="-webkit-text-stroke: 1px black; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        Client
      </strong> 
      Sur <br /><br/>
    `,
      content: `<q-icon name="fab fa-facebook-f"></q-icon> Facebook <br />
      <q-icon name="fab fa-instagram"></q-icon> Instagram <br />
      <q-icon name="fab fa-tiktok"></q-icon> TikTok <br/>
      <br/>Développez facilement votre CRM avec des outils d'automatisation et de messagerie automatique.
      <br/>Contactez jusqu'à 8000+ clients par mois
      `,
    },
  },

  howItWorks: {
    header: 'Comment ça fonctionne',
    steps: [
      {
        icon: 'account_circle',
        title: '<strong>Obtenez des contacts</strong>',
        description:
          'Obtenez des clients depuis <br/>Facebook, Instagram et TikTok',
      },
      {
        icon: 'settings',
        title: "<strong>Générez des messages d'accroche personnalisés</strong>",
        description:
          'En utilisant des messages personnalisés, vous augmentez considérablement la réponse des utilisateurs.',
      },
      {
        icon: 'trending_up',
        title: "<strong>Contactez automatiquement l'utilisateur</strong>",
        description:
          'Lancez votre automatisation sur chaque plateforme et interagissez uniquement avec les personnes engagées.',
      },
    ],
  },

  features: {
    header: 'Que pouvez-vous faire avec notre outil ?',
    sections: [
      {
        sectionTitle: 'Intégration des Médias Sociaux',
        sectionSubtitle: 'Étendez votre portée sur différentes plateformes',
        background: 'var(--section-odd-background)',
        list: [
          {
            icon: 'fab fa-facebook-f',
            title: '<strong>Facebook</strong>',
            description:
              'Accédez aux <strong>Groupes</strong>, <strong>Abonnés</strong> et <strong>Amis</strong> pour développer votre CRM.',
          },
          {
            icon: 'fab fa-instagram',
            title: '<strong>Instagram</strong>',
            description:
              "Exploitez les <strong>Abonnés</strong>, <strong>J'aime</strong> et <strong>Commentaires</strong> (bientôt disponible).",
          },
          {
            icon: 'fab fa-tiktok',
            title: '<strong>TikTok</strong>',
            description:
              "Interagissez avec les <strong>Abonnés</strong> et les <strong>J'aime/Commentaires</strong> (bientôt disponible).",
          },
        ],
      },
      {
        sectionTitle: 'Messagerie Automatisée',
        sectionSubtitle: 'Messagerie personnalisée à grande échelle',
        background: 'var(--section-even-background)',
        list: [
          {
            icon: 'message',
            title: '<strong>Messagerie automatique</strong>',
            description:
              'Envoyez des milliers de messages mensuellement avec un contenu adapté à votre audience.',
          },
          {
            icon: 'chat',
            title: '<strong>Intégration ChatGPT</strong>',
            description:
              "Générez facilement des <strong>variantes de messages personnalisés</strong> pour n'importe quel créneau grâce à l'<strong>IA</strong>.",
          },
          {
            icon: 'library_books',
            title: '<strong>Bibliothèque de messages</strong>',
            description:
              'Sauvegardez les messages fréquemment utilisés pour faciliter le processus de messagerie.',
          },
        ],
      },
    ],
  },

  testimonials: {
    header: 'Ce que nos clients disent',
    list: [
      {
        image: '/assets/customer1.jpg',
        quote:
          '“Cet outil a révolutionné la gestion de mes clients. Je le recommande vivement !”',
        rating: 5,
        name: 'John Doe',
        title: 'Entrepreneur',
      },
      {
        image: '/assets/customer2.jpg',
        quote:
          "“J'étais sceptique au début, mais maintenant c'est une partie essentielle de mon flux de travail !”",
        rating: 4,
        name: 'Jane Smith',
        title: 'Spécialiste en marketing',
      },
      {
        image: '/assets/customer3.jpg',
        quote:
          "“Les fonctionnalités d'automatisation sont un vrai changement. Mon CRM n'a jamais été aussi bien.”",
        rating: 5,
        name: 'Alex Johnson',
        title: 'Freelance',
      },
    ],
  },
  pricing: {
    title: 'Tarification',
    cards: {
      card1: {
        title: 'Accès à vie',
        items: [
          {
            category: 'Automatisation',
            subcategories: [
              {
                title: 'Obtenez des clients depuis',
                features: [
                  {
                    platform: 'Facebook',
                    details: [
                      "Groupes (jusqu'à 10k+ par groupe)",
                      "Abonnés d'utilisateurs célèbres (pas de limite connue)",
                      "Amis d'utilisateurs célèbres (pas de limite connue)",
                    ],
                  },
                  {
                    platform: 'Instagram',
                    details: [
                      'Compte célèbre : obtenez des abonnés (pas de limite connue)',
                    ],
                  },
                  {
                    platform: 'TikTok',
                    details: [
                      'Compte célèbre : obtenez des abonnés (pas de limite connue)',
                    ],
                  },
                ],
              },
              {
                title: 'Envoi de messages',
                features: [
                  {
                    platform: 'Facebook',
                    details: ['Entre 100 et 200 par jour : 6000 par mois'],
                  },
                  {
                    platform: 'Instagram',
                    details: ['Entre 80 et 100 par jour : 3000 par mois'],
                  },
                  {
                    platform: 'TikTok',
                    details: ['Sous test'],
                  },
                ],
              },
            ],
          },
          {
            category: 'Accès à vie',
            subcategories: [
              {
                title: 'Prix fixe',
                features: {
                  details: [
                    'Le prix public augmentera à mesure que de nouvelles fonctionnalités sont ajoutées',
                  ],
                },
              },
              {
                title: 'Mises à jour gratuites',
                features: {
                  details: ['Toutes les mises à jour incluses gratuitement'],
                },
              },
            ],
          },
          {
            category: 'CRM',
            subcategories: [
              {
                title: 'Votre CRM',
                features: [
                  { details: ['Vous possédez entièrement votre CRM'] },
                ],
              },
              {
                title: 'Intégrations à venir',
                features: [
                  { details: ['Intégration de Monday (bientôt disponible)'] },
                  { details: ['Intégration de Hubspot (bientôt disponible)'] },
                ],
              },
            ],
          },
        ],
        price: '100€',
        reductionPrice: '30€',
        recurring: 'par mois',
      },
    },
    buyButton: 'Accéder instantanément',
  },

  registerBeta: {
    header: `Intéressé par des opportunités d\'investissement ?`,
    subHeader: 'Devenez un utilisateur bêta gratuitement',
    callToAction: 'Compte-moi dedans !',
    formLabels: {
      title: "Formulaire d'inscription bêta",
      haveTraded: 'Avez-vous déjà échangé dans le passé ?',
      featureInterests: 'Quelles fonctionnalités vous intéressent le plus ?',
      knowledgeLevel:
        'Quel est votre niveau de connaissance dans le domaine du trading ?',
      investedAmount: 'Combien avez-vous investi ?',
      gainedAmount: 'Combien avez-vous gagné ?',
      lostAmount: 'Combien avez-vous perdu ?',
      interestedIn: "Qu'est-ce qui vous intéresse ?",
      shortTermTrading: 'Trading à court terme',
      midTermTrading: 'Trading à moyen terme',
      longTermTrading: 'Trading à long terme',
      featureInterestsLabel:
        'Quelles fonctionnalités vous intéressent le plus ?',
      backtesting: 'Stratégie de backtesting',
      realTimeNotifications: 'Notifications en temps réel',
      multipleIndicators: 'Utilisation de plusieurs indicateurs',
      usedTools:
        'Utilisez-vous déjà des outils de trading ? Si oui, pouvez-vous les lister ?',
      additionalFeatures:
        'Y a-t-il des fonctionnalités que vous aimeriez voir dans nos outils ? Des fonctionnalités que vous estimez avoir une grande valeur pour vous ?',
      startingAmount: "Combien d'argent aimeriez-vous commencer à investir ?",
      targetEarnings:
        "Combien d'argent aimeriez-vous gagner, de manière réaliste ?",
      riskLevel: 'Quel est le niveau de risque que vous êtes prêt à prendre ?',
      giveFeedback:
        "Êtes-vous prêt à donner des retours réguliers à l'équipe principale pour aider au développement de l'application ?",
      allowAnonymousData:
        "Acceptez-vous d'envoyer des données d'utilisation anonymes afin que nous puissions voir comment vous vous comportez sur l'application et améliorer l'expérience utilisateur ?",

      submit: 'Soumettre',
    },
  },
  loginPage: {
    title: 'Opportunités',
    loginWithGoogle: 'Se connecter avec Google',
    loginWithGithub: 'Se connecter avec Github',
  },
  userPage: {
    general: {
      title: 'Informations générales',
      email: 'Adresse e-mail',
      fullname: 'Nom complet',
      role: 'Rôle',
    },
    subscription: {
      title: "Informations sur l'abonnement",
      status: "Statut de l'abonnement",
      cancelBtn: "Annuler l'abonnement",
      cancelConfirmation: "Confirmer l'annulation de l'abonnement",
      cancelText: 'Êtes-vous sûr de vouloir annuler votre abonnement ?',
      not: "Pas d'abonnement",
    },
  },
  subscriptionSuccessPage: {
    title: 'Abonnement réussi !',
    text: 'Votre abonnement est valide. Redirection vers la page principale dans 3 secondes...',
  },
};
