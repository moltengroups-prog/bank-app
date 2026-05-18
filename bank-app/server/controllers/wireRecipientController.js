import WireRecipient from '../models/WireRecipient.js';
import { encrypt, maskAccountNumber } from '../utils/encryption.js';

// POST /api/wire-recipients
export async function createRecipient(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      firstName, lastName, businessName,
      nickname, country, currency,
      recipientType, ownershipType,
      bankName, routingNumber, swiftCode,
      accountNumber,
      recipientAddress, city, state, postalCode,
    } = req.body;

    if (!accountNumber) {
      return res.status(400).json({ success: false, message: 'Account number is required.' });
    }

    const accountNumberEncrypted = encrypt(String(accountNumber));
    const accountNumberMasked    = maskAccountNumber(String(accountNumber));

    const recipient = await WireRecipient.create({
      user:                userId,
      firstName:           firstName           ?? '',
      lastName:            lastName            ?? '',
      businessName:        businessName        ?? '',
      nickname:            nickname            ?? '',
      country:             country             ?? 'US',
      currency:            currency            ?? 'USD',
      recipientType:       recipientType       ?? 'individual',
      ownershipType:       ownershipType       ?? 'personal',
      bankName:            bankName            ?? '',
      routingNumber:       routingNumber       ?? '',
      swiftCode:           swiftCode           ?? '',
      accountNumberEncrypted,
      accountNumberMasked,
      recipientAddress:    recipientAddress    ?? '',
      city:                city                ?? '',
      state:               state               ?? '',
      postalCode:          postalCode          ?? '',
    });

    const safe = recipient.toObject();
    delete safe.accountNumberEncrypted;

    return res.status(201).json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
}

// GET /api/wire-recipients
export async function getRecipients(req, res, next) {
  try {
    const userId    = req.user._id;
    const recipients = await WireRecipient.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: recipients });
  } catch (err) {
    next(err);
  }
}

// GET /api/wire-recipients/:id
export async function getRecipientById(req, res, next) {
  try {
    const userId    = req.user._id;
    const recipient = await WireRecipient.findOne({ _id: req.params.id, user: userId }).lean();
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found.' });
    }
    return res.status(200).json({ success: true, data: recipient });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/wire-recipients/:id
export async function updateRecipient(req, res, next) {
  try {
    const userId    = req.user._id;
    const recipient = await WireRecipient.findOne({ _id: req.params.id, user: userId });
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found.' });
    }

    const ALLOWED = [
      'firstName', 'lastName', 'businessName', 'nickname',
      'country', 'currency', 'recipientType', 'ownershipType',
      'bankName', 'routingNumber', 'swiftCode',
      'recipientAddress', 'city', 'state', 'postalCode',
    ];

    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) recipient[key] = req.body[key];
    }

    if (req.body.accountNumber) {
      recipient.accountNumberEncrypted = encrypt(String(req.body.accountNumber));
      recipient.accountNumberMasked    = maskAccountNumber(String(req.body.accountNumber));
    }

    await recipient.save();

    const safe = recipient.toObject();
    delete safe.accountNumberEncrypted;

    return res.status(200).json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/wire-recipients/:id
export async function deleteRecipient(req, res, next) {
  try {
    const userId = req.user._id;
    const result = await WireRecipient.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Recipient not found.' });
    }
    return res.status(200).json({ success: true, message: 'Recipient deleted.' });
  } catch (err) {
    next(err);
  }
}
