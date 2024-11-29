// This is just an example,
// so you can safely delete all default props below
import PrivacyPolicyContent from './pages/privacyPolicy';
import TermsOfUseContent from './pages/termsOfUse';
import DisclaimerContent from './pages/disclaimer';

export default {
  healineTitle: 'Infinite-Opportunities',
  failed: 'Action failed',
  success: 'Action was successful',
  selectedLanguage: 'English',
  login: 'Login',
  yes: 'Yes',
  no: 'No',
  ok: 'OK',

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
    login: 'Login FR',
    discover: 'Discover',
  },

  heroHeader: {
    slide1: {
      header: 'Infinite-Opportunities FR',
      subtitle: {
        line1: 'FRFR Tired of missing out opportunities ?',
        line2: 'We bring you thousands of opportunities everyday',
      },
    },
    slide2: {
      header: 'FR Infinite-Opportunities',
      subtitle: {
        line1: 'For both non-professional and professional traders',
      },
    },
  },

  ourMission: {
    header: 'Our Mission',
    content:
      'To give you tools and data to make money with low investment, without spending hours staring at charts.',
  },

  howItWorks: {
    header: 'How do we do that ?',
    // subHeader: 'How do we do that ?',
    card1: {
      title: 'Market analysis',
      text: 'We constantly analyze more than 300 cryptocurrencies',
    },
    card2: {
      title: 'Strategy analysis',
      text: `We use multiple indicators to define most profitable and safest strategies. \n
      Then we test them to get the best possible strategies`,
    },
    card3: {
      title: 'AI and Machine Learning',
      text: `We use AI to :  \n
            - test thousands of strategies and define new ones`,
      // text: 'This is a string\\nthat spans multiple\\nlines.',
    },
  },
  features: {
    header: 'What can you do with our tool ?',
    // subHeader: 'How do we do that ?',
    card1: {
      title: 'Highly customizable notifications',
      text: 'Set the notifications you want ',
    },
    card2: {
      title: 'Real-Time notification',
      text: 'Get instantly notified when opportunities comes in',
    },
    card3: {
      title: 'Mobile application',
      text: 'Either use a webbrowser or mobile app to get notifications everywhere',
    },
    card4: {
      title: 'Backtest your strategy',
      text: `Use customizable, predifined strategies and backtest them on more than 300 crypto pairs, \n
      to see if they are profitable and adjust if not.`,
    },
  },
  roadmap: {
    title: 'Roadmap',
  },
  pricing: {
    title: 'Pricing',
    cards: {
      card1: {
        title: 'Basic',
        items: [
          { title: 'Unlimited notifications', icon: 'notifications' },
          { title: 'Backtesting Strategy', icon: 'mdi-bullseye-arrow' },
          { title: 'Lifetime access', icon: 'mdi-check' },
        ],
        price: '10$',
        recurring: 'month',
      },
    },
    buyButton: 'Buy Now',
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
  liveBot: {
    buttons: {
      start: 'Start Bot',
      stop: 'Stop Bot',
    },
  },
  defaultChart: {
    buttons: {
      boillingerBands: 'Bollinger Bands',
      RSI: 'RSI',
      SMA: 'SMA',
      EMA: 'EMA',
      MACD: 'MACD',
      volumes: 'Toggle Volumes',
      support: 'Support',
      resistance: 'Resistance',
      rsiSignals: 'RSI Signals',
    },
  },
  backtesting: {
    strategySelector: {
      setupTitle: 'Setup',
      riskManagementTitle: 'Risk Manangement',
      selectStrategyLabel: 'Select Strategy',
      selectPairLabel: 'Select Pair',
      selectTimeframeLabel: 'Select Timeframe',
    },
    buttons: {
      runBacktest: { label: 'Run Backtest', tooltip: 'Start here' },
      reset: 'Reset',
      backward: 'Backward',
      forward: 'Forward',
      pause: 'Pause',
    },
    timePickers: {
      startTime: 'Start time',
      endTime: 'End Time',
    },
    positionsDiv: {
      positionsTitle: 'Positions',
      totalPnL: 'Total P&L',
      open: 'Open',
      closed: 'Closed',
    },
    loaders: {
      backtestLoader: {
        title: 'Starting Backtest',
      },
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
