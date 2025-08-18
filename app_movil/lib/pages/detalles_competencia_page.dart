import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

import 'home_page.dart';
import 'ver_tiempos_page.dart';

class DetallesCompetenciaPage extends StatefulWidget {
  final String carreraId;
  final String nombre;

  const DetallesCompetenciaPage({
    super.key,
    required this.carreraId,
    required this.nombre,
  });

  @override
  DetallesCompetenciaPageState createState() => DetallesCompetenciaPageState();
}

class DetallesCompetenciaPageState extends State<DetallesCompetenciaPage> {
  // Datos
  List<Map<String, dynamic>> competidores = [];
  Map<String, dynamic>? datosCarrera;

  // Conectividad (v6: listas)
  bool _isOffline = false;
  StreamSubscription<List<ConnectivityResult>>? _connSub;

  // Nav inferior: 0=Inicio(local), 1=Historial (push), 2=Perfil (inline)
  int _navIndex = 0;

  // Control de proceso masivo
  bool _masivoEnProgreso = false;

  @override
  void initState() {
    super.initState();
    _cargarCompetenciaYCompetidores();
    _initConnectivity();
    _connSub = Connectivity().onConnectivityChanged.listen((results) {
      final offline = results.contains(ConnectivityResult.none);
      if (mounted) setState(() => _isOffline = offline);
    });
  }

  Future<void> _initConnectivity() async {
    final results = await Connectivity().checkConnectivity();
    if (mounted) setState(() => _isOffline = results.contains(ConnectivityResult.none));
  }

  @override
  void dispose() {
    _connSub?.cancel();
    super.dispose();
  }

  Future<void> _cargarCompetenciaYCompetidores() async {
    try {
      final docCarrera = await FirebaseFirestore.instance
          .collection('carreras')
          .doc(widget.carreraId)
          .get();

      final snapshot = await FirebaseFirestore.instance
          .collection('carreras')
          .doc(widget.carreraId)
          .collection('competidores')
          .orderBy('dorsal')
          .get();

      if (!mounted) return;
      setState(() {
        datosCarrera = docCarrera.data();
        competidores = snapshot.docs.map((d) => {'id': d.id, ...d.data()}).toList();
      });
    } catch (e) {
      debugPrint('Error al cargar datos: $e');
    }
  }

  // Helpers fecha/hora
  DateTime? _asDateTime(dynamic v) {
    if (v == null) return null;
    if (v is Timestamp) return v.toDate();
    if (v is DateTime) return v;
    if (v is String) { try { return DateTime.parse(v); } catch (_) {} }
    return null;
  }
  String _formatShort(DateTime dt) => DateFormat('dd/MM HH:mm').format(dt);
  String _metaLinea() {
    final etapa = datosCarrera?['etapa']?.toString() ?? 'N/A';
    final dt = _asDateTime(datosCarrera?['fechaHora'] ?? datosCarrera?['fecha']);
    return dt != null ? 'Etapa $etapa • ${_formatShort(dt)}' : 'Etapa $etapa';
  }

