// ── Merchant pools for realistic transaction generation ───────────

export const EMPLOYERS = {
  standard: [
    'Acme Corporation', 'Metro Transit Authority', 'NY Presbyterian Hospital',
    'Deloitte & Touche LLP', 'Consolidated Edison Co.', 'NYU Langone Health',
    'Bloomberg LP', 'NYC Department of Education', 'Northwell Health',
    'Citigroup Inc.', 'JPMorgan Chase', 'American Express Co.',
    'Verizon Communications', 'Madison Square Garden Co.', 'Related Companies',
  ],
  premium: [
    'Goldman Sachs Group', 'McKinsey & Company', 'Bain & Company',
    'Morgan Stanley', 'BlackRock Inc.', 'Apollo Global Management',
    'KKR & Co.', 'Lazard Ltd.', 'Evercore Inc.',
    'Sidley Austin LLP', 'Sullivan & Cromwell LLP', 'Skadden Arps',
    'Google LLC', 'Meta Platforms Inc.', 'Apple Inc.', 'Amazon.com Inc.',
    'Microsoft Corporation', 'Salesforce Inc.', 'Palantir Technologies',
  ],
  wealthy: [
    'Bridgewater Associates', 'Citadel LLC', 'Renaissance Technologies',
    'Two Sigma Investments', 'DE Shaw & Co.', 'Point72 Asset Management',
    'Millennium Management', 'Elliott Investment Management',
    'Pershing Square Capital', 'Baupost Group',
    'Self-Employed / Consulting', 'Richards Capital Partners',
    'Nexus Ventures LLC', 'Pinnacle Advisors Group',
  ],
  business: [
    'Tech Ventures LLC', 'Summit Holdings Corp.', 'Apex Solutions Inc.',
    'Metro Capital Group', 'Horizon Enterprises', 'Paragon Industries',
    'Vanguard Consulting LLC', 'Meridian Group Ltd.',
  ],
};

export const DINING = {
  standard: [
    'Starbucks', 'Chipotle Mexican Grill', "McDonald's", 'Panera Bread',
    'Shake Shack', 'Sweetgreen', "Chick-fil-A", 'Five Guys',
    "Wendy's", "Domino's Pizza", 'Pizza Hut', 'Subway',
    'Panda Express', 'Raising Cane\'s', 'Jersey Mike\'s Subs',
    'Dunkin\'', 'Tim Hortons', 'The Smith', 'Gregory\'s Coffee',
    'Joe Coffee', 'Blue Bottle Coffee', 'Think Coffee',
    'Num Pang Kitchen', 'Dos Toros Taqueria', 'Dig',
    'Chopt Creative Salad', 'Just Salad', 'Pret A Manger',
    'Boqueria', 'The Meatball Shop', 'Il Buco Alimentari',
    'Westville', 'Community Food & Juice', 'Café Mogador',
  ],
  premium: [
    'Starbucks Reserve', 'Nobu Fifty Seven', 'The Polo Bar',
    'Le Bernardin', 'Eleven Madison Park', 'Momofuku Ko',
    'Per Se', 'Daniel Restaurant', 'Jean-Georges',
    'Carbone', 'Via Carota', 'Don Angie', 'Lilia',
    'Balthazar', 'The NoMad Restaurant', 'Gramercy Tavern',
    'Union Square Cafe', 'Gotham Bar and Grill',
    'Peter Luger Steak House', 'Keens Steakhouse',
    'Raoul\'s', 'Estela', 'Contra', 'Superiority Burger',
    'Levain Bakery', 'Magnolia Bakery', 'Dominique Ansel Bakery',
    'Roberta\'s Pizza', 'Emily Restaurant', 'Lucali',
    'Joe\'s Pizza', 'Di Fara Pizza', 'Juliana\'s Pizza',
  ],
  wealthy: [
    'Le Bernardin', 'Per Se', 'Eleven Madison Park', 'Daniel Restaurant',
    'Jean-Georges', 'Gabriel Kreuther', 'The Modern', 'Aureole',
    'Aquavit', 'Momofuku Ko', 'Masa', 'Chef\'s Table at Brooklyn Fare',
    'Jungsik', 'Atera', 'Sushi Yasuda', 'Nobu', 'Zuma',
    'Cipriani Downtown', 'The Pool', 'The Grill',
    '21 Club', 'Delmonico\'s', 'Keens Steakhouse', 'Smith & Wollensky',
    'Bobby Van\'s Steakhouse', 'Club A Steakhouse',
    'The Mark Restaurant', 'The Lowell Hotel', 'Sant Ambroeus',
    'Maialino', 'Gramercy Tavern', 'Gotham Bar and Grill',
  ],
};

