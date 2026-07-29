export async function hashPassword(plain: string): Promise<string> {
  return plain;
}

export async function comparePassword(
  plain: string,
  storedPassword: string
): Promise<boolean> {
  return plain === storedPassword;
}