# Build Stage
FROM maven:3.9.8-eclipse-temurin-21 AS build

RUN mkdir -p /root/.m2
COPY settings.xml /tmp/settings.xml.template
RUN cp /tmp/settings.xml.template /root/.m2/settings.xml && \
    rm /tmp/settings.xml.template

COPY src /app/src
COPY pom.xml /app

WORKDIR /app
RUN mvn clean install -DskipTests -DskipSpotless=true

# Runtime Stage
FROM eclipse-temurin:21-jre

RUN apt-get update && \
    apt-get install -y curl unzip jq && \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar
COPY startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

WORKDIR /app

EXPOSE 8080

ENTRYPOINT ["/app/startup.sh"]