// This is just an example,
// so you can safely delete all default props below
import PrivacyPolicyContent from './pages/privacyPolicy';
import TermsOfUseContent from './pages/termsOfUse';
import DisclaimerContent from './pages/disclaimer';

export default {
  healineTitle: 'Infinite-Opportunities 2',
  failed: 'Action failed',
  success: 'Action was successful',
  selectedLanguage: 'English',
  login: 'Login',
  yes: 'Yes',
  no: 'No',
  ok: 'OK',

  productName: 'Infinite-Installer',

  navigationDrawer: {
    title: 'Navigation',
    items: {
      one: {
        name: 'Products',
      },
    },
  },

  navigationMenu: {
    homeHeader: {
      home: 'Home',
      ourMission: 'Our Mission',
      roadmap: 'Roadmap',
      features: 'Features',
      beta: 'Beta',
      pricing: 'Pricing',
    },
  },

  pages: {
    catalog: {
      title: 'Available Products',
    },
    productCatalog: {
      title: 'ProductCatalog',
      loading: 'Loading products...',
    },
  },
  footerWide: {
    privacyPolicy: {
      title: 'Privacy Policy',
      content: PrivacyPolicyContent.content,
    },
    legalTerms: {
      title: 'Terms of use',
      content: TermsOfUseContent.content,
    },
    disclaimer: {
      title: 'Disclaimer',
      content: DisclaimerContent.content,
    },
    brandName: 'Infinite-Opportunities',
    copyright: '©. All rights reserved',
    contactUs: 'Contact Us',
  },

  buttons: {
    login: 'Login',
    discover: 'Discover',
  },

  heroHeader: {
    slide1: {
      header: 'Infinite-Installer',
      subtitle: {
        line1: 'Install infinity software products',
        line2: '',
      },
    },
    slide2: {
      header: 'Infinite-Clients',
      subtitle: {
        line1: {
          text: 'Reach thousands of clients from :',
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
        Automate
      </strong>
      Your  <br/>
      <strong style="color: var(--q-secondary) !important; -webkit-text-stroke: 1px black; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        Client 
      </strong>
      <strong style="-webkit-text-stroke: 1px black; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        Acquisition
      </strong> 
      Across <br /><br/>
    `,
      content: `<q-icon name="fab fa-facebook-f"></q-icon> Facebook <br />
      <q-icon name="fab fa-instagram"></q-icon> Instagram <br />
      <q-icon name="fab fa-tiktok"></q-icon> TikTok <br/>
      <br/>Effortlessly grow your CRM with advanced automation and auto-messaging tools.
      <br/>Contact up to 8000+ clients per month
      `,
    },
  },

  howItWorks: {
    header: 'How It Works',
    steps: [
      {
        icon: 'account_circle',
        title: '<strong>Get contacts</strong>',
        description: 'Get clients from <br/>Facebook, Instagram, and TikTok ',
      },
      {
        icon: 'settings',
        title: '<strong>Generate custom hook messages</strong>',
        description:
          'By using custom messages, you drastically increase user response.',
      },
      {
        icon: 'trending_up',
        title: '<strong>Automatically contact user</strong>',
        description:
          'Launch your automation on each plateform and interact only with engaged people.',
      },
    ],
  },

  features: {
    header: 'What can you do with our tool?',
    sections: [
      {
        sectionTitle: 'Social Media Integration',
        sectionSubtitle: 'Expand Your Reach Across Platforms',
        background: 'var(--section-odd-background)',
        list: [
          {
            icon: 'fab fa-facebook-f',
            title: '<strong>Facebook</strong>',
            description:
              'Access <strong>Groups</strong>, <strong>Followers</strong>, and <strong>Friends</strong> to grow your CRM.',
          },
          {
            icon: 'fab fa-instagram',
            title: '<strong>Instagram</strong>',
            description:
              'Leverage <strong>Followers</strong>, <strong>Likes</strong>, and <strong>Comments</strong> (coming soon).',
          },
          {
            icon: 'fab fa-tiktok',
            title: '<strong>TikTok</strong>',
            description:
              'Engage with <strong>Followers</strong> and <strong>Likes/Comments</strong> (coming soon).',
          },
        ],
      },
      {
        sectionTitle: 'Automated Messaging',
        sectionSubtitle: 'Personalized Messaging at Scale',
        background: 'var(--section-even-background)',
        list: [
          {
            icon: 'message',
            title: '<strong>Auto-Messaging</strong>',
            description:
              'Send thousands of messages monthly with tailored content for your audience.',
          },
          {
            icon: 'chat',
            title: '<strong>ChatGPT Integration</strong>',
            description:
              'Generate <strong>personalized messages</strong> variations easily for any niche using <strong>AI</strong>.',
          },
          {
            icon: 'library_books',
            title: '<strong>Message Library</strong>',
            description:
              'Save frequently used messages to streamline the messaging process.',
          },
        ],
      },
    ],
  },

  testimonials: {
    header: 'What Our Customers Say',
    list: [
      {
        image: '/assets/customer1.jpg',
        quote:
          '“This tool has revolutionized the way I manage my clients. Highly recommend!”',
        rating: 5,
        name: 'John Doe',
        title: 'Entrepreneur',
      },
      {
        image: '/assets/customer2.jpg',
        quote:
          '“I was skeptical at first, but now it’s an essential part of my workflow!”',
        rating: 4,
        name: 'Jane Smith',
        title: 'Marketing Specialist',
      },
      {
        image: '/assets/customer3.jpg',
        quote:
          '“The automation features are a game changer. My CRM has never looked better.”',
        rating: 5,
        name: 'Alex Johnson',
        title: 'Freelancer',
      },
    ],
  },
  pricing: {
    title: 'Pricing',
    cards: {
      card1: {
        title: 'Lifetime Access',
        items: [
          {
            category: 'Automation',
            subcategories: [
              {
                title: 'Get clients from',
                features: [
                  {
                    platform: 'Facebook',
                    details: [
                      'Groups (up to 10k+ per group)',
                      'Famous user followers (no known limit)',
                      'Famous user friends (no known limit)',
                    ],
                  },
                  {
                    platform: 'Instagram',
                    details: ['Famous account: get followers (no known limit)'],
                  },
                  {
                    platform: 'TikTok',
                    details: ['Famous account: get followers (no known limit)'],
                  },
                ],
              },
              {
                title: 'Sending messages',
                features: [
                  {
                    platform: 'Facebook',
                    details: ['Between 100 and 200 per day: 6000 per month'],
                  },
                  {
                    platform: 'Instagram',
                    details: ['Between 80 and 100 per day: 3000 per month'],
                  },
                  {
                    platform: 'TikTok',
                    details: ['Under testing'],
                  },
                ],
              },
            ],
          },
          {
            category: 'Lifetime Access',
            subcategories: [
              {
                title: 'Fixed price',
                features: {
                  details: ['Public price will increase as features are added'],
                },
              },
              {
                title: 'Free updates',
                features: {
                  details: ['All updates included for free'],
                },
              },
            ],
          },
          {
            category: 'CRM',
            subcategories: [
              {
                title: 'Your CRM',
                features: [{ details: ['You own your CRM completely'] }],
              },
              {
                title: 'Upcoming Integrations',
                features: [
                  { details: ['Monday integration (coming really soon)'] },
                  { details: ['Hubspot integration (coming really soon)'] },
                ],
              },
            ],
          },
        ],
        price: '100€',
        reductionPrice: '30€',
        recurring: 'per month',
      },
    },
    buyButton: 'Get Instant Access',
  },

  registerBeta: {
    header: `Interested in getting \ninvestment opportunities ?`,
    subHeader: 'Become a beta user for free',
    callToAction: 'Count me in !',
    formLabels: {
      title: 'Beta Registration Form',
      haveTraded: 'Have you already traded in the past?',
      featureInterests: 'What features interest you the most?',
      knowledgeLevel:
        'What is your estimated knowledge level in the trading field?',
      investedAmount: 'How much money did you invest?',
      gainedAmount: 'How much money did you gain?',
      lostAmount: 'How much money did you lose?',
      interestedIn: 'What are you interested in?',
      shortTermTrading: 'Short term trading',
      midTermTrading: 'Mid term trading',
      longTermTrading: 'Long term trading',
      featureInterestsLabel: 'What features interest you the most?',
      backtesting: 'Backtesting strategy',
      realTimeNotifications: 'Real-time notifications',
      multipleIndicators: 'Multiple indicators usage',
      usedTools:
        'Are you already using trading tools? If so, can you list them?',
      additionalFeatures:
        'Is there any feature that you would like to see in our tools? Features that you estimate have high value for you?',
      startingAmount: 'How much money would you like to start with?',
      targetEarnings: 'How much money would you like to make, realistically?',
      riskLevel: 'What is the level of risk you are ready to take?',
      giveFeedback:
        'Are you ready to give regular feedback to the core team to help develop the app?',
      allowAnonymousData:
        'Are you okay to send anonymous usage data so we can see how you behave on the app and improve user experience?',

      submit: 'Submit',
    },
  },
  loginPage: {
    title: 'Opportunities',
    loginWithGoogle: 'Login with Google',
    loginWithGithub: 'Login with Github',
  },
  userPage: {
    general: {
      title: 'General Informations',
      email: 'Email Address',
      fullname: 'Full Name',
      role: 'Role',
    },
    subscription: {
      title: 'Subscription Informations',
      status: 'Subscription Status',
      cancelBtn: 'Cancel Subscription',
      cancelConfirmation: 'Confirm Subscription Cancellation',
      cancelText: 'Are you sure you want to cancel your subscription?',
      not: 'No subscription',
    },
  },
  subscriptionSuccessPage: {
    title: 'Subscription Success!',
    text: 'Your subscription is valid. Redirecting to main page in 3 seconds...',
  },
};
