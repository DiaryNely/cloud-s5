package mg.sig.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entité représentant l'historique des changements de statut d'un signalement.
 */
@Entity
@Table(name = "signalement_historique")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementHistorique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signalement_id", nullable = false)
    private Signalement signalement;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ancien_status_id")
    private SignalementStatus ancienStatus;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "nouveau_status_id", nullable = false)
    private SignalementStatus nouveauStatus;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "modifie_par_id", nullable = false)
    private User modifiePar;

    @Column(name = "commentaire", columnDefinition = "TEXT")
    private String commentaire;

    @CreatedDate
    @Column(name = "date_modification", updatable = false)
    private LocalDateTime dateModification;
}
