//
//  ViewController.swift
//  jsonHandle
//
//  Created by Walker on 2025/3/2.
//

import Cocoa
import SafariServices
import WebKit
import os

let extensionBundleIdentifier = "com.walker.jsonHandle.Extension"

class ViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {
    
    // MARK: - Properties
    @IBOutlet private(set) var webView: WKWebView!
    
    private let logger = OSLog(subsystem: Bundle.main.bundleIdentifier ?? "com.walker.jsonHandle", category: "ViewController")
    private let extensionManager = SFSafariExtensionManager.self
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        loadMainContent()
    }
    
    override func viewWillAppear() {
        super.viewWillAppear()
        checkExtensionStatus()
    }
    
    // MARK: - Setup
    
    private func setupWebView() {
        webView.navigationDelegate = self
        
        // Configure user content controller
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "controller")
        
        // Configure web view
        let configuration = WKWebViewConfiguration()
        configuration.userContentController = userContentController
        
        // Update web view with new configuration
        if let existingWebView = webView {
            // Remove existing web view from view hierarchy
            existingWebView.removeFromSuperview()
        }
        
        let newWebView = WKWebView(frame: webView.frame, configuration: configuration)
        newWebView.translatesAutoresizingMaskIntoConstraints = false
        
        // Replace outlet
        webView = newWebView
        
        // Add to view and setup constraints
        let superview = view
        superview.addSubview(newWebView)
        NSLayoutConstraint.activate([
            newWebView.topAnchor.constraint(equalTo: superview.topAnchor),
            newWebView.leadingAnchor.constraint(equalTo: superview.leadingAnchor),
            newWebView.trailingAnchor.constraint(equalTo: superview.trailingAnchor),
            newWebView.bottomAnchor.constraint(equalTo: superview.bottomAnchor)
        ])
    }
    
    private func loadMainContent() {
        guard let htmlURL = Bundle.main.url(forResource: "Main", withExtension: "html"),
              let resourceURL = Bundle.main.resourceURL else {
            os_log("Failed to locate main HTML file or resources", log: logger, type: .error)
            showErrorAlert(message: "Unable to load application resources.")
            return
        }
        
        os_log("Loading main content from: %{public}@", log: logger, type: .info, htmlURL.path)
        webView.loadFileURL(htmlURL, allowingReadAccessTo: resourceURL)
    }
    
    // MARK: - Extension Management
    
    private func checkExtensionStatus() {
        os_log("Checking extension status", log: logger, type: .info)
        
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { [weak self] state, error in
            guard let self = self else { return }
            
            if let error = error {
                os_log("Failed to get extension state: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                self.handleExtensionError(error)
                return
            }
            
            guard let state = state else {
                os_log("Extension state is nil", log: self.logger, type: .error)
                self.showErrorAlert(message: "Unable to determine extension status.")
                return
            }
            
            self.updateExtensionUI(isEnabled: state.isEnabled)
        }
    }
    
    private func updateExtensionUI(isEnabled: Bool) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            let isVenturaOrLater = ProcessInfo.processInfo.isOperatingSystemAtLeast(
                OperatingSystemVersion(majorVersion: 13, minorVersion: 0, patchVersion: 0)
            )
            
            let script = "show(\(isEnabled), \(isVenturaOrLater))"
            
            os_log("Updating extension UI: enabled=%d, venturaOrLater=%d", log: self.logger, type: .info, isEnabled, isVenturaOrLater)
            
            self.webView.evaluateJavaScript(script) { result, error in
                if let error = error {
                    os_log("Failed to update extension UI: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                } else {
                    os_log("Extension UI updated successfully", log: self.logger, type: .info)
                }
            }
        }
    }
    
    private func handleExtensionError(_ error: Error) {
        os_log("Extension error: %{public}@", log: logger, type: .error, error.localizedDescription)
        
        DispatchQueue.main.async { [weak self] in
            self?.showErrorAlert(
                message: "Failed to communicate with Safari extension. Please ensure the extension is properly installed.",
                title: "Extension Error"
            )
        }
    }
    
    // MARK: - WKNavigationDelegate
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        os_log("Web view finished navigation", log: logger, type: .info)
        checkExtensionStatus()
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        os_log("Web view navigation failed: %{public}@", log: logger, type: .error, error.localizedDescription)
        showErrorAlert(message: "Failed to load content: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        os_log("Web view provisional navigation failed: %{public}@", log: logger, type: .error, error.localizedDescription)
        showErrorAlert(message: "Failed to load content: \(error.localizedDescription)")
    }
    
    // MARK: - WKScriptMessageHandler
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let messageBody = message.body as? String else {
            os_log("Received invalid message body type", log: logger, type: .default)
            return
        }
        
        os_log("Received message from web view: %{public}@", log: logger, type: .info, messageBody)
        
        switch messageBody {
        case "open-preferences":
            openExtensionPreferences()
        case "check-status":
            checkExtensionStatus()
        case "reload-extension":
            reloadExtension()
        default:
            os_log("Unknown message received: %{public}@", log: logger, type: .default, messageBody)
        }
    }
    
    // MARK: - Actions
    
    private func openExtensionPreferences() {
        os_log("Opening extension preferences", log: logger, type: .info)
        
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { [weak self] error in
            if let error = error {
                os_log("Failed to open preferences: %{public}@", log: self?.logger ?? .default, type: .error, error.localizedDescription)
            }
            
            DispatchQueue.main.async {
                NSApplication.shared.terminate(nil)
            }
        }
    }
    
    private func reloadExtension() {
        os_log("Reloading extension", log: logger, type: .info)
        checkExtensionStatus()
    }
    
    // MARK: - UI Helpers
    
    private func showErrorAlert(message: String, title: String = "Error") {
        DispatchQueue.main.async {
            let alert = NSAlert()
            alert.messageText = title
            alert.informativeText = message
            alert.alertStyle = .critical
            alert.addButton(withTitle: "OK")
            
            alert.runModal()
        }
    }
}
