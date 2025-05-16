import { randomBytes } from "crypto";
import { generateEncryptionKey, encryptString } from "../src/lib/encryption";

async function main() {
  const masterPass = process.argv[2];
  if (!masterPass) throw new Error("Usage: ts-node genEncryptedData.ts <passphrase>");
  const salt = randomBytes(16);
  const key = await generateEncryptionKey(masterPass, salt);
  const encrypted = await encryptString("YOUR_SENSITIVE_PAYLOAD", key);
  console.log("SALT_HEX=" + salt.toString("hex"));
  console.log("PAYLOAD_HEX=" + Buffer.from(encrypted).toString("hex"));
}

main().catch(err => { console.error(err); process.exit(1); });