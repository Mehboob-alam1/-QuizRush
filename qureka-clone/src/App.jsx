import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

const blankQuizState = {
  status: 'idle',
  questionIndex: 0,
  score: 0,
  streak: 0,
  answers: [],
  remainingTime: 0,
  isAwaitingNext: false,
  finalSummary: null,
  earnedCoins: 0,
  correctCount: 0,
  rewardsApplied: false,
}

const quizLibrary = [
  {
    id: 'global-markets-pro',
    title: 'Global Markets Pro',
    category: 'Global Markets',
    difficulty: 'Medium',
    timePerQuestion: 15,
    rewardCoins: 220,
    questions: [
      {
        id: 'gm-1',
        prompt:
          "Which equity index tracks 500 large-cap U.S. companies and is weighted by each firm's market capitalization?",
        options: [
          { id: 'a', label: 'S&P 500', correct: true },
          { id: 'b', label: 'Dow Jones Industrial Average' },
          { id: 'c', label: 'Russell 2000' },
          { id: 'd', label: 'NASDAQ Composite' },
        ],
        explanation:
          'The S&P 500 is a market-cap-weighted index of 500 leading publicly traded U.S. companies.',
      },
      {
        id: 'gm-2',
        prompt: 'An inverted Treasury yield curve typically signals what market expectation?',
        options: [
          { id: 'a', label: 'Potential economic recession', correct: true },
          { id: 'b', label: 'Accelerating commodity demand' },
          { id: 'c', label: 'Immediate central bank tightening' },
          { id: 'd', label: 'Sustained inflationary boom' },
        ],
        explanation:
          'When short-term yields rise above long-term yields, investors often price in future economic slowdown.',
      },
      {
        id: 'gm-3',
        prompt:
          'Which structure lets authorized participants create and redeem ETF shares throughout the trading day?',
        options: [
          { id: 'a', label: 'Open-ended ETF', correct: true },
          { id: 'b', label: 'Closed-end fund' },
          { id: 'c', label: 'Unit investment trust' },
          { id: 'd', label: 'Mutual fund share class' },
        ],
        explanation:
          'Open-ended ETFs permit in-kind creation/redemption by authorized participants, keeping prices near NAV.',
      },
      {
        id: 'gm-4',
        prompt: "Which commodity is nicknamed “Dr. Copper” for its ability to diagnose global growth trends?",
        options: [
          { id: 'a', label: 'Copper', correct: true },
          { id: 'b', label: 'Crude oil' },
          { id: 'c', label: 'Lithium' },
          { id: 'd', label: 'Gold' },
        ],
        explanation:
          'Copper demand is tightly linked to construction and manufacturing, making its price a growth barometer.',
      },
      {
        id: 'gm-5',
        prompt: "Beta in modern portfolio theory measures an asset's…",
        options: [
          { id: 'a', label: 'Sensitivity to movements in a benchmark index', correct: true },
          { id: 'b', label: 'Absolute volatility relative to cash' },
          { id: 'c', label: 'Trailing dividend yield growth' },
          { id: 'd', label: 'Book value divided by market value' },
        ],
        explanation:
          'Beta captures systematic risk by comparing an asset’s returns to those of the overall market benchmark.',
      },
      {
        id: 'gm-6',
        prompt: 'Which currency pair is consistently the most traded in the global FX market?',
        options: [
          { id: 'a', label: 'EUR/USD', correct: true },
          { id: 'b', label: 'USD/JPY' },
          { id: 'c', label: 'GBP/USD' },
          { id: 'd', label: 'USD/CNY' },
        ],
        explanation:
          'The euro and U.S. dollar dominate global FX volumes, making EUR/USD the deepest and most liquid pair.',
      },
    ],
  },
  {
    id: 'personal-finance-playbook',
    title: 'Personal Finance Playbook',
    category: 'Personal Finance',
    difficulty: 'Easy',
    timePerQuestion: 14,
    rewardCoins: 180,
    questions: [
      {
        id: 'pf-1',
        prompt: "In the 50/30/20 budgeting rule, what does the '50' represent?",
        options: [
          { id: 'a', label: 'Needs and essential expenses', correct: true },
          { id: 'b', label: 'Discretionary spending' },
          { id: 'c', label: 'Debt repayment' },
          { id: 'd', label: 'Emergency savings' },
        ],
        explanation: 'The framework allocates 50% to needs, 30% to wants, and 20% to savings or debt reduction.',
      },
      {
        id: 'pf-2',
        prompt:
          'Which retirement account in the U.S. offers tax-free withdrawals because contributions are made with after-tax dollars?',
        options: [
          { id: 'a', label: 'Traditional IRA' },
          { id: 'b', label: '401(k)' },
          { id: 'c', label: 'Roth IRA', correct: true },
          { id: 'd', label: 'SEP IRA' },
        ],
        explanation:
          'Roth IRA contributions are made with post-tax dollars, and qualified withdrawals are tax-free in retirement.',
      },
      {
        id: 'pf-3',
        prompt: 'Maintaining a credit utilization ratio below which threshold is generally viewed as healthy?',
        options: [
          { id: 'a', label: '10%' },
          { id: 'b', label: '30%', correct: true },
          { id: 'c', label: '55%' },
          { id: 'd', label: '70%' },
        ],
        explanation:
          'Most credit scoring models reward utilization below roughly 30%, signaling prudent revolving credit use.',
      },
      {
        id: 'pf-4',
        prompt: 'Which insurance product protects your income if you cannot work due to illness or injury?',
        options: [
          { id: 'a', label: 'Disability income insurance', correct: true },
          { id: 'b', label: 'Long-term care insurance' },
          { id: 'c', label: 'Whole life insurance' },
          { id: 'd', label: 'Umbrella liability insurance' },
        ],
        explanation:
          'Disability insurance replaces a portion of income when a medical condition limits your ability to work.',
      },
      {
        id: 'pf-5',
        prompt: 'A well-funded emergency savings account should ideally cover…',
        options: [
          { id: 'a', label: 'One month of discretionary spending' },
          { id: 'b', label: 'Upcoming vacation costs' },
          { id: 'c', label: '3–6 months of essential expenses', correct: true },
          { id: 'd', label: 'Outstanding student loans' },
        ],
        explanation:
          'Most planners recommend 3–6 months of mandatory living costs to buffer against job loss or emergencies.',
      },
      {
        id: 'pf-6',
        prompt: 'Which debt repayment strategy prioritizes paying off the smallest balance first to build momentum?',
        options: [
          { id: 'a', label: 'Debt avalanche' },
          { id: 'b', label: 'Debt snowball', correct: true },
          { id: 'c', label: 'Ladder strategy' },
          { id: 'd', label: 'Refinance roll-down' },
        ],
        explanation:
          'The snowball method targets the smallest balance first, creating psychological wins before tackling larger debts.',
      },
    ],
  },
  {
    id: 'fintech-frontier',
    title: 'FinTech Frontier',
    category: 'FinTech & Crypto',
    difficulty: 'Hard',
    timePerQuestion: 14,
    rewardCoins: 230,
    questions: [
      {
        id: 'ft-1',
        prompt: 'The Lightning Network is a layer-2 scaling solution built on top of which blockchain?',
        options: [
          { id: 'a', label: 'Ethereum' },
          { id: 'b', label: 'Solana' },
          { id: 'c', label: 'Bitcoin', correct: true },
          { id: 'd', label: 'Cardano' },
        ],
        explanation:
          'Lightning channels allow Bitcoin transactions to settle off-chain with high throughput and low fees.',
      },
      {
        id: 'ft-2',
        prompt: 'In the European Union, PSD2 primarily enables…',
        options: [
          { id: 'a', label: 'Tax harmonization across member states' },
          { id: 'b', label: 'Secure open-banking access for licensed third parties', correct: true },
          { id: 'c', label: 'Creation of central bank digital currencies' },
          { id: 'd', label: 'Capital relief for fintech lenders' },
        ],
        explanation:
          'PSD2 mandates banks to provide regulated third parties with API access, fostering open banking innovation.',
      },
      {
        id: 'ft-3',
        prompt: 'In crypto networks, “staking” typically refers to…',
        options: [
          { id: 'a', label: 'Locking tokens to support consensus and earn rewards', correct: true },
          { id: 'b', label: 'Using leverage to amplify returns' },
          { id: 'c', label: 'Issuing collateralized stablecoins' },
          { id: 'd', label: 'Tokenizing real-world assets' },
        ],
        explanation:
          'Proof-of-stake validators stake tokens to secure the network and receive newly minted or fee-based rewards.',
      },
      {
        id: 'ft-4',
        prompt: 'Which component executes Solidity smart contracts on Ethereum?',
        options: [
          { id: 'a', label: 'Merkle Patricia Trie' },
          { id: 'b', label: 'Ethereum Virtual Machine (EVM)', correct: true },
          { id: 'c', label: 'Zero-knowledge circuit' },
          { id: 'd', label: 'BLS aggregation layer' },
        ],
        explanation:
          'The EVM is the runtime environment for smart contracts, interpreting and executing Solidity bytecode.',
      },
      {
        id: 'ft-5',
        prompt: 'Know Your Customer (KYC) controls exist primarily to…',
        options: [
          { id: 'a', label: 'Optimize payment routing costs' },
          { id: 'b', label: 'Verify client identities and mitigate financial crime', correct: true },
          { id: 'c', label: 'Reduce interchange fees for merchants' },
          { id: 'd', label: 'Increase on-chain transaction throughput' },
        ],
        explanation:
          'KYC processes gather and validate customer information to combat money laundering and fraud.',
      },
      {
        id: 'ft-6',
        prompt: 'Stablecoins such as USDC maintain price stability by…',
        options: [
          { id: 'a', label: 'Floating freely against supply and demand' },
          { id: 'b', label: 'Pegging to a reserve of fiat-denominated assets', correct: true },
          { id: 'c', label: 'Eliminating transaction fees altogether' },
          { id: 'd', label: 'Mining new coins when demand rises' },
        ],
        explanation:
          'Asset-backed stablecoins hold reserves (cash or short-term securities) to mirror a fiat currency’s value.',
      },
    ],
  },
  {
    id: 'corporate-finance-clinic',
    title: 'Corporate Finance Clinic',
    category: 'Corporate Finance',
    difficulty: 'Medium',
    timePerQuestion: 14,
    rewardCoins: 210,
    questions: [
      {
        id: 'cf-1',
        prompt: 'Weighted average cost of capital (WACC) represents…',
        options: [
          { id: 'a', label: 'The net profit margin after taxes' },
          { id: 'b', label: 'Blended cost of equity and debt based on capital structure', correct: true },
          { id: 'c', label: 'Return on assets excluding leverage' },
          { id: 'd', label: 'Short-term funding cost only' },
        ],
        explanation:
          'WACC combines the cost of equity and after-tax cost of debt, weighted by their proportions in the capital stack.',
      },
      {
        id: 'cf-2',
        prompt: 'A project’s net present value (NPV) is positive when…',
        options: [
          { id: 'a', label: 'Payback period occurs before year three' },
          { id: 'b', label: 'Internal rate of return equals the discount rate' },
          { id: 'c', label: 'Present value of inflows exceeds present value of outflows', correct: true },
          { id: 'd', label: 'Operating margin improves year over year' },
        ],
        explanation:
          'NPV > 0 indicates the project adds value by generating discounted cash inflows above discounted costs.',
      },
      {
        id: 'cf-3',
        prompt: 'EBITDA stands for…',
        options: [
          { id: 'a', label: 'Earnings Before Interest, Taxes, Depreciation, and Amortization', correct: true },
          { id: 'b', label: 'Equity Before Interest, Taxes, Depreciation, and Assets' },
          { id: 'c', label: 'Earnings Before Income, Treasury, Dividends, and Assets' },
          { id: 'd', label: 'Earnings Before Interest Tax Deduction Accounting' },
        ],
        explanation:
          'EBITDA strips out financing and non-cash charges to gauge operating performance across firms.',
      },
      {
        id: 'cf-4',
        prompt: 'Which ratio assesses a company’s ability to pay interest from operating profit?',
        options: [
          { id: 'a', label: 'Current ratio' },
          { id: 'b', label: 'Interest coverage ratio', correct: true },
          { id: 'c', label: 'Asset turnover' },
          { id: 'd', label: 'Debt-to-equity ratio' },
        ],
        explanation:
          'Interest coverage (EBIT ÷ interest expense) shows how comfortably a firm covers borrowing costs.',
      },
      {
        id: 'cf-5',
        prompt: 'Which financing action typically dilutes existing shareholders?',
        options: [
          { id: 'a', label: 'Issuing new common equity', correct: true },
          { id: 'b', label: 'Repurchasing shares' },
          { id: 'c', label: 'Negotiating a revolving credit facility' },
          { id: 'd', label: 'Refinancing senior debt' },
        ],
        explanation:
          'Selling new shares increases the share count, reducing each existing holder’s proportional ownership.',
      },
      {
        id: 'cf-6',
        prompt: 'Leveraged buyouts typically rely on…',
        options: [
          { id: 'a', label: 'Issuing preferred stock' },
          { id: 'b', label: 'Significant debt secured by the target’s assets', correct: true },
          { id: 'c', label: 'Venture capital seed funding' },
          { id: 'd', label: 'Crowdfunding from retail investors' },
        ],
        explanation:
          'LBOs use high leverage, with the acquired company’s cash flows servicing the acquisition debt.',
      },
    ],
  },
  {
    id: 'economic-trends-today',
    title: 'Economic Trends Today',
    category: 'Economic Trends',
    difficulty: 'Medium',
    timePerQuestion: 15,
    rewardCoins: 200,
    questions: [
      {
        id: 'et-1',
        prompt: 'The Consumer Price Index (CPI) measures…',
        options: [
          { id: 'a', label: 'Changes in stock market valuations' },
          { id: 'b', label: 'Average price changes in a basket of goods and services', correct: true },
          { id: 'c', label: 'Government spending growth rates' },
          { id: 'd', label: 'Interest rate expectations' },
        ],
        explanation:
          'CPI tracks the weighted average price of a basket of consumer goods and services over time.',
      },
      {
        id: 'et-2',
        prompt: 'A Purchasing Managers’ Index (PMI) reading above 50 indicates…',
        options: [
          { id: 'a', label: 'Contraction in manufacturing activity' },
          { id: 'b', label: 'Expansion in the surveyed sector', correct: true },
          { id: 'c', label: 'Deflationary pressure' },
          { id: 'd', label: 'Labor market stagnation' },
        ],
        explanation:
          'PMI > 50 signals growth, while PMI < 50 signals contraction; it is a key leading economic indicator.',
      },
      {
        id: 'et-3',
        prompt: 'Which organization publishes the World Economic Outlook twice a year?',
        options: [
          { id: 'a', label: 'World Bank' },
          { id: 'b', label: 'International Monetary Fund (IMF)', correct: true },
          { id: 'c', label: 'OECD' },
          { id: 'd', label: 'UNCTAD' },
        ],
        explanation:
          'The IMF’s World Economic Outlook provides global GDP projections, inflation estimates, and policy analysis.',
      },
      {
        id: 'et-4',
        prompt: 'Real GDP differs from nominal GDP because it…',
        options: [
          { id: 'a', label: 'Excludes government spending' },
          { id: 'b', label: 'Adjusts for inflation using constant prices', correct: true },
          { id: 'c', label: 'Ignores exports and imports' },
          { id: 'd', label: 'Is calculated quarterly while nominal is annual' },
        ],
        explanation:
          'Real GDP removes the effect of price changes to reflect actual changes in output volume.',
      },
      {
        id: 'et-5',
        prompt: 'The Phillips curve traditionally depicts the relationship between…',
        options: [
          { id: 'a', label: 'Exchange rates and trade balances' },
          { id: 'b', label: 'Inflation and unemployment', correct: true },
          { id: 'c', label: 'Fiscal deficit and GDP growth' },
          { id: 'd', label: 'Commodity prices and tax revenue' },
        ],
        explanation:
          'The Phillips curve suggests an inverse relationship between inflation and unemployment in the short run.',
      },
      {
        id: 'et-6',
        prompt: 'If a country’s currency appreciates significantly, its exports generally become…',
        options: [
          { id: 'a', label: 'Cheaper for foreign buyers' },
          { id: 'b', label: 'Unaffected because of hedging' },
          { id: 'c', label: 'More expensive for foreign buyers', correct: true },
          { id: 'd', label: 'Immediately subsidized by government' },
        ],
        explanation:
          'A stronger currency makes a nation’s goods more expensive abroad, potentially reducing export demand.',
      },
    ],
  },
  {
    id: 'banking-compliance-lab',
    title: 'Banking Compliance Lab',
    category: 'Banking Compliance',
    difficulty: 'Medium',
    timePerQuestion: 13,
    rewardCoins: 195,
    questions: [
      {
        id: 'bc-1',
        prompt: 'AML in banking regulation stands for…',
        options: [
          { id: 'a', label: 'Advanced Market Liquidity' },
          { id: 'b', label: 'Alternative Mortgage Lending' },
          { id: 'c', label: 'Anti-money laundering', correct: true },
          { id: 'd', label: 'Asset Management Law' },
        ],
        explanation:
          'AML frameworks aim to detect and prevent money laundering, terrorist financing, and illicit financial flows.',
      },
      {
        id: 'bc-2',
        prompt: 'Basel III introduced which capital buffer to absorb losses during periods of stress?',
        options: [
          { id: 'a', label: 'Liquidity preference buffer' },
          { id: 'b', label: 'Capital conservation buffer', correct: true },
          { id: 'c', label: 'Mortgage reserve buffer' },
          { id: 'd', label: 'Off-balance-sheet buffer' },
        ],
        explanation:
          'The capital conservation buffer requires banks to hold common equity above minimum requirements to avoid payout restrictions.',
      },
      {
        id: 'bc-3',
        prompt: 'The Know Your Customer (KYC) process requires financial institutions to…',
        options: [
          { id: 'a', label: 'Forecast customer credit scores quarterly' },
          { id: 'b', label: 'Verify identity and assess customer risk profiles', correct: true },
          { id: 'c', label: 'Guarantee investment returns to clients' },
          { id: 'd', label: 'Disclose proprietary trading strategies' },
        ],
        explanation:
          'KYC steps include customer identification, due diligence, and ongoing monitoring to mitigate illicit activity.',
      },
      {
        id: 'bc-4',
        prompt: 'Which U.S. legislation created the Consumer Financial Protection Bureau (CFPB)?',
        options: [
          { id: 'a', label: 'Sarbanes–Oxley Act' },
          { id: 'b', label: 'Bank Secrecy Act' },
          { id: 'c', label: 'Dodd–Frank Act', correct: true },
          { id: 'd', label: 'Glass–Steagall Act' },
        ],
        explanation:
          'Title X of the Dodd–Frank Wall Street Reform and Consumer Protection Act established the CFPB in 2010.',
      },
      {
        id: 'bc-5',
        prompt: 'Suspicious activity reports (SARs) must be filed when…',
        options: [
          { id: 'a', label: 'Clients request wire transfers' },
          { id: 'b', label: 'Branches exceed weekly sales targets' },
          { id: 'c', label: 'Transactions are suspected to involve illicit funds', correct: true },
          { id: 'd', label: 'Account balances fall below minimum thresholds' },
        ],
        explanation:
          'If a financial institution suspects transactions may involve criminal proceeds, it must file a SAR with regulators.',
      },
      {
        id: 'bc-6',
        prompt: 'Which global standard assigns a unique 12-character alphanumeric code to securities?',
        options: [
          { id: 'a', label: 'LEI' },
          { id: 'b', label: 'CUSIP' },
          { id: 'c', label: 'ISIN', correct: true },
          { id: 'd', label: 'SWIFT' },
        ],
        explanation:
          'The International Securities Identification Number (ISIN) uniquely identifies securities for cross-border settlement.',
      },
    ],
  },
]

