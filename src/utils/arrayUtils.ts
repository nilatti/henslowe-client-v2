export function arrayEquals<T>(arrayA: T[], arrayB: T[]): boolean {
  arrayA.sort();
  arrayB.sort();
  return (
    Array.isArray(arrayA) &&
    Array.isArray(arrayB) &&
    arrayA.length === arrayB.length &&
    arrayA.every((val, index) => val === arrayB[index])
  );
}

export function difference<T>(arrayA: T[], arrayB: T[]): T[] {
  return arrayA.filter((x) => !arrayB.includes(x));
}

export function intersection<T>(arrayA: T[], arrayB: T[]): T[] {
  return arrayA.filter((x) => arrayB.includes(x));
}

export function overlap<T>(arrayA: T[] | null | undefined, arrayB: T[] | null | undefined): boolean {
  if (!arrayA || !arrayB) {
    return false;
  }
  const isFound = arrayA.some((item) => arrayB.includes(item));
  return isFound;
}

export function symmetricalDifference<T>(arrayA: T[], arrayB: T[]): T[] {
  return arrayA
    .filter((x) => !arrayB.includes(x))
    .concat(arrayB.filter((x) => !arrayA.includes(x)));
}

export function union<T>(arrayA: T[], arrayB: T[]): T[] {
  return [...new Set([...arrayA, ...arrayB])];
}
