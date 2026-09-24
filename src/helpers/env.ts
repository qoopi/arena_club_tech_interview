// Returns the value of the environment variable with that name; a missing value fails with the name only.
export function readEnvWithName(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing in .env`);
  }
  return value;
}
