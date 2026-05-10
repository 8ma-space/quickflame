import { createContext, useContext, useState, useCallback } from 'react'
import translations, { LANGUAGES } from '../data/i18n.js'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('qf_lang') || 'en')

  const changeLang = useCallback((code) => {
    setLang(code)
    localStorage.setItem('qf_lang', code)
    // RTL support for Arabic
    document.documentElement.setAttribute('dir', LANGUAGES.find(l => l.code === code)?.rtl ? 'rtl' : 'ltr')
  }, [])

  const t = useCallback((key) => {
    const parts = key.split('.')
    let val = translations[lang]
    for (const p of parts) val = val?.[p]
    if (val !== undefined) return val
    // Fallback to English
    let fb = translations.en
    for (const p of parts) fb = fb?.[p]
    return fb ?? key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
