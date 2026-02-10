package mg.uem.mg.clouds5p17authapi.exception;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("IllegalArgumentException: {}", ex.getMessage());
        
        String message = ex.getMessage();
        
        // Traduction des messages d'erreur Firebase en français
        if (message.contains("password must be at least 6 characters")) {
            message = "Le mot de passe doit contenir au moins 6 caractères";
        } else if (message.contains("email is invalid")) {
            message = "L'adresse email est invalide";
        } else if (message.contains("email already exists")) {
            message = "Cette adresse email est déjà utilisée";
        }
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                    "error", message,
                    "status", HttpStatus.BAD_REQUEST.value()
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Une erreur inattendue s'est produite",
                    "status", HttpStatus.INTERNAL_SERVER_ERROR.value()
                ));
    }
}
