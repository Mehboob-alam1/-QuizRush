const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateReferralCode = (length = 6): string => {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[index];
  }
  return code;
};

