// Searchable directory of major US billers for Bill Pay
// Each entry: id, name, category, aliases (for fuzzy matching)

export const BILL_PAY_COMPANIES = [
  // ── Electric / Gas Utilities ──────────────────────────────────────
  { id: 'duke-energy',       name: 'Duke Energy',              category: 'utility',      aliases: ['Duke Electric', 'Duke Power'] },
  { id: 'georgia-power',     name: 'Georgia Power',            category: 'utility',      aliases: ['GP', 'Southern Company GA'] },
  { id: 'fpl',               name: 'Florida Power & Light',    category: 'utility',      aliases: ['FPL', 'NextEra Energy'] },
  { id: 'pge',               name: 'Pacific Gas & Electric',   category: 'utility',      aliases: ['PG&E', 'PGE'] },
  { id: 'con-edison',        name: 'Con Edison',               category: 'utility',      aliases: ['ConEd', 'Consolidated Edison'] },
  { id: 'dominion-energy',   name: 'Dominion Energy',          category: 'utility',      aliases: ['Dominion Virginia Power', 'Dominion'] },
  { id: 'xcel-energy',       name: 'Xcel Energy',              category: 'utility',      aliases: ['Xcel', 'Northern States Power'] },
  { id: 'southern-company',  name: 'Southern Company',         category: 'utility',      aliases: ['Southern Co'] },
  { id: 'evergy',            name: 'Evergy',                   category: 'utility',      aliases: ['Kansas City Power', 'KCP&L'] },
  { id: 'ameren',            name: 'Ameren',                   category: 'utility',      aliases: ['Ameren Missouri', 'Ameren Illinois'] },
  { id: 'entergy',           name: 'Entergy',                  category: 'utility',      aliases: ['Entergy Louisiana', 'Entergy Texas'] },
  { id: 'pseg',              name: 'PSEG',                     category: 'utility',      aliases: ['Public Service Enterprise', 'PSE&G'] },
  { id: 'centerpoint',       name: 'CenterPoint Energy',       category: 'utility',      aliases: ['CenterPoint', 'Center Point'] },
  { id: 'eversource',        name: 'Eversource Energy',        category: 'utility',      aliases: ['Eversource', 'NSTAR'] },
  { id: 'national-grid',     name: 'National Grid',            category: 'utility',      aliases: ['Niagara Mohawk', 'New England Gas'] },
  { id: 'ppl-electric',      name: 'PPL Electric Utilities',   category: 'utility',      aliases: ['PPL Electric', 'PPL'] },
  { id: 'dte-energy',        name: 'DTE Energy',               category: 'utility',      aliases: ['DTE', 'Detroit Edison'] },
  { id: 'consumers-energy',  name: 'Consumers Energy',         category: 'utility',      aliases: ['Consumers Power'] },
  { id: 'aep',               name: 'American Electric Power',  category: 'utility',      aliases: ['AEP', 'AEP Ohio', 'AEP Texas'] },
  { id: 'firstenergy',       name: 'FirstEnergy',              category: 'utility',      aliases: ['First Energy', 'Ohio Edison', 'Jersey Central'] },
  { id: 'nicor-gas',         name: 'Nicor Gas',                category: 'utility',      aliases: ['Nicor', 'Southern Union'] },
  { id: 'peoples-gas',       name: "People's Gas",             category: 'utility',      aliases: ['Peoples Gas', 'Peoples Energy'] },
  { id: 'spire-energy',      name: 'Spire Energy',             category: 'utility',      aliases: ['Spire', 'Laclede Gas'] },
  { id: 'atmos-energy',      name: 'Atmos Energy',             category: 'utility',      aliases: ['Atmos'] },
  { id: 'sempra-energy',     name: 'Sempra Energy',            category: 'utility',      aliases: ['San Diego Gas', 'SDG&E', 'SoCalGas'] },

  // ── Water Utilities ───────────────────────────────────────────────
  { id: 'american-water',    name: 'American Water',           category: 'utility',      aliases: ['American Water Works', 'NJ American Water'] },
  { id: 'essential-utilities',name: 'Essential Utilities',     category: 'utility',      aliases: ['Aqua America', 'Aqua Pennsylvania'] },
  { id: 'california-water',  name: 'California Water Service', category: 'utility',      aliases: ['Cal Water', 'CWS'] },
  { id: 'york-water',        name: 'York Water',               category: 'utility',      aliases: [] },

  // ── Internet / Cable / Satellite ──────────────────────────────────
  { id: 'comcast-xfinity',   name: 'Comcast Xfinity',          category: 'internet',     aliases: ['Xfinity', 'Comcast Cable', 'Comcast Internet'] },
  { id: 'spectrum',          name: 'Spectrum',                  category: 'internet',     aliases: ['Charter Communications', 'Charter Spectrum', 'Time Warner Cable'] },
  { id: 'cox-communications',name: 'Cox Communications',        category: 'internet',     aliases: ['Cox Cable', 'Cox Internet'] },
  { id: 'att-internet',      name: 'AT&T Internet',            category: 'internet',     aliases: ['AT&T DSL', 'AT&T Fiber', 'ATT Internet', 'AT&T Broadband'] },
  { id: 'verizon-fios',      name: 'Verizon Fios',             category: 'internet',     aliases: ['Fios', 'Verizon Home Internet'] },
  { id: 'frontier',          name: 'Frontier Communications',  category: 'internet',     aliases: ['Frontier Fiber', 'Frontier DSL'] },
  { id: 'directv',           name: 'DirecTV',                  category: 'internet',     aliases: ['Direct TV', 'AT&T DirecTV'] },
  { id: 'dish-network',      name: 'DISH Network',             category: 'internet',     aliases: ['Dish', 'DISH'] },
  { id: 'earthlink',         name: 'EarthLink',                category: 'internet',     aliases: ['Earth Link'] },
  { id: 'windstream',        name: 'Windstream',               category: 'internet',     aliases: [] },
  { id: 'mediacom',          name: 'Mediacom',                 category: 'internet',     aliases: ['Mediacom Cable'] },
  { id: 'optimum',           name: 'Optimum',                  category: 'internet',     aliases: ['Altice', 'Cablevision'] },
  { id: 'consolidated-comm', name: 'Consolidated Communications', category: 'internet',  aliases: ['Consolidated Comm'] },

  // ── Mobile / Wireless ─────────────────────────────────────────────
  { id: 'verizon-wireless',  name: 'Verizon Wireless',         category: 'phone',        aliases: ['Verizon', 'VZW', 'Verizon Cell'] },
  { id: 'att-wireless',      name: 'AT&T Wireless',            category: 'phone',        aliases: ['AT&T Mobile', 'ATT Wireless', 'AT&T Cell'] },
  { id: 't-mobile',          name: 'T-Mobile',                 category: 'phone',        aliases: ['TMobile', 'T Mobile', 'Sprint', 'Sprint T-Mobile'] },
  { id: 'us-cellular',       name: 'US Cellular',              category: 'phone',        aliases: ['United States Cellular', 'USC'] },
  { id: 'cricket-wireless',  name: 'Cricket Wireless',         category: 'phone',        aliases: ['Cricket'] },
  { id: 'boost-mobile',      name: 'Boost Mobile',             category: 'phone',        aliases: ['Boost'] },
  { id: 'mint-mobile',       name: 'Mint Mobile',              category: 'phone',        aliases: ['Mint'] },
  { id: 'metro-pcs',         name: 'Metro by T-Mobile',        category: 'phone',        aliases: ['MetroPCS', 'Metro PCS'] },

  // ── Auto Insurance ────────────────────────────────────────────────
  { id: 'state-farm',        name: 'State Farm Insurance',     category: 'insurance',    aliases: ['State Farm'] },
  { id: 'geico',             name: 'GEICO',                    category: 'insurance',    aliases: ['Geico', 'Government Employees Insurance'] },
  { id: 'progressive',       name: 'Progressive Insurance',    category: 'insurance',    aliases: ['Progressive', 'Flo Insurance'] },
  { id: 'allstate',          name: 'Allstate Insurance',       category: 'insurance',    aliases: ['Allstate'] },
  { id: 'nationwide',        name: 'Nationwide Insurance',     category: 'insurance',    aliases: ['Nationwide'] },
  { id: 'usaa',              name: 'USAA Insurance',           category: 'insurance',    aliases: ['USAA'] },
  { id: 'liberty-mutual',    name: 'Liberty Mutual',           category: 'insurance',    aliases: ['Liberty Insurance'] },
  { id: 'travelers',         name: 'Travelers Insurance',      category: 'insurance',    aliases: ['Travelers'] },
  { id: 'amica',             name: 'Amica Mutual Insurance',   category: 'insurance',    aliases: ['Amica'] },
  { id: 'farmers',           name: 'Farmers Insurance',        category: 'insurance',    aliases: ['Farmers'] },
  { id: 'erie-insurance',    name: 'Erie Insurance',           category: 'insurance',    aliases: ['Erie'] },
  { id: 'auto-club',         name: 'AAA Insurance',            category: 'insurance',    aliases: ['AAA', 'Auto Club', 'American Automobile'] },

  // ── Health Insurance ──────────────────────────────────────────────
  { id: 'kaiser',            name: 'Kaiser Permanente',        category: 'insurance',    aliases: ['Kaiser Health', 'Kaiser HMO'] },
  { id: 'cigna',             name: 'Cigna Health',             category: 'insurance',    aliases: ['Cigna'] },
  { id: 'blue-cross',        name: 'Blue Cross Blue Shield',   category: 'insurance',    aliases: ['BCBS', 'BlueCross', 'Anthem Blue Cross'] },
  { id: 'united-healthcare', name: 'UnitedHealthcare',         category: 'insurance',    aliases: ['United Health', 'UHC'] },
  { id: 'aetna',             name: 'Aetna Health',             category: 'insurance',    aliases: ['Aetna'] },
  { id: 'humana',            name: 'Humana',                   category: 'insurance',    aliases: [] },
  { id: 'molina',            name: 'Molina Healthcare',        category: 'insurance',    aliases: ['Molina'] },
  { id: 'centene',           name: 'Centene',                  category: 'insurance',    aliases: [] },

  // ── Credit Cards ──────────────────────────────────────────────────
  { id: 'chase-credit',      name: 'Chase Credit Card',        category: 'credit-card',  aliases: ['Chase', 'JPMorgan Chase', 'Chase Sapphire', 'Chase Freedom'] },
  { id: 'capital-one',       name: 'Capital One',              category: 'credit-card',  aliases: ['CapOne', 'Capital One Card'] },
  { id: 'citi-card',         name: 'Citi Credit Card',         category: 'credit-card',  aliases: ['Citibank', 'Citi', 'Citicorp'] },
  { id: 'discover-card',     name: 'Discover Card',            category: 'credit-card',  aliases: ['Discover', 'Discover Financial'] },
  { id: 'amex',              name: 'American Express',         category: 'credit-card',  aliases: ['Amex', 'AmEx Card'] },
  { id: 'us-bank-credit',    name: 'U.S. Bank Credit Card',    category: 'credit-card',  aliases: ['US Bank', 'USB Credit'] },
  { id: 'wells-fargo-credit',name: 'Wells Fargo Credit Card',  category: 'credit-card',  aliases: ['Wells Fargo', 'WF Credit'] },
  { id: 'synchrony-bank',    name: 'Synchrony Bank',           category: 'credit-card',  aliases: ['Synchrony', 'GE Capital Retail'] },
  { id: 'barclays-card',     name: 'Barclays Credit Card',     category: 'credit-card',  aliases: ['Barclays', 'Barclaycard'] },
  { id: 'td-bank-credit',    name: 'TD Bank Credit Card',      category: 'credit-card',  aliases: ['TD Bank', 'TD Credit'] },
  { id: 'navy-federal',      name: 'Navy Federal Credit Union', category: 'credit-card', aliases: ['Navy Federal', 'NFCU'] },
  { id: 'apple-card',        name: 'Apple Card',               category: 'credit-card',  aliases: ['Apple Card Goldman', 'Goldman Sachs Apple'] },

  // ── Mortgage / Housing ────────────────────────────────────────────
  { id: 'rocket-mortgage',   name: 'Rocket Mortgage',          category: 'mortgage',     aliases: ['Quicken Loans', 'Rocket Loans'] },
  { id: 'wells-fargo-home',  name: 'Wells Fargo Home Mortgage', category: 'mortgage',    aliases: ['Wells Fargo Mortgage', 'WF Home'] },
  { id: 'pnc-mortgage',      name: 'PNC Mortgage',             category: 'mortgage',     aliases: ['PNC Home Lending'] },
  { id: 'usbank-home',       name: 'U.S. Bank Home Mortgage',  category: 'mortgage',     aliases: ['US Bank Mortgage'] },
  { id: 'freedom-mortgage',  name: 'Freedom Mortgage',         category: 'mortgage',     aliases: ['Freedom Home'] },
  { id: 'loanDepot',         name: 'loanDepot',                category: 'mortgage',     aliases: ['Loan Depot'] },
  { id: 'pennymac',          name: 'PennyMac',                 category: 'mortgage',     aliases: ['Penny Mac'] },
  { id: 'mr-cooper',         name: 'Mr. Cooper',               category: 'mortgage',     aliases: ['Nationstar', 'Mr Cooper Mortgage'] },
  { id: 'flagstar-bank',     name: 'Flagstar Bank',            category: 'mortgage',     aliases: ['Flagstar Mortgage'] },
  { id: 'bof-home-loans',    name: 'Bank of America Home Loans', category: 'mortgage',   aliases: ['BOA Mortgage', 'BofA Home'] },
  { id: 'suntrust-mortgage', name: 'Truist Mortgage',          category: 'mortgage',     aliases: ['SunTrust Mortgage', 'BB&T Home Loans', 'Truist Home'] },

  // ── Auto Loans ────────────────────────────────────────────────────
  { id: 'chase-auto',        name: 'Chase Auto Finance',       category: 'auto',         aliases: ['Chase Auto Loan', 'Chase Car Loan'] },
  { id: 'capital-one-auto',  name: 'Capital One Auto Finance', category: 'auto',         aliases: ['Cap One Auto'] },
  { id: 'ally-financial',    name: 'Ally Auto',                category: 'auto',         aliases: ['Ally Financial', 'Ally Bank Auto'] },
  { id: 'gm-financial',      name: 'GM Financial',             category: 'auto',         aliases: ['General Motors Financial', 'AmeriCredit'] },
  { id: 'ford-motor-credit', name: 'Ford Motor Credit',        category: 'auto',         aliases: ['Ford Credit', 'Ford Loan'] },
  { id: 'toyota-financial',  name: 'Toyota Financial Services', category: 'auto',        aliases: ['Toyota Credit', 'Toyota Loan'] },
  { id: 'honda-financial',   name: 'Honda Financial Services', category: 'auto',         aliases: ['Honda Credit', 'AHFC'] },
  { id: 'hyundai-motor',     name: 'Hyundai Motor Finance',    category: 'auto',         aliases: ['Hyundai Finance'] },
  { id: 'nissan-motor',      name: 'Nissan Motor Acceptance',  category: 'auto',         aliases: ['Nissan Finance', 'NMAC'] },
  { id: 'usaa-auto',         name: 'USAA Auto Loan',           category: 'auto',         aliases: ['USAA Car Loan'] },

  // ── Student Loans ─────────────────────────────────────────────────
  { id: 'navient',           name: 'Navient',                  category: 'student-loan', aliases: ['Navient Student Loans', 'Sallie Mae Navient'] },
  { id: 'nelnet',            name: 'Nelnet',                   category: 'student-loan', aliases: ['Nelnet Student Loans'] },
  { id: 'mohela',            name: 'MOHELA',                   category: 'student-loan', aliases: ['Missouri Higher Education', 'MOHELA Student'] },
  { id: 'aidvantage',        name: 'Aidvantage',               category: 'student-loan', aliases: ['Maximus Aidvantage'] },
  { id: 'edfinancial',       name: 'EdFinancial',              category: 'student-loan', aliases: ['Educational Financial Services'] },
  { id: 'great-lakes',       name: 'Great Lakes',              category: 'student-loan', aliases: ['Great Lakes Educational', 'GLHEC'] },
  { id: 'sofi-student',      name: 'SoFi Student Loans',       category: 'student-loan', aliases: ['SoFi', 'Social Finance Student'] },
  { id: 'college-ave',       name: 'College Ave Student Loans', category: 'student-loan',aliases: ['College Avenue'] },
  { id: 'sallie-mae',        name: 'Sallie Mae',               category: 'student-loan', aliases: ['SLM Corporation', 'Smart Option'] },

  // ── Government / Tax ──────────────────────────────────────────────
  { id: 'irs',               name: 'Internal Revenue Service', category: 'government',   aliases: ['IRS', 'IRS Tax Payment', 'Federal Tax'] },
  { id: 'irs-direct-pay',    name: 'IRS Direct Pay',           category: 'government',   aliases: ['IRS Direct', 'IRS Online'] },
  { id: 'dmv',               name: 'DMV',                      category: 'government',   aliases: ['Department of Motor Vehicles', 'DMV Registration', 'Vehicle Registration'] },
  { id: 'us-treasury',       name: 'U.S. Treasury',            category: 'government',   aliases: ['Treasury Department', 'TreasuryDirect'] },
  { id: 'social-security',   name: 'Social Security Administration', category: 'government', aliases: ['SSA', 'Social Security'] },
  { id: 'usps',              name: 'USPS',                     category: 'government',   aliases: ['United States Postal Service', 'Post Office', 'US Mail'] },

  // ── Subscriptions / Streaming ─────────────────────────────────────
  { id: 'netflix',           name: 'Netflix',                  category: 'subscription', aliases: ['Netflix Streaming'] },
  { id: 'spotify',           name: 'Spotify',                  category: 'subscription', aliases: ['Spotify Premium'] },
  { id: 'amazon-prime',      name: 'Amazon Prime',             category: 'subscription', aliases: ['Amazon', 'Prime Membership'] },
  { id: 'hulu',              name: 'Hulu',                     category: 'subscription', aliases: ['Hulu Plus', 'Disney Hulu'] },
  { id: 'disney-plus',       name: 'Disney+',                  category: 'subscription', aliases: ['Disney Plus', 'Disney Plus Streaming'] },
  { id: 'apple-services',    name: 'Apple Services',           category: 'subscription', aliases: ['Apple One', 'iCloud', 'Apple TV+'] },
  { id: 'youtube-premium',   name: 'YouTube Premium',          category: 'subscription', aliases: ['YouTube Music', 'Google YouTube'] },
  { id: 'hbo-max',           name: 'Max (HBO)',                category: 'subscription', aliases: ['HBO Max', 'HBO', 'Warner Bros Discovery'] },
  { id: 'peloton',           name: 'Peloton',                  category: 'subscription', aliases: ['Peloton Membership'] },
  { id: 'gym-membership',    name: 'Planet Fitness',           category: 'subscription', aliases: ['Planet Fit'] },
  { id: 'xfinity-mobile',    name: 'Xfinity Mobile',          category: 'subscription', aliases: ['Comcast Mobile'] },

  // ── Medical / Healthcare ──────────────────────────────────────────
  { id: 'labcorp',           name: 'Labcorp',                  category: 'medical',      aliases: ['Laboratory Corporation', 'Lab Corp'] },
  { id: 'quest-diagnostics', name: 'Quest Diagnostics',        category: 'medical',      aliases: ['Quest Labs'] },
  { id: 'mayo-clinic',       name: 'Mayo Clinic',              category: 'medical',      aliases: [] },
  { id: 'cleveland-clinic',  name: 'Cleveland Clinic',         category: 'medical',      aliases: [] },
  { id: 'hca-healthcare',    name: 'HCA Healthcare',           category: 'medical',      aliases: ['HCA', 'Hospital Corporation'] },
  { id: 'cvs-health',        name: 'CVS Health',               category: 'medical',      aliases: ['CVS Pharmacy', 'CVS'] },
  { id: 'walgreens',         name: 'Walgreens',                category: 'medical',      aliases: ['Walgreen Co', 'WAG'] },
  { id: 'rite-aid',          name: 'Rite Aid',                 category: 'medical',      aliases: ['RiteAid'] },

  // ── Retail / Department Stores ────────────────────────────────────
  { id: 'amazon-store',      name: 'Amazon Store Card',        category: 'credit-card',  aliases: ['Amazon Retail Card', 'Amazon Credit'] },
  { id: 'walmart-credit',    name: 'Walmart Credit Card',      category: 'credit-card',  aliases: ['Walmart Card', 'Walmart Synchrony'] },
  { id: 'target-redcard',    name: 'Target RedCard',           category: 'credit-card',  aliases: ['Target Card', 'Target Credit Card'] },
  { id: 'home-depot-credit', name: 'The Home Depot Credit',    category: 'credit-card',  aliases: ['Home Depot Card'] },
  { id: 'lowes-credit',      name: "Lowe's Credit Card",       category: 'credit-card',  aliases: ['Lowes Credit', "Lowe's Card"] },
  { id: 'costco-credit',     name: 'Costco Anywhere Visa',     category: 'credit-card',  aliases: ['Costco Credit', 'Costco Visa'] },
  { id: 'kohls-credit',      name: "Kohl's Credit Card",       category: 'credit-card',  aliases: ['Kohls Card'] },
  { id: 'jcpenney-credit',   name: 'JCPenney Credit Card',     category: 'credit-card',  aliases: ['JCP Credit'] },
  { id: 'macys-credit',      name: "Macy's Credit Card",       category: 'credit-card',  aliases: ['Macys Card', 'Bloomingdales Credit'] },
  { id: 'best-buy-credit',   name: 'Best Buy Credit Card',     category: 'credit-card',  aliases: ['Best Buy Card', 'My Best Buy Visa'] },

  // ── Banking / Financial ───────────────────────────────────────────
  { id: 'chase-bank',        name: 'Chase Bank',               category: 'other',        aliases: ['JPMorgan Chase Bank', 'Chase Checking'] },
  { id: 'wells-fargo-bank',  name: 'Wells Fargo',              category: 'other',        aliases: ['Wells Fargo Bank', 'WF Bank'] },
  { id: 'bac',               name: 'Bank of America',          category: 'other',        aliases: ['BOA', 'BofA'] },
  { id: 'citi-bank',         name: 'Citibank',                 category: 'other',        aliases: ['Citi Bank', 'Citicorp'] },
  { id: 'us-bank',           name: 'U.S. Bank',                category: 'other',        aliases: ['US Bancorp', 'USB'] },
  { id: 'pnc-bank',          name: 'PNC Bank',                 category: 'other',        aliases: ['PNC Financial'] },
  { id: 'td-bank',           name: 'TD Bank',                  category: 'other',        aliases: ['Toronto-Dominion', 'TD Ameritrade'] },
  { id: 'regions-bank',      name: 'Regions Bank',             category: 'other',        aliases: ['Regions Financial'] },
  { id: 'suntrust',          name: 'Truist Bank',              category: 'other',        aliases: ['SunTrust', 'BB&T', 'Truist Financial'] },
  { id: 'fifth-third',       name: 'Fifth Third Bank',         category: 'other',        aliases: ['5/3 Bank', 'Fifth Third'] },
  { id: 'key-bank',          name: 'KeyBank',                  category: 'other',        aliases: ['Key Bank', 'KeyCorp'] },
  { id: 'synovus',           name: 'Synovus Financial',        category: 'other',        aliases: ['Synovus'] },

  // ── Personal Finance / Lending ────────────────────────────────────
  { id: 'sofi',              name: 'SoFi',                     category: 'other',        aliases: ['Social Finance', 'SoFi Money'] },
  { id: 'marcus',            name: 'Marcus by Goldman Sachs',  category: 'other',        aliases: ['Marcus Goldman', 'Goldman Sachs Marcus'] },
  { id: 'lending-club',      name: 'LendingClub',              category: 'other',        aliases: ['Lending Club'] },
  { id: 'prosper',           name: 'Prosper Marketplace',      category: 'other',        aliases: ['Prosper Loans', 'Prosper'] },
  { id: 'affirm',            name: 'Affirm',                   category: 'other',        aliases: ['Affirm Buy Now'] },
  { id: 'klarna',            name: 'Klarna',                   category: 'other',        aliases: [] },
  { id: 'afterpay',          name: 'Afterpay',                 category: 'other',        aliases: ['After Pay'] },
  { id: 'paypal-credit',     name: 'PayPal Credit',            category: 'credit-card',  aliases: ['PayPal Credit Card', 'Bill Me Later'] },

  // ── Rent / Property ───────────────────────────────────────────────
  { id: 'renttrack',         name: 'RentTrack',                category: 'rent',         aliases: ['Rent Track'] },
  { id: 'property-mgmt',     name: 'Property Management Company', category: 'rent',      aliases: ['Property Manager', 'Rent Payment'] },
  { id: 'greystar',          name: 'Greystar',                 category: 'rent',         aliases: ['Greystar Real Estate'] },
  { id: 'equity-residential',name: 'Equity Residential',       category: 'rent',         aliases: ['EQR', 'Equity Apartments'] },
  { id: 'aimco',             name: 'Apartment Investment & Management', category: 'rent', aliases: ['AIMCO', 'Aimco Apartments'] },
  { id: 'camden-property',   name: 'Camden Property Trust',    category: 'rent',         aliases: ['Camden Apartments'] },
  { id: 'essex-property',    name: 'Essex Property Trust',     category: 'rent',         aliases: ['Essex Apartments'] },
  { id: 'avalonbay',         name: 'AvalonBay Communities',    category: 'rent',         aliases: ['Avalon', 'AVB Apartments'] },

  // ── Child Care / Education ────────────────────────────────────────
  { id: 'bright-horizons',   name: 'Bright Horizons',          category: 'other',        aliases: ['Bright Horizons Child Care'] },
  { id: 'kindercare',        name: 'KinderCare',               category: 'other',        aliases: ['Kinder Care'] },
  { id: 'learning-care',     name: 'Learning Care Group',      category: 'other',        aliases: [] },
  { id: 'tuition',           name: 'University Tuition Payment', category: 'other',      aliases: ['College Tuition', 'University Payment'] },

  // ── Food / Grocery ────────────────────────────────────────────────
  { id: 'fresh-direct',      name: 'FreshDirect',              category: 'subscription', aliases: ['Fresh Direct'] },
  { id: 'amazon-fresh',      name: 'Amazon Fresh',             category: 'subscription', aliases: [] },
  { id: 'hello-fresh',       name: 'HelloFresh',               category: 'subscription', aliases: ['Hello Fresh', 'Green Chef'] },

  // ── Security / Smart Home ─────────────────────────────────────────
  { id: 'adt',               name: 'ADT Security',             category: 'subscription', aliases: ['ADT Home Security', 'ADT Monitoring'] },
  { id: 'ring',              name: 'Ring Alarm',               category: 'subscription', aliases: ['Ring Home Security', 'Amazon Ring'] },
  { id: 'vivint',            name: 'Vivint Smart Home',        category: 'subscription', aliases: ['Vivint Security'] },
  { id: 'simplisafe',        name: 'SimpliSafe',               category: 'subscription', aliases: ['Simpli Safe'] },
  { id: 'brinks',            name: 'Brinks Home',              category: 'subscription', aliases: ['Brinks Security', 'Monitronics'] },

  // ── Pet / Veterinary ─────────────────────────────────────────────
  { id: 'healthy-paws',      name: 'Healthy Paws Pet Insurance', category: 'insurance',  aliases: ['Healthy Paws'] },
  { id: 'nationwide-pet',    name: 'Nationwide Pet Insurance', category: 'insurance',    aliases: ['Nationwide Pets'] },
  { id: 'trupanion',         name: 'Trupanion',                category: 'insurance',    aliases: [] },

  // ── Travel / Transportation ───────────────────────────────────────
  { id: 'e-zpass',           name: 'E-ZPass',                  category: 'other',        aliases: ['EZPass', 'E-Z Pass', 'Tollway'] },
  { id: 'sunpass',           name: 'SunPass',                  category: 'other',        aliases: ['Sun Pass Florida'] },
  { id: 'fastrak',           name: 'FasTrak',                  category: 'other',        aliases: ['Fast Trak CA Toll'] },

  // ── Energy / Solar ────────────────────────────────────────────────
  { id: 'sunrun',            name: 'Sunrun',                   category: 'utility',      aliases: ['Sun Run Solar'] },
  { id: 'sunpower',          name: 'SunPower',                 category: 'utility',      aliases: ['Sun Power Solar'] },
  { id: 'tesla-energy',      name: 'Tesla Energy',             category: 'utility',      aliases: ['Tesla Solar', 'Tesla Powerwall'] },
  { id: 'sunnova',           name: 'Sunnova',                  category: 'utility',      aliases: [] },
];

// ── Category display labels ───────────────────────────────────────
export const CATEGORY_LABELS = {
  utility:      'Utility',
  internet:     'Internet & Cable',
  phone:        'Phone & Wireless',
  insurance:    'Insurance',
  'credit-card':'Credit Card',
  mortgage:     'Mortgage',
  auto:         'Auto',
  'student-loan':'Student Loan',
  government:   'Government',
  subscription: 'Subscription',
  medical:      'Medical',
  rent:         'Rent',
  other:        'Other',
};

// ── Instant fuzzy search — runs client-side, no network round-trip ─
export function searchCompanies(query) {
  const q = query.toLowerCase().trim();
  if (q.length < 1) return [];

  const scored = BILL_PAY_COMPANIES
    .map((c) => {
      const name = c.name.toLowerCase();
      const aliases = (c.aliases || []).map((a) => a.toLowerCase());
      let score = 0;

      if (name === q)                            score = 100; // exact
      else if (name.startsWith(q))               score = 80;  // prefix
      else if (name.includes(q))                 score = 60;  // substring
      else if (aliases.some((a) => a.startsWith(q))) score = 50;
      else if (aliases.some((a) => a.includes(q)))   score = 30;

      return { company: c, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((r) => r.company);

  return scored;
}
