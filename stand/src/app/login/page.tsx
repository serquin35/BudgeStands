"use client"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Modos del formulario
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  
  // Campos
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // UI states — inicializar el error con el param de la URL si viene del callback de OAuth
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      const exchangeAndRedirect = async () => {
        setLoading(true)
        setError(null)
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
          router.push("/auth/update-password")
        } catch (err: any) {
          setError(err?.message || "El enlace de autenticación ha expirado o no es válido.")
          setLoading(false)
        }
      }
      exchangeAndRedirect()
    }
  }, [searchParams, supabase, router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isForgotPassword) {
        // Enviar correo de recuperación
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
        })
        if (error) throw error
        setSuccess("Te hemos enviado un correo con un enlace para recuperar tu contraseña.")
      } else if (isLogin) {
        // Iniciar sesión
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.refresh()
        router.push("/dashboard")
      } else {
        // Registro
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })
        if (error) throw error
        setSuccess("Registro exitoso. Revisa tu correo electrónico para confirmar tu cuenta.")
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err?.message || "Error al conectar con Google")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative w-full max-w-[420px] mx-auto px-4 z-10">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <span className="font-extrabold text-xl text-white tracking-wider">T</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
            The Titan
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold">
            Presupuestador de Stands IA
          </p>
        </div>

        {/* Card Form */}
        <Card className="border-border bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/10">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-foreground">
              {isForgotPassword ? "Recuperar Contraseña" : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </CardTitle>
            <CardDescription className="text-center text-xs text-muted-foreground">
              {isForgotPassword 
                ? "Te enviaremos un enlace seguro" 
                : isLogin 
                  ? "Ingresa tus credenciales para acceder a la plataforma" 
                  : "Regístrate para empezar a generar presupuestos"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            
            {/* Oauth Google Button */}
            {!isForgotPassword && (
              <>
                <Button 
                  variant="outline" 
                  type="button" 
                  disabled={googleLoading || loading}
                  onClick={handleGoogleLogin}
                  className="w-full bg-muted border-border hover:bg-muted/80 text-foreground"
                >
                  {googleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  Continuar con Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">O continuar con email</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-foreground">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@thetitan.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary/30 text-sm text-foreground placeholder:text-muted-foreground"
                  disabled={loading}
                />
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium text-foreground">
                      Contraseña
                    </Label>
                    {isLogin && (
                      <button 
                        type="button" 
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary/30 text-sm text-foreground pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/15 focus:ring-2 focus:ring-indigo-500/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : isForgotPassword ? (
                  "Enviar enlace de recuperación"
                ) : isLogin ? (
                  "Entrar a la plataforma"
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 justify-center border-t border-border/50 py-4 bg-muted/30">
            {isForgotPassword ? (
               <button 
                type="button" 
                onClick={() => {
                  setIsForgotPassword(false)
                  setError(null)
                  setSuccess(null)
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
               >
                 Volver al inicio de sesión
               </button>
            ) : (
              <div className="text-xs text-muted-foreground text-center">
                {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {isLogin ? "Regístrate" : "Inicia sesión"}
                </button>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground">
              Desarrollado para Presustand &copy; 2026
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
