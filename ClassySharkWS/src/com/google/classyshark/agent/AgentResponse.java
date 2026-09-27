/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

/** JSON response envelope shared by all Agent transports. */
public final class AgentResponse {
    private static final Gson GSON = new Gson();

    private final JsonObject json;

    private AgentResponse(JsonObject json) {
        this.json = json;
    }

    public static AgentResponse success(String command, JsonObject data) {
        JsonObject result = new JsonObject();
        result.addProperty("ok", true);
        result.addProperty("command", command);
        result.add("data", data == null ? new JsonObject() : data);
        return new AgentResponse(result);
    }

    public static AgentResponse error(String command, String code, String message) {
        JsonObject result = new JsonObject();
        result.addProperty("ok", false);
        if (command != null && !command.isEmpty()) {
            result.addProperty("command", command);
        }
        JsonObject error = new JsonObject();
        error.addProperty("code", code);
        error.addProperty("message", message == null ? "" : message);
        result.add("error", error);
        return new AgentResponse(result);
    }

    public String toJson() {
        return GSON.toJson(json);
    }

    public JsonObject getJson() {
        return json;
    }

    public String getCommand() {
        return json.has("command") ? json.get("command").getAsString() : "";
    }

    public JsonObject getData() {
        return json.has("data") ? json.getAsJsonObject("data") : new JsonObject();
    }

    public JsonObject getError() {
        return json.has("error") ? json.getAsJsonObject("error") : new JsonObject();
    }
}
