import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = {
  type: "service_account",
  projectId: "pj-lawn",
  privateKeyId: "fd50cbe482b2188314c8f66da56cc6341de23a31",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCXqttt6SgSWSAZ\n9lxT0sQFHl3hPqOvYHDKMqKtFRoSktRjLLAz5mBx99hMVhhe2LAG4j5quii6xZFJ\nnzzckt3b7ocFkW+8uc+Yin7arsHJK8t367mtsOnr0xDglOwkvvZWQwNk2MZqz/j6\nxV1zfm4z2xVUfC5JNIf81df5lD1KANak1GOQJut8PUqNYinvT1u5qQjEOGkyGcoa\n+gBuW2dgkuPSiHUcn2bHZBK7r77ijW6HUCMBu4DBE8e+O5sNfnxCMNoc3IowS+Xz\nTlE+//RP9u2/eCJfmhw0xa+/b40mcghgX96ig1O4B2mF1GTXXe6rKRfipbCI277H\nhhzgz6vBAgMBAAECggEAAzhh+1Xxf148E8EK2c7GUbOA28j4Mb+S9YAYuyMRECbk\n8owe26M/Ffxkr84+Kzlfl23TVHHKbpjGSnFime5WXpaUcFZTsIajdUIvilYekDZp\nVgz/vsPcW6D6IUKYNvmFAnTezBPcNqVezHhHUS30ig5TSB1w4CYI4yHpOYffu0P7\n7BTpsemnWYepbpTPeTo4XpV4GuUKtCJQV3C7l8QXOvgKi9GAP2ti1yMVCo8WW3/K\nOilibCq4LuUK6sg2bDIzTmjLFpTmXHivBoRQQpdd8xfYrvK9u13mfmY1GO+4XmvB\nAJ1Rz6NklQ1VTgsEwTX0ml+YeXnzB5G7yyYpr8bcIQKBgQDJiCpLCcqeMLSkAzXo\noLyOR4mlOYVt38AJdH7yLNCT3qH64uozzNBYnUfYMx15WvHjbM+7QCLklmiwBAOO\n0kSzgeJZjDTRcrom/chAK2jmo65+BEd0T/I2Z3qbZBEZTHtwPr24j86vCRCRig3Y\nS/ancHraPztqN+Z1qw3tLPmW+QKBgQDAqJtrQNiewwXaGYk+csfcecmHt77sBPx7\nbeUcVIzCM/phvakY8a5xsLObRyUZLRCxeJV0cOW5B5RoEHqb1wd3gaUni2oCQwjH\nG+l0KgLyXDMi9bUzPRK4Za3IQdSB/dDNO2wqfwdkHmBJhK9QQDYZc335vRfx9e89\nW8O86eqFCQKBgQCBh1z3gcGSzucri0y4yaanI9+aLFBQAEGjUhbNfHRKtgsR/4pb\n5MX8ToqAsMm+1+8kJymUxnImzW1XxBytTQQPA+oBeBXykHSI3xA3/i6cHpPmNsXe\nQgwBX5z0BuregcPMruatmvBSm9bkVAD2Bkzv7WFoqL99U5RyCJEY4ZFBsQKBgQCt\nFIyT/WzerHxMZRacaMfO9gasi9HU/eHKDX+ARSEzszikqJwK0c0TTFj/DhpxFMBj\nf95c/rQS15FnMC7GZJbLsUgrT59MKubu4c+I0dlV3KkAJlfEkYCI8qf+Oc3tfpYg\nWtshDoAYXQXJ5o8NfLJdiRlKzKt/b5+fsxoVVNyg6QKBgEhZ4IK0ffwDVYhbn7ka\nUqYGlH9BMs9EX82NrWUkpeDqUw3QVGiqfgfoXiMmCiI1/eTOFsX4PosQjsLntgM0\noDOEZX8O7UDrEc7JTLYWKYWboLU+9xVA1VHnU3Se4U1NPtv55yH9TCEZPKpCCaej\nunkqc5nA4/3nsSec7t0O6crm\n-----END PRIVATE KEY-----\n",
  clientEmail: "firebase-adminsdk-fbsvc@pj-lawn.iam.gserviceaccount.com"
};

export function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount as any),
      projectId: "pj-lawn"
    });
  }
  return getFirestore();
}

export function getAdminAuth() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount as any),
      projectId: "pj-lawn"
    });
  }
  return getAuth();
}

export { FieldValue };
