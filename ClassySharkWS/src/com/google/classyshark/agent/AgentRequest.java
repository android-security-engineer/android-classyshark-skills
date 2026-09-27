/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/** A small JSON request understood by the Agent command layer. */
public final class AgentRequest {
    private final String command;
    private final JsonObject params;

    private AgentRequest(String command, JsonObject params) {
        this.command = command;
        this.params = params == null ? new JsonObject() : params;
    }

    public static AgentRequest parse(String json) {
        JsonElement parsed = new JsonParser().parse(json);
        if (!parsed.isJsonObject()) {
            throw new IllegalArgumentException("request must be a JSON object");
        }

        JsonObject object = parsed.getAsJsonObject();
        String command = getString(object, "command");
        if (command.isEmpty()) {
            // "method" makes the wire shape easy to adapt to JSON-RPC/MCP later.
            command = getString(object, "method");
        }
        if (command.isEmpty()) {
            throw new IllegalArgumentException("request.command is required");
        }

        JsonObject params = new JsonObject();
        JsonElement paramsElement = object.get("params");
        if (paramsElement != null && !paramsElement.isJsonNull()) {
            if (!paramsElement.isJsonObject()) {
                throw new IllegalArgumentException("request.params must be an object");
            }
            params = paramsElement.getAsJsonObject();
        }
        return new AgentRequest(command, params);
    }

    public static AgentRequest of(String command) {
        return new AgentRequest(command, new JsonObject());
    }

    public String getCommand() {
        return command;
    }

    public JsonObject getParams() {
        return params;
    }

    static String getString(JsonObject object, String name) {
        JsonElement value = object.get(name);
        return value == null || value.isJsonNull() ? "" : value.getAsString();
    }
}
