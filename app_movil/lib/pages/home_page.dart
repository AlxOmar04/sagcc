import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:intl/intl.dart';
import 'detalles_competencia_page.dart';
import 'login_page.dart';

DateTime? _asDateTime(dynamic value) {
  if (value == null) return null;
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is String) { try { return DateTime.parse(value); } catch (_) {} }
  return null;
}
String _formatShort(DateTime dt) => DateFormat('dd/MM • HH:mm').format(dt);

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  static const String appName = 'SAGCC';
  int _tabIndex = 0;

  bool _isOffline = false;
  StreamSubscription<List<ConnectivityResult>>? _connSub;

  @override
  void initState() {
    super.initState();
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

  @override
  Widget build(BuildContext context) {
    final tsf = MediaQuery.textScaleFactorOf(context).clamp(1.0, 1.2);
    return MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaler: TextScaler.linear(tsf)),
      child: Scaffold(
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
                    colors: [Color(0xFFF1EDE7), Color(0xFFF7A427)],
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
              appName,
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
            Expanded(
              child: IndexedStack(
                index: _tabIndex,
                children: const [_InicioTab(), _AsignadasTab(), _PerfilTab()],
              ),
            ),
          ],
        ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _tabIndex,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: Colors.orange[700],
          unselectedItemColor: Colors.black54,
          onTap: (i) => setState(() => _tabIndex = i),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Inicio',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment_turned_in_outlined),
              activeIcon: Icon(Icons.assignment_turned_in_rounded),
              label: 'Asignadas',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Perfil',
            ),
          ],
        ),
      ),
    );
  }
}

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
        border: Border(bottom: BorderSide(color: Colors.orangeAccent, width: 1.2)),
      ),
      child: const Row(
        children: [
          Icon(Icons.cloud_off_rounded, size: 20, color: Colors.black87),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Sin conexión — trabajando offline',
              style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }
}

/// ================= INICIO =================
class _InicioTab extends StatefulWidget {
  const _InicioTab();
  @override
  State<_InicioTab> createState() => __InicioTabState();
}

