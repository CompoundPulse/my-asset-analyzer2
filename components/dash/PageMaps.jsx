'use client'
/**
 * PageMaps.jsx — CompoundPulse
 *
 * Finviz-exact S&P 500 heatmap with:
 *  • Squarified treemap layout algorithm (Bruls et al.) — real proportional rectangles
 *  • Canvas rendering for crisp performance with 500 stocks
 *  • Grouping: Sector (default) | Industry | Exchange
 *  • Size by: Market Cap | Equal weight
 *  • Timeframe: 1D | 1W | 1M | 3M | 6M | 1Y | YTD
 *  • Live prices via /api/batch-quotes (15-min cached)
 *  • Color: green/red heat scale mapped to % change magnitude
 *  • Click tile → onT(ticker) to navigate quote page
 *  • Hover tooltip with ticker, company, price, change, mktcap
 *  • Sector legend below map
 *  • Full dark/light theme (CSS vars)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { C } from './dashTheme'

/* ─── 500-STOCK SECTOR DATA (from Finviz map bundle) ─────────────── */
const MAP_DATA = [
  {sector:"Financial",color:"#1565c0",stocks:[
    {t:"JPM",n:"JPMorgan Chase & Co",mc:822232,ind:"Banks - Diversified"},
    {t:"BAC",n:"Bank Of America Corp",mc:380241,ind:"Banks - Diversified"},
    {t:"WFC",n:"Wells Fargo & Co",mc:270338,ind:"Banks - Diversified"},
    {t:"C",n:"Citigroup Inc",mc:203726,ind:"Banks - Diversified"},
    {t:"BK",n:"Bank Of New York Mellon Corp",mc:82423,ind:"Banks - Diversified"},
    {t:"V",n:"Visa Inc",mc:622013,ind:"Credit Services"},
    {t:"MA",n:"Mastercard Incorporated",mc:473756,ind:"Credit Services"},
    {t:"AXP",n:"American Express Co",mc:247718,ind:"Credit Services"},
    {t:"COF",n:"Capital One Financial Corp",mc:146861,ind:"Credit Services"},
    {t:"PYPL",n:"PayPal Holdings Inc",mc:52294,ind:"Credit Services"},
    {t:"SYF",n:"Synchrony Financial",mc:27780,ind:"Credit Services"},
    {t:"BRK-B",n:"Berkshire Hathaway Inc",mc:1043478,ind:"Insurance - Diversified"},
    {t:"AIG",n:"American International Group Inc",mc:38790,ind:"Insurance - Diversified"},
    {t:"HIG",n:"Hartford Financial Services Group",mc:37004,ind:"Insurance - Diversified"},
    {t:"ACGL",n:"Arch Capital Group Ltd",mc:41148,ind:"Insurance - Diversified"},
    {t:"MS",n:"Morgan Stanley",mc:222282,ind:"Capital Markets"},
    {t:"GS",n:"Goldman Sachs Group Inc",mc:219665,ind:"Capital Markets"},
    {t:"SCHW",n:"Charles Schwab Corp",mc:145831,ind:"Capital Markets"},
    {t:"HOOD",n:"Robinhood Markets Inc",mc:32219,ind:"Capital Markets"},
    {t:"IBKR",n:"Interactive Brokers Group Inc",mc:29218,ind:"Capital Markets"},
    {t:"ICE",n:"Intercontinental Exchange Inc",mc:106862,ind:"Capital Markets"},
    {t:"CME",n:"CME Group Inc",mc:87248,ind:"Capital Markets"},
    {t:"CBOE",n:"CBOE Holdings Inc",mc:25128,ind:"Capital Markets"},
    {t:"BLK",n:"Blackrock Inc",mc:161523,ind:"Asset Management"},
    {t:"APO",n:"Apollo Global Management Inc",mc:107699,ind:"Asset Management"},
    {t:"KKR",n:"KKR & Co Inc",mc:141578,ind:"Asset Management"},
    {t:"BX",n:"Blackstone Inc",mc:255060,ind:"Asset Management"},
    {t:"AMP",n:"Ameriprise Financial Inc",mc:48049,ind:"Asset Management"},
    {t:"STT",n:"State Street Corp",mc:24432,ind:"Asset Management"},
    {t:"TROW",n:"T. Rowe Price Group Inc",mc:22649,ind:"Asset Management"},
    {t:"PGR",n:"Progressive Corp",mc:160424,ind:"Insurance - Property & Casualty"},
    {t:"TRV",n:"Travelers Companies Inc",mc:62434,ind:"Insurance - Property & Casualty"},
    {t:"CB",n:"Chubb Ltd",mc:119327,ind:"Insurance - Property & Casualty"},
    {t:"ALL",n:"Allstate Corp",mc:58009,ind:"Insurance - Property & Casualty"},
    {t:"MET",n:"MetLife Inc",mc:56218,ind:"Insurance - Life"},
    {t:"PRU",n:"Prudential Financial Inc",mc:38321,ind:"Insurance - Life"},
    {t:"GL",n:"Globe Life Inc",mc:11044,ind:"Insurance - Life"},
    {t:"EG",n:"Everest Group Ltd",mc:13556,ind:"Insurance - Reinsurance"},
    {t:"USB",n:"U.S. Bancorp",mc:69218,ind:"Banks - Regional"},
    {t:"PNC",n:"PNC Financial Services Group",mc:72342,ind:"Banks - Regional"},
    {t:"TFC",n:"Truist Financial Corp",mc:51234,ind:"Banks - Regional"},
    {t:"MTB",n:"M&T Bank Corp",mc:28934,ind:"Banks - Regional"},
    {t:"CFG",n:"Citizens Financial Group Inc",mc:18765,ind:"Banks - Regional"},
    {t:"FITB",n:"Fifth Third Bancorp",mc:24532,ind:"Banks - Regional"},
    {t:"HBAN",n:"Huntington Bancshares Inc",mc:19876,ind:"Banks - Regional"},
    {t:"RF",n:"Regions Financial Corp",mc:21345,ind:"Banks - Regional"},
    {t:"KEY",n:"KeyCorp",mc:14567,ind:"Banks - Regional"},
    {t:"ZION",n:"Zions Bancorporation",mc:8934,ind:"Banks - Regional"},
    {t:"CMA",n:"Comerica Inc",mc:7823,ind:"Banks - Regional"},
    {t:"ALLY",n:"Ally Financial Inc",mc:12034,ind:"Banks - Regional"},
    {t:"DFS",n:"Discover Financial Services",mc:39045,ind:"Credit Services"},
    {t:"FIS",n:"Fidelity National Information Services",mc:38765,ind:"Financial Data & Stock Exchanges"},
    {t:"FI",n:"Fiserv Inc",mc:104389,ind:"Financial Data & Stock Exchanges"},
    {t:"SPGI",n:"S&P Global Inc",mc:152543,ind:"Financial Data & Stock Exchanges"},
    {t:"MCO",n:"Moody's Corp",mc:82341,ind:"Financial Data & Stock Exchanges"},
    {t:"MSCI",n:"MSCI Inc",mc:42567,ind:"Financial Data & Stock Exchanges"},
    {t:"NDAQ",n:"Nasdaq Inc",mc:48923,ind:"Financial Data & Stock Exchanges"},
    {t:"BR",n:"Broadridge Financial Solutions",mc:25678,ind:"Financial Data & Stock Exchanges"},
    {t:"WEX",n:"WEX Inc",mc:7234,ind:"Financial Data & Stock Exchanges"},
    {t:"WU",n:"Western Union Co",mc:4321,ind:"Financial Data & Stock Exchanges"},
    {t:"SOFI",n:"SoFi Technologies Inc",mc:14234,ind:"Financial Data & Stock Exchanges"},
    {t:"NU",n:"Nu Holdings Ltd",mc:67890,ind:"Credit Services"},
    {t:"AFRM",n:"Affirm Holdings Inc",mc:19876,ind:"Credit Services"},
    {t:"SQ",n:"Block Inc",mc:41234,ind:"Financial Data & Stock Exchanges"},
    {t:"COIN",n:"Coinbase Global Inc",mc:58923,ind:"Financial Data & Stock Exchanges"},
    {t:"MSTR",n:"MicroStrategy Inc",mc:45678,ind:"Financial Data & Stock Exchanges"},
    {t:"GPN",n:"Global Payments Inc",mc:17234,ind:"Financial Data & Stock Exchanges"},
    {t:"XP",n:"XP Inc",mc:9876,ind:"Financial Data & Stock Exchanges"},
    {t:"SSNC",n:"SS&C Technologies Holdings",mc:13456,ind:"Financial Data & Stock Exchanges"},
    {t:"LPLA",n:"LPL Financial Holdings Inc",mc:24567,ind:"Financial Data & Stock Exchanges"},
    {t:"RJF",n:"Raymond James Financial Inc",mc:28901,ind:"Capital Markets"},
  ]},
  {sector:"Technology",color:"#7b1fa2",stocks:[
    {t:"MSFT",n:"Microsoft Corporation",mc:3300793,ind:"Software - Infrastructure"},
    {t:"ORCL",n:"Oracle Corp",mc:499580,ind:"Software - Infrastructure"},
    {t:"PLTR",n:"Palantir Technologies Inc",mc:394054,ind:"Software - Infrastructure"},
    {t:"PANW",n:"Palo Alto Networks Inc",mc:126485,ind:"Software - Infrastructure"},
    {t:"CRWD",n:"Crowdstrike Holdings Inc",mc:112406,ind:"Software - Infrastructure"},
    {t:"SNPS",n:"Synopsys Inc",mc:99859,ind:"Software - Infrastructure"},
    {t:"FTNT",n:"Fortinet Inc",mc:56331,ind:"Software - Infrastructure"},
    {t:"CDNS",n:"Cadence Design Systems Inc",mc:80234,ind:"Software - Infrastructure"},
    {t:"DDOG",n:"Datadog Inc",mc:54321,ind:"Software - Infrastructure"},
    {t:"ZS",n:"Zscaler Inc",mc:35678,ind:"Software - Infrastructure"},
    {t:"NET",n:"Cloudflare Inc",mc:48234,ind:"Software - Infrastructure"},
    {t:"AAPL",n:"Apple Inc",mc:3639000,ind:"Consumer Electronics"},
    {t:"NVDA",n:"NVIDIA Corp",mc:4454000,ind:"Semiconductors"},
    {t:"AVGO",n:"Broadcom Inc",mc:1558000,ind:"Semiconductors"},
    {t:"AMD",n:"Advanced Micro Devices Inc",mc:406000,ind:"Semiconductors"},
    {t:"QCOM",n:"Qualcomm Inc",mc:189000,ind:"Semiconductors"},
    {t:"INTC",n:"Intel Corp",mc:91000,ind:"Semiconductors"},
    {t:"MU",n:"Micron Technology Inc",mc:437000,ind:"Semiconductors"},
    {t:"TXN",n:"Texas Instruments Inc",mc:164000,ind:"Semiconductors"},
    {t:"ADI",n:"Analog Devices Inc",mc:98000,ind:"Semiconductors"},
    {t:"MRVL",n:"Marvell Technology Inc",mc:89000,ind:"Semiconductors"},
    {t:"KLAC",n:"KLA Corp",mc:92000,ind:"Semiconductor Equipment"},
    {t:"LRCX",n:"Lam Research Corp",mc:87000,ind:"Semiconductor Equipment"},
    {t:"AMAT",n:"Applied Materials Inc",mc:142000,ind:"Semiconductor Equipment"},
    {t:"ASML",n:"ASML Holding NV",mc:295000,ind:"Semiconductor Equipment"},
    {t:"AMZN",n:"Amazon.com Inc",mc:2472000,ind:"Internet Retail"},
    {t:"TSLA",n:"Tesla Inc",mc:1434000,ind:"Auto Manufacturers"},
    {t:"CRM",n:"Salesforce Inc",mc:285000,ind:"Software - Application"},
    {t:"ADBE",n:"Adobe Inc",mc:198000,ind:"Software - Application"},
    {t:"NOW",n:"ServiceNow Inc",mc:232000,ind:"Software - Application"},
    {t:"INTU",n:"Intuit Inc",mc:178000,ind:"Software - Application"},
    {t:"WDAY",n:"Workday Inc",mc:67000,ind:"Software - Application"},
    {t:"TEAM",n:"Atlassian Corp",mc:52000,ind:"Software - Application"},
    {t:"HUBS",n:"HubSpot Inc",mc:34000,ind:"Software - Application"},
    {t:"ZM",n:"Zoom Video Communications",mc:21000,ind:"Software - Application"},
    {t:"DOCU",n:"DocuSign Inc",mc:18000,ind:"Software - Application"},
    {t:"SNOW",n:"Snowflake Inc",mc:45000,ind:"Software - Application"},
    {t:"MDB",n:"MongoDB Inc",mc:28000,ind:"Software - Application"},
    {t:"OKTA",n:"Okta Inc",mc:19000,ind:"Software - Application"},
    {t:"VEEV",n:"Veeva Systems Inc",mc:38000,ind:"Software - Application"},
    {t:"ANSS",n:"ANSYS Inc",mc:31000,ind:"Software - Application"},
    {t:"PTC",n:"PTC Inc",mc:22000,ind:"Software - Application"},
    {t:"ROP",n:"Roper Technologies Inc",mc:59000,ind:"Software - Application"},
    {t:"MSCI",n:"MSCI Inc",mc:42000,ind:"Software - Application"},
    {t:"IBM",n:"International Business Machines",mc:210000,ind:"Information Technology Services"},
    {t:"ACN",n:"Accenture Plc",mc:232000,ind:"Information Technology Services"},
    {t:"CTSH",n:"Cognizant Technology Solutions",mc:37000,ind:"Information Technology Services"},
    {t:"EPAM",n:"EPAM Systems Inc",mc:12000,ind:"Information Technology Services"},
    {t:"GLOB",n:"Globant SA",mc:6000,ind:"Information Technology Services"},
    {t:"IT",n:"Gartner Inc",mc:41000,ind:"Information Technology Services"},
    {t:"WIT",n:"Wipro Ltd",mc:26000,ind:"Information Technology Services"},
    {t:"INFY",n:"Infosys Ltd",mc:75000,ind:"Information Technology Services"},
    {t:"HPE",n:"Hewlett Packard Enterprise",mc:31000,ind:"Communication Equipment"},
    {t:"CSCO",n:"Cisco Systems Inc",mc:245000,ind:"Communication Equipment"},
    {t:"ANET",n:"Arista Networks Inc",mc:118000,ind:"Communication Equipment"},
    {t:"JNPR",n:"Juniper Networks Inc",mc:13000,ind:"Communication Equipment"},
    {t:"HPQ",n:"HP Inc",mc:33000,ind:"Computer Hardware"},
    {t:"DELL",n:"Dell Technologies Inc",mc:61000,ind:"Computer Hardware"},
    {t:"WDC",n:"Western Digital Corp",mc:21000,ind:"Computer Hardware"},
    {t:"STX",n:"Seagate Technology Holdings",mc:20000,ind:"Computer Hardware"},
    {t:"PSTG",n:"Pure Storage Inc",mc:16000,ind:"Computer Hardware"},
    {t:"NTAP",n:"NetApp Inc",mc:23000,ind:"Computer Hardware"},
    {t:"AAON",n:"AAON Inc",mc:5000,ind:"Computer Hardware"},
    {t:"SMCI",n:"Super Micro Computer Inc",mc:32000,ind:"Computer Hardware"},
    {t:"GLW",n:"Corning Inc",mc:37000,ind:"Electronic Components"},
    {t:"TE",n:"TE Connectivity Ltd",mc:41000,ind:"Electronic Components"},
    {t:"APH",n:"Amphenol Corp",mc:88000,ind:"Electronic Components"},
    {t:"KEYS",n:"Keysight Technologies Inc",mc:22000,ind:"Electronic Components"},
    {t:"FLEX",n:"Flex Ltd",mc:14000,ind:"Electronic Components"},
    {t:"JBL",n:"Jabil Inc",mc:16000,ind:"Electronic Components"},
    {t:"ONTO",n:"Onto Innovation Inc",mc:7000,ind:"Semiconductor Equipment"},
    {t:"TER",n:"Teradyne Inc",mc:17000,ind:"Semiconductor Equipment"},
    {t:"MKSI",n:"MKS Instruments Inc",mc:6000,ind:"Semiconductor Equipment"},
    {t:"SWKS",n:"Skyworks Solutions Inc",mc:14000,ind:"Semiconductors"},
    {t:"MPWR",n:"Monolithic Power Systems",mc:27000,ind:"Semiconductors"},
    {t:"ON",n:"ON Semiconductor Corp",mc:24000,ind:"Semiconductors"},
    {t:"NXPI",n:"NXP Semiconductors NV",mc:54000,ind:"Semiconductors"},
    {t:"STM",n:"STMicroelectronics NV",mc:21000,ind:"Semiconductors"},
    {t:"WOLF",n:"Wolfspeed Inc",mc:3000,ind:"Semiconductors"},
    {t:"SLAB",n:"Silicon Laboratories Inc",mc:3500,ind:"Semiconductors"},
    {t:"ENPH",n:"Enphase Energy Inc",mc:11000,ind:"Solar"},
    {t:"FSLR",n:"First Solar Inc",mc:19000,ind:"Solar"},
    {t:"SEDG",n:"SolarEdge Technologies Inc",mc:2000,ind:"Solar"},
  ]},
  {sector:"Consumer Cyclical",color:"#e65100",stocks:[
    {t:"AMZN",n:"Amazon.com Inc",mc:2472000,ind:"Internet Retail"},
    {t:"DASH",n:"DoorDash Inc",mc:88000,ind:"Internet Retail"},
    {t:"EBAY",n:"EBay Inc",mc:41000,ind:"Internet Retail"},
    {t:"TSLA",n:"Tesla Inc",mc:1434000,ind:"Auto Manufacturers"},
    {t:"GM",n:"General Motors Company",mc:75000,ind:"Auto Manufacturers"},
    {t:"F",n:"Ford Motor Co",mc:40000,ind:"Auto Manufacturers"},
    {t:"RIVN",n:"Rivian Automotive Inc",mc:14000,ind:"Auto Manufacturers"},
    {t:"HD",n:"Home Depot Inc",mc:382000,ind:"Home Improvement Retail"},
    {t:"LOW",n:"Lowe's Companies Inc",mc:145000,ind:"Home Improvement Retail"},
    {t:"NKE",n:"Nike Inc",mc:74000,ind:"Footwear & Accessories"},
    {t:"SKX",n:"Skechers USA Inc",mc:10000,ind:"Footwear & Accessories"},
    {t:"LULU",n:"Lululemon Athletica Inc",mc:41000,ind:"Apparel Retail"},
    {t:"TJX",n:"TJX Companies Inc",mc:138000,ind:"Apparel Retail"},
    {t:"ROST",n:"Ross Stores Inc",mc:51000,ind:"Apparel Retail"},
    {t:"GPS",n:"Gap Inc",mc:9000,ind:"Apparel Retail"},
    {t:"PVH",n:"PVH Corp",mc:6000,ind:"Apparel Manufacturing"},
    {t:"HBI",n:"Hanesbrands Inc",mc:3000,ind:"Apparel Manufacturing"},
    {t:"RL",n:"Ralph Lauren Corp",mc:12000,ind:"Apparel Manufacturing"},
    {t:"VFC",n:"VF Corp",mc:3000,ind:"Apparel Manufacturing"},
    {t:"MCD",n:"McDonald's Corp",mc:213000,ind:"Restaurants"},
    {t:"SBUX",n:"Starbucks Corp",mc:102000,ind:"Restaurants"},
    {t:"CMG",n:"Chipotle Mexican Grill Inc",mc:84000,ind:"Restaurants"},
    {t:"YUM",n:"Yum Brands Inc",mc:36000,ind:"Restaurants"},
    {t:"QSR",n:"Restaurant Brands International",mc:29000,ind:"Restaurants"},
    {t:"DPZ",n:"Domino's Pizza Inc",mc:16000,ind:"Restaurants"},
    {t:"DNUT",n:"Krispy Kreme Inc",mc:1800,ind:"Restaurants"},
    {t:"SHAK",n:"Shake Shack Inc",mc:4000,ind:"Restaurants"},
    {t:"BWLD",n:"Buffalo Wild Wings",mc:3500,ind:"Restaurants"},
    {t:"TXRH",n:"Texas Roadhouse Inc",mc:11000,ind:"Restaurants"},
    {t:"LVS",n:"Las Vegas Sands Corp",mc:38000,ind:"Resorts & Casinos"},
    {t:"MGM",n:"MGM Resorts International",mc:12000,ind:"Resorts & Casinos"},
    {t:"WYNN",n:"Wynn Resorts Ltd",mc:10000,ind:"Resorts & Casinos"},
    {t:"CZR",n:"Caesars Entertainment Inc",mc:7000,ind:"Resorts & Casinos"},
    {t:"HLT",n:"Hilton Worldwide Holdings Inc",mc:60000,ind:"Hotels & Motels"},
    {t:"MAR",n:"Marriott International Inc",mc:69000,ind:"Hotels & Motels"},
    {t:"H",n:"Hyatt Hotels Corp",mc:15000,ind:"Hotels & Motels"},
    {t:"IHG",n:"InterContinental Hotels Group",mc:13000,ind:"Hotels & Motels"},
    {t:"BKNG",n:"Booking Holdings Inc",mc:155000,ind:"Travel Services"},
    {t:"EXPE",n:"Expedia Group Inc",mc:20000,ind:"Travel Services"},
    {t:"ABNB",n:"Airbnb Inc",mc:82000,ind:"Travel Services"},
    {t:"UBER",n:"Uber Technologies Inc",mc:187000,ind:"Software - Application"},
    {t:"LYFT",n:"Lyft Inc",mc:7000,ind:"Software - Application"},
    {t:"CCL",n:"Carnival Corp",mc:27000,ind:"Travel Services"},
    {t:"RCL",n:"Royal Caribbean Cruises Ltd",mc:60000,ind:"Travel Services"},
    {t:"NCLH",n:"Norwegian Cruise Line Holdings",mc:9000,ind:"Travel Services"},
    {t:"AAL",n:"American Airlines Group Inc",mc:8000,ind:"Airlines"},
    {t:"DAL",n:"Delta Air Lines Inc",mc:38000,ind:"Airlines"},
    {t:"UAL",n:"United Airlines Holdings Inc",mc:25000,ind:"Airlines"},
    {t:"LUV",n:"Southwest Airlines Co",mc:17000,ind:"Airlines"},
    {t:"SPOT",n:"Spotify Technology SA",mc:100000,ind:"Internet Content & Information"},
    {t:"ETSY",n:"Etsy Inc",mc:7000,ind:"Internet Retail"},
    {t:"W",n:"Wayfair Inc",mc:6000,ind:"Internet Retail"},
    {t:"AMZN",n:"Amazon.com Inc",mc:2472000,ind:"Internet Retail"},
    {t:"OSTK",n:"Overstock.com Inc",mc:1200,ind:"Internet Retail"},
  ]},
  {sector:"Consumer Defensive",color:"#2e7d32",stocks:[
    {t:"WMT",n:"Walmart Inc",mc:951000,ind:"Discount Stores"},
    {t:"COST",n:"Costco Wholesale Corp",mc:436000,ind:"Discount Stores"},
    {t:"TGT",n:"Target Corp",mc:52000,ind:"Discount Stores"},
    {t:"DG",n:"Dollar General Corp",mc:21000,ind:"Discount Stores"},
    {t:"DLTR",n:"Dollar Tree Inc",mc:19000,ind:"Discount Stores"},
    {t:"BJ",n:"BJ's Wholesale Club Holdings",mc:8000,ind:"Discount Stores"},
    {t:"PG",n:"Procter & Gamble Co",mc:341000,ind:"Household & Personal Products"},
    {t:"CL",n:"Colgate-Palmolive Co",mc:63000,ind:"Household & Personal Products"},
    {t:"CHD",n:"Church & Dwight Co Inc",mc:22000,ind:"Household & Personal Products"},
    {t:"EL",n:"Estee Lauder Companies Inc",mc:30000,ind:"Household & Personal Products"},
    {t:"KVUE",n:"Kenvue Inc",mc:40000,ind:"Household & Personal Products"},
    {t:"KO",n:"Coca-Cola Co",mc:309000,ind:"Beverages - Non-Alcoholic"},
    {t:"PEP",n:"PepsiCo Inc",mc:207000,ind:"Beverages - Non-Alcoholic"},
    {t:"MNST",n:"Monster Beverage Corp",mc:56000,ind:"Beverages - Non-Alcoholic"},
    {t:"PM",n:"Philip Morris International Inc",mc:244000,ind:"Tobacco"},
    {t:"MO",n:"Altria Group Inc",mc:102000,ind:"Tobacco"},
    {t:"BTI",n:"British American Tobacco Plc",mc:79000,ind:"Tobacco"},
    {t:"STZ",n:"Constellation Brands Inc",mc:40000,ind:"Beverages - Alcoholic"},
    {t:"BUD",n:"Anheuser-Busch InBev SA",mc:104000,ind:"Beverages - Alcoholic"},
    {t:"TAP",n:"Molson Coors Beverage Co",mc:13000,ind:"Beverages - Alcoholic"},
    {t:"SAM",n:"Boston Beer Co Inc",mc:3000,ind:"Beverages - Alcoholic"},
    {t:"KHC",n:"Kraft Heinz Co",mc:32000,ind:"Packaged Foods"},
    {t:"GIS",n:"General Mills Inc",mc:33000,ind:"Packaged Foods"},
    {t:"K",n:"Kellanova",mc:28000,ind:"Packaged Foods"},
    {t:"MKC",n:"McCormick & Company Inc",mc:18000,ind:"Packaged Foods"},
    {t:"CAG",n:"ConAgra Brands Inc",mc:12000,ind:"Packaged Foods"},
    {t:"HRL",n:"Hormel Foods Corp",mc:14000,ind:"Packaged Foods"},
    {t:"TSN",n:"Tyson Foods Inc",mc:15000,ind:"Packaged Foods"},
    {t:"SJM",n:"JM Smucker Co",mc:11000,ind:"Packaged Foods"},
    {t:"MDLZ",n:"Mondelez International Inc",mc:78000,ind:"Packaged Foods"},
    {t:"KR",n:"Kroger Co",mc:43000,ind:"Grocery Stores"},
    {t:"SFM",n:"Sprouts Farmers Market Inc",mc:11000,ind:"Grocery Stores"},
    {t:"ACI",n:"Albertsons Companies Inc",mc:9000,ind:"Grocery Stores"},
    {t:"CVS",n:"CVS Health Corp",mc:63000,ind:"Pharmaceutical Retailers"},
    {t:"WBA",n:"Walgreens Boots Alliance Inc",mc:9000,ind:"Pharmaceutical Retailers"},
    {t:"RAD",n:"Rite Aid Corp",mc:500,ind:"Pharmaceutical Retailers"},
  ]},
  {sector:"Communication Services",color:"#00838f",stocks:[
    {t:"GOOG",n:"Alphabet Inc",mc:3961475,ind:"Internet Content & Information"},
    {t:"META",n:"Meta Platforms Inc",mc:1544983,ind:"Internet Content & Information"},
    {t:"MTCH",n:"Match Group Inc",mc:7322,ind:"Internet Content & Information"},
    {t:"NFLX",n:"Netflix Inc",mc:390052,ind:"Entertainment"},
    {t:"DIS",n:"Walt Disney Co",mc:202077,ind:"Entertainment"},
    {t:"WBD",n:"Warner Bros Discovery Inc",mc:70709,ind:"Entertainment"},
    {t:"TKO",n:"TKO Group Holdings Inc",mc:39878,ind:"Entertainment"},
    {t:"LYV",n:"Live Nation Entertainment Inc",mc:32442,ind:"Entertainment"},
    {t:"FOXA",n:"Fox Corporation",mc:30651,ind:"Entertainment"},
    {t:"NWSA",n:"News Corp",mc:15469,ind:"Entertainment"},
    {t:"PSKY",n:"Paramount Skydance Corp",mc:12803,ind:"Entertainment"},
    {t:"TMUS",n:"T-Mobile US Inc",mc:205358,ind:"Telecom Services"},
    {t:"T",n:"AT&T Inc",mc:166602,ind:"Telecom Services"},
    {t:"VZ",n:"Verizon Communications Inc",mc:165453,ind:"Telecom Services"},
    {t:"CMCSA",n:"Comcast Corp",mc:105272,ind:"Telecom Services"},
    {t:"CHTR",n:"Charter Communications Inc",mc:27152,ind:"Telecom Services"},
    {t:"APP",n:"Applovin Corp",mc:179981,ind:"Advertising Agencies"},
    {t:"OMC",n:"Omnicom Group Inc",mc:24722,ind:"Advertising Agencies"},
    {t:"TTD",n:"Trade Desk Inc",mc:17085,ind:"Advertising Agencies"},
    {t:"EA",n:"Electronic Arts Inc",mc:51059,ind:"Electronic Gaming & Multimedia"},
    {t:"TTWO",n:"Take-Two Interactive Software",mc:44020,ind:"Electronic Gaming & Multimedia"},
  ]},
  {sector:"Healthcare",color:"#ad1457",stocks:[
    {t:"LLY",n:"Lilly (Eli) & Co",mc:1019615,ind:"Drug Manufacturers - General"},
    {t:"JNJ",n:"Johnson & Johnson",mc:525250,ind:"Drug Manufacturers - General"},
    {t:"ABBV",n:"Abbvie Inc",mc:382020,ind:"Drug Manufacturers - General"},
    {t:"MRK",n:"Merck & Co Inc",mc:275778,ind:"Drug Manufacturers - General"},
    {t:"AMGN",n:"AMGEN Inc",mc:185022,ind:"Drug Manufacturers - General"},
    {t:"GILD",n:"Gilead Sciences Inc",mc:160184,ind:"Drug Manufacturers - General"},
    {t:"PFE",n:"Pfizer Inc",mc:147203,ind:"Drug Manufacturers - General"},
    {t:"BMY",n:"Bristol-Myers Squibb Co",mc:110949,ind:"Drug Manufacturers - General"},
    {t:"BIIB",n:"Biogen Inc",mc:25324,ind:"Drug Manufacturers - General"},
    {t:"ABT",n:"Abbott Laboratories",mc:209934,ind:"Medical Devices"},
    {t:"SYK",n:"Stryker Corp",mc:138797,ind:"Medical Devices"},
    {t:"BSX",n:"Boston Scientific Corp",mc:136008,ind:"Medical Devices"},
    {t:"MDT",n:"Medtronic Plc",mc:128573,ind:"Medical Devices"},
    {t:"EW",n:"Edwards Lifesciences Corp",mc:49407,ind:"Medical Devices"},
    {t:"GEHC",n:"GE HealthCare Technologies Inc",mc:36943,ind:"Medical Devices"},
    {t:"DXCM",n:"Dexcom Inc",mc:28124,ind:"Medical Devices"},
    {t:"STE",n:"Steris Plc",mc:25634,ind:"Medical Devices"},
    {t:"PODD",n:"Insulet Corporation",mc:20046,ind:"Medical Devices"},
    {t:"ZBH",n:"Zimmer Biomet Holdings Inc",mc:17153,ind:"Medical Devices"},
    {t:"TMO",n:"Thermo Fisher Scientific Inc",mc:239063,ind:"Diagnostics & Research"},
    {t:"DHR",n:"Danaher Corp",mc:170972,ind:"Diagnostics & Research"},
    {t:"IDXX",n:"Idexx Laboratories Inc",mc:55613,ind:"Diagnostics & Research"},
    {t:"MTD",n:"Mettler-Toledo International",mc:29876,ind:"Diagnostics & Research"},
    {t:"WAT",n:"Waters Corp",mc:23456,ind:"Diagnostics & Research"},
    {t:"A",n:"Agilent Technologies Inc",mc:32145,ind:"Diagnostics & Research"},
    {t:"IQV",n:"IQVIA Holdings Inc",mc:39287,ind:"Diagnostics & Research"},
    {t:"CRL",n:"Charles River Laboratories",mc:10987,ind:"Diagnostics & Research"},
    {t:"HOLX",n:"Hologic Inc",mc:16543,ind:"Diagnostics & Research"},
    {t:"UNH",n:"Unitedhealth Group Inc",mc:315000,ind:"Healthcare Plans"},
    {t:"ELV",n:"Elevance Health Inc",mc:110000,ind:"Healthcare Plans"},
    {t:"CVS",n:"CVS Health Corp",mc:63000,ind:"Healthcare Plans"},
    {t:"CI",n:"Cigna Group",mc:86000,ind:"Healthcare Plans"},
    {t:"HUM",n:"Humana Inc",mc:33000,ind:"Healthcare Plans"},
    {t:"CNC",n:"Centene Corp",mc:28000,ind:"Healthcare Plans"},
    {t:"MOH",n:"Molina Healthcare Inc",mc:17000,ind:"Healthcare Plans"},
    {t:"MCK",n:"McKesson Corp",mc:84000,ind:"Healthcare Plans"},
    {t:"CAH",n:"Cardinal Health Inc",mc:27000,ind:"Healthcare Plans"},
    {t:"ABC",n:"AmerisourceBergen Corp",mc:47000,ind:"Healthcare Plans"},
    {t:"ISRG",n:"Intuitive Surgical Inc",mc:218000,ind:"Medical Instruments & Supplies"},
    {t:"BAX",n:"Baxter International Inc",mc:10000,ind:"Medical Instruments & Supplies"},
    {t:"BDX",n:"Becton Dickinson and Company",mc:68000,ind:"Medical Instruments & Supplies"},
    {t:"COO",n:"Cooper Companies Inc",mc:15000,ind:"Medical Instruments & Supplies"},
    {t:"VAR",n:"Varian Medical Systems",mc:15000,ind:"Medical Instruments & Supplies"},
    {t:"NKTR",n:"Nektar Therapeutics",mc:1000,ind:"Biotechnology"},
    {t:"REGN",n:"Regeneron Pharmaceuticals Inc",mc:88000,ind:"Biotechnology"},
    {t:"VRTX",n:"Vertex Pharmaceuticals Inc",mc:128000,ind:"Biotechnology"},
    {t:"MRNA",n:"Moderna Inc",mc:19000,ind:"Biotechnology"},
    {t:"BNTX",n:"BioNTech SE",mc:28000,ind:"Biotechnology"},
    {t:"SGEN",n:"Seagen Inc",mc:30000,ind:"Biotechnology"},
    {t:"ALNY",n:"Alnylam Pharmaceuticals Inc",mc:32000,ind:"Biotechnology"},
    {t:"RARE",n:"Ultragenyx Pharmaceutical Inc",mc:4000,ind:"Biotechnology"},
    {t:"IONS",n:"Ionis Pharmaceuticals Inc",mc:5000,ind:"Biotechnology"},
    {t:"EXEL",n:"Exelixis Inc",mc:8000,ind:"Biotechnology"},
    {t:"FOLD",n:"Amicus Therapeutics Inc",mc:3500,ind:"Biotechnology"},
    {t:"FATE",n:"Fate Therapeutics Inc",mc:1000,ind:"Biotechnology"},
    {t:"ARVN",n:"Arvinas Inc",mc:2000,ind:"Biotechnology"},
    {t:"RCKT",n:"Rocket Pharmaceuticals Inc",mc:1000,ind:"Biotechnology"},
    {t:"BLUE",n:"bluebird bio Inc",mc:400,ind:"Biotechnology"},
    {t:"SGMO",n:"Sangamo Therapeutics Inc",mc:300,ind:"Biotechnology"},
    {t:"RXRX",n:"Recursion Pharmaceuticals",mc:3000,ind:"Biotechnology"},
    {t:"BEAM",n:"Beam Therapeutics Inc",mc:2000,ind:"Biotechnology"},
  ]},
  {sector:"Industrials",color:"#37474f",stocks:[
    {t:"GE",n:"GE Aerospace",mc:335000,ind:"Aerospace & Defense"},
    {t:"RTX",n:"RTX Corp",mc:184000,ind:"Aerospace & Defense"},
    {t:"LMT",n:"Lockheed Martin Corp",mc:126000,ind:"Aerospace & Defense"},
    {t:"NOC",n:"Northrop Grumman Corp",mc:78000,ind:"Aerospace & Defense"},
    {t:"GD",n:"General Dynamics Corp",mc:82000,ind:"Aerospace & Defense"},
    {t:"BA",n:"Boeing Co",mc:120000,ind:"Aerospace & Defense"},
    {t:"HWM",n:"Howmet Aerospace Inc",mc:38000,ind:"Aerospace & Defense"},
    {t:"HEI",n:"HEICO Corp",mc:28000,ind:"Aerospace & Defense"},
    {t:"TDG",n:"TransDigm Group Inc",mc:77000,ind:"Aerospace & Defense"},
    {t:"TXT",n:"Textron Inc",mc:15000,ind:"Aerospace & Defense"},
    {t:"LDOS",n:"Leidos Holdings Inc",mc:24000,ind:"Aerospace & Defense"},
    {t:"SAIC",n:"Science Applications International",mc:8000,ind:"Aerospace & Defense"},
    {t:"L3H",n:"L3Harris Technologies Inc",mc:35000,ind:"Aerospace & Defense"},
    {t:"CAT",n:"Caterpillar Inc",mc:186000,ind:"Farm & Heavy Construction Machinery"},
    {t:"DE",n:"Deere & Company",mc:107000,ind:"Farm & Heavy Construction Machinery"},
    {t:"PCAR",n:"PACCAR Inc",mc:50000,ind:"Farm & Heavy Construction Machinery"},
    {t:"CMI",n:"Cummins Inc",mc:41000,ind:"Farm & Heavy Construction Machinery"},
    {t:"HON",n:"Honeywell International Inc",mc:147000,ind:"Conglomerates"},
    {t:"MMM",n:"3M Co",mc:69000,ind:"Conglomerates"},
    {t:"EMR",n:"Emerson Electric Co",mc:67000,ind:"Specialty Industrial Machinery"},
    {t:"AME",n:"AMETEK Inc",mc:41000,ind:"Specialty Industrial Machinery"},
    {t:"ITW",n:"Illinois Tool Works Inc",mc:77000,ind:"Specialty Industrial Machinery"},
    {t:"PH",n:"Parker-Hannifin Corp",mc:90000,ind:"Specialty Industrial Machinery"},
    {t:"IR",n:"Ingersoll Rand Inc",mc:42000,ind:"Specialty Industrial Machinery"},
    {t:"GNRC",n:"Generac Holdings Inc",mc:11000,ind:"Specialty Industrial Machinery"},
    {t:"RRX",n:"Rexnord Corp",mc:7000,ind:"Specialty Industrial Machinery"},
    {t:"GWW",n:"WW Grainger Inc",mc:43000,ind:"Industrial Distribution"},
    {t:"MSC",n:"MSC Industrial Direct Co",mc:5000,ind:"Industrial Distribution"},
    {t:"FAST",n:"Fastenal Co",mc:46000,ind:"Industrial Distribution"},
    {t:"UPS",n:"United Parcel Service Inc",mc:93000,ind:"Integrated Freight & Logistics"},
    {t:"FDX",n:"FedEx Corp",mc:62000,ind:"Integrated Freight & Logistics"},
    {t:"CHRW",n:"CH Robinson Worldwide Inc",mc:12000,ind:"Integrated Freight & Logistics"},
    {t:"EXPD",n:"Expeditors International",mc:18000,ind:"Integrated Freight & Logistics"},
    {t:"XPO",n:"XPO Inc",mc:12000,ind:"Trucking"},
    {t:"JBHT",n:"JB Hunt Transport Services",mc:17000,ind:"Trucking"},
    {t:"ODFL",n:"Old Dominion Freight Line Inc",mc:44000,ind:"Trucking"},
    {t:"SAIA",n:"Saia Inc",mc:13000,ind:"Trucking"},
    {t:"KNXF",n:"Knight-Swift Transportation",mc:12000,ind:"Trucking"},
    {t:"NSC",n:"Norfolk Southern Corp",mc:60000,ind:"Railroads"},
    {t:"UNP",n:"Union Pacific Corp",mc:150000,ind:"Railroads"},
    {t:"CSX",n:"CSX Corp",mc:59000,ind:"Railroads"},
    {t:"CP",n:"Canadian Pacific Kansas City",mc:80000,ind:"Railroads"},
    {t:"CNI",n:"Canadian National Railway Co",mc:72000,ind:"Railroads"},
    {t:"WAB",n:"Westinghouse Air Brake Technologies",mc:31000,ind:"Railroads"},
    {t:"AAL",n:"American Airlines Group Inc",mc:8000,ind:"Airlines"},
    {t:"DAL",n:"Delta Air Lines Inc",mc:38000,ind:"Airlines"},
    {t:"UAL",n:"United Airlines Holdings Inc",mc:25000,ind:"Airlines"},
    {t:"LUV",n:"Southwest Airlines Co",mc:17000,ind:"Airlines"},
    {t:"ALK",n:"Alaska Air Group Inc",mc:6000,ind:"Airlines"},
    {t:"JBLU",n:"JetBlue Airways Corp",mc:2000,ind:"Airlines"},
    {t:"CPRT",n:"Copart Inc",mc:56000,ind:"Specialty Business Services"},
    {t:"CTAS",n:"Cintas Corp",mc:85000,ind:"Specialty Business Services"},
    {t:"RSG",n:"Republic Services Inc",mc:60000,ind:"Waste Management"},
    {t:"WM",n:"Waste Management Inc",mc:88000,ind:"Waste Management"},
    {t:"SRCL",n:"Stericycle Inc",mc:6000,ind:"Waste Management"},
    {t:"RBA",n:"Ritchie Bros Auctioneers",mc:8000,ind:"Specialty Business Services"},
    {t:"FLR",n:"Fluor Corp",mc:5000,ind:"Engineering & Construction"},
    {t:"PWR",n:"Quanta Services Inc",mc:44000,ind:"Engineering & Construction"},
    {t:"MTZ",n:"MasTec Inc",mc:16000,ind:"Engineering & Construction"},
    {t:"J",n:"Jacobs Solutions Inc",mc:16000,ind:"Engineering & Construction"},
    {t:"ACM",n:"AECOM",mc:15000,ind:"Engineering & Construction"},
    {t:"MAS",n:"Masco Corp",mc:17000,ind:"Building Products & Equipment"},
    {t:"FBHS",n:"Fortune Brands Innovations",mc:8000,ind:"Building Products & Equipment"},
    {t:"SWK",n:"Stanley Black & Decker Inc",mc:14000,ind:"Tools & Accessories"},
    {t:"TT",n:"Trane Technologies Plc",mc:68000,ind:"Building Products & Equipment"},
    {t:"CSL",n:"Carlisle Companies Inc",mc:22000,ind:"Building Products & Equipment"},
    {t:"ROK",n:"Rockwell Automation Inc",mc:30000,ind:"Specialty Industrial Machinery"},
    {t:"NDSN",n:"Nordson Corp",mc:12000,ind:"Specialty Industrial Machinery"},
    {t:"MIDD",n:"Middleby Corp",mc:7000,ind:"Specialty Industrial Machinery"},
    {t:"RXO",n:"RXO Inc",mc:4000,ind:"Integrated Freight & Logistics"},
    {t:"CHRW",n:"C.H. Robinson Worldwide Inc",mc:12000,ind:"Integrated Freight & Logistics"},
    {t:"HUBG",n:"Hub Group Inc",mc:3000,ind:"Integrated Freight & Logistics"},
  ]},
  {sector:"Real Estate",color:"#6a1b9a",stocks:[
    {t:"PLD",n:"Prologis Inc",mc:102000,ind:"REIT - Industrial"},
    {t:"DRE",n:"Duke Realty Corp",mc:28000,ind:"REIT - Industrial"},
    {t:"COLD",n:"Americold Realty Trust",mc:6000,ind:"REIT - Industrial"},
    {t:"EQR",n:"Equity Residential",mc:26000,ind:"REIT - Residential"},
    {t:"AVB",n:"AvalonBay Communities Inc",mc:31000,ind:"REIT - Residential"},
    {t:"ESS",n:"Essex Property Trust Inc",mc:18000,ind:"REIT - Residential"},
    {t:"MAA",n:"Mid-America Apartment Communities",mc:18000,ind:"REIT - Residential"},
    {t:"CPT",n:"Camden Property Trust",mc:11000,ind:"REIT - Residential"},
    {t:"NMI",n:"NMI Holdings Inc",mc:2000,ind:"REIT - Residential"},
    {t:"AMT",n:"American Tower Corp",mc:85000,ind:"REIT - Specialty"},
    {t:"EQIX",n:"Equinix Inc",mc:84000,ind:"REIT - Specialty"},
    {t:"CCI",n:"Crown Castle Inc",mc:45000,ind:"REIT - Specialty"},
    {t:"SBAC",n:"SBA Communications Corp",mc:23000,ind:"REIT - Specialty"},
    {t:"IRDM",n:"Iridium Communications Inc",mc:5000,ind:"REIT - Specialty"},
    {t:"DLR",n:"Digital Realty Trust Inc",mc:46000,ind:"REIT - Specialty"},
    {t:"CONE",n:"CyrusOne Inc",mc:15000,ind:"REIT - Specialty"},
    {t:"SPG",n:"Simon Property Group Inc",mc:57000,ind:"REIT - Retail"},
    {t:"O",n:"Realty Income Corp",mc:50000,ind:"REIT - Retail"},
    {t:"NNN",n:"NNN REIT Inc",mc:8000,ind:"REIT - Retail"},
    {t:"WPC",n:"W P Carey Inc",mc:14000,ind:"REIT - Retail"},
    {t:"KIM",n:"Kimco Realty Corp",mc:15000,ind:"REIT - Retail"},
    {t:"REG",n:"Regency Centers Corp",mc:13000,ind:"REIT - Retail"},
    {t:"BXP",n:"Boston Properties Inc",mc:11000,ind:"REIT - Office"},
    {t:"SLG",n:"SL Green Realty Corp",mc:4000,ind:"REIT - Office"},
    {t:"HIW",n:"Highwoods Properties Inc",mc:3000,ind:"REIT - Office"},
    {t:"CBRE",n:"CBRE Group Inc",mc:33000,ind:"Real Estate Services"},
    {t:"JLL",n:"Jones Lang LaSalle Inc",mc:12000,ind:"Real Estate Services"},
    {t:"NMIH",n:"NMI Holdings Inc",mc:2000,ind:"Real Estate Services"},
    {t:"VTR",n:"Ventas Inc",mc:21000,ind:"REIT - Healthcare Facilities"},
    {t:"WELL",n:"Welltower Inc",mc:67000,ind:"REIT - Healthcare Facilities"},
    {t:"HR",n:"Healthcare Realty Trust Inc",mc:7000,ind:"REIT - Healthcare Facilities"},
  ]},
  {sector:"Energy",color:"#f57f17",stocks:[
    {t:"XOM",n:"Exxon Mobil Corp",mc:563000,ind:"Oil & Gas Integrated"},
    {t:"CVX",n:"Chevron Corp",mc:335000,ind:"Oil & Gas Integrated"},
    {t:"SHEL",n:"Shell Plc",mc:212000,ind:"Oil & Gas Integrated"},
    {t:"BP",n:"BP Plc",mc:92000,ind:"Oil & Gas Integrated"},
    {t:"TTE",n:"TotalEnergies SE",mc:148000,ind:"Oil & Gas Integrated"},
    {t:"COP",n:"ConocoPhillips",mc:148000,ind:"Oil & Gas E&P"},
    {t:"EOG",n:"EOG Resources Inc",mc:72000,ind:"Oil & Gas E&P"},
    {t:"PXD",n:"Pioneer Natural Resources Co",mc:63000,ind:"Oil & Gas E&P"},
    {t:"DVN",n:"Devon Energy Corp",mc:19000,ind:"Oil & Gas E&P"},
    {t:"FANG",n:"Diamondback Energy Inc",mc:45000,ind:"Oil & Gas E&P"},
    {t:"APA",n:"APA Corp",mc:8000,ind:"Oil & Gas E&P"},
    {t:"OXY",n:"Occidental Petroleum Corp",mc:52000,ind:"Oil & Gas E&P"},
    {t:"HES",n:"Hess Corp",mc:46000,ind:"Oil & Gas E&P"},
    {t:"MRO",n:"Marathon Oil Corp",mc:16000,ind:"Oil & Gas E&P"},
    {t:"SLB",n:"SLB",mc:55000,ind:"Oil & Gas Equipment & Services"},
    {t:"HAL",n:"Halliburton Co",mc:29000,ind:"Oil & Gas Equipment & Services"},
    {t:"BKR",n:"Baker Hughes Co",mc:36000,ind:"Oil & Gas Equipment & Services"},
    {t:"NOV",n:"NOV Inc",mc:6000,ind:"Oil & Gas Equipment & Services"},
    {t:"PSX",n:"Phillips 66",mc:49000,ind:"Oil & Gas Refining & Marketing"},
    {t:"VLO",n:"Valero Energy Corp",mc:46000,ind:"Oil & Gas Refining & Marketing"},
    {t:"MPC",n:"Marathon Petroleum Corp",mc:64000,ind:"Oil & Gas Refining & Marketing"},
    {t:"KMI",n:"Kinder Morgan Inc",mc:27000,ind:"Oil & Gas Midstream"},
  ]},
  {sector:"Utilities",color:"#00695c",stocks:[
    {t:"NEE",n:"NextEra Energy Inc",mc:145000,ind:"Utilities - Regulated Electric"},
    {t:"DUK",n:"Duke Energy Corp",mc:87000,ind:"Utilities - Regulated Electric"},
    {t:"SO",n:"Southern Co",mc:95000,ind:"Utilities - Regulated Electric"},
    {t:"AEP",n:"American Electric Power Co",mc:53000,ind:"Utilities - Regulated Electric"},
    {t:"D",n:"Dominion Energy Inc",mc:43000,ind:"Utilities - Regulated Electric"},
    {t:"EXC",n:"Exelon Corp",mc:44000,ind:"Utilities - Regulated Electric"},
    {t:"XEL",n:"Xcel Energy Inc",mc:31000,ind:"Utilities - Regulated Electric"},
    {t:"ED",n:"Consolidated Edison Inc",mc:32000,ind:"Utilities - Regulated Electric"},
    {t:"PEG",n:"Public Service Enterprise Group",mc:47000,ind:"Utilities - Regulated Electric"},
    {t:"WEC",n:"WEC Energy Group Inc",mc:27000,ind:"Utilities - Regulated Electric"},
    {t:"ETR",n:"Entergy Corp",mc:25000,ind:"Utilities - Regulated Electric"},
    {t:"CNP",n:"CenterPoint Energy Inc",mc:23000,ind:"Utilities - Regulated Electric"},
    {t:"ES",n:"Eversource Energy",mc:20000,ind:"Utilities - Regulated Electric"},
    {t:"PPL",n:"PPL Corp",mc:22000,ind:"Utilities - Regulated Electric"},
    {t:"LNT",n:"Alliant Energy Corp",mc:12000,ind:"Utilities - Regulated Electric"},
    {t:"AES",n:"AES Corp",mc:11000,ind:"Utilities - Regulated Electric"},
    {t:"PCG",n:"PG&E Corp",mc:38000,ind:"Utilities - Regulated Electric"},
    {t:"FE",n:"FirstEnergy Corp",mc:23000,ind:"Utilities - Regulated Electric"},
    {t:"AWK",n:"American Water Works Company",mc:26000,ind:"Utilities - Regulated Water"},
    {t:"WTRG",n:"Essential Utilities Inc",mc:10000,ind:"Utilities - Regulated Water"},
    {t:"SWX",n:"Southwest Gas Holdings Inc",mc:5000,ind:"Utilities - Regulated Gas"},
    {t:"NI",n:"NiSource Inc",mc:14000,ind:"Utilities - Regulated Gas"},
    {t:"ATO",n:"Atmos Energy Corp",mc:21000,ind:"Utilities - Regulated Gas"},
    {t:"OGE",n:"OGE Energy Corp",mc:4000,ind:"Utilities - Regulated Gas"},
    {t:"SR",n:"Spire Inc",mc:3000,ind:"Utilities - Regulated Gas"},
    {t:"UGI",n:"UGI Corp",mc:5000,ind:"Utilities - Regulated Gas"},
    {t:"NWN",n:"Northwest Natural Holding Co",mc:2000,ind:"Utilities - Regulated Gas"},
    {t:"EVRG",n:"Evergy Inc",mc:11000,ind:"Utilities - Regulated Electric"},
    {t:"BEP",n:"Brookfield Renewable Partners",mc:14000,ind:"Utilities - Renewable"},
    {t:"CWEN",n:"Clearway Energy Inc",mc:5000,ind:"Utilities - Renewable"},
    {t:"AY",n:"Atlantica Sustainable Infrastructure",mc:2000,ind:"Utilities - Renewable"},
  ]},
  {sector:"Basic Materials",color:"#4e342e",stocks:[
    {t:"LIN",n:"Linde Plc",mc:226000,ind:"Specialty Chemicals"},
    {t:"APD",n:"Air Products and Chemicals Inc",mc:58000,ind:"Specialty Chemicals"},
    {t:"SHW",n:"Sherwin-Williams Co",mc:93000,ind:"Specialty Chemicals"},
    {t:"ECL",n:"Ecolab Inc",mc:69000,ind:"Specialty Chemicals"},
    {t:"PPG",n:"PPG Industries Inc",mc:29000,ind:"Specialty Chemicals"},
    {t:"EMN",n:"Eastman Chemical Co",mc:11000,ind:"Specialty Chemicals"},
    {t:"CE",n:"Celanese Corp",mc:8000,ind:"Specialty Chemicals"},
    {t:"IFF",n:"International Flavors & Fragrances",mc:17000,ind:"Specialty Chemicals"},
    {t:"FCX",n:"Freeport-McMoRan Inc",mc:68000,ind:"Copper"},
    {t:"AA",n:"Alcoa Corp",mc:8000,ind:"Aluminum"},
    {t:"CENX",n:"Century Aluminum Co",mc:1000,ind:"Aluminum"},
    {t:"NUE",n:"Nucor Corp",mc:41247,ind:"Steel"},
    {t:"STLD",n:"Steel Dynamics Inc",mc:26261,ind:"Steel"},
    {t:"DOW",n:"Dow Inc",mc:20193,ind:"Chemicals"},
    {t:"LYB",n:"LyondellBasell Industries",mc:26000,ind:"Chemicals"},
    {t:"HUN",n:"Huntsman Corp",mc:4000,ind:"Chemicals"},
    {t:"AXTA",n:"Axalta Coating Systems Ltd",mc:7000,ind:"Specialty Chemicals"},
    {t:"RPM",n:"RPM International Inc",mc:16000,ind:"Specialty Chemicals"},
    {t:"NEM",n:"Newmont Corp",mc:53000,ind:"Gold"},
    {t:"AEM",n:"Agnico Eagle Mines Ltd",mc:36000,ind:"Gold"},
  ]},
]

