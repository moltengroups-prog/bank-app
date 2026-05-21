import User from '../../models/User.js';
import BankAccount from '../../models/BankAccount.js';

let _counter = 0;
function uid() { return ++_counter; }

// ── User factories ────────────────────────────────────────────────

export async function createUser(overrides = {}) {
  const n = uid();
  return User.create({
    firstName:   `First${n}`,
    lastName:    `Last${n}`,
    email:       `user${n}@test.com`,
    password:    'Password123!',
    phoneNumber: `555-000-${String(n).padStart(4, '0')}`,
    ...overrides,
  });
}

export async function createAdmin(overrides = {}) {
  return createUser({ role: 'admin', ...overrides });
}

export async function createSupportAgent(overrides = {}) {
  return createUser({ role: 'support-agent', ...overrides });
}

// ── Account factories ─────────────────────────────────────────────

export async function createAccount(userId, overrides = {}) {
  const n = uid();
  const acct = await BankAccount.create({
    user:          userId,
    accountName:   overrides.accountName || 'Checking',
    accountType:   overrides.accountType || 'checking',
    accountNumber: String(1000000000 + n),
    routingNumber: '021000021',
    balance:       overrides.balance        ?? 10000,
    availableBalance: overrides.availableBalance ?? (overrides.balance ?? 10000),
    isPrimary:     overrides.isPrimary      ?? false,
    status:        overrides.status         || 'active',
    ...overrides,
  });

  // Link account to user
  await User.findByIdAndUpdate(userId, { $push: { accounts: acct._id } });
  return acct;
}

// Creates a user + one checking account, returns { user, account }
export async function createUserWithAccount(userOverrides = {}, acctOverrides = {}) {
  const user    = await createUser(userOverrides);
  const account = await createAccount(user._id, acctOverrides);
  return { user, account };
}

// Creates two users each with an account; returns { sender, receiver, fromAccount, toAccount }
export async function createTransferPair(opts = {}) {
  const { user: sender,   account: fromAccount } = await createUserWithAccount(
    {},
    { balance: opts.senderBalance ?? 5000, availableBalance: opts.senderBalance ?? 5000 },
  );
  const { user: receiver, account: toAccount }   = await createUserWithAccount(
    {},
    { balance: opts.receiverBalance ?? 1000, availableBalance: opts.receiverBalance ?? 1000 },
  );
  return { sender, receiver, fromAccount, toAccount };
}
