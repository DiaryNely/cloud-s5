package mg.uem.mg.clouds5p17authapi.service;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import mg.uem.mg.clouds5p17authapi.dto.SignalementCreateRequest;
import mg.uem.mg.clouds5p17authapi.dto.SignalementUpdateRequest;
import mg.uem.mg.clouds5p17authapi.entity.PrixForfaitaire;
import mg.uem.mg.clouds5p17authapi.entity.Signalement;
import mg.uem.mg.clouds5p17authapi.repository.PrixForfaitaireRepository;
import mg.uem.mg.clouds5p17authapi.repository.SignalementRepository;

@Service
public class SignalementService {

    private static final Logger log = LoggerFactory.getLogger(SignalementService.class);

    private final SignalementRepository repository;
    private final PrixForfaitaireRepository prixForfaitaireRepository;
    private final FirebaseService firebaseService;

    public SignalementService(SignalementRepository repository, PrixForfaitaireRepository prixForfaitaireRepository, FirebaseService firebaseService) {
        this.repository = repository;
        this.prixForfaitaireRepository = prixForfaitaireRepository;
        this.firebaseService = firebaseService;
    }

    public List<Signalement> listAll() {
        return repository.findAll();
    }

    public List<Signalement> listByUserUid(String userUid) {
        return repository.findByUserUid(userUid);
    }

    public Signalement create(SignalementCreateRequest request, String userUid, String userEmail) {
        Signalement entity = new Signalement();
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setLatitude(request.latitude());
        entity.setLongitude(request.longitude());
        entity.setSurfaceM2(request.surfaceM2());
        // Niveau de réparation (1-10), par défaut 1
        int niveau = (request.niveau() != null && request.niveau() >= 1 && request.niveau() <= 10) ? request.niveau() : 1;
        entity.setNiveau(niveau);
        // Calcul automatique du budget = surface * prixM2 * niveau
        if (request.surfaceM2() != null) {
            List<PrixForfaitaire> prixList = prixForfaitaireRepository.findAll();
            if (!prixList.isEmpty()) {
                entity.setBudgetAr(request.surfaceM2() * prixList.get(0).getPrixM2() * niveau);
            }
        }
        entity.setEntreprise(request.entreprise());
        entity.setStatus("NOUVEAU");
        entity.setUserUid(userUid);
        entity.setUserEmail(userEmail);
        Signalement saved = repository.save(entity);
        
        // Synchronisation automatique vers Firebase pour le mobile
        // Le web utilise Firebase en temps réel
        try {
            String firebaseId = firebaseService.saveSignalement(saved);
            if (firebaseId != null) {
                saved.setFirebaseId(firebaseId);
                saved.setSyncedToFirebase(true);
                saved = repository.save(saved);
            }
        } catch (Exception e) {
            log.warn("Impossible de synchroniser vers Firebase (mode offline?): {}", e.getMessage());
        }
        
        return saved;
    }

    public Optional<Signalement> update(Long id, SignalementUpdateRequest request) {
        return repository.findById(id).map(signalement -> {
            if (request.title() != null) {
                signalement.setTitle(request.title());
            }
            if (request.description() != null) {
                signalement.setDescription(request.description());
            }
            if (request.status() != null) {
                signalement.setStatus(request.status());
            }
            if (request.surfaceM2() != null) {
                signalement.setSurfaceM2(request.surfaceM2());
            }
            if (request.budgetAr() != null) {
                signalement.setBudgetAr(request.budgetAr());
            }
            if (request.entreprise() != null) {
                signalement.setEntreprise(request.entreprise());
            }
            if (request.dateNouveau() != null) {
                signalement.setDateNouveau(request.dateNouveau());
            }
            if (request.dateEnCours() != null) {
                signalement.setDateEnCours(request.dateEnCours());
            }
            if (request.dateTermine() != null) {
                signalement.setDateTermine(request.dateTermine());
            }
            if (request.photoUrl() != null) {
                signalement.setPhotoUrl(request.photoUrl());
            }
            // Gestion du niveau et recalcul du budget
            boolean niveauChanged = false;
            boolean surfaceChanged = false;
            if (request.niveau() != null && request.niveau() >= 1 && request.niveau() <= 10) {
                signalement.setNiveau(request.niveau());
                niveauChanged = true;
            }
            if (request.surfaceM2() != null) {
                surfaceChanged = true;
            }
            // Recalcul automatique du budget si niveau ou surface changé
            if (niveauChanged || surfaceChanged) {
                Double surface = signalement.getSurfaceM2();
                Integer niv = signalement.getNiveau() != null ? signalement.getNiveau() : 1;
                if (surface != null) {
                    List<PrixForfaitaire> prixList = prixForfaitaireRepository.findAll();
                    if (!prixList.isEmpty()) {
                        signalement.setBudgetAr(surface * prixList.get(0).getPrixM2() * niv);
                    }
                }
            }
            Signalement saved = repository.save(signalement);
            
            // Synchronisation automatique vers Firebase
            try {
                String firebaseId = firebaseService.saveSignalement(saved);
                if (firebaseId != null) {
                    saved.setFirebaseId(firebaseId);
                    saved.setSyncedToFirebase(true);
                    saved = repository.save(saved);
                }
            } catch (Exception e) {
                log.warn("Impossible de synchroniser vers Firebase (mode offline?): {}", e.getMessage());
            }
            
            return saved;
        });
    }
}
