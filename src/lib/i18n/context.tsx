import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { Locale, translations } from './translations'

type NestedRecord<T> = {
  [K in keyof T]: T[K] extends string ? string : NestedRecord<T[K]>
}

export type AppTranslations = NestedRecord<(typeof translations)['pt']>

interface I18nContextType {
  locale: Locale
  setLocale: (loc: Locale) => void
  toggleLocale: () => void
  t: AppTranslations
}

const STORAGE_KEY = 'vivavarejo_locale_preference'

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'en' || saved === 'pt') {
        return saved
      }
    } catch {
      // noop
    }
    return 'pt'
  })

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
      document.documentElement.lang = newLocale === 'en' ? 'en' : 'pt-BR'
    } catch {
      // noop
    }
  }

  const toggleLocale = () => {
    setLocale(locale === 'pt' ? 'en' : 'pt')
  }

  useEffect(() => {
    try {
      document.documentElement.lang = locale === 'en' ? 'en' : 'pt-BR'
    } catch {
      // noop
    }
  }, [locale])

  const t = useMemo(() => {
    return (translations[locale] || translations.pt) as AppTranslations
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return ctx
}
