import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class VerTiemposPage extends StatelessWidget {
  final String competenciaId;

  const VerTiemposPage({super.key, required this.competenciaId});

  String formatearHora(Timestamp timestamp) {
    final date = timestamp.toDate();
    return DateFormat('HH:mm:ss').format(date);
  }

  String etiquetarTiempo(int index) {
    switch (index) {
      case 0:
        return 'Salida';
      case 1:
        return 'Punto Intermedio';
      case 2:
        return 'Llegada';
      default:
        return 'Extra #${index + 1}';
    }
  }

  Icon obtenerIconoPorEtiqueta(String etiqueta) {
    switch (etiqueta.toLowerCase()) {
      case 'salida':
        return const Icon(Icons.flag, color: Color.fromARGB(255, 111, 204, 34), size: 20);
      case 'punto intermedio':
        return const Icon(Icons.timelapse, color: Color.fromARGB(255, 229, 243, 33), size: 20);
      case 'llegada':
        return const Icon(Icons.flag_circle, color: Color.fromARGB(255, 238, 64, 33), size: 20);
      default:
        return const Icon(Icons.access_time, color: Colors.grey, size: 20);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],

      // AppBar con el mismo estilo "premium" que Home/Detalles,
      // sin logo; solo flecha de back y el título "Tiempos Registrados".
      appBar: const PreferredSize(
        preferredSize: Size.fromHeight(72),
        child: _GradientAppBarPremium(title: 'Tiempos Registrados'),
      ),

      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('carreras')
            .doc(competenciaId)
            .collection('competidores')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Padding(
              padding: EdgeInsets.all(16.0),
              child: _NaranjaContainer(
                child: Center(
                  child: Text('No hay competidores con tiempos registrados'),
                ),
              ),
            );
          }

          final competidores = snapshot.data!.docs;

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: _NaranjaContainer(
              child: ListView.builder(
                itemCount: competidores.length,
                itemBuilder: (context, index) {
                  final comp = competidores[index];
                  final nombre = (comp['nombre'] ?? 'Sin nombre').toString();
                  final dorsal = (comp['dorsal']?.toString() ?? 'S/N');

                  final tiemposArray = (comp.data() as Map<String, dynamic>?)
                          ?['tiempos'] as List<dynamic>? ??
                      const <dynamic>[];

                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: const Icon(
                              Icons.person,
                              color: Colors.orange,
                              size: 32,
                            ),
                            title: Text(
                              nombre,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            subtitle: Text('Dorsal: $dorsal'),
                          ),
                          const SizedBox(height: 8),

                          if (tiemposArray.isNotEmpty)
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: List.generate(tiemposArray.length, (i) {
                                final t = tiemposArray[i];
                                final etiqueta = (t['etiqueta'] ?? etiquetarTiempo(i)).toString();
                                final ts = t['timestamp'];
                                final hora = ts is Timestamp ? formatearHora(ts) : '—';

                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 2),
                                  child: Row(
                                    children: [
                                      obtenerIconoPorEtiqueta(etiqueta),
                                      const SizedBox(width: 8),
                                      Text(
                                        '$etiqueta: $hora',
                                        style: const TextStyle(color: Colors.black87),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            )
                          else
                            StreamBuilder<QuerySnapshot>(
                              stream: FirebaseFirestore.instance
                                  .collection('carreras')
                                  .doc(competenciaId)
                                  .collection('competidores')
                                  .doc(comp.id)
                                  .collection('tiempos')
                                  .orderBy('timestamp')
                                  .snapshots(),
                              builder: (context, tiemposSnap) {
                                if (tiemposSnap.connectionState == ConnectionState.waiting) {
                                  return const Text('Cargando tiempos...');
                                }

                                if (!tiemposSnap.hasData || tiemposSnap.data!.docs.isEmpty) {
                                  return const Text('No hay tiempos registrados');
                                }

                                final docs = tiemposSnap.data!.docs;
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: List.generate(docs.length, (i) {
                                    final ts = docs[i]['timestamp'];
                                    final etiqueta = etiquetarTiempo(i);
                                    final hora = ts is Timestamp ? formatearHora(ts) : '—';

                                    return Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 2),
                                      child: Row(
                                        children: [
                                          obtenerIconoPorEtiqueta(etiqueta),
                                          const SizedBox(width: 8),
                                          Text(
                                            '$etiqueta: $hora',
                                            style: const TextStyle(color: Colors.black87),
                                          ),
                                        ],
                                      ),
                                    );
                                  }),
                                );
                              },
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          );
        },
      ),
    );
  }
}

/// AppBar premium (mismo estilo que Home/Detalles), sin logo
class _GradientAppBarPremium extends StatelessWidget {
  final String title;
  const _GradientAppBarPremium({required this.title});

  @override
  Widget build(BuildContext context) {
    return AppBar(
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
      automaticallyImplyLeading: true, // muestra la flecha de back
      iconTheme: const IconThemeData(color: Colors.black),
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.black,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.2,
        ),
      ),
      centerTitle: false,
    );
  }
}

/// Contenedor con borde naranja y fondo blanco
class _NaranjaContainer extends StatelessWidget {
  final Widget child;
  const _NaranjaContainer({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.orange, width: 2),
        borderRadius: BorderRadius.circular(16),
        color: Colors.white,
      ),
      padding: const EdgeInsets.all(8),
      child: child,
    );
  }
}