const initialUser = {
  name: 'Jordan Ledger',
  avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=256&h=256&q=80',
  coins: 1240,
  streak: 9,
  level: 34,
  xpPercent: 54,
  badges: ['Market Maven', 'Risk Manager', 'FinTech Insider'],
  claimedBonusToday: false,
}

const categories = [
  {
    name: 'Global Markets',
    plays: '2.3M',
    icon: '📈',
    gradient: 'linear-gradient(135deg,#668bff,#325efc)',
    quizId: 'global-markets-pro',
  },
  {
    name: 'Personal Finance',
    plays: '1.9M',
    icon: '💰',
    gradient: 'linear-gradient(135deg,#ff9d6c,#ff6a4b)',
    quizId: 'personal-finance-playbook',
  },
  {
    name: 'FinTech & Crypto',
    plays: '1.4M',
    icon: '🪙',
    gradient: 'linear-gradient(135deg,#44d7c7,#139cb0)',
    quizId: 'fintech-frontier',
  },
  {
    name: 'Corporate Finance',
    plays: '1.1M',
    icon: '🏢',
    gradient: 'linear-gradient(135deg,#ff7de8,#d941ff)',
    quizId: 'corporate-finance-clinic',
  },
  {
    name: 'Economic Trends',
    plays: '1.6M',
    icon: '🌍',
    gradient: 'linear-gradient(135deg,#ffc76f,#ff9f3b)',
    quizId: 'economic-trends-today',
  },
  {
    name: 'Banking Compliance',
    plays: '980K',
    icon: '🏦',
    gradient: 'linear-gradient(135deg,#7b8cff,#5b63ff)',
    quizId: 'banking-compliance-lab',
  },
]