  // --- Navegación inferior
  void _onNavTap(int i) async {
    if (i == 0) {
      setState(() => _navIndex = 0);
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const HomePage()),
        (r) => false,
      );
    } else if (i == 1) {
      setState(() => _navIndex = 1);
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => VerTiemposPage(competenciaId: widget.carreraId)),
      );
      if (mounted) setState(() => _navIndex = 0);
    } else if (i == 2) {
      setState(() => _navIndex = 2); // mostrar Perfil inline
    }
  }

  // --- Diálogo glass individual
  Future<void> _confirmarYRegistrarTiempo({
    required String competidorId,
    required String nombre,
    required String dorsal,
  }) async {
    await showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Capturar tiempo',
      barrierColor: Colors.black.withOpacity(0.35),
      transitionDuration: const Duration(milliseconds: 160),
      pageBuilder: (_, __, ___) => const SizedBox.shrink(),
      transitionBuilder: (dialogCtx, anim, _, __) {
        final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutCubic);
        return _GlassDialogFlow(
          curved: curved,
          nombre: nombre,
          dorsal: dorsal,
          onGuardar: () async {
            try {
              final ref = await FirebaseFirestore.instance
                  .collection('carreras')
                  .doc(widget.carreraId)
                  .collection('competidores')
                  .doc(competidorId)
                  .collection('tiempos')
                  .add({'timestamp': Timestamp.now()});

              if (!mounted) return true;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Tiempo registrado'),
                  action: SnackBarAction(
                    label: 'Deshacer',
                    onPressed: () async { try { await ref.delete(); } catch (_) {} },
                  ),
                ),
              );
              return true;
            } catch (e) {
              debugPrint('Error al registrar tiempo: $e');
              return false;
            }
          },
        );
      },
    );
  }

  // --- Confirmación y registro de SALIDA masiva (ahora con glass dialog igual al unitario)
  Future<void> _confirmarSalidaMasiva() async {
    if (competidores.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No hay competidores para registrar salida.')),
      );
      return;
    }

    await showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Registrar SALIDA',
      barrierColor: Colors.black.withOpacity(0.35),
      transitionDuration: const Duration(milliseconds: 160),
      pageBuilder: (_, __, ___) => const SizedBox.shrink(),
      transitionBuilder: (dialogCtx, anim, _, __) {
        final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutCubic);
        return _GlassConfirmFlow(
          curved: curved,
          icon: Icons.timer_outlined,
          title: 'Registrar SALIDA',
          message:
              'Se registrará la SALIDA para ${competidores.length} competidor(es).\n\n¿Deseas continuar?',
          confirmText: 'Confirmar',
          successTitle: '¡Salida registrada!',
          onConfirm: () async {
            setState(() => _masivoEnProgreso = true);
            final creados = await _registrarSalidaMasiva();
            if (mounted) setState(() => _masivoEnProgreso = false);
            return 'Se creó registro de salida para $creados competidor(es).';
          },
        );
      },
    );
  }

  // Ahora retorna el número de registros creados para mostrarlo en el diálogo de éxito
  Future<int> _registrarSalidaMasiva() async {
    if (_masivoEnProgreso) return 0;
    int creados = 0;
    final now = Timestamp.now();

    try {
      for (final c in competidores) {
        final String idComp = c['id'] as String;
        final tiemposRef = FirebaseFirestore.instance
            .collection('carreras')
            .doc(widget.carreraId)
            .collection('competidores')
            .doc(idComp)
            .collection('tiempos');

        final tiene = await tiemposRef.limit(1).get();
        if (tiene.docs.isEmpty) {
          await tiemposRef.add({'timestamp': now});
          creados++;
        }
      }
      return creados;
    } catch (e) {
      debugPrint('Error en salida masiva: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al registrar salida masiva: $e')),
        );
      }
      return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    // AppBar premium
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(72),
        child: AppBar(
          elevation: 6,
          shadowColor: Colors.black.withOpacity(0.15),
          shape: const ContinuousRectangleBorder(
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(28),
              bottomRight: Radius.circular(28),
            ),
          ),
          flexibleSpace: ClipRRect(
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(28),
              bottomRight: Radius.circular(28),
            ),
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFF1EDE7), Color.fromARGB(255, 255, 152, 0)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
          ),
          leadingWidth: 56,
          leading: Padding(
            padding: const EdgeInsets.all(8),
            child: Image.asset('assets/logo.png', fit: BoxFit.contain),
          ),
          title: const Text(
            'SAGCC',
            style: TextStyle(
              color: Color.fromARGB(255, 49, 49, 49),
              fontWeight: FontWeight.w800,
              letterSpacing: 0.2,
            ),
          ),
          centerTitle: false,
        ),
      ),

      body: Column(
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: _isOffline
                ? const _OfflineBanner()
                : const SizedBox.shrink(key: ValueKey('online')),
          ),

          // Contenido: si _navIndex==2 mostramos Perfil inline, si no la info de competencia.
          Expanded(
            child: _navIndex == 2
                ? const _PerfilInline()
                : _MainCompetencia(
                    nombre: widget.nombre,
                    metaLinea: _metaLinea(),
                    carreraId: widget.carreraId,
                    competidores: competidores,
                    onCapturar: _confirmarYRegistrarTiempo,
                    onSalidaMasiva: _confirmarSalidaMasiva,
                    masivoEnProgreso: _masivoEnProgreso,
                  ),
          ),
        ],
      ),

      // Bottom nav (Inicio / Historial / Perfil)
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _navIndex,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color.fromARGB(255, 255, 152, 0),
        unselectedItemColor: Colors.black54,
        onTap: _onNavTap,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home_rounded),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt_outlined),
            activeIcon: Icon(Icons.list_alt_rounded),
            label: 'Historial',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline_rounded),
            activeIcon: Icon(Icons.person_rounded),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}

