package mg.sig.repository;

import mg.sig.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserStatusRepository extends JpaRepository<UserStatus, Integer> {
    
    Optional<UserStatus> findByCode(String code);
    
    boolean existsByCode(String code);
}
