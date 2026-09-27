/*
 * Copyright 2026 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

package com.google.classyshark.agent;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;

/**
 * One JSON request per line, one JSON response per line.
 *
 * <p>Shared by both the headless ({@code -agent-stdio}) and the GUI
 * ({@code -agent-gui-stdio}) stdio entry points. Holds no GUI dependency.</p>
 */
public final class ProtocolLoop {
    private ProtocolLoop() {
    }

    public static void run(InputStream input, PrintStream output, CommandService service)
            throws IOException {
        // Existing analysers occasionally log to stdout. Keep the protocol stream clean.
        PrintStream originalStdout = System.out;
        System.setOut(System.err);
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(input, "UTF-8"));
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue;
                }
                output.println(AgentCommandDispatcher.dispatch(service, line));
                output.flush();
            }
        } finally {
            System.setOut(originalStdout);
        }
    }
}
