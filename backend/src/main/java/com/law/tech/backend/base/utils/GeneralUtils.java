package com.law.tech.backend.base.utils;

public class GeneralUtils {
    public static String getNameFromLoginId(String loginId) {
        if (loginId == null || loginId.isEmpty()) {
            return null;
        }
        if (loginId.contains("@")) {
            return loginId.split("@")[0];
        }
        // means loginId is not an email
        return loginId;
    }

    public static String getSubstring(String str, int startIndex, int maxLength) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(startIndex, Math.min(str.length(), startIndex + maxLength));
    }
}
