// ── ACH / banking-style transaction descriptor formatters ─────────────────────
// Real bank ledgers use terse all-caps ACH strings rather than plain English.
// Formats mirror what Bank of America, Chase, etc. display in their ledgers.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function randDigits(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
}

function mmdd(date) {
  const d = new Date(date);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function clean(str, maxLen = 20) {
  return str.toUpperCase().replace(/[^A-Z0-9 &.*'#-]/g, '').substring(0, maxLen).trim();
}

// US city+state combos used for local merchant transactions
const LOCAL_LOCS = [
  ['ATLANTA', 'GA'], ['DECATUR', 'GA'], ['MARIETTA', 'GA'],
  ['STOCKBRIDGE', 'GA'], ['PEACHTREE CITY', 'GA'], ['ALPHARETTA', 'GA'],
  ['ROSWELL', 'GA'], ['DUNWOODY', 'GA'], ['SANDY SPRINGS', 'GA'],
  ['NORCROSS', 'GA'], ['SMYRNA', 'GA'], ['LAWRENCEVILLE', 'GA'],
  ['AUSTIN', 'TX'], ['HOUSTON', 'TX'], ['DALLAS', 'TX'],
  ['FORT WORTH', 'TX'], ['SAN ANTONIO', 'TX'], ['PLANO', 'TX'],
  ['MIAMI', 'FL'], ['ORLANDO', 'FL'], ['TAMPA', 'FL'],
  ['JACKSONVILLE', 'FL'], ['FORT LAUDERDALE', 'FL'], ['BOCA RATON', 'FL'],
  ['NEW YORK', 'NY'], ['BROOKLYN', 'NY'], ['QUEENS', 'NY'],
  ['BRONX', 'NY'], ['FLUSHING', 'NY'], ['YONKERS', 'NY'],
  ['LOS ANGELES', 'CA'], ['SAN FRANCISCO', 'CA'], ['OAKLAND', 'CA'],
  ['SAN DIEGO', 'CA'], ['SACRAMENTO', 'CA'], ['PASADENA', 'CA'],
  ['CHICAGO', 'IL'], ['NAPERVILLE', 'IL'], ['EVANSTON', 'IL'],
  ['CHARLOTTE', 'NC'], ['RALEIGH', 'NC'], ['DURHAM', 'NC'],
  ['PHOENIX', 'AZ'], ['SCOTTSDALE', 'AZ'], ['TEMPE', 'AZ'],
  ['SEATTLE', 'WA'], ['BELLEVUE', 'WA'], ['TACOMA', 'WA'],
  ['DENVER', 'CO'], ['AURORA', 'CO'], ['BOULDER', 'CO'],
  ['NASHVILLE', 'TN'], ['MEMPHIS', 'TN'], ['KNOXVILLE', 'TN'],
  ['RICHMOND', 'VA'], ['ARLINGTON', 'VA'], ['ALEXANDRIA', 'VA'],
];

// Major airport/hub cities for travel transactions
const TRAVEL_LOCS = [
  ['NEW YORK', 'NY'], ['LOS ANGELES', 'CA'], ['CHICAGO', 'IL'],
  ['MIAMI', 'FL'], ['DALLAS', 'TX'], ['ATLANTA', 'GA'],
  ['SAN FRANCISCO', 'CA'], ['SEATTLE', 'WA'], ['BOSTON', 'MA'],
  ['DENVER', 'CO'], ['LAS VEGAS', 'NV'], ['ORLANDO', 'FL'],
  ['LONDON', 'UK'], ['PARIS', 'FR'], ['CANCUN', 'MX'],
];

// ── Formatter functions ────────────────────────────────────────────────────────

// "AT&T SERVICES DES:PAYROLL ID:251126AB1234 CO ID:XXXXX82655 PPD"
export function achPayroll(employer, date) {
  const emp = clean(employer, 18);
  const yr = String(new Date(date).getFullYear()).slice(2);
  const mo = String(new Date(date).getMonth() + 1).padStart(2, '0');
  const dy = String(new Date(date).getDate()).padStart(2, '0');
  const code = `${yr}${mo}${dy}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${randDigits(4)}`;
  const coId = randDigits(5);
  return `${emp} DES:PAYROLL ID:${code} CO ID:XXXXX${coId} PPD`;
}

// "WHOLE FOODS MKT STO 11/13 PURCHASE DECATUR GA"
export function achGrocery(merchant, date) {
  const name = clean(merchant, 16);
  const [city, state] = pick(LOCAL_LOCS);
  return `${name} STO ${mmdd(date)} PURCHASE ${city} ${state}`;
}

// "MCDONALD'S #34521 11/14 PURCHASE ATLANTA GA"
export function achDining(merchant, date) {
  const name = clean(merchant, 18);
  const code = randDigits(5);
  const [city, state] = pick(LOCAL_LOCS);
  return `${name} #${code} ${mmdd(date)} PURCHASE ${city} ${state}`;
}

// "TARGET #0427 11/08 PURCHASE MARIETTA GA"
export function achShopping(merchant, date) {
  const name = clean(merchant, 18);
  const code = randDigits(4);
  const [city, state] = pick(LOCAL_LOCS);
  return `${name} #${code} ${mmdd(date)} PURCHASE ${city} ${state}`;
}

// "BK OF MOLTEN ATM 11/05 #00004287 MARIETTA GA"
export function achATM(date) {
  const code = randDigits(8).padStart(8, '0');
  const [city, state] = pick(LOCAL_LOCS);
  return `BK OF MOLTEN ATM ${mmdd(date)} #${code} ${city} ${state}`;
}

// "ZELLE PMNT SENT-SARAH M 11/14"
export function achZelleOut(contact, date) {
  const name = contact.toUpperCase().substring(0, 16);
  return `ZELLE PMNT SENT-${name} ${mmdd(date)}`;
}

// "ZELLE PMT RCVD-MIKE R 11/15"
export function achZelleIn(contact, date) {
  const name = contact.toUpperCase().substring(0, 16);
  return `ZELLE PMT RCVD-${name} ${mmdd(date)}`;
}

// "Online Banking transfer to CHK 3580 Confirmation# XXXXX36251"
export function achTransferOut() {
  const last4 = randDigits(4);
  const conf  = randDigits(5);
  return `Online Banking transfer to CHK ${last4} Confirmation# XXXXX${conf}`;
}

// "Online Banking transfer from CHK 3580 Confirmation# XXXXX36251"
export function achTransferIn() {
  const last4 = randDigits(4);
  const conf  = randDigits(5);
  return `Online Banking transfer from CHK ${last4} Confirmation# XXXXX${conf}`;
}

// "NETFLIX.COM 11/01 AUTOPAY"
export function achSubscription(subDesc, date) {
  const name = clean(subDesc, 22);
  return `${name} ${mmdd(date)} AUTOPAY`;
}

// "CON EDISON DES:UTILITY ID:CE1234567 CO ID:XXXXX12345 PPD"
export function achUtility(utilName, date) {
  const name = clean(utilName, 12);
  const prefix = name.replace(/ /g, '').substring(0, 2);
  const id   = `${prefix}${randDigits(7)}`;
  const coId = randDigits(5);
  return `${name} DES:UTILITY ID:${id} CO ID:XXXXX${coId} PPD`;
}

// "SHELL OIL 0574428137 11/05 STOCKBRIDGE GA"
export function achFuel(merchant, date) {
  const name = clean(merchant, 12);
  const code = '0' + randDigits(9);
  const [city, state] = pick(LOCAL_LOCS);
  return `${name} ${code} ${mmdd(date)} ${city} ${state}`;
}

// "DELTA AIR LINES 006-4392104 NEW YORK NY"
export function achAirline(airline, date) {
  const name = clean(airline, 20);
  const code = '00' + randDigits(1) + '-' + randDigits(7);
  const [city, state] = pick(TRAVEL_LOCS);
  return `${name} ${code} ${city} ${state}`;
}

// "MARRIOTT COURTYARD 123456789 ATLANTA GA"
export function achHotel(hotel) {
  const name = clean(hotel, 20);
  const conf = randDigits(9);
  const [city, state] = pick(TRAVEL_LOCS);
  return `${name} ${conf} ${city} ${state}`;
}

// "UBER *TRIP 11/14 SAN FRANCISCO CA"
export function achTransport(merchant, date) {
  const name = clean(merchant, 14);
  const [city, state] = pick(TRAVEL_LOCS);
  return `${name} *TRIP ${mmdd(date)} ${city} ${state}`;
}

// "CVS PHARMACY #7342 11/05 PURCHASE DECATUR GA"
export function achHealthcare(merchant, date) {
  const name = clean(merchant, 16);
  const code = randDigits(4);
  const [city, state] = pick(LOCAL_LOCS);
  return `${name} #${code} ${mmdd(date)} ${city} ${state}`;
}

// "WIRE OUTGOING INTL XXXXX01234"
export function achWireOut() {
  const ref = randDigits(5);
  return `WIRE OUTGOING INTL XXXXX${ref}`;
}

// "INCOMING WIRE TRANSFER XXXXX01234"
export function achWireIn() {
  const ref = randDigits(5);
  return `INCOMING WIRE TRANSFER XXXXX${ref}`;
}

// "MORTGAGE PMT DES:MORTGPMT CO ID:XXXXX12345 PPD"
export function achMortgage() {
  const coId = randDigits(5);
  return `MORTGAGE PMT DES:MORTGPMT CO ID:XXXXX${coId} PPD`;
}

// "RENT PAYMENT 11/01 Confirmation# XXXXX12345"
export function achRent(date) {
  const conf = randDigits(5);
  return `RENT PAYMENT ${mmdd(date)} Confirmation# XXXXX${conf}`;
}

// "MOBILE CHECK DEPOSIT 05/11 XXXXX48461"
export function achMobileDeposit(date) {
  const ref = randDigits(5);
  return `MOBILE CHECK DEPOSIT ${mmdd(date)} XXXXX${ref}`;
}

// "INTEREST CREDIT"
export const achInterest = () => 'INTEREST CREDIT';

// "TRANSFER TO SAVINGS Confirmation# XXXXX12345"
export function achSavingsTransfer(date) {
  const conf = randDigits(5);
  return `TRANSFER TO SAVINGS ${mmdd(date)} Confirmation# XXXXX${conf}`;
}

// "TRANSFER FROM CHECKING Confirmation# XXXXX12345"
export function achCheckingTransfer(date) {
  const conf = randDigits(5);
  return `TRANSFER FROM CHECKING ${mmdd(date)} Confirmation# XXXXX${conf}`;
}