const upcomingShows = [
  {
    id: 'opening-bell',
    title: 'Opening Bell Blitz',
    startsAt: new Date(Date.now() + 1000 * 60 * 42),
    reward: '75K Bullion',
    host: 'Floor with Maya',
    linkedQuizId: 'global-markets-pro',
  },
  {
    id: 'fintech-prime',
    title: 'FinTech Prime',
    startsAt: new Date(Date.now() + 1000 * 60 * 240),
    reward: '20K Tokens',
    host: 'Dev & Data Live',
    linkedQuizId: 'fintech-frontier',
  },
  {
    id: 'cfo-showdown',
    title: 'CFO Showdown',
    startsAt: new Date(Date.now() + 1000 * 60 * 410),
    reward: '15K Equity',
    host: 'Analyst Riley',
    linkedQuizId: 'corporate-finance-clinic',
  },
]

const instantQuizzes = [
  {
    id: 'etf-express',
    title: 'ETF Express',
    players: 412,
    reward: 'Quick basis points',
    duration: '90 sec',
    color: '#49b6ff',
    quizId: 'global-markets-pro',
  },
  {
    id: 'budget-breaker',
    title: 'Budget Breaker',
    players: 256,
    reward: 'Savings boost',
    duration: '2 min',
    color: '#ff7b8a',
    quizId: 'personal-finance-playbook',
  },
  {
    id: 'crypto-sprint',
    title: 'Crypto Sprint',
    players: 188,
    reward: 'Token chest',
    duration: '3 min',
    color: '#26c3b9',
    quizId: 'fintech-frontier',
  },
]

