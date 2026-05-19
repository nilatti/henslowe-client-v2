export function firstLetterUpcase(string: string): string {
  return string[0].toUpperCase() + string.substring(1);
}

export function formatPhoneNumber(phoneNumberString: string | number): string | null {
  const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    const intlCode = match[1] ? "+1 " : "";
    return [intlCode, "(", match[2], ") ", match[3], "-", match[4]].join("");
  }
  return null;
}