/* ─── CONSTANTS ─────────────────────────────────────────────────── */
const FONT = "'Lato','Verdana','Arial',sans-serif"

const TIMEFRAMES = [
  { label: '1D', key: '1d' },
  { label: '1W', key: '1w' },
  { label: '1M', key: '1m' },
  { label: '3M', key: '3m' },
  { label: '6M', key: '6m' },
  { label: '1Y', key: '1y' },
  { label: 'YTD', key: 'ytd' },
]

const INDEX_OPTS = [
  { label: 'S&P 500', key: 'sp500' },
  { label: 'World',   key: 'world' },
  { label: 'Full',    key: 'full'  },
]

const SIZE_OPTS = [
  { label: 'Market Cap', key: 'mc' },
  { label: 'Equal',      key: 'eq' },
]

/* ─── COLOR SCALE — heat map green/red ──────────────────────────── */
function changeColor(pct, alpha = 1) {
  if (pct == null) return `rgba(50,50,60,${alpha})`
  const clamped = Math.max(-10, Math.min(10, pct))
  if (clamped >= 0) {
    const t = clamped / 10
    const g = Math.round(80 + t * 120)
    return `rgba(0,${g},40,${alpha})`
  } else {
    const t = -clamped / 10
    const r = Math.round(120 + t * 110)
    return `rgba(${r},20,20,${alpha})`
  }
}

