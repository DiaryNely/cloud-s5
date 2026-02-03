package mg.sig.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un signalement de travaux routiers.
 */
@Entity
@Table(name = "signalements")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "localisation", nullable = false, length = 255)
    private String localisation;

    @Column(name = "latitude", nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false, precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "surface", precision = 10, scale = 2)
    private BigDecimal surface;

    @Column(name = "budget_estime", precision = 15, scale = 2)
    private BigDecimal budgetEstime;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "status_id", nullable = false)
    private SignalementStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cree_par_id", nullable = false)
    private User creePar;

    @Column(name = "firebase_id", unique = true, length = 128)
    private String firebaseId;

    @Column(name = "synced_with_firebase")
    @Builder.Default
    private Boolean syncedWithFirebase = false;

    @Column(name = "last_firebase_sync")
    private LocalDateTime lastFirebaseSync;

    @CreatedDate
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @LastModifiedDate
    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @OneToMany(mappedBy = "signalement", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @OrderBy("dateModification DESC")
    @Builder.Default
    private List<SignalementHistorique> historique = new ArrayList<>();

    /**
     * Retourne le nom de l'entreprise ou null
     */
    public String getEntrepriseNom() {
        return entreprise != null ? entreprise.getNom() : null;
    }

    /**
     * Retourne le nom complet du créateur
     */
    public String getCreateurNom() {
        return creePar != null ? creePar.getNomComplet() : null;
    }
}