class __InicioTabState extends State<_InicioTab>
    with AutomaticKeepAliveClientMixin<_InicioTab> {
  @override
  bool get wantKeepAlive => true;

  static const int _limit = 10;
  final ScrollController _scroll = ScrollController();

  final List<List<QueryDocumentSnapshot<Map<String, dynamic>>>> _pages = [];
  final List<DocumentSnapshot<Map<String, dynamic>>> _pageLastDocs = [];
  int _pageIndex = 0;
  bool _loading = false;
  String? _error;

  final TextEditingController _searchCtrl = TextEditingController();
  Timer? _debounce;
  String _query = '';

  Query<Map<String, dynamic>> get _baseQuery =>
      FirebaseFirestore.instance.collection('carreras').orderBy('fechaHora');

  @override
  void initState() {
    super.initState();
    _loadFirstPage();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadFirstPage() async {
    setState(() { _loading = true; _error = null; });
    try {
      final firstSnap = await _baseQuery.limit(_limit).get();
      _pages..clear()..add(firstSnap.docs);
      _pageLastDocs..clear()..addAll(firstSnap.docs.isNotEmpty ? [firstSnap.docs.last] : []);
      _pageIndex = 0;
    } catch (e) {
      _error = 'Error cargando competencias: $e';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadNextPage() async {
    if (_loading) return;
    if (_pageIndex < _pages.length - 1) {
      setState(() => _pageIndex += 1);
      _scrollToTop();
      return;
    }
    if (_pageLastDocs.length <= _pageIndex) return;
    setState(() { _loading = true; _error = null; });
    try {
      final lastDoc = _pageLastDocs[_pageIndex];
      final snap = await _baseQuery.startAfterDocument(lastDoc).limit(_limit).get();
      _pages.add(snap.docs);
      if (snap.docs.isNotEmpty) _pageLastDocs.add(snap.docs.last);
      setState(() => _pageIndex += 1);
      _scrollToTop();
    } catch (e) {
      _error = 'Error cargando más competencias: $e';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _loadPrevPage() {
    if (_pageIndex == 0) return;
    setState(() => _pageIndex -= 1);
    _scrollToTop();
  }

  Future<void> _refresh() async => _loadFirstPage();

  void _scrollToTop() {
    if (!_scroll.hasClients) return;
    _scroll.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
  }

  void _onQueryChanged(String text) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () {
      if (!mounted) return;
      setState(() => _query = text.trim().toLowerCase());
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    // Acceso 
    final List<QueryDocumentSnapshot<Map<String, dynamic>>> currentDocs =
        (_pages.isNotEmpty && _pageIndex >= 0 && _pageIndex < _pages.length)
            ? _pages[_pageIndex]
            : <QueryDocumentSnapshot<Map<String, dynamic>>>[];

    final hasMore = currentDocs.length == _limit;

    final filteredDocs = _query.isEmpty
        ? currentDocs
        : currentDocs.where((d) {
            final data = d.data();
            final nombre = (data['nombre'] ?? '').toString().toLowerCase();
            return nombre.contains(_query);
          }).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(bottom: 10, left: 2, right: 2),
            child: Text('Eventos Deportivos',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          ),
          _SearchBarFrosted(
            controller: _searchCtrl,
            onChanged: _onQueryChanged,
            hintText: 'Buscar por nombre…',
          ),
          const SizedBox(height: 12),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: _error != null
                  ? ListView(children: [ _ErrorCard(message: _error!, onRetry: _refresh) ])
                  : _loading && _pages.isEmpty
                      ? const _LoadingSkeleton()
                      : Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.orange, width: 1),
                            color: Colors.white,
                          ),
                          child: filteredDocs.isEmpty
                              // Lista vacía PERO con paginación al final del contenedor
                              ? ListView(
                                  controller: _scroll,
                                  padding: const EdgeInsets.all(12),
                                  children: [
                                    const SizedBox(height: 80),
                                    const Center(child: Text('Sin resultados en esta página.')),
                                    const SizedBox(height: 12),
                                    _PaginationBar(
                                      pageIndex: _pageIndex,
                                      canPrev: _pageIndex > 0,
                                      canNext: (!_loading && hasMore) || _pageIndex < _pages.length - 1,
                                      onPrev: _loadPrevPage,
                                      onNext: _loadNextPage,
                                    ),
                                  ],
                                )
                              // Lista con ítems y la paginación como ÚLTIMO ítem
                              : ListView.builder(
                                  key: const PageStorageKey('lista-inicio'),
                                  controller: _scroll,
                                  padding: const EdgeInsets.all(8),
                                  itemCount: filteredDocs.length + 1, // +1 para la paginación
                                  itemBuilder: (context, index) {
                                    // Footer de paginación al final
                                    if (index == filteredDocs.length) {
                                      return Padding(
                                        padding: const EdgeInsets.only(top: 8, bottom: 4),
                                        child: _PaginationBar(
                                          pageIndex: _pageIndex,
                                          canPrev: _pageIndex > 0,
                                          canNext: (!_loading && hasMore) || _pageIndex < _pages.length - 1,
                                          onPrev: _loadPrevPage,
                                          onNext: _loadNextPage,
                                        ),
                                      );
                                    }

                                    final doc = filteredDocs[index];
                                    final data = doc.data();
                                    final etapa = data['etapa'];
                                    final dt = _asDateTime(data['fechaHora']);
                                    final meta = dt != null
                                        ? 'Etapa ${etapa ?? '-'} • ${_formatShort(dt)}'
                                        : 'Etapa ${etapa ?? '-'}';

                                    return Column(
                                      children: [
                                        ListTile(
                                          dense: true,
                                          minLeadingWidth: 28,
                                          minVerticalPadding: 8,
                                          contentPadding: const EdgeInsets.symmetric(
                                              vertical: 6.0, horizontal: 12.0),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          tileColor: Colors.orange.withOpacity(0.05),
                                          leading: const Icon(Icons.emoji_events_outlined, size: 22),
                                          title: Text(
                                            data['nombre'] ?? 'Sin nombre',
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 16, fontWeight: FontWeight.w700),
                                          ),
                                          subtitle: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const SizedBox(height: 2),
                                              Text(meta,
                                                  style: const TextStyle(fontSize: 13, color: Colors.black87)),
                                              Text('Disciplina: ${data['disciplina'] ?? 'N/A'}',
                                                  style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                            ],
                                          ),
                                          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                                          onTap: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) => DetallesCompetenciaPage(
                                                  carreraId: doc.id,
                                                  nombre: data['nombre'] ?? 'Sin nombre',
                                                ),
                                              ),
                                            );
                                          },
                                        ),
                                        // Divider entre ítems
                                        if (index < filteredDocs.length - 1)
                                          const Divider(height: 1, color: Colors.black12),
                                      ],
                                    );
                                  },
                                ),
                        ),
            ),
          ),
          // 👇 Ya NO hay paginación fija aquí; ahora vive dentro del contenedor/lista
        ],
      ),
    );
  }
}