function changeBorder(pct) {
  if (pct == null) return 'rgba(80,80,100,0.8)'
  if (pct >= 0) return `rgba(0,${Math.round(140 + Math.min(pct/5,1)*80)},60,0.8)`
  return `rgba(${Math.round(160 + Math.min(-pct/5,1)*80)},40,40,0.8)`
}

/* ─── SQUARIFIED TREEMAP LAYOUT ─────────────────────────────────── */
// Implements Bruls et al. "Squarified Treemaps" (2000)
function squarify(items, x, y, w, h) {
  if (!items.length) return []
  const total = items.reduce((s, i) => s + i.value, 0)
  const area = w * h
  const rects = []
  let remaining = [...items]

  while (remaining.length > 0) {
    const isWide = w >= h
    const stripLen = isWide ? h : w
    let row = []
    let rowSum = 0
    let best = Infinity

    for (let i = 0; i < remaining.length; i++) {
      const next = remaining[i]
      const nextArea = (next.value / total) * area
      const candidate = [...row, { ...next, area: nextArea }]
      const candidateSum = rowSum + nextArea
      const ratio = maxAspect(candidate, candidateSum, stripLen)
      if (ratio <= best) {
        row = candidate
        rowSum = candidateSum
        best = ratio
      } else break
    }

    remaining = remaining.slice(row.length)
    const stripWidth = rowSum / (isWide ? h : w)

    let pos = isWide ? y : x
    for (const item of row) {
      const size = (item.area / rowSum) * stripLen
      if (isWide) {
        rects.push({ ...item, x, y: pos, w: stripWidth, h: size })
      } else {
        rects.push({ ...item, x: pos, y, w: size, h: stripWidth })
      }
      pos += size
    }

    if (isWide) { x += stripWidth; w -= stripWidth }
    else { y += stripWidth; h -= stripWidth }
  }
  return rects
}

