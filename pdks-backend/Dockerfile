# ---------- Derleme asamasi ----------
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Once wrapper ve pom kopyalanir; bagimliliklar ayri katmanda onbellege alinir
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw && ./mvnw -B -ntp dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -ntp clean package -DskipTests

# ---------- Calisma asamasi ----------
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Uygulama server.port=${PORT:8080} ile bu degiskeni dinler
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
