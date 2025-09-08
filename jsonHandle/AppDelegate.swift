//
//  AppDelegate.swift
//  jsonHandle
//
//  Created by Walker on 2025/3/2.
//

import Cocoa
import os

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    
    private let logger = OSLog(subsystem: Bundle.main.bundleIdentifier ?? "com.walker.jsonHandle", category: "AppDelegate")
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        os_log("Application did finish launching", log: logger, type: .info)
        
        // Initialize application settings
        setupUserDefaults()
        
        // Check for first launch
        if isFirstLaunch() {
            handleFirstLaunch()
        }
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        os_log("Application will terminate", log: logger, type: .info)
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
    
    // MARK: - Private Methods
    
    private func setupUserDefaults() {
        let defaults = UserDefaults.standard
        
        // Register default values
        let defaultValues: [String: Any] = [
            "hasLaunchedBefore": false,
            "lastVersion": "1.0.0",
            "extensionEnabled": false
        ]
        
        defaults.register(defaults: defaultValues)
    }
    
    private func isFirstLaunch() -> Bool {
        return !UserDefaults.standard.bool(forKey: "hasLaunchedBefore")
    }
    
    private func handleFirstLaunch() {
        os_log("First launch detected", log: logger, type: .info)
        
        // Mark as launched
        UserDefaults.standard.set(true, forKey: "hasLaunchedBefore")
        
        // Store current version
        if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String {
            UserDefaults.standard.set(version, forKey: "lastVersion")
        }
    }
}