export const GROCERIES = [
  'Whole Foods Market', "Trader Joe's", 'Wegmans', 'Fairway Market',
  'Citarella', "D'Agostino", 'Morton Williams Supermarket',
  'Key Food Supermarkets', 'Stop & Shop', 'Costco Wholesale',
  'BJ\'s Wholesale Club', 'Aldi', 'Lidl', 'Western Beef',
  'Associated Supermarket', 'C-Town Supermarkets', 'Met Food',
  'Bravo Supermarkets', "Gristede's", 'Hannaford Supermarket',
];

export const SHOPPING = {
  everyday: [
    'Amazon.com', 'Amazon.com', 'Amazon.com', // weighted heavier
    'Target', 'Walmart', 'Costco Wholesale',
    'Best Buy', 'Home Depot', "Lowe's",
    'IKEA', 'Bed Bath & Beyond', 'TJ Maxx', 'Marshalls', 'HomeGoods',
    'Old Navy', 'H&M', 'Zara', 'Gap', 'Banana Republic', 'J.Crew',
    'Nike', 'Adidas', 'Foot Locker', 'DSW Shoes',
    'Chewy.com', 'Petco', 'PetSmart',
    'CVS Pharmacy', 'Walgreens', 'Rite Aid',
    'Apple Store', 'B&H Photo Video', 'Adorama',
    'Sephora', 'Ulta Beauty', 'Macy\'s', 'Nordstrom Rack',
    'GameStop', 'Dick\'s Sporting Goods', 'REI Co-op',
  ],
  premium: [
    'Nordstrom', "Bloomingdale's", 'Brooks Brothers', 'Theory',
    'Lululemon Athletica', 'Patagonia', 'Arc\'teryx', 'Allbirds',
    'Away Travel', 'Crate & Barrel', 'Pottery Barn', 'West Elm',
    'Apple Store', 'B&H Photo Video', 'Sonos', 'Bang & Olufsen',
    'Blue Nile Jewelry', 'Warby Parker', 'Bonobos',
    'SoulCycle', 'Equinox Fitness', 'ClassPass',
  ],
  luxury: [
    'Neiman Marcus', 'Saks Fifth Avenue', 'Bergdorf Goodman',
    'Barneys New York', 'Harrods London', 'Net-a-Porter',
    'Louis Vuitton', 'Gucci', 'Prada', 'Hermès', 'Chanel',
    'Bottega Veneta', 'Balenciaga', 'Valentino', 'Saint Laurent',
    'Tiffany & Co.', 'Cartier', 'Van Cleef & Arpels',
    'Rolex Boutique', 'Patek Philippe', 'Audemars Piguet',
    'Porsche Manhattan', 'Ferrari of Manhattan', 'Tesla Motors',
    'Sotheby\'s', "Christie's", 'Phillips Auction',
    'Four Seasons Hotel Boutique', 'Ritz-Carlton Gift Shop',
    'Wine.com', 'Wally\'s Wine', 'Total Wine & More',
  ],
};

