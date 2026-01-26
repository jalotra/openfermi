package com.law.tech.backend.base.query;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface SearchableField {
    /** Display name for the field (optional, defaults to field name) */
    String displayName() default "";

    /** Whether this field can be used for filtering */
    boolean filterable() default true;

    /** Whether this field can be used for text search */
    boolean searchable() default true;

    /** Whether this field can be used for sorting */
    boolean sortable() default true;

    /** Field type for query building */
    FieldType type() default FieldType.STRING;

    /** Value source type - DATABASE for DB queries, ENUM for predefined values */
    ValueSourceType valueSource() default ValueSourceType.DATABASE;

    /** For ENUM value source, specify the enum class */
    Class<? extends Enum<?>> enumClass() default DefaultEnum.class;

    /** Synonyms for field name matching */
    String[] synonyms() default {};

    // Default enum to avoid compilation issues
    enum DefaultEnum {
    // Empty default enum
    }
}
