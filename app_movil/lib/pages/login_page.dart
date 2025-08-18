import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/auth_service.dart';
import 'home_page.dart'; // <-- añadimos para navegar tras login

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final AuthService _authService = AuthService();

  final _formKey = GlobalKey<FormState>();
  String? errorMessage;
  bool isLoading = false;
  bool _obscure = true;

  void _safeSet(VoidCallback fn) { if (!mounted) return; setState(fn); }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    if (isLoading) return;
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) return;

    final email = emailController.text.trim();
    final password = passwordController.text;

    _safeSet(() { errorMessage = null; isLoading = true; });

    try {
      await _authService.signIn(email, password);

      // ✅ Ir a Home y limpiar el stack para poder salir/entrar sin trabas
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const HomePage()),
        (route) => false,
      );
      return;
    } on FirebaseAuthException catch (e) {
      String msg;
      switch (e.code) {
        case 'invalid-email': msg = 'El correo no es válido.'; break;
        case 'user-disabled': msg = 'La cuenta está deshabilitada.'; break;
        case 'user-not-found': msg = 'No existe una cuenta con ese correo.'; break;
        case 'wrong-password':
        case 'invalid-credential': msg = 'Credenciales incorrectas.'; break;
        case 'network-request-failed': msg = 'Sin conexión. Intenta nuevamente.'; break;
        case 'too-many-requests': msg = 'Demasiados intentos. Prueba más tarde.'; break;
        default: msg = e.message ?? 'Error al iniciar sesión.';
      }
      _safeSet(() => errorMessage = msg);
    } catch (_) {
      _safeSet(() => errorMessage = 'Ha ocurrido un error inesperado.');
    } finally {
      _safeSet(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // ignore: deprecated_member_use
    final tsf = MediaQuery.textScaleFactorOf(context).clamp(1.0, 1.2);
    return MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaler: TextScaler.linear(tsf)),
      child: Scaffold(
        body: SafeArea(
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset('assets/portada.jpg', fit: BoxFit.cover),
              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(32.0),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text(
                                'Iniciar Sesión',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white70,
                                ),
                              ),
                              const SizedBox(height: 32),
                              TextFormField(
                                controller: emailController,
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                autofillHints: const [AutofillHints.username, AutofillHints.email],
                                style: const TextStyle(color: Colors.white),
                                cursorColor: Colors.white70,
                                decoration: const InputDecoration(
                                  labelText: 'Correo electrónico',
                                  labelStyle: TextStyle(color: Colors.white70),
                                  border: OutlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white30)),
                                  focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white60)),
                                  prefixIcon: Icon(Icons.email, color: Colors.white70),
                                  isDense: true,
                                ),
                                validator: (v) {
                                  final t = (v ?? '').trim();
                                  if (t.isEmpty) return 'Por favor, ingresa tu correo.';
                                  if (!t.contains('@') || !t.contains('.')) return 'Correo no válido.';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),
                              TextFormField(
                                controller: passwordController,
                                textInputAction: TextInputAction.done,
                                obscureText: _obscure,
                                onFieldSubmitted: (_) => _signIn(),
                                autofillHints: const [AutofillHints.password],
                                style: const TextStyle(color: Colors.white),
                                cursorColor: Colors.white70,
                                decoration: InputDecoration(
                                  labelText: 'Contraseña',
                                  labelStyle: const TextStyle(color: Colors.white70),
                                  border: const OutlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                                  enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.white30)),
                                  focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.white60)),
                                  prefixIcon: const Icon(Icons.lock, color: Colors.white70),
                                  isDense: true,
                                  suffixIcon: IconButton(
                                    tooltip: _obscure ? 'Mostrar' : 'Ocultar',
                                    onPressed: () => _safeSet(() => _obscure = !_obscure),
                                    icon: Icon(
                                      _obscure ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                                      color: Colors.white70,
                                    ),
                                  ),
                                ),
                                validator: (v) {
                                  if ((v ?? '').isEmpty) return 'Ingresa tu contraseña.';
                                  if ((v ?? '').length < 6) return 'Mínimo 6 caracteres.';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 24),
                              if (errorMessage != null) ...[
                                Text(
                                  errorMessage!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 8),
                              ],
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: isLoading ? null : _signIn,
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    backgroundColor: Colors.orange,
                                    foregroundColor: Colors.white,
                                  ),
                                  child: isLoading
                                      ? const SizedBox(
                                          width: 22, height: 22,
                                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                        )
                                      : const Text('Ingresar'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
