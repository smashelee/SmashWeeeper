export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || !username.trim()) {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();
  
  if (trimmed.length < 3 || trimmed.length > 20) {
    return { valid: false, error: 'Username must be between 3 and 20 characters' };
  }

  const latinOnlyRegex = /^[a-zA-Z0-9_-]+$/;
  
  if (!latinOnlyRegex.test(trimmed)) {
    return { valid: false, error: 'Username can only contain Latin letters, numbers, underscore, and hyphen' };
  }

  if (trimmed.startsWith('_') || trimmed.startsWith('-') || trimmed.endsWith('_') || trimmed.endsWith('-')) {
    return { valid: false, error: 'Username cannot start or end with underscore or hyphen' };
  }

  return { valid: true };
}

export function filterLatinInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}