/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.classyshark.agent.AgentParams;
import com.google.classyshark.agent.AgentRequest;
import com.google.classyshark.agent.AgentResponse;
import com.google.classyshark.agent.AgentCapabilities;
import com.google.classyshark.agent.GuiBridge;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * GUI control service used by {@code -agent-gui-stdio}.
 *
 * <p>Holds the {@code gui.*} commands that drive the live Swing window through
 * {@link GuiBridge}. This service is only meaningful when a GUI is registered;
 * {@link #requireGuiActive} reports a clear error otherwise.</p>
 */
public class GuiAgentService implements CommandService {

    @Override
    public AgentResponse invoke(AgentRequest request) {
        String command = request.getCommand();
        try {
            return dispatch(command, request.getParams());
        } catch (IllegalArgumentException e) {
            return AgentResponse.error(command, "invalid_request", e.getMessage());
        } catch (Exception e) {
            return AgentResponse.error(command, "analysis_failed", safeMessage(e));
        }
    }

    private AgentResponse dispatch(String command, JsonObject params) throws Exception {
        if (AgentCapabilities.CAPABILITIES.equals(command)) {
            JsonObject data = new JsonObject();
            data.add("commands", AgentCapabilities.asJson());
            data.addProperty("protocol", "classyshark-agent-v1");
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_STATUS.equals(command)) {
            JsonObject data = new JsonObject();
            data.addProperty("guiActive", GuiBridge.INSTANCE.isGuiActive());
            data.addProperty("archiveLoaded", GuiBridge.INSTANCE.isArchiveLoaded());
            data.addProperty("archivePath", GuiBridge.INSTANCE.getArchivePath());
            data.addProperty("currentClass", GuiBridge.INSTANCE.getCurrentClass());
            data.addProperty("searchText", GuiBridge.INSTANCE.getSearchText());
            data.addProperty("displayMode", GuiBridge.INSTANCE.getDisplayMode().name());
            data.addProperty("activeTab", GuiBridge.INSTANCE.getActiveTab());
            data.addProperty("leftPanelVisible", GuiBridge.INSTANCE.isLeftPanelVisible());
            data.addProperty("classCount", GuiBridge.INSTANCE.getArchiveClassList().size());
            data.addProperty("humanRecentlyActive", GuiBridge.INSTANCE.isHumanRecentlyActive());
            data.addProperty("secondsSinceHumanInput", GuiBridge.INSTANCE.getSecondsSinceHumanInput());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_OPEN_ARCHIVE.equals(command)) {
            requireGuiActive(command);
            File archive = AgentParams.archive(params);
            GuiBridge.INSTANCE.openArchive(archive);
            JsonObject data = new JsonObject();
            data.addProperty("archivePath", archive.getAbsolutePath());
            data.addProperty("status", "loading");
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_NAVIGATE_TO.equals(command)) {
            requireGuiActive(command);
            String className = AgentParams.required(params, "className");
            GuiBridge.INSTANCE.navigateTo(className);
            JsonObject data = new JsonObject();
            data.addProperty("className", className);
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_SEARCH.equals(command)) {
            requireGuiActive(command);
            String query = AgentRequest.getString(params, "query");
            GuiBridge.INSTANCE.search(query);
            JsonObject data = new JsonObject();
            data.addProperty("query", query);
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_GO_BACK.equals(command)) {
            requireGuiActive(command);
            GuiBridge.INSTANCE.goBack();
            return AgentResponse.success(command, new JsonObject());
        }

        if (AgentCapabilities.GUI_VIEW_TOP_CLASS.equals(command)) {
            requireGuiActive(command);
            GuiBridge.INSTANCE.viewTopClass();
            return AgentResponse.success(command, new JsonObject());
        }

        if (AgentCapabilities.GUI_EXPORT.equals(command)) {
            requireGuiActive(command);
            GuiBridge.INSTANCE.export();
            JsonObject data = exportPlan();
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_SET_TAB.equals(command)) {
            requireGuiActive(command);
            String tab = AgentParams.required(params, "tab");
            if (!"classes".equals(tab) && !"methods_count".equals(tab)) {
                throw new IllegalArgumentException("tab must be 'classes' or 'methods_count'");
            }
            GuiBridge.INSTANCE.setTab(tab);
            JsonObject data = new JsonObject();
            data.addProperty("tab", tab);
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_LOAD_MAPPINGS.equals(command)) {
            requireGuiActive(command);
            String mappingPath = AgentParams.required(params, "path");
            File mappingFile = new File(mappingPath);
            if (!mappingFile.exists()) {
                throw new IllegalArgumentException("Mapping file not found: " + mappingPath);
            }
            GuiBridge.INSTANCE.loadMappings(mappingFile);
            JsonObject data = new JsonObject();
            data.addProperty("path", mappingFile.getAbsolutePath());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_TOGGLE_TREE.equals(command)) {
            requireGuiActive(command);
            boolean visible = AgentParams.booleanParam(params, "visible", true);
            GuiBridge.INSTANCE.toggleTree(visible);
            JsonObject data = new JsonObject();
            data.addProperty("visible", visible);
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_GET_DISPLAY_CONTENT.equals(command)) {
            requireGuiActive(command);
            JsonObject data = new JsonObject();
            data.addProperty("displayMode", GuiBridge.INSTANCE.getDisplayMode().name());
            data.addProperty("currentClass", GuiBridge.INSTANCE.getCurrentClass());
            data.addProperty("displayContent", GuiBridge.INSTANCE.getDisplayContent());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_GET_CLASS_LIST.equals(command)) {
            requireGuiActive(command);
            if (!GuiBridge.INSTANCE.isArchiveLoaded()) {
                throw new IllegalArgumentException("No archive loaded in GUI");
            }
            List<String> allClasses = GuiBridge.INSTANCE.getArchiveClassList();
            int offset = AgentParams.integerParam(params, "offset", 0);
            int limit = AgentParams.integerParam(params, "limit", -1);
            String query = AgentRequest.getString(params, "query");
            List<String> filtered = new ArrayList<>();
            for (String c : allClasses) {
                if (query.isEmpty() || c.contains(query)) filtered.add(c);
            }
            int from = Math.min(offset, filtered.size());
            int to = limit < 0 ? filtered.size() : Math.min(filtered.size(), from + limit);
            JsonArray items = new JsonArray();
            for (int i = from; i < to; i++) items.add(filtered.get(i));
            JsonObject data = new JsonObject();
            data.add("items", items);
            data.addProperty("total", filtered.size());
            data.addProperty("offset", from);
            data.addProperty("returned", items.size());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_GET_FILTERED_CLASSES.equals(command)) {
            requireGuiActive(command);
            List<String> filteredClasses = GuiBridge.INSTANCE.getFilteredClasses();
            JsonArray items = new JsonArray();
            for (String c : filteredClasses) items.add(c);
            JsonObject data = new JsonObject();
            data.add("items", items);
            data.addProperty("total", items.size());
            data.addProperty("searchText", GuiBridge.INSTANCE.getSearchText());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_NAVIGATE_AND_READ.equals(command)) {
            requireGuiActive(command);
            String className = AgentParams.required(params, "className");
            long timeoutMs = AgentParams.integerParam(params, "timeoutMs", 5000);
            String content = GuiBridge.INSTANCE.navigateAndRead(className, timeoutMs);
            JsonObject data = new JsonObject();
            data.addProperty("className", className);
            data.addProperty("displayMode", GuiBridge.INSTANCE.getDisplayMode().name());
            data.addProperty("content", content);
            data.addProperty("timedOut", content.isEmpty());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_WAIT_FOR_LOAD.equals(command)) {
            requireGuiActive(command);
            long timeoutMs = AgentParams.integerParam(params, "timeoutMs", 10000);
            boolean loaded = GuiBridge.INSTANCE.waitForArchiveLoaded(timeoutMs);
            JsonObject data = new JsonObject();
            data.addProperty("archiveLoaded", loaded);
            data.addProperty("timedOut", !loaded);
            data.addProperty("archivePath", GuiBridge.INSTANCE.getArchivePath());
            data.addProperty("classCount", GuiBridge.INSTANCE.getArchiveClassList().size());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_OPEN_AND_WAIT.equals(command)) {
            requireGuiActive(command);
            File archive = AgentParams.archive(params);
            long timeoutMs = AgentParams.integerParam(params, "timeoutMs", 15000);
            boolean loaded = GuiBridge.INSTANCE.openAndWait(archive, timeoutMs);
            JsonObject data = new JsonObject();
            data.addProperty("archivePath", archive.getAbsolutePath());
            data.addProperty("archiveLoaded", loaded);
            data.addProperty("timedOut", !loaded);
            data.addProperty("classCount", GuiBridge.INSTANCE.getArchiveClassList().size());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_SEARCH_AND_WAIT.equals(command)) {
            requireGuiActive(command);
            String query = AgentParams.required(params, "query");
            long timeoutMs = AgentParams.integerParam(params, "timeoutMs", 5000);
            List<String> results = GuiBridge.INSTANCE.searchAndWait(query, timeoutMs);
            JsonArray items = new JsonArray();
            for (String c : results) items.add(c);
            JsonObject data = new JsonObject();
            data.add("items", items);
            data.addProperty("total", items.size());
            data.addProperty("query", query);
            data.addProperty("timedOut", results.isEmpty());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GUI_CAPTURE.equals(command)) {
            requireGuiActive(command);
            String image = GuiBridge.INSTANCE.captureDisplay();
            if (image.isEmpty()) {
                return AgentResponse.error(command, "gui_not_visible",
                        "The GUI panel is not currently renderable; ensure the window is realized.");
            }
            JsonObject data = new JsonObject();
            data.addProperty("mime", "image/png");
            data.addProperty("encoding", "base64");
            data.addProperty("image", image);
            return AgentResponse.success(command, data);
        }

        return AgentResponse.error(command, "unknown_command", "Unsupported Agent command: " + command);
    }

    private static void requireGuiActive(String command) {
        if (!GuiBridge.INSTANCE.isGuiActive()) {
            throw new IllegalArgumentException(
                    "GUI is not running. Launch with -agent-gui-stdio to enable GUI control commands.");
        }
    }

    /**
     * Deterministic set of files the GUI export writes into the working directory.
     * The export itself is asynchronous on the EDT; this reports the expected
     * file names so an Agent knows which paths to read afterwards.
     */
    private static JsonObject exportPlan() {
        JsonObject data = new JsonObject();
        data.addProperty("outputDir", System.getProperty("user.dir"));
        JsonArray files = new JsonArray();
        String currentClass = GuiBridge.INSTANCE.getCurrentClass();
        if (!currentClass.isEmpty()) {
            files.add(currentClass + "_dump");
        }
        String archivePath = GuiBridge.INSTANCE.getArchivePath();
        boolean apk = archivePath.toLowerCase().endsWith(".apk");
        files.add("all_classes.txt");
        files.add("method_counts.txt");
        if (apk) {
            files.add("AndroidManifest.xml_dump");
            files.add("all_methods.txt");
            files.add("all_strings.txt");
        }
        data.add("files", files);
        return data;
    }

    private static String safeMessage(Exception e) {
        String message = e.getMessage();
        return message == null || message.isEmpty() ? e.getClass().getSimpleName() : message;
    }
}