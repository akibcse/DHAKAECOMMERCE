import { Helmet } from "react-helmet-async";
import { useSettings } from "../../context/SettingsContext";

const GlobalSEO = () => {
    const { settings } = useSettings();

    // Fallback if settings aren't loaded yet (though provider handles loading state)
    if (!settings) return null;

    return (
        <Helmet>
            <title>{settings.seo.defaultTitle}</title>
            <meta name="description" content={settings.seo.defaultDescription} />
            <meta name="keywords" content={settings.seo.defaultKeywords} />
        </Helmet>
    );
};

export default GlobalSEO;
