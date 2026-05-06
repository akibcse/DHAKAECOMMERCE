import { useState, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";
import { toast } from "react-hot-toast";

const Settings = () => {
    const { settings, updateSettings, resetSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings);
    const [activeTab, setActiveTab] = useState("branding");
    const [saving, setSaving] = useState(false);

    // Sync local state when settings load
    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
        }
    }, [settings]);

    const handleChange = (section, field, value) => {
        setLocalSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        const result = await updateSettings(localSettings);
        setSaving(false);
        if (result.success) {
            toast.success("Settings updated successfully!");
        } else {
            toast.error("Failed to update settings.");
        }
    };

    const handleReset = async () => {
        if (window.confirm("Are you sure you want to reset all settings to default?")) {
            setSaving(true);
            const result = await resetSettings();
            setSaving(false);
            if (result.success) {
                toast.success("Settings reset to defaults!");
            } else {
                toast.error("Failed to reset settings.");
            }
        }
    };

    const tabs = [
        { id: "branding", label: "Branding" },
        { id: "theme", label: "Theme & Colors" },
        { id: "seo", label: "SEO Settings" },
        { id: "social", label: "📣 Social Sharing" },
        { id: "features", label: "Feature Toggles" }
    ];

    if (!localSettings) return <div>Loading settings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">God Mode Settings</h1>
                <div className="space-x-3">
                    <button
                        onClick={handleReset}
                        disabled={saving}
                        className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                        Reset Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:brightness-90 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? "border-b-2 border-primary text-primary"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                {/* Branding Section */}
                {activeTab === "branding" && (
                    <div className="space-y-4 max-w-2xl">
                        <h2 className="text-lg font-semibold mb-4">Branding Identity</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                            <input
                                type="text"
                                value={localSettings.branding.brandName}
                                onChange={(e) => handleChange("branding", "brandName", e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                            <input
                                type="text"
                                value={localSettings.branding.logoUrl}
                                onChange={(e) => handleChange("branding", "logoUrl", e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
                            <input
                                type="text"
                                value={localSettings.branding.faviconUrl}
                                onChange={(e) => handleChange("branding", "faviconUrl", e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                )}

                {/* Theme Section */}
                {activeTab === "theme" && (
                    <div className="space-y-4 max-w-2xl">
                        <h2 className="text-lg font-semibold mb-4">Color Palette</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={localSettings.theme.primaryColor}
                                        onChange={(e) => handleChange("theme", "primaryColor", e.target.value)}
                                        className="h-10 w-20 p-1 rounded border cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={localSettings.theme.primaryColor}
                                        onChange={(e) => handleChange("theme", "primaryColor", e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={localSettings.theme.secondaryColor}
                                        onChange={(e) => handleChange("theme", "secondaryColor", e.target.value)}
                                        className="h-10 w-20 p-1 rounded border cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={localSettings.theme.secondaryColor}
                                        onChange={(e) => handleChange("theme", "secondaryColor", e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={localSettings.theme.accentColor}
                                        onChange={(e) => handleChange("theme", "accentColor", e.target.value)}
                                        className="h-10 w-20 p-1 rounded border cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={localSettings.theme.accentColor}
                                        onChange={(e) => handleChange("theme", "accentColor", e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SEO Section */}
                {activeTab === "seo" && (
                    <div className="space-y-4 max-w-2xl">
                        <h2 className="text-lg font-semibold mb-4">Global SEO Defaults</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default Title</label>
                            <input
                                type="text"
                                value={localSettings.seo.defaultTitle}
                                onChange={(e) => handleChange("seo", "defaultTitle", e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default Description</label>
                            <textarea
                                value={localSettings.seo.defaultDescription}
                                onChange={(e) => handleChange("seo", "defaultDescription", e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg h-24 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default Keywords</label>
                            <input
                                type="text"
                                value={localSettings.seo.defaultKeywords}
                                onChange={(e) => handleChange("seo", "defaultKeywords", e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="comma, separated, keywords"
                            />
                        </div>
                    </div>
                )}

                {/* Social Sharing Section */}
                {activeTab === "social" && (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-lg font-semibold mb-1">Social Sharing Defaults</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            These values are used as fallbacks when a product has no custom social metadata.
                            Individual product SEO fields (title, description, share image) always take priority.
                        </p>

                        {/* Default Share Image */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default OG / Share Image URL
                            </label>
                            <input
                                type="text"
                                value={localSettings.seo?.defaultShareImage || ""}
                                onChange={(e) => handleChange("seo", "defaultShareImage", e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="https://yourdomain.com/og-default.jpg"
                            />
                            <p className="text-xs text-gray-400 mt-1">Recommended size: 1200 × 630 px. Must be a publicly accessible URL.</p>
                        </div>

                        {/* Preview */}
                        {localSettings.seo?.defaultShareImage && (
                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                <p className="text-xs font-semibold text-gray-500 px-3 py-2 bg-gray-50 border-b">Preview</p>
                                <img
                                    src={localSettings.seo.defaultShareImage}
                                    alt="OG Preview"
                                    className="w-full object-cover max-h-48"
                                    onError={(e) => { e.target.style.display = "none"; }}
                                />
                            </div>
                        )}

                        {/* Per-product instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm font-semibold text-blue-800 mb-2">💡 Per-Product SEO Override</p>
                            <p className="text-xs text-blue-700">
                                To set custom social metadata for a specific product, add a <code className="bg-blue-100 px-1 rounded">seo</code> field
                                to the product in Firebase with these keys:
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-blue-700 list-disc ml-4">
                                <li><code className="bg-blue-100 px-1 rounded">seo.title</code> — overrides OG title</li>
                                <li><code className="bg-blue-100 px-1 rounded">seo.description</code> — overrides OG description</li>
                                <li><code className="bg-blue-100 px-1 rounded">seo.shareImage</code> — overrides OG image (1200×630)</li>
                                <li><code className="bg-blue-100 px-1 rounded">seo.keywords</code> — product page keywords</li>
                            </ul>
                        </div>

                        {/* Validator links */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <a
                                href="https://developers.facebook.com/tools/debug/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-3 bg-[#1877F2] text-white rounded-xl text-sm font-semibold hover:bg-[#166FE5] transition-colors"
                            >
                                <span>🔵</span> Facebook OG Debugger
                            </a>
                            <a
                                href="https://cards-dev.twitter.com/validator"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-3 bg-[#0F1419] text-white rounded-xl text-sm font-semibold hover:bg-[#272D33] transition-colors"
                            >
                                <span>🐦</span> Twitter Card Validator
                            </a>
                        </div>
                    </div>
                )}

                {/* Features Section */}
                {activeTab === "features" && (
                    <div className="space-y-4 max-w-2xl">
                        <h2 className="text-lg font-semibold mb-4">Feature Management</h2>
                        <div className="space-y-3">
                            {Object.keys(localSettings.features).map(feature => (
                                <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
                                    <span className="font-medium capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.features[feature]}
                                            onChange={(e) => handleChange("features", feature, e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