// ========= Secciones de la pantalla =========

// Contenido principal (cabecera + lista de competidores)
class _MainCompetencia extends StatelessWidget {
  final String nombre;
  final String metaLinea;
  final String carreraId;
  final List<Map<String, dynamic>> competidores;
  final Future<void> Function({
    required String competidorId,
    required String nombre,
    required String dorsal,
  }) onCapturar;

  final Future<void> Function() onSalidaMasiva;
  final bool masivoEnProgreso;

  const _MainCompetencia({
    required this.nombre,
    required this.metaLinea,
    required this.carreraId,
    required this.competidores,
    required this.onCapturar,
    required this.onSalidaMasiva,
    required this.masivoEnProgreso,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Cabecera
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange.shade50,
              border: Border.all(color: const Color.fromARGB(255, 255, 152, 1), width: 1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Texto
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Evento: $nombre',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(metaLinea, style: const TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
                // Botón cronómetro masivo
                Tooltip(
                  message: 'Registrar SALIDA',
                  child: ElevatedButton.icon(
                    onPressed: masivoEnProgreso || competidores.isEmpty ? null : onSalidaMasiva,
                    style: ElevatedButton.styleFrom(
                      foregroundColor: const Color.fromARGB(255, 94, 94, 94),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      side: const BorderSide(color: Color.fromARGB(255, 148, 148, 148)),
                      elevation: 2,
                    ),
                    icon: masivoEnProgreso
                        ? const SizedBox(
                            width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.timer_outlined),
                    label: const Text('Salida'),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Lista
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.orange, width: 1),
                borderRadius: BorderRadius.circular(16),
                color: Colors.white,
              ),
              padding: const EdgeInsets.all(8),
              child: competidores.isEmpty
                  ? const Center(child: Text('No hay competidores registrados'))
                  : ListView.builder(
                      itemCount: competidores.length,
                      itemBuilder: (context, index) {
                        final c = competidores[index];
                        final String id = c['id'] as String;
                        final String nombre = (c['nombre'] ?? 'Desconocido').toString();
                        final String dorsal = (c['dorsal']?.toString() ?? 'S/N');

                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 2,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  leading: const Icon(Icons.person, color: Colors.orange, size: 32),
                                  title: Text(nombre, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  subtitle: Text('Dorsal: $dorsal'),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.timer, color: Color.fromARGB(255, 165, 164, 164)),
                                    tooltip: 'Capturar tiempo',
                                    onPressed: () => onCapturar(
                                      competidorId: id,
                                      nombre: nombre,
                                      dorsal: dorsal,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                                  stream: FirebaseFirestore.instance
                                      .collection('carreras')
                                      .doc(carreraId)
                                      .collection('competidores')
                                      .doc(id)
                                      .collection('tiempos')
                                      .orderBy('timestamp', descending: true)
                                      .limit(1)
                                      .snapshots(),
                                  builder: (context, snapshot) {
                                    if (snapshot.connectionState == ConnectionState.waiting) {
                                      return const Text('Último tiempo: cargando...');
                                    }
                                    if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                                      return const Text('Último tiempo: no registrado');
                                    }
                                    final ts = snapshot.data!.docs.first.get('timestamp') as Timestamp;
                                    final hora = DateFormat('HH:mm:ss').format(ts.toDate());
                                    return Text('Último tiempo: $hora');
                                  },
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ),
      ],
    );
  }
}

// Perfil inline 
class _PerfilInline extends StatelessWidget {
  const _PerfilInline();
  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    return Center(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.orange, width: 2),
            color: Colors.white,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircleAvatar(radius: 34, child: Icon(Icons.person_rounded, size: 36)),
              const SizedBox(height: 12),
              Text(user?.email ?? 'Usuario',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text('UID: ${user?.uid ?? '-'}', style: const TextStyle(color: Colors.black54)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () async {
                  await FirebaseAuth.instance.signOut();
                  if (!context.mounted) return;
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const HomePage()),
                    (route) => false,
                  );
                },
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Cerrar sesión'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange, foregroundColor: Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Banner offline
class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner();
  @override
  Widget build(BuildContext context) {
    return Container(
      key: const ValueKey('offline'),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: Color(0xFFFFF3E0),
        border: Border(bottom: BorderSide(color: Colors.orangeAccent, width: 1.5)),
      ),
      child: const Row(
        children: [
          Icon(Icons.cloud_off_rounded, size: 20, color: Colors.black87),
          SizedBox(width: 8),
          Expanded(
            child: Text('Sin conexión — trabajando offline',
                style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)),
          ),
        ],
      ),
    );
  }
}

