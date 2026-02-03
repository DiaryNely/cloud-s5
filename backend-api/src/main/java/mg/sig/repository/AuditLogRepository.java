package mg.sig.repository;

import mg.sig.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {
    
    List<AuditLog> findByUserEmailOrderByDateActionDesc(String userEmail);
    
    List<AuditLog> findByActionOrderByDateActionDesc(String action);
    
    @Query("SELECT a FROM AuditLog a ORDER BY a.dateAction DESC")
    List<AuditLog> findAllOrderByDateActionDesc();
    
    @Query("SELECT a FROM AuditLog a ORDER BY a.dateAction DESC")
    Page<AuditLog> findAllOrderByDateActionDesc(Pageable pageable);
    
    @Query("SELECT a FROM AuditLog a WHERE a.dateAction BETWEEN :start AND :end ORDER BY a.dateAction DESC")
    List<AuditLog> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT a FROM AuditLog a WHERE a.entite = :entite AND a.entiteId = :entiteId ORDER BY a.dateAction DESC")
    List<AuditLog> findByEntite(@Param("entite") String entite, @Param("entiteId") Integer entiteId);
}
