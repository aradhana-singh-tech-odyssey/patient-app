type ClassValue = string | number | boolean | undefined | null | Record<string, boolean>;

export function classNames(...classes: ClassValue[]): string {
  return classes
    .flatMap(cls => {
      if (!cls) return [];
      if (typeof cls === 'string' || typeof cls === 'number') return [cls];
      if (Array.isArray(cls)) return cls.filter(Boolean);
      return Object.entries(cls)
        .filter(([_, value]) => Boolean(value))
        .map(([key]) => key);
    })
    .join(' ')
    .trim();
}
