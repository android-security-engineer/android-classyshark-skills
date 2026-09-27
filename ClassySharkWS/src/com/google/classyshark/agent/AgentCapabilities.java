/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

import com.google.gson.JsonArray;

/** Stable command names exposed by the headless Agent service. */
public final class AgentCapabilities {
    public static final String CAPABILITIES = "agent.capabilities";
    public static final String LIST_CLASSES = "archive.list_classes";
    public static final String GET_CLASS = "archive.get_class";
    public static final String GET_MANIFEST = "archive.get_manifest";
    public static final String LIST_METHODS = "archive.list_methods";
    public static final String LIST_STRINGS = "archive.list_strings";
    public static final String IS_MULTIDEX = "archive.is_multidex";
    public static final String METHOD_COUNTS = "archive.method_counts";
    public static final String INSPECT_APK = "archive.inspect_apk";
    public static final String EXPORT = "archive.export";
    public static final String LIST_COMPONENTS = "archive.list_components";
    public static final String GET_ENTRY = "archive.get_entry";
    public static final String GET_CLASS_DEPS = "archive.get_class_deps";
    public static final String APK_DASHBOARD = "apk.dashboard";
    public static final String CHECK_JAVA_DEPS = "apk.check_java_deps";
    public static final String CHECK_MANIFEST = "apk.check_manifest";
    public static final String GUI_STATUS = "gui.status";
    public static final String GUI_OPEN_ARCHIVE = "gui.open_archive";
    public static final String GUI_NAVIGATE_TO = "gui.navigate_to";
    public static final String GUI_SEARCH = "gui.search";
    public static final String GUI_GO_BACK = "gui.go_back";
    public static final String GUI_VIEW_TOP_CLASS = "gui.view_top_class";
    public static final String GUI_EXPORT = "gui.export";
    public static final String GUI_LOAD_MAPPINGS = "gui.load_mappings";
    public static final String GUI_TOGGLE_TREE = "gui.toggle_tree";
    public static final String GUI_GET_DISPLAY_CONTENT = "gui.get_display_content";
    public static final String GUI_GET_CLASS_LIST = "gui.get_class_list";
    public static final String GUI_GET_FILTERED_CLASSES = "gui.get_filtered_classes";
    public static final String GUI_NAVIGATE_AND_READ = "gui.navigate_and_read";
    public static final String GUI_SEARCH_AND_WAIT = "gui.search_and_wait";
    public static final String GUI_OPEN_AND_WAIT = "gui.open_and_wait";
    public static final String GUI_WAIT_FOR_LOAD = "gui.wait_for_load";
    public static final String GUI_CAPTURE = "gui.capture";
    public static final String GUI_SET_TAB = "gui.set_tab";

    private AgentCapabilities() {
    }

    /** Full command surface, advertised in GUI mode (headless + gui verbs). */
    public static JsonArray asJson() {
        JsonArray result = new JsonArray();
        result.add(CAPABILITIES);
        result.add(LIST_CLASSES);
        result.add(GET_CLASS);
        result.add(GET_MANIFEST);
        result.add(LIST_METHODS);
        result.add(LIST_STRINGS);
        result.add(IS_MULTIDEX);
        result.add(METHOD_COUNTS);
        result.add(INSPECT_APK);
        result.add(EXPORT);
        result.add(LIST_COMPONENTS);
        result.add(GET_ENTRY);
        result.add(GET_CLASS_DEPS);
        result.add(APK_DASHBOARD);
        result.add(CHECK_JAVA_DEPS);
        result.add(CHECK_MANIFEST);
        result.add(GUI_STATUS);
        result.add(GUI_OPEN_ARCHIVE);
        result.add(GUI_NAVIGATE_TO);
        result.add(GUI_SEARCH);
        result.add(GUI_GO_BACK);
        result.add(GUI_VIEW_TOP_CLASS);
        result.add(GUI_EXPORT);
        result.add(GUI_LOAD_MAPPINGS);
        result.add(GUI_TOGGLE_TREE);
        result.add(GUI_GET_DISPLAY_CONTENT);
        result.add(GUI_GET_CLASS_LIST);
        result.add(GUI_GET_FILTERED_CLASSES);
        result.add(GUI_NAVIGATE_AND_READ);
        result.add(GUI_SEARCH_AND_WAIT);
        result.add(GUI_OPEN_AND_WAIT);
        result.add(GUI_WAIT_FOR_LOAD);
        result.add(GUI_CAPTURE);
        result.add(GUI_SET_TAB);
        return result;
    }

    /** Commands available in pure headless mode (no GUI). */
    public static JsonArray headlessCommands() {
        JsonArray result = new JsonArray();
        result.add(CAPABILITIES);
        result.add(LIST_CLASSES);
        result.add(GET_CLASS);
        result.add(GET_MANIFEST);
        result.add(LIST_METHODS);
        result.add(LIST_STRINGS);
        result.add(IS_MULTIDEX);
        result.add(METHOD_COUNTS);
        result.add(INSPECT_APK);
        result.add(EXPORT);
        result.add(LIST_COMPONENTS);
        result.add(GET_ENTRY);
        result.add(GET_CLASS_DEPS);
        result.add(APK_DASHBOARD);
        result.add(CHECK_JAVA_DEPS);
        result.add(CHECK_MANIFEST);
        return result;
    }

    /** Commands that require a live GUI ({@code -agent-gui-stdio}). */
    public static JsonArray guiCommands() {
        JsonArray result = new JsonArray();
        result.add(GUI_STATUS);
        result.add(GUI_OPEN_ARCHIVE);
        result.add(GUI_NAVIGATE_TO);
        result.add(GUI_SEARCH);
        result.add(GUI_GO_BACK);
        result.add(GUI_VIEW_TOP_CLASS);
        result.add(GUI_EXPORT);
        result.add(GUI_LOAD_MAPPINGS);
        result.add(GUI_TOGGLE_TREE);
        result.add(GUI_GET_DISPLAY_CONTENT);
        result.add(GUI_GET_CLASS_LIST);
        result.add(GUI_GET_FILTERED_CLASSES);
        result.add(GUI_NAVIGATE_AND_READ);
        result.add(GUI_SEARCH_AND_WAIT);
        result.add(GUI_OPEN_AND_WAIT);
        result.add(GUI_WAIT_FOR_LOAD);
        result.add(GUI_CAPTURE);
        result.add(GUI_SET_TAB);
        return result;
    }
}