const tournaments = [
  {
    id: 'wall-street-warriors',
    name: 'Wall Street Warriors',
    prizePool: '75K Bullion',
    entrants: 3124,
    difficulty: 'Medium',
    description:
      'Navigate equities, fixed income, and macro catalysts in a hosted session with real-time market alerts.',
    powerups: ['Double Alpha', 'Streak Hedge', 'Market Whisper'],
    color: '#ff866c',
    linkedQuizId: 'global-markets-pro',
  },
  {
    id: 'fintech-infinity',
    name: 'FinTech Infinity Cup',
    prizePool: '28K Tokens',
    entrants: 1475,
    difficulty: 'Hard',
    description:
      'DeFi protocols, reg-tech, and digital rails collide. Expect live code snippets and compliance twists.',
    powerups: ['Latency Freeze', 'Smart-Contract Peek'],
    color: '#57d6ff',
    linkedQuizId: 'fintech-frontier',
  },
  {
    id: 'wealth-builder',
    name: 'Wealth Builder Weekend',
    prizePool: '22K Growth Coins',
    entrants: 1988,
    difficulty: 'Easy',
    description:
      'Personal finance duels with scenario planning, opportunity cost puzzles, and surprise bonus rounds.',
    powerups: ['Snowball Surge', 'Expense Shield'],
    color: '#ff88f0',
    linkedQuizId: 'personal-finance-playbook',
  },
]

const leaderboardData = {
  daily: [
    { rank: 1, name: 'NovaSpike', score: 9860, streak: 9 },
    { rank: 2, name: 'PixelPiper', score: 9510, streak: 6 },
    { rank: 3, name: 'QuizQueen', score: 9275, streak: 12 },
    { rank: 4, name: 'TriviaTyphoon', score: 9025, streak: 4 },
    { rank: 5, name: 'SmashAce', score: 8940, streak: 3 },
  ],
  weekly: [
    { rank: 1, name: 'SolarSurge', score: 65540, streak: 18 },
    { rank: 2, name: 'QuizQueen', score: 63215, streak: 15 },
    { rank: 3, name: 'MindfulMilo', score: 61880, streak: 9 },
    { rank: 4, name: 'PixelPiper', score: 60330, streak: 7 },
    { rank: 5, name: 'HyperNova', score: 58940, streak: 5 },
  ],
  allTime: [
    { rank: 1, name: 'QuizQueen', score: 802450, streak: 28 },
    { rank: 2, name: 'SolarSurge', score: 776520, streak: 31 },
    { rank: 3, name: 'NeonNimbus', score: 755110, streak: 26 },
    { rank: 4, name: 'HyperNova', score: 743005, streak: 21 },
    { rank: 5, name: 'PixelPiper', score: 726445, streak: 18 },
  ],
}

const walletSeed = [
  { id: 't1', type: 'reward', label: 'Dividend sweep from Global Markets Pro', amount: +340, at: '2m ago' },
  { id: 't2', type: 'bonus', label: 'Daily dollar-cost streak bonus', amount: +25, at: '1h ago' },
  { id: 't3', type: 'entry', label: 'FinTech Infinity Cup buy-in', amount: -60, at: '3h ago' },
  { id: 't4', type: 'referral', label: 'Referred wealth advisor (Lena)', amount: +50, at: 'Yesterday' },
]

const sampleQuestion = {
  prompt: 'Dollar-cost averaging is best described as which investing approach?',
  options: [
    { id: 'a', label: 'Investing a fixed amount at regular intervals regardless of price', correct: true },
    { id: 'b', label: 'Buying only when technical indicators flash a buy signal' },
    { id: 'c', label: 'Allocating capital to the highest-yielding asset each quarter' },
    { id: 'd', label: 'Using leverage to magnify short-term market moves' },
  ],
  timeLimit: 10,
}

