export async function sendOtp() {
  return {};
}

export async function verifyOtp() {
  return { uid: 'dummy-uid', phoneNumber: '' };
}

export function translateAuthError() {
  return 'Authentication failed.';
}
