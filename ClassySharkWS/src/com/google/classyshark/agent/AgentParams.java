/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

import com.google.gson.JsonObject;
import java.io.File;

/**
 * Shared parameter helpers for Agent command services.
 *
 * <p>Package-private and deliberately free of any GUI/Swing dependency so both
 * the headless service and the GUI service can reuse them.</p>
 */
final class AgentParams {
    private AgentParams() {
    }

    /** Reads a required string parameter, throwing if absent/empty. */
    static String required(JsonObject params, String name) {
        String value = AgentRequest.getString(params, name);
        if (value.isEmpty()) {
            throw new IllegalArgumentException("params." + name + " is required");
        }
        return value;
    }

    /** Reads an integer parameter with a default. */
    static int integerParam(JsonObject params, String name, int defaultValue) {
        if (!params.has(name) || params.get(name).isJsonNull()) {
            return defaultValue;
        }
        try {
            return params.get(name).getAsInt();
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("params." + name + " must be an integer");
        }
    }

    /** Reads a boolean parameter with a default. */
    static boolean booleanParam(JsonObject params, String name, boolean defaultValue) {
        if (!params.has(name) || params.get(name).isJsonNull()) {
            return defaultValue;
        }
        try {
            return params.get(name).getAsBoolean();
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("params." + name + " must be a boolean");
        }
    }

    /** Validates and returns the archive {@code path} parameter as a real file. */
    static File archive(JsonObject params) {
        String path = required(params, "path");
        File archive = new File(path);
        if (!archive.exists()) {
            throw new IllegalArgumentException("Archive does not exist: " + path);
        }
        if (!archive.isFile()) {
            throw new IllegalArgumentException("Archive is not a file: " + path);
        }
        return archive;
    }
}
