/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Thread-safe bridge between the headless Agent layer and the live Swing GUI.
 *
 * <p>When ClassyShark runs in GUI+agent mode (-agent-gui-stdio), the active
 * ClassySharkPanel registers itself here. Agent commands that target the GUI are
 * dispatched through this singleton.</p>
 *
 * <h3>Human/Agent co-existence</h3>
 * <ul>
 *   <li>The bridge tracks the time of the last human keyboard input so the agent
 *       can call {@link #isHumanRecentlyActive()} before issuing disruptive commands.</li>
 *   <li>All agent commands dispatch to the Swing EDT via {@code invokeLater};
 *       they do <em>not</em> block the human's interaction.</li>
 *   <li>{@link #navigateAndRead} offers a synchronous variant that waits (with
 *       a configurable timeout) until the display has been updated, so agents
 *       can read the result without polling.</li>
 * </ul>
 */
public final class GuiBridge {

    public static final GuiBridge INSTANCE = new GuiBridge();

    /** What the right-hand display area is currently showing. */
    public enum DisplayMode { IDLE, CLASS_LIST, INSIDE_CLASS, SEARCH_RESULTS, ERROR }

    /** Opaque callback interface implemented by ClassySharkPanel. */
    public interface GuiPanel {
        void agentOpenArchive(File archive);
        void agentNavigateTo(String className);
        void agentSearch(String query);
        void agentGoBack();
        void agentViewTopClass();
        void agentExport();
        void agentLoadMappings(File mappingFile);
        void agentToggleTree(boolean visible);
        /** Switches the active right-hand tab: {@code classes} or {@code methods_count}. */
        void agentSetTab(String tab);
        /** Returns a base64-encoded PNG of the currently visible right panel. */
        String agentCapturePng();
    }

    // ── registered panel ─────────────────────────────────────────────────────
    private volatile GuiPanel panel;

    // ── archive state ─────────────────────────────────────────────────────────
    private volatile String archivePath = "";
    private volatile boolean archiveLoaded = false;
    private volatile List<String> archiveClassList = Collections.emptyList();

    // ── display state ─────────────────────────────────────────────────────────
    private volatile DisplayMode displayMode = DisplayMode.IDLE;
    private volatile String currentClass = "";
    private volatile String displayContent = "";
    private volatile List<String> filteredClasses = Collections.emptyList();
    private volatile String searchText = "";
    private volatile String activeTab = "classes";
    private volatile boolean leftPanelVisible = true;

    // ── human activity tracking ───────────────────────────────────────────────
    private volatile long lastHumanInputMs = 0;
    /** Milliseconds of inactivity before we consider the human no longer active. */
    private static final long HUMAN_IDLE_THRESHOLD_MS = 5_000;

    // ── synchronous navigation latch ──────────────────────────────────────────
    private final AtomicReference<CountDownLatch> pendingDisplayLatch =
            new AtomicReference<>(null);

    private final AtomicReference<CountDownLatch> pendingArchiveLatch =
            new AtomicReference<>(null);

    private GuiBridge() {}

    // ── registration ──────────────────────────────────────────────────────────

    public void register(GuiPanel p) {
        this.panel = p;
    }

    public void deregister() {
        this.panel = null;
        archiveLoaded = false;
        archivePath = "";
        displayMode = DisplayMode.IDLE;
        displayContent = "";
        filteredClasses = Collections.emptyList();
        archiveClassList = Collections.emptyList();
    }

    // ── state updates from ClassySharkPanel (called on Swing EDT) ─────────────

    public void notifyArchiveOpening(String path) {
        this.archivePath = path;
        this.currentClass = "";
        this.searchText = "";
        this.archiveLoaded = false;
        this.archiveClassList = Collections.emptyList();
        this.displayMode = DisplayMode.IDLE;
        this.displayContent = "";
        this.filteredClasses = Collections.emptyList();
        this.activeTab = "classes";
        this.leftPanelVisible = true;
    }

    public void notifyArchiveLoaded(List<String> classNames) {
        this.archiveClassList = Collections.unmodifiableList(new ArrayList<>(classNames));
        this.archiveLoaded = true;
        CountDownLatch al = pendingArchiveLatch.getAndSet(null);
        if (al != null) al.countDown();
    }

    /** Records an archive load failure and releases callers waiting for completion. */
    public void notifyArchiveLoadFailed() {
        this.archiveLoaded = false;
        this.archiveClassList = Collections.emptyList();
        CountDownLatch al = pendingArchiveLatch.getAndSet(null);
        if (al != null) al.countDown();
    }

    public void notifyDisplayingClass(String className, String content) {
        this.currentClass = className;
        this.displayContent = content;
        this.displayMode = DisplayMode.INSIDE_CLASS;
        releaseDisplayLatch();
    }

    public void notifyDisplayingSearchResults(List<String> classes, String query) {
        this.searchText = query;
        this.filteredClasses = Collections.unmodifiableList(new ArrayList<>(classes));
        this.displayMode = DisplayMode.SEARCH_RESULTS;
        releaseDisplayLatch();
    }

    public void notifyDisplayingClassList() {
        this.displayMode = DisplayMode.CLASS_LIST;
        releaseDisplayLatch();
    }

    public void notifyDisplayError() {
        this.displayMode = DisplayMode.ERROR;
        this.displayContent = "";
        this.filteredClasses = Collections.emptyList();
        this.activeTab = "classes";
        this.leftPanelVisible = true;
        releaseDisplayLatch();
    }

    public void notifyHumanInput() {
        this.lastHumanInputMs = System.currentTimeMillis();
    }

    /** Records which right-hand tab is selected: {@code classes} or {@code methods_count}. */
    public void notifyTabChanged(String tab) {
        this.activeTab = tab;
    }

    /** Records the visibility state of the left tree panel. */
    public void notifyLeftPaneVisibility(boolean visible) {
        this.leftPanelVisible = visible;
    }

    // ── latch helpers ─────────────────────────────────────────────────────────

    private CountDownLatch armDisplayLatch() {
        CountDownLatch latch = new CountDownLatch(1);
        pendingDisplayLatch.set(latch);
        return latch;
    }

    private void releaseDisplayLatch() {
        CountDownLatch latch = pendingDisplayLatch.getAndSet(null);
        if (latch != null) {
            latch.countDown();
        }
    }

    // ── state getters (read by HeadlessAgentService) ──────────────────────────

    public boolean isGuiActive()           { return panel != null; }
    public boolean isArchiveLoaded()       { return archiveLoaded; }
    public String  getArchivePath()        { return archivePath; }
    public List<String> getArchiveClassList() { return archiveClassList; }
    public DisplayMode getDisplayMode()    { return displayMode; }
    public String  getCurrentClass()       { return currentClass; }
    public String  getDisplayContent()     { return displayContent; }
    public List<String> getFilteredClasses() { return filteredClasses; }
    public String  getSearchText()         { return searchText; }
    public String  getActiveTab()          { return activeTab; }
    public boolean isLeftPanelVisible()   { return leftPanelVisible; }

    /** Captures the currently visible GUI panel as a base64-encoded PNG. */
    public String captureDisplay() {
        GuiPanel p = panel;
        return p == null ? "" : p.agentCapturePng();
    }

    public boolean isHumanRecentlyActive() {
        return (System.currentTimeMillis() - lastHumanInputMs) < HUMAN_IDLE_THRESHOLD_MS;
    }

    public long getSecondsSinceHumanInput() {
        if (lastHumanInputMs == 0) return Long.MAX_VALUE;
        return (System.currentTimeMillis() - lastHumanInputMs) / 1000;
    }

    // ── fire-and-forget commands ──────────────────────────────────────────────

    public boolean openArchive(File archive) {
        GuiPanel p = panel;
        if (p == null) return false;
        p.agentOpenArchive(archive);
        return true;
    }

    public boolean navigateTo(String className) {
        GuiPanel p = panel;
        if (p == null) return false;
        p.agentNavigateTo(className);
        return true;
    }

    public boolean search(String query) {
        GuiPanel p = panel;
        if (p == null) return false;
        p.agentSearch(query);
        return true;
    }

    public boolean goBack() {
        GuiPanel p = panel;
        if (p == null) return false;
        p.agentGoBack();
        return true;
    }

    public boolean viewTopClass() {
        GuiPanel p = panel;
        if (p == null) return false;
        p.agentViewTopClass();
        return true;
    }

    public boolean export() {
        GuiPanel p = panel;
        if (p == null) return false;
        p.agentExport();
        return true;
    }

    public boolean loadMappings(File mappingFile) {
        GuiPanel p = panel;
        if (p == null) return false;
        p.agentLoadMappings(mappingFile);
        return true;
    }

    public boolean toggleTree(boolean visible) {
        GuiPanel p = panel;
        if (p == null) return false;
        p.agentToggleTree(visible);
        return true;
    }

    public boolean setTab(String tab) {
        GuiPanel p = panel;
        if (p == null) return false;
        p.agentSetTab(tab);
        return true;
    }

    /**
     * Navigate to a class and wait (up to {@code timeoutMs}) for the display to update.
     *
     * @return the class content if displayed, or empty string on timeout / not-a-class entry
     */
    public String navigateAndRead(String className, long timeoutMs) {
        GuiPanel p = panel;
        if (p == null) return "";
        CountDownLatch latch = armDisplayLatch();
        p.agentNavigateTo(className);
        try {
            latch.await(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return displayContent;
    }

    /**
     * Wait (up to {@code timeoutMs}) for the archive to finish loading.
     *
     * @return true if loaded within timeout, false on timeout
     */
    public boolean waitForArchiveLoaded(long timeoutMs) {
        if (archiveLoaded) return true;
        CountDownLatch latch = new CountDownLatch(1);
        pendingArchiveLatch.set(latch);
        if (archiveLoaded) {
            pendingArchiveLatch.set(null);
            return true;
        }
        try {
            return latch.await(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * Open an archive and wait (up to {@code timeoutMs}) until it is fully loaded.
     *
     * @return true if the archive was loaded within timeout
     */
    public boolean openAndWait(File archive, long timeoutMs) {
        GuiPanel p = panel;
        if (p == null) return false;
        archiveLoaded = false;
        CountDownLatch latch = new CountDownLatch(1);
        pendingArchiveLatch.set(latch);
        p.agentOpenArchive(archive);
        try {
            return latch.await(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * Search and wait (up to {@code timeoutMs}) for results to be populated.
     *
     * @return the filtered class list (may be empty on timeout)
     */
    public List<String> searchAndWait(String query, long timeoutMs) {
        GuiPanel p = panel;
        if (p == null) return Collections.emptyList();
        CountDownLatch latch = armDisplayLatch();
        p.agentSearch(query);
        try {
            latch.await(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return filteredClasses;
    }
}
