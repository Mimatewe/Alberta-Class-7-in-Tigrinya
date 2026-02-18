import { Capacitor } from '@capacitor/core';
import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';

// Production Interstitial Ad Unit ID
const INTERSTITIAL_ID = 'ca-app-pub-9839295770155523/7999647891';

let isAdLoaded = false;
const isNative = Capacitor.isNativePlatform();

export async function initAdMob() {
    if (!isNative) return;
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
    if (!isNative) return;
    try {
        await AdMob.prepareInterstitial({
            adId: INTERSTITIAL_ID,
            isTesting: false
        });
        isAdLoaded = true;
    } catch (e) {
        console.error('Interstitial preload failed', e);
        isAdLoaded = false;
    }
}

export async function showInterstitial() {
    if (!isNative) return;
    if (!isAdLoaded) {
        preloadInterstitial();
        return;
    }

    try {
        await AdMob.showInterstitial();
        isAdLoaded = false;
        preloadInterstitial();
    } catch (e) {
        console.error('Interstitial show failed', e);
        preloadInterstitial();
    }
}

// Only register listeners on native platforms
if (isNative) {
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
}