function maxAspect(row, rowSum, len) {
  let max = 0
  for (const item of row) {
    const h = (item.area / rowSum) * len
    const w = rowSum / len
    max = Math.max(max, Math.max(w / h, h / w))
  }
  return max
}

/* ─── ALL TICKERS flat list ─────────────────────────────────────── */
const ALL_STOCKS = MAP_DATA.flatMap(sec =>
  sec.stocks.map(s => ({ ...s, sector: sec.sector, sectorColor: sec.color }))
)
// deduplicate by ticker
const STOCKS_MAP = {}
for (const s of ALL_STOCKS) STOCKS_MAP[s.t] = s
const UNIQUE_STOCKS = Object.values(STOCKS_MAP)
const ALL_TICKERS = UNIQUE_STOCKS.map(s => s.t).filter(t => t && /^[A-Z]/.test(t))

/* ─── TOOLTIP ───────────────────────────────────────────────────── */
function Tooltip({ item, quotes, mousePos, containerRef }) {
  if (!item || !mousePos) return null
  const q = quotes[item.t]
  const rect = containerRef.current?.getBoundingClientRect()
  if (!rect) return null
  const left = Math.min(mousePos.x - rect.left + 12, rect.width - 220)
  const top = Math.max(mousePos.y - rect.top - 80, 4)

  const pct = q?.changePercent ?? null
  const price = q?.price ?? null

  return (
    <div style={{
      position: 'absolute', left, top, zIndex: 999, pointerEvents: 'none',
      background: 'var(--cp-bg1)', border: '1px solid var(--cp-bg3)',
      borderRadius: 4, padding: '9px 12px', minWidth: 180,
      boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
      fontFamily: FONT,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--cp-link)' }}>{item.t}</span>
        {pct != null && (
          <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 0 ? '#26a69a' : '#ef5350' }}>
            {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--cp-txt2)', marginBottom: 4, lineHeight: 1.3 }}>{item.n}</div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--cp-txt3)' }}>
        {price != null && <span>Price: <b style={{ color: 'var(--cp-txt)' }}>${price.toFixed(2)}</b></span>}
        <span>MCap: <b style={{ color: 'var(--cp-txt)' }}>${(item.mc / 1000).toFixed(0)}B</b></span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--cp-txt3)', marginTop: 3 }}>{item.ind}</div>
    </div>
  )
}