/// ==== Diálogo “glass” de captura unitaria ====
class _GlassDialogFlow extends StatefulWidget {
  final Animation<double> curved;
  final String nombre;
  final String dorsal;
  final Future<bool> Function() onGuardar;

  const _GlassDialogFlow({
    required this.curved,
    required this.nombre,
    required this.dorsal,
    required this.onGuardar,
  });

  @override
  State<_GlassDialogFlow> createState() => _GlassDialogFlowState();
}

class _GlassDialogFlowState extends State<_GlassDialogFlow> {
  int step = 0; // 0=confirmar, 1=guardando, 2=éxito
  bool _saving = false;

  Future<void> _handleConfirm() async {
    if (_saving) return;
    setState(() { step = 1; _saving = true; });
    final ok = await widget.onGuardar();
    if (!mounted) return;
    setState(() { step = ok ? 2 : 0; _saving = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        BackdropFilter(filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8), child: const SizedBox.expand()),
        Opacity(
          opacity: widget.curved.value,
          child: Transform.scale(
            scale: 0.98 + (0.02 * widget.curved.value),
            child: Center(
              child: Material(
                color: Colors.transparent,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    width: MediaQuery.of(context).size.width * 0.9,
                    constraints: const BoxConstraints(maxWidth: 420),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      border: Border.all(color: const Color.fromARGB(255, 255, 255, 255).withOpacity(0.4)),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft, end: Alignment.bottomRight,
                        colors: [Colors.white70, Colors.white10],
                      ),
                    ),
                    padding: const EdgeInsets.all(20),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 220),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      child: _buildStep(context),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep(BuildContext context) {
    if (step == 0) {
      return Column(
        key: const ValueKey('confirm'),
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: const BoxDecoration(color: Color.fromARGB(255, 255, 152, 0), shape: BoxShape.circle),
            child: const Icon(Icons.timer_outlined, size: 40, color: Color.fromARGB(255, 255, 255, 255)),
          ),
          const SizedBox(height: 12),
          const Text(
            'Confirmar captura',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.black87),
          ),
          const SizedBox(height: 8),
          Text(
            '¿Registrar tiempo para ${widget.nombre} (Dorsal ${widget.dorsal})?',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 15, color: Colors.black87),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(onPressed: () => Navigator.of(context).maybePop(), 
              child: const Text('Cancelar')),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _handleConfirm,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange, foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Confirmar'),
              ),
            ],
          ),
        ],
      );
    } else if (step == 1) {
      return const Column(
        key: ValueKey('saving'),
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(height: 6),
          CircularProgressIndicator(),
          SizedBox(height: 14),
          Text('Guardando...',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black87)),
          SizedBox(height: 6),
        ],
      );
    } else {
      return Column(
        key: const ValueKey('success'),
        mainAxisSize: MainAxisSize.min,
        children: [
          TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 520),
            tween: Tween(begin: 0.6, end: 1.0),
            curve: Curves.easeOutBack,
            builder: (context, value, _) => Transform.scale(
              scale: value,
              child: const Icon(Icons.check_circle_rounded, size: 72, color: Colors.green),
            ),
          ),
          const SizedBox(height: 10),
          const Text('¡Tiempo registrado!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.black87)),
          const SizedBox(height: 6),
          Text('${widget.nombre} • Dorsal ${widget.dorsal}',
              textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, color: Colors.black87)),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: () => Navigator.of(context).maybePop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange, foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Listo'),
          ),
        ],
      );
    }
  }
}