export const SUBSCRIPTIONS = {
  standard: [
    { name: 'Netflix', amount: 15.99,  desc: 'Netflix.com' },
    { name: 'Spotify', amount: 9.99,   desc: 'Spotify Premium' },
    { name: 'Apple Services', amount: 9.99, desc: 'Apple One' },
    { name: 'Amazon Prime', amount: 14.99, desc: 'Amazon Prime Membership' },
    { name: 'Hulu', amount: 17.99,     desc: 'Hulu Subscription' },
    { name: 'Disney+', amount: 13.99,  desc: 'Disney+ Streaming' },
    { name: 'HBO Max', amount: 15.99,  desc: 'Max Streaming' },
    { name: 'Microsoft 365', amount: 9.99, desc: 'Microsoft 365 Personal' },
    { name: 'YouTube Premium', amount: 13.99, desc: 'YouTube Premium' },
    { name: 'Audible', amount: 14.95,  desc: 'Audible.com Membership' },
    { name: 'Duolingo Plus', amount: 6.99, desc: 'Duolingo Plus' },
    { name: 'Headspace', amount: 12.99, desc: 'Headspace Meditation' },
  ],
  premium: [
    { name: 'Netflix 4K', amount: 22.99,  desc: 'Netflix Premium' },
    { name: 'Spotify Family', amount: 15.99, desc: 'Spotify Family Plan' },
    { name: 'Apple One Family', amount: 22.95, desc: 'Apple One Family' },
    { name: 'Amazon Prime', amount: 14.99, desc: 'Amazon Prime Membership' },
    { name: 'Hulu No Ads', amount: 17.99, desc: 'Hulu (No Ads)' },
    { name: 'HBO Max', amount: 15.99,  desc: 'Max Streaming' },
    { name: 'Adobe Creative Cloud', amount: 54.99, desc: 'Adobe Creative Cloud' },
    { name: 'Microsoft 365 Family', amount: 12.99, desc: 'Microsoft 365 Family' },
    { name: 'Dropbox Business', amount: 16.58, desc: 'Dropbox Plus' },
    { name: 'Peloton App', amount: 44.00, desc: 'Peloton App Membership' },
    { name: 'Calm Premium', amount: 14.99, desc: 'Calm App Premium' },
    { name: 'New York Times', amount: 17.00, desc: 'NYTimes.com Subscription' },
    { name: 'Wall Street Journal', amount: 38.99, desc: 'WSJ Digital Access' },
    { name: 'ClassPass', amount: 59.00, desc: 'ClassPass Fitness' },
  ],
  wealthy: [
    { name: 'Netflix 4K', amount: 22.99,  desc: 'Netflix Premium' },
    { name: 'Apple One Premier', amount: 32.95, desc: 'Apple One Premier' },
    { name: 'Adobe Creative Cloud', amount: 54.99, desc: 'Adobe Creative Cloud' },
    { name: 'Peloton All-Access', amount: 44.00, desc: 'Peloton All-Access Membership' },
    { name: 'Equinox +', amount: 40.00, desc: 'Equinox+ Fitness' },
    { name: 'New York Times', amount: 17.00, desc: 'NYTimes.com All Access' },
    { name: 'Wall Street Journal', amount: 38.99, desc: 'WSJ Digital Access' },
    { name: 'The Economist', amount: 22.00, desc: 'The Economist Digital' },
    { name: 'Financial Times', amount: 33.99, desc: 'FT.com Premium' },
    { name: 'Bloomberg Terminal', amount: 285.00, desc: 'Bloomberg Professional' },
    { name: 'SiriusXM', amount: 17.99, desc: 'SiriusXM Platinum' },
    { name: 'Bespoke Post', amount: 49.95, desc: 'Bespoke Post Box' },
  ],
  business: [
    { name: 'Zoom Pro', amount: 149.90,   desc: 'Zoom Video Communications' },
    { name: 'Slack Pro', amount: 87.50,   desc: 'Slack Technologies Inc.' },
    { name: 'Google Workspace', amount: 144.00, desc: 'Google Workspace Business' },
    { name: 'Microsoft 365 Business', amount: 22.00, desc: 'Microsoft 365 Business' },
    { name: 'Salesforce', amount: 300.00, desc: 'Salesforce CRM Monthly' },
    { name: 'HubSpot', amount: 800.00,   desc: 'HubSpot Marketing Hub' },
    { name: 'QuickBooks Online', amount: 85.00, desc: 'Intuit QuickBooks Online' },
    { name: 'DocuSign', amount: 45.00,   desc: 'DocuSign Business Pro' },
    { name: 'Dropbox Business', amount: 20.00, desc: 'Dropbox Business Plus' },
    { name: 'Adobe Acrobat', amount: 19.99, desc: 'Adobe Acrobat Pro' },
    { name: 'LinkedIn Recruiter', amount: 899.95, desc: 'LinkedIn Recruiter Lite' },
    { name: 'AWS', amount: 0,   desc: 'Amazon Web Services' }, // variable
    { name: 'Shopify', amount: 105.00,  desc: 'Shopify Advanced Plan' },
  ],
};

export const UTILITIES = [
  { name: 'Con Edison',           desc: 'Con Edison Electric Bill',     category: 'utilities', min: 80,  max: 190 },
  { name: 'National Grid',        desc: 'National Grid Gas Service',     category: 'utilities', min: 40,  max: 140 },
  { name: 'Spectrum',             desc: 'Spectrum Internet & Cable',     category: 'utilities', min: 69,  max: 129 },
  { name: 'Verizon',              desc: 'Verizon Wireless Bill',          category: 'utilities', min: 80,  max: 180 },
  { name: 'T-Mobile',             desc: 'T-Mobile Wireless Plan',         category: 'utilities', min: 75,  max: 155 },
  { name: 'NYC Water Board',      desc: 'NYC Water & Sewer',              category: 'utilities', min: 28,  max: 72 },
  { name: 'PSEG Long Island',     desc: 'PSEG Long Island Electric',      category: 'utilities', min: 90,  max: 200 },
  { name: 'Optimum Online',       desc: 'Optimum Internet Service',       category: 'utilities', min: 65,  max: 115 },
];

