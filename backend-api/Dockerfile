FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app

# Copier les fichiers Maven
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Télécharger les dépendances
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copier le code source
COPY src src

# Builder l'application
RUN ./mvnw clean package -DskipTests -B

# Image finale
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Installer curl pour le health check
RUN apk add --no-cache curl

# Copier le jar
COPY --from=build /app/target/*.jar app.jar

# Variables d'environnement par défaut
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Port exposé
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/actuator/health || exit 1

# Démarrage
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
