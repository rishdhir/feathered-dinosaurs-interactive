export const SOURCE_OFFSET=1004/30;
export const DURATION=16996/30;
export function cueAt(cues,sourceTime){let i=cues.findIndex(c=>sourceTime>=c.start&&sourceTime<c.end);if(i<0)i=sourceTime<cues[0].start?0:cues.length-1;return {cue:cues[i],previous:cues[Math.max(0,i-1)],index:i};}
export function interactionWeight(idleSeconds){return idleSeconds<=.35?1:Math.exp(-(idleSeconds-.35)/1.05);}
export function modeFor(weight){return weight>.6?'INTERACTING':weight>.025?'RETURNING TO STORY':'FOLLOWING THE STORY';}
export function formatTime(t){const n=Math.max(0,Math.round(t));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
