# OpenFermi Backend

A comprehensive Spring Boot backend application for managing JEE/NEET questions and practice sessions. This system provides REST APIs for question management with features including question tracking, session management, and comprehensive question details.

## 🏗️ Architecture Overview

This is a modern Java backend built with Spring Boot 3.5.0, providing a robust and scalable foundation for educational question management. The application follows clean architecture principles with clear separation of concerns.

### Tech Stack

- **Java 21** - Latest LTS version for optimal performance
- **Spring Boot 3.5.0** - Main framework
- **Spring Data JPA** - Database operations
- **Spring Security** - Authentication and authorization
- **Spring Actuator** - Health checks and monitoring
- **PostgreSQL** - Primary database
- **MapStruct 1.6.3** - DTO to Entity mapping
- **Lombok** - Boilerplate code reduction
- **SpringDoc OpenAPI** - API documentation
- **Maven** - Build and dependency management
- **AWS S3** - File storage for question images and resources

## 🚀 Features

### Core Capabilities
- **CRUD Operations**: Full create, read, update, delete for all entities
- **Pagination Support**: Efficient data retrieval with page-based queries
- **Query System**: Advanced filtering and search capabilities
- **S3 Integration**: Presigned URLs for secure file access
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation
- **Health Monitoring**: Built-in health checks and metrics via Actuator

## 📋 Prerequisites

- **Java 21** or higher
- **Maven 3.6+**
- **PostgreSQL 12+**
- **Git**

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd openfermi/backend
```

### 2. Environment Variables
Create a `.env` file or set the following environment variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=openfermi
POSTGRES_USERNAME=your_postgres_username
POSTGRES_PASSWORD=your_postgres_password

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Descope Authentication
DESCOPE_PROJECT_ID=your_descope_project_id
DESCOPE_MANAGEMENT_KEY=your_descope_management_key

# AWS S3 Configuration
AWS_REGION=ap-south-1
S3_ACCESS_KEY_ID=your_s3_access_key
S3_SECRET_ACCESS_KEY=your_s3_secret_key

# JWT Configuration
JWT_ISSUER=your_jwt_issuer
JWT_ACCESS_TTL_MINUTES=60
JWT_HMAC_SECRET=your_jwt_secret

# LLM Configuration (optional)
LLM_BASE_URL=http://localhost:8000
```

### 3. Database Setup
Ensure PostgreSQL is running and create a database:
```sql
CREATE DATABASE openfermi;
```

### 4. Build the Application
```bash
# Using Maven wrapper (recommended)
./mvnw clean install

# Or using system Maven
mvn clean install
```

### 5. Run the Application
```bash
# Using Maven wrapper
./mvnw spring-boot:run

# Or using system Maven
mvn spring-boot:run

# Or run the JAR directly
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

The application will start on `http://localhost:8080`

## 📚 API Documentation

### Swagger UI
Access the interactive API documentation at:
```
http://localhost:8080/api/swagger-ui.html
```

### OpenAPI JSON
Raw API specification available at:
```
http://localhost:8080/api/v3/api-docs
```

## 🔌 API Endpoints

### Health & Monitoring
- `GET /health` - Application health status
- `GET /actuator/health` - Detailed health status
- `GET /actuator/metrics` - Application metrics
- `GET /actuator/` - All available actuator endpoints

### Presign API
- `POST /presign` - Generate presigned S3 URLs for file uploads

## 🔧 Configuration

### Database Configuration
The application uses PostgreSQL with Hibernate for ORM. Configuration is in `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${POSTGRES_USERNAME}
    password: ${POSTGRES_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

### S3 Configuration
The application integrates with AWS S3 for storing question images and other resources. Presigned URLs are generated for secure access.

## 🧪 Testing

Run the test suite:
```bash
./mvnw test
```

## 📦 Docker Support

### Building Docker Image
```bash
docker build -t openfermi-backend .
```

### Running with Docker
```bash
docker run -p 8080:8080 \
  -e POSTGRES_USERNAME=your_username \
  -e POSTGRES_PASSWORD=your_password \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  openfermi-backend
```

## 🔍 Monitoring & Health Checks

### Health Endpoint
```bash
curl http://localhost:8080/health
```

### Metrics
```bash
curl http://localhost:8080/actuator/metrics
```

## 🏗️ Project Structure

```
src/
├── main/
│   ├── java/com/law/tech/backend/
│   │   ├── base/                    # Base classes for CRUD operations
│   │   │   ├── BaseController.java
│   │   │   ├── BaseCrudService.java
│   │   │   ├── BaseRepository.java
│   │   │   ├── query/              # Query system for filtering/search
│   │   │   └── http/               # HTTP client infrastructure
│   │   ├── config/                 # Configuration classes
│   │   ├── controllers/            # REST controllers
│   │   ├── presign/                # S3 presign URL service
│   │   └── constants/              # Application constants
│   └── resources/
│       └── application.yml         # Application configuration
└── test/                           # Test classes
```

## 🚀 Development

### Adding New Features
1. Create entity classes extending `BaseEntity`
2. Add repository interfaces extending `BaseRepository`
3. Implement service classes extending `BaseCrudService` and `BaseReadService`
4. Create controllers extending `BaseController`
5. Add DTOs and mappers using MapStruct

### Code Generation
MapStruct automatically generates mapper implementations during compilation. Generated classes are in `target/generated-sources/annotations/`.

## 📝 Base Infrastructure

The backend includes a robust base infrastructure that can be extended for new entities:

- **Base CRUD Operations**: Generic CRUD controllers and services
- **Query System**: Advanced filtering, sorting, and search capabilities
- **HTTP Client**: Infrastructure for external API calls
- **Exception Handling**: Comprehensive error handling framework
- **DTO Mapping**: Automatic DTO to Entity conversion using MapStruct

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the [Your License] - see the LICENSE file for details.

## 📞 Support

For support, email [your-email] or create an issue in the repository.

---

**Built with ❤️ for the OpenFermi educational platform**