/// ==== Diálogo “glass” genérico para confirmaciones masivas (mismo estilo) ====
class _GlassConfirmFlow extends StatefulWidget {
  final Animation<double> curved;
  final IconData icon;
  final String title;
  final String message;
  final String confirmText;
  final String successTitle;
  /// Debe devolver el texto de detalle para mostrar en el paso de éxito.
  final Future<String> Function() onConfirm;

  const _GlassConfirmFlow({
    required this.curved,
    required this.icon,
    required this.title,
    required this.message,
    required this.confirmText,
    required this.successTitle,
    required this.onConfirm,
  });

  @override
  State<_GlassConfirmFlow> createState() => _GlassConfirmFlowState();
}

class _GlassConfirmFlowState extends State<_GlassConfirmFlow> {
  int step = 0; // 0=confirmar, 1=guardando, 2=éxito
  bool _saving = false;
  String _resultText = '';

  Future<void> _handleConfirm() async {
    if (_saving) return;
    setState(() { step = 1; _saving = true; });
    try {
      final text = await widget.onConfirm();
      if (!mounted) return;
      setState(() { _resultText = text; step = 2; _saving = false; });
    } catch (_) {
      if (!mounted) return;
      setState(() { step = 0; _saving = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        BackdropFilter(filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8), child: const SizedBox.expand()),
        Opacity(
          opacity: widget.curved.value,
          child: Transform.scale(
            scale: 0.98 + (0.02 * widget.curved.value),
            child: Center(
              child: Material(
                color: Colors.transparent,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    width: MediaQuery.of(context).size.width * 0.9,
                    constraints: const BoxConstraints(maxWidth: 420),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      border: Border.all(color: const Color.fromARGB(255, 255, 255, 255).withOpacity(0.4)),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft, end: Alignment.bottomRight,
                        colors: [Colors.white70, Colors.white10],
                      ),
                    ),
                    padding: const EdgeInsets.all(20),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 220),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      child: _buildStep(context),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep(BuildContext context) {
    if (step == 0) {
      return Column(
        key: const ValueKey('confirm'),
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: const BoxDecoration(color: Color.fromARGB(255, 255, 152, 0), shape: BoxShape.circle),
            child: Icon(widget.icon, size: 40, color: const Color.fromARGB(255, 255, 255, 255)),
          ),
          const SizedBox(height: 12),
          Text(
            widget.title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.black87),
          ),
          const SizedBox(height: 8),
          Text(
            widget.message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 15, color: Colors.black87),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(onPressed: () => Navigator.of(context).maybePop(), child: const Text('Cancelar')),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _handleConfirm,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange, foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(widget.confirmText),
              ),
            ],
          ),
        ],
      );
    } else if (step == 1) {
      return const Column(
        key: ValueKey('saving'),
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(height: 6),
          CircularProgressIndicator(),
          SizedBox(height: 14),
          Text('Procesando...',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black87)),
          SizedBox(height: 6),
        ],
      );
    } else {
      return Column(
        key: const ValueKey('success'),
        mainAxisSize: MainAxisSize.min,
        children: [
          TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 520),
            tween: Tween(begin: 0.6, end: 1.0),
            curve: Curves.easeOutBack,
            builder: (context, value, _) => Transform.scale(
              scale: value,
              child: const Icon(Icons.check_circle_rounded, size: 72, color: Colors.green),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            widget.successTitle,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.black87),
          ),
          const SizedBox(height: 6),
          Text(
            _resultText,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 15, color: Colors.black87),
          ),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: () => Navigator.of(context).maybePop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange, foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Listo'),
          ),
        ],
      );
    }
  }
}
