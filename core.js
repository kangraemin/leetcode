export const LABELS={solo:'혼자 풀었음',hint:'힌트 받음',solution:'해설 보고 이해',retry:'아직 못 풀었음'};
export const emptyState=()=>({version:1,goal:1,records:{}});
export function today(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function addDays(day,n){return new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
export const completed=r=>r && r.status!=='retry';
export function recordAttempt(state,id,status,note,day=today()){
 if(!Object.hasOwn(LABELS,status)) throw Error('알 수 없는 풀이 상태');
 const prev=state.records[id];
 const interval=status==='retry'?1:status==='solution'?3:status==='hint'?3:prev?.status==='solo'?Math.min((prev.interval||7)*2,60):7;
 return {...state,records:{...state.records,[id]:{status,note:note.slice(0,2000),date:day,due:addDays(day,interval),interval,firstCompleted:prev?.firstCompleted||(status!=='retry'?day:null),attempts:[...(prev?.attempts||[]),{date:day,status}]}}};
}
export function schedule(problems,state,day=today()){
 const doneToday=problems.filter(p=>state.records[p.id]?.date===day);
 const freshToday=problems.filter(p=>state.records[p.id]?.firstCompleted===day).length;
 const continuing=problems.filter(p=>state.records[p.id]?.status==='retry');
 // Hard problems are a separate deep-study queue, after the Easy/Medium foundation.
 const available=problems.filter(p=>!state.records[p.id]&&p.difficulty!=='Hard');
 const next=available.length?available:problems.filter(p=>!state.records[p.id]);
 const remaining=Math.max(0,state.goal-freshToday);
 const fresh=[...continuing,...next].slice(0,remaining);
 const review=problems.filter(p=>completed(state.records[p.id])&&state.records[p.id].due<=day&&state.records[p.id].date!==day).sort((a,b)=>state.records[a.id].due.localeCompare(state.records[b.id].due)).slice(0,2);
 return {fresh,review,doneToday,freshToday};
}
export function validateState(value,problems){
 if(!value||value.version!==1||![1,2].includes(value.goal)||!value.records||typeof value.records!=='object'||Array.isArray(value.records))throw Error('지원하지 않는 백업 형식이에요.');
 const ids=new Set(problems.map(p=>String(p.id)));const records={};
 const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(Date.parse(x))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
 for(const [id,r] of Object.entries(value.records)){
  if(!ids.has(id)||!r||!Object.hasOwn(LABELS,r.status)||typeof r.note!=='string'||r.note.length>2000||!date(r.date)||!date(r.due)||!Number.isInteger(r.interval)||r.interval<1||r.interval>60||!(r.firstCompleted===null||date(r.firstCompleted))||!Array.isArray(r.attempts)||r.attempts.length>10000||!r.attempts.every(a=>a&&date(a.date)&&Object.hasOwn(LABELS,a.status)))throw Error('백업에 올바르지 않은 기록이 있어요. 기존 기록은 유지돼요.');
  records[id]={status:r.status,note:r.note,date:r.date,due:r.due,interval:r.interval,firstCompleted:r.firstCompleted,attempts:r.attempts.map(a=>({date:a.date,status:a.status}))};
 }
 return {version:1,goal:value.goal,records};
}