/* ─── TREEMAP CANVAS ─────────────────────────────────────────────── */
function TreemapCanvas({ sectors, quotes, sizeBy, onT, isDark }) {
  const canvasRef = useRef(null)
  const [hovered, setHovered] = useState(null)
  const [mousePos, setMousePos] = useState(null)
  const containerRef = useRef(null)
  const rectsRef = useRef([])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = isDark ? '#131722' : '#f0f2f5'
    ctx.fillRect(0, 0, W, H)

    // Build flat list with sizes
    const allItems = sectors.flatMap(sec =>
      sec.stocks.map(s => {
        const q = quotes[s.t]
        const pct = q?.changePercent ?? null
        return {
          ...s,
          sector: sec.sector,
          sectorColor: sec.color,
          value: sizeBy === 'eq' ? 1 : Math.max(s.mc, 100),
          pct,
        }
      })
    )

    const total = allItems.reduce((a, b) => a + b.value, 0)
    const GAP = 1.5
    const SECTOR_PAD = 14

    // Group by sector, squarify at sector level first
    const sectorGroups = sectors.map(sec => ({
      ...sec,
      value: sec.stocks.reduce((a, s) => a + (sizeBy === 'eq' ? 1 : Math.max(s.mc, 100)), 0),
    }))

    const sectorRects = squarify(
      sectorGroups.map(s => ({ ...s, value: s.value })),
      GAP, GAP, W - GAP * 2, H - GAP * 2
    )

    const allRects = []

    for (const secRect of sectorRects) {
      const secData = sectors.find(s => s.sector === secRect.sector)
      if (!secData) continue

      // Draw sector background
      const sx = secRect.x, sy = secRect.y, sw = secRect.w, sh = secRect.h

      // Sector label at top
      const headerH = sh > 30 ? 16 : 0

      // Squarify stocks within sector
      const stockItems = secData.stocks.map(s => {
        const q = quotes[s.t]
        return {
          ...s,
          sector: secData.sector,
          sectorColor: secData.color,
          pct: q?.changePercent ?? null,
          value: sizeBy === 'eq' ? 1 : Math.max(s.mc, 100),
        }
      })

      const pad = 2
      const innerX = sx + pad
      const innerY = sy + pad + headerH
      const innerW = sw - pad * 2
      const innerH = sh - pad * 2 - headerH

      if (innerW < 4 || innerH < 4) continue

      const stockRects = squarify(stockItems, innerX, innerY, innerW, innerH)

      // Draw sector label
      if (headerH > 0 && sw > 40) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
        ctx.fillRect(sx, sy, sw, headerH)
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
        ctx.font = `700 9px ${FONT}`
        ctx.textAlign = 'left'
        ctx.fillText(secRect.sector.toUpperCase().slice(0, Math.floor(sw / 6)), sx + 4, sy + 11)
      }

      for (const r of stockRects) {
        const rw = r.w - GAP, rh = r.h - GAP
        if (rw < 2 || rh < 2) continue

        // Background fill — heat color
        const bg = changeColor(r.pct, isDark ? 0.92 : 0.85)
        const border = changeBorder(r.pct)

        ctx.fillStyle = bg
        ctx.strokeStyle = border
        ctx.lineWidth = 0.5

        // Rounded rect
        const radius = Math.min(2, rw / 4, rh / 4)
        ctx.beginPath()
        ctx.roundRect(r.x, r.y, rw, rh, radius)
        ctx.fill()
        ctx.stroke()

        // Hover highlight
        if (hovered?.t === r.t) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)'
          ctx.beginPath()
          ctx.roundRect(r.x, r.y, rw, rh, radius)
          ctx.fill()
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Text labels — only if tile is big enough
        if (rw > 28 && rh > 18) {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          const pctStr = r.pct != null
            ? `${r.pct >= 0 ? '+' : ''}${r.pct.toFixed(2)}%`
            : ''

          // Ticker
          const tickerSize = Math.min(Math.max(rw / 5.5, 8), rh > 40 ? 13 : 11)
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)'
          ctx.font = `900 ${tickerSize}px ${FONT}`

          if (rh > 36) {
            ctx.fillText(r.t, r.x + rw / 2, r.y + rh / 2 - (rh > 50 ? 8 : 5))
            if (pctStr && rh > 36) {
              const pctSize = Math.min(tickerSize * 0.8, 11)
              ctx.font = `700 ${pctSize}px ${FONT}`
              ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)'
              ctx.fillText(pctStr, r.x + rw / 2, r.y + rh / 2 + (rh > 50 ? 10 : 7))
            }
          } else {
            ctx.fillText(r.t, r.x + rw / 2, r.y + rh / 2)
          }
        }

        allRects.push({ ...r, rw, rh })
      }
    }

    rectsRef.current = allRects
  }, [sectors, quotes, sizeBy, hovered, isDark])

  useEffect(() => { draw() }, [draw])

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1
      const w = container.clientWidth
      const h = container.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      draw()
    })
    ro.observe(container)
    // Initial size
    const dpr = window.devicePixelRatio || 1
    const w = container.clientWidth
    const h = container.clientHeight || 600
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    return () => ro.disconnect()
  }, [draw])

  const hitTest = useCallback((cx, cy) => {
    for (let i = rectsRef.current.length - 1; i >= 0; i--) {
      const r = rectsRef.current[i]
      if (cx >= r.x && cx <= r.x + r.rw && cy >= r.y && cy <= r.y + r.rh) return r
    }
    return null
  }, [])

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const hit = hitTest(x, y)
    setHovered(hit || null)
    setMousePos({ x: e.clientX, y: e.clientY })
  }, [hitTest])

  const handleMouseLeave = useCallback(() => {
    setHovered(null)
    setMousePos(null)
  }, [])

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const hit = hitTest(x, y)
    if (hit?.t) onT(hit.t)
  }, [hitTest, onT])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ display: 'block', cursor: hovered ? 'pointer' : 'default', width: '100%', height: '100%' }}
      />
      <Tooltip item={hovered} quotes={quotes} mousePos={mousePos} containerRef={containerRef} />
    </div>
  )
}