const formatCountdown = (targetDate) => {
  const distance = targetDate.getTime() - Date.now()
  if (distance <= 0) {
    return { label: 'Live now', isLive: true }
  }
  const hours = Math.floor(distance / (1000 * 60 * 60))
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((distance % (1000 * 60)) / 1000)
  return {
    label: `${hours.toString().padStart(2, '0')}h ${minutes
      .toString()
      .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
    isLive: false,
  }
}

const buttonTextByType = {
  reward: 'Reward',
  bonus: 'Bonus',
  entry: 'Entry',
  referral: 'Referral',
}

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [user, setUser] = useState(initialUser)
  const [wallet, setWallet] = useState(walletSeed)
  const [selectedTournament, setSelectedTournament] = useState(tournaments[0])
  const [leaderboardFilter, setLeaderboardFilter] = useState('daily')
  const nextShow = useMemo(() => upcomingShows[0].startsAt, [])
  const [countdown, setCountdown] = useState(() => formatCountdown(nextShow))
  const [showToast, setShowToast] = useState(null)
  const [demoQuestionIndex, setDemoQuestionIndex] = useState(0)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [quizState, setQuizState] = useState(() => ({ ...blankQuizState }))
  const [answerFeedback, setAnswerFeedback] = useState(null)
  const nextQuestionTimeout = useRef(null)
  const isPlayMode = Boolean(currentQuiz && quizState.status !== 'idle')

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(formatCountdown(nextShow))
    }, 1000)
    return () => clearInterval(timer)
  }, [nextShow])

  const pushWalletEntry = (entry) => {
    const entryWithId = entry.id ? entry : { ...entry, id: generateId() }
    setWallet((prev) => [entryWithId, ...prev.slice(0, 9)])
  }

  const triggerToast = (message) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 2800)
  }

  const handleClaimBonus = () => {
    if (user.claimedBonusToday) {
      triggerToast('Bonus already claimed. Come back tomorrow!')
      return
    }

    setUser((prev) => ({
      ...prev,
      coins: prev.coins + 25,
      streak: prev.streak + 1,
      claimedBonusToday: true,
    }))
    pushWalletEntry({
      id: generateId(),
      type: 'bonus',
      label: 'Daily Login Bonus',
      amount: +25,
      at: 'Just now',
    })
    triggerToast('Daily bonus collected! Keep the streak alive 🔥')
  }

  const handleWatchAd = () => {
    setUser((prev) => ({
      ...prev,
      coins: prev.coins + 40,
    }))
    pushWalletEntry({
      id: generateId(),
      type: 'reward',
      label: 'Watched Rewarded Ad',
      amount: +40,
      at: 'Just now',
    })
    triggerToast('Thanks! +40 coins added to your wallet.')
  }

  const startQuiz = (quizId, options = {}) => {
    const quiz = quizLibrary.find((q) => q.id === quizId)
    if (!quiz) {
      triggerToast('That quiz is under construction. Check back soon!')
      return
    }
    if (nextQuestionTimeout.current) {
      clearTimeout(nextQuestionTimeout.current)
      nextQuestionTimeout.current = null
    }
    setCurrentQuiz(quiz)
    setQuizState({
      ...blankQuizState,
      status: 'playing',
      remainingTime: quiz.timePerQuestion,
    })
    setAnswerFeedback(null)
    if (options.focusTournament) {
      setSelectedTournament(options.focusTournament)
    } else {
      const linkedTournament = tournaments.find((t) => t.linkedQuizId === quiz.id)
      if (linkedTournament) {
        setSelectedTournament(linkedTournament)
      }
    }
    setActiveTab('live')
    triggerToast(`Loaded ${quiz.title}. Good luck!`)
  }

  const startQuizByCategory = (quizId) => {
    startQuiz(quizId)
  }

  const handleCardKeyDown = (event, quizId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      startQuizByCategory(quizId)
    }
  }

  const handleExitQuiz = () => {
    if (nextQuestionTimeout.current) {
      clearTimeout(nextQuestionTimeout.current)
      nextQuestionTimeout.current = null
    }
    setCurrentQuiz(null)
    setQuizState({ ...blankQuizState })
    setAnswerFeedback(null)
    setActiveTab('home')
  }

  const handleOptionSelect = useCallback(
    (optionId, meta = {}) => {
      if (!currentQuiz || quizState.status !== 'playing' || quizState.isAwaitingNext) {
        return
      }
      const question = currentQuiz.questions[quizState.questionIndex]
      if (!question) return
      const selectedOption = optionId ? question.options.find((opt) => opt.id === optionId) : undefined
      const correctOption = question.options.find((opt) => opt.correct)
      const isCorrect = Boolean(selectedOption?.correct)
      const timeTaken = Math.max(0, currentQuiz.timePerQuestion - quizState.remainingTime)
      const scoreGain = isCorrect ? 120 + Math.max(0, quizState.remainingTime * 8) : 0
      const coinsGain = isCorrect ? 15 : 0

      setAnswerFeedback({
        selectedId: optionId,
        correctId: correctOption?.id ?? null,
        status: meta.auto ? 'timeout' : isCorrect ? 'correct' : 'wrong',
        explanation: question.explanation,
      })

      setQuizState((prev) => {
        if (prev.status !== 'playing') return prev
        const newAnswers = [
          ...prev.answers,
          {
            questionId: question.id,
            prompt: question.prompt,
            selected: optionId,
            correctOption: correctOption?.id ?? null,
            isCorrect,
            timeTaken,
            scoreGain,
            explanation: question.explanation,
          },
        ]
        const correctSoFar = prev.correctCount + (isCorrect ? 1 : 0)
        const isLast = prev.questionIndex >= currentQuiz.questions.length - 1
        const accuracy = Math.round((correctSoFar / currentQuiz.questions.length) * 100)
        const bonusCoins = Math.round((currentQuiz.rewardCoins ?? 0) * (accuracy / 100))

        const updated = {
          ...prev,
          answers: newAnswers,
          score: prev.score + scoreGain,
          streak: isCorrect ? prev.streak + 1 : 0,
          correctCount: correctSoFar,
          earnedCoins: prev.earnedCoins + coinsGain,
          isAwaitingNext: true,
          remainingTime: isLast ? 0 : currentQuiz.timePerQuestion,
        }

        if (isLast) {
          updated.status = 'complete'
          updated.finalSummary = {
            quizId: currentQuiz.id,
            quizTitle: currentQuiz.title,
            totalQuestions: currentQuiz.questions.length,
            correct: correctSoFar,
            score: updated.score,
            earnedCoins: updated.earnedCoins,
            bonusCoins,
            totalCoins: updated.earnedCoins + bonusCoins,
            accuracy,
            answers: newAnswers,
          }
        }

        return updated
      })

      if (nextQuestionTimeout.current) {
        clearTimeout(nextQuestionTimeout.current)
      }

      const isLastQuestion =
        currentQuiz.questions && quizState.questionIndex >= currentQuiz.questions.length - 1

      if (!isLastQuestion) {
        nextQuestionTimeout.current = setTimeout(() => {
          setQuizState((prev) => ({
            ...prev,
            questionIndex: prev.questionIndex + 1,
            isAwaitingNext: false,
          }))
          setAnswerFeedback(null)
        }, 1400)
      }
    },
    [
      currentQuiz,
      quizState.isAwaitingNext,
      quizState.questionIndex,
      quizState.remainingTime,
      quizState.status,
    ],
  )

  useEffect(() => {
    if (!currentQuiz || quizState.status !== 'playing' || quizState.isAwaitingNext) {
      return
    }
    if (quizState.remainingTime <= 0) {
      handleOptionSelect(null, { auto: true })
      return
    }
    const timeout = setTimeout(() => {
      setQuizState((prev) => ({
        ...prev,
        remainingTime: Math.max(0, prev.remainingTime - 1),
      }))
    }, 1000)
    return () => clearTimeout(timeout)
  }, [
    currentQuiz,
    quizState.status,
    quizState.isAwaitingNext,
    quizState.remainingTime,
    handleOptionSelect,
  ])

  useEffect(() => {
    if (!currentQuiz || quizState.status !== 'complete' || !quizState.finalSummary) {
      return
    }
    if (quizState.rewardsApplied) {
      return
    }
    const performanceBonus = quizState.finalSummary.bonusCoins ?? 0
    const totalCoins =
      quizState.finalSummary.totalCoins ?? quizState.earnedCoins + performanceBonus

    if (totalCoins > 0) {
      setUser((prev) => ({
        ...prev,
        coins: prev.coins + totalCoins,
      }))
      pushWalletEntry({
        id: generateId(),
        type: 'reward',
        label: `${quizState.finalSummary.quizTitle} winnings`,
        amount: totalCoins,
        at: 'Just now',
      })
      triggerToast(`Quiz complete! +${totalCoins} coins added to your wallet.`)
    } else {
      triggerToast('Quiz complete! Check your breakdown for insights.')
    }

    setQuizState((prev) => ({ ...prev, rewardsApplied: true }))
  }, [currentQuiz, quizState.status, quizState.finalSummary, quizState.rewardsApplied])

  useEffect(() => {
    return () => {
      if (nextQuestionTimeout.current) {
        clearTimeout(nextQuestionTimeout.current)
      }
    }
  }, [])

  const handleJoinTournament = (tournament) => {
    setSelectedTournament(tournament)
    setActiveTab('live')
    if (tournament.linkedQuizId) {
      startQuiz(tournament.linkedQuizId, { focusTournament: tournament })
    } else {
      triggerToast(`Joined ${tournament.name}. Lobby opens 10 minutes before start!`)
    }
  }

  const handleSimulateAnswer = (option) => {
    if (option.correct) {
      triggerToast('Correct! You just gained +30 XP.')
    } else {
      triggerToast('Close! Lifeline ready if you need it.')
    }
    setDemoQuestionIndex((prev) => (prev + 1) % instantQuizzes.length)
  }

  const renderPlay = () => {
    if (!currentQuiz) {
      return null
    }

    if (quizState.status === 'complete' && quizState.finalSummary) {
      const summary = quizState.finalSummary
      const fastestTime = summary.answers.length
        ? Math.min(...summary.answers.map((a) => a.timeTaken ?? currentQuiz.timePerQuestion))
        : 0

  return (
        <section className="panel play-panel play-panel--summary" aria-live="polite">
          <div className="summary-header">
            <h2>{summary.quizTitle} results</h2>
            <p>
              You answered <strong>{summary.correct}</strong> of {summary.totalQuestions} questions correctly.
            </p>
      </div>
          <div className="summary-grid">
            <article className="summary-card">
              <span className="summary-label">Score</span>
              <strong>{summary.score}</strong>
              <p>Performance rating · Accuracy {summary.accuracy}%</p>
            </article>
            <article className="summary-card">
              <span className="summary-label">Coins earned</span>
              <strong>+{summary.totalCoins}</strong>
              <p>
                {summary.earnedCoins} from correct answers · {summary.bonusCoins} bonus streak coins
              </p>
            </article>
            <article className="summary-card">
              <span className="summary-label">Fastest response</span>
              <strong>{fastestTime.toFixed(1)}s</strong>
              <p>Speed matters — keep the streak alive!</p>
            </article>
          </div>
          <div className="summary-answers">
            {summary.answers.map((answer, index) => (
              (() => {
                const questionSource =
                  currentQuiz.questions.find((q) => q.id === answer.questionId) ??
                  currentQuiz.questions[index] ??
                  null
                const correctLabel =
                  questionSource?.options.find((opt) => opt.id === answer.correctOption)?.label ?? '—'
                const selectedLabel = answer.selected
                  ? questionSource?.options.find((opt) => opt.id === answer.selected)?.label ?? '—'
                  : null
                return (
              <article
                key={answer.questionId ?? index}
                className={`answer-row ${answer.isCorrect ? 'answer-row--correct' : 'answer-row--wrong'}`}
              >
                <header>
                  <span>
                    Q{index + 1}. {answer.prompt}
                  </span>
                  <span>{answer.isCorrect ? '✔ Correct' : answer.selected ? '✖ Incorrect' : '⏱ Skipped'}</span>
                </header>
                <div className="answer-body">
                  <p>
                    Correct answer:{' '}
                    <strong>{correctLabel}</strong>
                  </p>
                  {selectedLabel && !answer.isCorrect && (
                    <p>
                      Your choice:{' '}
                      <span>{selectedLabel}</span>
                    </p>
                  )}
                  <p>
                    Time taken: <strong>{answer.timeTaken?.toFixed(1)}s</strong>
                  </p>
                  {answer.explanation && <p className="answer-explanation">{answer.explanation}</p>}
                </div>
              </article>
                )
              })()
            ))}
          </div>
          <div className="summary-actions">
            <button className="primary-button" onClick={() => startQuiz(currentQuiz.id)}>
              Replay quiz
        </button>
            <button
              className="ghost-button"
              onClick={() => {
                handleExitQuiz()
                setActiveTab('leaderboard')
              }}
            >
              View leaderboard
            </button>
            <button
              className="link-button"
              onClick={() => {
                handleExitQuiz()
                setActiveTab('home')
              }}
            >
              ← Back to home
            </button>
          </div>
        </section>
      )
    }

    const totalQuestions = currentQuiz.questions.length
    const currentQuestion =
      currentQuiz.questions[Math.min(quizState.questionIndex, totalQuestions - 1)] ?? currentQuiz.questions[0]
    const timerPercent =
      quizState.status === 'playing'
        ? Math.max(0, (quizState.remainingTime / currentQuiz.timePerQuestion) * 100)
        : 0
    const accuracySoFar = totalQuestions ? Math.round((quizState.correctCount / totalQuestions) * 100) : 0
    const isAwaitingNext = quizState.isAwaitingNext

  return (
      <section className="panel play-panel" aria-live="polite">
        <div className="play-header">
          <button className="link-button" onClick={handleExitQuiz}>
            ← Exit quiz
          </button>
          <div className="play-meta">
            <div className="play-meta-card">
              <span className="summary-label">Score</span>
              <strong>{quizState.score}</strong>
            </div>
            <div className="play-meta-card">
              <span className="summary-label">Coins</span>
              <strong>{quizState.earnedCoins}</strong>
            </div>
            <div className="play-meta-card">
              <span className="summary-label">Streak</span>
              <strong>{quizState.streak}</strong>
            </div>
            <div className="play-meta-card">
              <span className="summary-label">Accuracy</span>
              <strong>{accuracySoFar}%</strong>
            </div>
          </div>
        </div>

        <div className="play-progress">
          <span>
            Question {Math.min(quizState.questionIndex + 1, totalQuestions)} / {totalQuestions}
          </span>
          <span>{currentQuiz.category}</span>
          <span>{currentQuiz.difficulty} mode</span>
        </div>

        <div className="timer-bar" aria-hidden="true">
          <div className="timer-progress" style={{ width: `${timerPercent}%` }} />
        </div>
        <div className="timer-info">
          <span>{quizState.remainingTime}s left</span>
        </div>

        <div className="question-body">
          <h3 className="question-title">{currentQuestion.prompt}</h3>
          <div className="question-options">
            {currentQuestion.options.map((option) => {
              const isCorrect = option.id === answerFeedback?.correctId
              const isSelected = option.id === answerFeedback?.selectedId
              const classes = ['option-button']
              if (isAwaitingNext) {
                if (isCorrect) classes.push('option-button--correct')
                if (isSelected && !isCorrect && answerFeedback?.status !== 'timeout') {
                  classes.push('option-button--wrong')
                }
              }
              return (
                <button
                  key={option.id}
                  className={classes.join(' ')}
                  onClick={() => handleOptionSelect(option.id)}
                  disabled={isAwaitingNext}
                >
                  <span>{option.id.toUpperCase()}</span>
                  <p>{option.label}</p>
                </button>
              )
            })}
          </div>
        </div>

        {answerFeedback && (
          <div className={`answer-feedback answer-feedback--${answerFeedback.status}`}>
            {answerFeedback.status === 'correct' && <strong>On fire! Right answer.</strong>}
            {answerFeedback.status === 'wrong' && (
              <strong>
                {answerFeedback.selectedId
                  ? 'Not quite. The correct option is highlighted.'
                  : 'Question skipped.'}
              </strong>
            )}
            {answerFeedback.status === 'timeout' && <strong>Time’s up! Keep an eye on the countdown.</strong>}
            {answerFeedback.explanation && <p>{answerFeedback.explanation}</p>}
          </div>
        )}
      </section>
    )
  }

  const renderHome = () => (
    <>
      <section className="panel hero-panel">
        <div className="hero-grid">
          <div className="hero-copy fade-in">
            <span className="tag">Trade • Learn • Grow</span>
            <h1>
              Master finance through
              <br />
              live competition.
            </h1>
            <p>
              Tackle markets, personal finance, and regulation in real-time quiz battles while you unlock
              pro-level insights and sponsor-ready rewards.
            </p>
            <div className="hero-buttons">
              <button className="primary-button" onClick={() => setActiveTab('live')}>
                Enter Live Lobby
              </button>
              <button className="ghost-button" onClick={() => setActiveTab('dashboard')}>
                View My Arena
              </button>
      </div>
            <div className="hero-stats">
      <div>
                <strong>218K</strong>
                <span>Active analysts daily</span>
      </div>
              <div>
                <strong>7m 45s</strong>
                <span>Avg. session depth</span>
              </div>
              <div>
                <strong>4.9★</strong>
                <span>Community rating</span>
              </div>
            </div>
          </div>
          <div className="hero-showcase float-up">
            <div className="countdown-card">
              <span className="mini-label">Next live show</span>
              <h3>{upcomingShows[0].title}</h3>
              <p>{countdown.isLive ? 'Going live — tap to join!' : countdown.label}</p>
              <div className="countdown-footer">
                <span>{upcomingShows[0].reward}</span>
                <span>{upcomingShows[0].host}</span>
              </div>
            </div>
            <div className="live-preview">
              <div className="live-header">
                <span className="dot" />
                <span>Live order book forming</span>
                <span>2.4K waiting</span>
              </div>
              <div className="avatar-stack">
                {['amelia', 'nova', 'tyke', 'skye'].map((id) => (
                  <img
                    key={id}
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${id}`}
                    alt="avatar"
                  />
                ))}
              </div>
              <p>Tonight’s incentives: 2× alpha bonus, 1.5× portfolio XP.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel section" aria-labelledby="categories-heading">
        <div className="section-heading">
          <span className="eyebrow">Build your financial edge</span>
          <h2 id="categories-heading">Pick a desk and sharpen strategy every day.</h2>
          <p>
            Rotate through equity, wealth, fintech, and compliance quests driven by adaptive difficulty and
            community challenges. New scenarios keep the edge sharp.
        </p>
      </div>
        <div className="category-grid">
          {categories.map((category) => {
            const quiz = quizLibrary.find((q) => q.id === category.quizId)
            return (
            <article
              key={category.name}
              className="category-card"
              style={{ background: category.gradient }}
              role="button"
              tabIndex={0}
              onClick={() => startQuizByCategory(category.quizId)}
              onKeyDown={(event) => handleCardKeyDown(event, category.quizId)}
            >
              <div className="category-icon" aria-hidden="true">
                {category.icon}
              </div>
              <h3>{category.name}</h3>
              <p>{category.plays} plays</p>
              <div className="category-meta">
                {quiz && (
                  <>
                    <span>{quiz.difficulty} mode</span>
                    <span>
                      {quiz.questions.length} questions · {quiz.timePerQuestion}s each
                    </span>
                    <span>Reward: {quiz.rewardCoins} coins</span>
                    {quiz.questions[0] && (
                      <p className="category-preview">“{quiz.questions[0].prompt}”</p>
                    )}
                  </>
                )}
              </div>
              <button
                className="link-button"
                onClick={(event) => {
                  event.stopPropagation()
                  startQuizByCategory(category.quizId)
                }}
              >
                Enter arena →
              </button>
            </article>
            )
          })}
        </div>
      </section>

      <section className="panel section" aria-labelledby="schedule-heading">
        <div className="section-heading">
          <span className="eyebrow">Market lineup</span>
          <h2 id="schedule-heading">Schedule alerts for the next trading-floor shows.</h2>
        </div>
        <div className="schedule-list">
          {upcomingShows.map((show) => {
            const info = formatCountdown(show.startsAt)
            return (
              <article key={show.id} className="schedule-card">
                <div>
                  <h3>{show.title}</h3>
                  <p>{show.host}</p>
                </div>
                <div className="schedule-meta">
                  <span>{show.reward}</span>
                  <button
                    className="ghost-button"
                    onClick={() =>
                      show.linkedQuizId ? startQuiz(show.linkedQuizId) : handleJoinTournament(tournaments[0])
                    }
                  >
                    {info.isLive ? 'Join now' : info.label}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel section" aria-labelledby="instant-heading">
        <div className="section-heading">
          <span className="eyebrow">Instant action</span>
          <h2 id="instant-heading">No schedule? Dive into 90-second blitz quizzes.</h2>
        </div>
        <div className="instant-grid">
          {instantQuizzes.map((quiz, index) => (
            <button
              key={quiz.id}
              className={`instant-card ${index === demoQuestionIndex ? 'instant-card--active' : ''}`}
              style={{ borderColor: quiz.color }}
              onClick={() => {
                setDemoQuestionIndex(index)
                startQuiz(quiz.quizId)
              }}
            >
              <span className="instant-title">{quiz.title}</span>
              <span className="instant-meta">{quiz.players} players on</span>
              <span className="instant-reward">{quiz.reward}</span>
              <span className="instant-duration">{quiz.duration}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  )

  const renderLive = () => (
    <section className="panel live-panel" aria-labelledby="live-heading">
      <div className="section-heading">
        <span className="eyebrow">Live lobby</span>
        <h2 id="live-heading">{selectedTournament.name}</h2>
        <p>{selectedTournament.description}</p>
      </div>
      <div className="live-grid">
        <article className="live-detail">
          <header>
            <span className="pill" style={{ backgroundColor: selectedTournament.color }}>
              {selectedTournament.prizePool}
            </span>
            <span className="pill pill--ghost">{selectedTournament.entrants.toLocaleString()} entrants</span>
            <span className="pill pill--ghost">{selectedTournament.difficulty} mode</span>
          </header>
          <div className="live-meta">
            <div>
              <strong>Power-ups</strong>
              <ul>
                {selectedTournament.powerups.map((power) => (
                  <li key={power}>{power}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Lifeline cost</strong>
              <p>30 coins • 1 per quiz</p>
            </div>
      <div>
              <strong>Boosts active</strong>
              <p>+50% streak multiplier • confetti for winners</p>
            </div>
          </div>
          <div className="live-cta">
            <button
              className="primary-button"
              onClick={() =>
                selectedTournament.linkedQuizId
                  ? startQuiz(selectedTournament.linkedQuizId, { focusTournament: selectedTournament })
                  : triggerToast('You are in the priority queue!')
              }
            >
              Join priority queue
            </button>
            <button className="ghost-button" onClick={() => triggerToast('Invite link copied!')}>
              Invite squad
            </button>
          </div>
        </article>
        <article className="live-demo">
          <div className="live-demo-header">
            <span className="dot" />
            <span>Practice mode</span>
            <span>10 sec</span>
          </div>
          <h3>{sampleQuestion.prompt}</h3>
          <div className="question-options">
            {sampleQuestion.options.map((option) => (
              <button
                key={option.id}
                className="option-button"
                onClick={() => handleSimulateAnswer(option)}
              >
                <span>{option.id.toUpperCase()}</span>
                <p>{option.label}</p>
              </button>
            ))}
          </div>
          <div className="demo-footer">
            <span>Try a lifeline to preview its power.</span>
            <button className="link-button" onClick={() => triggerToast('Lifeline preview loaded!')}>
              Watch how it works →
            </button>
          </div>
        </article>
      </div>
      <div className="tournament-carousel">
        {tournaments.map((tournament) => (
          <button
            key={tournament.id}
            className={`tournament-pill ${selectedTournament.id === tournament.id ? 'tournament-pill--active' : ''}`}
            onClick={() => setSelectedTournament(tournament)}
          >
            {tournament.name}
          </button>
        ))}
      </div>
    </section>
  )

  const renderLeaderboard = () => (
    <section className="panel section" aria-labelledby="leaderboard-heading">
      <div className="section-heading">
        <span className="eyebrow">Hall of fame</span>
        <h2 id="leaderboard-heading">Who ruled the arena?</h2>
      </div>
      <div className="leaderboard-filter">
        {Object.keys(leaderboardData).map((key) => (
          <button
            key={key}
            className={leaderboardFilter === key ? 'filter-button filter-button--active' : 'filter-button'}
            onClick={() => setLeaderboardFilter(key)}
          >
            {key === 'allTime' ? 'All time' : key}
          </button>
        ))}
      </div>
      <div className="leaderboard-table" role="table">
        <div className="leaderboard-header" role="row">
          <span role="columnheader">Rank</span>
          <span role="columnheader">Player</span>
          <span role="columnheader">Score</span>
          <span role="columnheader">Streak</span>
        </div>
        <div className="leaderboard-body">
          {leaderboardData[leaderboardFilter].map((entry) => (
            <div key={entry.rank} className="leaderboard-row" role="row">
              <span role="cell">#{entry.rank}</span>
              <span role="cell">
                <strong>{entry.name}</strong>
              </span>
              <span role="cell">{entry.score.toLocaleString()}</span>
              <span role="cell">{entry.streak}🔥</span>
            </div>
          ))}
        </div>
      </div>
      <div className="cta-banner">
        <div>
          <h3>Ready to top the trading floor?</h3>
          <p>Hit streaks, complete finance missions, and unlock exclusive analyst-grade badges.</p>
        </div>
        <button className="primary-button" onClick={() => setActiveTab('dashboard')}>
          View missions
        </button>
      </div>
    </section>
  )

  const renderDashboard = () => (
    <section className="panel section" aria-labelledby="dashboard-heading">
      <div className="section-heading">
        <span className="eyebrow">Portfolio hub</span>
        <h2 id="dashboard-heading">Welcome back, {user.name.split(' ')[0]}!</h2>
        <p>Review quiz alpha, manage tokens, and unlock pro missions tailored to your financial edge.</p>
      </div>
      <div className="dashboard-grid">
        <article className="profile-card glass">
          <div className="profile-header">
            <img src={user.avatar} alt={`${user.name} avatar`} />
            <div>
              <h3>{user.name}</h3>
              <p>Level {user.level}</p>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${user.xpPercent}%` }} />
          </div>
          <div className="profile-stats">
            <div>
              <strong>{user.coins}</strong>
              <span>Coins</span>
            </div>
            <div>
              <strong>{user.streak}</strong>
              <span>Day streak</span>
            </div>
            <div>
              <strong>247</strong>
              <span>Quizzes cleared</span>
            </div>
          </div>
          <div className="profile-actions">
            <button className="primary-button" onClick={handleClaimBonus}>
              Claim daily bonus
            </button>
            <button className="ghost-button" onClick={handleWatchAd}>
              Watch ad +40
            </button>
          </div>
        </article>
        <article className="wallet-card glass">
          <header>
            <h3>Wallet activity</h3>
            <span>{wallet.length} recent</span>
          </header>
          <ul className="wallet-list">
            {wallet.map((entry) => (
              <li key={entry.id}>
                <div>
                  <span className={`wallet-pill wallet-pill--${entry.type}`}>
                    {buttonTextByType[entry.type] ?? entry.type}
                  </span>
                  <p>{entry.label}</p>
                </div>
                <div className="wallet-amount">
                  <strong className={entry.amount > 0 ? 'positive' : 'negative'}>
                    {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                  </strong>
                  <span>{entry.at}</span>
                </div>
              </li>
            ))}
          </ul>
        </article>
        <article className="badges-card glass">
          <header>
            <h3>Unlocked badges</h3>
            <span>Collect them all</span>
          </header>
          <div className="badge-grid">
            {user.badges.map((badge) => (
              <span key={badge} className="badge-tile">
                {badge}
              </span>
            ))}
            <button className="badge-tile badge-tile--locked">Mystery badge</button>
          </div>
          <button className="link-button" onClick={() => triggerToast('New missions dropping Friday!')}>
            View upcoming missions →
          </button>
        </article>
      </div>
    </section>
  )

  const renderContent = () => {
    if (isPlayMode) {
      return renderPlay()
    }
    switch (activeTab) {
      case 'home':
        return renderHome()
      case 'live':
        return renderLive()
      case 'leaderboard':
        return renderLeaderboard()
      case 'dashboard':
        return renderDashboard()
      default:
        return renderHome()
    }
  }

  return (
    <div className="page">
      <div className="background-glow" aria-hidden="true" />
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ⚡
          </span>
          <span className="brand-name">QuizRush</span>
        </div>
        <nav className="topbar-nav" aria-label="Primary">
          {['home', 'live', 'leaderboard', 'dashboard'].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'nav-link nav-link--active' : 'nav-link'}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="topbar-actions">
          <div className="coin-display">
            <span>☀️</span>
            <strong>{user.coins}</strong>
            <span>coins</span>
          </div>
          <button className="primary-button" onClick={() => triggerToast('Friends list coming soon!')}>
            Invite friends
          </button>
        </div>
      </header>

      <main>{renderContent()}</main>

      <footer className="footer">
        <div>
          <strong>QuizRush • React Edition</strong>
          <p>Built for live trivia, streaming-ready tournaments, and sponsor activations.</p>
        </div>
        <div className="footer-links">
          {[
            { label: 'Community', message: 'Community hub launches soon — stay tuned!' },
            { label: 'Partner with us', message: 'Partnership deck available on request. Email biz@quizrush.com.' },
            { label: 'Ad policy', message: 'Our monetization guidelines are being finalized for the finance launch.' },
            { label: 'Support', message: 'Need help? Reach out at support@quizrush.com.' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className="footer-link"
              onClick={() => triggerToast(item.message)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </footer>

      {showToast && <div className="toast">{showToast}</div>}
    </div>
  )
}

export default App
