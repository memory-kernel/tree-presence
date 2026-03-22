/**
 * Generate a fresh random keypair and print the private key and address.
 * Usage: npx tsx src/generate-wallet.ts
 * Output: two lines — private key, then address.
 */
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log(privateKey);
console.log(account.address);
