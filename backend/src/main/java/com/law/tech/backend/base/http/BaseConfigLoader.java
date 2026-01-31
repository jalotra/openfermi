package com.law.tech.backend.base.http;

import java.beans.PropertyDescriptor;
import java.util.stream.Stream;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;

public class BaseConfigLoader {
    public static String[] getNonNullPropertyNames(Object source) {
        final BeanWrapper wrappedSource = new BeanWrapperImpl(source);
        return Stream.of(wrappedSource.getPropertyDescriptors())
                .map(PropertyDescriptor::getName)
                .filter(propertyName -> {
                    try {
                        return wrappedSource.getPropertyValue(propertyName) != null;
                    } catch (Exception e) {
                        return false;
                    }
                })
                .toArray(String[]::new);
    }

    public static BaseConfig loadConfig(BaseConfig defaultConfig, BaseConfig newConfig) {
        String[] nonNullPropsName = getNonNullPropertyNames(newConfig);
        BeanUtils.copyProperties(defaultConfig, newConfig, nonNullPropsName);
        return newConfig;
    }
}
