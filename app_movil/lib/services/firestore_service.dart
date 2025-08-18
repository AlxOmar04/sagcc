import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Obtener lista de competencias
  Stream<QuerySnapshot> getCompetencias() {
    return _db.collection('carreras').snapshots();
  }

  // Obtener detalles y competidores de una competencia por ID
  Stream<DocumentSnapshot> getCarrera(String carreraId) {
    return _db.collection('carreras').doc(carreraId).snapshots();
  }

  Stream<QuerySnapshot> getCompetidores(String carreraId) {
    return _db
        .collection('carreras')
        .doc(carreraId)
        .collection('competidores')
        .snapshots();
  }
}
