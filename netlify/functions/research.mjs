import { getStore } from "@netlify/blobs";


// Tier configurations: model, token limits, and prompt builders
const TIER_CONFIG = {
  pulse: {
    model: "anthropic/claude-3.5-haiku",
    maxTokens: 3000,
    label: "Pulse",
  },
  starter: {
    model: "anthropic/claude-sonnet-4-20250514",
    maxTokens: 7000,
    label: "Starter",
  },
  professional: {
    model: "anthropic/claude-sonnet-4-20250514",
    maxTokens: 12000,
    label: "Professional",
  },
  strategic: {
    model: "anthropic/claude-sonnet-4-20250514",
    maxTokens: 16000,
    label: "Strategic",
  },
};

const SYSTEM_PROMPT = `You are APERTURE, an elite market intelligence analyst who produces institutional-grade research reports. Your reports rival McKinsey, Gartner, and CB Insights in depth and specificity.

Rules:
- Use REAL companies, REAL data points, and REAL market numbers wherever possible
- When exact data isn't available, provide well-reasoned estimates with clear methodology (e.g., "Estimated at $X.XB based on [reasoning]")
- Be specific: name companies, cite funding rounds, reference actual products, quote real growth rates
- Every claim should have a number attached — market sizes, growth rates, user counts, revenue figures
- Write with conviction. Take positions. Identify the single most important insight.
- Format as clean, structured markdown with clear hierarchy
- Use markdown tables for competitor comparisons and data grids
- Use bold for key numbers and company names
- Use blockquotes for key insights or "bottom line" takeaways`;

