package com.law.tech.backend.base.http;

import java.util.List;
import okhttp3.Interceptor;

public interface IBaseClientFactory {
    <T extends BaseClient> T get3pClient(Class<T> clazz, String clientName, BaseConfig config);

    <T extends BaseClient> T get3pClient(Class<T> clazz, String clientName);

    <T extends BaseClient> T get3pClient(
            Class<T> clazz, String clientName, BaseConfig config, List<Interceptor> interceptorList);
}
