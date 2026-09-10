import { useEffect, useRef, useState, useCallback } from 'react'

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos
const WARNING_TIMEOUT_MS = 28 * 60 * 1000 // 28 minutos (2 minutos antes de deslogar)
const THROTTLE_MS = 1000 // Throttling para não sobrecarregar com mousemove/scroll excessivos

export interface UseAutoLogoutOptions {
  enabled: boolean
  onLogout: () => void
  inactivityTimeout?: number
  warningTimeout?: number
}

export function useAutoLogout({
  enabled,
  onLogout,
  inactivityTimeout = INACTIVITY_TIMEOUT_MS,
  warningTimeout = WARNING_TIMEOUT_MS,
}: UseAutoLogoutOptions) {
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0)

  const lastActivityRef = useRef<number>(Date.now())
  const lastThrottleRef = useRef<number>(0)
  const isTypingRef = useRef<boolean>(false)
  const onLogoutRef = useRef(onLogout)

  useEffect(() => {
    onLogoutRef.current = onLogout
  }, [onLogout])

  // Função para registrar atividade do usuário
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    setShowWarning(false)
  }, [])

  // Atualizar quando o usuário clica em "Continuar conectado"
  const extendSession = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    if (!enabled) {
      setShowWarning(false)
      return
    }

    lastActivityRef.current = Date.now()
    setShowWarning(false)

    // Handler genérico de eventos com throttle
    const handleActivity = () => {
      const now = Date.now()
      if (now - lastThrottleRef.current < THROTTLE_MS) return
      lastThrottleRef.current = now

      // Se o usuário estiver no modal de aviso, qualquer ação física não deve fechar silenciosamente
      // a menos que ele explicitamente continue ou interaja.
      // Porém, enquanto o aviso não disparou, reseta o timer.
      if (!showWarning) {
        lastActivityRef.current = now
      }
    }

    // Monitorar digitação ativa para não disparar nem deslogar durante preenchimento
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        isTypingRef.current = true
        lastActivityRef.current = Date.now()
      }
    }

    const handleFocusOut = () => {
      isTypingRef.current = false
      lastActivityRef.current = Date.now()
    }

    const handleKeyDown = () => {
      // Tecla pressionada conta como atividade imediata e atualiza digitação
      lastActivityRef.current = Date.now()
      if (showWarning) {
        // Se estava no aviso e apertou alguma tecla, também estende
        setShowWarning(false)
      }
    }

    // Eventos passivos conforme solicitado: mousemove, mousedown, keydown, touchstart, scroll
    const passiveOpts: AddEventListenerOptions = { passive: true }

    window.addEventListener('mousemove', handleActivity, passiveOpts)
    window.addEventListener('mousedown', handleActivity, passiveOpts)
    window.addEventListener('touchstart', handleActivity, passiveOpts)
    window.addEventListener('scroll', handleActivity, passiveOpts)
    window.addEventListener('keydown', handleKeyDown, passiveOpts)
    window.addEventListener('focusin', handleFocusIn, passiveOpts)
    window.addEventListener('focusout', handleFocusOut, passiveOpts)

    // Intervalo de verificação a cada 1 segundo
    const intervalId = window.setInterval(() => {
      const now = Date.now()

      // Se o usuário estiver com foco em digitação ativa (input/textarea focado), renova a atividade para não desconectar enquanto trabalha
      if (isTypingRef.current) {
        lastActivityRef.current = now
        setShowWarning(false)
        return
      }

      const elapsed = now - lastActivityRef.current

      if (elapsed >= inactivityTimeout) {
        // 30 minutos de inatividade: deslogar
        setShowWarning(false)
        window.clearInterval(intervalId)
        onLogoutRef.current()
      } else if (elapsed >= warningTimeout) {
        // 28 minutos de inatividade: exibir aviso modal com contagem regressiva
        const remainingMs = Math.max(0, inactivityTimeout - elapsed)
        const remainingSec = Math.ceil(remainingMs / 1000)
        setSecondsRemaining(remainingSec)
        setShowWarning(true)
      } else {
        setShowWarning(false)
      }
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [enabled, inactivityTimeout, warningTimeout, showWarning])

  return {
    showWarning,
    secondsRemaining,
    extendSession,
  }
}
