import { createContext, useContext, useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../firebase/firebase";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        branding: {
            brandName: "DhakaEcommerce",
            logoUrl: "",
            faviconUrl: ""
        },
        theme: {
            primaryColor: "#006A4E",
            secondaryColor: "#F42A41",
            accentColor: "#FFD700",
            darkMode: false
        },
        seo: {
            defaultTitle: "DhakaEcommerce",
            defaultDescription: "Buy products online in Bangladesh",
            defaultKeywords: "dhaka ecommerce, online shopping"
        },
        features: {
            wallet: true,
            coupon: true,
            flashSale: true
        }
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const settingsRef = ref(db, "settings");
        const unsub = onValue(settingsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Merge with defaults to ensure all fields exist
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    branding: { ...prev.branding, ...data.branding },
                    theme: { ...prev.theme, ...data.theme },
                    seo: { ...prev.seo, ...data.seo },
                    features: { ...prev.features, ...data.features }
                }));
            }
            setLoading(false);
        });

        return () => unsub();
    }, []);

    // Update CSS variables when settings change
    useEffect(() => {
        const root = document.documentElement;
        if (settings.theme) {
            root.style.setProperty("--primary-color", settings.theme.primaryColor);
            root.style.setProperty("--secondary-color", settings.theme.secondaryColor);
            root.style.setProperty("--accent-color", settings.theme.accentColor);

            // Handle dark mode if implemented in future
            if (settings.theme.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [settings.theme]);

    const updateSettings = async (newSettings) => {
        try {
            await set(ref(db, "settings"), newSettings);
            return { success: true };
        } catch (error) {
            console.error("Failed to update settings:", error);
            return { success: false, error };
        }
    };

    const resetSettings = async () => {
        const defaults = {
            branding: {
                brandName: "DhakaEcommerce",
                logoUrl: "",
                faviconUrl: ""
            },
            theme: {
                primaryColor: "#006A4E",
                secondaryColor: "#F42A41",
                accentColor: "#FFD700",
                darkMode: false
            },
            seo: {
                defaultTitle: "DhakaEcommerce",
                defaultDescription: "Buy products online in Bangladesh",
                defaultKeywords: "dhaka ecommerce, online shopping"
            },
            features: {
                wallet: true,
                coupon: true,
                flashSale: true
            }
        };
        return updateSettings(defaults);
    };

    const value = {
        settings,
        loading,
        updateSettings,
        resetSettings
    };

    return (
        <SettingsContext.Provider value={value}>
            {!loading && children}
        </SettingsContext.Provider>
    );
};