export const AIRLINES = [
  'Delta Air Lines', 'American Airlines', 'United Airlines',
  'JetBlue Airways', 'Southwest Airlines', 'Alaska Airlines',
  'British Airways', 'Air France', 'Lufthansa', 'Emirates Airlines',
  'Virgin Atlantic', 'Air Canada', 'KLM Royal Dutch Airlines',
];

export const HOTELS = {
  standard: [
    'Hampton Inn', 'Courtyard by Marriott', 'Hilton Garden Inn',
    'Hyatt Place', 'Embassy Suites', 'Residence Inn',
    'Holiday Inn', 'Best Western', 'La Quinta Inn', 'Marriott Hotels',
  ],
  premium: [
    'Westin Hotels', 'Sheraton Grand', 'Marriott Marquis',
    'JW Marriott', 'Hyatt Regency', 'Kimpton Hotels', 'Loews Hotels',
    'W Hotels', 'Autograph Collection', 'Renaissance Hotels',
  ],
  wealthy: [
    'Four Seasons Hotel', 'Ritz-Carlton', 'St. Regis Hotel',
    'Mandarin Oriental', 'Park Hyatt', 'Peninsula Hotel',
    'Aman Resorts', 'Rosewood Hotels', 'Bulgari Hotel',
    'Waldorf Astoria', 'Baccarat Hotel', '11 Howard',
  ],
};

export const TRANSPORT = [
  'Uber', 'Lyft', 'Via Rideshare', 'NYC Taxi', 'Curb Mobility',
  'Hertz Car Rental', 'Enterprise Rent-A-Car', 'Avis Car Rental',
  'National Car Rental', 'Budget Car Rental', 'Sixt Rent a Car',
];

export const HEALTHCARE = [
  { name: 'CVS Pharmacy',          min: 12,  max: 68  },
  { name: 'Walgreens',             min: 10,  max: 55  },
  { name: 'Rite Aid Pharmacy',     min: 8,   max: 45  },
  { name: 'Duane Reade',           min: 12,  max: 60  },
  { name: 'CityMD Urgent Care',    min: 30,  max: 120 },
  { name: 'GoHealth Urgent Care',  min: 35,  max: 115 },
  { name: 'Quest Diagnostics',     min: 25,  max: 85  },
  { name: 'LabCorp',               min: 20,  max: 75  },
  { name: 'NYU Dental Associates', min: 80,  max: 350 },
  { name: 'VSP Vision Care',       min: 40,  max: 180 },
];

export const FUEL = [
  'Shell Oil', 'ExxonMobil', 'BP Gas Station', 'Sunoco Energy',
  'Citgo Petroleum', 'Getty Petroleum', 'Hess Gas', 'Speedway LLC',
  '76 Gas Station', 'Chevron', 'Wawa', 'QuikTrip',
];

export const ZELLE_CONTACTS = [
  'Sarah M.', 'Mike R.', 'Jessica L.', 'David K.', 'Emily T.',
  'Chris B.', 'Amanda G.', 'James W.', 'Lauren S.', 'Tyler H.',
  'Rachel P.', 'Brian N.', 'Ashley C.', 'Kevin F.', 'Melissa D.',
  'Jason M.', 'Nicole O.', 'Eric V.', 'Stephanie A.', 'Mark Z.',
];

export const BUSINESS_VENDORS = [
  'WeWork Office Space', 'Regus Business Center', 'Industrious',
  'Staples Business Advantage', 'Office Depot Business',
  'FedEx Business Solutions', 'UPS Business Account',
  'Iron Mountain Records', 'Shred-it LLC',
  'Cintas Corporation', 'ServiceMaster Clean',
  'ADP Payroll Services', 'Paychex Inc.', 'Gusto Inc.',
  'Legal Services LLC', 'Accounting Plus LLC',
  'Digital Marketing Agency', 'Web Design Studio',
  'IT Support Services', 'Cloud Solutions Inc.',
  'Insurance Premium Payment', 'Liability Insurance Co.',
];

export const ROUTING_NUMBERS = [
  '021000021', // Chase Manhattan
  '026009593', // Bank of America
  '021000089', // Citibank
  '026013673', // TD Bank
  '031207607', // PNC Bank
  '021100361', // HSBC
  '051405515', // Capital One
  '121000248', // Wells Fargo
];