class _PaginationBar extends StatelessWidget {
  final int pageIndex;
  final bool canPrev;
  final bool canNext;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  const _PaginationBar({
    required this.pageIndex,
    required this.canPrev,
    required this.canNext,
    required this.onPrev,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final btnStyle = OutlinedButton.styleFrom(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      minimumSize: const Size(0, 36),
      visualDensity: VisualDensity.compact,
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8,
          runSpacing: 8,
          children: [
            OutlinedButton.icon(
              onPressed: canPrev ? onPrev : null,
              style: btnStyle,
              icon: const Icon(Icons.chevron_left_rounded, size: 20),
              label: const Text('Anterior'),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text('Página ${pageIndex + 1}',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
            OutlinedButton.icon(
              onPressed: canNext ? onNext : null,
              style: btnStyle,
              icon: const Icon(Icons.chevron_right_rounded, size: 20),
              label: const Text('Siguiente'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchBarFrosted extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final String hintText;
  const _SearchBarFrosted({
    required this.controller,
    required this.onChanged,
    this.hintText = 'Buscar…',
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Material(
          elevation: 3,
          color: Colors.white.withOpacity(0.78),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 52),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  const Icon(Icons.search_rounded),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: controller,
                      onChanged: onChanged,
                      textInputAction: TextInputAction.search,
                      autocorrect: false,
                      decoration: InputDecoration(
                        hintText: hintText,
                        border: InputBorder.none,
                        isDense: true,
                        suffixIcon: ValueListenableBuilder<TextEditingValue>(
                          valueListenable: controller,
                          builder: (_, value, __) {
                            if (value.text.isEmpty) return const SizedBox.shrink();
                            return IconButton(
                              onPressed: () {
                                controller.clear();
                                onChanged('');
                              },
                              icon: const Icon(Icons.clear_rounded),
                              tooltip: 'Limpiar',
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorCard({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange, width: 1.5),
        color: Colors.white,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Ocurrió un problema', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(message),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Reintentar'),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemBuilder: (_, __) => Container(
        height: 64,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemCount: 6,
    );
  }
}

/// ================= ASIGNADAS ================================================
class _AsignadasTab extends StatefulWidget {
  const _AsignadasTab();
  @override
  State<_AsignadasTab> createState() => __AsignadasTabState();
}

class __AsignadasTabState extends State<_AsignadasTab>
    with AutomaticKeepAliveClientMixin<_AsignadasTab> {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final uid = FirebaseAuth.instance.currentUser?.uid;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('carreras')
            .orderBy('fechaHora')
            .snapshots(),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final docs = snap.data?.docs ?? [];
          final asignadas = docs.where((d) {
            final data = d.data();
            final List asignados = (data['asignados'] ?? []) as List;
            final juezId = data['juezId'];
            final porLista = uid != null && asignados.any((e) => e == uid);
            final porCampo = uid != null && juezId == uid;
            return porLista || porCampo;
          }).toList();

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(bottom: 10, left: 2, right: 2),
                child: Text('Asignadas',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              ),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.orange, width: 1.5),
                    color: Colors.white,
                  ),
                  child: asignadas.isEmpty
                      ? const Center(child: Text('No tienes competencias asignadas.'))
                      : ListView.separated(
                          key: const PageStorageKey('lista-asignadas'),
                          padding: const EdgeInsets.all(8),
                          itemCount: asignadas.length,
                          separatorBuilder: (_, __) =>
                              const Divider(height: 1, color: Colors.black12),
                          itemBuilder: (context, index) {
                            final doc = asignadas[index];
                            final data = doc.data();
                            final etapa = data['etapa'];
                            final dt = _asDateTime(data['fechaHora']);
                            final meta = dt != null
                                ? 'Etapa ${etapa ?? '-'} • ${_formatShort(dt)}'
                                : 'Etapa ${etapa ?? '-'}';

                            return ListTile(
                              dense: true,
                              minLeadingWidth: 28,
                              minVerticalPadding: 8,
                              contentPadding: const EdgeInsets.symmetric(
                                  vertical: 6.0, horizontal: 12.0),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                              tileColor: Colors.orange.withOpacity(0.05),
                              leading: const Icon(Icons.assignment_turned_in_outlined, size: 22),
                              title: Text(
                                data['nombre'] ?? 'Sin nombre',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 2),
                                  Text(meta, style: const TextStyle(fontSize: 13, color: Colors.black87)),
                                  Text('Disciplina: ${data['disciplina'] ?? 'N/A'}',
                                      style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                ],
                              ),
                              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => DetallesCompetenciaPage(
                                      carreraId: doc.id,
                                      nombre: data['nombre'] ?? 'Sin nombre',
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                        ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// ================= PERFIL ====================================================
class _PerfilTab extends StatelessWidget {
  const _PerfilTab();
  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.orange, width: 1.5),
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
              Text('UID: ${user?.uid ?? '-'}',
                  style: const TextStyle(color: Colors.black54, fontSize: 12)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () async {
                  try {
                    await FirebaseAuth.instance.signOut();
                  } catch (e) {
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('No se pudo cerrar sesión: $e')),
                    );
                  }
                  if (!context.mounted) return;

                  // 👉 A Login y limpiar el stack (sin rutas con nombre)
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginPage()),
                    (route) => false,
                  );
                },
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Cerrar sesión'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange, foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  minimumSize: const Size(0, 40),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
