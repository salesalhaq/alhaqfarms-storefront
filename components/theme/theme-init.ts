/**
 * Runs before first paint so the saved mode, glass theme and effects level are
 * already on <html> when the page renders. Without this the visitor sees a
 * flash of the default theme. Keep it dependency-free and synchronous.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var d=document.documentElement;
var glass=localStorage.getItem('sf:glass')||'garnet';
var effects=localStorage.getItem('sf:effects')||'auto';
var themes=['garnet','emerald','ocean','midnight','sunset'];
if(themes.indexOf(glass)===-1){glass='garnet';}
d.setAttribute('data-mode','dark');
d.setAttribute('data-glass',glass);
var low=false;
if(effects==='low'){low=true;}
else if(effects==='auto'){
  var n=navigator;
  var conn=n.connection||{};
  var mem=n.deviceMemory;
  var cores=n.hardwareConcurrency;
  if(conn.saveData===true){low=true;}
  else if(conn.effectiveType&&/^(slow-2g|2g|3g)$/.test(conn.effectiveType)){low=true;}
  else if(typeof mem==='number'&&mem>0&&mem<=2){low=true;}
  else if(typeof cores==='number'&&cores>0&&cores<=2){low=true;}
  else if(window.matchMedia('(prefers-reduced-motion: reduce)').matches&&window.matchMedia('(prefers-reduced-transparency: reduce)').matches){low=true;}
}
if(low){d.setAttribute('data-effects','low');}
}catch(e){}})();`;
