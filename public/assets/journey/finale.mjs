/* Absolute-scroll ending. No timer, scheduler, random state or media ownership. */
const unit=n=>Math.min(1,Math.max(0,Number.isFinite(n)?n:0));
const ease=n=>{const x=unit(n);return x*x*(3-2*x)};
export function finaleState(fraction){
 const p=unit(fraction),collapse=ease((p-.24)/.68);
 return {plateScale:Math.pow(1-collapse,2),plateOpacity:1-ease((p-.86)/.1),pointOpacity:ease((p-.8)/.16),pointSize:3,cornerRadius:collapse*50,hold: p<=.24};
}