function buildPrompt(market, tier) {
  if (tier === "pulse") {
    return `Generate a Pulse market intelligence snapshot for: "${market}"

Structure the report with these exact sections:

## Executive Summary
2-3 sentences. State the market opportunity size, growth trajectory, and the single most important thing someone entering this market needs to know. Be direct and opinionated.

## Market Size
- **TAM** (Total Addressable Market): Global figure with year
- **SAM** (Serviceable Addressable Market): Relevant segment with reasoning
- **Growth Rate**: CAGR with 5-year projection
- One-line note on what's driving the growth

## Top 5 Competitors
Create a markdown table with columns: | Company | Est. Revenue/Funding | Positioning | Key Weakness |
Include 5 real companies. Be specific about their positioning and identify a genuine vulnerability for each.

## Key Trends
3 bullet points. Each trend should name specific companies or data points. Not generic — tie each trend to something measurable happening right now.

## The Single Best Opportunity
One focused paragraph identifying the highest-leverage entry point. Be specific about WHY this gap exists and WHO it serves. Include an estimated addressable segment size.

## Your Next Move
One concrete, actionable first step with a specific 30-day goal.`;
  }

  if (tier === "starter") {
    return `Generate a Starter market intelligence report for: "${market}"

Structure the report with these exact sections:

## Executive Summary
3-4 sentences establishing the market context, size, growth trajectory, and your overall conviction level (High/Medium/Low) on market attractiveness. End with the single most important strategic insight.

## Market Size & Growth
- **TAM** (Total Addressable Market): Global figure with year and source/methodology
- **SAM** (Serviceable Addressable Market): Relevant segment with clear reasoning for scope
- **SOM** (Serviceable Obtainable Market): Realistic capture estimate for a new entrant in years 1-3
- **CAGR**: Growth rate with 5-year projection and key growth drivers
- One paragraph on the trajectory — is this market accelerating, maturing, or plateauing?

## Customer Profile
Describe the ideal customer in detail:
- **Demographics**: Age range, income, role/title, company size (if B2B)
- **Psychographics**: What motivates them, what frustrates them, what they're currently using
- **Buying Behavior**: How they discover solutions, decision timeline, price sensitivity, key triggers
- **Willingness to Pay**: Typical price points and value perception

## Competitive Landscape
Create a markdown table: | Company | Funding/Revenue | Core Positioning | Key Strength | Key Weakness | Threat Level |
Include 5-7 real companies ranked by market position. Below the table, write 2-3 sentences identifying the structural gap — what NONE of these competitors are doing well.

## Top Trends & Market Drivers
5 trends, each as a subsection:
### [Trend Name]
2-3 sentences with specific data. Reference real companies, growth numbers, or behavioral shifts. Tag each as **Macro** or **Micro** trend.

## Primary Opportunity Vector
Identify the single best market entry strategy:
- **The Opportunity**: What gap exists and why
- **Target Segment**: Who specifically to serve first
- **Estimated SAM**: How large is this specific opportunity
- **Why Now**: What's changed that makes this timely
- **Competitive Moat**: What defensibility looks like

## Risk Assessment
Create a markdown table: | Risk | Severity | Likelihood | Mitigation |
Include 3 risks rated as HIGH, MEDIUM, or LOW severity. Each mitigation should be a specific, actionable strategy.

## Revenue Models
Describe 2-3 viable revenue models:
For each: estimated AOV/ACV, gross margin range, and path to first $1M ARR.

## Your Next 3 Moves
Three specific, time-bound action items. Each should include:
1. **[Action]** — [Specific deliverable] — [Timeline: X days/weeks]`;
  }

  if (tier === "professional") {
    return `Generate a Professional market intelligence report for: "${market}"

This is a deep-dive analysis. Be thorough, specific, and data-rich. Structure with these exact sections:

## Executive Summary
4-5 sentences. State market size, growth rate, conviction level (High/Medium/Low), the dominant competitive dynamic, and your #1 strategic recommendation. End with a quotable insight.

> **Bottom Line**: [One sentence that captures the entire opportunity]

## Market Size & Architecture
- **TAM**: Global market with year, source methodology, and 2-year trend
- **SAM**: Your addressable segment with clear scoping rationale
- **SOM**: Realistic year 1-3 capture with assumptions stated
- **CAGR**: Growth rate with 5-year projection graph data points (Year 1-5 values)
- **Growth Drivers**: 3 specific catalysts with data (e.g., "Remote work adoption up 340% since 2020")
- **Market Stage**: Where in the S-curve — emerging, growth, mature, declining — with evidence

## Deep Customer Intelligence

### ICP 1: [Persona Name] (Primary)
- **Profile**: Age, income, role, company size, geography
- **Psychographics**: Values, frustrations, aspirations, daily workflow
- **Current Solution**: What they use today and why it's inadequate
- **Trigger Events**: What causes them to search for a new solution
- **Willingness to Pay**: Price range and value justification
- **Channel**: Where they discover products, who influences them

### ICP 2: [Persona Name] (Secondary)
Same structure as ICP 1.

### ICP 3: [Persona Name] (Emerging)
Same structure as ICP 1.

### Category Behavior Data
Create a table: | Metric | Value | Source/Basis |
Include: trial rate, conversion rate, avg. retention, NPS benchmark, discovery channels, top 3 purchase barriers.

## Competitive Landscape

### Market Map
Create a markdown table: | Company | Funding/Revenue | Employees | Positioning | Key Product | Strength | Weakness | Threat Level |
Include 8-10 real companies. Be specific about funding rounds, employee counts where known.

### Competitive Dynamics
- Who is winning and why (2-3 sentences)
- The structural gap no one is exploiting
- Expected competitive moves in the next 12-18 months
- Potential new entrants from adjacent markets

## Trend Analysis
6 trends, alternating Macro and Micro:

### [Trend 1] `MACRO`
3-4 sentences with specific data points, company examples, and growth metrics. Explain the implication for market entrants.

### [Trend 2] `MICRO`
Same depth. Reference specific products, features, or behavioral data.

(Continue for all 6 trends)

## Three Opportunity Vectors

### Vector 1: [Name] — Estimated SAM: $X
- **The Gap**: What's missing and why
- **Target Segment**: Specific customer profile
- **Entry Strategy**: How to attack this
- **Timeline to Revenue**: Realistic milestones
- **Competitive Moat**: Defensibility analysis

### Vector 2: [Name] — Estimated SAM: $X
Same structure.

### Vector 3: [Name] — Estimated SAM: $X
Same structure.

## Risk Assessment
Create a table: | Risk | Category | Severity | Likelihood | Impact | Mitigation Strategy |
Include 5 risks. Categories: Market, Competitive, Regulatory, Technical, Financial. Each mitigation must be specific and actionable.

## Revenue Architecture
For each of 3-4 revenue models:

### Model: [Name]
| Metric | Value |
|--------|-------|
| AOV/ACV | $X |
| Gross Margin | X% |
| Customer LTV | $X |
| CAC Target | $X |
| Payback Period | X months |
| Path to $1M ARR | [Specific milestones] |

## Go-To-Market Framework

### Phase 1: Foundation (Months 1-6)
- Key activities, channels, and specific targets
- Budget allocation guidance
- Success metrics and milestones

### Phase 2: Scale (Months 6-18)
- Expansion channels and partnerships
- Revenue targets and team needs
- Key inflection points to watch for

### Phase 3: Dominance (Months 18-36)
- Market expansion strategy
- Fundraising alignment
- Moat-building activities

## Investor Narrative
- **Opening Hook**: One sentence that captures investor attention
- **Market Sizing Hook**: The "why this market" argument
- **Why Now**: 3 converging trends
- **Differentiation**: What makes this defensible
- **Business Model**: Unit economics summary
- **Comparable Exits**: 3-4 relevant exits with valuations (real companies)
- **The Ask**: Recommended funding stage and amount with use of proceeds

## Your Next 3 Moves
Three specific, high-leverage action items:
1. **[Action]** — [Deliverable with specifics] — [Timeline] — [Expected outcome]
2. **[Action]** — [Deliverable with specifics] — [Timeline] — [Expected outcome]
3. **[Action]** — [Deliverable with specifics] — [Timeline] — [Expected outcome]`;
  }

  // Strategic tier
  return `Generate a Strategic market intelligence report for: "${market}"

This is a comprehensive, board-ready intelligence document. Be exhaustive, data-rich, and strategically rigorous. This report should rival a $50K consulting engagement. Structure with these exact sections:

## Executive Summary
5-6 sentences. Cover: market size and trajectory, competitive intensity, regulatory landscape, your conviction level (High/Medium/Low), the #1 opportunity, and the #1 risk. End with a decisive strategic recommendation.

> **Bottom Line**: [One sentence — the single most important insight in this report]

> **Conviction**: [HIGH/MEDIUM/LOW] — [One sentence justification]

## Market Size & Architecture
- **TAM**: Global market with year, source methodology, and 3-year trend line
- **SAM**: Addressable segment with detailed scoping rationale
- **SOM**: Year 1-5 capture projections with assumptions
- **CAGR**: Growth rate with 5-year projection (provide year-by-year estimates)
- **Growth Drivers**: 5 specific catalysts with quantified data
- **Growth Inhibitors**: 3 factors that could slow growth, with probability assessment
- **Market Stage**: S-curve position with evidence and comparable market analogy
- **Market Structure**: Fragmented vs. consolidated, margin profiles, typical deal sizes

## Deep Customer Intelligence

### ICP 1: [Persona Name] (Primary — X% of TAM)
- **Profile**: Demographics, firmographics, geography, psychographics
- **Current Solution Stack**: What they use, what they spend, satisfaction level
- **Pain Points**: Ranked by severity with quantified cost of the problem
- **Trigger Events**: Specific moments that create buying intent
- **Decision Process**: Stakeholders, timeline, evaluation criteria, deal-breakers
- **Willingness to Pay**: Range with anchoring analysis
- **Acquisition Channels**: Top 3 channels ranked by efficiency

### ICP 2: [Persona Name] (Secondary — X% of TAM)
Same depth as ICP 1.

### ICP 3: [Persona Name] (Emerging — X% of TAM)
Same depth as ICP 1.

### Category Behavior Data
| Metric | Value | Benchmark | Source/Basis |
Include: trial-to-paid rate, avg. contract value, renewal rate, NPS, expansion revenue %, time-to-value, top 5 discovery channels, top 5 purchase barriers, switching costs assessment.

## Competitive Landscape

### Market Map
| Rank | Company | Founded | Funding/Revenue | Employees | Positioning | Key Product | Strength | Weakness | Threat Level | Likely Next Move |
Include 10+ real companies. Be specific about funding, employee counts, recent moves.

### Competitive Dynamics Deep Dive
- **Market Leader Analysis**: Who's winning, their strategy, vulnerabilities
- **Challenger Analysis**: Who's gaining ground and how
- **The Structural Gap**: What no incumbent is doing well, with evidence
- **Expected Competitive Moves**: Specific predictions for next 12-24 months
- **Adjacent Market Threats**: Companies in neighboring markets that could enter
- **Acquisition Signals**: Companies likely to be acquired (and by whom)

### Competitive Positioning Matrix
Describe the 2x2 positioning landscape (axes and where each player sits).

## Trend Analysis
8+ trends with alternating Macro and Micro tags:

### [Trend 1] `MACRO`
4-5 sentences. Specific data, named companies, growth metrics, and direct implication for strategy. Reference specific reports, studies, or data sources where possible.

(Continue for all 8+ trends, each with this depth)

## Three Opportunity Vectors

### Vector 1: [Name] — Estimated SAM: $X — Timeline: X months to revenue
- **The Gap**: Detailed analysis of what's missing and why incumbents haven't solved it
- **Target Segment**: Specific ICP with estimated segment size
- **Value Proposition**: The "10x better" argument
- **Entry Strategy**: Specific GTM approach with channel strategy
- **Unit Economics**: Projected AOV, margins, LTV, CAC
- **Competitive Response**: How incumbents will likely react and your counter-strategy
- **Moat Timeline**: When defensibility kicks in and what form it takes

### Vector 2 and 3: Same depth.

## Risk Assessment
| # | Risk | Category | Severity | Likelihood | Time Horizon | Impact ($) | Mitigation | Contingency |
Include 7+ risks across categories: Market, Competitive, Regulatory, Technical, Financial, Operational, Reputational.

## Revenue Architecture

### Model 1: [Name]
| Metric | Conservative | Base | Aggressive |
|--------|-------------|------|------------|
| AOV/ACV | | | |
| Gross Margin | | | |
| Customer LTV | | | |
| CAC | | | |
| LTV:CAC Ratio | | | |
| Payback Period | | | |
| Year 1 Revenue | | | |
| Year 3 Revenue | | | |

(Include 4 revenue models with this depth)

## Go-To-Market Framework

### Phase 1: Validate (Days 1-90)
- Week-by-week activity plan
- Specific channels and tactics with budget ranges
- Milestones and kill criteria
- Target metrics: [specific KPIs with numbers]

### Phase 2: Build (Months 4-12)
- Team hiring plan and key roles
- Channel scaling strategy with unit economics targets
- Partnership and distribution strategy
- Revenue targets by month

### Phase 3: Scale (Months 12-24)
- Expansion strategy (new segments, geographies, products)
- Fundraising timeline and milestones
- Competitive positioning evolution
- Key inflection points and decision gates

### Phase 4: Dominate (Months 24-36)
- Market leadership strategy
- M&A considerations (buy-side and sell-side)
- International expansion framework
- Platform/ecosystem strategy

## Adjacent Market Opportunities
Identify 3-4 adjacent markets with:
- Market size and growth rate
- Synergy with core business
- Entry complexity (Low/Medium/High)
- Recommended timing

## Regulatory & Compliance Landscape
- Current regulatory framework
- Upcoming regulatory changes with timeline
- Compliance requirements and estimated costs
- Regulatory risk assessment by geography
- Recommended compliance strategy

## Supply Chain & Operations Analysis
- Key operational requirements and infrastructure
- Vendor/supplier landscape
- Cost structure analysis (fixed vs. variable)
- Scaling bottlenecks and solutions
- Operational benchmarks from comparable companies

## M&A Landscape
- Recent M&A activity (last 24 months) with deal values
- Potential acquirers and strategic rationale
- Comparable transaction multiples
- Estimated valuation range at different stages
- Build vs. buy vs. partner analysis for key capabilities

## Scenario Analysis

### Bull Case (25% probability)
- Key assumptions and catalysts
- Revenue trajectory: Year 1-5 projections
- Comparable: [Real company that achieved this]

### Base Case (50% probability)
- Key assumptions
- Revenue trajectory: Year 1-5 projections
- Comparable: [Real company trajectory]

### Bear Case (25% probability)
- Key assumptions and risk triggers
- Revenue trajectory: Year 1-5 projections
- Pivot options if this scenario materializes

## Investor Narrative
- **The Hook**: One sentence that makes investors lean in
- **The Problem**: Quantified pain point ($X wasted annually)
- **The Market**: Size, growth, and "why this market" argument
- **Why Now**: 3-5 converging forces creating the window
- **The Solution**: Core value proposition and differentiation
- **Business Model**: Unit economics summary with path to profitability
- **Traction Milestones**: What to achieve before each funding round
- **Comparable Exits**: 5+ real exits with valuations, multiples, and acquirers
- **The Ask**: Seed/Series A recommendation with use of proceeds breakdown
- **Return Thesis**: How investors make 10x+ return

## Financial Model Assumptions
| Assumption | Conservative | Base | Aggressive | Basis |
Include: market penetration rates, pricing, churn, expansion revenue, gross margin, operating expenses, headcount, and burn rate projections.

## 90-Day Action Plan

### Week 1-2: Research & Validate
Specific daily/weekly activities with deliverables

### Week 3-4: Build Foundation
Specific activities, hires, and infrastructure

### Month 2: Launch & Learn
Go-to-market execution plan with KPIs

### Month 3: Optimize & Scale
Iteration strategy based on Month 2 learnings

### Key Decision Gates
| Week | Decision | Go Criteria | No-Go Criteria | Pivot Option |

## Your Next 3 Moves
Three decisive, high-conviction action items:
1. **[Action]** — [Exact deliverable] — [Timeline] — [Success metric] — [Why this first]
2. **[Action]** — [Exact deliverable] — [Timeline] — [Success metric] — [Dependencies]
3. **[Action]** — [Exact deliverable] — [Timeline] — [Success metric] — [Expected outcome]`;
}

