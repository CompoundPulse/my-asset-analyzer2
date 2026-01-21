// cryptoMap.js
export const cryptoMap = {
  // Top Market Cap Cryptocurrencies
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'USDC': 'usd-coin',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'TRX': 'tron',
  'TON': 'the-open-network',
  'DAI': 'dai',
  
  // DeFi Tokens
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'MKR': 'maker',
  'CRV': 'curve-dao-token',
  'COMP': 'compound-governance-token',
  'SNX': 'havven',
  'YFI': 'yearn-finance',
  'SUSHI': 'sushi',
  '1INCH': '1inch',
  'BAL': 'balancer',
  'CAKE': 'pancakeswap-token',
  
  // Layer 1 Blockchain Tokens
  'ATOM': 'cosmos',
  'NEAR': 'near',
  'FTM': 'fantom',
  'ALGO': 'algorand',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'HBAR': 'hedera-hashgraph',
  'EOS': 'eos',
  'EGLD': 'elrond-erd-2',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'APE': 'apecoin',
  'AXS': 'axie-infinity',
  
  // Exchange Tokens
  'CRO': 'crypto-com-chain',
  'FTT': 'ftx-token',
  'KCS': 'kucoin-shares',
  'HT': 'huobi-token',
  'OKB': 'okb',
  'LEO': 'leo-token',
  
  // Meme Coins
  'SHIB': 'shiba-inu',
  'PEPE': 'pepe',
  'FLOKI': 'floki',
  'BONK': 'bonk',
  
  // Privacy Coins
  'XMR': 'monero',
  'ZEC': 'zcash',
  'DASH': 'dash',
  
  // Older Legacy Coins
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'ETC': 'ethereum-classic',
  'XLM': 'stellar',
  'VET': 'vechain',
  'THETA': 'theta-token',
  'NEO': 'neo',
  'WAVES': 'waves',
  'ZIL': 'zilliqa',
  
  // Layer 2 Solutions
  'OP': 'optimism',
  'ARB': 'arbitrum',
  'IMX': 'immutable-x',
  'LRC': 'loopring',
  
  // AI Tokens
  'AGIX': 'singularitynet',
  'FET': 'fetch-ai',
  'OCEAN': 'ocean-protocol',
  'NMR': 'numeraire',
  
  // Infrastructure
  'GRT': 'the-graph',
  'CHZ': 'chiliz',
  'ROSE': 'oasis-network',
  'QTUM': 'qtum',
  'ONE': 'harmony',
  'BTT': 'bittorrent',
  'HOT': 'holotoken',
  
  // Stablecoins
  'BUSD': 'binance-usd',
  'TUSD': 'true-usd',
  'USDD': 'usdd',
  'USDP': 'paxos-standard',
  'GUSD': 'gemini-dollar',
  
  // Wrapped Tokens
  'WBTC': 'wrapped-bitcoin',
  'WETH': 'weth',
  'WBNB': 'wbnb',
  
  // RWA Tokens
  'PAXG': 'pax-gold',
  'DGX': 'digix-gold',
  
  // Gaming & Metaverse
  'GALA': 'gala',
  'ENJ': 'enjincoin',
  'GODS': 'gods-unchained',
  'ILV': 'illuvium',
  'SLP': 'smooth-love-potion',
  'GMT': 'stepn',
  
  // Storage Tokens
  'AR': 'arweave',
  'SC': 'siacoin',
  'STORJ': 'storj',
  
  // Oracle Tokens
  'BAND': 'band-protocol',
  'TRB': 'tellor',
  'API3': 'api3',
  
  // Music & Media Tokens
  'AUD': 'audius',
  'AUDIO': 'audius',
  'RAD': 'radicle',
  
  // DAO Tokens
  'ENS': 'ethereum-name-service',
  'LDO': 'lido-dao',
  'ANGLE': 'angle-protocol',
  'TRIBE': 'tribe-2',
  
  // Lending Protocols
  'JUST': 'just',
  'NEXO': 'nexo',
  'CEL': 'celsius-degree-token',
  'AMP': 'amp-token',
  
  // Cross-chain
  'RUNE': 'thorchain',
  'REN': 'republic-protocol',
  'CELR': 'celer-network',
  
  // NFT Platform Tokens
  'SUPER': 'superfarm',
  'RARE': 'unique-one',
  'NFT': 'nftx',
  
  // Identity & Privacy
  'KEEP': 'keep-network',
  'NXM': 'nxm',
  'DENT': 'dent',
  
  // Social Tokens
  'MASK': 'mask-network',
  'MONA': 'monavale',
  'REVIVAL': 'revival',
  
  // Insurance
  'INSUR': 'insurace',
  'INFI': 'insured-finance',
  'CVR': 'polkacover'
};

// Categories for easy reference
export const cryptoCategories = {
  topMarketCap: ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'USDC', 'ADA', 'AVAX', 'DOGE'],
  defi: ['LINK', 'UNI', 'AAVE', 'MKR', 'CRV', 'COMP', 'SNX', 'YFI', 'SUSHI'],
  layer1: ['ATOM', 'NEAR', 'FTM', 'ALGO', 'ICP', 'FIL', 'HBAR', 'EOS', 'EGLD'],
  memeCoins: ['SHIB', 'PEPE', 'FLOKI', 'BONK'],
  privacy: ['XMR', 'ZEC', 'DASH'],
  legacy: ['LTC', 'BCH', 'ETC', 'XLM', 'VET'],
  layer2: ['OP', 'ARB', 'IMX', 'LRC'],
  ai: ['AGIX', 'FET', 'OCEAN', 'NMR'],
  gaming: ['SAND', 'MANA', 'APE', 'AXS', 'GALA', 'ILV'],
  stablecoins: ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDD'],
  wrapped: ['WBTC', 'WETH', 'WBNB'],
  infrastructure: ['GRT', 'CHZ', 'ENJ', 'ROSE', 'QTUM', 'ONE'],
  storage: ['FIL', 'AR', 'SC', 'STORJ'],
  oracles: ['LINK', 'BAND', 'TRB', 'API3'],
  dao: ['ENS', 'LDO', 'ANGLE', 'TRIBE']
};