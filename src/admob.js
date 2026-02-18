import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';

// Google Test Interstitial Ad Unit ID
const INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

let isAdLoaded = false;

export async function initAdMob() {
    try {
        await AdMob.initialize({
            requestTrackingAuthorization: true,
        });
        preloadInterstitial();
    } catch (e) {
        console.error('AdMob init failed', e);
    }
}

export async function preloadInterstitial() {
    try {
        await AdMob.prepareInterstitial({
            adId: INTERSTITIAL_ID,
            isTesting: true
        });
        isAdLoaded = true;
    } catch (e) {
        console.error('Interstitial preload failed', e);
        isAdLoaded = false;
    }
}

export async function showInterstitial() {
    if (!isAdLoaded) {
        preloadInterstitial();
        return;
    }

    try {
        await AdMob.showInterstitial();
        isAdLoaded = false; // Reset after show
        preloadInterstitial(); // Preload next
    } catch (e) {
        console.error('Interstitial show failed', e);
        preloadInterstitial();
    }
}

// Listen for dismissed ads to preload next
AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    isAdLoaded = false;
    preloadInterstitial();
});

AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
    isAdLoaded = false;
});

AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
    isAdLoaded = true;
});
