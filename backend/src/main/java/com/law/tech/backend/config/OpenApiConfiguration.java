package com.law.tech.backend.config;

import com.law.tech.backend.base.controllers.BaseController;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.parameters.Parameter;
import java.util.Objects;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.method.HandlerMethod;

@Configuration
public class OpenApiConfiguration {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Courts and Law API")
                        .version("1.0.0")
                        .description("API for managing legal cases, judges, and lawyers"));
    }

    // This helps to keep the operationId different for controllers that extend BaseController
    @Bean
    public OperationCustomizer operationIdCustomizer() {
        return new OperationCustomizer() {
            @Override
            public Operation customize(Operation operation, HandlerMethod handlerMethod) {
                Class<?> superClazz = handlerMethod.getBeanType().getSuperclass();
                if (Objects.nonNull(superClazz) && superClazz.isAssignableFrom(BaseController.class)) {
                    String beanName = handlerMethod
                            .getBeanType()
                            .getSimpleName()
                            .toLowerCase()
                            .replace("controller", "");
                    String methodName = handlerMethod.getMethod().getName();
                    if (methodName.length() > 1) {
                        methodName = methodName.substring(0, 1).toUpperCase() + methodName.substring(1);
                    }
                    operation.setOperationId(String.format("%s%s", beanName, methodName));
                }
                return operation;
            }
        };
    }

    // This customizer ensures Content-Type headers are properly added for JSON endpoints
    @Bean
    public OperationCustomizer contentTypeHeaderCustomizer() {
        return new OperationCustomizer() {
            @Override
            public Operation customize(Operation operation, HandlerMethod handlerMethod) {
                // Get the RequestMapping annotation from the controller class
                RequestMapping classMapping = handlerMethod.getBeanType().getAnnotation(RequestMapping.class);

                if (classMapping != null) {
                    String[] consumes = classMapping.consumes();
                    // If the controller consumes APPLICATION_JSON, add Content-Type header
                    for (String contentType : consumes) {
                        if (org.springframework.http.MediaType.APPLICATION_JSON_VALUE.equals(contentType)) {
                            // Check if Content-Type parameter doesn't already exist
                            boolean hasContentType = operation.getParameters() != null
                                    && operation.getParameters().stream()
                                            .anyMatch(p -> "Content-Type".equals(p.getName()));

                            if (!hasContentType) {
                                Parameter contentTypeParam = new Parameter()
                                        .name("Content-Type")
                                        .in("header")
                                        .required(true)
                                        .description("Content type of the request body")
                                        .example(org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
                                        .schema(new io.swagger.v3.oas.models.media.StringSchema()
                                                ._default(org.springframework.http.MediaType.APPLICATION_JSON_VALUE));

                                operation.addParametersItem(contentTypeParam);
                            }
                            break;
                        }
                    }
                }

                return operation;
            }
        };
    }
}
