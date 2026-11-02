/**
 * Runs before first paint so the saved mode, glass theme and effects level are
 * already on <html> when the page renders. Without this the visitor sees a
 * flash of the default theme. Keep it dependency-free and synchronous.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var d=document.documentElement;
var glass=localStorage.getItem('sf:glass')||'palette-14-last';
var effects=localStorage.getItem('sf:effects')||'full';
var themes=['palette-13-first','palette-13-last','palette-14-last','palette-15-first','palette-15-second','palette-16-first','palette-16-last'];
if(themes.indexOf(glass)===-1){glass='palette-14-last';}
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