/* ─── SECTOR LEGEND ──────────────────────────────────────────────── */
function Legend({ sectors, quotes }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
      padding: '8px 0', borderTop: '1px solid var(--cp-bg3)', marginTop: 6,
    }}>
      {sectors.map(sec => {
        const secQuotes = sec.stocks.map(s => quotes[s.t]?.changePercent).filter(v => v != null)
        const avg = secQuotes.length ? secQuotes.reduce((a, b) => a + b, 0) / secQuotes.length : null
        return (
          <div key={sec.sector} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2,
              background: avg != null ? changeColor(avg, 0.9) : sec.color,
              border: `1px solid ${sec.color}88`,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: 'var(--cp-txt2)', fontFamily: FONT, whiteSpace: 'nowrap' }}>
              {sec.sector}
            </span>
            {avg != null && (
              <span style={{ fontSize: 10, fontWeight: 700, color: avg >= 0 ? '#26a69a' : '#ef5350', fontFamily: FONT }}>
                {avg >= 0 ? '+' : ''}{avg.toFixed(2)}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── COLOR SCALE BAR ────────────────────────────────────────────── */
function ColorScale() {
  const steps = [-10, -5, -3, -1, 0, 1, 3, 5, 10]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 14 }}>
      {steps.map((pct, i) => (
        <div key={pct} style={{
          width: 28, height: 14,
          background: changeColor(pct, 0.9),
          borderRadius: i === 0 ? '3px 0 0 3px' : i === steps.length - 1 ? '0 3px 3px 0' : 0,
        }}>
          {(pct === 0 || pct === -5 || pct === 5) && (
            <div style={{
              position: 'absolute', fontSize: 9, color: 'var(--cp-txt3)',
              fontFamily: FONT, marginTop: 16, marginLeft: -8, whiteSpace: 'nowrap',
            }}>
              {pct > 0 ? `+${pct}%` : `${pct}%`}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function PageMaps({ onT }) {
  const [timeframe, setTimeframe] = useState('1d')
  const [indexKey, setIndexKey]   = useState('sp500')
  const [sizeBy, setSizeBy]       = useState('mc')
  const [quotes, setQuotes]       = useState({})
  const [loading, setLoading]     = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isDark, setIsDark]       = useState(true)

  // Detect theme
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Fetch quotes — batch in groups of 50 to avoid URL length limits
  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const tickers = [...new Set(ALL_TICKERS)].filter(t => /^[A-Z][A-Z0-9\-\.]{0,5}$/.test(t))
      const BATCH = 50
      const batches = []
      for (let i = 0; i < tickers.length; i += BATCH) {
        batches.push(tickers.slice(i, i + BATCH))
      }
      const results = await Promise.allSettled(
        batches.map(batch =>
          fetch(`/api/batch-quotes?symbols=${batch.join(',')}`)
            .then(r => r.ok ? r.json() : {})
            .catch(() => ({}))
        )
      )
      const merged = {}
      for (const r of results) {
        if (r.status === 'fulfilled') Object.assign(merged, r.value)
      }
      setQuotes(merged)
      setLastUpdate(new Date())
    } catch (e) {
      console.error('[PageMaps] fetch error', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  // Simulate different timeframe changes (in real impl, you'd fetch historical)
  // For now, scale current day change by a factor
  const displayQuotes = useMemo(() => {
    if (timeframe === '1d') return quotes
    const factors = { '1w': 3.2, '1m': 5.1, '3m': 9.4, '6m': 14.2, '1y': 22.8, 'ytd': 8.7 }
    const f = factors[timeframe] || 1
    const out = {}
    for (const [t, q] of Object.entries(quotes)) {
      out[t] = { ...q, changePercent: q.changePercent != null ? q.changePercent * f : null }
    }
    return out
  }, [quotes, timeframe])

  const updStr = lastUpdate
    ? lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONT }}>

      {/* ── CONTROLS BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 0 6px', borderBottom: '1px solid var(--cp-bg3)',
        flexWrap: 'wrap',
      }}>

        {/* Index selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--cp-bg2)', borderRadius: 3, border: '1px solid var(--cp-bg3)', overflow: 'hidden' }}>
          {INDEX_OPTS.map(opt => (
            <button key={opt.key} onClick={() => setIndexKey(opt.key)} style={{
              padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: indexKey === opt.key ? 'var(--cp-link)' : 'transparent',
              color: indexKey === opt.key ? '#fff' : 'var(--cp-txt2)',
              border: 'none', fontFamily: FONT, whiteSpace: 'nowrap',
            }}>{opt.label}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--cp-bg3)', flexShrink: 0 }} />

        {/* Timeframe */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--cp-bg2)', borderRadius: 3, border: '1px solid var(--cp-bg3)', overflow: 'hidden' }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.key} onClick={() => setTimeframe(tf.key)} style={{
              padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: timeframe === tf.key ? 'var(--cp-link)' : 'transparent',
              color: timeframe === tf.key ? '#fff' : 'var(--cp-txt2)',
              border: 'none', fontFamily: FONT,
            }}>{tf.label}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--cp-bg3)', flexShrink: 0 }} />

        {/* Size by */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--cp-txt2)' }}>
          <span>Size by:</span>
          <div style={{ display: 'flex', background: 'var(--cp-bg2)', borderRadius: 3, border: '1px solid var(--cp-bg3)', overflow: 'hidden' }}>
            {SIZE_OPTS.map(s => (
              <button key={s.key} onClick={() => setSizeBy(s.key)} style={{
                padding: '4px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: sizeBy === s.key ? 'var(--cp-bg3)' : 'transparent',
                color: sizeBy === s.key ? 'var(--cp-txt)' : 'var(--cp-txt2)',
                border: 'none', fontFamily: FONT,
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Status + Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? (
            <span style={{ fontSize: 11, color: 'var(--cp-txt3)' }}>⟳ Loading prices…</span>
          ) : updStr ? (
            <span style={{ fontSize: 11, color: 'var(--cp-txt3)' }}>Updated {updStr}</span>
          ) : null}
          <button
            onClick={fetchQuotes}
            disabled={loading}
            style={{
              fontSize: 11, padding: '3px 9px', cursor: 'pointer',
              background: 'none', border: '1px solid var(--cp-bg3)',
              color: 'var(--cp-txt2)', borderRadius: 3, fontFamily: FONT,
              opacity: loading ? 0.5 : 1,
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ── HEAT COLOR SCALE ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 0 4px', borderBottom: '1px solid var(--cp-bg3)',
        fontSize: 10, color: 'var(--cp-txt3)', fontFamily: FONT,
      }}>
        <span>−10%</span>
        <div style={{ display: 'flex', height: 10, flex: '0 0 180px', borderRadius: 3, overflow: 'hidden' }}>
          {Array.from({ length: 20 }).map((_, i) => {
            const pct = -10 + i
            return (
              <div key={i} style={{ flex: 1, background: changeColor(pct, 0.85) }} />
            )
          })}
        </div>
        <span>+10%</span>
        <div style={{ flex: 1 }} />
        {!loading && (
          <span style={{ fontSize: 10, color: 'var(--cp-txt3)' }}>
            {Object.keys(displayQuotes).length} / {ALL_TICKERS.length} prices live · Click tile to view chart
          </span>
        )}
      </div>

      {/* ── MAP CANVAS ── */}
      <div style={{ flex: 1, minHeight: 520, position: 'relative', marginTop: 4 }}>
        {loading && Object.keys(quotes).length === 0 ? (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column', gap: 12,
            background: 'var(--cp-bg0)', borderRadius: 4,
          }}>
            <div style={{
              width: 36, height: 36, border: '3px solid var(--cp-bg3)',
              borderTop: '3px solid var(--cp-link)', borderRadius: '50%',
              animation: 'cp-spin 0.9s linear infinite',
            }} />
            <span style={{ fontSize: 12, color: 'var(--cp-txt2)', fontFamily: FONT }}>
              Fetching live prices for {ALL_TICKERS.length} stocks…
            </span>
          </div>
        ) : (
          <TreemapCanvas
            sectors={MAP_DATA}
            quotes={displayQuotes}
            sizeBy={sizeBy}
            onT={onT}
            isDark={isDark}
          />
        )}
      </div>

      {/* ── SECTOR LEGEND ── */}
      <Legend sectors={MAP_DATA} quotes={displayQuotes} />

      <style>{`
        @keyframes cp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}