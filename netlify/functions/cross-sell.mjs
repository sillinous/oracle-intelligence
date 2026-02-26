// APERTURE Cross-Sell Engine
// Netlify Function: /api/cross-sell
//
// After an APERTURE purchase, recommends relevant ecosystem platforms
// based on the report topic/industry. Integrates with existing
// email-sequences and upsell-send crons.

export default async function handler(req, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response('OK', { headers });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });

  try {
    const { email, reportTopic, industry, tier } = await req.json();

    // Industry → Platform mapping
    const ECOSYSTEM_RECOMMENDATIONS = {
      'saas': [
        { platform: 'Grant Platform', url: 'https://unless-fortuna-grants.netlify.app?ref=aperture', reason: 'Find SBIR/STTR grants for your SaaS innovation', priority: 1 },
        { platform: 'ATLAS', url: 'https://unless-atlas-platform.netlify.app', reason: 'Model your SaaS financial projections', priority: 2 },
        { platform: 'CLEAR', url: 'https://clear-platform.netlify.app', reason: 'Ongoing competitive intelligence', priority: 3 },
      ],
      'healthtech': [
        { platform: 'BioVentures', url: 'https://bioventures-platform.netlify.app', reason: 'Deep life sciences intelligence', priority: 1 },
        { platform: 'Grant Platform', url: 'https://unless-fortuna-grants.netlify.app?ref=aperture', reason: 'NIH and healthcare grants', priority: 2 },
        { platform: 'CLEAR', url: 'https://clear-platform.netlify.app', reason: 'Regulatory landscape monitoring', priority: 3 },
      ],
      'fintech': [
        { platform: 'ATLAS', url: 'https://unless-atlas-platform.netlify.app', reason: 'Financial modeling and projections', priority: 1 },
        { platform: 'CLEAR', url: 'https://clear-platform.netlify.app', reason: 'Regulatory and compliance analysis', priority: 2 },
        { platform: 'Grant Platform', url: 'https://unless-fortuna-grants.netlify.app?ref=aperture', reason: 'FinTech innovation grants', priority: 3 },
      ],
      'cleantech': [
        { platform: 'Grant Platform', url: 'https://unless-fortuna-grants.netlify.app?ref=aperture', reason: 'DOE and EPA clean energy grants', priority: 1 },
        { platform: 'P-Wave', url: 'https://pwave-silver-battery.netlify.app', reason: 'Energy storage technology intelligence', priority: 2 },
        { platform: 'ATLAS', url: 'https://unless-atlas-platform.netlify.app', reason: 'Clean energy financial modeling', priority: 3 },
      ],
      'cpg': [
        { platform: 'CLEAR', url: 'https://clear-platform.netlify.app', reason: 'Consumer trend analysis', priority: 1 },
        { platform: 'ATLAS', url: 'https://unless-atlas-platform.netlify.app', reason: 'CPG unit economics modeling', priority: 2 },
        { platform: 'Grant Platform', url: 'https://unless-fortuna-grants.netlify.app?ref=aperture', reason: 'Small business grants', priority: 3 },
      ],
      'default': [
        { platform: 'Grant Platform', url: 'https://unless-fortuna-grants.netlify.app?ref=aperture', reason: 'Find grants in your industry', priority: 1 },
        { platform: 'CLEAR', url: 'https://clear-platform.netlify.app', reason: 'Ongoing AI intelligence', priority: 2 },
        { platform: 'ATLAS', url: 'https://unless-atlas-platform.netlify.app', reason: 'Financial modeling tools', priority: 3 },
      ],
    };

    const normalizedIndustry = (industry || '').toLowerCase().replace(/[^a-z]/g, '');
    const recommendations = ECOSYSTEM_RECOMMENDATIONS[normalizedIndustry] || ECOSYSTEM_RECOMMENDATIONS['default'];

    // If email provided, queue cross-sell email via Resend
    if (email && process.env['RESEND_API_KEY']) {
      const topRec = recommendations[0];
      
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env['RESEND_API_KEY']}`,
        },
        body: JSON.stringify({
          from: process.env['ADMIN_EMAIL'] || 'hello@aperturereports.ai',
          to: email,
          subject: `Your ${reportTopic || 'market'} research is ready — here's what to do next`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
              <h2 style="color:#F59E0B">Your APERTURE Report is Ready</h2>
              <p>Thanks for your purchase! Based on your ${industry || 'market'} research, we think you'd also benefit from:</p>
              
              ${recommendations.map((r, i) => `
                <div style="padding:16px;background:${i === 0 ? '#FEF3C7' : '#F9FAFB'};border-radius:8px;margin:12px 0">
                  <strong>${r.platform}</strong><br>
                  <span style="color:#6B7280">${r.reason}</span><br>
                  <a href="${r.url}?ref=aperture-crosssell&industry=${encodeURIComponent(industry || '')}" 
                     style="display:inline-block;margin-top:8px;padding:8px 16px;background:#F59E0B;color:#1a1a2e;border-radius:6px;text-decoration:none;font-weight:600">
                    Explore ${r.platform} →
                  </a>
                </div>
              `).join('')}
              
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0">
              <p style="font-size:12px;color:#9CA3AF">
                UNLESS Ecosystem — AI-powered intelligence platforms<br>
                <a href="https://unless-command-center.netlify.app">View all platforms</a>
              </p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({
      recommendations,
      industry: normalizedIndustry || 'default',
      ecosystemUrl: 'https://unless-command-center.netlify.app',
    }), { headers });

  } catch (error) {
    console.error('Cross-sell error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

export const config = { path: '/api/cross-sell' };
