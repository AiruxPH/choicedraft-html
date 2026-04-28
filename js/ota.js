/**
 * ChoiceDraft OTA (Over-the-Air) Update Service
 * Handles live updates from GitHub without APK re-installation
 */

const OTA_CONFIG = {
    RAW_VERSION_URL: "https://raw.githubusercontent.com/AiruxPH/choicedraft-html/main/version.json",
    LOCAL_STORAGE_KEY: "cd_ota_version",
    UPDATE_DIR: "updated_www"
};

const otaService = {
    async checkAndApplyUpdate() {
        if (!window.cordova) {
            console.log("OTA: Not a Cordova environment. Skipping.");
            return false;
        }

        try {
            // 1. Fetch remote version info
            const response = await fetch(OTA_CONFIG.RAW_VERSION_URL + "?t=" + Date.now());
            const remote = await response.json();
            
            const localVersion = localStorage.getItem(OTA_CONFIG.LOCAL_STORAGE_KEY) || "1.0.0";
            
            console.log(`OTA: Local version ${localVersion}, Remote version ${remote.version}`);
            
            if (remote.version !== localVersion) {
                console.log("OTA: Update found! Starting download...");
                await this.downloadAndInstall(remote.download_url, remote.version);
                return true; // Reload required
            }
            
            console.log("OTA: App is up to date.");
            return false;
        } catch (error) {
            console.error("OTA Error:", error);
            return false;
        }
    },

    async downloadAndInstall(url, newVersion) {
        return new Promise((resolve, reject) => {
            const fileTransfer = new FileTransfer();
            const uri = encodeURI(url);
            const targetPath = cordova.file.dataDirectory + "update.zip";

            fileTransfer.download(
                uri,
                targetPath,
                async (entry) => {
                    console.log("OTA: Download complete: " + entry.toURL());
                    
                    // Unzip
                    const destPath = cordova.file.dataDirectory + OTA_CONFIG.UPDATE_DIR;
                    
                    zip.unzip(entry.toURL(), destPath, (status) => {
                        if (status === 0) {
                            console.log("OTA: Unzip successful!");
                            localStorage.setItem(OTA_CONFIG.LOCAL_STORAGE_KEY, newVersion);
                            localStorage.setItem("cd_use_ota_path", "true");
                            resolve();
                        } else {
                            reject("OTA: Unzip failed");
                        }
                    });
                },
                (error) => {
                    reject("OTA: Download failed " + error.source);
                },
                false
            );
        });
    },

    getBootstrapPath() {
        const useOTA = localStorage.getItem("cd_use_ota_path") === "true";
        const isLoggedIn = window.sessionManager && window.sessionManager.isLoggedIn();
        const hasSeenOnboarding = localStorage.getItem('choicedraft_onboarding_seen') === 'true';
        
        let targetPage = "signin.html";
        if (isLoggedIn) {
            targetPage = "home.html";
        } else if (!hasSeenOnboarding) {
            targetPage = "onboarding.html";
        }

        if (useOTA && window.cordova) {
            // Note: GitHub ZIP extraction usually creates a nested folder
            return cordova.file.dataDirectory + OTA_CONFIG.UPDATE_DIR + "/choicedraft-html-main/www/" + targetPage;
        }
        
        return targetPage;
    }
};

window.otaService = otaService;
