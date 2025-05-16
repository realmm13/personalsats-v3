import { type NextRequest, NextResponse } from 'next/server';
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { generateEncryptionKey, encryptString, decryptString } from '@/lib/encryption'

const passphrase = process.env.ENCRYPTION_PASSPHRASE!
const saltHex = process.env.ENCRYPTION_SALT!
if (!passphrase || !saltHex) throw new Error('Missing ENCRYPTION_PASSPHRASE or ENCRYPTION_SALT env var')
const salt = Buffer.from(saltHex, 'hex')

async function getKey() {
  return generateEncryptionKey(passphrase, salt)
}

export async function GET(req: Request, context: { params: { id: string } }) {
  const id = context.params.id;
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only select decrypted fields
    const transaction = await db.bitcoinTransaction.findUnique({
      where: {
        id,
        userId: session.user.id, // Ensure user owns the transaction
      },
      select: {
        id: true,
        userId: true,
        timestamp: true,
        type: true,
        amount: true,
        asset: true,
        price: true,
        priceAsset: true,
        fee: true,
        feeAsset: true,
        wallet: true,
        counterparty: true,
        tags: true,
        notes: true,
        exchangeTxId: true,
        // Do NOT include encryptedData
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 });
    }

    const key = await getKey()
    const decrypted = {
      ...transaction,
      notes: transaction.notes ? await decryptString(transaction.notes, key) : null
    }

    return NextResponse.json(decrypted);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const id = context.params.id;
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership before deleting
    const transaction = await db.bitcoinTransaction.findUnique({
        where: { id },
        select: { userId: true } 
    });

    if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden - You do not own this transaction' }, { status: 403 });
    }

    await db.bitcoinTransaction.delete({
      where: {
        id,
        // No need for userId here again, we already checked ownership
      },
    });

    return NextResponse.json({ message: 'Transaction deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

interface UpdateTransactionBody {
  encryptedData: string;
  notes?: string;
  timestamp?: string;
}

export async function PUT(req: Request, context: { params: { id: string } }) {
  const id = context.params.id;
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as UpdateTransactionBody;
    const { encryptedData, timestamp } = body;

    if (!encryptedData) {
      return NextResponse.json({ error: 'Missing encryptedData' }, { status: 400 });
    }
    
    // Verify ownership before updating
    const transaction = await db.bitcoinTransaction.findUnique({
        where: { id },
        select: { userId: true } 
    });

    if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden - You do not own this transaction' }, { status: 403 });
    }

    const key = await getKey()
    const dataToStore: {
      encryptedData: string;
      notes?: string;
      timestamp?: Date;
    } = {
      encryptedData: encryptedData,
      notes: body.notes ? await encryptString(body.notes, key) : undefined
    }

    if (timestamp) {
      try {
        dataToStore.timestamp = new Date(timestamp);
      } catch (dateError) {
        return NextResponse.json({ error: 'Invalid timestamp format' }, { status: 400 });
      }
    }

    const updatedTransaction = await db.bitcoinTransaction.update({
      where: {
        id,
      },
      data: dataToStore,
    });

    const decrypted = {
      ...updatedTransaction,
      notes: updatedTransaction.notes ? await decryptString(updatedTransaction.notes, key) : null
    }

    return NextResponse.json(decrypted);
  } catch (error) {
    console.error("Error updating transaction:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 