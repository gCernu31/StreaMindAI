import { Helmet } from 'react-helmet-async';

const SITE = 'https://streamindai.com';
const OG_IMAGE = `${SITE}/og-image.png`;

export default function SEO({
  title,
  description,
  canonical,
  ogType = 'website',
  noindex = false,
}) {
  const fullTitle = title
    ? `${title} | StreaMindAI`
    : 'StreaMindAI — Il Bot AI per la tua Chat Twitch | Prova Gratis';

  const fullDesc = description ||
    'Crea il tuo bot AI personalizzato per Twitch in pochi minuti. StreaMindAI impara dalla tua community, risponde in chat e cresce con te. Prova gratis 7 giorni.';

  const url = canonical ? `${SITE}${canonical}` : SITE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Preconnect */}
      <link rel="preconnect" href="https://id.twitch.tv" />
      <link rel="preconnect" href="https://api.twitch.tv" />

      {/* Open Graph */}
      <meta property="og:type"        content={ogType} />
      <meta property="og:url"         content={url} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={fullDesc} />
      <meta property="og:image"        content={OG_IMAGE} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale"      content="it_IT" />
      <meta property="og:site_name"   content="StreaMindAI" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={fullDesc} />
      <meta name="twitter:image"       content={OG_IMAGE} />
    </Helmet>
  );
}
