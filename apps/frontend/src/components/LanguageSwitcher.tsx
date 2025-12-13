"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "../../i18n";

/**
 * LanguageSwitcher Component
 * 
 * Dropdown to switch between available locales.
 * Uses next-intl for locale management and Next.js router for navigation.
 * 
 * Features:
 * - Displays current locale with flag emoji
 * - Lists all available locales
 * - Preserves current pathname when switching
 * - Updates URL with new locale prefix
 * 
 * @example
 * ```tsx
 * <LanguageSwitcher />
 * ```
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;

    // Remove current locale prefix from pathname if it exists
    const pathWithoutLocale = pathname.replace(/^\/(en|es|fr)/, "") || "/";
    
    // Add new locale prefix (unless it's the default 'en')
    const newPath = newLocale === "en" 
      ? pathWithoutLocale 
      : `/${newLocale}${pathWithoutLocale}`;

    router.push(newPath);
  };

  const getFlag = (loc: string) => {
    const flags: Record<string, string> = {
      en: "🇺🇸",
      es: "🇪🇸",
      fr: "🇫🇷",
    };
    return flags[loc] || "🌐";
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleLocaleChange(e.target.value)}
      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      aria-label="Select language"
    >
      {locales.map((loc: Locale) => (
        <option key={loc} value={loc}>
          {getFlag(loc)} {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}