export default async (req, context) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-key", "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST required" }), { status: 405, headers });

  const OPENROUTER_KEY = process.env["OPENROUTER_API_KEY"];
  if (!OPENROUTER_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers });

  try {
    const { market, tier, email, name, purchaseId } = await req.json();
    if (!market) return new Response(JSON.stringify({ error: "market required" }), { status: 400, headers });

    const config = TIER_CONFIG[tier] || TIER_CONFIG.starter;
    const prompt = buildPrompt(market, tier || "starter");

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}`, "HTTP-Referer": "https://aperture-intel.netlify.app" },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: config.maxTokens,
        temperature: 0.7,
      }),
    });

    const aiData = await aiRes.json();
    const report = aiData.choices?.[0]?.message?.content || "";

    // Store report
    const store = getStore("reports");
    const reportId = `report_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    await store.set(reportId, JSON.stringify({ id: reportId, market, tier, report, email, name, purchaseId, created: new Date().toISOString() }));

    // Email report with view link
    const RESEND_KEY = process.env["RESEND_API_KEY"];
    const siteUrl = process.env["URL"] || "https://aperture-intel.netlify.app";
    const viewUrl = `${siteUrl}/report.html?id=${encodeURIComponent(reportId)}`;
    let emailSent = false;
    let emailError = null;

    if (RESEND_KEY && email) {
      const tierLabel = config.label || "Starter";
      const escapedReport = report.replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const fromAddresses = [
        "APERTURE Intelligence <reports@aperturereports.ai>",
        "APERTURE Intelligence <onboarding@resend.dev>",
      ];

      for (const fromAddr of fromAddresses) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: fromAddr,
              to: [email],
              subject: `Your APERTURE ${tierLabel} Report: ${market}`,
              html: `<div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:24px">
                <h2 style="color:#1a1a2e">Your APERTURE Report is Ready</h2>
                <p>Hi ${name || "there"},</p>
                <p>Your <strong>${market}</strong> market intelligence report has been generated.</p>
                <div style="background:#f0f7ff;border:1px solid #c0d8f0;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
                  <p style="margin:0 0 12px;font-size:15px;color:#333"><strong>View your full report online:</strong></p>
                  <a href="${viewUrl}" style="display:inline-block;background:#b8943f;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px">View Report</a>
                  <p style="margin:12px 0 0;font-size:12px;color:#888">Bookmark this link to access your report anytime</p>
                </div>
                <p style="font-size:13px;color:#666;margin-bottom:8px"><strong>Report preview:</strong></p>
                <div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:24px;margin:0 0 24px;white-space:pre-wrap;font-size:13px;line-height:1.6;max-height:600px;overflow:hidden">${escapedReport}</div>
                <p style="text-align:center"><a href="${viewUrl}" style="color:#b8943f;font-weight:600">View full report online &rarr;</a></p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                <p>Want deeper analysis? <a href="${siteUrl}/#pricing" style="color:#b8943f">Upgrade your report tier</a></p>
                <p style="color:#999;font-size:11px">APERTURE Intelligence — AI Market Research in Minutes<br/>
                <a href="${siteUrl}" style="color:#999">${siteUrl.replace("https://","")}</a></p>
              </div>`,
            }),
          });

          const emailData = await emailRes.json();
          if (emailRes.ok && emailData.id) {
            emailSent = true;
            console.log("Email sent successfully via", fromAddr, "id:", emailData.id);
            break;
          } else {
            emailError = emailData.message || emailData.error || JSON.stringify(emailData);
            console.error("Email send failed with", fromAddr, ":", emailError);
          }
        } catch (err) {
          emailError = err.message;
          console.error("Email send error with", fromAddr, ":", err.message);
        }
      }

      if (!emailSent) {
        console.error("All email attempts failed. Last error:", emailError);
      }
    } else {
      console.warn("Email not sent: RESEND_API_KEY", RESEND_KEY ? "present" : "missing", "| email:", email || "missing");
    }

    return new Response(JSON.stringify({ reportId, market, tier, generated: true, viewUrl, emailSent, emailError: emailSent ? null : emailError }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};

export const config = { path: "/api/research" };
