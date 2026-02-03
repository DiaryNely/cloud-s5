package mg.sig.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entité représentant les statuts de signalement.
 * Table de référence - pas d'enum Java.
 */
@Entity
@Table(name = "signalement_status")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "libelle", nullable = false, length = 100)
    private String libelle;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "couleur", length = 20)
    private String couleur;

    @Column(name = "ordre")
    @Builder.Default
    private Integer ordre = 0;

    @Column(name = "actif")
    @Builder.Default
    private Boolean actif = true;

    @CreatedDate
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    // Constantes pour les codes de statut
    public static final String NOUVEAU = "NOUVEAU";
    public static final String EN_COURS = "EN_COURS";
    public static final String PLANIFIE = "PLANIFIE";
    public static final String EN_ATTENTE = "EN_ATTENTE";
    public static final String TERMINE = "TERMINE";
}
