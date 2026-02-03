package mg.sig.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entité représentant une tentative de connexion.
 */
@Entity
@Table(name = "tentatives_connexion")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TentativeConnexion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "reussi")
    @Builder.Default
    private Boolean reussi = false;

    @Column(name = "motif_echec", columnDefinition = "TEXT")
    private String motifEchec;

    @CreatedDate
    @Column(name = "date_tentative", updatable = false)
    private LocalDateTime dateTentative;
}
