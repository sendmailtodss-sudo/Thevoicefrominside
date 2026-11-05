import {handleAnalytics} from './analytics.js';
import {handleCommunity} from './community.js';
import {communityPage} from './community-page.js';
import {handleWorkshopCommunity} from './workshop-community.js';
import {handleLegalFund} from './legal-fund.js';
import {handleMerchandise} from './merchandise.js';
import {handleCounselBallot} from './counsel-ballot.js';
import {handleWitnessLedger} from './witness-ledger.js';
import {handleCreativeCatalog} from './creative-catalog.js';
import {handleOriginalSales} from './original-sales.js';
import {handleScheduledRetention} from './retention-coordinator.js';
import {handleStudyIntake} from './study-intake.js';

export default {
  scheduled: handleScheduledRetention,
  async fetch(request, env, ctx) {
    const studyIntake = await handleStudyIntake(request, env);
    if (studyIntake) return studyIntake;
    const witness = await handleWitnessLedger(request, env);
    if (witness) return witness;
    const creative = await handleCreativeCatalog(request, env);
    if (creative) return creative;
    const counselBallot = await handleCounselBallot(request, env);
    if (counselBallot) return counselBallot;
    const originalSales = await handleOriginalSales(request, env);
    if (originalSales) return originalSales;
    const merchandise = await handleMerchandise(request, env);
    if (merchandise) return merchandise;
    const legalFund = await handleLegalFund(request, env);
    if (legalFund) return legalFund;
    const workshop = await handleWorkshopCommunity(request, env);
    if (workshop) return workshop;
    const community = await handleCommunity(request, env);
    if (community) return community;
    const detail = await communityPage(request, env);
    if (detail) return detail;
    const result = await handleAnalytics(request, env);
    if (result) return result;
    const url = new URL(request.url);
    if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    // Sites provides the static-assets binding from the deployment manifest.
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    if(url.pathname.startsWith('/nedlastinger/')) headers.set('Content-Disposition','attachment; filename="'+url.pathname.split('/').pop().replace(/[^a-zA-Z0-9_.-]/g,'')+'"');
    return new Response(asset.body,{status:asset.status,headers});
  }
};
