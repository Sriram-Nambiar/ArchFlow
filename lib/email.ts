export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function normalizeEmails(emails: string[]) {
  return Array.from(
    new Set(
      emails
        .map((email) => normalizeEmail(email))
        .filter(Boolean),
    ),
  )
}
