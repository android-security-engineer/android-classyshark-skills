/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

import com.google.classyshark.silverghost.SilverGhostFacade;
import com.google.classyshark.silverghost.translator.apk.dashboard.ApkDashboard;
import com.google.classyshark.silverghost.translator.apk.dashboard.ClassesDexDataEntry;
import com.google.classyshark.silverghost.contentreader.ContentReader;
import com.google.classyshark.silverghost.exporter.FlatMethodCountExporter;
import com.google.classyshark.silverghost.exporter.MethodCountExporter;
import com.google.classyshark.silverghost.exporter.TreeMethodCountExporter;
import com.google.classyshark.silverghost.methodscounter.ClassNode;
import com.google.classyshark.silverghost.methodscounter.RootBuilder;
import com.google.classyshark.silverghost.translator.Translator;
import com.google.classyshark.silverghost.translator.apk.ApkTranslator;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Synchronous, UI-free facade for Agent clients.
 *
 * <p>This service intentionally contains no GUI/Swing dependency: it serves
 * {@code -agent-stdio} (headless) and can be embedded in a process that has no
 * display. GUI control commands live in {@link GuiAgentService}.</p>
 */
public class HeadlessAgentService {

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
            data.add("commands", AgentCapabilities.headlessCommands());
            data.addProperty("protocol", "classyshark-agent-v1");
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.LIST_CLASSES.equals(command)) {
            File archive = AgentParams.archive(params);
            List<String> classes = SilverGhostFacade.getAllClassNames(archive);
            return AgentResponse.success(command, listData(archive, classes, params));
        }

        if (AgentCapabilities.GET_CLASS.equals(command)) {
            File archive = AgentParams.archive(params);
            String className = AgentParams.required(params, "className");
            JsonObject data = archiveData(archive);
            data.addProperty("className", className);
            data.addProperty("content", SilverGhostFacade.getGeneratedClassString(className, archive));
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GET_MANIFEST.equals(command)) {
            File archive = AgentParams.archive(params);
            JsonObject data = archiveData(archive);
            data.addProperty("content", SilverGhostFacade.getManifest(archive));
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.LIST_METHODS.equals(command)) {
            File archive = AgentParams.archive(params);
            return AgentResponse.success(command,
                    listData(archive, SilverGhostFacade.getAllMethods(archive), params));
        }

        if (AgentCapabilities.LIST_STRINGS.equals(command)) {
            File archive = AgentParams.archive(params);
            return AgentResponse.success(command,
                    listData(archive, SilverGhostFacade.getAllStrings(archive), params));
        }

        if (AgentCapabilities.IS_MULTIDEX.equals(command)) {
            File archive = AgentParams.archive(params);
            JsonObject data = archiveData(archive);
            data.addProperty("multidex", SilverGhostFacade.isMultiDex(archive));
            data.addProperty("customMultidex", SilverGhostFacade.isCustomMultiDex(archive));
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.METHOD_COUNTS.equals(command)) {
            File archive = AgentParams.archive(params);
            boolean flat = AgentParams.booleanParam(params, "flat", false);
            RootBuilder rootBuilder = new RootBuilder();
            ClassNode rootNode = rootBuilder.fillClassesWithMethods(archive);
            StringWriter output = new StringWriter();
            PrintWriter writer = new PrintWriter(output);
            MethodCountExporter exporter = flat
                    ? new FlatMethodCountExporter(writer)
                    : new TreeMethodCountExporter(writer);
            exporter.exportMethodCounts(rootNode);
            JsonObject data = archiveData(archive);
            data.addProperty("flat", flat);
            data.addProperty("content", output.toString());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.INSPECT_APK.equals(command)) {
            File archive = AgentParams.archive(params);
            requireApk(archive);
            Translator translator = new ApkTranslator(archive);
            translator.apply();
            JsonObject data = archiveData(archive);
            data.addProperty("content", translator.toString());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.EXPORT.equals(command)) {
            return AgentResponse.success(command, exportArchive(AgentParams.archive(params), params));
        }

        if (AgentCapabilities.LIST_COMPONENTS.equals(command)) {
            File archive = AgentParams.archive(params);
            java.util.List<ContentReader.Component> components = SilverGhostFacade.getAllComponents(archive);
            JsonArray items = new JsonArray();
            for (ContentReader.Component c : components) {
                JsonObject entry = new JsonObject();
                entry.addProperty("name", c.name);
                entry.addProperty("type", c.component.name());
                items.add(entry);
            }
            JsonObject data = archiveData(archive);
            data.add("items", items);
            data.addProperty("total", items.size());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GET_ENTRY.equals(command)) {
            File archive = AgentParams.archive(params);
            String entry = AgentParams.required(params, "entry");
            JsonObject data = archiveData(archive);
            data.addProperty("entry", entry);
            data.addProperty("content", SilverGhostFacade.getEntryContent(entry, archive));
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.GET_CLASS_DEPS.equals(command)) {
            File archive = AgentParams.archive(params);
            String className = AgentParams.required(params, "className");
            JsonObject data = archiveData(archive);
            data.addProperty("className", className);
            JsonArray deps = new JsonArray();
            for (String dep : SilverGhostFacade.getClassDependencies(className, archive)) {
                deps.add(dep);
            }
            data.add("dependencies", deps);
            data.addProperty("count", deps.size());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.APK_DASHBOARD.equals(command)) {
            File archive = AgentParams.archive(params);
            requireApk(archive);
            ApkDashboard d = SilverGhostFacade.getApkDashboard(archive);
            JsonObject data = archiveData(archive);

            JsonArray dexEntries = new JsonArray();
            for (ClassesDexDataEntry e : d.getAllDexEntries()) {
                JsonObject entry = new JsonObject();
                entry.addProperty("name", e.getName());
                entry.addProperty("allMethods", e.allMethods);
                entry.addProperty("nativeMethods", e.nativeMethodsCount);
                JsonArray natClasses = new JsonArray();
                for (String c : e.classesWithNativeMethods) {
                    natClasses.add(c);
                }
                entry.add("classesWithNativeMethods", natClasses);
                dexEntries.add(entry);
            }
            data.add("dexEntries", dexEntries);

            JsonArray nativeLibs = new JsonArray();
            for (String lib : d.getFullPathNativeLibNamesSorted()) {
                nativeLibs.add(lib.trim());
            }
            data.add("nativeLibs", nativeLibs);

            JsonArray nativeErrors = new JsonArray();
            for (String err : d.nativeErrors) {
                nativeErrors.add(err);
            }
            data.add("nativeErrors", nativeErrors);

            JsonArray javaDeps = new JsonArray();
            for (String w : d.getJavaDependenciesErrors()) {
                javaDeps.add(w);
            }
            data.add("javaDepsWarnings", javaDeps);

            JsonArray manifestIssues = new JsonArray();
            for (String issue : d.getManifestRecommendations()) {
                manifestIssues.add(issue);
            }
            data.add("manifestIssues", manifestIssues);

            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.CHECK_JAVA_DEPS.equals(command)) {
            File archive = AgentParams.archive(params);
            requireApk(archive);
            JsonObject data = archiveData(archive);
            JsonArray warnings = new JsonArray();
            for (String w : SilverGhostFacade.getJavaDepsWarnings(archive)) {
                warnings.add(w);
            }
            data.add("warnings", warnings);
            data.addProperty("count", warnings.size());
            return AgentResponse.success(command, data);
        }

        if (AgentCapabilities.CHECK_MANIFEST.equals(command)) {
            File archive = AgentParams.archive(params);
            requireApk(archive);
            JsonObject data = archiveData(archive);
            JsonArray issues = new JsonArray();
            for (String issue : SilverGhostFacade.getManifestIssues(archive)) {
                issues.add(issue);
            }
            data.add("issues", issues);
            data.addProperty("count", issues.size());
            return AgentResponse.success(command, data);
        }

        if (command.startsWith("gui.")) {
            // Headless mode has no GUI; give a clear hint while staying GUI-free.
            return AgentResponse.error(command, "gui_not_available",
                    "GUI control commands require launching with -agent-gui-stdio");
        }

        return AgentResponse.error(command, "unknown_command", "Unsupported Agent command: " + command);
    }

    private static JsonObject exportArchive(File archive, JsonObject params) throws IOException {
        String output = AgentParams.required(params, "outputDir");
        Path outputDir = new File(output).toPath();
        Files.createDirectories(outputDir);

        List<String> classes = SilverGhostFacade.getAllClassNames(archive);
        write(outputDir.resolve("all_classes.txt"), joinLines(classes));
        if (archive.getName().toLowerCase().endsWith(".apk")) {
            write(outputDir.resolve("manifest.txt"), SilverGhostFacade.getManifest(archive));
            write(outputDir.resolve("all_methods.txt"), joinLines(SilverGhostFacade.getAllMethods(archive)));
            write(outputDir.resolve("all_strings.txt"), joinLines(SilverGhostFacade.getAllStrings(archive)));
        }

        RootBuilder rootBuilder = new RootBuilder();
        ClassNode rootNode = rootBuilder.fillClassesWithMethods(archive);
        StringWriter counts = new StringWriter();
        PrintWriter writer = new PrintWriter(counts);
        new TreeMethodCountExporter(writer).exportMethodCounts(rootNode);
        write(outputDir.resolve("method_counts.txt"), counts.toString());

        JsonObject data = archiveData(archive);
        data.addProperty("outputDir", outputDir.toFile().getAbsolutePath());
        JsonArray files = new JsonArray();
        File[] written = outputDir.toFile().listFiles();
        if (written != null) {
            for (File file : written) {
                if (file.isFile()) {
                    files.add(file.getName());
                }
            }
        }
        data.add("files", files);
        return data;
    }

    private static JsonObject listData(File archive, List<String> values, JsonObject params) {
        String query = AgentRequest.getString(params, "query");
        int offset = AgentParams.integerParam(params, "offset", 0);
        int limit = AgentParams.integerParam(params, "limit", -1);
        if (offset < 0) {
            throw new IllegalArgumentException("offset must be >= 0");
        }

        List<String> filtered = new ArrayList<>();
        for (String value : values) {
            if (query.isEmpty() || value.contains(query)) {
                filtered.add(value);
            }
        }

        int from = Math.min(offset, filtered.size());
        int to = filtered.size();
        if (limit >= 0) {
            to = Math.min(to, from + limit);
        }

        JsonArray result = new JsonArray();
        for (int i = from; i < to; i++) {
            result.add(filtered.get(i));
        }
        JsonObject data = archiveData(archive);
        data.add("items", result);
        data.addProperty("total", filtered.size());
        data.addProperty("offset", from);
        data.addProperty("returned", result.size());
        data.addProperty("truncated", to < filtered.size());
        return data;
    }

    private static JsonObject archiveData(File archive) {
        JsonObject data = new JsonObject();
        data.addProperty("path", archive.getAbsolutePath());
        data.addProperty("name", archive.getName());
        return data;
    }

    private static void requireApk(File archive) {
        if (!archive.getName().toLowerCase().endsWith(".apk")) {
            throw new IllegalArgumentException("This command requires an APK archive");
        }
    }

    private static String joinLines(List<String> values) {
        StringBuilder result = new StringBuilder();
        for (String value : values) {
            result.append(value).append('\n');
        }
        return result.toString();
    }

    private static void write(Path path, String content) throws IOException {
        Files.write(path, content.getBytes(StandardCharsets.UTF_8));
    }

    private static String safeMessage(Exception e) {
        String message = e.getMessage();
        return message == null || message.isEmpty() ? e.getClass().getSimpleName() : message;
    }
}